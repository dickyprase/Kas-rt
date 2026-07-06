'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  MoreHorizontal,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Search,
  Receipt,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export interface Transaction {
  id: number;
  type: string;
  amount: number;
  description: string;
  trans_date: string;
  created_at: string;
  kas_type: string;
}

export default function TransaksiTable({
  transactions,
}: {
  transactions: Transaction[];
}) {
  const router = useRouter();
  const [filterType, setFilterType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(0);

  // Filter
  const filteredTransactions = useMemo(() => {
    let result = transactions;
    if (filterType !== 'all') {
      result = result.filter((t) => t.kas_type === filterType);
    }
    if (searchQuery) {
      result = result.filter((t) =>
        t.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return result;
  }, [transactions, filterType, searchQuery]);

  // Pagination
  const totalPages = Math.ceil(filteredTransactions.length / pageSize);
  const paginatedData = useMemo(() => {
    const start = currentPage * pageSize;
    return filteredTransactions.slice(start, start + pageSize);
  }, [filteredTransactions, currentPage, pageSize]);

  // Reset page on filter change
  const handleFilterChange = (value: string) => {
    setFilterType(value);
    setCurrentPage(0);
  };

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
          <span className="max-w-[200px] truncate block">
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
                  <Button variant="ghost" size="icon" className="size-8" />
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
    data: paginatedData,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <>
      {/* Filter Tabs + Search + Page Size */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Tabs
          value={filterType}
          onValueChange={handleFilterChange}
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
        <div className="flex items-center gap-2">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Cari keterangan..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(0);
              }}
            />
          </div>
          <Select
            value={String(pageSize)}
            onValueChange={(v: string | null) => {
              if (v) {
                setPageSize(Number(v));
                setCurrentPage(0);
              }
            }}
          >
            <SelectTrigger className="w-[80px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Transaction Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Riwayat Transaksi</CardTitle>
            <Badge variant="secondary">{filteredTransactions.length} total</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {filteredTransactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="flex size-16 items-center justify-center rounded-full bg-muted">
                <Receipt className="size-8 text-muted-foreground" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">Belum ada transaksi</h3>
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
                    disabled={currentPage <= 0}
                    onClick={() => setCurrentPage((p) => p - 1)}
                  >
                    <ChevronLeft className="size-4" />
                    Prev
                  </Button>
                  <span className="text-sm text-muted-foreground tabular-nums">
                    Halaman {currentPage + 1} dari {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage >= totalPages - 1}
                    onClick={() => setCurrentPage((p) => p + 1)}
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
    </>
  );
}
