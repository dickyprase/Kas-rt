import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import db from '@/lib/db';
import { initDatabase } from '@/lib/db-init';
import AdminClient from './AdminClient';

export const dynamic = 'force-dynamic';

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ page?: string; kas_type?: string }> }) {
  const session = await getSession();
  if (!session.isLoggedIn) redirect('/login');

  await initDatabase();

  const params = await searchParams;
  const page = parseInt(params.page || '1', 10);
  const kasTypeFilter = params.kas_type || '';
  const perPage = 20;
  const offset = (page - 1) * perPage;

  let total: number;
  let transactions: any[];

  // Fetch telegram_chat_id
  let telegramChatId = '584847845';
  try {
    const { rows } = await db.query(
      "SELECT value FROM settings WHERE key = 'telegram_chat_id'"
    );
    if (rows.length > 0) {
      telegramChatId = rows[0].value;
    }
  } catch {
    // use default
  }

  // Fetch stats for the current month
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  
  let totalSaldo = 0;
  let pemasukanBulanIni = 0;
  let pengeluaranBulanIni = 0;
  let countPemasukanBulanIni = 0;
  let countPengeluaranBulanIni = 0;

  try {
    // Total saldo
    const saldoResult = await db.query(
      "SELECT COALESCE(SUM(CASE WHEN type='pemasukan' THEN amount ELSE 0 END), 0) - COALESCE(SUM(CASE WHEN type='pengeluaran' THEN amount ELSE 0 END), 0) as saldo FROM transactions"
    );
    totalSaldo = Number(saldoResult.rows[0].saldo) || 0;

    // Pemasukan bulan ini
    const pemasukanResult = await db.query(
      "SELECT COALESCE(SUM(amount), 0) as total, COUNT(*) as count FROM transactions WHERE type='pemasukan' AND TO_CHAR(trans_date, 'YYYY-MM') = $1",
      [currentMonth]
    );
    pemasukanBulanIni = Number(pemasukanResult.rows[0].total) || 0;
    countPemasukanBulanIni = Number(pemasukanResult.rows[0].count) || 0;

    // Pengeluaran bulan ini
    const pengeluaranResult = await db.query(
      "SELECT COALESCE(SUM(amount), 0) as total, COUNT(*) as count FROM transactions WHERE type='pengeluaran' AND TO_CHAR(trans_date, 'YYYY-MM') = $1",
      [currentMonth]
    );
    pengeluaranBulanIni = Number(pengeluaranResult.rows[0].total) || 0;
    countPengeluaranBulanIni = Number(pengeluaranResult.rows[0].count) || 0;
  } catch (err) {
    console.error('Failed to fetch stats:', err);
  }

  if (kasTypeFilter && (kasTypeFilter === 'biasa' || kasTypeFilter === 'koperasi')) {
    total = (await db.query('SELECT COUNT(*) as count FROM transactions WHERE kas_type=$1', [kasTypeFilter])).rows[0].count;
    const totalPages = Math.ceil(total / perPage);
    transactions = (await db.query(
      'SELECT * FROM transactions WHERE kas_type=$1 ORDER BY trans_date DESC, created_at DESC LIMIT $2 OFFSET $3',
      [kasTypeFilter, perPage, offset]
    )).rows;

    return (
      <AdminClient
        transactions={transactions}
        page={page}
        totalPages={totalPages}
        total={total}
        username={session.username || ''}
        kasTypeFilter={kasTypeFilter}
        telegramChatId={telegramChatId}
        stats={{
          totalSaldo,
          pemasukanBulanIni,
          pengeluaranBulanIni,
          countPemasukanBulanIni,
          countPengeluaranBulanIni,
        }}
      />
    );
  }

  total = (await db.query('SELECT COUNT(*) as count FROM transactions')).rows[0].count;
  const totalPages = Math.ceil(total / perPage);
  transactions = (await db.query(
    'SELECT * FROM transactions ORDER BY trans_date DESC, created_at DESC LIMIT $1 OFFSET $2',
    [perPage, offset]
  )).rows;

  return (
    <AdminClient
      transactions={transactions}
      page={page}
      totalPages={totalPages}
      total={total}
      username={session.username || ''}
      kasTypeFilter={kasTypeFilter}
      telegramChatId={telegramChatId}
      stats={{
        totalSaldo,
        pemasukanBulanIni,
        pengeluaranBulanIni,
        countPemasukanBulanIni,
        countPengeluaranBulanIni,
      }}
    />
  );
}
