import { db } from '@/lib/db/schema';

/**
 * Calculates real-time balance for a specific account using the Single-Entry Ledger formula:
 * Saldo = initial_balance + sum(INCOME) - sum(EXPENSE) - sum(TRANSFER_out) + sum(TRANSFER_in)
 */
export async function calculateAccountBalance(accountId: string): Promise<number> {
  const account = await db.accounts.get(accountId);
  if (!account) throw new Error(`Account with ID ${accountId} not found.`);

  let balance = account.initial_balance;

  // Fetch all transactions associated with this account
  const txs = await db.transactions
    .where('account_id')
    .equals(accountId)
    .or('destination_account_id')
    .equals(accountId)
    .toArray();

  for (const tx of txs) {
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

/**
 * Calculates global Financial Overview for Dashboard:
 * 1. Current Balance (Total active accounts balance)
 * 2. Unpaid Bills Total
 * 3. Safe-To-Spend = Current Balance - Unpaid Bills
 */
export async function calculateFinancialOverview() {
  const activeAccounts = await db.accounts.filter((acc) => acc.is_active).toArray();


  let totalCurrentBalance = 0;
  for (const acc of activeAccounts) {
    const accBalance = await calculateAccountBalance(acc.id);
    totalCurrentBalance += accBalance;
  }

  // Calculate Unpaid Bills
  const unpaidBills = await db.bills.filter((bill) => !bill.is_paid).toArray();
  const totalUnpaidBills = unpaidBills.reduce((sum, bill) => sum + bill.amount, 0);

  const safeToSpend = totalCurrentBalance - totalUnpaidBills;

  return {
    totalCurrentBalance,
    totalUnpaidBills,
    safeToSpend,
  };
}
