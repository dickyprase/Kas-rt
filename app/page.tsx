import db from '@/lib/db';
import DashboardClient from './components/DashboardClient';

export const dynamic = 'force-dynamic';

interface DataByType {
  saldo: number;
  todayIncome: number;
  todayExpense: number;
  monthIncome: number;
  monthExpense: number;
  totalPemasukan: number;
  totalPengeluaran: number;
  transactions: any[];
}

async function fetchKasData(kasType: string | null): Promise<DataByType> {
  const kasParam = kasType ? [kasType] : [];
  const kasFilter = kasType ? 'AND kas_type=$1' : '';

  const totalPemasukan = (await db.query(
    `SELECT COALESCE(SUM(amount),0) as total FROM transactions WHERE type='pemasukan' ${kasFilter}`,
    kasParam
  )).rows[0].total;

  const totalPengeluaran = (await db.query(
    `SELECT COALESCE(SUM(amount),0) as total FROM transactions WHERE type='pengeluaran' ${kasFilter}`,
    kasParam
  )).rows[0].total;

  const saldo = totalPemasukan - totalPengeluaran;

  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;

  // For queries with trans_date + kas_type, kas_type is $2
  const todayParams = kasType ? [today, kasType] : [today];
  const todayKasFilter = kasType ? 'AND kas_type=$2' : '';

  const todayIncome = (await db.query(
    `SELECT COALESCE(SUM(amount),0) as total FROM transactions WHERE type='pemasukan' AND trans_date::date=$1 ${todayKasFilter}`,
    todayParams
  )).rows[0].total;

  const todayExpense = (await db.query(
    `SELECT COALESCE(SUM(amount),0) as total FROM transactions WHERE type='pengeluaran' AND trans_date::date=$1 ${todayKasFilter}`,
    todayParams
  )).rows[0].total;

  const monthParams = kasType ? [monthStart, kasType] : [monthStart];

  const monthIncome = (await db.query(
    `SELECT COALESCE(SUM(amount),0) as total FROM transactions WHERE type='pemasukan' AND trans_date::date>=$1 ${todayKasFilter}`,
    monthParams
  )).rows[0].total;

  const monthExpense = (await db.query(
    `SELECT COALESCE(SUM(amount),0) as total FROM transactions WHERE type='pengeluaran' AND trans_date::date>=$1 ${todayKasFilter}`,
    monthParams
  )).rows[0].total;

  const transactions = (await db.query(
    `SELECT * FROM transactions WHERE 1=1 ${kasFilter} ORDER BY trans_date DESC, created_at DESC LIMIT 10`,
    kasParam
  )).rows;

  return {
    saldo,
    todayIncome,
    todayExpense,
    monthIncome,
    monthExpense,
    totalPemasukan,
    totalPengeluaran,
    transactions,
  };
}

export default async function Home() {
  const [allData, biasaData, koperasiData] = await Promise.all([
    fetchKasData(null),
    fetchKasData('biasa'),
    fetchKasData('koperasi'),
  ]);

  return (
    <DashboardClient
      allData={allData}
      biasaData={biasaData}
      koperasiData={koperasiData}
    />
  );
}
