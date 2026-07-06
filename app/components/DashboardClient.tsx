'use client';

import { useState } from 'react';
import ThemeToggle from './ThemeToggle';

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

export default function DashboardClient({
  allData,
  biasaData,
  koperasiData,
}: {
  allData: DataByType;
  biasaData: DataByType;
  koperasiData: DataByType;
}) {
  const [activeTab, setActiveTab] = useState<'semua' | 'biasa' | 'koperasi'>('semua');

  const data = activeTab === 'semua' ? allData : activeTab === 'biasa' ? biasaData : koperasiData;

  const tabs = [
    { key: 'semua' as const, label: '📊 Semua', emoji: '📊' },
    { key: 'biasa' as const, label: '💰 Kas Biasa', emoji: '💰' },
    { key: 'koperasi' as const, label: '🏛️ Kas Koperasi', emoji: '🏛️' },
  ];

  return (
    <div className="min-h-screen bg-[--background] p-4 md:p-8">
      <meta httpEquiv="refresh" content="30" />
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-center flex-1">📊 Kas</h1>
          <ThemeToggle />
        </div>

        {/* Kas Type Tabs */}
        <div className="flex gap-2 mb-6 bg-[--card-bg] rounded-xl p-1 border border-[--card-border]">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 py-2.5 rounded-lg font-medium transition text-sm ${
                activeTab === tab.key
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-[--muted-text] hover:bg-[--card-bg-secondary]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Saldo */}
        <div className={`text-center p-6 rounded-2xl mb-6 ${
          data.saldo >= 0
            ? 'bg-green-950 border border-green-800 dark:bg-green-950 dark:border-green-800'
            : 'bg-red-950 border border-red-800 dark:bg-red-950 dark:border-red-800'
        }`}>
          <p className="text-[--muted-text] text-sm mb-1">Saldo</p>
          <p className={`text-4xl md:text-5xl font-bold ${data.saldo >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {formatCurrency(data.saldo)}
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-[--card-bg] rounded-xl p-4 border border-[--card-border]">
            <p className="text-xs text-[--muted-text]">Pemasukan Hari Ini</p>
            <p className="text-lg font-bold text-green-400">{formatCurrency(data.todayIncome)}</p>
          </div>
          <div className="bg-[--card-bg] rounded-xl p-4 border border-[--card-border]">
            <p className="text-xs text-[--muted-text]">Pengeluaran Hari Ini</p>
            <p className="text-lg font-bold text-red-400">{formatCurrency(data.todayExpense)}</p>
          </div>
          <div className="bg-[--card-bg] rounded-xl p-4 border border-[--card-border]">
            <p className="text-xs text-[--muted-text]">Pemasukan Bulan Ini</p>
            <p className="text-lg font-bold text-green-400">{formatCurrency(data.monthIncome)}</p>
          </div>
          <div className="bg-[--card-bg] rounded-xl p-4 border border-[--card-border]">
            <p className="text-xs text-[--muted-text]">Pengeluaran Bulan Ini</p>
            <p className="text-lg font-bold text-red-400">{formatCurrency(data.monthExpense)}</p>
          </div>
        </div>

        {/* Total */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-[--card-bg] rounded-xl p-4 border border-[--card-border]">
            <p className="text-xs text-[--muted-text]">Total Pemasukan</p>
            <p className="text-xl font-bold text-green-400">{formatCurrency(data.totalPemasukan)}</p>
          </div>
          <div className="bg-[--card-bg] rounded-xl p-4 border border-[--card-border]">
            <p className="text-xs text-[--muted-text]">Total Pengeluaran</p>
            <p className="text-xl font-bold text-red-400">{formatCurrency(data.totalPengeluaran)}</p>
          </div>
        </div>

        {/* Last 10 Transactions */}
        <div className="bg-[--card-bg] rounded-xl border border-[--card-border] overflow-hidden">
          <div className="p-4 border-b border-[--card-border]">
            <h2 className="font-semibold">10 Transaksi Terakhir</h2>
          </div>
          <div className="divide-y divide-[--divider]">
            {data.transactions.length === 0 && (
              <p className="p-4 text-[--muted-text] text-center">Belum ada transaksi</p>
            )}
            {data.transactions.map((t) => (
              <div key={t.id} className="p-4 flex justify-between items-center">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{t.description}</p>
                    {activeTab === 'semua' && (
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        t.kas_type === 'koperasi'
                          ? 'bg-purple-900 text-purple-300 dark:bg-purple-900 dark:text-purple-300'
                          : 'bg-blue-900 text-blue-300 dark:bg-blue-900 dark:text-blue-300'
                      }`}>
                        {t.kas_type === 'koperasi' ? '🏛️' : '💰'}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[--muted-text]">{t.trans_date}</p>
                </div>
                <p className={`font-bold ${t.type === 'pemasukan' ? 'text-green-400' : 'text-red-400'}`}>
                  {t.type === 'pemasukan' ? '+' : '-'}{formatCurrency(t.amount)}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center mt-6">
          <a href="/login" className="text-sm text-[--muted-text] hover:text-[--foreground]">Admin Login</a>
        </div>
      </div>
    </div>
  );
}
