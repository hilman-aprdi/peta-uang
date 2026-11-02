import { db } from '@/lib/db/schema';

const CSV_HEADERS = [
  'transaction_id',
  'transaction_date',
  'transaction_type',
  'category',
  'amount',
  'account_from',
  'account_to',
  'description',
  'created_at',
] as const;

function escapeCsvField(value: string | number): string {
  const stringValue = String(value);
  return /[",\n\r]/.test(stringValue) ? `"${stringValue.replace(/"/g, '""')}"` : stringValue;
}

function toIsoTimestamp(value: string): string {
  return new Date(value).toISOString();
}

export async function exportTransactionsToCSV(): Promise<void> {
  const transactions = await db.transactions.toArray();
  const accounts = await db.accounts.toArray();
  const categories = await db.categories.toArray();

  const accountMap = new Map(accounts.map((account) => [account.id, account.name]));
  const categoryMap = new Map(categories.map((category) => [category.id, category.name]));

  const rows = transactions.map((transaction) => {
    const isIncome = transaction.type === 'INCOME';
    const isExpense = transaction.type === 'EXPENSE';
    const accountName = accountMap.get(transaction.account_id) ?? '';
    const destinationAccountName = transaction.destination_account_id
      ? accountMap.get(transaction.destination_account_id) ?? ''
      : '';
    const description = transaction.note
      ? `${transaction.title} — ${transaction.note}`
      : transaction.title;

    return [
      transaction.id,
      toIsoTimestamp(transaction.transaction_date),
      transaction.type,
      transaction.category_id ? categoryMap.get(transaction.category_id) ?? '' : '',
      transaction.amount,
      isIncome ? '' : accountName,
      isExpense ? '' : destinationAccountName || (isIncome ? accountName : ''),
      description,
      toIsoTimestamp(transaction.created_at),
    ].map(escapeCsvField).join(',');
  });

  const csvContent = `\uFEFF${[CSV_HEADERS.join(','), ...rows].join('\r\n')}`;
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const today = new Date().toISOString().split('T')[0];

  link.href = url;
  link.download = `PetaUang_All_Transactions_${today}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
