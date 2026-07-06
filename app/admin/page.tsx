import db from '@/lib/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Wallet, TrendingUp, TrendingDown, ArrowLeftRight, Eye } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export default async function DashboardPage() {
  const now = new Date();
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;

  // Total saldo
  const saldoResult = await db.query(
    "SELECT COALESCE(SUM(CASE WHEN type='pemasukan' THEN amount ELSE 0 END), 0) - COALESCE(SUM(CASE WHEN type='pengeluaran' THEN amount ELSE 0 END), 0) as saldo FROM transactions"
  );
  const totalSaldo = Number(saldoResult.rows[0]?.saldo) || 0;

  // Pemasukan bulan ini
  const pemasukanResult = await db.query(
    "SELECT COALESCE(SUM(amount), 0) as total, COUNT(*) as count FROM transactions WHERE type='pemasukan' AND trans_date >= $1",
    [monthStart]
  );
  const pemasukanBulanIni = Number(pemasukanResult.rows[0]?.total) || 0;
  const countPemasukan = Number(pemasukanResult.rows[0]?.count) || 0;

  // Pengeluaran bulan ini
  const pengeluaranResult = await db.query(
    "SELECT COALESCE(SUM(amount), 0) as total, COUNT(*) as count FROM transactions WHERE type='pengeluaran' AND trans_date >= $1",
    [monthStart]
  );
  const pengeluaranBulanIni = Number(pengeluaranResult.rows[0]?.total) || 0;
  const countPengeluaran = Number(pengeluaranResult.rows[0]?.count) || 0;

  // Per kas type breakdown
  async function getKasBreakdown(kasType: string) {
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
    getKasBreakdown('biasa'),
    getKasBreakdown('koperasi'),
  ]);

  return (
    <>
      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Saldo</CardTitle>
            <Wallet className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold tabular-nums ${
                totalSaldo >= 0 ? 'text-emerald-600' : 'text-rose-600'
              }`}
            >
              {formatCurrency(totalSaldo)}
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
              +{formatCurrency(pemasukanBulanIni)}
            </div>
            <p className="text-xs text-muted-foreground">
              {countPemasukan} transaksi
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
              -{formatCurrency(pengeluaranBulanIni)}
            </div>
            <p className="text-xs text-muted-foreground">
              {countPengeluaran} transaksi
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Breakdown Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              🪙 Kas Biasa
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Saldo</span>
              <span
                className={`font-bold tabular-nums ${
                  biasa.saldo >= 0 ? 'text-emerald-600' : 'text-rose-600'
                }`}
              >
                {formatCurrency(biasa.saldo)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Pemasukan bulan ini
              </span>
              <span className="font-bold tabular-nums text-emerald-600">
                +{formatCurrency(biasa.pemasukan)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Pengeluaran bulan ini
              </span>
              <span className="font-bold tabular-nums text-rose-600">
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
              <span className="text-sm text-muted-foreground">Saldo</span>
              <span
                className={`font-bold tabular-nums ${
                  koperasi.saldo >= 0 ? 'text-emerald-600' : 'text-rose-600'
                }`}
              >
                {formatCurrency(koperasi.saldo)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Pemasukan bulan ini
              </span>
              <span className="font-bold tabular-nums text-emerald-600">
                +{formatCurrency(koperasi.pemasukan)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Pengeluaran bulan ini
              </span>
              <span className="font-bold tabular-nums text-rose-600">
                -{formatCurrency(koperasi.pengeluaran)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button render={<Link href="/admin/transaksi" />} className="gap-2">
          <ArrowLeftRight className="size-4" />
          Tambah Transaksi
        </Button>
        <Button
          render={<Link href="/admin/transaksi" />}
          variant="outline"
          className="gap-2"
        >
          <Eye className="size-4" />
          Lihat Semua
        </Button>
      </div>
    </>
  );
}
