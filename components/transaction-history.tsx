'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

interface Transaction {
  id: number;
  type: string;
  kas_type: string;
  amount: string;
  description: string;
  trans_date: string;
  created_at: string;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function TransactionHistory() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const limit = 10;

  useEffect(() => {
    setLoading(true);
    fetch(`/api/transactions?page=${page}&limit=${limit}`)
      .then((res) => res.json())
      .then((data) => {
        setTransactions(data.transactions);
        setTotalPages(data.totalPages);
        setTotal(data.total);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [page]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl">History Transaksi</CardTitle>
          <span className="text-sm text-muted-foreground">
            {total} total transaksi
          </span>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="py-8 text-center text-lg text-muted-foreground">
            Memuat...
          </div>
        ) : transactions.length === 0 ? (
          <p className="py-8 text-center text-lg text-muted-foreground">
            Belum ada transaksi
          </p>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Keterangan</TableHead>
                  <TableHead className="w-[100px]">Jenis</TableHead>
                  <TableHead className="w-[100px]">Tanggal</TableHead>
                  <TableHead className="w-[150px] text-right">Jumlah</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium text-lg">
                      {t.description}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          t.kas_type === 'koperasi' ? 'secondary' : 'outline'
                        }
                      >
                        {t.kas_type === 'koperasi' ? '🏦 Koperasi' : '🪙 Biasa'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(t.trans_date), 'dd MMM yyyy', {
                        locale: localeId,
                      })}
                    </TableCell>
                    <TableCell className="text-right">
                      <span
                        className={`font-bold tabular-nums ${
                          t.type === 'pemasukan'
                            ? 'text-emerald-500'
                            : 'text-rose-500'
                        }`}
                      >
                        {t.type === 'pemasukan' ? '+' : '-'}
                        {formatCurrency(Number(t.amount))}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Pagination */}
            <div className="mt-4 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Halaman {page} dari {totalPages}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="size-4" />
                  Prev
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Next
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
