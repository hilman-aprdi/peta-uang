'use client';

import { useState, type FormEvent } from 'react';
import { X } from 'lucide-react';
import type { Bill } from '@/lib/db/schema';

interface BillModalProps {
  isOpen: boolean;
  mode: 'create' | 'edit';
  bill?: Bill;
  onClose: () => void;
  onSubmit: (data: { title: string; amount: number; due_date: string }) => Promise<void>;
}

export function BillModal({ isOpen, mode, bill, onClose, onSubmit }: BillModalProps) {
  const [title, setTitle] = useState(bill?.title ?? '');
  const [amount, setAmount] = useState(bill ? String(bill.amount) : '');
  const [dueDate, setDueDate] = useState(bill?.due_date.slice(0, 10) ?? new Date().toISOString().slice(0, 10));
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    try {
      setError('');
      setIsSubmitting(true);
      await onSubmit({
        title,
        amount: Number(amount),
        due_date: new Date(`${dueDate}T00:00:00`).toISOString(),
      });
      onClose();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Gagal menyimpan tagihan');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-6">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-bold">{mode === 'edit' ? 'Edit Tagihan' : 'Tambah Tagihan'}</h3>
          <button type="button" onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
          <div>
            <label className="text-xs font-medium text-slate-500">Judul Tagihan</label>
            <input
              type="text"
              required
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Contoh: Listrik bulanan"
              className="w-full text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 mt-1 outline-none"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500">Nominal (Rp)</label>
            <input
              type="number"
              required
              min="1"
              step="1"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              placeholder="0"
              className="w-full text-xl font-mono font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 mt-1 outline-none"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500">Tanggal Jatuh Tempo</label>
            <input
              type="date"
              required
              value={dueDate}
              onChange={(event) => setDueDate(event.target.value)}
              className="w-full text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 mt-1 outline-none"
            />
          </div>
          <button type="submit" disabled={isSubmitting} className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-sm disabled:opacity-50">
            {isSubmitting ? 'Menyimpan...' : mode === 'edit' ? 'Simpan Perubahan' : 'Simpan Tagihan'}
          </button>
        </form>
      </div>
    </div>
  );
}
