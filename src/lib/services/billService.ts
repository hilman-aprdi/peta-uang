import { db, type Bill } from '@/lib/db/schema';
import { runAtomicTransaction } from '@/lib/db/transactionHelper';

type BillData = {
  title: string;
  amount: number;
  due_date: string;
};

function validateBillData(data: BillData): BillData {
  const title = data.title.trim();
  if (!title) throw new Error('Judul tagihan wajib diisi');
  if (!Number.isFinite(data.amount) || !Number.isInteger(data.amount) || data.amount <= 0) {
    throw new Error('Nominal tagihan harus berupa integer lebih besar dari 0');
  }
  if (!data.due_date || Number.isNaN(Date.parse(data.due_date))) {
    throw new Error('Tanggal jatuh tempo tidak valid');
  }
  return { title, amount: data.amount, due_date: data.due_date };
}

export async function getBills(): Promise<Bill[]> {
  return db.bills.orderBy('due_date').toArray();
}

export async function getUnpaidBills(): Promise<Bill[]> {
  return db.bills.filter((bill) => !bill.is_paid).toArray();
}

export async function createBill(data: BillData): Promise<string> {
  const bill = validateBillData(data);
  const id = crypto.randomUUID();

  await runAtomicTransaction(['bills'], async () => {
    await db.bills.add({
      id,
      ...bill,
      is_paid: false,
      created_at: new Date().toISOString(),
    });
  });

  return id;
}

export type BillPaymentDetails = {
  account_id: string;
  payment_date?: string;
  category_id?: string;
};

export async function updateBill(id: string, data: BillData): Promise<void> {
  const existing = await db.bills.get(id);
  if (!existing) throw new Error('Tagihan tidak ditemukan');
  const bill = validateBillData(data);

  await runAtomicTransaction(['bills', 'transactions', 'accounts'], async () => {
    await db.bills.update(id, bill);
    if (existing.is_paid && existing.transaction_id) {
      const tx = await db.transactions.get(existing.transaction_id);
      if (tx) {
        await db.transactions.update(existing.transaction_id, {
          title: bill.title,
          amount: bill.amount,
          note: `Pelunasan tagihan: ${bill.title}`,
          updated_at: new Date().toISOString(),
        });
      }
    }
  });
}

export async function deleteBill(id: string): Promise<void> {
  const existing = await db.bills.get(id);
  if (!existing) throw new Error('Tagihan tidak ditemukan');

  await runAtomicTransaction(['bills', 'transactions', 'accounts'], async () => {
    if (existing.transaction_id) {
      await db.transactions.delete(existing.transaction_id);
    }
    await db.bills.delete(id);
  });
}

export async function setBillPaid(id: string, isPaid: boolean, paymentDetails?: BillPaymentDetails): Promise<void> {
  const existing = await db.bills.get(id);
  if (!existing) throw new Error('Tagihan tidak ditemukan');

  if (isPaid) {
    if (paymentDetails?.account_id) {
      const account = await db.accounts.get(paymentDetails.account_id);
      if (!account || !account.is_active) {
        throw new Error('Akun pembayaran tidak ditemukan atau tidak aktif');
      }

      const txId = crypto.randomUUID();
      const txDate = paymentDetails.payment_date && !Number.isNaN(Date.parse(paymentDetails.payment_date))
        ? paymentDetails.payment_date
        : new Date().toISOString();
      const now = new Date().toISOString();

      await runAtomicTransaction(['bills', 'transactions', 'accounts'], async () => {
        if (existing.transaction_id) {
          await db.transactions.delete(existing.transaction_id);
        }

        await db.transactions.add({
          id: txId,
          title: existing.title,
          type: 'EXPENSE',
          amount: existing.amount,
          account_id: paymentDetails.account_id,
          category_id: paymentDetails.category_id || undefined,
          transaction_date: txDate,
          note: `Pelunasan tagihan: ${existing.title}`,
          created_at: now,
          updated_at: now,
        });

        await db.bills.update(id, {
          is_paid: true,
          transaction_id: txId,
        });
      });
      return;
    }

    await runAtomicTransaction(['bills'], async () => {
      await db.bills.update(id, { is_paid: true });
    });
    return;
  }

  // isPaid === false
  await runAtomicTransaction(['bills', 'transactions', 'accounts'], async () => {
    if (existing.transaction_id) {
      await db.transactions.delete(existing.transaction_id);
    }
    await db.bills.update(id, {
      is_paid: false,
      transaction_id: undefined,
    });
  });
}
