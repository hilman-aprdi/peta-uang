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

export async function updateBill(id: string, data: BillData): Promise<void> {
  const existing = await db.bills.get(id);
  if (!existing) throw new Error('Tagihan tidak ditemukan');
  const bill = validateBillData(data);

  await runAtomicTransaction(['bills'], async () => {
    await db.bills.update(id, bill);
  });
}

export async function deleteBill(id: string): Promise<void> {
  const existing = await db.bills.get(id);
  if (!existing) throw new Error('Tagihan tidak ditemukan');

  await runAtomicTransaction(['bills'], async () => {
    await db.bills.delete(id);
  });
}

export async function setBillPaid(id: string, isPaid: boolean): Promise<void> {
  const existing = await db.bills.get(id);
  if (!existing) throw new Error('Tagihan tidak ditemukan');

  await runAtomicTransaction(['bills'], async () => {
    await db.bills.update(id, { is_paid: isPaid });
  });
}
