'use client';

import { useState, type FormEvent } from 'react';
import { X, ShoppingBag } from 'lucide-react';
import type { Goal, Account, Category } from '@/lib/db/schema';

interface SpendGoalModalProps {
  isOpen: boolean;
  goal: Goal;
  accounts: Account[];
  categories: Category[];
  accountBalances: Record<string, number>;
  onClose: () => void;
  onSubmit: (data: {
    account_id: string;
    amount: number;
    title: string;
    category_id?: string;
    transaction_date: string;
    note?: string;
  }) => Promise<void>;
}

export function SpendGoalModal({
  isOpen,
  goal,
  accounts,
  categories,
  accountBalances,
  onClose,
  onSubmit,
}: SpendGoalModalProps) {
  const [title, setTitle] = useState(`Belanja target: ${goal.name}`);
  const [amount, setAmount] = useState(String(goal.allocated_amount > 0 ? goal.allocated_amount : ''));
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? '');
  const [categoryId, setCategoryId] = useState('');
  const [transactionDate, setTransactionDate] = useState(() => {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  });
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const expenseCategories = categories.filter((c) => c.type === 'EXPENSE' && c.is_active !== false);
  const selectedAccountBalance = accountBalances[accountId] ?? 0;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!title.trim()) {
      setError('Judul transaksi belanja wajib diisi');
      return;
    }

    const amountNum = Number(amount);
    if (!Number.isFinite(amountNum) || !Number.isInteger(amountNum) || amountNum <= 0) {
      setError('Nominal belanja harus berupa angka bulat lebih besar dari 0');
      return;
    }

    if (amountNum > goal.allocated_amount) {
      setError(`Nominal belanja melebihi sisa alokasi dana target (Rp ${goal.allocated_amount.toLocaleString('id-ID')})`);
      return;
    }

    if (selectedAccountBalance < amountNum) {
      setError(`Saldo akun sumber tidak mencukupi (Tersedia: Rp ${selectedAccountBalance.toLocaleString('id-ID')})`);
      return;
    }

    try {
      setError('');
      setIsSubmitting(true);
      await onSubmit({
        account_id: accountId,
        amount: amountNum,
        title: title.trim(),
        category_id: categoryId ? categoryId : undefined,
        transaction_date: `${transactionDate}T00:00:00.000`,
        note: note.trim() ? note.trim() : undefined,
      });
      onClose();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Gagal memproses pembelanjaan');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-6">
      <div className="w-full max-w-md max-h-[90vh] overflow-y-auto flex flex-col bg-white dark:bg-slate-900 rounded-t-2xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 p-6 animate-in zoom-in-95 duration-150">
        <div className="flex justify-between items-center pb-3 shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400">
              <ShoppingBag size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold">Belanja dari Target</h3>
              <p className="text-xs text-slate-500 truncate max-w-[240px]">{goal.name}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
          >
            <X size={20} />
          </button>
        </div>

        <div className="overflow-y-auto pr-1 space-y-4 flex-1">
          {/* Info Notice */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700/60 text-xs space-y-2.5">
            {/* Penjelasan Edukatif Singkat */}
            <div className="flex gap-2">
              <span className="text-base shrink-0 leading-none">💡</span>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                <strong className="text-rose-600 dark:text-rose-400">Belanja dari Target</strong> digunakan ketika Anda benar-benar membeli barang/tujuan target ini. Aksi ini akan mencatat transaksi pengeluaran riil dari dompet/rekening Anda sekaligus memotong alokasi target ini, <strong>tanpa mengurangi Safe-to-Spend dua kali</strong>.
              </p>
            </div>

            <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between">
              <span className="text-slate-500">Maksimal Belanja (Alokasi Tersedia):</span>
              <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
                Rp {goal.allocated_amount.toLocaleString('id-ID')}
              </span>
            </div>
          </div>

          <form id="spend-goal-form" onSubmit={handleSubmit} className="space-y-4">
            {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

            <div>
              <label className="text-xs font-medium text-slate-500">Nominal Belanja (Rp)</label>
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

            <div>
              <label className="text-xs font-medium text-slate-500">Judul Pengeluaran</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Misal: Beli Laptop Asus ROG"
                className="w-full text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 mt-1 focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-500">Bayar Menggunakan Rekening / Akun</label>
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 mt-1 focus:ring-2 focus:ring-emerald-500 outline-none"
              >
                {accounts.map((acc) => {
                  const bal = accountBalances[acc.id] ?? acc.initial_balance;
                  return (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} (Saldo: Rp {bal.toLocaleString('id-ID')})
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-500">Kategori (Opsional)</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 mt-1 focus:ring-2 focus:ring-emerald-500 outline-none"
              >
                <option value="">Uncategorized</option>
                {expenseCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-500">Tanggal Belanja</label>
              <input
                type="date"
                required
                value={transactionDate}
                onChange={(e) => setTransactionDate(e.target.value)}
                className="w-full text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 mt-1 focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-500">Catatan Belanja (Opsional)</label>
              <input
                type="text"
                placeholder="Catatan pembelian..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 mt-1 focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting || goal.allocated_amount <= 0}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-sm transition shadow-sm mt-2 disabled:opacity-50"
            >
              {isSubmitting ? 'Memproses Belanja...' : 'Konfirmasi Belanja'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
