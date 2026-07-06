'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ThemeToggle from '../../../components/ThemeToggle';

export default function EditClient({ transaction }: { transaction: any }) {
  const router = useRouter();
  const [kasType, setKasType] = useState<'biasa' | 'koperasi'>(transaction.kas_type || 'biasa');
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
      body: JSON.stringify({ id: transaction.id, type, kas_type: kasType, amount: parseInt(amount), description, trans_date: transDate }),
    });
    if (res.ok) {
      router.push('/admin');
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-[--background] p-4 md:p-8">
      <div className="max-w-lg mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-xl font-bold">✏️ Edit Transaksi</h1>
          <ThemeToggle />
        </div>

        <form onSubmit={handleSubmit} className="bg-[--card-bg] rounded-xl p-4 border border-[--card-border]">
          {/* Kas Type Toggle */}
          <div className="flex gap-2 mb-4">
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

          <div className="flex gap-2 mb-4">
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

          <div className="space-y-3 mb-4">
            <input
              type="number"
              placeholder="Jumlah"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="w-full bg-[--input-bg] rounded-lg px-4 py-2 border border-[--input-border] focus:border-blue-500 focus:outline-none text-[--foreground]"
              required
              min="1"
            />
            <input
              type="text"
              placeholder="Keterangan"
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full bg-[--input-bg] rounded-lg px-4 py-2 border border-[--input-border] focus:border-blue-500 focus:outline-none text-[--foreground]"
              required
            />
            <input
              type="date"
              value={transDate}
              onChange={e => setTransDate(e.target.value)}
              className="w-full bg-[--input-bg] rounded-lg px-4 py-2 border border-[--input-border] focus:border-blue-500 focus:outline-none text-[--foreground]"
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
              className="flex-1 py-2 rounded-lg font-medium bg-[--input-bg] hover:bg-[--card-bg-secondary] text-center transition border border-[--input-border]"
            >
              Batal
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}
