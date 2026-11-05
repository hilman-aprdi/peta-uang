import { describe, expect, it } from 'vitest';
import type { Account, Category, Goal, Transaction } from '@/lib/db/schema';
import {
  evaluateWeeklyInsight,
  evaluateMonthlyInsight,
  evaluateAllInsights,
  prioritizeSinglePeriodCandidates,
} from '@/lib/insight/insightEngine';
import { evaluateGoalApproachingTarget } from '@/lib/insight/rules/monthlyRules';
import { evaluateSafeToSpendCritical } from '@/lib/insight/rules/dailyRules';
import type { FinancialInsight, InsightEngineInput } from '@/lib/insight/insightTypes';

const baseAccount: Account = {
  id: 'acc-1',
  name: 'BCA',
  type: 'BANK',
  initial_balance: 10_000_000,
  is_active: true,
  created_at: '2026-11-01T00:00:00.000Z',
  updated_at: '2026-11-01T00:00:00.000Z',
};

const baseCategory: Category = {
  id: 'cat-food',
  name: 'Makanan',
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
  account_id: 'acc-1',
  category_id,
  transaction_date,
  created_at: transaction_date,
  updated_at: transaction_date,
});

describe('Phase 2: Insight Engine & Detection Rules', () => {
  // T-E01: Goal dengan target_amount: 0 atau negatif tidak menghasilkan GOAL_APPROACHING_TARGET
  it('T-E01: should reject goal approaching target when target_amount is <= 0', () => {
    const goals: Goal[] = [
      {
        id: 'goal-invalid',
        name: 'Target Nol',
        target_amount: 0,
        allocated_amount: 0,
        status: 'ACTIVE',
        is_deleted: false,
        created_at: '2026-11-01T00:00:00.000Z',
        updated_at: '2026-11-01T00:00:00.000Z',
      },
    ];

    const result = evaluateGoalApproachingTarget(goals);
    expect(result).toBeNull();
  });

  // T-E02: Goal dengan allocated_amount >= target_amount (100% atau over-allocated 150%) tidak menghasilkan GOAL_APPROACHING_TARGET
  it('T-E02: should ignore goals that already reached 100% or are over-allocated', () => {
    const goals: Goal[] = [
      {
        id: 'goal-exact',
        name: 'Target Pas 100%',
        target_amount: 5_000_000,
        allocated_amount: 5_000_000,
        status: 'ACTIVE',
        is_deleted: false,
        created_at: '2026-11-01T00:00:00.000Z',
        updated_at: '2026-11-01T00:00:00.000Z',
      },
      {
        id: 'goal-over',
        name: 'Target Over-allocated 150%',
        target_amount: 2_000_000,
        allocated_amount: 3_000_000,
        status: 'ACTIVE',
        is_deleted: false,
        created_at: '2026-11-01T00:00:00.000Z',
        updated_at: '2026-11-01T00:00:00.000Z',
      },
    ];

    const result = evaluateGoalApproachingTarget(goals);
    expect(result).toBeNull();
  });

  // T-E03: Goal dengan progress 85% menghasilkan GOAL_APPROACHING_TARGET
  it('T-E03: should detect goal approaching target when ratio is between 80% and <100%', () => {
    const goals: Goal[] = [
      {
        id: 'goal-near',
        name: 'Beli Laptop',
        target_amount: 10_000_000,
        allocated_amount: 8_500_000, // 85%
        status: 'ACTIVE',
        is_deleted: false,
        created_at: '2026-11-01T00:00:00.000Z',
        updated_at: '2026-11-01T00:00:00.000Z',
      },
    ];

    const result = evaluateGoalApproachingTarget(goals);
    expect(result).not.toBeNull();
    expect(result?.urgency).toBe('OPPORTUNITY');
    expect(result?.title).toContain('Beli Laptop');
    expect(result?.evidence.currentValue).toContain('8.500.000');
    expect(result?.evidence.diff).toContain('1.500.000');
  });

  // T-E04: Transaksi TRANSFER diabaikan sepenuhnya dari pengeluaran
  it('T-E04: should strictly ignore TRANSFER transactions when evaluating expenses', () => {
    const ref = new Date(2026, 10, 4); // 4 Nov 2026
    const input: InsightEngineInput = {
      transactions: [
        createTx('tx-trf', 'TRANSFER', 50_000_000, '2026-11-04T10:00:00.000Z'),
      ],
      accounts: [baseAccount],
      categories: [baseCategory],
      bills: [],
      goals: [],
      overview: {
        totalCurrentBalance: 10_000_000,
        totalUnpaidBills: 0,
        totalAllocatedGoals: 0,
        safeToSpend: 10_000_000,
      },
      referenceDate: ref,
    };

    const weekly = evaluateWeeklyInsight(input);
    // Karena satu-satunya transaksi adalah TRANSFER, pengeluaran dianggap 0
    expect(weekly.state).toBe('INSUFFICIENT_DATA');
  });

  // T-E05: Daily menghasilkan SAFE_TO_SPEND_CRITICAL dan Weekly menghasilkan UNCATEGORIZED_EXPENSES secara simultan tanpa suppression
  it('T-E05: should evaluate Daily and Weekly independently without cross-period suppression', () => {
    const ref = new Date(2026, 10, 4); // 4 Nov 2026 (Rabu)
    const input: InsightEngineInput = {
      transactions: [
        createTx('tx-1', 'EXPENSE', 100_000, '2026-11-02T10:00:00.000Z'), // No category
        createTx('tx-2', 'EXPENSE', 100_000, '2026-11-03T10:00:00.000Z'), // No category
        createTx('tx-3', 'EXPENSE', 100_000, '2026-11-04T10:00:00.000Z'), // No category
      ],
      accounts: [baseAccount],
      categories: [baseCategory],
      bills: [],
      goals: [],
      overview: {
        totalCurrentBalance: 2_000_000,
        totalUnpaidBills: 1_000_000,
        totalAllocatedGoals: 2_000_000,
        safeToSpend: -1_000_000, // Defisit -1.000.000
      },
      referenceDate: ref,
    };

    const results = evaluateAllInsights(input);

    // Daily wajib memunculkan insight kritis dengan diagnosis komitmen gabungan
    expect(results.daily.state).toBe('INSIGHT_AVAILABLE');
    expect(results.daily.insight?.urgency).toBe('CRITICAL');
    expect(results.daily.insight?.id).toBe('daily-safe-to-spend-critical');
    expect(results.daily.insight?.title).toBe('Saldo Kas Tidak Menutup Komitmen');
    expect(results.daily.insight?.actionTarget).toBe('bills');

    // Weekly wajib memunculkan insight hygiene uncategorized (TIDAK ditekan oleh Daily)
    expect(results.weekly.state).toBe('INSIGHT_AVAILABLE');
    expect(results.weekly.insight?.urgency).toBe('HYGIENE');
    expect(results.weekly.insight?.id).toBe('weekly-uncategorized-expenses');
    expect(results.weekly.insights?.map((insight) => insight.id)).toContain(
      'weekly-uncategorized-expenses'
    );
  });

  // T-E06: Seleksi prioritas internal periode memilih kandidat urgensi tertinggi
  it('T-E06: should prioritize CRITICAL over WARNING and HYGIENE within the same period', () => {
    const candidates: FinancialInsight[] = [
      {
        id: 'insight-hygiene',
        periodType: 'DAILY',
        domain: 'DATA',
        urgency: 'HYGIENE',
        title: 'Hygiene',
        observation: '',
        evidence: { currentValue: '' },
        interpretation: '',
        recommendation: '',
        nominalImpact: 50_000,
      },
      {
        id: 'insight-critical',
        periodType: 'DAILY',
        domain: 'SALDO',
        urgency: 'CRITICAL',
        title: 'Critical',
        observation: '',
        evidence: { currentValue: '' },
        interpretation: '',
        recommendation: '',
        nominalImpact: 1_000_000,
      },
      {
        id: 'insight-warning',
        periodType: 'DAILY',
        domain: 'TAGIHAN',
        urgency: 'WARNING',
        title: 'Warning',
        observation: '',
        evidence: { currentValue: '' },
        interpretation: '',
        recommendation: '',
        nominalImpact: 500_000,
      },
    ];

    const top = prioritizeSinglePeriodCandidates(candidates);
    expect(top?.id).toBe('insight-critical');
  });

  // T-E07: State transition: INSUFFICIENT_DATA -> INSIGHT_AVAILABLE -> NO_SIGNIFICANT_FINDING
  it('T-E07: should correctly yield NO_SIGNIFICANT_FINDING when conditions are stable and data is sufficient', () => {
    const ref = new Date(2026, 10, 15); // 15 Nov 2026
    const input: InsightEngineInput = {
      transactions: [
        createTx('tx-1', 'EXPENSE', 50_000, '2026-11-09T10:00:00.000Z', 'cat-food'),
        createTx('tx-2', 'EXPENSE', 50_000, '2026-11-10T10:00:00.000Z', 'cat-food'),
        createTx('tx-3', 'EXPENSE', 50_000, '2026-11-11T10:00:00.000Z', 'cat-food'),
      ],
      accounts: [baseAccount],
      categories: [baseCategory],
      bills: [],
      goals: [],
      overview: {
        totalCurrentBalance: 10_000_000,
        totalUnpaidBills: 0,
        totalAllocatedGoals: 0,
        safeToSpend: 10_000_000,
      },
      referenceDate: ref,
    };

    const weekly = evaluateWeeklyInsight(input);
    // Data cukup, ada kategori lengkap, tidak ada tagihan risiko
    expect(weekly.state).toBe('NO_SIGNIFICANT_FINDING');
    expect(weekly.fallbackMessage).toContain('stabil dan terkendali');
  });

  // T-E08: D-1 mendiagnosis penyebab defisit dan memilih CTA yang relevan
  it('T-E08: should diagnose the cause of a negative Safe-to-Spend', () => {
    const baseInput: InsightEngineInput = {
      transactions: [],
      accounts: [baseAccount],
      categories: [baseCategory],
      bills: [],
      goals: [],
      referenceDate: new Date(2026, 10, 5),
    };

    const billsOnly = evaluateSafeToSpendCritical({
      ...baseInput,
      overview: {
        totalCurrentBalance: 1_500_000,
        totalUnpaidBills: 2_000_000,
        totalAllocatedGoals: 0,
        safeToSpend: -500_000,
      },
    });

    expect(billsOnly?.title).toBe('Tagihan Melebihi Saldo Kas');
    expect(billsOnly?.actionTarget).toBe('bills');
    expect(billsOnly?.evidence.breakdown?.map((item) => item.label)).toEqual([
      'Saldo Kas',
      'Tagihan Belum Dibayar',
      'Dana Pos Target',
    ]);

    const goalsOnly = evaluateSafeToSpendCritical({
      ...baseInput,
      overview: {
        totalCurrentBalance: 1_500_000,
        totalUnpaidBills: 0,
        totalAllocatedGoals: 2_000_000,
        safeToSpend: -500_000,
      },
    });

    expect(goalsOnly?.title).toBe('Dana Target Melebihi Saldo Kas');
    expect(goalsOnly?.actionTarget).toBe('goals');

    const negativeBalance = evaluateSafeToSpendCritical({
      ...baseInput,
      overview: {
        totalCurrentBalance: -500_000,
        totalUnpaidBills: 0,
        totalAllocatedGoals: 0,
        safeToSpend: -500_000,
      },
    });

    expect(negativeBalance?.title).toBe('Saldo Kas Negatif');
    expect(negativeBalance?.actionTarget).toBe('transactions');
  });

  // T-E09: W-2 aktif dengan 1 transaksi INCOME tanpa kategori
  it('T-E09: should trigger uncategorized warning for a single income transaction', () => {
    const ref = new Date(2026, 10, 4); // 4 Nov 2026 (Rabu)
    const input: InsightEngineInput = {
      transactions: [
        createTx('tx-income', 'INCOME', 75_000, '2026-11-03T10:00:00.000Z'),
      ],
      accounts: [baseAccount],
      categories: [baseCategory],
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

    const weekly = evaluateWeeklyInsight(input);

    expect(weekly.state).toBe('INSIGHT_AVAILABLE');
    expect(weekly.insight?.id).toBe('weekly-uncategorized-expenses');
    expect(weekly.insight?.observation).toContain('1 transaksi');
    expect(weekly.insight?.nominalImpact).toBe(75_000);
  });

  // T-E10: W-2 tetap tersedia di Priority Inbox saat W-1 juga terpicu
  it('T-E10: should expose both W-1 and W-2 candidates when both rules trigger', () => {
    const ref = new Date(2026, 10, 4); // 4 Nov 2026
    const input: InsightEngineInput = {
      transactions: [
        createTx('tx-uncat', 'EXPENSE', 50_000, '2026-11-03T10:00:00.000Z'),
      ],
      accounts: [baseAccount],
      categories: [baseCategory],
      bills: [
        {
          id: 'bill-urgent',
          title: 'Listrik',
          amount: 600_000,
          due_date: '2026-11-05T00:00:00.000Z',
          is_paid: false,
          created_at: '2026-11-01T00:00:00.000Z',
        },
      ],
      goals: [],
      overview: {
        totalCurrentBalance: 1_000_000,
        totalUnpaidBills: 600_000,
        totalAllocatedGoals: 0,
        safeToSpend: 400_000,
      },
      referenceDate: ref,
    };

    const weekly = evaluateWeeklyInsight(input);
    const ids = weekly.insights?.map((insight) => insight.id) ?? [];

    expect(ids).toContain('weekly-upcoming-bills-risk');
    expect(ids).toContain('weekly-uncategorized-expenses');
    expect(weekly.insight?.id).toBe('weekly-upcoming-bills-risk');
  });

  // T-E11: M-1 membandingkan bulan berjalan dengan total penuh bulan lalu dan memakai comparator ketat
  it('T-E11: should compare current month spending against the full prior month with strict greater-than', () => {
    const ref = new Date(2026, 10, 6); // 6 Nov 2026
    const priorTx = createTx('tx-prior', 'EXPENSE', 150_000, '2026-10-30T10:00:00.000Z', 'cat-food');
    const equalCurrentTx = createTx('tx-equal', 'EXPENSE', 150_000, '2026-11-05T10:00:00.000Z', 'cat-food');
    const higherCurrentTx = createTx('tx-higher', 'EXPENSE', 200_000, '2026-11-05T10:00:00.000Z', 'cat-food');

    const baseInput: InsightEngineInput = {
      transactions: [priorTx, equalCurrentTx],
      accounts: [baseAccount],
      categories: [baseCategory],
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

    const equalResult = evaluateMonthlyInsight(baseInput);
    expect(equalResult.insight?.id ?? '').not.toContain('monthly-category-surge');

    const higherResult = evaluateMonthlyInsight({
      ...baseInput,
      transactions: [priorTx, higherCurrentTx],
    });

    expect(higherResult.insight?.id).toBe('monthly-category-surge-cat-food');
    expect(higherResult.insight?.observation).toContain('Rp 200.000');
    expect(higherResult.insight?.observation).toContain('Rp 150.000');
    expect(higherResult.insight?.evidence.diff).toBe('+Rp 50.000');
  });
});
