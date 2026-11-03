'use client';

import React from 'react';
import {
  AlertTriangle,
  AlertCircle,
  Sparkles,
  Info,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import type {
  FinancialInsight,
  PeriodInsightResult,
  InsightUrgency,
  InsightPeriodType,
} from '@/lib/insight/insightTypes';

interface FinancialInsightCardProps {
  result: PeriodInsightResult;
  onActionClick?: (targetTab: 'transactions' | 'bills' | 'goals') => void;
  className?: string;
}

interface ContextItem {
  label: string;
  value: string;
}

const PERIOD_LABEL_CLASS =
  'text-[11px] font-bold uppercase tracking-wider text-slate-400';
const BADGE_BASE_CLASS =
  'inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold';
const TITLE_CLASS =
  'break-words text-sm font-bold leading-snug text-slate-900 dark:text-slate-100';
const EYEBROW_CLASS =
  'break-words text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400';
const DESCRIPTION_CLASS =
  'break-words text-xs leading-relaxed text-slate-600 dark:text-slate-300';
const HERO_CLASS =
  'break-words font-mono text-2xl font-extrabold tabular-nums tracking-tight sm:text-[26px]';

const WEEKLY_BILLS_METRIC_TITLE = 'Beban Tagihan 7 Hari ke Depan';

const CONTEXT_LABEL_ALIASES: Record<string, string> = {
  'saldo riil': 'Saldo Riil Saat Ini',
  'bulan ini': 'Bulan Ini',
  'bulan lalu': 'Bulan Lalu',
};

function getPeriodBadgeLabel(periodType: InsightPeriodType): string {
  switch (periodType) {
    case 'DAILY':
      return 'Harian';
    case 'WEEKLY':
      return 'Mingguan';
    case 'MONTHLY':
      return 'Bulanan';
  }
}

function getUrgencyBadge(urgency: InsightUrgency) {
  switch (urgency) {
    case 'CRITICAL':
      return {
        label: 'Kritis',
        bg: 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-900',
        icon: AlertTriangle,
      };
    case 'WARNING':
      return {
        label: 'Perhatian',
        bg: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900',
        icon: AlertCircle,
      };
    case 'OPPORTUNITY':
      return {
        label: 'Peluang',
        bg: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900',
        icon: Sparkles,
      };
    case 'HYGIENE':
      return {
        label: 'Kerapian',
        bg: 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-900',
        icon: Info,
      };
    case 'NEUTRAL':
    default:
      return {
        label: 'Info',
        bg: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
        icon: Info,
      };
  }
}

function getHeroTone(urgency: InsightUrgency): string {
  switch (urgency) {
    case 'CRITICAL':
      return 'text-red-500 dark:text-red-400';
    case 'WARNING':
      return 'text-amber-500 dark:text-amber-400';
    case 'OPPORTUNITY':
      return 'text-emerald-600 dark:text-emerald-400';
    case 'HYGIENE':
      return 'text-indigo-500 dark:text-indigo-400';
    case 'NEUTRAL':
    default:
      return 'text-slate-800 dark:text-slate-100';
  }
}

/**
 * Memecah string evidence berformat "Label: Nilai" menjadi pasangan konteks.
 * Label dinormalisasi agar nama konteks konsisten antar-kartu.
 */
function splitLabeledValue(raw?: string): ContextItem | null {
  if (!raw) return null;

  const separatorIndex = raw.indexOf(':');
  if (separatorIndex <= 0) return null;

  const rawLabel = raw.slice(0, separatorIndex).trim();
  const value = raw.slice(separatorIndex + 1).trim();
  if (!rawLabel || !value) return null;

  return {
    label: CONTEXT_LABEL_ALIASES[rawLabel.toLowerCase()] ?? rawLabel,
    value,
  };
}

function parsePercentage(raw?: string): number | null {
  if (!raw) return null;

  const match = raw.match(/(\d+)%/);
  if (!match) return null;

  const value = Number(match[1]);
  return Number.isFinite(value) ? value : null;
}

function parseBillCount(raw?: string): number | null {
  if (!raw) return null;

  const match = raw.match(/(\d+)\s+tagihan/i);
  if (!match) return null;

  const value = Number(match[1]);
  return Number.isFinite(value) ? value : null;
}

function getSurgeCategory(title: string, observation: string): string | null {
  const fromTitle = /^Lonjakan Pengeluaran:\s*(.+)$/.exec(title)?.[1];
  const fromObservation = /kategori\s+"([^"]+)"/i.exec(observation)?.[1];

  return fromTitle?.trim() || fromObservation?.trim() || null;
}

/** Mengambil nominal selisih tanpa suffix persentase, mis. "+Rp 200.000 (+200%)". */
function getDiffHighlight(diff?: string): string | null {
  if (!diff) return null;

  const [amount] = diff.split('(');
  return amount.trim() || null;
}

interface InsightCardShellProps {
  periodLabel: string;
  badge: React.ReactNode;
  muted?: boolean;
  footer?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}

function InsightCardShell({
  periodLabel,
  badge,
  muted = false,
  footer,
  className = '',
  children,
}: InsightCardShellProps) {
  return (
    <article
      className={[
        'flex h-full min-w-0 flex-col rounded-2xl border bg-white p-4 shadow-sm dark:bg-slate-900',
        muted
          ? 'border-dashed border-slate-200 dark:border-slate-800'
          : 'border-slate-200 transition hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <header className="flex items-start justify-between gap-2">
        <span className={PERIOD_LABEL_CLASS}>{periodLabel}</span>
        {badge}
      </header>

      <div className="mt-3 flex min-w-0 flex-1 flex-col gap-3">{children}</div>

      {footer ? (
        <div className="mt-auto flex w-full items-center pt-3">{footer}</div>
      ) : null}
    </article>
  );
}

function ComparisonGrid({ items }: { items: ContextItem[] }) {
  if (items.length === 0) return null;

  return (
    <div
      className={[
        'grid gap-3 rounded-xl bg-slate-100 p-2.5 dark:bg-slate-800/50',
        items.length > 1 ? 'grid-cols-2' : 'grid-cols-1',
      ].join(' ')}
    >
      {items.map((item) => (
        <div key={`${item.label}-${item.value}`} className="min-w-0">
          <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
            {item.label}
          </p>
          <p className="mt-0.5 break-words font-mono text-xs font-bold tabular-nums text-slate-800 dark:text-slate-100 sm:text-[13px]">
            {item.value}
          </p>
        </div>
      ))}
    </div>
  );
}

function ProgressBar({ percent, label }: { percent: number; label: string }) {
  const clamped = Math.min(100, Math.max(0, percent));

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2 text-[11px]">
        <span className="text-slate-500 dark:text-slate-400">{label}</span>
        <span className="font-mono font-semibold tabular-nums text-amber-600 dark:text-amber-400">
          {percent}%
        </span>
      </div>
      <div
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
        className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800/50"
      >
        <div
          className="h-full rounded-full bg-amber-500"
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}

function RecommendationCallout({ recommendation }: { recommendation: string }) {
  return (
    <div className="rounded-r-lg border-l-2 border-amber-500 bg-amber-500/10 px-3 py-2">
      <p className="break-words text-[11px] leading-relaxed text-amber-800 dark:text-amber-200">
        <span aria-hidden="true">💡 </span>
        {recommendation}
      </p>
    </div>
  );
}

function ActionButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-slate-800 py-2.5 text-xs font-semibold text-white transition hover:bg-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900"
    >
      <span>{label}</span>
      <ArrowRight size={13} className="shrink-0" />
    </button>
  );
}

function InsightContent({ insight }: { insight: FinancialInsight }) {
  const {
    id,
    urgency,
    title,
    observation,
    evidence,
    interpretation,
    recommendation,
  } = insight;

  // A. Harian — defisit Safe-to-Spend.
  if (id === 'daily-safe-to-spend-critical') {
    const saldoRiil = splitLabeledValue(evidence.previousValue);
    const tagihanTarget = splitLabeledValue(evidence.diff);

    return (
      <>
        <div className="space-y-1">
          <p className={EYEBROW_CLASS}>{title}</p>
          <p className={`${HERO_CLASS} ${getHeroTone(urgency)}`}>
            {evidence.currentValue}
          </p>
          <p className={DESCRIPTION_CLASS}>{interpretation}</p>
        </div>

        <ComparisonGrid
          items={[saldoRiil, tagihanTarget].filter(
            (item): item is ContextItem => item !== null
          )}
        />

        <RecommendationCallout recommendation={recommendation} />
      </>
    );
  }

  // B. Mingguan — porsi beban tagihan 7 hari ke depan.
  if (id === 'weekly-upcoming-bills-risk') {
    const percent =
      parsePercentage(evidence.diff) ?? parsePercentage(observation);
    const billCount = parseBillCount(observation);
    const totalSaldo = splitLabeledValue(evidence.previousValue);

    return (
      <>
        <div className="space-y-1">
          <h4 className={TITLE_CLASS}>{WEEKLY_BILLS_METRIC_TITLE}</h4>
          <p className={`${HERO_CLASS} text-slate-800 dark:text-slate-100`}>
            {evidence.currentValue}
            {billCount !== null ? (
              <span className="ml-1 text-sm font-semibold tracking-normal text-slate-500 dark:text-slate-400">
                ({billCount} Tagihan)
              </span>
            ) : null}
          </p>
        </div>

        {percent !== null ? (
          <ProgressBar percent={percent} label="Porsi terhadap saldo kas" />
        ) : null}

        {evidence.previousValue ? (
          <p className="break-words text-[11px] text-slate-500 dark:text-slate-400">
            <span className="font-medium">
              {totalSaldo?.label ?? 'Total Saldo Kas'}:
            </span>{' '}
            <span className="font-mono font-semibold tabular-nums text-slate-700 dark:text-slate-300">
              {totalSaldo?.value ?? evidence.previousValue}
            </span>
          </p>
        ) : null}

        <RecommendationCallout recommendation={recommendation} />
      </>
    );
  }

  // C. Bulanan — lonjakan pengeluaran kategori (perbandingan apple-to-apple).
  if (id.startsWith('monthly-category-surge')) {
    const category = getSurgeCategory(title, observation);
    const percent =
      parsePercentage(evidence.diff) ?? parsePercentage(observation);
    const current = splitLabeledValue(evidence.currentValue);
    const previous = splitLabeledValue(evidence.previousValue);
    const highlight = getDiffHighlight(evidence.diff);

    const heading = category
      ? `Lonjakan: ${category}${percent !== null ? ` (+${percent}%)` : ''}`
      : title;

    return (
      <>
        <h4 className={TITLE_CLASS}>{heading}</h4>

        <ComparisonGrid
          items={[current, previous].filter(
            (item): item is ContextItem => item !== null
          )}
        />

        {highlight ? (
          <span className="inline-flex w-fit items-center rounded-md border border-rose-500/30 bg-rose-500/10 px-2 py-0.5 font-mono text-[11px] font-semibold tabular-nums text-rose-600 dark:text-rose-300">
            {highlight}
          </span>
        ) : null}

        <RecommendationCallout recommendation={recommendation} />
      </>
    );
  }

  // D. Fallback generik untuk rule lain (bills due, uncategorized, goal, dll).
  const primary = splitLabeledValue(evidence.currentValue);
  const diffItem = splitLabeledValue(evidence.diff);
  const contextItems = [splitLabeledValue(evidence.previousValue), diffItem].filter(
    (item): item is ContextItem => item !== null
  );
  const rawDiff = evidence.diff && !diffItem ? evidence.diff : null;

  return (
    <>
      <div className="space-y-1">
        <h4 className={TITLE_CLASS}>{title}</h4>
        {primary ? (
          <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
            {primary.label}
          </p>
        ) : null}
        <p className={`${HERO_CLASS} ${getHeroTone(urgency)}`}>
          {primary?.value ?? evidence.currentValue}
        </p>
      </div>

      <ComparisonGrid items={contextItems} />

      {rawDiff ? (
        <p className="break-words font-mono text-[11px] font-semibold tabular-nums text-slate-600 dark:text-slate-300">
          {rawDiff}
        </p>
      ) : null}

      <p className={DESCRIPTION_CLASS}>{observation}</p>
      <p className="break-words text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
        {interpretation}
      </p>

      <RecommendationCallout recommendation={recommendation} />
    </>
  );
}

export function FinancialInsightCard({
  result,
  onActionClick,
  className,
}: FinancialInsightCardProps) {
  const periodLabel = getPeriodBadgeLabel(result.periodType);

  // 1. Kondisi: INSIGHT_AVAILABLE
  if (result.state === 'INSIGHT_AVAILABLE' && result.insight) {
    const insight = result.insight;
    const badge = getUrgencyBadge(insight.urgency);
    const Icon = badge.icon;
    const action =
      insight.actionTarget && insight.actionLabel && onActionClick
        ? {
            target: insight.actionTarget,
            label: insight.actionLabel,
            onClick: onActionClick,
          }
        : null;

    return (
      <InsightCardShell
        periodLabel={periodLabel}
        className={className}
        badge={
          <span className={`${BADGE_BASE_CLASS} ${badge.bg}`}>
            <Icon size={12} />
            {badge.label}
          </span>
        }
        footer={
          action ? (
            <ActionButton
              label={action.label}
              onClick={() => action.onClick(action.target)}
            />
          ) : undefined
        }
      >
        <InsightContent insight={insight} />
      </InsightCardShell>
    );
  }

  // 2. Kondisi: INSUFFICIENT_DATA
  if (result.state === 'INSUFFICIENT_DATA') {
    return (
      <InsightCardShell
        periodLabel={periodLabel}
        className={className}
        muted
        badge={
          <span className={`${BADGE_BASE_CLASS} border-slate-200 bg-slate-100 text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400`}>
            Data Belum Cukup
          </span>
        }
        footer={
          <span className="text-[10px] italic text-slate-400">
            Otomatis diperbarui setelah data memadai.
          </span>
        }
      >
        <div className="space-y-1">
          <h4 className={TITLE_CLASS}>Analisis Belum Aktif</h4>
          <p className={DESCRIPTION_CLASS}>
            {result.fallbackMessage ||
              'Catat aktivitas transaksi Anda untuk mengaktifkan wawasan pada periode ini.'}
          </p>
        </div>
      </InsightCardShell>
    );
  }

  // 3. Kondisi: NO_SIGNIFICANT_FINDING
  return (
    <InsightCardShell
      periodLabel={periodLabel}
      className={className}
      badge={
        <span className={`${BADGE_BASE_CLASS} border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/60 dark:text-emerald-300`}>
          <CheckCircle2 size={12} />
          Stabil
        </span>
      }
      footer={
        <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
          ✓ Pengeluaran dalam batas aman
        </span>
      }
    >
      <div className="space-y-1">
        <h4 className={TITLE_CLASS}>Kondisi Terkendali</h4>
        <p className={DESCRIPTION_CLASS}>
          {result.fallbackMessage ||
            'Tidak ada anomali atau komitmen risiko yang membutuhkan perhatian saat ini.'}
        </p>
      </div>
    </InsightCardShell>
  );
}
