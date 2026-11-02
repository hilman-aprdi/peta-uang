import { describe, expect, it } from 'vitest';
import { db } from '@/lib/db/schema';
import { calculateAccountBalance, calculateFinancialOverview } from '@/lib/finance/calculator';

const account = (id: string, initial_balance: number, is_active = true) => ({
  id,
  name: id,
  type: 'BANK' as const,
  initial_balance,
  is_active,
  created_at: '2026-11-01T00:00:00.000Z',
  updated_at: '2026-11-01T00:00:00.000Z',
});

const transaction = (id: string, type: 'INCOME' | 'EXPENSE' | 'TRANSFER', amount: number, account_id: string, destination_account_id?: string) => ({
  id,
  title: id,
  type,
  amount,
  account_id,
  destination_account_id,
  transaction_date: '2026-11-01T00:00:00.000Z',
  created_at: '2026-11-01T00:00:00.000Z',
  updated_at: '2026-11-01T00:00:00.000Z',
});

describe('financial calculations', () => {
  it('calculates account ledger with income, expense, and transfer mutations', async () => {
    await db.accounts.bulkAdd([account('source', 100_000), account('destination', 10_000)]);
    await db.transactions.bulkAdd([
      transaction('income', 'INCOME', 50_000, 'source'),
      transaction('expense', 'EXPENSE', 20_000, 'source'),
      transaction('transfer', 'TRANSFER', 30_000, 'source', 'destination'),
    ]);

    await expect(calculateAccountBalance('source')).resolves.toBe(100_000);
    await expect(calculateAccountBalance('destination')).resolves.toBe(40_000);
  });

  it('excludes inactive accounts and paid bills from financial overview', async () => {
    await db.accounts.bulkAdd([account('active', 100_000), account('inactive', 500_000, false)]);
    await db.bills.bulkAdd([
      { id: 'unpaid', title: 'Unpaid', amount: 25_000, due_date: '2026-11-10T00:00:00.000Z', is_paid: false, created_at: '2026-11-01T00:00:00.000Z' },
      { id: 'paid', title: 'Paid', amount: 15_000, due_date: '2026-11-10T00:00:00.000Z', is_paid: true, created_at: '2026-11-01T00:00:00.000Z' },
    ]);

    await expect(calculateFinancialOverview()).resolves.toEqual({
      totalCurrentBalance: 100_000,
      totalUnpaidBills: 25_000,
      safeToSpend: 75_000,
    });
  });

  it('allows Safe-to-Spend to be negative when unpaid bills exceed balance', async () => {
    await db.accounts.add(account('active', 20_000));
    await db.bills.add({ id: 'unpaid', title: 'Unpaid', amount: 50_000, due_date: '2026-11-10T00:00:00.000Z', is_paid: false, created_at: '2026-11-01T00:00:00.000Z' });

    const overview = await calculateFinancialOverview();
    expect(overview.safeToSpend).toBe(-30_000);
  });
});
