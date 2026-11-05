/**
 * dataSufficiency.ts
 * Logika evaluasi kecukupan data (Data Sufficiency) multi-dimensi untuk Financial Insight Engine PetaUang.
 * 
 * Prinsip:
 * 1. Membedakan status-based rules (cukup snapshot saat ini) dengan pattern-based rules (wajib baseline & pola).
 * 2. Transaksi yang terkumpul hanya di 1 hari kalender tidak cukup untuk analisis laju mingguan.
 * 3. Mencegah distorsi persentase pada perbandingan dengan baseline nol atau terlalu kecil.
 */

import type { Transaction } from '@/lib/db/schema';
import { isWithinRange, getLocalDateKey, type DateRange } from './periodHelper';

export interface DataSufficiencyResult {
  isSufficient: boolean;
  reason?: string;
}

/**
 * Filter murni transaksi pengeluaran (EXPENSE) dan membuang TRANSFER serta INCOME.
 */
export function filterExpenses(transactions: Transaction[]): Transaction[] {
  return transactions.filter((tx) => tx.type === 'EXPENSE' && Number.isFinite(tx.amount) && tx.amount > 0);
}

/**
 * Filter transaksi yang dapat memiliki kategori: EXPENSE dan INCOME.
 * TRANSFER tidak memakai kategori sehingga selalu dikecualikan.
 */
export function filterCategorizableTransactions(transactions: Transaction[]): Transaction[] {
  return transactions.filter(
    (tx) =>
      (tx.type === 'EXPENSE' || tx.type === 'INCOME') &&
      Number.isFinite(tx.amount) &&
      tx.amount > 0
  );
}

/**
 * Ambil transaksi pengeluaran di dalam rentang waktu DateRange tertentu.
 */
export function getExpensesInRange(transactions: Transaction[], range: DateRange): Transaction[] {
  const expenses = filterExpenses(transactions);
  return expenses.filter((tx) => isWithinRange(tx.transaction_date, range));
}

/**
 * Hitung jumlah hari aktif unik tempat transaksi terjadi.
 */
export function countUniqueActiveDays(transactions: Transaction[]): number {
  const uniqueDays = new Set<string>();
  for (const tx of transactions) {
    uniqueDays.add(getLocalDateKey(tx.transaction_date));
  }
  return uniqueDays.size;
}

/**
 * Evaluasi kecukupan data untuk Analisis Pola Harian (Daily Pattern).
 * Membutuhkan minimal histori aktivitas pengeluaran agar baseline rata-rata harian terbentuk.
 */
export function evaluateDailyPatternSufficiency(
  historicalExpenses: Transaction[],
  minHistoricalTxCount = 3
): DataSufficiencyResult {
  if (historicalExpenses.length < minHistoricalTxCount) {
    return {
      isSufficient: false,
      reason: `Dibutuhkan minimal ${minHistoricalTxCount} riwayat transaksi pengeluaran untuk mengevaluasi pola harian.`,
    };
  }

  return { isSufficient: true };
}

/**
 * Evaluasi kecukupan data untuk Analisis Laju & Pola Mingguan (Weekly Pattern Comparison).
 * Syarat Multi-dimensi:
 * 1. Minimal 3 transaksi pengeluaran pada WTD berjalan.
 * 2. Transaksi tersebar minimal di 2 hari kalender aktif berbeda.
 * 3. Total pengeluaran pada WTD minggu lalu (baseline pembanding) minimal Rp100.000.
 */
export function evaluateWeeklyComparisonSufficiency(
  currentWtdExpenses: Transaction[],
  priorWtdExpenses: Transaction[],
  minCurrentTxCount = 3,
  minUniqueDays = 2,
  minPriorTotalAmount = 100_000
): DataSufficiencyResult {
  // Syarat 1: Jumlah transaksi pengeluaran saat ini
  if (currentWtdExpenses.length < minCurrentTxCount) {
    return {
      isSufficient: false,
      reason: `Baru terdapat ${currentWtdExpenses.length} transaksi minggu ini (dibutuhkan minimal ${minCurrentTxCount} transaksi).`,
    };
  }

  // Syarat 2: Jumlah hari aktif unik
  const activeDays = countUniqueActiveDays(currentWtdExpenses);
  if (activeDays < minUniqueDays) {
    return {
      isSufficient: false,
      reason: `Transaksi minggu ini hanya terkonsentrasi pada ${activeDays} hari (dibutuhkan minimal ${minUniqueDays} hari aktif berbeda).`,
    };
  }

  // Syarat 3: Ketersediaan baseline minggu lalu
  const priorTotal = priorWtdExpenses.reduce((sum, tx) => sum + tx.amount, 0);
  if (priorTotal < minPriorTotalAmount) {
    return {
      isSufficient: false,
      reason: `Data pembanding minggu lalu belum mencukupi (Rp ${priorTotal.toLocaleString('id-ID')} dari batas minimal Rp ${minPriorTotalAmount.toLocaleString('id-ID')}).`,
    };
  }

  return { isSufficient: true };
}

/**
 * Evaluasi kecukupan data untuk Analisis Komparasi Kategori Bulanan.
 * Syarat:
 * 1. Minimal 1 transaksi pada kategori terkait di bulan berjalan.
 * 2. Total penuh kategori terkait pada bulan lalu minimal Rp100.000 sebagai baseline.
 *
 * Tidak ada gate hari ke-3 dan tidak ada syarat jumlah transaksi global, karena
 * perbandingan dilakukan terhadap total penuh bulan lalu.
 */
export function evaluateMonthlyComparisonSufficiency(
  currentCategoryTxCount: number,
  priorFullMonthCategoryTotal: number,
  minCurrentCategoryTxCount = 1,
  minPriorCategoryAmount = 100_000
): DataSufficiencyResult {
  if (currentCategoryTxCount < minCurrentCategoryTxCount) {
    return {
      isSufficient: false,
      reason: `Belum ada transaksi kategori ini bulan berjalan (dibutuhkan minimal ${minCurrentCategoryTxCount} transaksi).`,
    };
  }

  if (priorFullMonthCategoryTotal < minPriorCategoryAmount) {
    return {
      isSufficient: false,
      reason: `Baseline kategori bulan lalu belum mencukupi (Rp ${priorFullMonthCategoryTotal.toLocaleString('id-ID')} dari batas minimal Rp ${minPriorCategoryAmount.toLocaleString('id-ID')}).`,
    };
  }

  return { isSufficient: true };
}
