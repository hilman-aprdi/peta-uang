import { db, Account } from '@/lib/db/schema';

export async function createAccount(data: {
  name: string;
  type: Account['type'];
  initial_balance: number;
}): Promise<string> {
  const now = new Date().toISOString();
  const id = crypto.randomUUID();

  await db.accounts.add({
    id,
    name: data.name,
    type: data.type,
    initial_balance: Math.max(0, Math.floor(data.initial_balance)), // Integer presisi
    is_active: 1,
    created_at: now,
    updated_at: now,
  });

  return id;
}

export async function getActiveAccounts(): Promise<Account[]> {
  return await db.accounts.where('is_active').equals(1).toArray();
}

// Rumus Ledger: Hitung Saldo Real-Time
export async function getAccountBalance(accountId: string): Promise<number> {
  const account = await db.accounts.get(accountId);
  if (!account) return 0;

  let balance = account.initial_balance;

  const transactions = await db.transactions
    .where('account_id').equals(accountId)
    .or('destination_account_id').equals(accountId)
    .toArray();

  for (const tx of transactions) {
    if (tx.type === 'INCOME' && tx.account_id === accountId) {
      balance += tx.amount;
    } else if (tx.type === 'EXPENSE' && tx.account_id === accountId) {
      balance -= tx.amount;
    } else if (tx.type === 'TRANSFER') {
      if (tx.account_id === accountId) {
        balance -= tx.amount; // Transfer Out
      }
      if (tx.destination_account_id === accountId) {
        balance += tx.amount; // Transfer In
      }
    }
  }

  return balance;
}

export async function softDeleteAccount(id: string): Promise<void> {
  await db.accounts.update(id, {
    is_active: 0,
    updated_at: new Date().toISOString(),
  });
}
