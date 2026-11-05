import { describe, expect, it } from 'vitest';
import type { Bill } from '@/lib/db/schema';
import { evaluateImmediateBillsDue } from '@/lib/insight/rules/dailyRules';

const REFERENCE_DATE = new Date(2026, 10, 5, 10, 0, 0); // 5 November 2026

function createBill(
  id: string,
  title: string,
  amount: number,
  dueDate: Date,
  isPaid = false
): Bill {
  return {
    id,
    title,
    amount,
    due_date: dueDate.toISOString(),
    is_paid: isPaid,
    created_at: new Date(2026, 10, 1).toISOString(),
  };
}

describe('Rule D-2: IMMEDIATE_BILLS_DUE', () => {
  it('menyebut "besok" untuk tagihan yang jatuh tempo satu hari lagi', () => {
    const bill = createBill('bill-1', 'Listrik', 3_000_000, new Date(2026, 10, 6, 0, 0, 0));

    const insight = evaluateImmediateBillsDue([bill], REFERENCE_DATE);

    expect(insight?.observation).toBe(
      '1 tagihan sebesar Rp 3.000.000 jatuh tempo besok.'
    );
  });

  it('menyebut "hari ini" untuk tagihan yang jatuh tempo hari ini', () => {
    const bill = createBill('bill-1', 'Listrik', 500_000, new Date(2026, 10, 5, 0, 0, 0));

    const insight = evaluateImmediateBillsDue([bill], REFERENCE_DATE);

    expect(insight?.observation).toBe(
      '1 tagihan sebesar Rp 500.000 jatuh tempo hari ini.'
    );
  });

  it('menyebut "dalam 2 hari" untuk tagihan yang jatuh tempo dua hari lagi', () => {
    const bill = createBill('bill-1', 'Internet', 750_000, new Date(2026, 10, 7, 0, 0, 0));

    const insight = evaluateImmediateBillsDue([bill], REFERENCE_DATE);

    expect(insight?.observation).toBe(
      '1 tagihan sebesar Rp 750.000 jatuh tempo dalam 2 hari.'
    );
  });

  it('menyebut rentang hari ini hingga 2 hari ke depan untuk tanggal yang berbeda', () => {
    const bills = [
      createBill('bill-1', 'Listrik', 1_000_000, new Date(2026, 10, 5, 0, 0, 0)),
      createBill('bill-2', 'Internet', 2_000_000, new Date(2026, 10, 7, 0, 0, 0)),
    ];

    const insight = evaluateImmediateBillsDue(bills, REFERENCE_DATE);

    expect(insight?.observation).toBe(
      '2 tagihan sebesar Rp 3.000.000 jatuh tempo antara hari ini dan 2 hari ke depan.'
    );
  });

  it('menyebut rentang besok hingga 2 hari ke depan untuk tanggal yang berbeda', () => {
    const bills = [
      createBill('bill-1', 'Listrik', 1_000_000, new Date(2026, 10, 6, 0, 0, 0)),
      createBill('bill-2', 'Internet', 2_000_000, new Date(2026, 10, 7, 0, 0, 0)),
    ];

    const insight = evaluateImmediateBillsDue(bills, REFERENCE_DATE);

    expect(insight?.observation).toBe(
      '2 tagihan sebesar Rp 3.000.000 jatuh tempo antara besok dan 2 hari ke depan.'
    );
  });

  it('tetap memakai satu frasa jika beberapa tagihan jatuh tempo pada tanggal yang sama', () => {
    const bills = [
      createBill('bill-1', 'Listrik', 1_000_000, new Date(2026, 10, 6, 0, 0, 0)),
      createBill('bill-2', 'Internet', 2_000_000, new Date(2026, 10, 6, 0, 0, 0)),
    ];

    const insight = evaluateImmediateBillsDue(bills, REFERENCE_DATE);

    expect(insight?.observation).toBe(
      '2 tagihan sebesar Rp 3.000.000 jatuh tempo besok.'
    );
  });

  it('memakai tagihan dengan jatuh tempo terdekat pada evidence, bukan urutan array', () => {
    const bills = [
      createBill('bill-1', 'Internet', 2_000_000, new Date(2026, 10, 7, 0, 0, 0)),
      createBill('bill-2', 'Listrik', 1_000_000, new Date(2026, 10, 6, 0, 0, 0)),
    ];

    const insight = evaluateImmediateBillsDue(bills, REFERENCE_DATE);

    expect(insight?.evidence.diff).toBe('2 tagihan: Listrik, dll.');
  });

  it('mengabaikan tagihan yang jatuh tempo lebih dari 2 hari', () => {
    const bill = createBill('bill-1', 'Listrik', 1_000_000, new Date(2026, 10, 8, 0, 0, 0));

    expect(evaluateImmediateBillsDue([bill], REFERENCE_DATE)).toBeNull();
  });

  it('mengabaikan tagihan yang sudah dibayar', () => {
    const bill = createBill(
      'bill-1',
      'Listrik',
      1_000_000,
      new Date(2026, 10, 6, 0, 0, 0),
      true
    );

    expect(evaluateImmediateBillsDue([bill], REFERENCE_DATE)).toBeNull();
  });

  it('mengabaikan due_date yang tidak valid', () => {
    const bill: Bill = {
      ...createBill('bill-1', 'Listrik', 1_000_000, new Date(2026, 10, 6, 0, 0, 0)),
      due_date: 'bukan-tanggal',
    };

    expect(evaluateImmediateBillsDue([bill], REFERENCE_DATE)).toBeNull();
  });

  it('tetap menghitung hari lokal saat due_date disimpan sebagai timestamp UTC tengah malam', () => {
    const localMidnight = new Date(2026, 10, 6, 0, 0, 0);
    const bill = createBill('bill-1', 'Listrik', 1_000_000, localMidnight);

    const insight = evaluateImmediateBillsDue([bill], REFERENCE_DATE);

    expect(insight?.observation).toContain('jatuh tempo besok.');
  });

  it('memasukkan tagihan pada batas akhir H+2 23:59:59.999', () => {
    const bill = createBill(
      'bill-1',
      'Listrik',
      1_000_000,
      new Date(2026, 10, 7, 23, 59, 59, 999)
    );

    const insight = evaluateImmediateBillsDue([bill], REFERENCE_DATE);

    expect(insight?.observation).toContain('jatuh tempo dalam 2 hari.');
  });

  it('mengecualikan tagihan tepat pada awal H+3', () => {
    const bill = createBill('bill-1', 'Listrik', 1_000_000, new Date(2026, 10, 8, 0, 0, 0));

    expect(evaluateImmediateBillsDue([bill], REFERENCE_DATE)).toBeNull();
  });
});
