'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Account } from '@/lib/db/schema';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'create' | 'edit';
  account?: Account;
  currentBalance?: number;
  onSubmitAccount: (data: {
    name: string;
    type: Account['type'];
    balance: number;
  }) => Promise<void>;
}

export function AccountModal({ isOpen, onClose, mode, account, currentBalance, onSubmitAccount }: AccountModalProps) {
  const [name, setName] = useState(account?.name ?? '');
  const [type, setType] = useState<Account['type']>(account?.type ?? 'BANK');
  const [balance, setBalance] = useState(
    mode === 'edit'
      ? (currentBalance !== undefined ? String(currentBalance) : (account ? String(account.initial_balance) : ''))
      : (account ? String(account.initial_balance) : '')
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || isSubmitting) {
      setError('Nama akun wajib diisi');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      const balanceNum = Number(balance) || 0;

      // Tunggu hingga simpan di DB & setIsAccountModalOpen(false) selesai
      await onSubmitAccount({
        name: name.trim(),
        type,
        balance: balanceNum,
      });

      onClose();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Gagal menyimpan akun');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-6">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 animate-in zoom-in-95 duration-150">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-bold">{mode === 'edit' ? 'Edit Akun' : 'Tambah Akun Baru'}</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
          <div>
            <label className="text-xs font-medium text-slate-500">Nama Akun / Dompet</label>
            <input
              type="text"
              required
              placeholder="Misal: Bank BCA, Gopay, Kas Saku"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 mt-1 focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-500">Tipe Akun</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as Account['type'])}
              className="w-full text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 mt-1 focus:ring-2 focus:ring-emerald-500 outline-none"
            >
              <option value="BANK">BANK</option>
              <option value="EWALLET">E-WALLET</option>
              <option value="CASH">KAS / UANG TUNAI</option>
              <option value="INVESTMENT">INVESTASI</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-500">
              {mode === 'edit' ? 'Saldo Saat Ini (Rp)' : 'Saldo Awal (Rp)'}
            </label>
            <input
              type="number"
              min="0"
              step="1"
              inputMode="numeric"
              placeholder="0"
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
              className="w-full text-xl font-mono font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 mt-1 focus:ring-2 focus:ring-emerald-500 outline-none"
            />
            {mode === 'edit' && (
              <p className="text-[11px] text-slate-500 mt-1">
                Perubahan saldo akan otomatis dicatat sebagai transaksi penyesuaian (&quot;Adjust Balance&quot;).
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-sm transition shadow-sm mt-2 disabled:opacity-50"
          >
            {isSubmitting ? 'Menyimpan...' : mode === 'edit' ? 'Simpan Perubahan' : 'Simpan Akun'}
          </button>
        </form>
      </div>
    </div>
  );
}

