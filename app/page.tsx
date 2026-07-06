import db from '@/lib/db';

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export const dynamic = 'force-dynamic';

export default async function Home() {
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;

  const totalPemasukan = (await db.query("SELECT COALESCE(SUM(amount),0) as total FROM transactions WHERE type='pemasukan'")).rows[0].total;
  const totalPengeluaran = (await db.query("SELECT COALESCE(SUM(amount),0) as total FROM transactions WHERE type='pengeluaran'")).rows[0].total;
  const saldo = totalPemasukan - totalPengeluaran;

  const todayIncome = (await db.query("SELECT COALESCE(SUM(amount),0) as total FROM transactions WHERE type='pemasukan' AND trans_date=$1", [today])).rows[0].total;
  const todayExpense = (await db.query("SELECT COALESCE(SUM(amount),0) as total FROM transactions WHERE type='pengeluaran' AND trans_date=$1", [today])).rows[0].total;
  const monthIncome = (await db.query("SELECT COALESCE(SUM(amount),0) as total FROM transactions WHERE type='pemasukan' AND trans_date>=$1", [monthStart])).rows[0].total;
  const monthExpense = (await db.query("SELECT COALESCE(SUM(amount),0) as total FROM transactions WHERE type='pengeluaran' AND trans_date>=$1", [monthStart])).rows[0].total;

  const lastTransactions = (await db.query("SELECT * FROM transactions ORDER BY trans_date DESC, created_at DESC LIMIT 10")).rows;

  return (
    <div className="min-h-screen bg-gray-950 p-4 md:p-8">
      <meta httpEquiv="refresh" content="30" />
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-center mb-6">📊 Kas</h1>

        {/* Saldo */}
        <div className={`text-center p-6 rounded-2xl mb-6 ${saldo >= 0 ? 'bg-green-950 border border-green-800' : 'bg-red-950 border border-red-800'}`}>
          <p className="text-gray-400 text-sm mb-1">Saldo</p>
          <p className={`text-4xl md:text-5xl font-bold ${saldo >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {formatCurrency(saldo)}
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
            <p className="text-xs text-gray-400">Pemasukan Hari Ini</p>
            <p className="text-lg font-bold text-green-400">{formatCurrency(todayIncome)}</p>
          </div>
          <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
            <p className="text-xs text-gray-400">Pengeluaran Hari Ini</p>
            <p className="text-lg font-bold text-red-400">{formatCurrency(todayExpense)}</p>
          </div>
          <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
            <p className="text-xs text-gray-400">Pemasukan Bulan Ini</p>
            <p className="text-lg font-bold text-green-400">{formatCurrency(monthIncome)}</p>
          </div>
          <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
            <p className="text-xs text-gray-400">Pengeluaran Bulan Ini</p>
            <p className="text-lg font-bold text-red-400">{formatCurrency(monthExpense)}</p>
          </div>
        </div>

        {/* Total */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
            <p className="text-xs text-gray-400">Total Pemasukan</p>
            <p className="text-xl font-bold text-green-400">{formatCurrency(totalPemasukan)}</p>
          </div>
          <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
            <p className="text-xs text-gray-400">Total Pengeluaran</p>
            <p className="text-xl font-bold text-red-400">{formatCurrency(totalPengeluaran)}</p>
          </div>
        </div>

        {/* Last 10 Transactions */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
          <div className="p-4 border-b border-gray-800">
            <h2 className="font-semibold">10 Transaksi Terakhir</h2>
          </div>
          <div className="divide-y divide-gray-800">
            {lastTransactions.length === 0 && (
              <p className="p-4 text-gray-500 text-center">Belum ada transaksi</p>
            )}
            {lastTransactions.map((t: any) => (
              <div key={t.id} className="p-4 flex justify-between items-center">
                <div>
                  <p className="font-medium">{t.description}</p>
                  <p className="text-xs text-gray-500">{t.trans_date}</p>
                </div>
                <p className={`font-bold ${t.type === 'pemasukan' ? 'text-green-400' : 'text-red-400'}`}>
                  {t.type === 'pemasukan' ? '+' : '-'}{formatCurrency(t.amount)}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center mt-6">
          <a href="/login" className="text-sm text-gray-500 hover:text-gray-300">Admin Login</a>
        </div>
      </div>
    </div>
  );
}
