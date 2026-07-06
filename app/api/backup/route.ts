import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSession } from '@/lib/session';
import { initDatabase } from '@/lib/db-init';
import ExcelJS from 'exceljs';

export const dynamic = 'force-dynamic';

export async function POST() {
  const session = await getSession();
  if (!session.isLoggedIn) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await initDatabase();

    // Fetch all transactions ordered by date
    const { rows: transactions } = await db.query(
      'SELECT * FROM transactions ORDER BY trans_date ASC, created_at ASC'
    );

    // Create Excel workbook
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Kas App';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Data Kas');

    // Define columns
    sheet.columns = [
      { header: 'ID', key: 'id', width: 8 },
      { header: 'Tanggal', key: 'tanggal', width: 15 },
      { header: 'Tipe', key: 'tipe', width: 15 },
      { header: 'Kas Type', key: 'kas_type', width: 15 },
      { header: 'Jumlah (Rp)', key: 'jumlah', width: 18 },
      { header: 'Keterangan', key: 'keterangan', width: 35 },
    ];

    // Style header row
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

    // Add data rows
    for (const t of transactions) {
      const isIncome = t.type === 'pemasukan';
      const amount = Number(t.amount);
      if (isIncome) {
        totalPemasukan += amount;
      } else {
        totalPengeluaran += amount;
      }

      const row = sheet.addRow({
        id: t.id,
        tanggal: t.trans_date,
        tipe: isIncome ? 'Pemasukan' : 'Pengeluaran',
        kas_type: t.kas_type === 'koperasi' ? 'Koperasi' : 'Biasa',
        jumlah: amount,
        keterangan: t.description,
      });

      // Apply row fill color
      if (isIncome) {
        row.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE2EFDA' }, // light green
        };
      } else {
        row.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFCE4EC' }, // light red
        };
      }

      // Format amount column as currency
      row.getCell('jumlah').numFmt = '#,##0';
    }

    // Add summary rows
    const summaryStartRow = sheet.rowCount + 2;

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

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();

    // Get telegram_chat_id from settings
    let chatId = '584847845';
    try {
      const { rows } = await db.query(
        "SELECT value FROM settings WHERE key = 'telegram_chat_id'"
      );
      if (rows.length > 0) {
        chatId = rows[0].value;
      }
    } catch {
      // use default
    }

    // Send to Telegram
    const botToken = '8977580994:AAEBRRN0em6X35XqoyxLxo6jVGuZlvOJxZU';
    const url = `https://api.telegram.org/bot${botToken}/sendDocument`;

    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const fileName = `backup-kas-${dateStr}.xlsx`;

    const formData = new FormData();
    formData.append('chat_id', chatId);
    formData.append('caption', `📦 Backup Kas - ${dateStr}`);
    formData.append(
      'document',
      new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      }),
      fileName
    );

    const tgRes = await fetch(url, { method: 'POST', body: formData });
    if (!tgRes.ok) {
      const errText = await tgRes.text();
      console.error('Telegram API error:', errText);
      return NextResponse.json(
        { error: 'Failed to send to Telegram', details: errText },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, fileName });
  } catch (err: unknown) {
    console.error('Backup error:', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
