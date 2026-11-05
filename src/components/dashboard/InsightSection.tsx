'use client';

import React from 'react';
import { CheckCircle2, Sparkles } from 'lucide-react';
import type {
  InsightPeriodType,
  PeriodInsightResult,
} from '@/lib/insight/insightTypes';
import { sortInsightsByPriority } from '@/lib/insight/insightPriority';
import { FinancialInsightCard } from './FinancialInsightCard';

interface InsightSectionProps {
  daily: PeriodInsightResult;
  weekly: PeriodInsightResult;
  monthly: PeriodInsightResult;
  onActionClick?: (targetTab: 'transactions' | 'bills' | 'goals') => void;
}

function getPeriodLabel(periodType: InsightPeriodType): string {
  switch (periodType) {
    case 'DAILY':
      return 'Harian';
    case 'WEEKLY':
      return 'Mingguan';
    case 'MONTHLY':
      return 'Bulanan';
  }
}

/**
 * Priority Inbox berbasis domain.
 *
 * Semua insight yang actionable dari ketiga periode dikumpulkan, lalu diurutkan
 * berdasarkan urgensi. Periode hanya menjadi metadata kecil di kartu; identitas
 * utama kartu adalah domain masalah. Status aman dan data belum cukup diringkas
 * menjadi satu baris agar tidak berebut perhatian dengan masalah nyata.
 */
export function InsightSection({ daily, weekly, monthly, onActionClick }: InsightSectionProps) {
  const periodResults = [daily, weekly, monthly];

  const allInsights = periodResults.flatMap((result) => {
    if (result.insights && result.insights.length > 0) return result.insights;
    return result.insight ? [result.insight] : [];
  });

  const rankedInsights = sortInsightsByPriority(allInsights);
  const stablePeriods = periodResults.filter((result) => result.state === 'NO_SIGNIFICANT_FINDING');
  const insufficientPeriods = periodResults.filter((result) => result.state === 'INSUFFICIENT_DATA');

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
        <h3 className="flex items-center gap-1.5 text-sm font-bold text-slate-800 dark:text-slate-200">
          <Sparkles size={16} className="shrink-0 text-emerald-500" />
          <span>Perlu Perhatian</span>
        </h3>
        <span className="text-[11px] text-slate-400">
          {rankedInsights.length > 0
            ? `${rankedInsights.length} hal perlu ditinjau`
            : 'Semua periode terkendali'}
        </span>
      </div>

      {rankedInsights.length > 0 ? (
        <div className="space-y-2.5">
          {rankedInsights.map((insight) => (
            <FinancialInsightCard
              key={insight.id}
              result={{
                periodType: insight.periodType,
                state: 'INSIGHT_AVAILABLE',
                insight,
                insights: [insight],
              }}
              onActionClick={onActionClick}
            />
          ))}
        </div>
      ) : (
        <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 dark:border-emerald-900/60 dark:bg-emerald-950/30">
          <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <div className="space-y-1">
            <p className="text-sm font-bold text-emerald-800 dark:text-emerald-200">
              Tidak ada hal mendesak
            </p>
            <p className="text-xs leading-relaxed text-emerald-700/80 dark:text-emerald-300/80">
              Arus kas, tagihan, dan pengeluaran Anda saat ini dalam batas aman.
            </p>
          </div>
        </div>
      )}

      {stablePeriods.length > 0 || insufficientPeriods.length > 0 ? (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-1 text-[11px] text-slate-400">
          {stablePeriods.map((result) => (
            <span key={`stable-${result.periodType}`} className="inline-flex items-center gap-1">
              <CheckCircle2 size={11} />
              {getPeriodLabel(result.periodType)} stabil
            </span>
          ))}
          {insufficientPeriods.map((result) => (
            <span key={`insufficient-${result.periodType}`} className="inline-flex items-center gap-1">
              <span aria-hidden="true">•</span>
              {getPeriodLabel(result.periodType)} menunggu data
            </span>
          ))}
        </div>
      ) : null}
    </section>
  );
}
