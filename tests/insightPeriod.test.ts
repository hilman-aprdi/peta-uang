import { describe, expect, it } from 'vitest';
import type { Transaction } from '@/lib/db/schema';
import {
  getDailyWindows,
  getWeeklyWindows,
  getMonthlyWindows,
  getPriorFullMonthWindow,
} from '@/lib/insight/periodHelper';
import {
  evaluateDailyPatternSufficiency,
  evaluateWeeklyComparisonSufficiency,
  evaluateMonthlyComparisonSufficiency,
  countUniqueActiveDays,
  filterExpenses,
  filterCategorizableTransactions,
} from '@/lib/insight/dataSufficiency';

const createTx = (
  id: string,
  type: Transaction['type'],
  amount: number,
  transaction_date: string,
  category_id?: string
): Transaction => ({
  id,
  title: id,
  type,
  amount,
  account_id: 'acc-1',
  category_id,
  transaction_date,
  created_at: transaction_date,
  updated_at: transaction_date,
});

describe('Phase 1: Period Utilities & Data Sufficiency', () => {
  // T-P01: Daily boundary (00:00 s.d. 23:59)
  it('T-P01: should accurately compute daily observation boundaries in local calendar', () => {
    const ref = new Date(2026, 10, 15, 14, 30); // 15 November 2026, 14:30
    const { currentWindow, priorWindow } = getDailyWindows(ref);

    expect(currentWindow.start.getFullYear()).toBe(2026);
    expect(currentWindow.start.getMonth()).toBe(10);
    expect(currentWindow.start.getDate()).toBe(15);
    expect(currentWindow.start.getHours()).toBe(0);
    expect(currentWindow.start.getMinutes()).toBe(0);

    expect(currentWindow.end.getDate()).toBe(15);
    expect(currentWindow.end.getHours()).toBe(23);
    expect(currentWindow.end.getMinutes()).toBe(59);

    // Prior day = 14 November 2026
    expect(priorWindow.start.getDate()).toBe(14);
    expect(priorWindow.end.getDate()).toBe(14);
  });

  // T-P02: Weekly boundary (Senin s.d. Hari Ini vs Senin s.d. Hari yang sama minggu lalu)
  it('T-P02: should accurately compute WTD observation boundaries starting on Monday', () => {
    // 2026-11-04 is Wednesday (Rabu). Monday of this week is 2026-11-02.
    const wednesday = new Date(2026, 10, 4, 15, 0);
    const { currentWindow, priorWindow } = getWeeklyWindows(wednesday);

    // Current: 2 Nov 2026 00:00 to 4 Nov 2026 23:59
    expect(currentWindow.start.getDate()).toBe(2);
    expect(currentWindow.end.getDate()).toBe(4);

    // Prior: 26 Oct 2026 00:00 to 28 Oct 2026 23:59 (Senin s.d. Rabu minggu lalu)
    expect(priorWindow.start.getFullYear()).toBe(2026);
    expect(priorWindow.start.getMonth()).toBe(9); // Oktober
    expect(priorWindow.start.getDate()).toBe(26);

    expect(priorWindow.end.getFullYear()).toBe(2026);
    expect(priorWindow.end.getMonth()).toBe(9);
    expect(priorWindow.end.getDate()).toBe(28);
  });

  // T-P03: Monthly boundary with date overflow (31 Maret vs 28 Februari & 31 Mei vs 30 April)
  it('T-P03: should deterministically handle date overflow in prior month', () => {
    // Case A: 31 Maret 2026 (non-kabisat). Bulan lalu (Februari) hanya 28 hari.
    const march31 = new Date(2026, 2, 31, 20, 0); // Maret = index 2
    const marchWindows = getMonthlyWindows(march31);

    expect(marchWindows.currentWindow.start.getDate()).toBe(1);
    expect(marchWindows.currentWindow.end.getDate()).toBe(31);

    // Prior month: Harus dipatok pada 28 Februari 2026
    expect(marchWindows.priorWindow.start.getMonth()).toBe(1); // Februari = index 1
    expect(marchWindows.priorWindow.start.getDate()).toBe(1);
    expect(marchWindows.priorWindow.end.getMonth()).toBe(1);
    expect(marchWindows.priorWindow.end.getDate()).toBe(28);

    // Case B: 31 Mei 2026. Bulan lalu (April) hanya 30 hari.
    const may31 = new Date(2026, 4, 31, 10, 0); // Mei = index 4
    const mayWindows = getMonthlyWindows(may31);

    expect(mayWindows.priorWindow.start.getMonth()).toBe(3); // April = index 3
    expect(mayWindows.priorWindow.end.getMonth()).toBe(3);
    expect(mayWindows.priorWindow.end.getDate()).toBe(30); // Patok pada 30 April
  });

  // T-P03b: Full prior month window, termasuk lintas tahun
  it('T-P03b: should compute the full prior month window including year boundary', () => {
    const ref = new Date(2026, 0, 15); // 15 Januari 2026
    const priorWindow = getPriorFullMonthWindow(ref);

    expect(priorWindow.start.getFullYear()).toBe(2025);
    expect(priorWindow.start.getMonth()).toBe(11); // Desember
    expect(priorWindow.start.getDate()).toBe(1);

    expect(priorWindow.end.getFullYear()).toBe(2025);
    expect(priorWindow.end.getMonth()).toBe(11);
    expect(priorWindow.end.getDate()).toBe(31);
    expect(priorWindow.end.getHours()).toBe(23);
    expect(priorWindow.end.getMinutes()).toBe(59);
  });

  // T-P04: Daily sufficiency: 1 transaksi tanpa data histori masa lalu mengembalikan INSUFFICIENT_DATA untuk rule pola
  it('T-P04: should require historical data for daily pattern analysis', () => {
    const singleTx = [createTx('tx-1', 'EXPENSE', 50_000, '2026-11-04T10:00:00.000Z')];
    const result = evaluateDailyPatternSufficiency(singleTx, 3);

    expect(result.isSufficient).toBe(false);
    expect(result.reason).toContain('minimal 3 riwayat transaksi');
  });

  // T-P05: Weekly sufficiency: 5 transaksi tetapi semuanya tercatat di 1 hari aktif
  it('T-P05: should reject weekly comparison if transactions are concentrated in only 1 active day', () => {
    const sameDayTxs = [
      createTx('tx-1', 'EXPENSE', 20_000, '2026-11-04T08:00:00.000Z'),
      createTx('tx-2', 'EXPENSE', 30_000, '2026-11-04T12:00:00.000Z'),
      createTx('tx-3', 'EXPENSE', 40_000, '2026-11-04T15:00:00.000Z'),
      createTx('tx-4', 'EXPENSE', 50_000, '2026-11-04T18:00:00.000Z'),
      createTx('tx-5', 'EXPENSE', 60_000, '2026-11-04T21:00:00.000Z'),
    ];

    expect(countUniqueActiveDays(sameDayTxs)).toBe(1);

    const priorWtdTxs = [createTx('tx-prior', 'EXPENSE', 200_000, '2026-10-28T10:00:00.000Z')];

    const result = evaluateWeeklyComparisonSufficiency(sameDayTxs, priorWtdTxs, 3, 2, 100_000);
    expect(result.isSufficient).toBe(false);
    expect(result.reason).toContain('hanya terkonsentrasi pada 1 hari');
  });

  // T-P06: Weekly sufficiency: 4 transaksi di 3 hari aktif tetapi WTD minggu lalu Rp0 (baseline missing)
  it('T-P06: should reject weekly comparison if prior week baseline is missing or insufficient', () => {
    const currentWtdTxs = [
      createTx('tx-1', 'EXPENSE', 50_000, '2026-11-02T10:00:00.000Z'),
      createTx('tx-2', 'EXPENSE', 50_000, '2026-11-03T10:00:00.000Z'),
      createTx('tx-3', 'EXPENSE', 50_000, '2026-11-04T10:00:00.000Z'),
    ];

    expect(countUniqueActiveDays(currentWtdTxs)).toBe(3);

    // Prior week total is Rp0 or less than Rp100.000
    const priorWtdTxs: Transaction[] = [];

    const result = evaluateWeeklyComparisonSufficiency(currentWtdTxs, priorWtdTxs, 3, 2, 100_000);
    expect(result.isSufficient).toBe(false);
    expect(result.reason).toContain('Data pembanding minggu lalu belum mencukupi');
  });

  // T-P07: Monthly sufficiency memakai 1 transaksi kategori dan baseline penuh bulan lalu
  it('T-P07: should require one current category transaction and a Rp100.000 prior-month baseline', () => {
    expect(evaluateMonthlyComparisonSufficiency(1, 150_000).isSufficient).toBe(true);

    const noCurrentCategoryTx = evaluateMonthlyComparisonSufficiency(0, 150_000);
    expect(noCurrentCategoryTx.isSufficient).toBe(false);
    expect(noCurrentCategoryTx.reason).toContain('minimal 1 transaksi');

    const lowBaseline = evaluateMonthlyComparisonSufficiency(1, 50_000);
    expect(lowBaseline.isSufficient).toBe(false);
    expect(lowBaseline.reason).toContain('Baseline kategori bulan lalu belum mencukupi');
  });

  // Isolation test: Filter expenses excludes TRANSFER and INCOME
  it('should strictly exclude TRANSFER and INCOME from expense filters', () => {
    const mixedTxs = [
      createTx('tx-income', 'INCOME', 5_000_000, '2026-11-04T10:00:00.000Z'),
      createTx('tx-transfer', 'TRANSFER', 1_000_000, '2026-11-04T11:00:00.000Z'),
      createTx('tx-expense', 'EXPENSE', 150_000, '2026-11-04T12:00:00.000Z'),
    ];

    const expensesOnly = filterExpenses(mixedTxs);
    expect(expensesOnly.length).toBe(1);
    expect(expensesOnly[0].id).toBe('tx-expense');
  });

  // Filter kategori mencakup INCOME dan EXPENSE, tetapi tetap mengecualikan TRANSFER
  it('should include EXPENSE and INCOME but exclude TRANSFER in categorizable filters', () => {
    const mixedTxs = [
      createTx('tx-income', 'INCOME', 5_000_000, '2026-11-04T10:00:00.000Z'),
      createTx('tx-transfer', 'TRANSFER', 1_000_000, '2026-11-04T11:00:00.000Z'),
      createTx('tx-expense', 'EXPENSE', 150_000, '2026-11-04T12:00:00.000Z'),
      createTx('tx-zero', 'EXPENSE', 0, '2026-11-04T13:00:00.000Z'),
    ];

    const categorizable = filterCategorizableTransactions(mixedTxs);
    expect(categorizable.map((tx) => tx.id)).toEqual(['tx-income', 'tx-expense']);
  });
});
