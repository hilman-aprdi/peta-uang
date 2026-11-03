/**
 * weeklyRules.ts
 * Aturan deteksi wawasan Mingguan (Weekly Insight Rules).
 * 
 * Cakupan:
 * 1. UPCOMING_BILLS_RISK: Tagihan dalam 7 hari ke depan menyerap > 50% saldo riil likuid (tanpa double-counting Safe-to-Spend).
 * 2. UNCATEGORIZED_EXPENSES: Akumulasi >= 3 transaksi pengeluaran pada minggu berjalan tanpa category_id.
 */

import type { FinancialInsight, InsightEngineInput } from '../insightTypes';
import { getWeeklyWindows, isWithinRange } from '../periodHelper';
import { filterExpenses } from '../dataSufficiency';

/**
 * Rule W-1: UPCOMING_BILLS_RISK
 * 
 * Formula Aman Tanpa Double-Counting:
 * Safe-to-Spend sudah memotong seluruh tagihan. Risiko spesifik minggu ini adalah jika
 * tagihan H-7 menyerap lebih dari 50% saldo likuid riil (totalCurrentBalance) saat ini,
 * atau dana Safe-to-Spend tipis (< 20% dari tagihan H-7).
 */
export function evaluateUpcomingBillsRisk(input: InsightEngineInput): FinancialInsight | null {
  const bills = input.bills.filter((b) => !b.is_paid && Number.isFinite(b.amount) && b.amount > 0);
  const totalCurrentBalance = input.overview?.totalCurrentBalance ?? 0;
  const safeToSpend = input.overview?.safeToSpend ?? 0;

  if (bills.length === 0 || totalCurrentBalance <= 0) return null;

  const ref = input.referenceDate ?? new Date();
  const todayStart = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate(), 0, 0, 0, 0);
  const sevenDaysLaterEnd = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate() + 7, 23, 59, 59, 999);

  const upcomingBills = bills.filter((b) => {
    const dueTime = Date.parse(b.due_date);
    if (Number.isNaN(dueTime)) return false;
    return dueTime >= todayStart.getTime() && dueTime <= sevenDaysLaterEnd.getTime();
  });

  if (upcomingBills.length === 0) return null;

  const upcomingSum = upcomingBills.reduce((sum, b) => sum + b.amount, 0);
  const percentageOfBalance = Math.round((upcomingSum / totalCurrentBalance) * 100);

  // Kondisi pemicu: Menyerap > 50% saldo kas, ATAU Safe-to-Spend tipis (< 20% dari upcoming bills)
  const isHighPortion = percentageOfBalance >= 50;
  const isSafeTight = safeToSpend >= 0 && safeToSpend < upcomingSum * 0.2;

  if (!isHighPortion && !isSafeTight) return null;

  return {
    id: 'weekly-upcoming-bills-risk',
    periodType: 'WEEKLY',
    urgency: 'WARNING',
    title: 'Beban Tagihan 7 Hari ke Depan Tinggi',
    observation: `Terdapat ${upcomingBills.length} tagihan senilai Rp ${upcomingSum.toLocaleString('id-ID')} (${percentageOfBalance}% dari total saldo kas) yang jatuh tempo minggu ini.`,
    evidence: {
      currentValue: `Rp ${upcomingSum.toLocaleString('id-ID')}`,
      previousValue: `Total Saldo Kas: Rp ${totalCurrentBalance.toLocaleString('id-ID')}`,
      diff: `${percentageOfBalance}% dari Saldo`,
    },
    interpretation: 'Porsi tagihan yang tinggi dalam rentang 7 hari ke depan dapat menekan likuiditas kas jika pengeluaran harian tidak dikontrol.',
    recommendation: 'Siapkan dana di rekening pembayaran dan pertahankan sisa dana aman Safe-to-Spend agar kewajiban tertunaikan tanpa defisit.',
    actionTarget: 'bills',
    actionLabel: 'Kelola Tagihan',
    nominalImpact: upcomingSum,
  };
}

/**
 * Rule W-2: UNCATEGORIZED_EXPENSES
 * Mendeteksi jika terdapat >= 3 transaksi belanja tanpa kategori pada minggu berjalan (WTD).
 */
export function evaluateUncategorizedExpenses(input: InsightEngineInput): FinancialInsight | null {
  const ref = input.referenceDate ?? new Date();
  const { currentWindow } = getWeeklyWindows(ref);

  const wtdExpenses = filterExpenses(input.transactions).filter((tx) =>
    isWithinRange(tx.transaction_date, currentWindow)
  );

  const uncategorizedList = wtdExpenses.filter((tx) => !tx.category_id);

  if (uncategorizedList.length < 3) return null;

  const uncategorizedSum = uncategorizedList.reduce((sum, tx) => sum + tx.amount, 0);

  return {
    id: 'weekly-uncategorized-expenses',
    periodType: 'WEEKLY',
    urgency: 'HYGIENE',
    title: 'Transaksi Belum Dikategorikan',
    observation: `Terdapat ${uncategorizedList.length} transaksi pengeluaran senilai Rp ${uncategorizedSum.toLocaleString('id-ID')} minggu ini yang belum memiliki kategori.`,
    evidence: {
      currentValue: `${uncategorizedList.length} transaksi`,
      diff: `Total: Rp ${uncategorizedSum.toLocaleString('id-ID')}`,
    },
    interpretation: 'Transaksi tanpa kategori menyulitkan sistem membaca pola belanja dan memantau pos pengeluaran terbesar Anda.',
    recommendation: 'Lengkapi kategori pada transaksi pengeluaran tersebut agar analisis keuangan mingguan dan bulanan menjadi akurat.',
    actionTarget: 'transactions',
    actionLabel: 'Kategorikan Transaksi',
    nominalImpact: uncategorizedSum,
  };
}
