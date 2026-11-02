import { db, type Account } from '@/lib/db/schema';
import { runAtomicTransaction } from '@/lib/db/transactionHelper';

const ACCOUNT_TYPES: readonly Account['type'][] = ['CASH', 'BANK', 'EWALLET', 'INVESTMENT'];

function validateAccountData(data: {
  name: string;
  type: Account['type'];
  initial_balance: number;
}): { name: string; type: Account['type']; initial_balance: number } {
  const name = data.name.trim();

  if (!name) {
    throw new Error('Nama akun wajib diisi');
  }

  if (!ACCOUNT_TYPES.includes(data.type)) {
    throw new Error('Tipe akun tidak valid');
  }

  if (!Number.isFinite(data.initial_balance) || !Number.isInteger(data.initial_balance)) {
    throw new Error('Saldo awal harus berupa angka integer');
  }

  if (data.initial_balance < 0) {
    throw new Error('Saldo awal tidak boleh negatif');
  }

  return { name, type: data.type, initial_balance: data.initial_balance };
}

export async function createAccount(data: {
  name: string;
  type: Account['type'];
  initial_balance: number;
}): Promise<string> {
  const account = validateAccountData(data);
  const now = new Date().toISOString();
  const id = crypto.randomUUID();

  await db.accounts.add({
    id,
    name: account.name,
    type: account.type,
    initial_balance: account.initial_balance,
    is_active: true,
    created_at: now,
    updated_at: now,
  });

  return id;
}

export async function getActiveAccounts(): Promise<Account[]> {
  return await db.accounts.filter((account) => account.is_active).toArray();
}

export async function updateAccount(
  id: string,
  data: {
    name: string;
    type: Account['type'];
    initial_balance: number;
  }
): Promise<void> {
  const existing = await db.accounts.get(id);
  if (!existing) {
    throw new Error('Akun tidak ditemukan');
  }

  const account = validateAccountData(data);
  await db.accounts.update(id, {
    name: account.name,
    type: account.type,
    initial_balance: account.initial_balance,
    updated_at: new Date().toISOString(),
  });
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
  const existing = await db.accounts.get(id);
  if (!existing) {
    throw new Error('Akun tidak ditemukan');
  }

  await runAtomicTransaction(['accounts', 'transactions'], async () => {
    await db.accounts.update(id, {
      is_active: false,
      updated_at: new Date().toISOString(),
    });

    const relatedTransfers = await db.transactions
      .filter((transaction) =>
        transaction.type === 'TRANSFER' &&
        (transaction.account_id === id || transaction.destination_account_id === id)
      )
      .toArray();

    await db.transactions.bulkDelete(relatedTransfers.map((transaction) => transaction.id));
  });
}
