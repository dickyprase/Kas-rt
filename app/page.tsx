import db from '@/lib/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { TrendingUp, TrendingDown, Wallet, Activity } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

export const dynamic = 'force-dynamic';

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export default async function PublicPage() {
  // Get app name
  let appName = 'Kas RT';
  try {
    const { rows } = await db.query(
      "SELECT value FROM settings WHERE key = 'app_name'"
    );
    if (rows.length > 0) appName = rows[0].value;
  } catch {
    // use default
  }

  const now = new Date();
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;

  // Per kas type
  async function getKasData(kasType: string) {
    const saldoRes = await db.query(
      "SELECT COALESCE(SUM(CASE WHEN type='pemasukan' THEN amount ELSE 0 END), 0) - COALESCE(SUM(CASE WHEN type='pengeluaran' THEN amount ELSE 0 END), 0) as saldo FROM transactions WHERE kas_type=$1",
      [kasType]
    );
    const pemasukanRes = await db.query(
      "SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE type='pemasukan' AND kas_type=$1 AND trans_date >= $2",
      [kasType, monthStart]
    );
    const pengeluaranRes = await db.query(
      "SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE type='pengeluaran' AND kas_type=$1 AND trans_date >= $2",
      [kasType, monthStart]
    );
    return {
      saldo: Number(saldoRes.rows[0]?.saldo) || 0,
      pemasukan: Number(pemasukanRes.rows[0]?.total) || 0,
      pengeluaran: Number(pengeluaranRes.rows[0]?.total) || 0,
    };
  }

  const [biasa, koperasi] = await Promise.all([
    getKasData('biasa'),
    getKasData('koperasi'),
  ]);

  // 5 transaksi terbaru
  const { rows: recentTransactions } = await db.query(
    'SELECT * FROM transactions ORDER BY trans_date DESC, created_at DESC LIMIT 5'
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl space-y-8 p-4 py-8 md:p-8">
        {/* Hero */}
        <div className="space-y-2 text-center">
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
            📊 {appName}
          </h1>
          <p className="text-lg text-muted-foreground">Dashboard Keuangan</p>
          <div className="flex items-center justify-center gap-1.5">
            <Activity className="size-4 text-emerald-500 animate-pulse" />
            <span className="text-sm text-muted-foreground">Live</span>
          </div>
        </div>
        <Separator />

        {/* Kas Cards */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                🪙 Kas Biasa
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-base text-muted-foreground">Saldo</span>
                <span
                  className={`text-2xl font-bold tabular-nums ${
                    biasa.saldo >= 0 ? 'text-emerald-600' : 'text-rose-600'
                  }`}
                >
                  {formatCurrency(biasa.saldo)}
                </span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-base text-muted-foreground">
                  <TrendingUp className="size-4 text-emerald-500" />
                  Pemasukan
                </span>
                <span className="text-lg font-bold tabular-nums text-emerald-600">
                  +{formatCurrency(biasa.pemasukan)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-base text-muted-foreground">
                  <TrendingDown className="size-4 text-rose-500" />
                  Pengeluaran
                </span>
                <span className="text-lg font-bold tabular-nums text-rose-600">
                  -{formatCurrency(biasa.pengeluaran)}
                </span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                🏦 Kas Koperasi
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-base text-muted-foreground">Saldo</span>
                <span
                  className={`text-2xl font-bold tabular-nums ${
                    koperasi.saldo >= 0 ? 'text-emerald-600' : 'text-rose-600'
                  }`}
                >
                  {formatCurrency(koperasi.saldo)}
                </span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-base text-muted-foreground">
                  <TrendingUp className="size-4 text-emerald-500" />
                  Pemasukan
                </span>
                <span className="text-lg font-bold tabular-nums text-emerald-600">
                  +{formatCurrency(koperasi.pemasukan)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-base text-muted-foreground">
                  <TrendingDown className="size-4 text-rose-500" />
                  Pengeluaran
                </span>
                <span className="text-lg font-bold tabular-nums text-rose-600">
                  -{formatCurrency(koperasi.pengeluaran)}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">5 Transaksi Terbaru</CardTitle>
          </CardHeader>
          <CardContent>
            {recentTransactions.length === 0 ? (
              <p className="py-8 text-center text-lg text-muted-foreground">
                Belum ada transaksi
              </p>
            ) : (
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
                  {recentTransactions.map((t: any) => (
                    <TableRow key={t.id}>
                      <TableCell className="font-medium text-base">
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
                      <TableCell className="text-base text-muted-foreground">
                        {format(new Date(t.trans_date), "dd MMM yyyy", { locale: localeId })}
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
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-base text-muted-foreground">
          <p>
            © {now.getFullYear()} {appName} ·{' '}
            <Link
              href="/admin"
              className="underline underline-offset-4 hover:text-foreground transition-colors"
            >
              Admin
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
