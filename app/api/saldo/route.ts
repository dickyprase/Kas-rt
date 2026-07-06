import { NextResponse } from 'next/server';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const kasType = searchParams.get('type');

  let typeCondition = '';
  let params: any[] = [];

  if (kasType && (kasType === 'biasa' || kasType === 'koperasi')) {
    typeCondition = 'AND kas_type=$1';
    params = [kasType];
  }

  const totalPemasukan = (await db.query(
    `SELECT COALESCE(SUM(amount),0) as total FROM transactions WHERE type='pemasukan' ${typeCondition}`,
    params
  )).rows[0].total;

  const totalPengeluaran = (await db.query(
    `SELECT COALESCE(SUM(amount),0) as total FROM transactions WHERE type='pengeluaran' ${typeCondition}`,
    params
  )).rows[0].total;

  const saldo = totalPemasukan - totalPengeluaran;

  return NextResponse.json({
    saldo,
    pemasukan: totalPemasukan,
    pengeluaran: totalPengeluaran,
    kas_type: kasType || 'all',
  });
}
