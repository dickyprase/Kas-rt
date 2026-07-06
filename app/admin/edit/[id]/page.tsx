import db from '@/lib/db';
import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import EditForm from './EditForm';

export const dynamic = 'force-dynamic';

export default async function EditPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session.isLoggedIn) redirect('/login');

  const { id } = await params;

  const { rows } = await db.query(
    'SELECT * FROM transactions WHERE id = $1',
    [parseInt(id)]
  );

  if (rows.length === 0) redirect('/admin');

  const t = rows[0];

  return (
    <EditForm
      transaction={{
        id: t.id,
        type: t.type,
        kas_type: t.kas_type,
        amount: Number(t.amount),
        description: t.description,
        trans_date: typeof t.trans_date === 'string' ? t.trans_date : t.trans_date.toISOString().split('T')[0],
      }}
    />
  );
}
