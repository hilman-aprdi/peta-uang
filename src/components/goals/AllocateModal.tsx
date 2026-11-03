'use client';

import { useState, type FormEvent } from 'react';
import { X, ArrowDownRight, ArrowUpRight } from 'lucide-react';
import type { Goal } from '@/lib/db/schema';

interface AllocateModalProps {
  isOpen: boolean;
  mode: 'allocate' | 'withdraw';
  goal: Goal;
  safeToSpend: number;
  onClose: () => void;
  onSubmit: (amount: number, note?: string) => Promise<void>;
}

export function AllocateModal({
  isOpen,
  mode,
  goal,
  safeToSpend,
  onClose,
  onSubmit,
}: AllocateModalProps) {
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const isAllocate = mode === 'allocate';
  const maxAvailable = isAllocate ? Math.max(0, safeToSpend) : goal.allocated_amount;

  const handleShortcut = (val: number) => {
    setAmount(String(Math.min(val, maxAvailable)));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const amountNum = Number(amount);

    if (!Number.isFinite(amountNum) || !Number.isInteger(amountNum) || amountNum <= 0) {
      setError('Nominal harus berupa angka bulat lebih besar dari 0');
      return;
    }

    if (isAllocate && amountNum > safeToSpend) {
      setError(`Nominal alokasi melebihi sisa Safe-to-Spend yang tersedia (Rp ${safeToSpend.toLocaleString('id-ID')})`);
      return;
    }

    if (!isAllocate && amountNum > goal.allocated_amount) {
      setError(`Nominal penarikan melebihi dana yang dialokasikan di target ini (Rp ${goal.allocated_amount.toLocaleString('id-ID')})`);
      return;
    }

    try {
      setError('');
      setIsSubmitting(true);
      await onSubmit(amountNum, note.trim() || undefined);
      onClose();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Gagal memproses dana');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-6">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 animate-in zoom-in-95 duration-150">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div
              className={`p-2 rounded-xl ${
                isAllocate
                  ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400'
                  : 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400'
              }`}
            >
              {isAllocate ? <ArrowDownRight size={20} /> : <ArrowUpRight size={20} />}
            </div>
            <div>
              <h3 className="text-lg font-bold">
                {isAllocate ? 'Alokasikan Dana' : 'Tarik Dana ke Safe-to-Spend'}
              </h3>
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

        {/* Info Box */}
        <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700/60 text-xs space-y-2.5">
          {/* Penjelasan Edukatif Singkat */}
          <div className="flex gap-2">
            <span className="text-base shrink-0 leading-none">💡</span>
            <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
              {isAllocate ? (
                <>
                  <strong className="text-emerald-700 dark:text-emerald-400">Alokasikan Dana</strong> memindahkan sebagian dana aman (<em>Safe-to-Spend</em>) ke pos target ini agar tidak terpakai untuk belanja harian. <strong>Saldo riil di dompet / rekening Anda tidak berubah.</strong>
                </>
              ) : (
                <>
                  <strong className="text-amber-700 dark:text-amber-400">Tarik Dana</strong> mengembalikan uang yang tersimpan di target ini ke saldo bebas (<em>Safe-to-Spend</em>) agar siap dibelanjakan kembali. <strong>Saldo riil di dompet / rekening Anda tidak berubah.</strong>
                </>
              )}
            </p>
          </div>

          <div className="pt-2 border-t border-slate-200 dark:border-slate-700 space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-500">Dana Terkumpul di Target:</span>
              <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                Rp {goal.allocated_amount.toLocaleString('id-ID')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">
                {isAllocate ? 'Maksimal Alokasi (Safe-to-Spend):' : 'Maksimal Penarikan:'}
              </span>
              <span
                className={`font-mono font-bold ${
                  isAllocate ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
                }`}
              >
                Rp {maxAvailable.toLocaleString('id-ID')}
              </span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

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

          {/* Quick Shortcuts */}
          {maxAvailable > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {[50_000, 100_000, 500_000, 1_000_000].map((val) => {
                if (val > maxAvailable) return null;
                return (
                  <button
                    key={val}
                    type="button"
                    onClick={() => handleShortcut(val)}
                    className="text-[11px] font-medium px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition"
                  >
                    +{(val / 1000).toLocaleString('id-ID')}rb
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => setAmount(String(maxAvailable))}
                className="text-[11px] font-medium px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 transition"
              >
                Maksimal
              </button>
            </div>
          )}

          <div>
            <label className="text-xs font-medium text-slate-500">Catatan Alokasi (Opsional)</label>
            <input
              type="text"
              placeholder="Misal: Sisihan gaji, bonus lembur"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 mt-1 focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting || maxAvailable <= 0}
            className={`w-full py-3 rounded-xl font-semibold text-sm transition shadow-sm mt-2 disabled:opacity-50 text-white ${
              isAllocate
                ? 'bg-emerald-600 hover:bg-emerald-700'
                : 'bg-amber-600 hover:bg-amber-700'
            }`}
          >
            {isSubmitting
              ? 'Memproses...'
              : isAllocate
              ? 'Konfirmasi Alokasi Dana'
              : 'Konfirmasi Tarik Dana'}
          </button>
        </form>
      </div>
    </div>
  );
}
