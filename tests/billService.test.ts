import { describe, expect, it } from 'vitest';
import { db } from '@/lib/db/schema';
import { calculateFinancialOverview } from '@/lib/finance/calculator';
import { createBill, deleteBill, setBillPaid, updateBill } from '@/lib/services/billService';

describe('bill lifecycle', () => {
  it('creates, updates, pays, and deletes a bill', async () => {
    const id = await createBill({
      title: 'Internet',
      amount: 150_000,
      due_date: '2026-11-10',
    });

    await expect(db.bills.get(id)).resolves.toMatchObject({
      title: 'Internet',
      amount: 150_000,
      is_paid: false,
    });

    await updateBill(id, {
      title: 'Internet Rumah',
      amount: 175_000,
      due_date: '2026-11-15',
    });
    await expect(db.bills.get(id)).resolves.toMatchObject({
      title: 'Internet Rumah',
      amount: 175_000,
      due_date: '2026-11-15',
      is_paid: false,
    });

    await setBillPaid(id, true);
    await expect(db.bills.get(id)).resolves.toMatchObject({ is_paid: true });

    await deleteBill(id);
    await expect(db.bills.get(id)).resolves.toBeUndefined();
  });

  it('subtracts only unpaid bills from Safe-to-Spend', async () => {
    await db.accounts.add({
      id: 'cash',
      name: 'Cash',
      type: 'CASH',
      initial_balance: 500_000,
      is_active: true,
      created_at: '2026-11-01T00:00:00.000Z',
      updated_at: '2026-11-01T00:00:00.000Z',
    });

    const unpaidId = await createBill({ title: 'Listrik', amount: 100_000, due_date: '2026-11-20' });
    const paidId = await createBill({ title: 'Air', amount: 50_000, due_date: '2026-11-21' });
    await setBillPaid(paidId, true);

    await expect(calculateFinancialOverview()).resolves.toMatchObject({
      totalCurrentBalance: 500_000,
      totalUnpaidBills: 100_000,
      safeToSpend: 400_000,
    });

    await deleteBill(unpaidId);
  });

  it('creates an expense transaction when paid with paymentDetails and deletes it when marked unpaid', async () => {
    await db.accounts.add({
      id: 'acc-bca',
      name: 'Bank BCA',
      type: 'BANK',
      initial_balance: 1_000_000,
      is_active: true,
      created_at: '2026-11-01T00:00:00.000Z',
      updated_at: '2026-11-01T00:00:00.000Z',
    });

    const billId = await createBill({
      title: 'Tagihan Listrik',
      amount: 250_000,
      due_date: '2026-11-25',
    });

    // Pay with account
    await setBillPaid(billId, true, {
      account_id: 'acc-bca',
      payment_date: '2026-11-20',
    });

    const paidBill = await db.bills.get(billId);
    expect(paidBill?.is_paid).toBe(true);
    expect(paidBill?.transaction_id).toBeDefined();

    const tx = await db.transactions.get(paidBill!.transaction_id!);
    expect(tx).toMatchObject({
      title: 'Tagihan Listrik',
      type: 'EXPENSE',
      amount: 250_000,
      account_id: 'acc-bca',
    });

    // Mark as unpaid -> should delete transaction & restore ledger
    await setBillPaid(billId, false);

    const unpaidBill = await db.bills.get(billId);
    expect(unpaidBill?.is_paid).toBe(false);
    expect(unpaidBill?.transaction_id).toBeUndefined();

    const deletedTx = await db.transactions.get(paidBill!.transaction_id!);
    expect(deletedTx).toBeUndefined();

    await deleteBill(billId);
  });
});
