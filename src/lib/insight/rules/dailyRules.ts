/**
 * dailyRules.ts
 * Aturan deteksi wawasan Harian (Daily Insight Rules).
 * 
 * Cakupan:
 * 1. SAFE_TO_SPEND_CRITICAL: Mendeteksi jika Safe-to-Spend < 0 (Urgensi: CRITICAL).
 * 2. IMMEDIATE_BILLS_DUE: Mendeteksi tagihan belum dibayar yang jatuh tempo dalam 0-2 hari (Urgensi: WARNING).
 */

import type { Bill } from '@/lib/db/schema';
import type { FinancialInsight, InsightEngineInput } from '../insightTypes';

/**
 * Rule D-1: SAFE_TO_SPEND_CRITICAL
 * Safe-to-Spend bernilai negatif menunjukkan komitmen finansial (tagihan & alokasi pos)
 * telah melampaui saldo riil seluruh dompet aktif.
 */
export function evaluateSafeToSpendCritical(input: InsightEngineInput): FinancialInsight | null {
  const safeToSpend = input.overview?.safeToSpend;
  if (safeToSpend === undefined || safeToSpend >= 0) {
    return null;
  }

  const deficit = Math.abs(safeToSpend);

  return {
    id: 'daily-safe-to-spend-critical',
    periodType: 'DAILY',
    urgency: 'CRITICAL',
    title: 'Dana Aman Safe-to-Spend Defisit',
    observation: `Safe-to-Spend Anda saat ini defisit sebesar -Rp ${deficit.toLocaleString('id-ID')}.`,
    evidence: {
      currentValue: `-Rp ${deficit.toLocaleString('id-ID')}`,
      previousValue: `Saldo Riil: Rp ${(input.overview?.totalCurrentBalance ?? 0).toLocaleString('id-ID')}`,
      diff: `Tagihan & Target: Rp ${((input.overview?.totalUnpaidBills ?? 0) + (input.overview?.totalAllocatedGoals ?? 0)).toLocaleString('id-ID')}`,
    },
    interpretation: 'Total kewajiban tagihan belum dibayar dan dana yang dikunci pada pos target melebihi saldo riil yang Anda miliki saat ini.',
    recommendation: 'Tarik sementara sebagian dana dari target tabungan ke Safe-to-Spend atau tunda pengeluaran diskresioner agar arus kas tetap aman.',
    actionTarget: 'goals',
    actionLabel: 'Tinjau Pos Target',
    nominalImpact: deficit,
  };
}

/**
 * Rule D-2: IMMEDIATE_BILLS_DUE
 * Tagihan belum dibayar yang jatuh tempo hari ini s.d. 2 hari ke depan.
 */
export function evaluateImmediateBillsDue(
  bills: Bill[],
  referenceDate: Date = new Date()
): FinancialInsight | null {
  const unpaidBills = bills.filter((b) => !b.is_paid && Number.isFinite(b.amount) && b.amount > 0);
  if (unpaidBills.length === 0) return null;

  const todayStart = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), referenceDate.getDate(), 0, 0, 0, 0);
  const twoDaysLaterEnd = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), referenceDate.getDate() + 2, 23, 59, 59, 999);

  const urgentBills = unpaidBills.filter((bill) => {
    const dueTime = Date.parse(bill.due_date);
    if (Number.isNaN(dueTime)) return false;
    return dueTime >= todayStart.getTime() && dueTime <= twoDaysLaterEnd.getTime();
  });

  if (urgentBills.length === 0) return null;

  const totalUrgentAmount = urgentBills.reduce((sum, b) => sum + b.amount, 0);
  const firstBill = urgentBills[0];

  return {
    id: 'daily-immediate-bills-due',
    periodType: 'DAILY',
    urgency: 'WARNING',
    title: 'Tagihan Jatuh Tempo Segera',
    observation: `${urgentBills.length} tagihan sebesar Rp ${totalUrgentAmount.toLocaleString('id-ID')} jatuh tempo dalam 2 hari ke depan.`,
    evidence: {
      currentValue: `Rp ${totalUrgentAmount.toLocaleString('id-ID')}`,
      diff: `${urgentBills.length} tagihan: ${firstBill.title}${urgentBills.length > 1 ? ', dll.' : ''}`,
    },
    interpretation: 'Tagihan yang sangat dekat dengan tanggal jatuh tempo membutuhkan persiapan dana likuid di rekening pembayaran.',
    recommendation: 'Pastikan saldo pada rekening pembayaran mencukupi dan bayar tagihan tepat waktu untuk menghindari denda.',
    actionTarget: 'bills',
    actionLabel: 'Lihat Daftar Tagihan',
    nominalImpact: totalUrgentAmount,
  };
}
