import { db } from '@/lib/db/schema';
import { runAtomicTransaction } from '@/lib/db/transactionHelper';
import { getAccountBalance } from '@/lib/services/accountService';

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

  if (!Number.isFinite(data.amount) || !Number.isInteger(data.amount) || data.amount <= 0) {
    throw new Error('Nominal transfer harus berupa integer lebih besar dari 0');
  }

  if (!data.transaction_date || Number.isNaN(Date.parse(data.transaction_date))) {
    throw new Error('Tanggal transfer tidak valid');
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  await runAtomicTransaction(['transactions', 'accounts'], async () => {
    const [sourceAccount, destinationAccount] = await Promise.all([
      db.accounts.get(data.source_account_id),
      db.accounts.get(data.destination_account_id),
    ]);
    if (!sourceAccount || !sourceAccount.is_active || !destinationAccount || !destinationAccount.is_active) {
      throw new Error('Akun transfer tidak ditemukan atau tidak aktif');
    }

    const sourceBalance = await getAccountBalance(data.source_account_id);
    if (sourceBalance < data.amount) {
      throw new Error('Saldo akun sumber tidak mencukupi untuk transfer ini');
    }

    await db.transactions.add({
      id,
      title: 'Transfer',
      type: 'TRANSFER',
      amount: data.amount,
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
