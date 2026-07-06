'use client';

import { useState } from 'react';
import ThemeToggle from './ThemeToggle';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { TrendingUp, TrendingDown, Wallet, Calendar, CalendarDays, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';

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
  kas_type: string;
}

interface DataByType {
  saldo: number;
  todayIncome: number;
  todayExpense: number;
  monthIncome: number;
  monthExpense: number;
  totalPemasukan: number;
  totalPengeluaran: number;
  transactions: Transaction[];
}

function SummaryCard({ label, value, icon: Icon, variant }: {
  label: string;
  value: number;
  icon: React.ElementType;
  variant: 'income' | 'expense';
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3">
        <div className={`flex size-10 items-center justify-center rounded-lg ${
          variant === 'income' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-destructive/10 text-destructive'
        }`}>
          <Icon className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs text-muted-foreground truncate">{label}</p>
          <p className={`text-sm font-bold tabular-nums ${
            variant === 'income' ? 'text-emerald-500' : 'text-destructive'
          }`}>
            {formatCurrency(value)}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardClient({
  allData,
  biasaData,
  koperasiData,
}: {
  allData: DataByType;
  biasaData: DataByType;
  koperasiData: DataByType;
}) {
  const [activeTab, setActiveTab] = useState('semua');

  const dataMap: Record<string, DataByType> = {
    semua: allData,
    biasa: biasaData,
    koperasi: koperasiData,
  };
  const data = dataMap[activeTab];

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <meta httpEquiv="refresh" content="30" />
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">📊 Kas</h1>
            <p className="text-sm text-muted-foreground">Dashboard Keuangan</p>
          </div>
          <ThemeToggle />
        </div>

        <Separator />

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full">
            <TabsTrigger value="semua" className="flex-1">📊 Semua</TabsTrigger>
            <TabsTrigger value="biasa" className="flex-1">💰 Kas Biasa</TabsTrigger>
            <TabsTrigger value="koperasi" className="flex-1">🏛️ Kas Koperasi</TabsTrigger>
          </TabsList>

          {(['semua', 'biasa', 'koperasi'] as const).map((tab) => (
            <TabsContent key={tab} value={tab} className="space-y-6">
              {/* Saldo */}
              <Card className={data.saldo >= 0
                ? 'border-emerald-500/20 bg-emerald-500/5'
                : 'border-destructive/20 bg-destructive/5'
              }>
                <CardContent className="flex flex-col items-center gap-1 py-6">
                  <p className="text-sm text-muted-foreground">Saldo</p>
                  <p className={`bg-gradient-to-r bg-clip-text text-4xl font-bold tabular-nums md:text-5xl ${
                    data.saldo >= 0
                      ? 'from-emerald-400 to-emerald-600 text-emerald-500'
                      : 'from-red-400 to-red-600 text-destructive'
                  }`}>
                    {formatCurrency(data.saldo)}
                  </p>
                </CardContent>
              </Card>

              {/* Summary Cards */}
              <div className="grid grid-cols-2 gap-3">
                <SummaryCard label="Pemasukan Hari Ini" value={data.todayIncome} icon={TrendingUp} variant="income" />
                <SummaryCard label="Pengeluaran Hari Ini" value={data.todayExpense} icon={TrendingDown} variant="expense" />
                <SummaryCard label="Pemasukan Bulan Ini" value={data.monthIncome} icon={Calendar} variant="income" />
                <SummaryCard label="Pengeluaran Bulan Ini" value={data.monthExpense} icon={CalendarDays} variant="expense" />
              </div>

              {/* Total */}
              <div className="grid grid-cols-2 gap-3">
                <SummaryCard label="Total Pemasukan" value={data.totalPemasukan} icon={ArrowUpCircle} variant="income" />
                <SummaryCard label="Total Pengeluaran" value={data.totalPengeluaran} icon={ArrowDownCircle} variant="expense" />
              </div>

              <Separator />

              {/* Transactions Table */}
              <Card>
                <CardHeader>
                  <CardTitle>10 Transaksi Terakhir</CardTitle>
                </CardHeader>
                <CardContent>
                  {data.transactions.length === 0 ? (
                    <p className="py-8 text-center text-muted-foreground">Belum ada transaksi</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Keterangan</TableHead>
                          {activeTab === 'semua' && <TableHead className="w-[100px]">Jenis</TableHead>}
                          <TableHead className="w-[100px]">Tanggal</TableHead>
                          <TableHead className="w-[150px] text-right">Jumlah</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.transactions.map((t) => (
                          <TableRow key={t.id}>
                            <TableCell className="font-medium">{t.description}</TableCell>
                            {activeTab === 'semua' && (
                              <TableCell>
                                <Badge variant={t.kas_type === 'koperasi' ? 'secondary' : 'outline'}>
                                  {t.kas_type === 'koperasi' ? '🏛️ Koperasi' : '💰 Biasa'}
                                </Badge>
                              </TableCell>
                            )}
                            <TableCell className="text-muted-foreground">{t.trans_date}</TableCell>
                            <TableCell className="text-right">
                              <span className={`font-bold tabular-nums ${
                                t.type === 'pemasukan' ? 'text-emerald-500' : 'text-destructive'
                              }`}>
                                {t.type === 'pemasukan' ? '+' : '-'}{formatCurrency(t.amount)}
                              </span>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>

        <div className="text-center">
          <a href="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Admin Login
          </a>
        </div>
      </div>
    </div>
  );
}
