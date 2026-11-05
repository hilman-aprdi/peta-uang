/**
 * dailyRules.ts
 * Aturan deteksi wawasan Harian (Daily Insight Rules).
 * 
 * Cakupan:
 * 1. SAFE_TO_SPEND_CRITICAL: Mendeteksi jika Safe-to-Spend < 0 (Urgensi: CRITICAL).
 * 2. IMMEDIATE_BILLS_DUE: Mendeteksi tagihan belum dibayar yang jatuh tempo dalam 0-2 hari (Urgensi: WARNING).
 */

import type { Bill } from '@/lib/db/schema';
import { getTodayLocalDateKey, toLocalDateKey } from '@/lib/utils/localDate';
import type { FinancialInsight, InsightEngineInput } from '../insightTypes';

/**
 * Selisih hari kalender lokal antara dua key `YYYY-MM-DD`.
 * Memakai `Date.UTC` agar bebas dari pergeseran DST.
 */
function getCalendarDayDiff(fromKey: string, toKey: string): number {
  const [fromYear, fromMonth, fromDay] = fromKey.split('-').map(Number);
  const [toYear, toMonth, toDay] = toKey.split('-').map(Number);
  return Math.round(
    (Date.UTC(toYear, toMonth - 1, toDay) - Date.UTC(fromYear, fromMonth - 1, fromDay)) / 86_400_000
  );
}

/**
 * Frasa relatif untuk satu tanggal jatuh tempo.
 * `isRangeEnd` dipakai agar rentang berbunyi "hingga 2 hari ke depan".
 */
function formatRelativeDay(days: number, isRangeEnd = false): string {
  if (days === 0) return 'hari ini';
  if (days === 1) return 'besok';
  return isRangeEnd ? `${days} hari ke depan` : `dalam ${days} hari`;
}

/**
 * Frasa jatuh tempo untuk satu atau beberapa tagihan.
 * Jika tanggal jatuh tempo berbeda, sebutkan rentangnya.
 */
function formatDueDescription(minDays: number, maxDays: number): string {
  if (minDays === maxDays) return formatRelativeDay(minDays);
  return `antara ${formatRelativeDay(minDays)} dan ${formatRelativeDay(maxDays, true)}`;
}

/**
 * Rule D-1: SAFE_TO_SPEND_CRITICAL
 * Safe-to-Spend negatif didiagnosis penyebabnya agar judul, rekomendasi, dan CTA
 * tidak mengarahkan pengguna ke pos target yang tidak relevan.
 */
export function evaluateSafeToSpendCritical(input: InsightEngineInput): FinancialInsight | null {
  const safeToSpend = input.overview?.safeToSpend;
  if (safeToSpend === undefined || safeToSpend >= 0) {
    return null;
  }

  const deficit = Math.abs(safeToSpend);
  const totalCurrentBalance = input.overview?.totalCurrentBalance ?? 0;
  const totalUnpaidBills = input.overview?.totalUnpaidBills ?? 0;
  const totalAllocatedGoals = input.overview?.totalAllocatedGoals ?? 0;

  const hasBills = totalUnpaidBills > 0;
  const hasGoals = totalAllocatedGoals > 0;

  let title: string;
  let observation: string;
  let interpretation: string;
  let recommendation: string;
  let actionTarget: FinancialInsight['actionTarget'];
  let actionLabel: string;

  if (hasBills && hasGoals) {
    title = 'Saldo Kas Tidak Menutup Komitmen';
    observation = `Safe-to-Spend defisit sebesar -Rp ${deficit.toLocaleString('id-ID')} karena total tagihan belum dibayar dan dana pos target melebihi saldo kas Anda.`;
    interpretation = 'Saldo kas belum cukup untuk menutup gabungan tagihan yang belum dibayar dan dana yang dialokasikan ke pos target.';
    recommendation = 'Prioritaskan peninjauan tagihan belum dibayar. Jika defisit masih tersisa, tarik sebagian dana dari pos target atau tunda pengeluaran diskresioner.';
    actionTarget = 'bills';
    actionLabel = 'Lihat Tagihan';
  } else if (hasBills) {
    title = 'Tagihan Melebihi Saldo Kas';
    observation = `Safe-to-Spend defisit sebesar -Rp ${deficit.toLocaleString('id-ID')} karena tagihan belum dibayar melebihi saldo kas Anda.`;
    interpretation = 'Saldo kas yang tersedia belum cukup untuk menutup seluruh tagihan yang belum dibayar. Tidak ada dana yang dialokasikan ke pos target.';
    recommendation = 'Tinjau tagihan yang belum dibayar, tunda pembayaran yang memungkinkan, atau tambah saldo kas agar Safe-to-Spend kembali positif.';
    actionTarget = 'bills';
    actionLabel = 'Lihat Tagihan';
  } else if (hasGoals) {
    title = 'Dana Target Melebihi Saldo Kas';
    observation = `Safe-to-Spend defisit sebesar -Rp ${deficit.toLocaleString('id-ID')} karena dana yang dialokasikan ke pos target melebihi saldo kas Anda.`;
    interpretation = 'Tidak ada tagihan belum dibayar yang menekan saldo. Defisit berasal dari dana yang dikunci pada pos target.';
    recommendation = 'Tarik sebagian dana dari pos target atau tunda pengeluaran diskresioner agar Safe-to-Spend kembali positif.';
    actionTarget = 'goals';
    actionLabel = 'Tinjau Pos Target';
  } else {
    title = 'Saldo Kas Negatif';
    observation = `Safe-to-Spend defisit sebesar -Rp ${deficit.toLocaleString('id-ID')} karena saldo kas Anda sendiri sudah negatif.`;
    interpretation = 'Tidak ada tagihan belum dibayar atau dana pos target yang menyebabkan defisit. Saldo kas riil Anda memang sudah minus.';
    recommendation = 'Tinjau transaksi terakhir dan catat penyesuaian saldo atau tambahan dana agar saldo kas kembali positif.';
    actionTarget = 'transactions';
    actionLabel = 'Tinjau Transaksi';
  }

  return {
    id: 'daily-safe-to-spend-critical',
    periodType: 'DAILY',
    domain: 'SALDO',
    urgency: 'CRITICAL',
    title,
    observation,
    evidence: {
      currentValue: `-Rp ${deficit.toLocaleString('id-ID')}`,
      breakdown: [
        { label: 'Saldo Kas', value: `Rp ${totalCurrentBalance.toLocaleString('id-ID')}` },
        { label: 'Tagihan Belum Dibayar', value: `Rp ${totalUnpaidBills.toLocaleString('id-ID')}` },
        { label: 'Dana Pos Target', value: `Rp ${totalAllocatedGoals.toLocaleString('id-ID')}` },
      ],
    },
    interpretation,
    recommendation,
    actionTarget,
    actionLabel,
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

  const todayKey = getTodayLocalDateKey(referenceDate);

  const urgentBills = unpaidBills
    .filter((bill) => {
      const dueTime = Date.parse(bill.due_date);
      if (Number.isNaN(dueTime)) return false;
      return dueTime >= todayStart.getTime() && dueTime <= twoDaysLaterEnd.getTime();
    })
    .map((bill) => ({
      bill,
      daysUntilDue: getCalendarDayDiff(todayKey, toLocalDateKey(bill.due_date)),
    }))
    // Jaring pengaman terakhir: hanya tagihan H+0 s.d. H+2 menurut kalender lokal.
    .filter(({ daysUntilDue }) => daysUntilDue >= 0 && daysUntilDue <= 2);

  if (urgentBills.length === 0) return null;

  const totalUrgentAmount = urgentBills.reduce((sum, { bill }) => sum + bill.amount, 0);
  const dueDays = urgentBills.map(({ daysUntilDue }) => daysUntilDue);
  const minDays = Math.min(...dueDays);
  const maxDays = Math.max(...dueDays);
  const nearestBill = urgentBills.reduce((nearest, item) =>
    item.daysUntilDue < nearest.daysUntilDue ? item : nearest
  ).bill;

  return {
    id: 'daily-immediate-bills-due',
    periodType: 'DAILY',
    domain: 'TAGIHAN',
    urgency: 'WARNING',
    title: 'Tagihan Jatuh Tempo Segera',
    observation: `${urgentBills.length} tagihan sebesar Rp ${totalUrgentAmount.toLocaleString('id-ID')} jatuh tempo ${formatDueDescription(minDays, maxDays)}.`,
    evidence: {
      currentValue: `Rp ${totalUrgentAmount.toLocaleString('id-ID')}`,
      diff: `${urgentBills.length} tagihan: ${nearestBill.title}${urgentBills.length > 1 ? ', dll.' : ''}`,
    },
    interpretation: 'Tagihan yang sangat dekat dengan tanggal jatuh tempo membutuhkan persiapan dana likuid di rekening pembayaran.',
    recommendation: 'Pastikan saldo pada rekening pembayaran mencukupi dan bayar tagihan tepat waktu untuk menghindari denda.',
    actionTarget: 'bills',
    actionLabel: 'Lihat Daftar Tagihan',
    nominalImpact: totalUrgentAmount,
  };
}
