'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Account, type Category, type Goal, type Transaction } from '@/lib/db/schema';
import { seedDefaultCategories } from '@/lib/db/seed';
import { calculateFinancialOverview } from '@/lib/finance/calculator';
import { createAccount, getAccountBalance, softDeleteAccount, updateAccount } from '@/lib/services/accountService';
import { addTransaction, deleteTransaction, updateTransaction } from '@/lib/services/transactionService';
import { executeTransfer } from '@/lib/services/transferService';
import { AppLayout } from '@/components/layout/AppLayout';
import { SafeToSpendHero } from '@/components/dashboard/SafeToSpendHero';
import { InsightSection } from '@/components/dashboard/InsightSection';
import { evaluateAllInsights } from '@/lib/insight/insightEngine';
import { BottomSheet, type TransactionFormData } from '@/components/ui/BottomSheet';
import { AccountModal } from '@/components/ui/AccountModal';
import { CategoryManagement } from '@/components/ui/CategoryManagement';
import { ArrowLeftRight, Wallet, Plus, Pencil, Trash2, Target } from 'lucide-react';
import { exportTransactionsToCSV } from '@/lib/utils/csvExporter';
import { Download } from 'lucide-react';
import { CategoryIcon } from '@/components/ui/CategoryManagement';
import { PeriodNavigator, getCurrentMonthPeriod, formatMonthPeriod, isAllTimePeriod } from '@/components/ui/PeriodNavigator';

interface HomeProps {
  initialTab?: string;
}

type InsightActionTarget = 'transactions' | 'bills' | 'goals';

const INSIGHT_ACTION_ROUTES: Record<InsightActionTarget, string> = {
  transactions: '/transactions',
  bills: '/bills',
  goals: '/goals',
};

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

/** Mengelompokkan transaksi berdasarkan tanggal (YYYY-MM-DD), urutan terbaru di atas */
function groupTransactionsByDate(txs: Transaction[]): { date: string; items: Transaction[] }[] {
  const map = new Map<string, Transaction[]>();
  for (const tx of txs) {
    const key = tx.transaction_date.slice(0, 10);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(tx);
  }
  return Array.from(map.entries())
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([date, items]) => ({ date, items }));
}

function formatDateHeading(dateStr: string): { day: string; dayName: string } {
  const d = new Date(`${dateStr}T00:00:00`);
  const day = d.toLocaleDateString('id-ID', { day: '2-digit', month: 'long' });
  const dayName = d.toLocaleDateString('id-ID', { weekday: 'long' });
  return { day, dayName };
}

export default function Home({ initialTab = 'dashboard' }: HomeProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [transactionModalMode, setTransactionModalMode] = useState<'create' | 'edit'>('create');
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction>();
  const [transactionModalKey, setTransactionModalKey] = useState(0);
  const [transactionActionError, setTransactionActionError] = useState('');
  const [transactionActionSuccess, setTransactionActionSuccess] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState(getCurrentMonthPeriod);
  const [transactionPeriod, setTransactionPeriod] = useState(getCurrentMonthPeriod);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [accountModalMode, setAccountModalMode] = useState<'create' | 'edit'>('create');
  const [selectedAccount, setSelectedAccount] = useState<Account>();
  const [accountModalKey, setAccountModalKey] = useState(0);
  const [accountActionError, setAccountActionError] = useState('');
  const [accountBalances, setAccountBalances] = useState<{ [key: string]: number }>({});

  const accounts = useLiveQuery(() => db.accounts.filter((account) => account.is_active).toArray(), []);
  const categories = useLiveQuery(() => db.categories.filter((category) => category.is_active !== false).toArray(), []);
  const goals = useLiveQuery(() => db.goals.filter((goal) => !goal.is_deleted).toArray(), []);
  const bills = useLiveQuery(() => db.bills.toArray(), []);
  const transactions = useLiveQuery(() => db.transactions.reverse().toArray(), []);
  const financialOverview = useLiveQuery(() => calculateFinancialOverview(), []);
  const filteredTransactions = transactions?.filter((transaction) => transaction.transaction_date.slice(0, 7) === selectedPeriod);
  const sortedPeriodTransactions = filteredTransactions?.slice().sort(
    (first, second) => Date.parse(second.transaction_date) - Date.parse(first.transaction_date)
  );

  // Filter khusus tab Transaksi: mendukung mode "Semua Waktu" (ALL_TIME).
  const isTransactionAllTime = isAllTimePeriod(transactionPeriod);
  const transactionPeriodTransactions = isTransactionAllTime
    ? transactions
    : transactions?.filter((transaction) => transaction.transaction_date.slice(0, 7) === transactionPeriod);
  const sortedTransactionPeriodTransactions = transactionPeriodTransactions?.slice().sort(
    (first, second) => Date.parse(second.transaction_date) - Date.parse(first.transaction_date)
  );
  const transactionPeriodLabel = isTransactionAllTime
    ? 'Akumulasi Semua Waktu'
    : formatMonthPeriod(transactionPeriod);

  // Komputasi in-memory wawasan finansial 3 periode secara reaktif
  const insights = useMemo(() => {
    return evaluateAllInsights({
      transactions: transactions || [],
      accounts: accounts || [],
      categories: categories || [],
      bills: bills || [],
      goals: goals || [],
      overview: financialOverview,
    });
  }, [transactions, accounts, categories, bills, goals, financialOverview]);

  // Aksi CTA kartu wawasan: sinkronkan tab aktif lalu navigasi ke route terkait.
  const handleInsightAction = (targetTab: InsightActionTarget) => {
    setActiveTab(targetTab);
    router.push(INSIGHT_ACTION_ROUTES[targetTab]);
  };

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

  const handleSubmitAccount = async (data: { name: string; type: Account['type']; balance: number }) => {
    if (accountModalMode === 'edit' && selectedAccount) {
      await updateAccount(selectedAccount.id, {
        name: data.name,
        type: data.type,
        target_balance: data.balance,
      });
    } else {
      await createAccount({
        name: data.name,
        type: data.type,
        initial_balance: data.balance,
      });
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
        goal_id: data.goal_id,
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
        goal_id: data.goal_id,
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
          </div>
          <SafeToSpendHero
            safeToSpend={financialOverview?.safeToSpend ?? 0}
            currentBalance={financialOverview?.totalCurrentBalance ?? 0}
            unpaidBills={financialOverview?.totalUnpaidBills ?? 0}
            totalAllocatedGoals={financialOverview?.totalAllocatedGoals ?? 0}
            monthlyIncome={monthlyIncome}
            monthlyExpense={monthlyExpense}
            netCashFlow={netCashFlow}
            isLoading={!financialOverview}
            selectedPeriod={selectedPeriod}
          />

          <PeriodNavigator
            selectedPeriod={selectedPeriod}
            onPeriodChange={setSelectedPeriod}
            label="Periode Analisis"
          />

          {/* 3 Kartu Wawasan Finansial (Harian, Mingguan, Bulanan) */}
          <InsightSection
            daily={insights.daily}
            weekly={insights.weekly}
            monthly={insights.monthly}
            onActionClick={handleInsightAction}
          />

          <div className="space-y-3">
            <h3 className="font-semibold text-sm text-slate-600 dark:text-slate-400">Transaksi {formatMonthPeriod(selectedPeriod)}</h3>

            {(!sortedPeriodTransactions || sortedPeriodTransactions.length === 0) ? (
              <p className="text-xs text-slate-400 text-center py-6">
                Belum ada transaksi pada periode yang dipilih.
              </p>
            ) : (
              <div className="space-y-3">
                {groupTransactionsByDate(sortedPeriodTransactions.slice(0, 10)).map(({ date, items }) => {
                  const { day, dayName } = formatDateHeading(date);
                  const dailyTotal = items.reduce((sum, tx) => {
                    if (tx.type === 'INCOME') return sum + tx.amount;
                    if (tx.type === 'EXPENSE') return sum - tx.amount;
                    return sum;
                  }, 0);
                  return (
                    <div key={date} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                      {/* Date heading */}
                      <div className="flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800">
                        <div>
                          <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{day}</p>
                          <p className="text-[11px] text-slate-400">{dayName}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] uppercase tracking-wide text-slate-400 font-semibold mb-0.5">Net Hari Ini</p>
                          <span className={`text-base font-mono font-extrabold ${dailyTotal >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400'}`}>
                            {dailyTotal >= 0 ? '+' : ''}Rp {dailyTotal.toLocaleString('id-ID')}
                          </span>
                        </div>
                      </div>
                      {/* Transaction items */}
                      <div className="divide-y divide-slate-100 dark:divide-slate-800">
                        {items.map((tx) => {
                          const categoryLabel = tx.type !== 'TRANSFER' ? transactionCategoryLabel(tx, categories) : 'Transfer';
                          const accountLabel = transactionAccountLabel(tx, accounts);
                          const isEditable = tx.type !== 'TRANSFER';
                          return (
                            <div
                              key={tx.id}
                              onClick={() => {
                                if (isEditable) openEditTransactionModal(tx);
                              }}
                              className={`flex items-center justify-between gap-3 py-3 px-4 transition group ${
                                isEditable
                                  ? 'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40'
                                  : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                              }`}
                            >
                              <div className={`shrink-0 p-2 rounded-xl ${transactionIconClass(tx.type)}`}>
                                <TransactionIcon transaction={tx} categories={categories} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">{categoryLabel}</span>
                                  <span className="text-[11px] text-slate-300 dark:text-slate-600">•</span>
                                  <span className="text-[11px] text-slate-400 dark:text-slate-500 truncate">{accountLabel}</span>
                                  {tx.goal_id && (() => {
                                    const linkedGoal = goals?.find((g) => g.id === tx.goal_id);
                                    return linkedGoal ? (
                                      <>
                                        <span className="text-[11px] text-slate-300 dark:text-slate-600">•</span>
                                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded">
                                          <Target size={11} /> {linkedGoal.name}
                                        </span>
                                      </>
                                    ) : null;
                                  })()}
                                </div>
                                <p className="text-sm font-medium text-slate-800 dark:text-slate-100 leading-tight mt-0.5 truncate">{tx.title}</p>
                                {tx.note && <p className="text-[11px] text-slate-400 mt-0.5 truncate">{tx.note}</p>}
                              </div>
                              <div className="text-right shrink-0">
                                <span className={`font-mono font-semibold text-sm ${transactionAmountClass(tx.type)}`}>
                                  {tx.type === 'INCOME' ? '+' : tx.type === 'EXPENSE' ? '-' : ''}
                                  Rp {tx.amount.toLocaleString('id-ID')}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB TRANSAKSI */}
      {activeTab === 'transactions' && (
        <div className="space-y-4">
          {/* Baris 1: judul + export ringkas */}
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-bold tracking-tight whitespace-nowrap">Semua Transaksi</h2>
            <button
              type="button"
              onClick={exportTransactionsToCSV}
              aria-label="Export CSV"
              title="Export CSV"
              className="flex w-9 h-9 md:w-auto md:px-3 shrink-0 items-center justify-center gap-1.5 text-xs font-semibold bg-slate-800 text-slate-200 hover:bg-slate-700 rounded-lg transition border border-slate-700"
            >
              <Download size={14} />
              <span className="hidden md:inline">Export CSV</span>
            </button>
          </div>

          {/* Baris 2: date navigator full-width */}
          <PeriodNavigator
            selectedPeriod={transactionPeriod}
            onPeriodChange={setTransactionPeriod}
            label="Periode Transaksi"
            allowAllTime
          />

          {/* Summary cards: Income, Expense, Kelola Kategori (desktop) */}
          {(() => {
            const periodIncome = sortedTransactionPeriodTransactions?.filter((tx) => tx.type === 'INCOME').reduce((s, tx) => s + tx.amount, 0) ?? 0;
            const periodExpense = sortedTransactionPeriodTransactions?.filter((tx) => tx.type === 'EXPENSE').reduce((s, tx) => s + tx.amount, 0) ?? 0;
            return (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                {/* Income card */}
                <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl space-y-1">
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Income</p>
                  <p className="text-emerald-400 font-bold font-mono text-sm md:text-base leading-tight break-words tabular-nums">
                    Rp {periodIncome.toLocaleString('id-ID')}
                  </p>
                  <p className="text-[11px] text-slate-500">{transactionPeriodLabel}</p>
                </div>
                {/* Expense card */}
                <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl space-y-1">
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Expense</p>
                  <p className="text-rose-400 font-bold font-mono text-sm md:text-base leading-tight break-words tabular-nums">
                    Rp {periodExpense.toLocaleString('id-ID')}
                  </p>
                  <p className="text-[11px] text-slate-500">{transactionPeriodLabel}</p>
                </div>
                {/* Kelola Kategori card — desktop only */}
                <CategoryManagement
                  categories={categories || []}
                  transactions={transactions || []}
                  variant="summary"
                />
              </div>
            );
          })()}

          {/* Action section */}
          <div className="space-y-2">
            <button
              type="button"
              onClick={openCreateTransactionModal}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-sm transition shadow-lg shadow-emerald-950/40"
            >
              <Plus size={16} /> Transaksi Baru
            </button>
            {/* Quick link Kelola Kategori — mobile only */}
            <CategoryManagement
              categories={categories || []}
              transactions={transactions || []}
              variant="strip"
            />
          </div>

          {(!sortedTransactionPeriodTransactions || sortedTransactionPeriodTransactions.length === 0) ? (
            <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 text-center">
              <p className="text-xs text-slate-400">
                {isTransactionAllTime
                  ? 'Belum ada transaksi tercatat.'
                  : `Belum ada transaksi pada periode ${formatMonthPeriod(transactionPeriod)}.`}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {groupTransactionsByDate(sortedTransactionPeriodTransactions).map(({ date, items }) => {
                const { day, dayName } = formatDateHeading(date);
                const dailyTotal = items.reduce((sum, tx) => {
                  if (tx.type === 'INCOME') return sum + tx.amount;
                  if (tx.type === 'EXPENSE') return sum - tx.amount;
                  return sum;
                }, 0);
                return (
                  <div key={date} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                    {/* Date heading */}
                    <div className="flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800">
                      <div>
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{day}</p>
                        <p className="text-[11px] text-slate-400">{dayName}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] uppercase tracking-wide text-slate-400 font-semibold mb-0.5">Net Hari Ini</p>
                        <span className={`text-base font-mono font-extrabold ${dailyTotal >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400'}`}>
                          {dailyTotal >= 0 ? '+' : ''}Rp {dailyTotal.toLocaleString('id-ID')}
                        </span>
                      </div>
                    </div>

                    {/* Transaction items */}
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                      {items.map((tx) => {
                        const categoryLabel = tx.type !== 'TRANSFER' ? transactionCategoryLabel(tx, categories) : 'Transfer';
                        const accountLabel = transactionAccountLabel(tx, accounts);
                        const isEditable = tx.type !== 'TRANSFER';
                        return (
                          <div
                            key={tx.id}
                            onClick={() => {
                              if (isEditable) openEditTransactionModal(tx);
                            }}
                            className={`flex items-center justify-between gap-3 py-3 px-4 transition group ${
                              isEditable
                                ? 'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40'
                                : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                            }`}
                          >
                            {/* Icon */}
                            <div className={`shrink-0 p-2 rounded-xl ${transactionIconClass(tx.type)}`}>
                              <TransactionIcon transaction={tx} categories={categories} />
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                                  {categoryLabel}
                                </span>
                                <span className="text-[11px] text-slate-300 dark:text-slate-600">•</span>
                                <span className="text-[11px] text-slate-400 dark:text-slate-500 truncate">
                                  {accountLabel}
                                </span>
                                {tx.goal_id && (() => {
                                  const linkedGoal = goals?.find((g) => g.id === tx.goal_id);
                                  return linkedGoal ? (
                                    <>
                                      <span className="text-[11px] text-slate-300 dark:text-slate-600">•</span>
                                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded">
                                        <Target size={11} /> {linkedGoal.name}
                                      </span>
                                    </>
                                  ) : null;
                                })()}
                              </div>
                              <p className="text-sm font-medium text-slate-800 dark:text-slate-100 leading-tight mt-0.5 truncate">
                                {tx.title}
                              </p>
                              {tx.note && (
                                <p className="text-[11px] text-slate-400 mt-0.5 truncate">{tx.note}</p>
                              )}
                            </div>

                            {/* Amount */}
                            <div className="text-right shrink-0">
                              <span className={`font-mono font-semibold text-sm ${transactionAmountClass(tx.type)}`}>
                                {tx.type === 'INCOME' ? '+' : tx.type === 'EXPENSE' ? '-' : ''}
                                Rp {tx.amount.toLocaleString('id-ID')}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {transactionActionSuccess && <p className="text-sm text-emerald-600 dark:text-emerald-400">{transactionActionSuccess}</p>}
          {transactionActionError && <p className="text-sm text-red-600 dark:text-red-400">{transactionActionError}</p>}
        </div>
      )}

      {/* TAB DOMPET */}
      {activeTab === 'accounts' && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold tracking-tight">Daftar Dompet & Akun</h2>
          {accountActionError && <p className="text-sm text-red-600 dark:text-red-400">{accountActionError}</p>}

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
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
                  <div className="mt-2 flex gap-3 justify-end">
                    <button
                      type="button"
                      onClick={() => openEditAccountModal(acc)}
                      title="Edit akun"
                      aria-label={`Edit akun ${acc.name}`}
                      className="text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeactivateAccount(acc)}
                      title="Nonaktifkan akun"
                      aria-label={`Nonaktifkan akun ${acc.name}`}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 size={16} />
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
        goals={goals || []}
        mode={transactionModalMode}
        transaction={selectedTransaction}
        accountBalances={accountBalances}
        onSubmitTx={handleSubmitTransaction}
        onDeleteTx={handleDeleteTransaction}
      />
      <AccountModal
        key={`account-modal-${accountModalKey}`}
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        mode={accountModalMode}
        account={selectedAccount}
        currentBalance={selectedAccount ? (accountBalances[selectedAccount.id] ?? selectedAccount.initial_balance) : undefined}
        onSubmitAccount={handleSubmitAccount}
      />
    </AppLayout>
  );
}
