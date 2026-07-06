'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ThemeToggle from '../components/ThemeToggle';

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

interface Transaction {
  id: number;
  type: string;
  amount: number;
  description: string;
  trans_date: string;
  created_at: string;
  kas_type: string;
}

export default function AdminClient({
  transactions,
  page,
  totalPages,
  total,
  username,
  kasTypeFilter,
}: {
  transactions: Transaction[];
  page: number;
  totalPages: number;
  total: number;
  username: string;
  kasTypeFilter: string;
}) {
  const router = useRouter();
  const [kasType, setKasType] = useState<'biasa' | 'koperasi'>('biasa');
  const [type, setType] = useState<'pemasukan' | 'pengeluaran'>('pemasukan');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [transDate, setTransDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState(kasTypeFilter);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, kas_type: kasType, amount: parseInt(amount), description, trans_date: transDate }),
    });
    if (res.ok) {
      setAmount('');
      setDescription('');
      router.refresh();
    }
    setLoading(false);
  }

  async function handleDelete(id: number) {
    if (!confirm('Yakin hapus transaksi ini?')) return;
    const res = await fetch(`/api/transactions?id=${id}`, { method: 'DELETE' });
    if (res.ok) router.refresh();
  }

  async function handleLogout() {
    await fetch('/api/logout', { method: 'POST' });
    router.push('/');
  }

  function handleFilterChange(newFilter: string) {
    setFilterType(newFilter);
    const url = newFilter ? `/admin?kas_type=${newFilter}` : '/admin';
    router.push(url);
  }

  function getPaginationUrl(p: number) {
    const params = new URLSearchParams();
    params.set('page', String(p));
    if (filterType) params.set('kas_type', filterType);
    return `/admin?${params.toString()}`;
  }

  return (
    <div className="min-h-screen bg-[--background] p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-xl font-bold">⚙️ Admin Panel</h1>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <span className="text-sm text-[--muted-text]">{username}</span>
            <button onClick={handleLogout} className="text-sm text-red-400 hover:text-red-300">Logout</button>
          </div>
        </div>

        {/* Add Transaction Form */}
        <form onSubmit={handleAdd} className="bg-[--card-bg] rounded-xl p-4 border border-[--card-border] mb-6">
          <h2 className="font-semibold mb-3">Tambah Transaksi</h2>

          {/* Kas Type Toggle */}
          <div className="flex gap-2 mb-3">
            <button
              type="button"
              onClick={() => setKasType('biasa')}
              className={`flex-1 py-2 rounded-lg font-medium transition ${
                kasType === 'biasa'
                  ? 'bg-blue-600 text-white'
                  : 'bg-[--input-bg] text-[--muted-text] border border-[--input-border]'
              }`}
            >
              💰 Kas Biasa
            </button>
            <button
              type="button"
              onClick={() => setKasType('koperasi')}
              className={`flex-1 py-2 rounded-lg font-medium transition ${
                kasType === 'koperasi'
                  ? 'bg-purple-600 text-white'
                  : 'bg-[--input-bg] text-[--muted-text] border border-[--input-border]'
              }`}
            >
              🏛️ Kas Koperasi
            </button>
          </div>

          {/* Type Toggle (pemasukan/pengeluaran) */}
          <div className="flex gap-2 mb-3">
            <button
              type="button"
              onClick={() => setType('pemasukan')}
              className={`flex-1 py-2 rounded-lg font-medium transition ${type === 'pemasukan' ? 'bg-green-600 text-white' : 'bg-[--input-bg] text-[--muted-text] border border-[--input-border]'}`}
            >
              Pemasukan
            </button>
            <button
              type="button"
              onClick={() => setType('pengeluaran')}
              className={`flex-1 py-2 rounded-lg font-medium transition ${type === 'pengeluaran' ? 'bg-red-600 text-white' : 'bg-[--input-bg] text-[--muted-text] border border-[--input-border]'}`}
            >
              Pengeluaran
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
            <input
              type="number"
              placeholder="Jumlah"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="bg-[--input-bg] rounded-lg px-4 py-2 border border-[--input-border] focus:border-blue-500 focus:outline-none text-[--foreground]"
              required
              min="1"
            />
            <input
              type="text"
              placeholder="Keterangan"
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="bg-[--input-bg] rounded-lg px-4 py-2 border border-[--input-border] focus:border-blue-500 focus:outline-none text-[--foreground]"
              required
            />
            <input
              type="date"
              value={transDate}
              onChange={e => setTransDate(e.target.value)}
              className="bg-[--input-bg] rounded-lg px-4 py-2 border border-[--input-border] focus:border-blue-500 focus:outline-none text-[--foreground]"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2 rounded-lg font-medium transition ${type === 'pemasukan' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'} disabled:opacity-50`}
          >
            {loading ? 'Menyimpan...' : 'Simpan'}
          </button>
        </form>

        {/* Kas Type Filter */}
        <div className="flex gap-2 mb-4 bg-[--card-bg] rounded-xl p-1 border border-[--card-border]">
          <button
            onClick={() => handleFilterChange('')}
            className={`flex-1 py-2 rounded-lg font-medium transition text-sm ${
              !filterType
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-[--muted-text] hover:bg-[--card-bg-secondary]'
            }`}
          >
            📊 Semua
          </button>
          <button
            onClick={() => handleFilterChange('biasa')}
            className={`flex-1 py-2 rounded-lg font-medium transition text-sm ${
              filterType === 'biasa'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-[--muted-text] hover:bg-[--card-bg-secondary]'
            }`}
          >
            💰 Kas Biasa
          </button>
          <button
            onClick={() => handleFilterChange('koperasi')}
            className={`flex-1 py-2 rounded-lg font-medium transition text-sm ${
              filterType === 'koperasi'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-[--muted-text] hover:bg-[--card-bg-secondary]'
            }`}
          >
            🏛️ Kas Koperasi
          </button>
        </div>

        {/* Transaction List */}
        <div className="bg-[--card-bg] rounded-xl border border-[--card-border] overflow-hidden">
          <div className="p-4 border-b border-[--card-border] flex justify-between items-center">
            <h2 className="font-semibold">Riwayat Transaksi</h2>
            <span className="text-sm text-[--muted-text]">{total} total</span>
          </div>
          <div className="divide-y divide-[--divider]">
            {transactions.length === 0 && (
              <p className="p-4 text-[--muted-text] text-center">Belum ada transaksi</p>
            )}
            {transactions.map((t) => (
              <div key={t.id} className="p-4 flex justify-between items-center">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{t.description}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      t.kas_type === 'koperasi'
                        ? 'bg-purple-900 text-purple-300'
                        : 'bg-blue-900 text-blue-300'
                    }`}>
                      {t.kas_type === 'koperasi' ? '🏛️ Koperasi' : '💰 Biasa'}
                    </span>
                  </div>
                  <p className="text-xs text-[--muted-text]">{t.trans_date}</p>
                </div>
                <div className="flex items-center gap-3">
                  <p className={`font-bold ${t.type === 'pemasukan' ? 'text-green-400' : 'text-red-400'}`}>
                    {t.type === 'pemasukan' ? '+' : '-'}{formatCurrency(t.amount)}
                  </p>
                  <a href={`/admin/edit/${t.id}`} className="text-blue-400 hover:text-blue-300">✏️</a>
                  <button onClick={() => handleDelete(t.id)} className="text-red-400 hover:text-red-300">🗑️</button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-[--card-border] flex justify-between items-center">
              <a
                href={page > 1 ? getPaginationUrl(page - 1) : '#'}
                className={`px-4 py-2 rounded-lg text-sm ${page > 1 ? 'bg-[--input-bg] hover:bg-[--card-bg-secondary] border border-[--input-border]' : 'bg-[--input-bg] opacity-50 cursor-not-allowed'}`}
              >
                Prev
              </a>
              <span className="text-sm text-[--muted-text]">Halaman {page} dari {totalPages}</span>
              <a
                href={page < totalPages ? getPaginationUrl(page + 1) : '#'}
                className={`px-4 py-2 rounded-lg text-sm ${page < totalPages ? 'bg-[--input-bg] hover:bg-[--card-bg-secondary] border border-[--input-border]' : 'bg-[--input-bg] opacity-50 cursor-not-allowed'}`}
              >
                Next
              </a>
            </div>
          )}
        </div>

        <div className="text-center mt-6">
          <a href="/" className="text-sm text-[--muted-text] hover:text-[--foreground]">← Kembali ke Dashboard</a>
        </div>
      </div>
    </div>
  );
}
