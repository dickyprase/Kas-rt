import { getSession } from '@/lib/session';
import { redirect, notFound } from 'next/navigation';
import db from '@/lib/db';
import EditClient from './EditClient';

export const dynamic = 'force-dynamic';

export default async function EditPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session.isLoggedIn) redirect('/login');

  const { id } = await params;
  const transaction = (await db.query('SELECT * FROM transactions WHERE id = $1', [parseInt(id)])).rows[0];
  if (!transaction) notFound();

  return <EditClient transaction={transaction} />;
}
