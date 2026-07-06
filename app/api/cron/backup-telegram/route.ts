import { NextResponse } from 'next/server';
import db from '@/lib/db';
import ExcelJS from 'exceljs';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  // Verify Bearer token
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    return NextResponse.json(
      { error: 'CRON_SECRET not configured' },
      { status: 500 }
    );
  }

  if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Check cron_settings
    const { rows: cronRows } = await db.query(
      'SELECT * FROM cron_settings ORDER BY id LIMIT 1'
    );

    if (cronRows.length === 0 || !cronRows[0].is_enabled) {
      return NextResponse.json({
        success: true,
        message: 'Auto backup is disabled',
        skipped: true,
      });
    }

    const cron = cronRows[0];
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    // Check if it's time to run
    const isTime =
      currentHour === cron.send_hour &&
      currentMinute >= cron.send_minute &&
      currentMinute < cron.send_minute + 15;

    if (!isTime) {
      return NextResponse.json({
        success: true,
        message: `Not scheduled time. Current: ${currentHour}:${currentMinute}, Scheduled: ${cron.send_hour}:${cron.send_minute}`,
        skipped: true,
      });
    }

    // Check if already ran today
    if (cron.last_run_at) {
      const lastRun = new Date(cron.last_run_at);
      const today = now.toISOString().split('T')[0];
      const lastRunDate = lastRun.toISOString().split('T')[0];

      if (today === lastRunDate) {
        return NextResponse.json({
          success: true,
          message: 'Already ran today',
          skipped: true,
        });
      }
    }

    // Generate Excel backup
    const { rows: transactions } = await db.query(
      'SELECT * FROM transactions ORDER BY trans_date ASC, created_at ASC'
    );

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Kas RT';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Data Kas');
    sheet.columns = [
      { header: 'ID', key: 'id', width: 8 },
      { header: 'Tanggal', key: 'tanggal', width: 15 },
      { header: 'Tipe', key: 'tipe', width: 15 },
      { header: 'Kas Type', key: 'kas_type', width: 15 },
      { header: 'Jumlah (Rp)', key: 'jumlah', width: 18 },
      { header: 'Keterangan', key: 'keterangan', width: 35 },
    ];

    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' },
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

    let totalPemasukan = 0;
    let totalPengeluaran = 0;

    for (const t of transactions) {
      const isIncome = t.type === 'pemasukan';
      const amount = Number(t.amount);
      if (isIncome) totalPemasukan += amount;
      else totalPengeluaran += amount;

      const row = sheet.addRow({
        id: t.id,
        tanggal: t.trans_date,
        tipe: isIncome ? 'Pemasukan' : 'Pengeluaran',
        kas_type: t.kas_type === 'koperasi' ? 'Koperasi' : 'Biasa',
        jumlah: amount,
        keterangan: t.description,
      });

      row.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: isIncome ? 'FFE2EFDA' : 'FFFCE4EC' },
      };
      row.getCell('jumlah').numFmt = '#,##0';
    }

    const summaryData = [
      { label: 'Total Pemasukan', value: totalPemasukan, color: 'FFE2EFDA' },
      { label: 'Total Pengeluaran', value: totalPengeluaran, color: 'FFFCE4EC' },
      { label: 'Saldo', value: totalPemasukan - totalPengeluaran, color: 'FFDCE6F1' },
    ];

    for (const s of summaryData) {
      const row = sheet.addRow({
        id: null,
        tanggal: null,
        tipe: null,
        kas_type: s.label,
        jumlah: s.value,
        keterangan: '',
      });
      row.font = { bold: true };
      row.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: s.color },
      };
      row.getCell('jumlah').numFmt = '#,##0';
    }

    const buffer = await workbook.xlsx.writeBuffer();

    // Get Telegram config
    const { rows: settingsRows } = await db.query(
      "SELECT key, value FROM settings WHERE key IN ('bot_token', 'chat_id', 'telegram_chat_id')"
    );
    const settingsMap: Record<string, string> = {};
    for (const row of settingsRows) {
      settingsMap[row.key] = row.value;
    }

    const botToken = settingsMap['bot_token'];
    const chatId = settingsMap['chat_id'] || settingsMap['telegram_chat_id'];

    if (!botToken || !chatId) {
      return NextResponse.json(
        { error: 'Telegram not configured' },
        { status: 400 }
      );
    }

    // Send to Telegram
    const dateStr = now.toISOString().split('T')[0];
    const fileName = `backup-kas-${dateStr}.xlsx`;
    const formData = new FormData();
    formData.append('chat_id', chatId);
    formData.append('caption', `📦 Backup Kas Otomatis - ${dateStr}`);
    formData.append(
      'document',
      new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      }),
      fileName
    );

    const tgRes = await fetch(
      `https://api.telegram.org/bot${botToken}/sendDocument`,
      { method: 'POST', body: formData }
    );

    if (!tgRes.ok) {
      const errText = await tgRes.text();
      console.error('Telegram API error:', errText);
      return NextResponse.json(
        { error: 'Failed to send to Telegram', details: errText },
        { status: 500 }
      );
    }

    // Update last_run_at
    await db.query(
      'UPDATE cron_settings SET last_run_at = CURRENT_TIMESTAMP WHERE id = $1',
      [cron.id]
    );

    return NextResponse.json({
      success: true,
      message: 'Backup sent to Telegram',
      fileName,
    });
  } catch (err: unknown) {
    console.error('Cron backup error:', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
