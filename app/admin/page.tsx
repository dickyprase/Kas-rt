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
    />
  );
}
