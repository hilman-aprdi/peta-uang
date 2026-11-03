'use client';

import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  Target,
  Plus,
  ArrowDownRight,
  ArrowUpRight,
  ShoppingBag,
  Pencil,
  Trash2,
  Calendar,
  CheckCircle2,
  Archive,
  ArrowLeft,
  Clock,
} from 'lucide-react';
import type { Goal, GoalAllocation, Transaction } from '@/lib/db/schema';
import { db } from '@/lib/db/schema';
import {
  allocateFunds,
  createGoal,
  deleteGoal,
  setGoalStatus,
  spendFromGoal,
  updateGoal,
  withdrawFunds,
} from '@/lib/services/goalService';
import { getAccountBalance } from '@/lib/services/accountService';
import { calculateFinancialOverview } from '@/lib/finance/calculator';
import { GoalModal } from '@/components/goals/GoalModal';
import { AllocateModal } from '@/components/goals/AllocateModal';
import { SpendGoalModal } from '@/components/goals/SpendGoalModal';

export function GoalManagement() {
  const [selectedGoalId, setSelectedGoalId] = useState<string>();
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'COMPLETED' | 'ARCHIVED'>('ACTIVE');
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [goalModalMode, setGoalModalMode] = useState<'create' | 'edit'>('create');
  const [goalToEdit, setGoalToEdit] = useState<Goal>();
  const [goalModalKey, setGoalModalKey] = useState(0);

  const [isAllocateModalOpen, setIsAllocateModalOpen] = useState(false);
  const [allocateMode, setAllocateMode] = useState<'allocate' | 'withdraw'>('allocate');
  const [targetGoalForAllocation, setTargetGoalForAllocation] = useState<Goal>();

  const [isSpendModalOpen, setIsSpendModalOpen] = useState(false);
  const [targetGoalForSpend, setTargetGoalForSpend] = useState<Goal>();

  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  // Live queries
  const goals = useLiveQuery(() => db.goals.filter((g) => !g.is_deleted).toArray(), []);
  const accounts = useLiveQuery(() => db.accounts.filter((a) => a.is_active).toArray(), []);
  const categories = useLiveQuery(() => db.categories.filter((c) => c.is_active !== false).toArray(), []);
  const financialOverview = useLiveQuery(() => calculateFinancialOverview(), []);
  const selectedGoalAllocations = useLiveQuery(
    () =>
      selectedGoalId
        ? db.goal_allocations.where('goal_id').equals(selectedGoalId).reverse().sortBy('created_at')
        : Promise.resolve<GoalAllocation[]>([]),
    [selectedGoalId]
  );
  const transactions = useLiveQuery(() => db.transactions.toArray(), []);

  // Account balances mapping
  const accountBalances: Record<string, number> = {};
  if (accounts && transactions) {
    for (const acc of accounts) {
      let b = acc.initial_balance;
      for (const t of transactions) {
        if (t.type === 'INCOME' && t.account_id === acc.id) b += t.amount;
        else if (t.type === 'EXPENSE' && t.account_id === acc.id) b -= t.amount;
        else if (t.type === 'TRANSFER') {
          if (t.account_id === acc.id) b -= t.amount;
          if (t.destination_account_id === acc.id) b += t.amount;
        }
      }
      accountBalances[acc.id] = b;
    }
  }

  const selectedGoal = goals?.find((g) => g.id === selectedGoalId);

  // Filtered goals
  const filteredGoals = goals?.filter((g) => {
    if (statusFilter === 'ALL') return true;
    return g.status === statusFilter;
  });

  // Global statistics
  const totalTargetAmount = goals?.reduce((sum, g) => (g.status !== 'ARCHIVED' ? sum + g.target_amount : sum), 0) ?? 0;
  const totalAllocatedAmount = goals?.reduce((sum, g) => sum + g.allocated_amount, 0) ?? 0;
  const globalProgress = totalTargetAmount > 0 ? Math.min(100, Math.round((totalAllocatedAmount / totalTargetAmount) * 100)) : 0;

  // Handlers
  const openCreateGoal = () => {
    setGoalModalMode('create');
    setGoalToEdit(undefined);
    setGoalModalKey((k) => k + 1);
    setActionError('');
    setActionSuccess('');
    setIsGoalModalOpen(true);
  };

  const openEditGoal = (goal: Goal) => {
    setGoalModalMode('edit');
    setGoalToEdit(goal);
    setGoalModalKey((k) => k + 1);
    setActionError('');
    setActionSuccess('');
    setIsGoalModalOpen(true);
  };

  const handleSaveGoal = async (data: { name: string; target_amount: number; target_date?: string; note?: string }) => {
    if (goalModalMode === 'edit' && goalToEdit) {
      await updateGoal(goalToEdit.id, data);
      setActionSuccess('Target tabungan berhasil diperbarui.');
    } else {
      await createGoal(data);
      setActionSuccess('Target tabungan baru berhasil dibuat.');
    }
  };

  const handleDeleteGoal = async (goal: Goal) => {
    if (goal.allocated_amount > 0) {
      setActionError(`Target "${goal.name}" tidak dapat dihapus karena masih memiliki dana Rp ${goal.allocated_amount.toLocaleString('id-ID')}. Tarik seluruh dana terlebih dahulu.`);
      return;
    }

    if (!window.confirm(`Hapus target tabungan "${goal.name}"? Riwayat alokasi akan tetap tersimpan dalam sistem.`)) {
      return;
    }

    try {
      setActionError('');
      await deleteGoal(goal.id);
      setActionSuccess('Target tabungan berhasil dihapus.');
      if (selectedGoalId === goal.id) setSelectedGoalId(undefined);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Gagal menghapus target');
    }
  };

  const handleStatusChange = async (goal: Goal, status: 'ACTIVE' | 'COMPLETED' | 'ARCHIVED') => {
    try {
      setActionError('');
      await setGoalStatus(goal.id, status);
      setActionSuccess(`Status target "${goal.name}" berhasil diubah menjadi ${status}.`);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Gagal mengubah status');
    }
  };

  const openAllocate = (goal: Goal) => {
    setAllocateMode('allocate');
    setTargetGoalForAllocation(goal);
    setActionError('');
    setActionSuccess('');
    setIsAllocateModalOpen(true);
  };

  const openWithdraw = (goal: Goal) => {
    setAllocateMode('withdraw');
    setTargetGoalForAllocation(goal);
    setActionError('');
    setActionSuccess('');
    setIsAllocateModalOpen(true);
  };

  const handleAllocateOrWithdraw = async (amount: number, note?: string) => {
    if (!targetGoalForAllocation) return;
    if (allocateMode === 'allocate') {
      await allocateFunds(targetGoalForAllocation.id, amount, note);
      setActionSuccess(`Berhasil mengalokasikan Rp ${amount.toLocaleString('id-ID')} ke "${targetGoalForAllocation.name}".`);
    } else {
      await withdrawFunds(targetGoalForAllocation.id, amount, note);
      setActionSuccess(`Berhasil menarik Rp ${amount.toLocaleString('id-ID')} dari "${targetGoalForAllocation.name}" kembali ke Safe-to-Spend.`);
    }
  };

  const openSpend = (goal: Goal) => {
    setTargetGoalForSpend(goal);
    setActionError('');
    setActionSuccess('');
    setIsSpendModalOpen(true);
  };

  const handleSpend = async (data: {
    account_id: string;
    amount: number;
    title: string;
    category_id?: string;
    transaction_date: string;
    note?: string;
  }) => {
    if (!targetGoalForSpend) return;
    await spendFromGoal(targetGoalForSpend.id, data);
    setActionSuccess(`Pembelanjaan Rp ${data.amount.toLocaleString('id-ID')} berhasil dicatat.`);
  };

  const formatEventBadge = (type: GoalAllocation['type']) => {
    switch (type) {
      case 'ALLOCATE':
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">Alokasi Masuk</span>;
      case 'WITHDRAW':
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300">Penarikan Dana</span>;
      case 'SPEND':
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300">Belanja Target</span>;
      case 'SPEND_ADJUSTMENT':
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300">Penyesuaian Belanja</span>;
      case 'SPEND_REVERSAL':
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-cyan-100 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300">Pengembalian Belanja</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Detail View jika ada goal yang dipilih */}
      {selectedGoal ? (
        <div className="space-y-5">
          <button
            type="button"
            onClick={() => setSelectedGoalId(undefined)}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition"
          >
            <ArrowLeft size={16} /> Kembali ke Semua Target
          </button>

          {/* Goal Detail Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                    {selectedGoal.name}
                  </h2>
                  <span
                    className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                      selectedGoal.status === 'COMPLETED'
                        ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                        : selectedGoal.status === 'ARCHIVED'
                        ? 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                        : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600'
                    }`}
                  >
                    {selectedGoal.status}
                  </span>
                </div>
                {selectedGoal.note && <p className="text-xs text-slate-500 mt-1">{selectedGoal.note}</p>}
                {selectedGoal.target_date && (
                  <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                    <Calendar size={13} /> Target: {new Date(selectedGoal.target_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                )}
              </div>

              {/* Status Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => openEditGoal(selectedGoal)}
                  title="Edit target"
                  className="p-2 text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 border border-slate-200 dark:border-slate-700 rounded-xl transition"
                >
                  <Pencil size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteGoal(selectedGoal)}
                  title="Hapus target"
                  className="p-2 text-slate-500 hover:text-red-600 border border-slate-200 dark:border-slate-700 rounded-xl transition"
                >
                  <Trash2 size={15} />
                </button>
                {selectedGoal.status === 'ACTIVE' && (
                  <button
                    type="button"
                    onClick={() => handleStatusChange(selectedGoal, 'COMPLETED')}
                    className="flex items-center gap-1 text-xs font-semibold px-3 py-2 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 rounded-xl hover:bg-emerald-100 transition"
                  >
                    <CheckCircle2 size={14} /> Tandai Selesai
                  </button>
                )}
                {selectedGoal.status === 'COMPLETED' && (
                  <button
                    type="button"
                    onClick={() => handleStatusChange(selectedGoal, 'ACTIVE')}
                    className="text-xs font-semibold px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200 transition"
                  >
                    Aktifkan Kembali
                  </button>
                )}
                {selectedGoal.status !== 'ARCHIVED' && selectedGoal.allocated_amount === 0 && (
                  <button
                    type="button"
                    onClick={() => handleStatusChange(selectedGoal, 'ARCHIVED')}
                    className="flex items-center gap-1 text-xs font-semibold px-3 py-2 bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 rounded-xl hover:bg-slate-200 transition"
                  >
                    <Archive size={14} /> Arsipkan
                  </button>
                )}
              </div>
            </div>

            {/* Progress Bars & Amounts */}
            <div className="pt-2">
              <div className="flex justify-between items-baseline mb-2">
                <div>
                  <span className="text-xs text-slate-500 block">Dana Terkumpul</span>
                  <span className="text-2xl font-mono font-extrabold text-emerald-600 dark:text-emerald-400">
                    Rp {selectedGoal.allocated_amount.toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-500 block">Target Akhir</span>
                  <span className="text-lg font-mono font-bold text-slate-800 dark:text-slate-200">
                    Rp {selectedGoal.target_amount.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              {/* Progress Bar & Over-Allocation Display */}
              {(() => {
                const percent = Math.round((selectedGoal.allocated_amount / selectedGoal.target_amount) * 100);
                const isExceeded = selectedGoal.allocated_amount > selectedGoal.target_amount;
                const excessAmount = selectedGoal.allocated_amount - selectedGoal.target_amount;

                return (
                  <div className="space-y-2">
                    <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          isExceeded ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(100, percent)}%` }}
                      />
                    </div>

                    <div className="flex flex-wrap justify-between items-center text-xs gap-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-700 dark:text-slate-200">{percent}% tercapai</span>
                        {isExceeded && (
                          <span className="inline-flex items-center text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 px-1.5 py-0.5 rounded">
                            Target Terlampaui
                          </span>
                        )}
                      </div>
                      <span className="text-slate-400">
                        {isExceeded ? (
                          <span className="text-amber-600 dark:text-amber-400 font-medium">
                            Kelebihan alokasi: +Rp {excessAmount.toLocaleString('id-ID')}
                          </span>
                        ) : selectedGoal.allocated_amount === selectedGoal.target_amount ? (
                          <span className="text-emerald-600 dark:text-emerald-400 font-medium">Target pas 100% tercapai</span>
                        ) : (
                          `Sisa target: Rp ${(selectedGoal.target_amount - selectedGoal.allocated_amount).toLocaleString('id-ID')}`
                        )}
                      </span>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Action Buttons: Allocate, Withdraw, Spend */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => openAllocate(selectedGoal)}
                disabled={selectedGoal.status === 'ARCHIVED'}
                className="flex items-center justify-center gap-1.5 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition disabled:opacity-50"
              >
                <ArrowDownRight size={16} /> Alokasikan Dana
              </button>
              <button
                type="button"
                onClick={() => openWithdraw(selectedGoal)}
                disabled={selectedGoal.allocated_amount <= 0}
                className="flex items-center justify-center gap-1.5 py-2.5 px-4 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900/50 rounded-xl text-xs font-semibold transition disabled:opacity-50"
              >
                <ArrowUpRight size={16} /> Tarik ke Safe-to-Spend
              </button>
              <button
                type="button"
                onClick={() => openSpend(selectedGoal)}
                disabled={selectedGoal.allocated_amount <= 0}
                className="flex items-center justify-center gap-1.5 py-2.5 px-4 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/50 rounded-xl text-xs font-semibold transition disabled:opacity-50"
              >
                <ShoppingBag size={16} /> Belanja dari Target
              </button>
            </div>
          </div>

          {/* Allocation History */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Clock size={16} className="text-slate-400" />
              Riwayat Alokasi & Penggunaan Dana
            </h3>

            {(!selectedGoalAllocations || selectedGoalAllocations.length === 0) ? (
              <p className="text-xs text-slate-400 text-center py-6">
                Belum ada riwayat alokasi atau penarikan pada target ini.
              </p>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {selectedGoalAllocations.map((item) => {
                  const isPositive = item.type === 'ALLOCATE' || item.type === 'SPEND_REVERSAL' || (item.type === 'SPEND_ADJUSTMENT' && item.amount > 0);
                  const displayAmount = Math.abs(item.amount);
                  return (
                    <div key={item.id} className="py-3 flex justify-between items-center text-xs">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          {formatEventBadge(item.type)}
                          <span className="text-slate-400 text-[11px]">
                            {new Date(item.created_at).toLocaleDateString('id-ID', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        {item.note && <p className="text-slate-600 dark:text-slate-300">{item.note}</p>}
                      </div>
                      <div className="text-right">
                        <span
                          className={`font-mono font-bold text-sm ${
                            isPositive
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-rose-600 dark:text-rose-400'
                          }`}
                        >
                          {isPositive ? '+' : '-'}Rp {displayAmount.toLocaleString('id-ID')}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Goals Overview Page */
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
            <div>
              <h2 className="text-xl font-bold tracking-tight">Pos & Target Tabungan</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Alokasikan dana virtual untuk pos khusus tanpa mengubah saldo riil di dompet atau rekening Anda.
              </p>
            </div>
            <button
              type="button"
              onClick={openCreateGoal}
              className="flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition shadow-sm self-start sm:self-auto"
            >
              <Plus size={16} /> Buat Target Baru
            </button>
          </div>

          {actionSuccess && <p className="text-sm text-emerald-600 dark:text-emerald-400">{actionSuccess}</p>}
          {actionError && <p className="text-sm text-red-600 dark:text-red-400">{actionError}</p>}

          {/* Global Summary Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-3">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
              <div>
                <span className="text-xs font-medium text-slate-500">Total Terkumpul di Seluruh Target</span>
                <p className="text-2xl font-mono font-extrabold text-emerald-600 dark:text-emerald-400">
                  Rp {totalAllocatedAmount.toLocaleString('id-ID')}
                </p>
              </div>
              <div className="sm:text-right">
                <span className="text-xs font-medium text-slate-500">Total Akumulasi Target</span>
                <p className="text-lg font-mono font-bold text-slate-700 dark:text-slate-300">
                  Rp {totalTargetAmount.toLocaleString('id-ID')}
                </p>
              </div>
            </div>

            {/* Global Progress Bar */}
            <div>
              <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 transition-all duration-300"
                  style={{ width: `${globalProgress}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                <span>{globalProgress}% Terpenuhi</span>
                <span>Safe-to-Spend Tersisa: Rp {(financialOverview?.safeToSpend ?? 0).toLocaleString('id-ID')}</span>
              </div>
            </div>
          </div>

          {/* Filter Status Tabs */}
          <div className="flex gap-1.5 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl w-fit text-xs font-semibold">
            {(['ACTIVE', 'COMPLETED', 'ARCHIVED', 'ALL'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setStatusFilter(tab)}
                className={`py-1.5 px-3 rounded-lg transition ${
                  statusFilter === tab
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-50 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {tab === 'ACTIVE'
                  ? 'Aktif'
                  : tab === 'COMPLETED'
                  ? 'Selesai'
                  : tab === 'ARCHIVED'
                  ? 'Arsip'
                  : 'Semua'}
              </button>
            ))}
          </div>

          {/* Goal Cards Grid */}
          {(!filteredGoals || filteredGoals.length === 0) ? (
            <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 flex items-center justify-center mx-auto">
                {statusFilter === 'ACTIVE' && <Target size={24} className="text-emerald-500" />}
                {statusFilter === 'COMPLETED' && <CheckCircle2 size={24} className="text-blue-500" />}
                {statusFilter === 'ARCHIVED' && <Archive size={24} className="text-amber-500" />}
                {statusFilter === 'ALL' && <Target size={24} className="text-slate-400" />}
              </div>

              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                {statusFilter === 'ACTIVE' && 'Belum ada target tabungan aktif'}
                {statusFilter === 'COMPLETED' && 'Belum ada target yang selesai'}
                {statusFilter === 'ARCHIVED' && 'Tidak ada target yang diarsipkan'}
                {statusFilter === 'ALL' && 'Belum ada target tabungan yang dibuat'}
              </p>

              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
                {statusFilter === 'ACTIVE' &&
                  'Buat pos dana khusus seperti Dana Darurat atau Target Gadget agar sisa Safe-to-Spend Anda lebih terencana.'}
                {statusFilter === 'COMPLETED' &&
                  'Target yang sudah mencapai 100% dari nominal sasaran akan ditandai atau dapat diubah statusnya menjadi selesai di sini.'}
                {statusFilter === 'ARCHIVED' &&
                  'Target yang sudah selesai dan dananya telah ditarik/dibelanjakan dapat diarsipkan agar daftar tabungan Anda tetap rapi.'}
                {statusFilter === 'ALL' &&
                  'Mulai rencanakan tabungan dan alokasikan dana virtual Anda tanpa mengubah saldo fisik rekening bank.'}
              </p>

              {(statusFilter === 'ACTIVE' || statusFilter === 'ALL') && (
                <button
                  type="button"
                  onClick={openCreateGoal}
                  className="inline-flex items-center gap-1.5 py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition"
                >
                  <Plus size={14} /> Buat Target Baru
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredGoals.map((g) => {
                const percent = Math.round((g.allocated_amount / g.target_amount) * 100);
                const isOver = percent > 100;
                return (
                  <div
                    key={g.id}
                    className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 hover:border-emerald-300 dark:hover:border-emerald-700 transition flex flex-col justify-between"
                  >
                    <div>
                      {/* Card Header */}
                      <div className="flex justify-between items-start gap-2">
                        <div className="min-w-0">
                          <button
                            type="button"
                            onClick={() => setSelectedGoalId(g.id)}
                            className="font-bold text-base text-left hover:text-emerald-600 dark:hover:text-emerald-400 transition truncate block max-w-[220px]"
                          >
                            {g.name}
                          </button>
                          {g.target_date && (
                            <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                              <Calendar size={12} />
                              {new Date(g.target_date).toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => openEditGoal(g)}
                            title="Edit target"
                            className="p-1 text-slate-400 hover:text-emerald-600 transition"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteGoal(g)}
                            title="Hapus target"
                            className="p-1 text-slate-400 hover:text-red-600 transition"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>

                      {/* Amounts & Progress */}
                      <div className="mt-3">
                        <div className="flex justify-between items-baseline mb-1.5 text-xs">
                          <div>
                            <span className="text-[11px] text-slate-400 block">Terkumpul</span>
                            <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-base">
                              Rp {g.allocated_amount.toLocaleString('id-ID')}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-[11px] text-slate-400 block">Target</span>
                            <span className="font-mono font-semibold text-slate-600 dark:text-slate-300">
                              Rp {g.target_amount.toLocaleString('id-ID')}
                            </span>
                          </div>
                        </div>

                        {/* Progress Bar visually capped at 100% */}
                        <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 ${
                              isOver ? 'bg-amber-500' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${Math.min(100, percent)}%` }}
                          />
                        </div>

                        <div className="flex justify-between items-center text-[11px] mt-1.5 gap-1">
                          <div className="flex items-center gap-1">
                            <span className="font-bold text-slate-700 dark:text-slate-300">{percent}%</span>
                            {isOver && (
                              <span className="text-[9px] font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-1 py-0.2 rounded border border-amber-200 dark:border-amber-900/50">
                                Melebihi Target
                              </span>
                            )}
                          </div>
                          <span className="text-slate-400 truncate">
                            {isOver ? (
                              <span className="text-amber-600 dark:text-amber-400 font-medium">
                                +Rp {(g.allocated_amount - g.target_amount).toLocaleString('id-ID')}
                              </span>
                            ) : g.allocated_amount === g.target_amount ? (
                              <span className="text-emerald-600 dark:text-emerald-400 font-medium">Pas 100%</span>
                            ) : (
                              `Sisa Rp ${(g.target_amount - g.allocated_amount).toLocaleString('id-ID')}`
                            )}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Quick Card Actions */}
                    <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={() => openAllocate(g)}
                        disabled={g.status === 'ARCHIVED'}
                        className="flex items-center justify-center gap-1 py-2 px-3 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs font-semibold transition disabled:opacity-40"
                      >
                        <ArrowDownRight size={14} /> Alokasikan
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedGoalId(g.id)}
                        className="flex items-center justify-center gap-1 py-2 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold transition"
                      >
                        Detail & Riwayat
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <GoalModal
        key={`goal-modal-${goalModalKey}`}
        isOpen={isGoalModalOpen}
        mode={goalModalMode}
        goal={goalToEdit}
        onClose={() => setIsGoalModalOpen(false)}
        onSubmit={handleSaveGoal}
      />

      {targetGoalForAllocation && (
        <AllocateModal
          key={`allocate-modal-${targetGoalForAllocation.id}-${allocateMode}`}
          isOpen={isAllocateModalOpen}
          mode={allocateMode}
          goal={targetGoalForAllocation}
          safeToSpend={financialOverview?.safeToSpend ?? 0}
          onClose={() => setIsAllocateModalOpen(false)}
          onSubmit={handleAllocateOrWithdraw}
        />
      )}

      {targetGoalForSpend && (
        <SpendGoalModal
          key={`spend-modal-${targetGoalForSpend.id}`}
          isOpen={isSpendModalOpen}
          goal={targetGoalForSpend}
          accounts={accounts || []}
          categories={categories || []}
          accountBalances={accountBalances}
          onClose={() => setIsSpendModalOpen(false)}
          onSubmit={handleSpend}
        />
      )}
    </div>
  );
}
