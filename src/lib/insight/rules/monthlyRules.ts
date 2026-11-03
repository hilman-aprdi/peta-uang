/**
 * monthlyRules.ts
 * Aturan deteksi wawasan Bulanan (Monthly Insight Rules).
 * 
 * Cakupan:
 * 1. CATEGORY_SPENDING_SURGE: Lonjakan pengeluaran kategori MTD vs MTD-Lalu ekuivalen >= 25% dengan selisih >= Rp100.000.
 * 2. GOAL_APPROACHING_TARGET: Target tabungan aktif mendekati target nominal (80% - <100%).
 *    Proteksi: Over-allocation (>= 100%) dan target non-positif dilarang memicu insight ini.
 */

import type { Goal } from '@/lib/db/schema';
import type { FinancialInsight, InsightEngineInput } from '../insightTypes';
import { getMonthlyWindows, isWithinRange } from '../periodHelper';
import { filterExpenses, evaluateMonthlyComparisonSufficiency } from '../dataSufficiency';

/**
 * Rule M-1: CATEGORY_SPENDING_SURGE
 * Membandingkan pengeluaran per kategori pada MTD bulan berjalan terhadap rentang MTD ekuivalen bulan lalu.
 */
export function evaluateCategorySpendingSurge(input: InsightEngineInput): FinancialInsight | null {
  const ref = input.referenceDate ?? new Date();
  const { currentWindow, priorWindow } = getMonthlyWindows(ref);

  const allExpenses = filterExpenses(input.transactions);
  const currentMtdExpenses = allExpenses.filter((tx) => isWithinRange(tx.transaction_date, currentWindow));
  const priorMtdExpenses = allExpenses.filter((tx) => isWithinRange(tx.transaction_date, priorWindow));

  // Agregasi belanja per category_id
  const currentCategoryMap = new Map<string, { total: number; count: number }>();
  for (const tx of currentMtdExpenses) {
    if (!tx.category_id) continue;
    const existing = currentCategoryMap.get(tx.category_id) || { total: 0, count: 0 };
    currentCategoryMap.set(tx.category_id, {
      total: existing.total + tx.amount,
      count: existing.count + 1,
    });
  }

  const priorCategoryMap = new Map<string, { total: number; count: number }>();
  for (const tx of priorMtdExpenses) {
    if (!tx.category_id) continue;
    const existing = priorCategoryMap.get(tx.category_id) || { total: 0, count: 0 };
    priorCategoryMap.set(tx.category_id, {
      total: existing.total + tx.amount,
      count: existing.count + 1,
    });
  }

  // Buat map nama kategori untuk lookup cepat (termasuk kategori non-aktif jika ada histori)
  const categoryNameMap = new Map<string, string>(input.categories.map((c) => [c.id, c.name]));

  // Cari kategori dengan lonjakan kenaikan tertinggi yang memenuhi ambang batas keandalan
  let highestSurgeInsight: FinancialInsight | null = null;
  let maxDiff = 0;

  for (const [categoryId, currentData] of currentCategoryMap.entries()) {
    const priorData = priorCategoryMap.get(categoryId);
    const priorTotal = priorData?.total ?? 0;

    // Evaluasi kecukupan data untuk kategori ini (minimal hari ke-3, tx count >= 3, baseline prior >= Rp100.000)
    const sufficiency = evaluateMonthlyComparisonSufficiency(ref, currentMtdExpenses, priorTotal, 3, 3, 100_000);
    if (!sufficiency.isSufficient) continue;

    const diff = currentData.total - priorTotal;
    const percentIncrease = Math.round((diff / priorTotal) * 100);

    // Syarat kenaikan: Minimal 25% dan selisih absolut minimal Rp100.000
    if (percentIncrease >= 25 && diff >= 100_000) {
      if (diff > maxDiff) {
        maxDiff = diff;
        const categoryName = categoryNameMap.get(categoryId) || 'Kategori';

        highestSurgeInsight = {
          id: `monthly-category-surge-${categoryId}`,
          periodType: 'MONTHLY',
          urgency: 'WARNING',
          title: `Lonjakan Pengeluaran: ${categoryName}`,
          observation: `Pengeluaran pada kategori "${categoryName}" meningkat +${percentIncrease}% dibandingkan periode yang sama bulan lalu.`,
          evidence: {
            currentValue: `Bulan ini: Rp ${currentData.total.toLocaleString('id-ID')}`,
            previousValue: `Bulan lalu: Rp ${priorTotal.toLocaleString('id-ID')}`,
            diff: `+Rp ${diff.toLocaleString('id-ID')} (+${percentIncrease}%)`,
          },
          interpretation: `Kategori ${categoryName} mengambil porsi arus kas yang lebih besar dan bertambah lebih cepat dari kebiasaan belanja bulan sebelumnya.`,
          recommendation: `Tinjau detail transaksi ${categoryName} untuk mengevaluasi apakah ada pengeluaran luar biasa yang dapat ditekan kembali.`,
          actionTarget: 'transactions',
          actionLabel: 'Tinjau Transaksi Kategori',
          nominalImpact: diff,
        };
      }
    }
  }

  return highestSurgeInsight;
}

/**
 * Rule M-2: GOAL_APPROACHING_TARGET
 * Mendeteksi target tabungan aktif yang mendekati target nominal (>= 80% dan < 100%).
 * 
 * Aturan Bisnis & Proteksi:
 * 1. Hanya mengevaluasi goal dengan status === 'ACTIVE' dan !is_deleted.
 * 2. target_amount harus valid dan > 0.
 * 3. allocated_amount < target_amount (Goal yang pas 100% atau over-allocated TIDAK memicu insight ini).
 */
export function evaluateGoalApproachingTarget(goals: Goal[]): FinancialInsight | null {
  const activeGoals = goals.filter((g) => !g.is_deleted && g.status === 'ACTIVE' && Number.isFinite(g.target_amount) && g.target_amount > 0);
  if (activeGoals.length === 0) return null;

  // Cari goal yang paling mendekati 100% dalam rentang 80% - <100%
  let bestCandidate: { goal: Goal; percent: number; remaining: number } | null = null;

  for (const goal of activeGoals) {
    const allocated = goal.allocated_amount;
    const target = goal.target_amount;

    // Proteksi: Abaikan jika sudah mencapai atau melampaui target (>= 100%)
    if (allocated >= target) continue;

    const ratio = allocated / target;
    const percent = Math.round(ratio * 100);

    if (percent >= 80 && percent < 100) {
      const remaining = target - allocated;
      if (!bestCandidate || percent > bestCandidate.percent) {
        bestCandidate = { goal, percent, remaining };
      }
    }
  }

  if (!bestCandidate) return null;

  const { goal, percent, remaining } = bestCandidate;

  return {
    id: `monthly-goal-approaching-${goal.id}`,
    periodType: 'MONTHLY',
    urgency: 'OPPORTUNITY',
    title: `Target Tabungan Hampir Selesai: ${goal.name}`,
    observation: `Target "${goal.name}" telah terkumpul ${percent}% dari total sasaran.`,
    evidence: {
      currentValue: `Terkumpul: Rp ${goal.allocated_amount.toLocaleString('id-ID')}`,
      previousValue: `Target: Rp ${goal.target_amount.toLocaleString('id-ID')}`,
      diff: `Kurang Rp ${remaining.toLocaleString('id-ID')} lagi`,
    },
    interpretation: 'Pencapaian target sudah sangat dekat dan membutuhkan sedikit alokasi tambahan untuk diselesaikan.',
    recommendation: `Alokasikan sisa Rp ${remaining.toLocaleString('id-ID')} dari Safe-to-Spend untuk menuntaskan target ini.`,
    actionTarget: 'goals',
    actionLabel: 'Buka Detail Target',
    nominalImpact: remaining,
  };
}
