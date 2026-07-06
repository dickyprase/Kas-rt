'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function EditClient({ transaction }: { transaction: any }) {
  const router = useRouter();
  const [type, setType] = useState<'pemasukan' | 'pengeluaran'>(transaction.type);
  const [amount, setAmount] = useState(String(transaction.amount));
  const [description, setDescription] = useState(transaction.description);
  const [transDate, setTransDate] = useState(transaction.trans_date);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch('/api/transactions', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: transaction.id, type, amount: parseInt(amount), description, trans_date: transDate }),
    });
    if (res.ok) {
      router.push('/admin');
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-gray-950 p-4 md:p-8">
      <div className="max-w-lg mx-auto">
        <h1 className="text-xl font-bold mb-6">✏️ Edit Transaksi</h1>

        <form onSubmit={handleSubmit} className="bg-gray-900 rounded-xl p-4 border border-gray-800">
          <div className="flex gap-2 mb-4">
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

          <div className="space-y-3 mb-4">
            <input
              type="number"
              placeholder="Jumlah"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="w-full bg-gray-800 rounded-lg px-4 py-2 border border-gray-700 focus:border-blue-500 focus:outline-none"
              required
              min="1"
            />
            <input
              type="text"
              placeholder="Keterangan"
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full bg-gray-800 rounded-lg px-4 py-2 border border-gray-700 focus:border-blue-500 focus:outline-none"
              required
            />
            <input
              type="date"
              value={transDate}
              onChange={e => setTransDate(e.target.value)}
              className="w-full bg-gray-800 rounded-lg px-4 py-2 border border-gray-700 focus:border-blue-500 focus:outline-none"
              required
            />
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className={`flex-1 py-2 rounded-lg font-medium transition ${type === 'pemasukan' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'} disabled:opacity-50`}
            >
              {loading ? 'Menyimpan...' : 'Simpan'}
            </button>
            <a
              href="/admin"
              className="flex-1 py-2 rounded-lg font-medium bg-gray-800 hover:bg-gray-700 text-center transition"
            >
              Batal
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}
