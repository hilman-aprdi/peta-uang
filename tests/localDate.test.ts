import { describe, expect, it } from 'vitest';
import {
  filterTransactionsByLocalDate,
  getTodayLocalDateKey,
  toLocalDateKey,
} from '@/lib/utils/localDate';

describe('localDate utilities', () => {
  it('mempertahankan nilai tanggal kalender YYYY-MM-DD apa adanya', () => {
    expect(toLocalDateKey('2026-11-04')).toBe('2026-11-04');
  });

  it('mengonversi timestamp ISO ke tanggal kalender lokal tanpa pergeseran hari', () => {
    const localEarlyMorning = new Date(2026, 10, 4, 0, 30, 0);
    expect(getTodayLocalDateKey(localEarlyMorning)).toBe('2026-11-04');
    expect(toLocalDateKey(localEarlyMorning.toISOString())).toBe('2026-11-04');
  });

  it('mempertahankan tanggal jatuh tempo saat disimpan sebagai timestamp UTC', () => {
    const localMidnight = new Date(2026, 10, 6, 0, 0, 0);
    expect(toLocalDateKey(localMidnight.toISOString())).toBe('2026-11-06');
  });

  it('mengembalikan string kosong untuk nilai yang tidak dapat diparse', () => {
    expect(toLocalDateKey('bukan-tanggal')).toBe('');
  });

  it('hanya mengambil transaksi pada tanggal lokal referensi', () => {
    const referenceDate = new Date(2026, 10, 4, 12, 0, 0);
    const transactions = [
      { id: 'today-date-only', transaction_date: '2026-11-04' },
      { id: 'today-iso', transaction_date: new Date(2026, 10, 4, 0, 5, 0).toISOString() },
      { id: 'yesterday', transaction_date: '2026-11-03' },
      { id: 'future', transaction_date: '2026-11-05' },
    ];

    expect(filterTransactionsByLocalDate(transactions, referenceDate).map((tx) => tx.id)).toEqual([
      'today-date-only',
      'today-iso',
    ]);
  });
});
