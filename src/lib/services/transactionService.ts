import { db } from '@/lib/db/schema';

export async function addTransaction(data: {
  title: string;
  type: 'INCOME' | 'EXPENSE';
  amount: number;
  account_id: string;
  category_id: string;
  transaction_date: string;
  note?: string;
}): Promise<string> {
  if (data.amount <= 0) {
    throw new Error('Nominal transaksi harus lebih besar dari 0');
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  // Transaksi Atomic di Dexie.js
  await db.transaction('rw', [db.transactions, db.accounts], async () => {
    await db.transactions.add({
      id,
      title: data.title,
      type: data.type,
      amount: Math.floor(data.amount),
      account_id: data.account_id,
      category_id: data.category_id,
      transaction_date: data.transaction_date,
      note: data.note || '',
      created_at: now,
      updated_at: now,
    });
  });

  return id;
}

export async function deleteTransaction(id: string): Promise<void> {
  await db.transaction('rw', [db.transactions, db.accounts], async () => {
    await db.transactions.delete(id);
  });
}
