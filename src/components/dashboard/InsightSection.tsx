'use client';

import React from 'react';
import { Sparkles } from 'lucide-react';
import type { PeriodInsightResult } from '@/lib/insight/insightTypes';
import { FinancialInsightCard } from './FinancialInsightCard';

interface InsightSectionProps {
  daily: PeriodInsightResult;
  weekly: PeriodInsightResult;
  monthly: PeriodInsightResult;
  onActionClick?: (targetTab: 'transactions' | 'bills' | 'goals') => void;
}

export function InsightSection({ daily, weekly, monthly, onActionClick }: InsightSectionProps) {
  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
        <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
          <Sparkles size={16} className="text-emerald-500 shrink-0" />
          <span>Wawasan Keuangan Anda</span>
        </h3>
        <span className="text-[11px] text-slate-400">
          Analisis Otomatis 3 Periode
        </span>
      </div>

      {/* Grid Responsif: 1 Kolom Mobile, 2 Kolom Tablet, 3 Kolom Desktop */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <FinancialInsightCard result={daily} onActionClick={onActionClick} />
        <FinancialInsightCard result={weekly} onActionClick={onActionClick} />
        <FinancialInsightCard
          result={monthly}
          onActionClick={onActionClick}
          className="sm:col-span-2 lg:col-span-1"
        />
      </div>
    </section>
  );
}
