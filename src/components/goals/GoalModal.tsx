'use client';

import { useState, type FormEvent } from 'react';
import { X } from 'lucide-react';
import type { Goal } from '@/lib/db/schema';

interface GoalModalProps {
  isOpen: boolean;
  mode: 'create' | 'edit';
  goal?: Goal;
  onClose: () => void;
  onSubmit: (data: { name: string; target_amount: number; target_date?: string; note?: string }) => Promise<void>;
}

export function GoalModal({ isOpen, mode, goal, onClose, onSubmit }: GoalModalProps) {
  const [name, setName] = useState(goal?.name ?? '');
  const [targetAmount, setTargetAmount] = useState(goal ? String(goal.target_amount) : '');
  const [targetDate, setTargetDate] = useState(goal?.target_date ?? '');
  const [note, setNote] = useState(goal?.note ?? '');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim()) {
      setError('Nama target tabungan wajib diisi');
      return;
    }
    const amountNum = Number(targetAmount);
    if (!Number.isFinite(amountNum) || !Number.isInteger(amountNum) || amountNum <= 0) {
      setError('Nominal target harus berupa angka bulat lebih besar dari 0');
      return;
    }

    try {
      setError('');
      setIsSubmitting(true);
      await onSubmit({
        name: name.trim(),
        target_amount: amountNum,
        target_date: targetDate ? targetDate : undefined,
        note: note.trim() ? note.trim() : undefined,
      });
      onClose();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Gagal menyimpan target');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-6">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 animate-in zoom-in-95 duration-150">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-bold">
            {mode === 'edit' ? 'Edit Target Tabungan' : 'Target Tabungan Baru'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

          <div>
            <label className="text-xs font-medium text-slate-500">Nama Pos / Target</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Beli Laptop Baru, Dana Darurat"
              className="w-full text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 mt-1 focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-500">Nominal Target (Rp)</label>
            <input
              type="number"
              required
              min="1"
              step="1"
              inputMode="numeric"
              value={targetAmount}
              onChange={(e) => setTargetAmount(e.target.value)}
              placeholder="0"
              className="w-full text-xl font-mono font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 mt-1 focus:ring-2 focus:ring-emerald-500 outline-none"
            />
            {mode === 'edit' && goal && Number(targetAmount) > 0 && goal.allocated_amount > Number(targetAmount) && (
              <div className="mt-1.5 p-2 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-lg text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
                <span>Catatan: Dana yang dialokasikan saat ini melebihi target sebesar </span>
                <span className="font-mono font-bold text-amber-900 dark:text-amber-200">
                  Rp {(goal.allocated_amount - Number(targetAmount)).toLocaleString('id-ID')}
                </span>.
              </div>
            )}
          </div>

          <div>
            <label className="text-xs font-medium text-slate-500">Target Tanggal Tercapai (Opsional)</label>
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="w-full text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 mt-1 focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-500">Catatan / Deskripsi (Opsional)</label>
            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Catatan tambahan untuk target ini..."
              className="w-full text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 mt-1 focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-sm transition shadow-sm mt-2 disabled:opacity-50"
          >
            {isSubmitting ? 'Menyimpan...' : mode === 'edit' ? 'Simpan Perubahan' : 'Buat Target Tabungan'}
          </button>
        </form>
      </div>
    </div>
  );
}
