'use client';

import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Account, type Transaction } from '@/lib/db/schema';
import { seedDefaultCategories } from '@/lib/db/seed';
import { createAccount, getAccountBalance, softDeleteAccount, updateAccount } from '@/lib/services/accountService';
import { addTransaction, deleteTransaction, updateTransaction } from '@/lib/services/transactionService';
import { executeTransfer } from '@/lib/services/transferService';
import { AppLayout } from '@/components/layout/AppLayout';
import { SafeToSpendHero } from '@/components/dashboard/SafeToSpendHero';
import { BottomSheet, type TransactionFormData } from '@/components/ui/BottomSheet';
import { AccountModal } from '@/components/ui/AccountModal';
import { CategoryManagement } from '@/components/ui/CategoryManagement';
import { Wallet, Plus } from 'lucide-react';
import { exportTransactionsToCSV } from '@/lib/utils/csvExporter';
import { Download } from 'lucide-react';

interface HomeProps {
  initialTab?: string;
}

export default function Home({ initialTab = 'dashboard' }: HomeProps) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [transactionModalMode, setTransactionModalMode] = useState<'create' | 'edit'>('create');
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction>();
  const [transactionModalKey, setTransactionModalKey] = useState(0);
  const [transactionActionError, setTransactionActionError] = useState('');
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [accountModalMode, setAccountModalMode] = useState<'create' | 'edit'>('create');
  const [selectedAccount, setSelectedAccount] = useState<Account>();
  const [accountModalKey, setAccountModalKey] = useState(0);
  const [accountActionError, setAccountActionError] = useState('');
  const [accountBalances, setAccountBalances] = useState<{ [key: string]: number }>({});
  const [totalBalance, setTotalBalance] = useState(0);

  const accounts = useLiveQuery(() => db.accounts.filter((account) => account.is_active).toArray(), []);
  const categories = useLiveQuery(() => db.categories.filter((category) => category.is_active !== false).toArray(), []);
  const transactions = useLiveQuery(() => db.transactions.reverse().toArray(), []);

  useEffect(() => {
    async function init() {
      await seedDefaultCategories();
    }
    init();
  }, []);

  useEffect(() => {
    async function calcBalances() {
      if (!accounts) return;
      let total = 0;
      const balances: { [key: string]: number } = {};
      for (const acc of accounts) {
        const bal = await getAccountBalance(acc.id);
        balances[acc.id] = bal;
        total += bal;
      }
      setAccountBalances(balances);
      setTotalBalance(total);
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
    if (!window.confirm(`Nonaktifkan akun "${account.name}"?`)) return;
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
        category_id: data.category_id as string,
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
        category_id: data.category_id as string,
        transaction_date: data.transaction_date,
        note: data.note,
      });
    }
  };

  const openCreateTransactionModal = () => {
    setTransactionModalMode('create');
    setSelectedTransaction(undefined);
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
      await deleteTransaction(transaction.id);
    } catch (error) {
      setTransactionActionError(error instanceof Error ? error.message : 'Gagal menghapus transaksi');
    }
  };

  const monthlyIncome = transactions
    ?.filter((t) => t.type === 'INCOME')
    .reduce((sum, t) => sum + t.amount, 0) || 0;

  const monthlyExpense = transactions
    ?.filter((t) => t.type === 'EXPENSE')
    .reduce((sum, t) => sum + t.amount, 0) || 0;

  return (
    <AppLayout
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      onOpenAddModal={openCreateTransactionModal}
    >
      {/* TAB DASHBOARD */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold tracking-tight">Ringkasan Keuangan</h2>
            <span className="text-xs font-medium px-2.5 py-1 bg-slate-200 dark:bg-slate-800 rounded-full text-slate-600 dark:text-slate-400">
              Oktober 2026
            </span>
          </div>
          <SafeToSpendHero
            safeToSpend={totalBalance}
            currentBalance={totalBalance}
            monthlyIncome={monthlyIncome}
            monthlyExpense={monthlyExpense}
          />

          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="font-semibold text-sm text-slate-600 dark:text-slate-400">Transaksi Terakhir</h3>
            {(!transactions || transactions.length === 0) && (
              <p className="text-xs text-slate-400 text-center py-6">
                Belum ada transaksi tercatat. Buat akun dahulu lalu tekan tombol + untuk mulai.
              </p>
            )}
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {transactions?.slice(0, 5).map((tx) => (
                <li key={tx.id} className="py-3 flex justify-between items-center text-sm">
                  <div>
                    <p className="font-medium text-slate-900 dark:text-slate-100">{tx.title}</p>
                    <p className="text-xs text-slate-400">{new Date(tx.transaction_date).toLocaleDateString('id-ID')}</p>
                  </div>
                  <span
                    className={`font-mono font-bold ${tx.type === 'INCOME'
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : tx.type === 'EXPENSE'
                        ? 'text-rose-600 dark:text-rose-400'
                        : 'text-indigo-500'
                      }`}
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
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold tracking-tight">Semua Transaksi</h2>
            <button
              onClick={exportTransactionsToCSV}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 bg-slate-800 text-slate-200 hover:bg-slate-700 rounded-lg transition border border-slate-700"
            >
              <Download size={14} /> Export CSV
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
            {(!transactions || transactions.length === 0) && (
              <p className="text-xs text-slate-400 text-center py-6">Belum ada riwayat transaksi.</p>
            )}
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {transactions?.map((tx) => (
                <li key={tx.id} className="py-3 flex justify-between items-center text-sm">
                  <div>
                    <p className="font-medium">{tx.title}</p>
                    <p className="text-xs text-slate-400">{tx.type} • {new Date(tx.transaction_date).toLocaleDateString('id-ID')}</p>
                    {tx.note && <p className="text-xs text-slate-500 mt-1">{tx.note}</p>}
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold">Rp {tx.amount.toLocaleString('id-ID')}</span>
                    {tx.type !== 'TRANSFER' && (
                      <div className="mt-1 flex gap-2 justify-end text-xs">
                        <button type="button" onClick={() => openEditTransactionModal(tx)} className="text-emerald-600 hover:underline">Edit</button>
                        <button type="button" onClick={() => handleDeleteTransaction(tx)} className="text-red-600 hover:underline">Hapus</button>
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
          {transactionActionError && <p className="text-sm text-red-600 dark:text-red-400">{transactionActionError}</p>}
          <CategoryManagement categories={categories || []} />
        </div>
      )}

      {/* TAB DOMPET */}
      {activeTab === 'accounts' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold tracking-tight">Daftar Dompet & Akun</h2>
            <button
              onClick={openCreateAccountModal}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
            >
              <Plus size={14} /> Tambah Akun
            </button>
          </div>
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
              <button
                onClick={openCreateAccountModal}
                className="py-2.5 px-4 bg-emerald-600 text-white rounded-xl text-xs font-semibold"
              >
                + Buat Akun Pertama
              </button>
            </div>
          )}
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
