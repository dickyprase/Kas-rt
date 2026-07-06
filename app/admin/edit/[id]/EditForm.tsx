'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Pencil, Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface Transaction {
  id: number;
  type: string;
  kas_type: string;
  amount: number;
  description: string;
  trans_date: string;
}

export default function EditForm({ transaction }: { transaction: Transaction }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState(transaction.type);
  const [kasType, setKasType] = useState(transaction.kas_type);
  const [amount, setAmount] = useState(String(transaction.amount));
  const [description, setDescription] = useState(transaction.description);
  const [transDate, setTransDate] = useState(transaction.trans_date);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/transactions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: transaction.id,
          type,
          kas_type: kasType,
          amount: parseInt(amount),
          description,
          trans_date: transDate,
        }),
      });

      if (res.ok) {
        toast.success('Transaksi berhasil diupdate!');
        router.push(kasType === 'koperasi' ? '/admin/transaksi/koperasi' : '/admin/transaksi/biasa');
        router.refresh();
      } else {
        toast.error('Gagal mengupdate transaksi');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <Button variant="outline" size="sm" render={<Link href={kasType === 'koperasi' ? '/admin/transaksi/koperasi' : '/admin/transaksi/biasa'} />} className="gap-2">
        <ArrowLeft className="size-4" />
        Kembali
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Pencil className="size-4" />
            Edit Transaksi
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Jenis Kas */}
            <div className="space-y-2">
              <Label>Jenis Kas</Label>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setKasType('biasa')}
                  className={cn('rounded-lg py-2 px-4 text-sm font-medium transition-all border',
                    kasType === 'biasa' ? 'bg-amber-600 text-white shadow-md ring-2 ring-amber-300' : 'bg-amber-50 text-amber-700 hover:bg-amber-100')}>
                  🪙 Kas Biasa
                </button>
                <button type="button" onClick={() => setKasType('koperasi')}
                  className={cn('rounded-lg py-2 px-4 text-sm font-medium transition-all border',
                    kasType === 'koperasi' ? 'bg-blue-600 text-white shadow-md ring-2 ring-blue-300' : 'bg-blue-50 text-blue-700 hover:bg-blue-100')}>
                  🏦 Kas Koperasi
                </button>
              </div>
            </div>

            {/* Tipe */}
            <div className="space-y-2">
              <Label>Tipe Transaksi</Label>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setType('pemasukan')}
                  className={cn('rounded-lg py-2 px-4 text-sm font-medium transition-all border',
                    type === 'pemasukan' ? 'bg-emerald-600 text-white shadow-md ring-2 ring-emerald-300' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100')}>
                  ↑ Pemasukan
                </button>
                <button type="button" onClick={() => setType('pengeluaran')}
                  className={cn('rounded-lg py-2 px-4 text-sm font-medium transition-all border',
                    type === 'pengeluaran' ? 'bg-rose-600 text-white shadow-md ring-2 ring-rose-300' : 'bg-rose-50 text-rose-700 hover:bg-rose-100')}>
                  ↓ Pengeluaran
                </button>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>Jumlah (Rp)</Label>
                <Input type="number" value={amount} onChange={e => setAmount(e.target.value)} min={0} required />
              </div>
              <div className="space-y-2">
                <Label>Keterangan</Label>
                <Input value={description} onChange={e => setDescription(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Tanggal</Label>
                <Input type="date" value={transDate} onChange={e => setTransDate(e.target.value)} required />
              </div>
            </div>

            <Button type="submit" disabled={loading} className="w-full" size="lg">
              {loading ? <><Loader2 className="mr-2 size-4 animate-spin" /> Menyimpan...</> : 'Simpan Perubahan'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
