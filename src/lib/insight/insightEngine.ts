/**
 * insightEngine.ts
 * Engine utama evaluasi wawasan finansial deterministik PetaUang.
 * 
 * Prinsip:
 * 1. Murni in-memory dan read-only (tidak ada pemanggilan mutasi database).
 * 2. Evaluasi Harian (Daily), Mingguan (Weekly), dan Bulanan (Monthly) berjalan 100% independen (tanpa cross-period suppression).
 * 3. Deduplikasi dan penentuan kandidat terbaik hanya dilakukan di dalam masing-masing periode.
 * 4. Mendukung 3 result states: INSIGHT_AVAILABLE, INSUFFICIENT_DATA, NO_SIGNIFICANT_FINDING.
 */

import type {
  FinancialInsight,
  InsightEngineInput,
  PeriodInsightResult,
} from './insightTypes';
import { evaluateSafeToSpendCritical, evaluateImmediateBillsDue } from './rules/dailyRules';
import { evaluateUpcomingBillsRisk, evaluateUncategorizedExpenses } from './rules/weeklyRules';
import { evaluateCategorySpendingSurge, evaluateGoalApproachingTarget } from './rules/monthlyRules';
import { getWeeklyWindows, getMonthlyWindows, isWithinRange } from './periodHelper';
import { filterExpenses, countUniqueActiveDays } from './dataSufficiency';

/**
 * Bobot urgensi untuk penentuan prioritas kandidat di dalam satu periode yang sama.
 */
const URGENCY_WEIGHTS: Record<FinancialInsight['urgency'], number> = {
  CRITICAL: 1000,
  WARNING: 800,
  OPPORTUNITY: 500,
  HYGIENE: 300,
  NEUTRAL: 100,
};

/**
 * Memilih tepat 1 insight kandidat terbaik dari daftar kandidat dalam satu periode.
 */
export function prioritizeSinglePeriodCandidates(candidates: FinancialInsight[]): FinancialInsight | null {
  if (candidates.length === 0) return null;

  return candidates.sort((a, b) => {
    const weightDiff = (URGENCY_WEIGHTS[b.urgency] ?? 0) - (URGENCY_WEIGHTS[a.urgency] ?? 0);
    if (weightDiff !== 0) return weightDiff;
    // Tie-breaker: nominal dampak rupiah terbesar
    return (b.nominalImpact ?? 0) - (a.nominalImpact ?? 0);
  })[0];
}

/**
 * Evaluasi Wawasan Harian (Daily Evaluation).
 */
export function evaluateDailyInsight(input: InsightEngineInput): PeriodInsightResult {
  const candidates: FinancialInsight[] = [];

  // Evaluasi Rule D-1: Safe to spend critical
  const stsInsight = evaluateSafeToSpendCritical(input);
  if (stsInsight) candidates.push(stsInsight);

  // Evaluasi Rule D-2: Immediate bills due
  const billsInsight = evaluateImmediateBillsDue(input.bills, input.referenceDate);
  if (billsInsight) candidates.push(billsInsight);

  const bestInsight = prioritizeSinglePeriodCandidates(candidates);
  if (bestInsight) {
    return {
      periodType: 'DAILY',
      state: 'INSIGHT_AVAILABLE',
      insight: bestInsight,
    };
  }

  // Cek apakah ada data akun
  const hasAccounts = input.accounts.some((a) => a.is_active);
  if (!hasAccounts) {
    return {
      periodType: 'DAILY',
      state: 'INSUFFICIENT_DATA',
      fallbackMessage: 'Tambahkan akun dompet untuk melihat ringkasan harian.',
    };
  }

  return {
    periodType: 'DAILY',
    state: 'NO_SIGNIFICANT_FINDING',
    fallbackMessage: 'Arus kas dan komitmen tagihan hari ini dalam batas aman.',
  };
}

/**
 * Evaluasi Wawasan Mingguan (Weekly Evaluation).
 */
export function evaluateWeeklyInsight(input: InsightEngineInput): PeriodInsightResult {
  const ref = input.referenceDate ?? new Date();
  const { currentWindow } = getWeeklyWindows(ref);
  const wtdExpenses = filterExpenses(input.transactions).filter((tx) =>
    isWithinRange(tx.transaction_date, currentWindow)
  );

  const candidates: FinancialInsight[] = [];

  // Evaluasi Rule W-1: Upcoming bills risk
  const billsRisk = evaluateUpcomingBillsRisk(input);
  if (billsRisk) candidates.push(billsRisk);

  // Evaluasi Rule W-2: Uncategorized expenses
  const uncatInsight = evaluateUncategorizedExpenses(input);
  if (uncatInsight) candidates.push(uncatInsight);

  const bestInsight = prioritizeSinglePeriodCandidates(candidates);
  if (bestInsight) {
    return {
      periodType: 'WEEKLY',
      state: 'INSIGHT_AVAILABLE',
      insight: bestInsight,
    };
  }

  // Jika tidak ada insight, cek kecukupan data mingguan
  const activeDays = countUniqueActiveDays(wtdExpenses);
  if (wtdExpenses.length < 2 || activeDays < 1) {
    return {
      periodType: 'WEEKLY',
      state: 'INSUFFICIENT_DATA',
      fallbackMessage: 'Catat transaksi mingguan untuk mengaktifkan analisis pola pengeluaran.',
    };
  }

  return {
    periodType: 'WEEKLY',
    state: 'NO_SIGNIFICANT_FINDING',
    fallbackMessage: 'Kondisi pengeluaran dan kewajiban minggu ini stabil dan terkendali.',
  };
}

/**
 * Evaluasi Wawasan Bulanan (Monthly Evaluation).
 */
export function evaluateMonthlyInsight(input: InsightEngineInput): PeriodInsightResult {
  const ref = input.referenceDate ?? new Date();
  const currentDay = ref.getDate();
  const { currentWindow } = getMonthlyWindows(ref);
  const mtdExpenses = filterExpenses(input.transactions).filter((tx) =>
    isWithinRange(tx.transaction_date, currentWindow)
  );

  const candidates: FinancialInsight[] = [];

  // Evaluasi Rule M-1: Category spending surge
  const surgeInsight = evaluateCategorySpendingSurge(input);
  if (surgeInsight) candidates.push(surgeInsight);

  // Evaluasi Rule M-2: Goal approaching target
  const goalInsight = evaluateGoalApproachingTarget(input.goals);
  if (goalInsight) candidates.push(goalInsight);

  const bestInsight = prioritizeSinglePeriodCandidates(candidates);
  if (bestInsight) {
    return {
      periodType: 'MONTHLY',
      state: 'INSIGHT_AVAILABLE',
      insight: bestInsight,
    };
  }

  // Cek kecukupan data bulanan
  if (currentDay < 3) {
    return {
      periodType: 'MONTHLY',
      state: 'INSUFFICIENT_DATA',
      fallbackMessage: 'Analisis perbandingan bulanan akan aktif setelah hari ke-3 di bulan berjalan.',
    };
  }

  if (mtdExpenses.length < 3) {
    return {
      periodType: 'MONTHLY',
      state: 'INSUFFICIENT_DATA',
      fallbackMessage: 'Catat minimal 3 transaksi bulan ini untuk membuka wawasan bulanan.',
    };
  }

  return {
    periodType: 'MONTHLY',
    state: 'NO_SIGNIFICANT_FINDING',
    fallbackMessage: 'Tidak terdeteksi lonjakan pengeluaran yang tidak wajar bulan ini.',
  };
}

/**
 * Orkesstrator Utama Insight Engine.
 * Menghasilkan 3 evaluasi independen (Daily, Weekly, Monthly) tanpa suppression antarperiode.
 */
export function evaluateAllInsights(input: InsightEngineInput): {
  daily: PeriodInsightResult;
  weekly: PeriodInsightResult;
  monthly: PeriodInsightResult;
} {
  return {
    daily: evaluateDailyInsight(input),
    weekly: evaluateWeeklyInsight(input),
    monthly: evaluateMonthlyInsight(input),
  };
}
