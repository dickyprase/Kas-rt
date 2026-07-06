'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Pencil } from 'lucide-react';

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
    <div className="p-4 md:p-8">
      <div className="mx-auto max-w-lg">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">✏️ Edit Transaksi</h1>
          <p className="text-sm text-muted-foreground">Ubah data transaksi</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Pencil className="size-4" />
              Form Edit
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Kas Type Tabs */}
              <div className="space-y-2">
                <Label>Jenis Kas</Label>
                <Tabs value={kasType} onValueChange={(v) => setKasType(v as 'biasa' | 'koperasi')}>
                  <TabsList className="w-full">
                    <TabsTrigger value="biasa" className="flex-1">💰 Kas Biasa</TabsTrigger>
                    <TabsTrigger value="koperasi" className="flex-1">🏛️ Kas Koperasi</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {/* Type Tabs */}
              <div className="space-y-2">
                <Label>Tipe Transaksi</Label>
                <Tabs value={type} onValueChange={(v) => setType(v as 'pemasukan' | 'pengeluaran')}>
                  <TabsList className="w-full">
                    <TabsTrigger value="pemasukan" className="flex-1">💚 Pemasukan</TabsTrigger>
                    <TabsTrigger value="pengeluaran" className="flex-1">❤️ Pengeluaran</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {/* Form Fields */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">Jumlah</Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                    min="1"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Keterangan</Label>
                  <Input
                    id="description"
                    type="text"
                    placeholder="Deskripsi transaksi"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="transDate">Tanggal</Label>
                  <Input
                    id="transDate"
                    type="date"
                    value={transDate}
                    onChange={(e) => setTransDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={loading}
                >
                  {loading ? 'Menyimpan...' : 'Simpan'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => router.push('/admin')}
                >
                  Batal
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
