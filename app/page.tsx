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

async function fetchKasData(kasTypeFilter: string, kasTypeParams: any[]): Promise<DataByType> {
  const typeCondition = kasTypeFilter;
  const params = kasTypeParams;

  const totalPemasukan = (await db.query(
    `SELECT COALESCE(SUM(amount),0) as total FROM transactions WHERE type='pemasukan' ${typeCondition}`,
    params
  )).rows[0].total;

  const totalPengeluaran = (await db.query(
    `SELECT COALESCE(SUM(amount),0) as total FROM transactions WHERE type='pengeluaran' ${typeCondition}`,
    params
  )).rows[0].total;

  const saldo = totalPemasukan - totalPengeluaran;

  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;

  const todayIncome = (await db.query(
    `SELECT COALESCE(SUM(amount),0) as total FROM transactions WHERE type='pemasukan' AND trans_date=$1 ${typeCondition}`,
    [today, ...params]
  )).rows[0].total;

  const todayExpense = (await db.query(
    `SELECT COALESCE(SUM(amount),0) as total FROM transactions WHERE type='pengeluaran' AND trans_date=$1 ${typeCondition}`,
    [today, ...params]
  )).rows[0].total;

  const monthIncome = (await db.query(
    `SELECT COALESCE(SUM(amount),0) as total FROM transactions WHERE type='pemasukan' AND trans_date>=$1 ${typeCondition}`,
    [monthStart, ...params]
  )).rows[0].total;

  const monthExpense = (await db.query(
    `SELECT COALESCE(SUM(amount),0) as total FROM transactions WHERE type='pengeluaran' AND trans_date>=$1 ${typeCondition}`,
    [monthStart, ...params]
  )).rows[0].total;

  const transactions = (await db.query(
    `SELECT * FROM transactions WHERE 1=1 ${typeCondition} ORDER BY trans_date DESC, created_at DESC LIMIT 10`,
    params
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
    fetchKasData('', []),
    fetchKasData('AND kas_type=$1', ['biasa']),
    fetchKasData('AND kas_type=$1', ['koperasi']),
  ]);

  return (
    <DashboardClient
      allData={allData}
      biasaData={biasaData}
      koperasiData={koperasiData}
    />
  );
}
