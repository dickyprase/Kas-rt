'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
} from '@tanstack/react-table';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Download,
  Settings,
  Save,
  Loader2,
  Wallet,
  TrendingUp,
  TrendingDown,
  Search,
  Receipt,
  CalendarIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// Zod schema for the form
const formSchema = z.object({
  jenisKas: z.enum(['biasa', 'koperasi']),
  tipeTransaksi: z.enum(['pemasukan', 'pengeluaran']),
  jumlah: z
    .number()
    .positive('Jumlah harus lebih dari 0'),
  keterangan: z.string().min(1, 'Keterangan tidak boleh kosong'),
  tanggal: z.date(),
});

type FormValues = z.infer<typeof formSchema>;

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

interface Stats {
  totalSaldo: number;
  pemasukanBulanIni: number;
  pengeluaranBulanIni: number;
  countPemasukanBulanIni: number;
  countPengeluaranBulanIni: number;
}

export default function AdminClient({
  transactions,
  page,
  totalPages,
  total,
  username,
  kasTypeFilter,
  telegramChatId,
  stats,
}: {
  transactions: Transaction[];
  page: number;
  totalPages: number;
  total: number;
  username: string;
  kasTypeFilter: string;
  telegramChatId: string;
  stats: Stats;
}) {
  const router = useRouter();
  const [filterType, setFilterType] = useState(kasTypeFilter);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  // Backup & Settings state
  const [backupLoading, setBackupLoading] = useState(false);
  const [chatId, setChatId] = useState(telegramChatId);
  const [savingSettings, setSavingSettings] = useState(false);

  // Form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      jenisKas: 'biasa',
      tipeTransaksi: 'pemasukan',
      jumlah: undefined,
      keterangan: '',
      tanggal: new Date(),
    },
  });

  async function handleAdd(values: FormValues) {
    setLoading(true);
    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: values.tipeTransaksi,
          kas_type: values.jenisKas,
          amount: values.jumlah,
          description: values.keterangan,
          trans_date: format(values.tanggal, 'yyyy-MM-dd'),
        }),
      });
      if (res.ok) {
        form.reset({
          jenisKas: 'biasa',
          tipeTransaksi: 'pemasukan',
          jumlah: undefined,
          keterangan: '',
          tanggal: new Date(),
        });
        toast.success('Transaksi berhasil ditambahkan!');
        router.refresh();
      } else {
        toast.error('Gagal menambahkan transaksi');
      }
    } catch {
      toast.error('Gagal menambahkan transaksi: Network error');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: number) {
    const res = await fetch(`/api/transactions?id=${id}`, { method: 'DELETE' });
    if (res.ok) {
      setDeleteId(null);
      toast.success('Transaksi berhasil dihapus!');
      router.refresh();
    } else {
      toast.error('Gagal menghapus transaksi');
    }
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

  async function handleBackup() {
    setBackupLoading(true);
    try {
      const res = await fetch('/api/backup', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        toast.success('Backup berhasil! File Excel sudah dikirim ke Telegram.');
      } else {
        toast.error(`Backup gagal: ${data.error || 'Unknown error'}`);
      }
    } catch {
      toast.error('Backup gagal: Network error');
    } finally {
      setBackupLoading(false);
    }
  }

  async function handleSaveSettings() {
    setSavingSettings(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telegram_chat_id: chatId }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Pengaturan berhasil disimpan!');
      } else {
        toast.error(`Gagal menyimpan: ${data.error || 'Unknown error'}`);
      }
    } catch {
      toast.error('Gagal menyimpan: Network error');
    } finally {
      setSavingSettings(false);
    }
  }

  // Filter transactions by search query
  const filteredTransactions = useMemo(() => {
    if (!searchQuery) return transactions;
    return transactions.filter((t) =>
      t.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [transactions, searchQuery]);

  // Table columns
  const columns: ColumnDef<Transaction>[] = useMemo(
    () => [
      {
        accessorKey: 'trans_date',
        header: 'Tanggal',
        cell: ({ row }) => {
          const date = new Date(row.getValue('trans_date'));
          return (
            <span className="tabular-nums">
              {format(date, 'dd MMM yyyy', { locale: id })}
            </span>
          );
        },
      },
      {
        accessorKey: 'kas_type',
        header: 'Jenis Kas',
        cell: ({ row }) => {
          const kasType = row.getValue('kas_type') as string;
          return (
            <Badge variant={kasType === 'koperasi' ? 'secondary' : 'outline'}>
              {kasType === 'koperasi' ? '🏦 Koperasi' : '🪙 Biasa'}
            </Badge>
          );
        },
      },
      {
        accessorKey: 'type',
        header: 'Tipe',
        cell: ({ row }) => {
          const type = row.getValue('type') as string;
          return (
            <Badge
              className={cn(
                'text-white',
                type === 'pemasukan'
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-rose-600 hover:bg-rose-700'
              )}
            >
              {type === 'pemasukan' ? 'Masuk' : 'Keluar'}
            </Badge>
          );
        },
      },
      {
        accessorKey: 'amount',
        header: 'Jumlah',
        cell: ({ row }) => {
          const amount = row.getValue('amount') as number;
          const type = row.original.type;
          return (
            <span
              className={cn(
                'font-bold tabular-nums',
                type === 'pemasukan' ? 'text-emerald-600' : 'text-rose-600'
              )}
            >
              {type === 'pemasukan' ? '+' : '-'}
              {formatCurrency(amount)}
            </span>
          );
        },
      },
      {
        accessorKey: 'description',
        header: 'Keterangan',
        cell: ({ row }) => (
          <span className="max-w-[200px] truncate">
            {row.getValue('description')}
          </span>
        ),
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => {
          const transaction = row.original;
          return (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button variant="ghost" size="icon-sm" />
                }
              >
                <MoreHorizontal className="size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => router.push(`/admin/edit/${transaction.id}`)}
                >
                  <Pencil className="size-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => setDeleteId(transaction.id)}
                >
                  <Trash2 className="size-4" />
                  Hapus
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    [router]
  );

  const table = useReactTable({
    data: filteredTransactions,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const tipeTransaksi = form.watch('tipeTransaksi');

  return (
    <div className="p-4 md:p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Stat Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Saldo</CardTitle>
              <Wallet className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div
                className={cn(
                  'text-2xl font-bold tabular-nums',
                  stats.totalSaldo >= 0 ? 'text-emerald-600' : 'text-rose-600'
                )}
              >
                {formatCurrency(stats.totalSaldo)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Pemasukan Bulan Ini
              </CardTitle>
              <TrendingUp className="size-4 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tabular-nums text-emerald-600">
                +{formatCurrency(stats.pemasukanBulanIni)}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.countPemasukanBulanIni} transaksi
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Pengeluaran Bulan Ini
              </CardTitle>
              <TrendingDown className="size-4 text-rose-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tabular-nums text-rose-600">
                -{formatCurrency(stats.pengeluaranBulanIni)}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.countPengeluaranBulanIni} transaksi
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Add Transaction Form */}
        <Card id="transaksi">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="size-4" />
              Tambah Transaksi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(handleAdd)}
                className="space-y-4"
              >
                {/* Jenis Kas ToggleGroup */}
                <FormField
                  control={form.control}
                  name="jenisKas"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Jenis Kas</FormLabel>
                      <FormControl>
                        <ToggleGroup
                          value={[field.value]}
                          onValueChange={(value: string[]) => {
                            if (value.length > 0) field.onChange(value[0]);
                          }}
                          className="w-full"
                        >
                          <ToggleGroupItem
                            value="biasa"
                            className="flex-1"
                          >
                            🪙 Kas Biasa
                          </ToggleGroupItem>
                          <ToggleGroupItem
                            value="koperasi"
                            className="flex-1"
                          >
                            🏦 Kas Koperasi
                          </ToggleGroupItem>
                        </ToggleGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Tipe Transaksi ToggleGroup */}
                <FormField
                  control={form.control}
                  name="tipeTransaksi"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipe Transaksi</FormLabel>
                      <FormControl>
                        <ToggleGroup
                          value={[field.value]}
                          onValueChange={(value: string[]) => {
                            if (value.length > 0) field.onChange(value[0]);
                          }}
                          className="w-full"
                        >
                          <ToggleGroupItem
                            value="pemasukan"
                            className={cn(
                              'flex-1',
                              'data-[state=on]:bg-emerald-600 data-[state=on]:text-white'
                            )}
                          >
                            💚 Pemasukan
                          </ToggleGroupItem>
                          <ToggleGroupItem
                            value="pengeluaran"
                            className={cn(
                              'flex-1',
                              'data-[state=on]:bg-rose-600 data-[state=on]:text-white'
                            )}
                          >
                            ❤️ Pengeluaran
                          </ToggleGroupItem>
                        </ToggleGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Form Fields: Jumlah, Keterangan, Tanggal */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <FormField
                    control={form.control}
                    name="jumlah"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Jumlah</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="0"
                            {...field}
                            value={field.value ?? ''}
                            onChange={(e) =>
                              field.onChange(
                                e.target.value === ''
                                  ? undefined
                                  : Number(e.target.value)
                              )
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="keterangan"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Keterangan</FormLabel>
                        <FormControl>
                          <Input
                            type="text"
                            placeholder="Deskripsi transaksi"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="tanggal"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tanggal</FormLabel>
                        <Popover>
                          <PopoverTrigger
                            render={
                              <Button
                                variant="outline"
                                className={cn(
                                  'w-full justify-start text-left font-normal',
                                  !field.value && 'text-muted-foreground'
                                )}
                              />
                            }
                          >
                            <CalendarIcon className="mr-2 size-4" />
                            {field.value ? (
                              format(field.value, 'dd MMMM yyyy', { locale: id })
                            ) : (
                              <span>Pilih tanggal</span>
                            )}
                          </PopoverTrigger>
                          <PopoverContent align="start" className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              locale={id}
                              disabled={(date) =>
                                date > new Date() || date < new Date('1900-01-01')
                              }
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <Plus className="size-4" />
                      Simpan Transaksi
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Filter Tabs + Search */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Tabs
            value={filterType || 'all'}
            onValueChange={(v) => handleFilterChange(v === 'all' ? '' : v)}
          >
            <TabsList className="w-full sm:w-auto">
              <TabsTrigger value="all" className="flex-1 sm:flex-none">
                📊 Semua
              </TabsTrigger>
              <TabsTrigger value="biasa" className="flex-1 sm:flex-none">
                🪙 Kas Biasa
              </TabsTrigger>
              <TabsTrigger value="koperasi" className="flex-1 sm:flex-none">
                🏦 Kas Koperasi
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Cari keterangan..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Transaction List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Riwayat Transaksi</CardTitle>
              <Badge variant="secondary">{total} total</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {filteredTransactions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="flex size-16 items-center justify-center rounded-full bg-muted">
                  <Receipt className="size-8 text-muted-foreground" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">
                  Belum ada transaksi
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Tambahkan transaksi pertama menggunakan form di atas
                </p>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    {table.getHeaderGroups().map((headerGroup) => (
                      <TableRow key={headerGroup.id}>
                        {headerGroup.headers.map((header) => (
                          <TableHead key={header.id}>
                            {header.isPlaceholder
                              ? null
                              : flexRender(
                                  header.column.columnDef.header,
                                  header.getContext()
                                )}
                          </TableHead>
                        ))}
                      </TableRow>
                    ))}
                  </TableHeader>
                  <TableBody>
                    {table.getRowModel().rows.map((row) => (
                      <TableRow key={row.id}>
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id}>
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

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
                    <span className="text-sm text-muted-foreground tabular-nums">
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
              </>
            )}
          </CardContent>
        </Card>

        {/* Backup Section */}
        <Card id="backup">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="size-4" />
              Backup
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Button
                onClick={handleBackup}
                disabled={backupLoading}
                className="gap-2"
              >
                {backupLoading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Download className="size-4" />
                )}
                {backupLoading ? 'Mengirim Backup...' : 'Backup ke Telegram'}
              </Button>
              <span className="text-sm text-muted-foreground">
                Kirim file Excel ke Telegram
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Settings Section */}
        <Card id="settings">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="size-4" />
              Pengaturan
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="chatId" className="text-sm font-medium">
                Telegram Chat ID
              </label>
              <Input
                id="chatId"
                type="text"
                placeholder="584847845"
                value={chatId}
                onChange={(e) => setChatId(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Chat ID untuk menerima file backup Excel
              </p>
            </div>
            <Button
              onClick={handleSaveSettings}
              disabled={savingSettings}
              size="sm"
              className="gap-2"
            >
              {savingSettings ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Save className="size-4" />
              )}
              {savingSettings ? 'Menyimpan...' : 'Simpan Pengaturan'}
            </Button>
          </CardContent>
        </Card>

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={deleteId !== null}
          onOpenChange={(open) => {
            if (!open) setDeleteId(null);
          }}
        >
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
