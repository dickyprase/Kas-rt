import db from '@/lib/db';
import TransaksiForm from '@/components/transaksi-form';
import TransaksiTable from '@/components/transaksi-table';

export const dynamic = 'force-dynamic';

export default async function TransaksiPage() {
  const { rows: transactions } = await db.query(
    'SELECT * FROM transactions ORDER BY trans_date DESC, created_at DESC'
  );

  return (
    <>
      <TransaksiForm />
      <TransaksiTable transactions={transactions} />
    </>
  );
}
