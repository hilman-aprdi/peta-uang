/**
 * insightPriority.ts
 * Urutan prioritas insight lintas periode untuk Priority Inbox Dashboard.
 *
 * Prinsip:
 * 1. Urgensi menentukan tingkat kepentingan utama.
 * 2. Nominal dampak rupiah menjadi tie-breaker di dalam urgensi yang sama.
 * 3. Fungsi tidak memutasi array input.
 */

import type { FinancialInsight } from './insightTypes';

export const URGENCY_WEIGHTS: Record<FinancialInsight['urgency'], number> = {
  CRITICAL: 1000,
  WARNING: 800,
  OPPORTUNITY: 500,
  HYGIENE: 300,
  NEUTRAL: 100,
};

/**
 * Mengurutkan kandidat insight dari yang paling mendesak.
 * Array hasil adalah salinan baru; urutan asli tidak diubah.
 */
export function sortInsightsByPriority(insights: FinancialInsight[]): FinancialInsight[] {
  return [...insights].sort((a, b) => {
    const weightDiff = (URGENCY_WEIGHTS[b.urgency] ?? 0) - (URGENCY_WEIGHTS[a.urgency] ?? 0);
    if (weightDiff !== 0) return weightDiff;

    // Tie-breaker: nominal dampak rupiah terbesar
    return (b.nominalImpact ?? 0) - (a.nominalImpact ?? 0);
  });
}
