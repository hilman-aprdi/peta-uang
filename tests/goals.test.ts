import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/lib/db/schema';
import { calculateAccountBalance, calculateFinancialOverview } from '@/lib/finance/calculator';
import {
  allocateFunds,
  calculateReconstructedGoalAllocation,
  createGoal,
  deleteGoal,
  setGoalStatus,
  spendFromGoal,
  updateGoal,
  withdrawFunds,
} from '@/lib/services/goalService';
import { deleteTransaction, updateTransaction } from '@/lib/services/transactionService';

const account = (id: string, initial_balance: number, is_active = true) => ({
  id,
  name: id,
  type: 'BANK' as const,
  initial_balance,
  is_active,
  created_at: '2026-11-01T00:00:00.000Z',
  updated_at: '2026-11-01T00:00:00.000Z',
});

describe('Goals Feature — Financial Invariants & Edge Cases', () => {
  beforeEach(async () => {
    await db.accounts.clear();
    await db.categories.clear();
    await db.transactions.clear();
    await db.bills.clear();
    await db.goals.clear();
    await db.goal_allocations.clear();
  });

  // 1. Creating a Goal does not affect Safe-to-Spend or account balance
  it('1. creating a Goal does not affect Safe-to-Spend or account balance', async () => {
    await db.accounts.add(account('bca', 10_000_000));
    await db.bills.add({
      id: 'bill-1',
      title: 'Listrik',
      amount: 1_000_000,
      due_date: '2026-11-10T00:00:00.000Z',
      is_paid: false,
      created_at: '2026-11-01T00:00:00.000Z',
    });

    const overviewBefore = await calculateFinancialOverview();
    expect(overviewBefore.safeToSpend).toBe(9_000_000);
    expect(overviewBefore.totalCurrentBalance).toBe(10_000_000);

    const goalId = await createGoal({
      name: 'Beli Laptop',
      target_amount: 8_000_000,
    });

    const goal = await db.goals.get(goalId);
    expect(goal).toBeDefined();
    expect(goal?.allocated_amount).toBe(0);

    const overviewAfter = await calculateFinancialOverview();
    expect(overviewAfter.safeToSpend).toBe(9_000_000);
    expect(overviewAfter.totalCurrentBalance).toBe(10_000_000);
    expect(overviewAfter.totalAllocatedGoals).toBe(0);
  });

  // 2. Allocating funds reduces Safe-to-Spend but not account balance
  it('2. allocating funds reduces Safe-to-Spend but not account balance', async () => {
    await db.accounts.add(account('bca', 10_000_000));
    await db.bills.add({
      id: 'bill-1',
      title: 'Listrik',
      amount: 1_000_000,
      due_date: '2026-11-10T00:00:00.000Z',
      is_paid: false,
      created_at: '2026-11-01T00:00:00.000Z',
    });

    const goalId = await createGoal({ name: 'Beli Laptop', target_amount: 8_000_000 });
    await allocateFunds(goalId, 3_000_000, 'Nabung awal');

    const goal = await db.goals.get(goalId);
    expect(goal?.allocated_amount).toBe(3_000_000);

    // Invariant 4: goals.allocated_amount = reconstructed remaining allocation from goal_allocations history
    const reconstructed = await calculateReconstructedGoalAllocation(goalId);
    expect(reconstructed).toBe(3_000_000);

    const overview = await calculateFinancialOverview();
    expect(overview.totalCurrentBalance).toBe(10_000_000);
    expect(overview.totalUnpaidBills).toBe(1_000_000);
    expect(overview.totalAllocatedGoals).toBe(3_000_000);
    expect(overview.safeToSpend).toBe(6_000_000);

    // Account ledger balance is unchanged
    expect(await calculateAccountBalance('bca')).toBe(10_000_000);
  });

  // 3. Withdrawing funds restores Safe-to-Spend
  it('3. withdrawing funds restores Safe-to-Spend', async () => {
    await db.accounts.add(account('bca', 10_000_000));
    await db.bills.add({
      id: 'bill-1',
      title: 'Listrik',
      amount: 1_000_000,
      due_date: '2026-11-10T00:00:00.000Z',
      is_paid: false,
      created_at: '2026-11-01T00:00:00.000Z',
    });

    const goalId = await createGoal({ name: 'Beli Laptop', target_amount: 8_000_000 });
    await allocateFunds(goalId, 3_000_000);
    await withdrawFunds(goalId, 1_000_000);

    const goal = await db.goals.get(goalId);
    expect(goal?.allocated_amount).toBe(2_000_000);

    const reconstructed = await calculateReconstructedGoalAllocation(goalId);
    expect(reconstructed).toBe(2_000_000);

    const overview = await calculateFinancialOverview();
    expect(overview.totalCurrentBalance).toBe(10_000_000);
    expect(overview.totalAllocatedGoals).toBe(2_000_000);
    expect(overview.safeToSpend).toBe(7_000_000);
  });

  // 4. Spending from Goal reduces both account balance and Goal allocation correctly without double-counting Safe-to-Spend
  it('4. spending from Goal reduces both account balance and Goal allocation correctly', async () => {
    await db.accounts.add(account('bca', 10_000_000));
    await db.bills.add({
      id: 'bill-1',
      title: 'Listrik',
      amount: 1_000_000,
      due_date: '2026-11-10T00:00:00.000Z',
      is_paid: false,
      created_at: '2026-11-01T00:00:00.000Z',
    });

    const goalId = await createGoal({ name: 'Beli Laptop', target_amount: 8_000_000 });
    await allocateFunds(goalId, 2_000_000);

    const { transaction_id } = await spendFromGoal(goalId, {
      account_id: 'bca',
      amount: 1_500_000,
      title: 'Beli Mouse & Keyboard',
      transaction_date: '2026-11-04T00:00:00.000Z',
    });

    // Real EXPENSE transaction was created
    const tx = await db.transactions.get(transaction_id);
    expect(tx).toBeDefined();
    expect(tx?.type).toBe('EXPENSE');
    expect(tx?.amount).toBe(1_500_000);
    expect(tx?.goal_id).toBe(goalId);

    // Goal allocation is reduced by 1_500_000 (2_000_000 -> 500_000)
    const goal = await db.goals.get(goalId);
    expect(goal?.allocated_amount).toBe(500_000);
    expect(await calculateReconstructedGoalAllocation(goalId)).toBe(500_000);

    // Account balance reduced by 1_500_000 (10_000_000 -> 8_500_000)
    expect(await calculateAccountBalance('bca')).toBe(8_500_000);

    // Safe-to-Spend: 8_500_000 - 1_000_000 - 500_000 = 7_000_000 (NO double-counting!)
    const overview = await calculateFinancialOverview();
    expect(overview.totalCurrentBalance).toBe(8_500_000);
    expect(overview.totalAllocatedGoals).toBe(500_000);
    expect(overview.safeToSpend).toBe(7_000_000);
  });

  // 5. Spending above Goal allocation is rejected
  it('5. spending above Goal allocation is rejected', async () => {
    await db.accounts.add(account('bca', 10_000_000));
    const goalId = await createGoal({ name: 'Liburan', target_amount: 5_000_000 });
    await allocateFunds(goalId, 1_000_000);

    await expect(
      spendFromGoal(goalId, {
        account_id: 'bca',
        amount: 1_500_000, // exceeds 1_000_000
        title: 'Tiket Pesawat',
        transaction_date: '2026-11-04T00:00:00.000Z',
      })
    ).rejects.toThrow('melebihi sisa alokasi dana target');

    // No partial mutations
    expect((await db.goals.get(goalId))?.allocated_amount).toBe(1_000_000);
    expect(await calculateAccountBalance('bca')).toBe(10_000_000);
    expect(await db.transactions.count()).toBe(0);
  });

  // 6. Spending with insufficient source account balance is rejected
  it('6. spending with insufficient source account balance is rejected', async () => {
    await db.accounts.add(account('dompet-kecil', 500_000));
    const goalId = await createGoal({ name: 'Gadget', target_amount: 5_000_000 });
    // Total safe-to-spend is 500_000
    await allocateFunds(goalId, 400_000);

    // Try to spend 400_000 from an account that only has 300_000 (if we simulate balance drop)
    await db.accounts.update('dompet-kecil', { initial_balance: 200_000 });

    await expect(
      spendFromGoal(goalId, {
        account_id: 'dompet-kecil',
        amount: 400_000,
        title: 'Beli Earphone',
        transaction_date: '2026-11-04T00:00:00.000Z',
      })
    ).rejects.toThrow('Saldo akun sumber tidak mencukupi');
  });

  // 7. Failed Spend From Goal leaves no partial transaction or allocation changes
  it('7. failed Spend From Goal leaves no partial changes', async () => {
    await db.accounts.add(account('bca', 1_000_000));
    const goalId = await createGoal({ name: 'Emergency', target_amount: 1_000_000 });
    await allocateFunds(goalId, 500_000);

    await expect(
      spendFromGoal(goalId, {
        account_id: 'non-existent-account',
        amount: 200_000,
        title: 'Belanja',
        transaction_date: '2026-11-04T00:00:00.000Z',
      })
    ).rejects.toThrow();

    expect(await db.transactions.count()).toBe(0);
    expect(await db.goal_allocations.where('type').equals('SPEND').count()).toBe(0);
    expect((await db.goals.get(goalId))?.allocated_amount).toBe(500_000);
  });

  // 8. Editing an expense to a higher amount adjusts allocation correctly
  it('8. editing an expense to a higher amount adjusts allocation correctly', async () => {
    await db.accounts.add(account('bca', 10_000_000));
    const goalId = await createGoal({ name: 'Laptop', target_amount: 8_000_000 });
    await allocateFunds(goalId, 3_000_000);

    const { transaction_id } = await spendFromGoal(goalId, {
      account_id: 'bca',
      amount: 1_000_000,
      title: 'Beli RAM',
      transaction_date: '2026-11-04T00:00:00.000Z',
    });

    expect((await db.goals.get(goalId))?.allocated_amount).toBe(2_000_000);

    // Edit transaction: increase amount from 1_000_000 to 1_500_000 (diff = +500_000)
    await updateTransaction(transaction_id, {
      title: 'Beli RAM 32GB',
      type: 'EXPENSE',
      amount: 1_500_000,
      account_id: 'bca',
      transaction_date: '2026-11-04T00:00:00.000Z',
    });

    const goal = await db.goals.get(goalId);
    expect(goal?.allocated_amount).toBe(1_500_000);
    expect(await calculateReconstructedGoalAllocation(goalId)).toBe(1_500_000);

    const adjustment = await db.goal_allocations.where('type').equals('SPEND_ADJUSTMENT').first();
    expect(adjustment).toBeDefined();
    expect(adjustment?.amount).toBe(-500_000);
  });

  // 9. Editing an expense to a lower amount restores the difference
  it('9. editing an expense to a lower amount restores the difference', async () => {
    await db.accounts.add(account('bca', 10_000_000));
    const goalId = await createGoal({ name: 'Laptop', target_amount: 8_000_000 });
    await allocateFunds(goalId, 3_000_000);

    const { transaction_id } = await spendFromGoal(goalId, {
      account_id: 'bca',
      amount: 1_000_000,
      title: 'Beli RAM',
      transaction_date: '2026-11-04T00:00:00.000Z',
    });

    // Edit transaction: decrease amount from 1_000_000 to 600_000 (diff = -400_000, refund 400_000)
    await updateTransaction(transaction_id, {
      title: 'Beli RAM Diskon',
      type: 'EXPENSE',
      amount: 600_000,
      account_id: 'bca',
      transaction_date: '2026-11-04T00:00:00.000Z',
    });

    const goal = await db.goals.get(goalId);
    expect(goal?.allocated_amount).toBe(2_400_000);
    expect(await calculateReconstructedGoalAllocation(goalId)).toBe(2_400_000);

    const adjustment = await db.goal_allocations.where('type').equals('SPEND_ADJUSTMENT').first();
    expect(adjustment).toBeDefined();
    expect(adjustment?.amount).toBe(400_000);
  });

  // 10. Editing an expense beyond remaining allocation is rejected atomically
  it('10. editing an expense beyond remaining allocation is rejected atomically', async () => {
    await db.accounts.add(account('bca', 10_000_000));
    const goalId = await createGoal({ name: 'Laptop', target_amount: 8_000_000 });
    await allocateFunds(goalId, 1_500_000);

    const { transaction_id } = await spendFromGoal(goalId, {
      account_id: 'bca',
      amount: 1_000_000,
      title: 'Beli RAM',
      transaction_date: '2026-11-04T00:00:00.000Z',
    });

    // Remaining allocation is 500_000. Increase expense by 800_000 (from 1_000_000 to 1_800_000).
    await expect(
      updateTransaction(transaction_id, {
        title: 'Beli RAM Mahal',
        type: 'EXPENSE',
        amount: 1_800_000,
        account_id: 'bca',
        transaction_date: '2026-11-04T00:00:00.000Z',
      })
    ).rejects.toThrow('melebihi sisa alokasi dana target');

    // Allocation remains unchanged at 500_000
    expect((await db.goals.get(goalId))?.allocated_amount).toBe(500_000);
    expect((await db.transactions.get(transaction_id))?.amount).toBe(1_000_000);
  });

  // 11. Deleting a Spend From Goal transaction restores its allocation
  it('11. deleting a Spend From Goal transaction restores its allocation', async () => {
    await db.accounts.add(account('bca', 10_000_000));
    const goalId = await createGoal({ name: 'Laptop', target_amount: 8_000_000 });
    await allocateFunds(goalId, 3_000_000);

    const { transaction_id } = await spendFromGoal(goalId, {
      account_id: 'bca',
      amount: 1_000_000,
      title: 'Beli Monitor',
      transaction_date: '2026-11-04T00:00:00.000Z',
    });

    expect((await db.goals.get(goalId))?.allocated_amount).toBe(2_000_000);

    // Delete transaction from normal transaction manager
    await deleteTransaction(transaction_id);

    const goal = await db.goals.get(goalId);
    expect(goal?.allocated_amount).toBe(3_000_000);
    expect(await calculateReconstructedGoalAllocation(goalId)).toBe(3_000_000);

    const reversal = await db.goal_allocations.where('type').equals('SPEND_REVERSAL').first();
    expect(reversal).toBeDefined();
    expect(reversal?.amount).toBe(1_000_000);
  });

  // 12. Goal deletion is rejected when allocation remains
  it('12. Goal deletion is rejected when allocation remains', async () => {
    await db.accounts.add(account('bca', 5_000_000));
    const goalId = await createGoal({ name: 'Emergency', target_amount: 2_000_000 });
    await allocateFunds(goalId, 1_000_000);

    await expect(deleteGoal(goalId)).rejects.toThrow('tidak dapat dihapus selama masih memiliki alokasi dana');

    const goal = await db.goals.get(goalId);
    expect(goal?.is_deleted).toBe(false);
  });

  // 13. Goal deletion is allowed when allocation is zero; allocation history is preserved
  it('13. Goal deletion is allowed when allocation is zero and preserves history', async () => {
    await db.accounts.add(account('bca', 5_000_000));
    const goalId = await createGoal({ name: 'Emergency', target_amount: 2_000_000 });
    await allocateFunds(goalId, 1_000_000);
    await withdrawFunds(goalId, 1_000_000);

    expect((await db.goals.get(goalId))?.allocated_amount).toBe(0);

    await deleteGoal(goalId);
    const goal = await db.goals.get(goalId);
    expect(goal?.is_deleted).toBe(true);

    // History is still intact
    const history = await db.goal_allocations.where('goal_id').equals(goalId).toArray();
    expect(history.length).toBe(2);
  });

  // 14. Multiple Goals calculate total allocated funds correctly
  it('14. multiple Goals calculate total allocated funds correctly', async () => {
    await db.accounts.add(account('bca', 10_000_000));
    const goal1 = await createGoal({ name: 'Goal 1', target_amount: 5_000_000 });
    const goal2 = await createGoal({ name: 'Goal 2', target_amount: 5_000_000 });

    await allocateFunds(goal1, 2_000_000);
    await allocateFunds(goal2, 3_000_000);

    const overview = await calculateFinancialOverview();
    expect(overview.totalAllocatedGoals).toBe(5_000_000);
    expect(overview.safeToSpend).toBe(5_000_000);
  });

  // 15. Transfers do not accidentally change Goal allocations
  it('15. transfers do not accidentally change Goal allocations', async () => {
    await db.accounts.bulkAdd([account('acc1', 5_000_000), account('acc2', 5_000_000)]);
    const goalId = await createGoal({ name: 'Target', target_amount: 5_000_000 });
    await allocateFunds(goalId, 2_000_000);

    await db.transactions.add({
      id: 'tx-transfer',
      title: 'Transfer',
      type: 'TRANSFER',
      amount: 1_000_000,
      account_id: 'acc1',
      destination_account_id: 'acc2',
      transaction_date: '2026-11-04T00:00:00.000Z',
      created_at: '2026-11-04T00:00:00.000Z',
      updated_at: '2026-11-04T00:00:00.000Z',
    });

    const goal = await db.goals.get(goalId);
    expect(goal?.allocated_amount).toBe(2_000_000);

    const overview = await calculateFinancialOverview();
    expect(overview.totalCurrentBalance).toBe(10_000_000);
    expect(overview.totalAllocatedGoals).toBe(2_000_000);
    expect(overview.safeToSpend).toBe(8_000_000);
  });

  // 16. Constraint 1: ARCHIVED Goals must never cause allocated funds to become available in Safe-to-Spend
  it('16. cannot archive a Goal if it still has allocated funds', async () => {
    await db.accounts.add(account('bca', 5_000_000));
    const goalId = await createGoal({ name: 'Target', target_amount: 5_000_000 });
    await allocateFunds(goalId, 1_000_000);

    await expect(setGoalStatus(goalId, 'ARCHIVED')).rejects.toThrow(
      'Target tabungan tidak dapat diarsipkan selama masih memiliki sisa dana alokasi'
    );

    // After full withdrawal, archival is permitted
    await withdrawFunds(goalId, 1_000_000);
    await setGoalStatus(goalId, 'ARCHIVED');
    expect((await db.goals.get(goalId))?.status).toBe('ARCHIVED');
  });

  // 17. Goal Over-Allocation: allocating beyond target_amount is allowed up to Safe-to-Spend
  it('17. allows allocating beyond target_amount up to Safe-to-Spend without truncation', async () => {
    await db.accounts.add(account('bca', 10_000_000));
    const goalId = await createGoal({ name: 'Liburan Hemat', target_amount: 1_500_000 });

    // Allocate Rp5,000,000 into a Rp1,500,000 target (333.33% progress, excess 3,500,000)
    await allocateFunds(goalId, 5_000_000);

    const goal = await db.goals.get(goalId);
    expect(goal?.allocated_amount).toBe(5_000_000);
    expect(goal?.target_amount).toBe(1_500_000);

    // Safe-to-Spend is reduced by the full allocated amount (10_000_000 - 5_000_000 = 5_000_000)
    const overview = await calculateFinancialOverview();
    expect(overview.safeToSpend).toBe(5_000_000);
    expect(overview.totalAllocatedGoals).toBe(5_000_000);

    // Invariant: reconstructed allocation from history matches full 5_000_000
    const reconstructed = await calculateReconstructedGoalAllocation(goalId);
    expect(reconstructed).toBe(5_000_000);
  });

  // 18. Reducing target_amount below current allocated_amount preserves all funds
  it('18. reducing target_amount below current allocated_amount preserves all funds and shows excess', async () => {
    await db.accounts.add(account('bca', 10_000_000));
    const goalId = await createGoal({ name: 'Gadget Baru', target_amount: 4_000_000 });
    await allocateFunds(goalId, 3_000_000);

    // Update target down to 2_000_000 (now over-allocated by 1_000_000)
    await updateGoal(goalId, { target_amount: 2_000_000 });

    const goal = await db.goals.get(goalId);
    expect(goal?.allocated_amount).toBe(3_000_000); // Never truncated or auto-withdrawn
    expect(goal?.target_amount).toBe(2_000_000);

    const overview = await calculateFinancialOverview();
    expect(overview.safeToSpend).toBe(7_000_000);
    expect(overview.totalAllocatedGoals).toBe(3_000_000);
  });

  // 19. Reassess Goal completion status when allocation changes (not locked forever)
  it('19. reassesses Goal completion status when allocation drops below target', async () => {
    await db.accounts.add(account('bca', 10_000_000));
    const goalId = await createGoal({ name: 'Motor', target_amount: 2_000_000 });
    await allocateFunds(goalId, 2_000_000);

    // Mark as completed
    await setGoalStatus(goalId, 'COMPLETED');
    expect((await db.goals.get(goalId))?.status).toBe('COMPLETED');

    // Withdraw Rp500,000 -> allocation becomes 1,500,000 (< 2,000,000)
    await withdrawFunds(goalId, 500_000);

    // Status is dynamically reverted from COMPLETED to ACTIVE
    const goal = await db.goals.get(goalId);
    expect(goal?.allocated_amount).toBe(1_500_000);
    expect(goal?.status).toBe('ACTIVE');

    // Can allocate more again
    await allocateFunds(goalId, 1_000_000);
    expect((await db.goals.get(goalId))?.allocated_amount).toBe(2_500_000);
  });
});
