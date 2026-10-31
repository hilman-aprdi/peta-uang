import { db } from '@/lib/db/schema';

export async function executeTransfer(data: {
  source_account_id: string;
  destination_account_id: string;
  amount: number;
  transaction_date: string;
  note?: string;
}): Promise<string> {
  if (data.source_account_id === data.destination_account_id) {
    throw new Error('Akun asal dan akun tujuan tidak boleh sama');
  }

  if (data.amount <= 0) {
    throw new Error('Nominal transfer harus lebih besar dari 0');
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  // Atomic Transfer Execution
  await db.transaction('rw', [db.transactions, db.accounts], async () => {
    await db.transactions.add({
      id,
      title: 'Transfer Antar Akun',
      type: 'TRANSFER',
      amount: Math.floor(data.amount),
      account_id: data.source_account_id,
      destination_account_id: data.destination_account_id,
      category_id: undefined,
      transaction_date: data.transaction_date,
      note: data.note || '',
      created_at: now,
      updated_at: now,
    });
  });

  return id;
}
