import db from '@/lib/db';
import TransaksiForm from '@/components/transaksi-form';
import TransaksiTable from '@/components/transaksi-table';
import { Card, CardContent } from '@/components/ui/card';

export const dynamic = 'force-dynamic';

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export default async function KasKoperasiPage() {
  const now = new Date();
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;

  const { rows: transactions } = await db.query(
    "SELECT * FROM transactions WHERE kas_type = 'koperasi' ORDER BY trans_date DESC, created_at DESC"
  );

  const saldoRes = await db.query(
    "SELECT COALESCE(SUM(CASE WHEN type='pemasukan' THEN amount ELSE 0 END), 0) - COALESCE(SUM(CASE WHEN type='pengeluaran' THEN amount ELSE 0 END), 0) as saldo FROM transactions WHERE kas_type='koperasi'"
  );
  const pemasukanRes = await db.query(
    "SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE type='pemasukan' AND kas_type='koperasi' AND trans_date >= $1",
    [monthStart]
  );
  const pengeluaranRes = await db.query(
    "SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE type='pengeluaran' AND kas_type='koperasi' AND trans_date >= $1",
    [monthStart]
  );

  const saldo = Number(saldoRes.rows[0]?.saldo) || 0;
  const pemasukan = Number(pemasukanRes.rows[0]?.total) || 0;
  const pengeluaran = Number(pengeluaranRes.rows[0]?.total) || 0;

  return (
    <>
      {/* Banner */}
      <div className="rounded-lg border-2 border-blue-200 bg-blue-50 p-4">
        <div className="flex items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-full bg-blue-200 text-2xl">
            🏦
          </div>
          <div>
            <h1 className="text-2xl font-bold text-blue-800">Kas Koperasi</h1>
            <p className="text-sm text-blue-700">Kelola transaksi kas koperasi RT</p>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Saldo</p>
            <p className={`text-2xl font-bold tabular-nums ${saldo >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {formatCurrency(saldo)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Pemasukan bulan ini</p>
            <p className="text-2xl font-bold tabular-nums text-emerald-600">
              +{formatCurrency(pemasukan)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Pengeluaran bulan ini</p>
            <p className="text-2xl font-bold tabular-nums text-rose-600">
              -{formatCurrency(pengeluaran)}
            </p>
          </CardContent>
        </Card>
      </div>

      <TransaksiForm kasType="koperasi" />
      <TransaksiTable transactions={transactions} hideKasTypeColumn />
    </>
  );
}
