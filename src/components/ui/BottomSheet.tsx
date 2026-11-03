'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Account, Category, Goal, Transaction } from '@/lib/db/schema';

export interface TransactionFormData {
  title: string;
  type: 'INCOME' | 'EXPENSE' | 'TRANSFER';
  amount: number;
  account_id: string;
  destination_account_id?: string;
  category_id?: string;
  goal_id?: string;
  transaction_date: string;
  note?: string;
}

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: Account[];
  categories: Category[];
  goals?: Goal[];
  mode: 'create' | 'edit';
  transaction?: Transaction;
  accountBalances?: Record<string, number>;
  onSubmitTx: (data: TransactionFormData) => Promise<void>;
  onDeleteTx?: (transaction: Transaction) => Promise<void>;
}

export function BottomSheet({ isOpen, onClose, accounts, categories, goals = [], mode, transaction, accountBalances = {}, onSubmitTx, onDeleteTx }: BottomSheetProps) {
  const [type, setType] = useState<'EXPENSE' | 'INCOME' | 'TRANSFER'>(transaction?.type ?? 'EXPENSE');
  const [title, setTitle] = useState(transaction?.title ?? '');
  const [amount, setAmount] = useState(transaction ? String(transaction.amount) : '');
  const [accountId, setAccountId] = useState(transaction?.account_id ?? accounts[0]?.id ?? '');
  const [destAccountId, setDestAccountId] = useState(transaction?.destination_account_id ?? accounts[1]?.id ?? '');
  const [categoryId, setCategoryId] = useState(transaction?.category_id ?? '');
  const [goalId, setGoalId] = useState(transaction?.goal_id ?? '');
  const [transactionDate, setTransactionDate] = useState(() => {
    if (transaction?.transaction_date) return transaction.transaction_date.slice(0, 10);
    // Gunakan tanggal lokal, bukan UTC, agar tidak terjadi offset timezone
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  });
  const [note, setNote] = useState(transaction?.note ?? '');
  const [error, setError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen) return null;

  const handleDelete = async () => {
    if (!transaction || !onDeleteTx) return;
    try {
      setIsDeleting(true);
      setError('');
      await onDeleteTx(transaction);
      onClose();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Gagal menghapus transaksi');
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredCategories = categories.filter((c) => c.type === type && c.is_active !== false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError('');
      await onSubmitTx({
        title: type === 'TRANSFER' ? 'Transfer' : title,
        type,
        amount: Number(amount),
        account_id: accountId || accounts[0]?.id || '',
        destination_account_id: type === 'TRANSFER' ? destAccountId : undefined,
        category_id: type !== 'TRANSFER' ? categoryId : undefined,
        goal_id: type === 'EXPENSE' ? (goalId || undefined) : undefined,
        transaction_date: `${transactionDate}T00:00:00.000`,
        note,
      });
      onClose();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Gagal menyimpan transaksi');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 transition-opacity">
      <div className="w-full max-w-lg max-h-[90vh] flex flex-col bg-white dark:bg-slate-900 rounded-t-2xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 p-6 animate-in slide-in-from-bottom duration-200">

        {/* Header Modal */}
        <div className="flex justify-between items-center pb-4 shrink-0">
          <h3 className="text-lg font-bold">{mode === 'edit' ? 'Edit Transaksi' : 'Catat Transaksi'}</h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X size={20} />
          </button>
        </div>

        {/* Modal Body - Scrollable */}
        <div className="overflow-y-auto pr-1 space-y-5 flex-1">
          {/* Tab Selection */}
          <div className="grid grid-cols-3 gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold">
            {(['EXPENSE', 'INCOME', 'TRANSFER'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => {
                  if (mode !== 'create') return;
                  setType(t);
                  setCategoryId('');
                }}
                disabled={mode === 'edit'}
                className={`py-2 rounded-lg transition ${type === t
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-50 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
              >
                {t === 'EXPENSE' ? 'Pengeluaran' : t === 'INCOME' ? 'Pemasukan' : 'Transfer'}
              </button>
            ))}
          </div>

          <form id="transaction-form" onSubmit={handleSubmit} className="space-y-4">
            {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
            {/* Nominal Input */}
            <div>
              <label className="text-xs font-medium text-slate-500">Nominal (Rp)</label>
              <input
                type="number"
                required
                min="1"
                step="1"
                inputMode="numeric"
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full text-2xl font-mono font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 mt-1 focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            {/* Title Input */}
            {type !== 'TRANSFER' && (
              <div>
                <label className="text-xs font-medium text-slate-500">Judul Transaksi</label>
                <input
                  type="text"
                  required
                  placeholder="Misal: Makan Siang, Gaji Bulanan"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 mt-1 focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
            )}

            <div>
              <label className="text-xs font-medium text-slate-500">Catatan (Opsional)</label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Tambahkan catatan transaksi"
                rows={2}
                className="w-full text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 mt-1 focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-500">Tanggal</label>
              <input
                type="date"
                required
                value={transactionDate}
                onChange={(e) => setTransactionDate(e.target.value)}
                className="w-full text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 mt-1 focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            {/* Account Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-500">
                  {type === 'TRANSFER' ? 'Dari Akun' : 'Bayar / Pakai Akun'}
                </label>
                <select
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  className="w-full text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 mt-1 focus:ring-2 focus:ring-emerald-500 outline-none"
                >
                  {accounts.map((acc) => {
                    const balance = accountBalances[acc.id] ?? acc.initial_balance;
                    return (
                      <option key={acc.id} value={acc.id}>
                        {acc.name} (Rp {balance.toLocaleString('id-ID')})
                      </option>
                    );
                  })}
                </select>
              </div>

              {type === 'TRANSFER' && (
                <div>
                  <label className="text-xs font-medium text-slate-500">Ke Akun Tujuan</label>
                  <select
                    value={destAccountId}
                    onChange={(e) => setDestAccountId(e.target.value)}
                    className="w-full text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 mt-1 focus:ring-2 focus:ring-emerald-500 outline-none"
                  >
                    {accounts.map((acc) => {
                      const balance = accountBalances[acc.id] ?? acc.initial_balance;
                      return (
                        <option key={acc.id} value={acc.id}>
                          {acc.name} (Rp {balance.toLocaleString('id-ID')})
                        </option>
                      );
                    })}
                  </select>
                </div>
              )}
            </div>

            {/* Category Selection */}
            {type !== 'TRANSFER' && (
              <div>
                <label className="text-xs font-medium text-slate-500">Kategori</label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 mt-1 focus:ring-2 focus:ring-emerald-500 outline-none"
                >
                  <option value="">Uncategorized</option>
                  {filteredCategories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Goal Linkage (Optional for EXPENSE) */}
            {type === 'EXPENSE' && goals.length > 0 && (
              <div>
                <label className="text-xs font-medium text-slate-500">Kaitkan ke Target Tabungan (Opsional)</label>
                <select
                  value={goalId}
                  onChange={(e) => setGoalId(e.target.value)}
                  className="w-full text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 mt-1 focus:ring-2 focus:ring-emerald-500 outline-none"
                >
                  <option value="">Tidak ada (Pengeluaran Bebas)</option>
                  {goals.filter((g) => !g.is_deleted).map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name} (Tersedia: Rp {g.allocated_amount.toLocaleString('id-ID')})
                    </option>
                  ))}
                </select>
                {goalId && (
                  <p className="text-[11px] text-slate-400 mt-1">
                    Pengeluaran ini akan memotong alokasi dana dari target yang dipilih.
                  </p>
                )}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-sm transition shadow-sm mt-2"
            >
              {mode === 'edit' ? 'Simpan Perubahan' : 'Simpan Transaksi'}
            </button>

            {mode === 'edit' && onDeleteTx && transaction && (
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDelete}
                className="w-full py-3 bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-900/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50 rounded-xl font-semibold text-sm transition mt-2 disabled:opacity-50"
              >
                {isDeleting ? 'Menghapus...' : 'Hapus Transaksi'}
              </button>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
