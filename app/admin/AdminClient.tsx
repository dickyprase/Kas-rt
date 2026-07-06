'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

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
}

export default function AdminClient({
  transactions,
  page,
  totalPages,
  total,
  username,
}: {
  transactions: Transaction[];
  page: number;
  totalPages: number;
  total: number;
  username: string;
}) {
  const router = useRouter();
  const [type, setType] = useState<'pemasukan' | 'pengeluaran'>('pemasukan');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [transDate, setTransDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, amount: parseInt(amount), description, trans_date: transDate }),
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

  return (
    <div className="min-h-screen bg-gray-950 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-xl font-bold">⚙️ Admin Panel</h1>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-400">{username}</span>
            <button onClick={handleLogout} className="text-sm text-red-400 hover:text-red-300">Logout</button>
          </div>
        </div>

        {/* Add Transaction Form */}
        <form onSubmit={handleAdd} className="bg-gray-900 rounded-xl p-4 border border-gray-800 mb-6">
          <h2 className="font-semibold mb-3">Tambah Transaksi</h2>

          {/* Type Toggle */}
          <div className="flex gap-2 mb-3">
            <button
              type="button"
              onClick={() => setType('pemasukan')}
              className={`flex-1 py-2 rounded-lg font-medium transition ${type === 'pemasukan' ? 'bg-green-600 text-white' : 'bg-gray-800 text-gray-400 border border-gray-700'}`}
            >
              Pemasukan
            </button>
            <button
              type="button"
              onClick={() => setType('pengeluaran')}
              className={`flex-1 py-2 rounded-lg font-medium transition ${type === 'pengeluaran' ? 'bg-red-600 text-white' : 'bg-gray-800 text-gray-400 border border-gray-700'}`}
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
              className="bg-gray-800 rounded-lg px-4 py-2 border border-gray-700 focus:border-blue-500 focus:outline-none"
              required
              min="1"
            />
            <input
              type="text"
              placeholder="Keterangan"
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="bg-gray-800 rounded-lg px-4 py-2 border border-gray-700 focus:border-blue-500 focus:outline-none"
              required
            />
            <input
              type="date"
              value={transDate}
              onChange={e => setTransDate(e.target.value)}
              className="bg-gray-800 rounded-lg px-4 py-2 border border-gray-700 focus:border-blue-500 focus:outline-none"
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

        {/* Transaction List */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
          <div className="p-4 border-b border-gray-800 flex justify-between items-center">
            <h2 className="font-semibold">Riwayat Transaksi</h2>
            <span className="text-sm text-gray-400">{total} total</span>
          </div>
          <div className="divide-y divide-gray-800">
            {transactions.length === 0 && (
              <p className="p-4 text-gray-500 text-center">Belum ada transaksi</p>
            )}
            {transactions.map((t) => (
              <div key={t.id} className="p-4 flex justify-between items-center">
                <div className="flex-1">
                  <p className="font-medium">{t.description}</p>
                  <p className="text-xs text-gray-500">{t.trans_date}</p>
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
            <div className="p-4 border-t border-gray-800 flex justify-between items-center">
              <a
                href={page > 1 ? `/admin?page=${page - 1}` : '#'}
                className={`px-4 py-2 rounded-lg text-sm ${page > 1 ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-800 opacity-50 cursor-not-allowed'}`}
              >
                Prev
              </a>
              <span className="text-sm text-gray-400">Halaman {page} dari {totalPages}</span>
              <a
                href={page < totalPages ? `/admin?page=${page + 1}` : '#'}
                className={`px-4 py-2 rounded-lg text-sm ${page < totalPages ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-800 opacity-50 cursor-not-allowed'}`}
              >
                Next
              </a>
            </div>
          )}
        </div>

        <div className="text-center mt-6">
          <a href="/" className="text-sm text-gray-500 hover:text-gray-300">← Kembali ke Dashboard</a>
        </div>
      </div>
    </div>
  );
}
