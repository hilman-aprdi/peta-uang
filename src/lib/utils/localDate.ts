const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function formatLocalDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Mengubah nilai tanggal transaksi menjadi key tanggal kalender lokal (YYYY-MM-DD).
 *
 * Nilai `YYYY-MM-DD` diperlakukan sebagai tanggal kalender apa adanya. Nilai
 * timestamp (termasuk ISO 8601 UTC) dikonversi ke komponen tanggal lokal agar
 * tidak terjadi pergeseran hari akibat offset timezone.
 */
export function toLocalDateKey(value: string): string {
  if (DATE_ONLY_PATTERN.test(value)) return value;

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '';

  return formatLocalDateKey(parsed);
}

export function getTodayLocalDateKey(referenceDate: Date = new Date()): string {
  return formatLocalDateKey(referenceDate);
}

export function filterTransactionsByLocalDate<T extends { transaction_date: string }>(
  transactions: T[],
  referenceDate: Date = new Date()
): T[] {
  const todayKey = getTodayLocalDateKey(referenceDate);
  return transactions.filter((transaction) => toLocalDateKey(transaction.transaction_date) === todayKey);
}
