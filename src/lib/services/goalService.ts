import { db, type Goal, type GoalAllocation } from '@/lib/db/schema';
import { runAtomicTransaction } from '@/lib/db/transactionHelper';
import { calculateFinancialOverview } from '@/lib/finance/calculator';
import { getAccountBalance } from '@/lib/services/accountService';

export type CreateGoalData = {
  name: string;
  target_amount: number;
  target_date?: string;
  note?: string;
};

export type UpdateGoalData = {
  name?: string;
  target_amount?: number;
  target_date?: string;
  note?: string;
};

function validateGoalInput(data: { name?: string; target_amount?: number; target_date?: string }) {
  if (data.name !== undefined) {
    const trimmed = data.name.trim();
    if (!trimmed) throw new Error('Nama target tabungan wajib diisi');
  }

  if (data.target_amount !== undefined) {
    if (!Number.isFinite(data.target_amount) || !Number.isInteger(data.target_amount) || data.target_amount <= 0) {
      throw new Error('Nominal target harus berupa integer lebih besar dari 0');
    }
  }

  if (data.target_date !== undefined && data.target_date !== '') {
    if (Number.isNaN(Date.parse(data.target_date))) {
      throw new Error('Tanggal target tidak valid');
    }
  }
}

/**
 * Reconstructs the allocated_amount directly from allocation history events.
 * ALLOCATE (+), SPEND_REVERSAL (+)
 * WITHDRAW (-), SPEND (-), SPEND_ADJUSTMENT (+ or - based on amount sign)
 */
export async function calculateReconstructedGoalAllocation(goalId: string): Promise<number> {
  const events = await db.goal_allocations.where('goal_id').equals(goalId).toArray();
  let total = 0;
  for (const event of events) {
    if (event.type === 'ALLOCATE' || event.type === 'SPEND_REVERSAL') {
      total += event.amount;
    } else if (event.type === 'WITHDRAW' || event.type === 'SPEND') {
      total -= event.amount;
    } else if (event.type === 'SPEND_ADJUSTMENT') {
      // SPEND_ADJUSTMENT amount is signed: positive adds to allocation, negative reduces
      total += event.amount;
    }
  }
  return total;
}

export async function getActiveGoals(): Promise<Goal[]> {
  return await db.goals.filter((g) => !g.is_deleted && g.status !== 'ARCHIVED').toArray();
}

export async function getAllGoals(): Promise<Goal[]> {
  return await db.goals.filter((g) => !g.is_deleted).toArray();
}

export async function getGoalById(id: string): Promise<Goal | undefined> {
  const goal = await db.goals.get(id);
  if (!goal || goal.is_deleted) return undefined;
  return goal;
}

export async function getGoalAllocations(goalId: string): Promise<GoalAllocation[]> {
  return await db.goal_allocations.where('goal_id').equals(goalId).reverse().sortBy('created_at');
}

export async function createGoal(data: CreateGoalData): Promise<string> {
  validateGoalInput(data);
  const now = new Date().toISOString();
  const id = crypto.randomUUID();

  await runAtomicTransaction(['goals'], async () => {
    await db.goals.add({
      id,
      name: data.name.trim(),
      target_amount: data.target_amount,
      allocated_amount: 0,
      target_date: data.target_date?.trim() || undefined,
      status: 'ACTIVE',
      note: data.note?.trim() || undefined,
      is_deleted: false,
      created_at: now,
      updated_at: now,
    });
  });

  return id;
}

export async function updateGoal(id: string, data: UpdateGoalData): Promise<void> {
  validateGoalInput(data);
  const goal = await db.goals.get(id);
  if (!goal || goal.is_deleted) throw new Error('Target tabungan tidak ditemukan');

  const updatePayload: Partial<Goal> = {
    updated_at: new Date().toISOString(),
  };

  if (data.name !== undefined) updatePayload.name = data.name.trim();
  if (data.target_amount !== undefined) {
    updatePayload.target_amount = data.target_amount;
    // Reassess Goal completion status based on new target amount
    if (goal.status === 'COMPLETED' && goal.allocated_amount < data.target_amount) {
      updatePayload.status = 'ACTIVE';
    }
  }
  if (data.target_date !== undefined) updatePayload.target_date = data.target_date.trim() || undefined;
  if (data.note !== undefined) updatePayload.note = data.note.trim() || undefined;

  await runAtomicTransaction(['goals'], async () => {
    await db.goals.update(id, updatePayload);
  });
}

export async function setGoalStatus(id: string, status: 'ACTIVE' | 'COMPLETED' | 'ARCHIVED'): Promise<void> {
  const goal = await db.goals.get(id);
  if (!goal || goal.is_deleted) throw new Error('Target tabungan tidak ditemukan');

  // Constraint 1: ARCHIVED Goals must never cause allocated funds to become available in Safe-to-Spend.
  // A Goal with remaining allocation cannot be archived unless all funds are withdrawn through the normal withdrawal flow.
  if (status === 'ARCHIVED' && goal.allocated_amount > 0) {
    throw new Error('Target tabungan tidak dapat diarsipkan selama masih memiliki sisa dana alokasi. Tarik seluruh dana terlebih dahulu.');
  }

  await runAtomicTransaction(['goals'], async () => {
    await db.goals.update(id, {
      status,
      updated_at: new Date().toISOString(),
    });
  });
}

/**
 * Deletes a Goal.
 * Constraint: A Goal cannot be deleted while it has remaining allocated funds.
 * Soft deletes the Goal to preserve historical integrity and associations with goal_allocations.
 */
export async function deleteGoal(id: string): Promise<void> {
  const goal = await db.goals.get(id);
  if (!goal || goal.is_deleted) throw new Error('Target tabungan tidak ditemukan');

  if (goal.allocated_amount > 0) {
    throw new Error('Target tabungan tidak dapat dihapus selama masih memiliki alokasi dana. Tarik seluruh dana terlebih dahulu.');
  }

  await runAtomicTransaction(['goals'], async () => {
    await db.goals.update(id, {
      is_deleted: true,
      updated_at: new Date().toISOString(),
    });
  });
}

export async function allocateFunds(goalId: string, amount: number, note?: string): Promise<string> {
  if (!Number.isFinite(amount) || !Number.isInteger(amount) || amount <= 0) {
    throw new Error('Nominal alokasi harus berupa integer lebih besar dari 0');
  }

  return await runAtomicTransaction(['goals', 'goal_allocations', 'accounts', 'bills', 'transactions'], async () => {
    const goal = await db.goals.get(goalId);
    if (!goal || goal.is_deleted) throw new Error('Target tabungan tidak ditemukan');

    if (goal.status === 'ARCHIVED') {
      throw new Error('Tidak dapat mengalokasikan dana ke target yang sudah diarsipkan');
    }

    const { safeToSpend } = await calculateFinancialOverview();
    if (amount > safeToSpend) {
      throw new Error(`Nominal alokasi (Rp ${amount.toLocaleString('id-ID')}) melebihi dana aman Safe-to-Spend yang tersedia (Rp ${safeToSpend.toLocaleString('id-ID')})`);
    }

    const allocationId = crypto.randomUUID();
    const now = new Date().toISOString();
    const newAllocatedAmount = goal.allocated_amount + amount;

    await db.goal_allocations.add({
      id: allocationId,
      goal_id: goalId,
      type: 'ALLOCATE',
      amount,
      note: note?.trim() || undefined,
      created_at: now,
    });

    // Reassess Goal status: if it was COMPLETED or ACTIVE, keep status updated appropriately
    let newStatus = goal.status;
    if (newStatus === 'COMPLETED' && newAllocatedAmount < goal.target_amount) {
      newStatus = 'ACTIVE';
    }

    await db.goals.update(goalId, {
      allocated_amount: newAllocatedAmount,
      status: newStatus,
      updated_at: now,
    });

    return allocationId;
  });
}

export async function withdrawFunds(goalId: string, amount: number, note?: string): Promise<string> {
  if (!Number.isFinite(amount) || !Number.isInteger(amount) || amount <= 0) {
    throw new Error('Nominal penarikan harus berupa integer lebih besar dari 0');
  }

  return await runAtomicTransaction(['goals', 'goal_allocations'], async () => {
    const goal = await db.goals.get(goalId);
    if (!goal || goal.is_deleted) throw new Error('Target tabungan tidak ditemukan');

    if (amount > goal.allocated_amount) {
      throw new Error(`Nominal penarikan (Rp ${amount.toLocaleString('id-ID')}) melebihi sisa dana yang dialokasikan (Rp ${goal.allocated_amount.toLocaleString('id-ID')})`);
    }

    const allocationId = crypto.randomUUID();
    const now = new Date().toISOString();
    const newAllocatedAmount = goal.allocated_amount - amount;

    await db.goal_allocations.add({
      id: allocationId,
      goal_id: goalId,
      type: 'WITHDRAW',
      amount,
      note: note?.trim() || undefined,
      created_at: now,
    });

    // Reassess Goal completion status: if allocated amount drops below target, revert COMPLETED to ACTIVE
    let newStatus = goal.status;
    if (newStatus === 'COMPLETED' && newAllocatedAmount < goal.target_amount) {
      newStatus = 'ACTIVE';
    }

    await db.goals.update(goalId, {
      allocated_amount: newAllocatedAmount,
      status: newStatus,
      updated_at: now,
    });

    return allocationId;
  });
}

export type SpendFromGoalData = {
  account_id: string;
  amount: number;
  title: string;
  category_id?: string;
  transaction_date: string;
  note?: string;
};

export async function spendFromGoal(goalId: string, data: SpendFromGoalData): Promise<{ transaction_id: string; allocation_id: string }> {
  const title = data.title.trim();
  if (!title) throw new Error('Judul transaksi belanja wajib diisi');

  if (!Number.isFinite(data.amount) || !Number.isInteger(data.amount) || data.amount <= 0) {
    throw new Error('Nominal belanja harus berupa integer lebih besar dari 0');
  }

  if (!data.transaction_date || Number.isNaN(Date.parse(data.transaction_date))) {
    throw new Error('Tanggal transaksi tidak valid');
  }

  return await runAtomicTransaction(['goals', 'goal_allocations', 'transactions', 'accounts', 'categories'], async () => {
    const goal = await db.goals.get(goalId);
    if (!goal || goal.is_deleted) throw new Error('Target tabungan tidak ditemukan');

    if (data.amount > goal.allocated_amount) {
      throw new Error(`Nominal pembelanjaan (Rp ${data.amount.toLocaleString('id-ID')}) melebihi sisa alokasi dana target (Rp ${goal.allocated_amount.toLocaleString('id-ID')})`);
    }

    const account = await db.accounts.get(data.account_id);
    if (!account || !account.is_active) {
      throw new Error('Akun sumber pembayaran tidak ditemukan atau tidak aktif');
    }

    const currentAccBalance = await getAccountBalance(data.account_id);
    if (currentAccBalance < data.amount) {
      throw new Error(`Saldo akun sumber tidak mencukupi (Tersedia: Rp ${currentAccBalance.toLocaleString('id-ID')}, Dibutuhkan: Rp ${data.amount.toLocaleString('id-ID')})`);
    }

    if (data.category_id) {
      const category = await db.categories.get(data.category_id);
      if (!category || category.is_active === false || category.type !== 'EXPENSE') {
        throw new Error('Kategori belanja tidak ditemukan, tidak aktif, atau bukan tipe EXPENSE');
      }
    }

    const txId = crypto.randomUUID();
    const allocationId = crypto.randomUUID();
    const now = new Date().toISOString();

    // 1. Create real EXPENSE transaction linked to goal_id
    await db.transactions.add({
      id: txId,
      title,
      type: 'EXPENSE',
      amount: data.amount,
      account_id: data.account_id,
      category_id: data.category_id || undefined,
      goal_id: goalId,
      transaction_date: data.transaction_date,
      note: data.note?.trim() || `Belanja target: ${goal.name}`,
      created_at: now,
      updated_at: now,
    });

    // 2. Add SPEND history event
    await db.goal_allocations.add({
      id: allocationId,
      goal_id: goalId,
      type: 'SPEND',
      amount: data.amount,
      related_transaction_id: txId,
      note: `Belanja: ${title}`,
      created_at: now,
    });

    // 3. Update Goal snapshot & reassess completion status
    const newAllocatedAmount = goal.allocated_amount - data.amount;
    let newStatus = goal.status;
    if (newStatus === 'COMPLETED' && newAllocatedAmount < goal.target_amount) {
      newStatus = 'ACTIVE';
    }

    await db.goals.update(goalId, {
      allocated_amount: newAllocatedAmount,
      status: newStatus,
      updated_at: now,
    });

    return { transaction_id: txId, allocation_id: allocationId };
  });
}

/**
 * Reconciles Goal allocation when a transaction linked to a Goal is edited.
 * Handles:
 * - Amount changes (diff > 0: reduce allocation; diff < 0: return to allocation)
 * - Goal unlinking (goal_id removed or changed: return old amount to old goal, debit new goal if linked)
 * - Type changes (transition from EXPENSE to anything else is disallowed for Goal-linked tx)
 */
export async function reconcileGoalOnTransactionUpdate(
  oldTx: { goal_id?: string; amount: number; type: string },
  newTx: { goal_id?: string; amount: number; type: string },
  txId: string
): Promise<void> {
  const hadGoal = Boolean(oldTx.goal_id);
  const hasGoal = Boolean(newTx.goal_id);

  if (!hadGoal && !hasGoal) return;

  const now = new Date().toISOString();

  // If type is changing away from EXPENSE while linked to a goal
  if (hadGoal && oldTx.type === 'EXPENSE' && newTx.type !== 'EXPENSE') {
    throw new Error('Transaksi yang terhubung dengan target tabungan tidak dapat diubah tipenya dari EXPENSE');
  }

  // Case 1: Same Goal, Amount Change
  if (hadGoal && hasGoal && oldTx.goal_id === newTx.goal_id) {
    const goalId = oldTx.goal_id!;
    const goal = await db.goals.get(goalId);
    if (!goal || goal.is_deleted) throw new Error('Target tabungan terkait tidak ditemukan');

    const diff = newTx.amount - oldTx.amount;
    if (diff === 0) return;

    if (diff > 0) {
      // Expense increased -> Need to deduct more from Goal
      if (diff > goal.allocated_amount) {
        throw new Error(`Kenaikan nominal belanja (Rp ${diff.toLocaleString('id-ID')}) melebihi sisa alokasi dana target (Rp ${goal.allocated_amount.toLocaleString('id-ID')})`);
      }

      await db.goal_allocations.add({
        id: crypto.randomUUID(),
        goal_id: goalId,
        type: 'SPEND_ADJUSTMENT',
        amount: -diff, // negative represents deduction from allocation
        related_transaction_id: txId,
        note: `Penyesuaian nominal belanja: bertambah Rp ${diff.toLocaleString('id-ID')}`,
        created_at: now,
      });

      await db.goals.update(goalId, {
        allocated_amount: goal.allocated_amount - diff,
        updated_at: now,
      });
    } else {
      // Expense decreased -> Return difference to Goal
      const refund = Math.abs(diff);

      await db.goal_allocations.add({
        id: crypto.randomUUID(),
        goal_id: goalId,
        type: 'SPEND_ADJUSTMENT',
        amount: refund, // positive represents refund to allocation
        related_transaction_id: txId,
        note: `Penyesuaian nominal belanja: berkurang Rp ${refund.toLocaleString('id-ID')}`,
        created_at: now,
      });

      await db.goals.update(goalId, {
        allocated_amount: goal.allocated_amount + refund,
        updated_at: now,
      });
    }
    return;
  }

  // Case 2: Goal unlinked (old had goal, new does not)
  if (hadGoal && !hasGoal) {
    const oldGoalId = oldTx.goal_id!;
    const oldGoal = await db.goals.get(oldGoalId);
    if (oldGoal && !oldGoal.is_deleted) {
      await db.goal_allocations.add({
        id: crypto.randomUUID(),
        goal_id: oldGoalId,
        type: 'SPEND_REVERSAL',
        amount: oldTx.amount,
        related_transaction_id: txId,
        note: `Pembatalan tautan belanja dari target`,
        created_at: now,
      });

      await db.goals.update(oldGoalId, {
        allocated_amount: oldGoal.allocated_amount + oldTx.amount,
        updated_at: now,
      });
    }
    return;
  }

  // Case 3: Goal linked for the first time (old had no goal, new has goal)
  if (!hadGoal && hasGoal) {
    const newGoalId = newTx.goal_id!;
    const newGoal = await db.goals.get(newGoalId);
    if (!newGoal || newGoal.is_deleted) throw new Error('Target tabungan yang dipilih tidak ditemukan');

    if (newTx.amount > newGoal.allocated_amount) {
      throw new Error(`Nominal transaksi melebihi sisa alokasi dana target yang dipilih`);
    }

    await db.goal_allocations.add({
      id: crypto.randomUUID(),
      goal_id: newGoalId,
      type: 'SPEND',
      amount: newTx.amount,
      related_transaction_id: txId,
      note: `Penautan transaksi ke target`,
      created_at: now,
    });

    await db.goals.update(newGoalId, {
      allocated_amount: newGoal.allocated_amount - newTx.amount,
      updated_at: now,
    });
    return;
  }

  // Case 4: Switched from one Goal to another Goal
  if (hadGoal && hasGoal && oldTx.goal_id !== newTx.goal_id) {
    const oldGoalId = oldTx.goal_id!;
    const newGoalId = newTx.goal_id!;

    const [oldGoal, newGoal] = await Promise.all([
      db.goals.get(oldGoalId),
      db.goals.get(newGoalId),
    ]);

    if (!newGoal || newGoal.is_deleted) throw new Error('Target tabungan baru tidak ditemukan');
    if (newTx.amount > newGoal.allocated_amount) {
      throw new Error(`Nominal transaksi melebihi sisa alokasi dana target baru`);
    }

    // Reversal on old goal
    if (oldGoal && !oldGoal.is_deleted) {
      await db.goal_allocations.add({
        id: crypto.randomUUID(),
        goal_id: oldGoalId,
        type: 'SPEND_REVERSAL',
        amount: oldTx.amount,
        related_transaction_id: txId,
        note: `Pengalihan belanja ke target lain`,
        created_at: now,
      });

      await db.goals.update(oldGoalId, {
        allocated_amount: oldGoal.allocated_amount + oldTx.amount,
        updated_at: now,
      });
    }

    // Spend on new goal
    await db.goal_allocations.add({
      id: crypto.randomUUID(),
      goal_id: newGoalId,
      type: 'SPEND',
      amount: newTx.amount,
      related_transaction_id: txId,
      note: `Pengalihan belanja dari target lain`,
      created_at: now,
    });

    await db.goals.update(newGoalId, {
      allocated_amount: newGoal.allocated_amount - newTx.amount,
      updated_at: now,
    });
  }
}

/**
 * Reconciles Goal allocation when a transaction linked to a Goal is deleted.
 * Reverses the spend amount back to the Goal's allocated_amount and records SPEND_REVERSAL.
 */
export async function reconcileGoalOnTransactionDelete(
  tx: { goal_id?: string; amount: number },
  txId: string
): Promise<void> {
  if (!tx.goal_id) return;

  const goal = await db.goals.get(tx.goal_id);
  if (!goal || goal.is_deleted) return;

  const now = new Date().toISOString();

  await db.goal_allocations.add({
    id: crypto.randomUUID(),
    goal_id: tx.goal_id,
    type: 'SPEND_REVERSAL',
    amount: tx.amount,
    related_transaction_id: txId,
    note: `Pengembalian dana akibat transaksi belanja dihapus`,
    created_at: now,
  });

  await db.goals.update(tx.goal_id, {
    allocated_amount: goal.allocated_amount + tx.amount,
    updated_at: now,
  });
}
