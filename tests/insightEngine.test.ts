import { describe, expect, it } from 'vitest';
import type { Account, Bill, Category, Goal, Transaction } from '@/lib/db/schema';
import {
  evaluateDailyInsight,
  evaluateWeeklyInsight,
  evaluateMonthlyInsight,
  evaluateAllInsights,
  prioritizeSinglePeriodCandidates,
} from '@/lib/insight/insightEngine';
import { evaluateGoalApproachingTarget } from '@/lib/insight/rules/monthlyRules';
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

    // Daily wajib memunculkan insight kritis
    expect(results.daily.state).toBe('INSIGHT_AVAILABLE');
    expect(results.daily.insight?.urgency).toBe('CRITICAL');
    expect(results.daily.insight?.id).toBe('daily-safe-to-spend-critical');

    // Weekly wajib memunculkan insight hygiene uncategorized (TIDAK ditekan oleh Daily)
    expect(results.weekly.state).toBe('INSIGHT_AVAILABLE');
    expect(results.weekly.insight?.urgency).toBe('HYGIENE');
    expect(results.weekly.insight?.id).toBe('weekly-uncategorized-expenses');
  });

  // T-E06: Seleksi prioritas internal periode memilih kandidat urgensi tertinggi
  it('T-E06: should prioritize CRITICAL over WARNING and HYGIENE within the same period', () => {
    const candidates: FinancialInsight[] = [
      {
        id: 'insight-hygiene',
        periodType: 'DAILY',
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
});
