'use client';

import React from 'react';
import { ShieldCheck, Wallet, ArrowDownRight, ArrowUpRight, Target } from 'lucide-react';

interface HeroProps {
  safeToSpend: number;
  currentBalance: number;
  unpaidBills: number;
  totalAllocatedGoals?: number;
  monthlyIncome: number;
  monthlyExpense: number;
  netCashFlow: number;
  selectedPeriod?: string;
  isLoading?: boolean;
}

export function SafeToSpendHero({ safeToSpend, currentBalance, unpaidBills, totalAllocatedGoals = 0, monthlyIncome, monthlyExpense, netCashFlow, selectedPeriod, isLoading = false }: HeroProps) {
  const isNegative = !isLoading && safeToSpend < 0;
  const formatAmount = (amount: number) => isLoading ? '—' : `Rp ${amount.toLocaleString('id-ID')}`;

  const periodLabel = selectedPeriod ? new Date(`${selectedPeriod}-01T00:00:00`).toLocaleDateString('id-ID', { month: 'short' }) : 'Bulan Ini';

  return (
    <div className="space-y-4">
      {/* Safe to Spend Card */}
      <div className={`${isNegative ? 'bg-rose-950 border-rose-800/60' : 'bg-emerald-950 border-emerald-800/40'} bg-gradient-to-br to-slate-900 text-white p-6 rounded-2xl border shadow-sm relative overflow-hidden`}>
        <div className={`flex items-center gap-2 ${isNegative ? 'text-rose-300' : 'text-emerald-400'} text-xs font-semibold tracking-wider uppercase`}>
          <ShieldCheck size={16} />
          <span>Safe-to-Spend</span>
        </div>

        <div className="mt-3">
          <h2 className={`text-3xl md:text-4xl lg:text-5xl font-extrabold font-mono tracking-tight ${isNegative ? 'text-rose-200' : ''}`}>
            {formatAmount(safeToSpend)}
          </h2>
          <p className="text-slate-400 text-xs mt-1">
            Saldo setelah dikurangi seluruh tagihan belum dibayar dan dana pos target tabungan.
          </p>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-700/70 grid grid-cols-3 gap-2 text-xs">
          <div>
            <span className="text-slate-400 flex items-center gap-1">
              <Wallet size={13} /> Saldo Riil
            </span>
            <span className="font-mono font-semibold text-slate-200 block truncate">
              {formatAmount(currentBalance)}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block truncate">Tagihan</span>
            <span className="font-mono font-semibold text-slate-200 block truncate">
              {formatAmount(unpaidBills)}
            </span>
          </div>
          <div className="text-right">
            <span className="text-slate-400 flex items-center justify-end gap-1 truncate">
              <Target size={13} /> Pos Target
            </span>
            <span className="font-mono font-semibold text-emerald-400 block truncate">
              {formatAmount(totalAllocatedGoals)}
            </span>
          </div>
        </div>
      </div>

      {/* Cash Flow ringkasan */}
      <div className="space-y-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Cash Flow {selectedPeriod ? `(${new Date(`${selectedPeriod}-01T00:00:00`).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })})` : ''}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
            <ArrowDownRight size={14} className="text-emerald-500" />
            <span>Pemasukan ({periodLabel})</span>
          </div>
          <p className="text-base font-bold font-mono text-emerald-600 dark:text-emerald-400">
            +Rp {monthlyIncome.toLocaleString('id-ID')}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
            <ArrowUpRight size={14} className="text-rose-500" />
            <span>Pengeluaran ({periodLabel})</span>
          </div>
          <p className="text-base font-bold font-mono text-rose-600 dark:text-rose-400">
            -Rp {monthlyExpense.toLocaleString('id-ID')}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
            <Wallet size={14} className={netCashFlow >= 0 ? 'text-emerald-500' : 'text-rose-500'} />
            <span>Net Cash Flow ({periodLabel})</span>
          </div>
          <p className={`text-base font-bold font-mono ${netCashFlow >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
            {netCashFlow > 0 ? '+' : ''}Rp {netCashFlow.toLocaleString('id-ID')}
          </p>
        </div>
        </div>
      </div>
    </div>
  );
}
