'use client';

import React from 'react';
import { ShieldCheck, Wallet, ArrowDownRight, ArrowUpRight } from 'lucide-react';

interface HeroProps {
  safeToSpend: number;
  currentBalance: number;
  monthlyIncome: number;
  monthlyExpense: number;
}

export function SafeToSpendHero({ safeToSpend, currentBalance, monthlyIncome, monthlyExpense }: HeroProps) {
  return (
    <div className="space-y-4">
      {/* Safe to Spend Card */}
      <div className="bg-gradient-to-br from-emerald-950 to-slate-900 text-white p-6 rounded-2xl border border-emerald-800/40 shadow-sm relative overflow-hidden">
        <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold tracking-wider uppercase">
          <ShieldCheck size={16} />
          <span>Safe-to-Spend</span>
        </div>

        <div className="mt-3">
          <h2 className="text-3xl md:text-4xl font-extrabold font-mono tracking-tight">
            Rp {safeToSpend.toLocaleString('id-ID')}
          </h2>
          <p className="text-slate-400 text-xs mt-1">
            Uang aman yang siap digunakan setelah memperhitungkan perkiraan pengeluaran.
          </p>
        </div>

        <div className="mt-6 pt-4 border-t border-emerald-900/60 flex justify-between items-center text-xs">
          <span className="text-slate-400 flex items-center gap-1.5">
            <Wallet size={14} /> Total Saldo Real:
          </span>
          <span className="font-mono font-semibold text-slate-200">
            Rp {currentBalance.toLocaleString('id-ID')}
          </span>
        </div>
      </div>

      {/* Income vs Expense Ringkasan */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
            <ArrowDownRight size={14} className="text-emerald-500" />
            <span>Income Bulan Ini</span>
          </div>
          <p className="text-base font-bold font-mono text-emerald-600 dark:text-emerald-400">
            +Rp {monthlyIncome.toLocaleString('id-ID')}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
            <ArrowUpRight size={14} className="text-rose-500" />
            <span>Expense Bulan Ini</span>
          </div>
          <p className="text-base font-bold font-mono text-rose-600 dark:text-rose-400">
            -Rp {monthlyExpense.toLocaleString('id-ID')}
          </p>
        </div>
      </div>
    </div>
  );
}
