'use client';

import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Account, type Category, type Transaction } from '@/lib/db/schema';
import { seedDefaultCategories } from '@/lib/db/seed';
import { calculateFinancialOverview } from '@/lib/finance/calculator';
import { createAccount, getAccountBalance, softDeleteAccount, updateAccount } from '@/lib/services/accountService';
import { addTransaction, deleteTransaction, updateTransaction } from '@/lib/services/transactionService';
import { executeTransfer } from '@/lib/services/transferService';
import { AppLayout } from '@/components/layout/AppLayout';
import { SafeToSpendHero } from '@/components/dashboard/SafeToSpendHero';
import { BottomSheet, type TransactionFormData } from '@/components/ui/BottomSheet';
import { AccountModal } from '@/components/ui/AccountModal';
import { CategoryManagement } from '@/components/ui/CategoryManagement';
import { ArrowLeftRight, Wallet, Plus, Pencil, Trash2 } from 'lucide-react';
import { exportTransactionsToCSV } from '@/lib/utils/csvExporter';
import { Download } from 'lucide-react';
import { CategoryIcon } from '@/components/ui/CategoryManagement';

interface HomeProps {
  initialTab?: string;
}

function getCurrentPeriod(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function formatPeriod(period: string): string {
  return new Date(`${period}-01T00:00:00`).toLocaleDateString('id-ID', {
    month: 'long',
    year: 'numeric',
  });
}

function TransactionIcon({ transaction, categories }: { transaction: Transaction; categories: Category[] | undefined }) {
  if (transaction.type === 'TRANSFER') {
    return <ArrowLeftRight size={18} aria-hidden="true" />;
  }

  const category = categories?.find((item) => item.id === transaction.category_id);
  return <CategoryIcon name={category?.icon} size={18} />;
}

function transactionIconClass(type: Transaction['type']): string {
  if (type === 'INCOME') return 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400';
  if (type === 'EXPENSE') return 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400';
  return 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400';
}

function transactionAmountClass(type: Transaction['type']): string {
  if (type === 'INCOME') return 'text-emerald-600 dark:text-emerald-400';
  if (type === 'EXPENSE') return 'text-rose-600 dark:text-rose-400';
  return 'text-indigo-500 dark:text-indigo-400';
}

function transactionAccountLabel(transaction: Transaction, accounts: Account[] | undefined): string {
  const source = accounts?.find((account) => account.id === transaction.account_id);
  const sourceLabel = source ? `${source.name} (${source.type})` : 'Akun tidak tersedia';

  if (transaction.type !== 'TRANSFER') return sourceLabel;

  const destination = accounts?.find((account) => account.id === transaction.destination_account_id);
  const destinationLabel = destination ? `${destination.name} (${destination.type})` : 'Akun tidak tersedia';
  return `${sourceLabel} → ${destinationLabel}`;
}

function transactionCategoryLabel(transaction: Transaction, categories: Category[] | undefined): string {
  if (!transaction.category_id) return 'Uncategorized';
  return categories?.find((category) => category.id === transaction.category_id)?.name ?? 'Uncategorized';
}

export default function Home({ initialTab = 'dashboard' }: HomeProps) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [transactionModalMode, setTransactionModalMode] = useState<'create' | 'edit'>('create');
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction>();
  const [transactionModalKey, setTransactionModalKey] = useState(0);
  const [transactionActionError, setTransactionActionError] = useState('');
  const [transactionActionSuccess, setTransactionActionSuccess] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState(getCurrentPeriod);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [accountModalMode, setAccountModalMode] = useState<'create' | 'edit'>('create');
  const [selectedAccount, setSelectedAccount] = useState<Account>();
  const [accountModalKey, setAccountModalKey] = useState(0);
  const [accountActionError, setAccountActionError] = useState('');
  const [accountBalances, setAccountBalances] = useState<{ [key: string]: number }>({});

  const accounts = useLiveQuery(() => db.accounts.filter((account) => account.is_active).toArray(), []);
  const categories = useLiveQuery(() => db.categories.filter((category) => category.is_active !== false).toArray(), []);
  const transactions = useLiveQuery(() => db.transactions.reverse().toArray(), []);
  const financialOverview = useLiveQuery(() => calculateFinancialOverview(), []);
  const filteredTransactions = transactions?.filter((transaction) => transaction.transaction_date.slice(0, 7) === selectedPeriod);
  const sortedPeriodTransactions = filteredTransactions?.slice().sort(
    (first, second) => Date.parse(second.transaction_date) - Date.parse(first.transaction_date)
  );

  useEffect(() => {
    async function init() {
      await seedDefaultCategories();
    }
    init();
  }, []);

  useEffect(() => {
    async function calcBalances() {
      if (!accounts) return;
      const balances: { [key: string]: number } = {};
      for (const acc of accounts) {
        const bal = await getAccountBalance(acc.id);
        balances[acc.id] = bal;
      }
      setAccountBalances(balances);
    }
    calcBalances();
  }, [accounts, transactions]);

  const handleSubmitAccount = async (data: { name: string; type: Account['type']; initial_balance: number }) => {
    if (accountModalMode === 'edit' && selectedAccount) {
      await updateAccount(selectedAccount.id, data);
    } else {
      await createAccount(data);
    }
    setIsAccountModalOpen(false);
    setSelectedAccount(undefined);
  };

  const openCreateAccountModal = () => {
    setAccountModalMode('create');
    setSelectedAccount(undefined);
    setAccountModalKey((key) => key + 1);
    setIsAccountModalOpen(true);
  };

  const openEditAccountModal = (account: Account) => {
    setAccountModalMode('edit');
    setSelectedAccount(account);
    setAccountModalKey((key) => key + 1);
    setIsAccountModalOpen(true);
  };

  const handleDeactivateAccount = async (account: Account) => {
    if (!window.confirm(
      `Hapus akun "${account.name}"? Akun akan dinonaktifkan dan seluruh transaksi transfer yang melibatkan akun ini akan dihapus. Income dan expense tetap dipertahankan.`
    )) return;
    try {
      setAccountActionError('');
      await softDeleteAccount(account.id);
    } catch (error) {
      setAccountActionError(error instanceof Error ? error.message : 'Gagal menonaktifkan akun');
    }
  };

  const handleSubmitTransaction = async (data: TransactionFormData) => {
    if (transactionModalMode === 'edit' && selectedTransaction) {
      await updateTransaction(selectedTransaction.id, {
        title: data.title,
        type: data.type as 'INCOME' | 'EXPENSE',
        amount: data.amount,
        account_id: data.account_id,
        category_id: data.category_id,
        transaction_date: data.transaction_date,
        note: data.note,
      });
    } else if (data.type === 'TRANSFER') {
      await executeTransfer({
        source_account_id: data.account_id,
        destination_account_id: data.destination_account_id as string,
        amount: data.amount,
        transaction_date: data.transaction_date,
        note: data.note,
      });
    } else {
      await addTransaction({
        title: data.title,
        type: data.type,
        amount: data.amount,
        account_id: data.account_id,
        category_id: data.category_id,
        transaction_date: data.transaction_date,
        note: data.note,
      });
    }
    setTransactionActionError('');
    setTransactionActionSuccess(transactionModalMode === 'edit' ? 'Transaksi berhasil diperbarui.' : 'Transaksi berhasil disimpan.');
  };

  const openCreateTransactionModal = () => {
    setTransactionModalMode('create');
    setSelectedTransaction(undefined);
    setTransactionActionSuccess('');
    setTransactionActionError('');
    setTransactionModalKey((key) => key + 1);
    setIsAddModalOpen(true);
  };

  const openEditTransactionModal = (transaction: Transaction) => {
    if (transaction.type === 'TRANSFER') return;
    setTransactionModalMode('edit');
    setSelectedTransaction(transaction);
    setTransactionModalKey((key) => key + 1);
    setIsAddModalOpen(true);
  };

  const handleDeleteTransaction = async (transaction: Transaction) => {
    if (!window.confirm(`Hapus transaksi "${transaction.title}"?`)) return;
    try {
      setTransactionActionError('');
      setTransactionActionSuccess('');
      await deleteTransaction(transaction.id);
      setTransactionActionSuccess('Transaksi berhasil dihapus.');
    } catch (error) {
      setTransactionActionError(error instanceof Error ? error.message : 'Gagal menghapus transaksi');
    }
  };

  const monthlyIncome = filteredTransactions
    ?.filter((t) => t.type === 'INCOME')
    .reduce((sum, t) => sum + t.amount, 0) || 0;

  const monthlyExpense = filteredTransactions
    ?.filter((t) => t.type === 'EXPENSE')
    .reduce((sum, t) => sum + t.amount, 0) || 0;
  const netCashFlow = monthlyIncome - monthlyExpense;

  return (
    <AppLayout
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      onOpenAddModal={openCreateTransactionModal}
      showAddTransactionButton={activeTab !== 'accounts' && activeTab !== 'bills'}
    >
      {/* TAB DASHBOARD */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          <div className="space-y-3">
            <h2 className="text-xl font-bold tracking-tight whitespace-nowrap">Ringkasan Keuangan</h2>
            <label className="flex w-fit items-center gap-2 text-xs text-slate-500">
              Periode
              <input
                type="month"
                value={selectedPeriod}
                onChange={(event) => setSelectedPeriod(event.target.value)}
                className="text-xs font-medium px-2.5 py-1 bg-slate-200 dark:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-400 outline-none"
              />
            </label>
          </div>
          <SafeToSpendHero
            safeToSpend={financialOverview?.safeToSpend ?? 0}
            currentBalance={financialOverview?.totalCurrentBalance ?? 0}
            unpaidBills={financialOverview?.totalUnpaidBills ?? 0}
            monthlyIncome={monthlyIncome}
            monthlyExpense={monthlyExpense}
            netCashFlow={netCashFlow}
            isLoading={!financialOverview}
          />

          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="font-semibold text-sm text-slate-600 dark:text-slate-400">Transaksi {formatPeriod(selectedPeriod)}</h3>
            {(!sortedPeriodTransactions || sortedPeriodTransactions.length === 0) && (
              <p className="text-xs text-slate-400 text-center py-6">
                Belum ada transaksi pada periode yang dipilih.
              </p>
            )}
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {sortedPeriodTransactions?.slice(0, 5).map((tx) => (
                <li key={tx.id} className="py-3 flex justify-between items-center text-sm">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`shrink-0 p-2 rounded-xl ${transactionIconClass(tx.type)}`}><TransactionIcon transaction={tx} categories={categories} /></div>
                    <div className="min-w-0">
                    <p className="font-medium text-slate-900 dark:text-slate-100">{tx.title}</p>
                    <p className="text-xs text-slate-400">{new Date(tx.transaction_date).toLocaleDateString('id-ID')}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{transactionAccountLabel(tx, accounts)}</p>
                    {tx.type !== 'TRANSFER' && <p className="text-xs text-slate-500 dark:text-slate-400">{transactionCategoryLabel(tx, categories)}</p>}
                    </div>
                  </div>
                  <span
                    className={`font-mono font-bold ${transactionAmountClass(tx.type)}`}
                  >
                    {tx.type === 'INCOME' ? '+' : tx.type === 'EXPENSE' ? '-' : ''}
                    Rp {tx.amount.toLocaleString('id-ID')}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* TAB TRANSAKSI */}
      {activeTab === 'transactions' && (
        <div className="space-y-4">
          <div className="space-y-3">
            <h2 className="text-xl font-bold tracking-tight whitespace-nowrap">Semua Transaksi</h2>
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="month"
                aria-label="Pilih periode transaksi"
                value={selectedPeriod}
                onChange={(event) => setSelectedPeriod(event.target.value)}
                className="text-xs font-medium px-2.5 py-2 bg-slate-200 dark:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-400 outline-none"
              />
              <button
                onClick={exportTransactionsToCSV}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 bg-slate-800 text-slate-200 hover:bg-slate-700 rounded-lg transition border border-slate-700"
              >
                <Download size={14} /> Export CSV
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
            {(!sortedPeriodTransactions || sortedPeriodTransactions.length === 0) && (
              <p className="text-xs text-slate-400 text-center py-6">Belum ada transaksi pada periode {formatPeriod(selectedPeriod)}.</p>
            )}
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {sortedPeriodTransactions?.map((tx) => (
                <li key={tx.id} className="py-3 flex justify-between items-center text-sm">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`shrink-0 p-2 rounded-xl ${transactionIconClass(tx.type)}`}><TransactionIcon transaction={tx} categories={categories} /></div>
                    <div className="min-w-0">
                    <p className="font-medium">{tx.title}</p>
                    <p className="text-xs text-slate-400">{tx.type} • {new Date(tx.transaction_date).toLocaleDateString('id-ID')}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{transactionAccountLabel(tx, accounts)}</p>
                    {tx.type !== 'TRANSFER' && <p className="text-xs text-slate-500 dark:text-slate-400">{transactionCategoryLabel(tx, categories)}</p>}
                    {tx.note && <p className="text-xs text-slate-500 mt-1">{tx.note}</p>}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`font-mono font-bold ${transactionAmountClass(tx.type)}`}>{tx.type === 'INCOME' ? '+' : tx.type === 'EXPENSE' ? '-' : ''}Rp {tx.amount.toLocaleString('id-ID')}</span>
                    {tx.type !== 'TRANSFER' && (
                      <div className="mt-2 flex gap-3 justify-end">
                        <button type="button" onClick={() => openEditTransactionModal(tx)} title="Edit transaksi" aria-label={`Edit transaksi ${tx.title}`} className="text-emerald-600 hover:text-emerald-700"><Pencil size={16} /></button>
                        <button type="button" onClick={() => handleDeleteTransaction(tx)} title="Hapus transaksi" aria-label={`Hapus transaksi ${tx.title}`} className="text-red-600 hover:text-red-700"><Trash2 size={16} /></button>
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
          {transactionActionSuccess && <p className="text-sm text-emerald-600 dark:text-emerald-400">{transactionActionSuccess}</p>}
          {transactionActionError && <p className="text-sm text-red-600 dark:text-red-400">{transactionActionError}</p>}
          <CategoryManagement categories={categories || []} />
        </div>
      )}

      {/* TAB DOMPET */}
      {activeTab === 'accounts' && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold tracking-tight">Daftar Dompet & Akun</h2>
          {accountActionError && <p className="text-sm text-red-600 dark:text-red-400">{accountActionError}</p>}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {accounts?.map((acc) => (
              <div key={acc.id} className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-emerald-600 dark:text-emerald-400">
                    <Wallet size={20} />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{acc.name}</p>
                    <p className="text-xs text-slate-400">{acc.type}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-400">Saldo Ledger</p>
                  <p className="font-mono font-bold text-sm">
                    Rp {(accountBalances[acc.id] || 0).toLocaleString('id-ID')}
                  </p>
                  <div className="mt-2 flex gap-2 justify-end">
                    <button type="button" onClick={() => openEditAccountModal(acc)} className="text-xs text-emerald-600 hover:underline">
                      Edit
                    </button>
                    <button type="button" onClick={() => handleDeactivateAccount(acc)} className="text-xs text-red-600 hover:underline">
                      Nonaktifkan
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {(!accounts || accounts.length === 0) && (
            <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 text-center space-y-3">
              <p className="text-sm text-slate-500">Belum ada akun dompet yang dibuat.</p>
            </div>
          )}
          <button type="button" onClick={openCreateAccountModal} className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition">
            <Plus size={16} /> Tambah Akun
          </button>
        </div>
      )}

      <BottomSheet
        key={`transaction-modal-${transactionModalKey}`}
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        accounts={accounts || []}
        categories={categories || []}
        mode={transactionModalMode}
        transaction={selectedTransaction}
        onSubmitTx={handleSubmitTransaction}
      />

      <AccountModal
        key={`account-modal-${accountModalKey}`}
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        mode={accountModalMode}
        account={selectedAccount}
        onSubmitAccount={handleSubmitAccount}
      />
    </AppLayout>
  );
}
