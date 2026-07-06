import { NextResponse } from 'next/server';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const totalPemasukan = (await db.query("SELECT COALESCE(SUM(amount),0) as total FROM transactions WHERE type='pemasukan'")).rows[0].total;
  const totalPengeluaran = (await db.query("SELECT COALESCE(SUM(amount),0) as total FROM transactions WHERE type='pengeluaran'")).rows[0].total;
  const saldo = totalPemasukan - totalPengeluaran;

  return NextResponse.json({
    saldo,
    pemasukan: totalPemasukan,
    pengeluaran: totalPengeluaran,
  });
}
