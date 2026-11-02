import { db } from '@/lib/db/schema';
import { runAtomicTransaction } from '@/lib/db/transactionHelper';

type IncomeExpenseData = {
  title: string;
  type: 'INCOME' | 'EXPENSE';
  amount: number;
  account_id: string;
  category_id?: string;
  transaction_date: string;
  note?: string;
};

function validateTransactionData(data: IncomeExpenseData) {
  const title = data.title.trim();
  if (!title) throw new Error('Judul transaksi wajib diisi');
  if (!Number.isFinite(data.amount) || !Number.isInteger(data.amount) || data.amount <= 0) {
    throw new Error('Nominal transaksi harus berupa integer lebih besar dari 0');
  }
  if (!data.transaction_date || Number.isNaN(Date.parse(data.transaction_date))) {
    throw new Error('Tanggal transaksi tidak valid');
  }
  return { ...data, title, note: data.note?.trim() || '' };
}

export async function addTransaction(data: IncomeExpenseData): Promise<string> {
  const transaction = validateTransactionData(data);

  const account = await db.accounts.get(transaction.account_id);
  if (!account || !account.is_active) {
    throw new Error('Akun transaksi tidak ditemukan atau tidak aktif');
  }

  if (transaction.category_id) {
    const category = await db.categories.get(transaction.category_id);
    if (!category || category.is_active === false || category.type !== transaction.type) {
      throw new Error('Kategori transaksi tidak ditemukan, tidak aktif, atau tidak sesuai tipe');
    }
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  await runAtomicTransaction(['transactions', 'accounts'], async () => {
    await db.transactions.add({
      id,
      title: transaction.title,
      type: transaction.type,
      amount: transaction.amount,
      account_id: transaction.account_id,
      category_id: transaction.category_id,
      transaction_date: transaction.transaction_date,
      note: transaction.note,
      created_at: now,
      updated_at: now,
    });
  });

  return id;
}

export async function updateTransaction(id: string, data: IncomeExpenseData): Promise<void> {
  const existing = await db.transactions.get(id);
  if (!existing) throw new Error('Transaksi tidak ditemukan');
  if (existing.type === 'TRANSFER') throw new Error('Transfer tidak dapat diedit melalui flow income/expense');
  if (existing.type !== data.type) throw new Error('Tipe transaksi tidak dapat diubah');

  const transaction = validateTransactionData(data);
  const account = await db.accounts.get(transaction.account_id);
  if (!account || !account.is_active) throw new Error('Akun transaksi tidak ditemukan atau tidak aktif');

  if (transaction.category_id) {
    const category = await db.categories.get(transaction.category_id);
    if (!category || category.is_active === false || category.type !== transaction.type) {
      throw new Error('Kategori transaksi tidak ditemukan, tidak aktif, atau tidak sesuai tipe');
    }
  }

  await runAtomicTransaction(['transactions', 'accounts'], async () => {
    await db.transactions.update(id, {
      title: transaction.title,
      amount: transaction.amount,
      account_id: transaction.account_id,
      category_id: transaction.category_id,
      transaction_date: transaction.transaction_date,
      note: transaction.note,
      updated_at: new Date().toISOString(),
    });
  });
}

export async function deleteTransaction(id: string): Promise<void> {
  const existing = await db.transactions.get(id);
  if (!existing) throw new Error('Transaksi tidak ditemukan');
  if (existing.type === 'TRANSFER') throw new Error('Transfer tidak dapat dihapus melalui flow income/expense');

  await runAtomicTransaction(['transactions', 'accounts'], async () => {
    await db.transactions.delete(id);
  });
}
