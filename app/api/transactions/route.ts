import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSession } from '@/lib/session';
import ExcelJS from 'exceljs';

export const dynamic = 'force-dynamic';

async function sendTelegramBackup() {
  try {
    // Get Telegram config
    const { rows: settingsRows } = await db.query(
      "SELECT key, value FROM settings WHERE key IN ('bot_token', 'chat_id', 'telegram_chat_id')"
    );
    const settingsMap: Record<string, string> = {};
    for (const row of settingsRows) {
      settingsMap[row.key] = row.value;
    }

    const botToken = settingsMap['bot_token'];
    const chatId = settingsMap['chat_id'] || settingsMap['telegram_chat_id'] || '584847845';

    if (!botToken || !chatId) return;

    // Fetch all transactions
    const { rows: transactions } = await db.query(
      'SELECT * FROM transactions ORDER BY trans_date ASC, created_at ASC'
    );

    // Generate Excel
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Kas RT';
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
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } };

    let totalMasuk = 0;
    let totalKeluar = 0;

    for (const t of transactions) {
      const isIncome = t.type === 'pemasukan';
      const amount = Number(t.amount);
      if (isIncome) totalMasuk += amount;
      else totalKeluar += amount;

      const row = sheet.addRow({
        id: t.id,
        tanggal: t.trans_date,
        tipe: isIncome ? 'Pemasukan' : 'Pengeluaran',
        kas_type: t.kas_type === 'koperasi' ? 'Koperasi' : 'Biasa',
        jumlah: amount,
        keterangan: t.description,
      });
      row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: isIncome ? 'FFE2EFDA' : 'FFFCE4EC' } };
      row.getCell('jumlah').numFmt = '#,##0';
    }

    // Summary
    const summary = [
      { label: 'Total Pemasukan', value: totalMasuk, color: 'FFE2EFDA' },
      { label: 'Total Pengeluaran', value: totalKeluar, color: 'FFFCE4EC' },
      { label: 'Saldo', value: totalMasuk - totalKeluar, color: 'FFDCE6F1' },
    ];
    for (const s of summary) {
      const row = sheet.addRow({ id: null, tanggal: null, tipe: null, kas_type: s.label, jumlah: s.value, keterangan: '' });
      row.font = { bold: true };
      row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: s.color } };
      row.getCell('jumlah').numFmt = '#,##0';
    }

    const buffer = await workbook.xlsx.writeBuffer();
    const dateStr = new Date().toISOString().split('T')[0];
    const fileName = `backup-kas-${dateStr}.xlsx`;

    const formData = new FormData();
    formData.append('chat_id', chatId);
    formData.append('caption', `📦 Backup Kas - ${dateStr} (${transactions.length} transaksi)`);
    formData.append('document', new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), fileName);

    await fetch(`https://api.telegram.org/bot${botToken}/sendDocument`, { method: 'POST', body: formData });
  } catch (err) {
    console.error('Auto backup error:', err);
  }
}

// GET - public paginated transactions
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '10')));
  const offset = (page - 1) * limit;

  const countRes = await db.query('SELECT COUNT(*) as total FROM transactions');
  const total = parseInt(countRes.rows[0].total);

  const { rows } = await db.query(
    'SELECT * FROM transactions ORDER BY trans_date DESC, created_at DESC LIMIT $1 OFFSET $2',
    [limit, offset]
  );

  return NextResponse.json({
    transactions: rows,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
}

// POST - create transaction
export async function POST(request: Request) {
  const session = await getSession();
  if (!session.isLoggedIn) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { type, kas_type, amount, description, trans_date } = await request.json();

  if (!type || !amount || !description || !trans_date) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  const kasType = kas_type || 'biasa';

  await db.query(
    'INSERT INTO transactions (type, kas_type, amount, description, trans_date) VALUES ($1, $2, $3, $4, $5)',
    [type, kasType, amount, description, trans_date]
  );

  // Auto backup to Telegram (fire and forget)
  sendTelegramBackup();

  return NextResponse.json({ success: true });
}

// PUT - update transaction
export async function PUT(request: Request) {
  const session = await getSession();
  if (!session.isLoggedIn) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id, type, kas_type, amount, description, trans_date } = await request.json();

  if (!id || !type || !amount || !description || !trans_date) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  const kasType = kas_type || 'biasa';

  await db.query(
    'UPDATE transactions SET type=$1, kas_type=$2, amount=$3, description=$4, trans_date=$5 WHERE id=$6',
    [type, kasType, amount, description, trans_date, id]
  );

  // Auto backup to Telegram
  sendTelegramBackup();

  return NextResponse.json({ success: true });
}

// DELETE - delete transaction
export async function DELETE(request: Request) {
  const session = await getSession();
  if (!session.isLoggedIn) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  }

  await db.query('DELETE FROM transactions WHERE id=$1', [parseInt(id)]);

  // Auto backup to Telegram
  sendTelegramBackup();

  return NextResponse.json({ success: true });
}
