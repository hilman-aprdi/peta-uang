import { describe, expect, it } from 'vitest';
import { db } from '@/lib/db/schema';
import { getAccountBalance } from '@/lib/services/accountService';
import { executeTransfer } from '@/lib/services/transferService';

const account = (id: string, initial_balance: number, is_active = true) => ({
  id,
  name: id,
  type: 'BANK' as const,
  initial_balance,
  is_active,
  created_at: '2026-11-01T00:00:00.000Z',
  updated_at: '2026-11-01T00:00:00.000Z',
});

describe('transfer business rules', () => {
  it('rejects transfer when source balance is insufficient and does not create a transaction', async () => {
    await db.accounts.bulkAdd([account('source', 10_000), account('destination', 0)]);

    await expect(executeTransfer({
      source_account_id: 'source',
      destination_account_id: 'destination',
      amount: 20_000,
      transaction_date: '2026-11-01T00:00:00.000Z',
    })).rejects.toThrow('Saldo akun sumber tidak mencukupi');

    expect(await db.transactions.count()).toBe(0);
    await expect(getAccountBalance('source')).resolves.toBe(10_000);
    await expect(getAccountBalance('destination')).resolves.toBe(0);
  });

  it('rejects invalid transfer amount and same source/destination', async () => {
    await db.accounts.bulkAdd([account('source', 100_000), account('destination', 0)]);

    await expect(executeTransfer({ source_account_id: 'source', destination_account_id: 'destination', amount: 10.5, transaction_date: '2026-11-01T00:00:00.000Z' })).rejects.toThrow('integer');
    await expect(executeTransfer({ source_account_id: 'source', destination_account_id: 'source', amount: 10_000, transaction_date: '2026-11-01T00:00:00.000Z' })).rejects.toThrow('tidak boleh sama');
  });

  it('moves balance between active accounts without changing total net worth', async () => {
    await db.accounts.bulkAdd([account('source', 100_000), account('destination', 20_000)]);

    await executeTransfer({ source_account_id: 'source', destination_account_id: 'destination', amount: 30_000, transaction_date: '2026-11-01T00:00:00.000Z', note: 'Transfer test' });

    await expect(getAccountBalance('source')).resolves.toBe(70_000);
    await expect(getAccountBalance('destination')).resolves.toBe(50_000);
    expect((await getAccountBalance('source')) + (await getAccountBalance('destination'))).toBe(120_000);
  });
});
