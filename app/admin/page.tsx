import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import db from '@/lib/db';
import AdminClient from './AdminClient';

export const dynamic = 'force-dynamic';

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const session = await getSession();
  if (!session.isLoggedIn) redirect('/login');

  const params = await searchParams;
  const page = parseInt(params.page || '1', 10);
  const perPage = 20;
  const offset = (page - 1) * perPage;

  const total = (await db.query('SELECT COUNT(*) as count FROM transactions')).rows[0].count;
  const totalPages = Math.ceil(total / perPage);
  const transactions = (await db.query('SELECT * FROM transactions ORDER BY trans_date DESC, created_at DESC LIMIT $1 OFFSET $2', [perPage, offset])).rows;

  return (
    <AdminClient
      transactions={transactions}
      page={page}
      totalPages={totalPages}
      total={total}
      username={session.username || ''}
    />
  );
}
