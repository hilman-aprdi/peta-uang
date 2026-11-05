import { describe, expect, it } from 'vitest';
import type { Account, Category, Goal, Transaction } from '@/lib/db/schema';
import { evaluateAllInsights } from '@/lib/insight/insightEngine';
import type { InsightEngineInput } from '@/lib/insight/insightTypes';

const baseAccount: Account = {
  id: 'acc-main',
  name: 'BCA Utama',
  type: 'BANK',
  initial_balance: 5_000_000,
  is_active: true,
  created_at: '2026-11-01T00:00:00.000Z',
  updated_at: '2026-11-01T00:00:00.000Z',
};

const foodCategory: Category = {
  id: 'cat-food',
  name: 'Makanan & Minuman',
  type: 'EXPENSE',
  is_system_default: true,
  is_active: true,
  created_at: '2026-11-01T00:00:00.000Z',
};

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
  account_id: 'acc-main',
  category_id,
  transaction_date,
  created_at: transaction_date,
  updated_at: transaction_date,
});

describe('Phase 4: Full Verification, Regression & Empirical Profiling', () => {
  // T-R01: Edit nominal transaksi belanja langsung memperbarui MTD spending surge secara reaktif
  it('T-R01: should dynamically update category surge when transaction amounts are edited', () => {
    const ref = new Date(2026, 10, 15); // 15 Nov 2026

    // Baseline bulan lalu (1 s.d. 15 Okt 2026): Rp300.000
    const priorTxs: Transaction[] = [
      createTx('tx-p1', 'EXPENSE', 150_000, '2026-10-05T10:00:00.000Z', 'cat-food'),
      createTx('tx-p2', 'EXPENSE', 150_000, '2026-10-10T10:00:00.000Z', 'cat-food'),
    ];

    // Kondisi 1: Belanja bulan ini Rp280.000, masih di bawah total penuh bulan lalu Rp300.000
    const currentTxsInitial: Transaction[] = [
      createTx('tx-c1', 'EXPENSE', 120_000, '2026-11-05T10:00:00.000Z', 'cat-food'),
      createTx('tx-c2', 'EXPENSE', 80_000, '2026-11-10T10:00:00.000Z', 'cat-food'),
      createTx('tx-c3', 'EXPENSE', 80_000, '2026-11-12T10:00:00.000Z', 'cat-food'),
    ];

    const inputInitial: InsightEngineInput = {
      transactions: [...priorTxs, ...currentTxsInitial],
      accounts: [baseAccount],
      categories: [foodCategory],
      bills: [],
      goals: [],
      overview: {
        totalCurrentBalance: 5_000_000,
        totalUnpaidBills: 0,
        totalAllocatedGoals: 0,
        safeToSpend: 5_000_000,
      },
      referenceDate: ref,
    };

    const resInitial = evaluateAllInsights(inputInitial);
    expect(resInitial.monthly.insight?.id ?? '').not.toContain('monthly-category-surge');

    // Kondisi 2: Transaksi diedit menjadi Rp650.000, melebihi total penuh bulan lalu -> Memicu perbandingan
    const currentTxsEdited: Transaction[] = [
      createTx('tx-c1', 'EXPENSE', 300_000, '2026-11-05T10:00:00.000Z', 'cat-food'),
      createTx('tx-c2', 'EXPENSE', 300_000, '2026-11-10T10:00:00.000Z', 'cat-food'),
      createTx('tx-c3', 'EXPENSE', 50_000, '2026-11-12T10:00:00.000Z', 'cat-food'),
    ];

    const inputEdited: InsightEngineInput = {
      ...inputInitial,
      transactions: [...priorTxs, ...currentTxsEdited],
    };

    const resEdited = evaluateAllInsights(inputEdited);
    expect(resEdited.monthly.state).toBe('INSIGHT_AVAILABLE');
    expect(resEdited.monthly.insight?.id).toBe('monthly-category-surge-cat-food');
    expect(resEdited.monthly.insight?.evidence.currentValue).toContain('650.000');
  });

  // T-R02: Hapus transaksi mengembalikan alokasi target dan mengevaluasi ulang insight tanpa stale state
  it('T-R02: should immediately clear uncategorized warning when uncategorized transactions are removed', () => {
    const ref = new Date(2026, 10, 4); // 4 Nov 2026

    const uncategorizedTxs: Transaction[] = [
      createTx('tx-u1', 'EXPENSE', 50_000, '2026-11-02T10:00:00.000Z'),
      createTx('tx-u2', 'EXPENSE', 50_000, '2026-11-03T10:00:00.000Z'),
      createTx('tx-u3', 'EXPENSE', 50_000, '2026-11-04T10:00:00.000Z'),
    ];

    const inputWith3Uncat: InsightEngineInput = {
      transactions: uncategorizedTxs,
      accounts: [baseAccount],
      categories: [foodCategory],
      bills: [],
      goals: [],
      overview: {
        totalCurrentBalance: 5_000_000,
        totalUnpaidBills: 0,
        totalAllocatedGoals: 0,
        safeToSpend: 5_000_000,
      },
      referenceDate: ref,
    };

    // 3 transaksi tanpa kategori memicu insight HYGIENE
    const resBefore = evaluateAllInsights(inputWith3Uncat);
    expect(resBefore.weekly.state).toBe('INSIGHT_AVAILABLE');
    expect(resBefore.weekly.insight?.id).toBe('weekly-uncategorized-expenses');

    // Hapus 1 transaksi sehingga sisa 2 transaksi -> Peringatan tetap ada dengan jumlah terbaru
    const inputAfterDeletion: InsightEngineInput = {
      ...inputWith3Uncat,
      transactions: [uncategorizedTxs[0], uncategorizedTxs[1]],
    };

    const resAfterOneDeletion = evaluateAllInsights(inputAfterDeletion);
    expect(resAfterOneDeletion.weekly.state).toBe('INSIGHT_AVAILABLE');
    expect(resAfterOneDeletion.weekly.insight?.id).toBe('weekly-uncategorized-expenses');
    expect(resAfterOneDeletion.weekly.insight?.observation).toContain('2 transaksi');

    // Hapus seluruh transaksi tanpa kategori -> Insight hilang
    const resAfterAllDeleted = evaluateAllInsights({
      ...inputWith3Uncat,
      transactions: [],
    });

    expect(resAfterAllDeleted.weekly.state).toBe('INSUFFICIENT_DATA');
    expect(resAfterAllDeleted.weekly.insight).toBeUndefined();
  });

  // T-R03: Goal over-allocation tidak menyebabkan error runtime pada engine
  it('T-R03: should safely process over-allocated goals without raising errors or false warnings', () => {
    const overAllocatedGoal: Goal = {
      id: 'goal-over',
      name: 'Pos Tabungan Liburan',
      target_amount: 2_000_000,
      allocated_amount: 5_000_000, // 250% over-allocated
      status: 'ACTIVE',
      is_deleted: false,
      created_at: '2026-11-01T00:00:00.000Z',
      updated_at: '2026-11-01T00:00:00.000Z',
    };

    const input: InsightEngineInput = {
      transactions: [],
      accounts: [baseAccount],
      categories: [foodCategory],
      bills: [],
      goals: [overAllocatedGoal],
      overview: {
        totalCurrentBalance: 10_000_000,
        totalUnpaidBills: 0,
        totalAllocatedGoals: 5_000_000,
        safeToSpend: 5_000_000,
      },
      referenceDate: new Date(2026, 10, 15),
    };

    expect(() => evaluateAllInsights(input)).not.toThrow();
    const results = evaluateAllInsights(input);
    // Tidak boleh memicu GOAL_APPROACHING_TARGET
    expect(results.monthly.insight?.id ?? '').not.toContain('monthly-goal-approaching');
  });

  // T-R04: Performance benchmark test: Mengukur latensi eksekusi pada 500 transaksi representatif
  it('T-R04: should execute in-memory insight evaluation within responsive latency on 500 representative transactions', () => {
    const ref = new Date(2026, 10, 15);
    const largeTxDataset: Transaction[] = [];

    // Buat 500 transaksi sintetis bervariasi (Expense, Transfer, Income) tersebar di Oktober & November
    for (let i = 1; i <= 500; i++) {
      const isNov = i % 2 === 0;
      const month = isNov ? '11' : '10';
      const day = String((i % 28) + 1).padStart(2, '0');
      const type: Transaction['type'] = i % 10 === 0 ? 'TRANSFER' : i % 5 === 0 ? 'INCOME' : 'EXPENSE';
      largeTxDataset.push(
        createTx(
          `tx-${i}`,
          type,
          (i * 10_000) % 500_000 + 10_000,
          `2026-${month}-${day}T10:00:00.000Z`,
          i % 3 === 0 ? 'cat-food' : undefined
        )
      );
    }

    const input: InsightEngineInput = {
      transactions: largeTxDataset,
      accounts: [baseAccount],
      categories: [foodCategory],
      bills: [
        {
          id: 'bill-1',
          title: 'Listrik',
          amount: 500_000,
          due_date: '2026-11-18T00:00:00.000Z',
          is_paid: false,
          created_at: '2026-11-01T00:00:00.000Z',
        },
      ],
      goals: [
        {
          id: 'goal-1',
          name: 'Dana Darurat',
          target_amount: 10_000_000,
          allocated_amount: 8_500_000,
          status: 'ACTIVE',
          is_deleted: false,
          created_at: '2026-11-01T00:00:00.000Z',
          updated_at: '2026-11-01T00:00:00.000Z',
        },
      ],
      overview: {
        totalCurrentBalance: 10_000_000,
        totalUnpaidBills: 500_000,
        totalAllocatedGoals: 8_500_000,
        safeToSpend: 1_000_000,
      },
      referenceDate: ref,
    };

    const startTime = performance.now();
    const results = evaluateAllInsights(input);
    const duration = performance.now() - startTime;

    expect(results.daily).toBeDefined();
    expect(results.weekly).toBeDefined();
    expect(results.monthly).toBeDefined();

    // Pastikan eksekusi berjalan sangat cepat (< 50ms di vitest, tipikal < 3ms di real browser)
    expect(duration).toBeLessThan(50);
  });
});
