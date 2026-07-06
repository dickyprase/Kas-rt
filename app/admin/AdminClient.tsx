'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ThemeToggle from '../components/ThemeToggle';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { Plus, MoreHorizontal, Pencil, Trash2, LogOut, ChevronLeft, ChevronRight } from 'lucide-react';

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
  const [deleteId, setDeleteId] = useState<number | null>(null);

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
    const res = await fetch(`/api/transactions?id=${id}`, { method: 'DELETE' });
    if (res.ok) {
      setDeleteId(null);
      router.refresh();
    }
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
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">⚙️ Admin Panel</h1>
            <p className="text-sm text-muted-foreground">Kelola transaksi kas</p>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Badge variant="secondary">{username}</Badge>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="size-4" />
              Logout
            </Button>
          </div>
        </div>

        <Separator />

        {/* Add Transaction Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="size-4" />
              Tambah Transaksi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAdd} className="space-y-4">
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
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
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

              <Button
                type="submit"
                className="w-full"
                variant={type === 'pemasukan' ? 'default' : 'destructive'}
                disabled={loading}
              >
                {loading ? 'Menyimpan...' : 'Simpan Transaksi'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Kas Type Filter */}
        <Tabs value={filterType || 'all'} onValueChange={(v) => handleFilterChange(v === 'all' ? '' : v)}>
          <TabsList className="w-full">
            <TabsTrigger value="all" className="flex-1">📊 Semua</TabsTrigger>
            <TabsTrigger value="biasa" className="flex-1">💰 Kas Biasa</TabsTrigger>
            <TabsTrigger value="koperasi" className="flex-1">🏛️ Kas Koperasi</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Transaction List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Riwayat Transaksi</CardTitle>
              <Badge variant="secondary">{total} total</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {transactions.length === 0 ? (
              <p className="py-8 text-center text-muted-foreground">Belum ada transaksi</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Keterangan</TableHead>
                    <TableHead className="w-[120px]">Jenis Kas</TableHead>
                    <TableHead className="w-[100px]">Tanggal</TableHead>
                    <TableHead className="w-[150px] text-right">Jumlah</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Badge variant={t.type === 'pemasukan' ? 'default' : 'destructive'} className="text-[10px]">
                            {t.type === 'pemasukan' ? 'Masuk' : 'Keluar'}
                          </Badge>
                          {t.description}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={t.kas_type === 'koperasi' ? 'secondary' : 'outline'}>
                          {t.kas_type === 'koperasi' ? '🏛️ Koperasi' : '💰 Biasa'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{t.trans_date}</TableCell>
                      <TableCell className="text-right">
                        <span className={`font-bold tabular-nums ${
                          t.type === 'pemasukan' ? 'text-emerald-500' : 'text-destructive'
                        }`}>
                          {t.type === 'pemasukan' ? '+' : '-'}{formatCurrency(t.amount)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
                            <MoreHorizontal className="size-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => router.push(`/admin/edit/${t.id}`)}>
                              <Pencil className="size-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              variant="destructive"
                              onClick={() => setDeleteId(t.id)}
                            >
                              <Trash2 className="size-4" />
                              Hapus
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-4 flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => router.push(getPaginationUrl(page - 1))}
                >
                  <ChevronLeft className="size-4" />
                  Prev
                </Button>
                <span className="text-sm text-muted-foreground">
                  Halaman {page} dari {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => router.push(getPaginationUrl(page + 1))}
                >
                  Next
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="text-center">
          <a href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            ← Kembali ke Dashboard
          </a>
        </div>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteId !== null} onOpenChange={(open) => { if (!open) setDeleteId(null); }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Hapus Transaksi</DialogTitle>
              <DialogDescription>
                Yakin hapus transaksi ini? Tindakan ini tidak dapat dibatalkan.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose render={<Button variant="outline" />}>
                Batal
              </DialogClose>
              <Button
                variant="destructive"
                onClick={() => deleteId !== null && handleDelete(deleteId)}
              >
                Hapus
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
