'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Account, Category } from '@/lib/db/schema';

export interface TransactionFormData {
  title: string;
  type: 'INCOME' | 'EXPENSE' | 'TRANSFER';
  amount: number;
  account_id: string;
  destination_account_id?: string;
  category_id?: string;
  transaction_date: string;
}

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: Account[];
  categories: Category[];
  onSubmitTx: (data: TransactionFormData) => Promise<void>;
}

export function BottomSheet({ isOpen, onClose, accounts, categories, onSubmitTx }: BottomSheetProps) {
  const [type, setType] = useState<'EXPENSE' | 'INCOME' | 'TRANSFER'>('EXPENSE');
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [accountId, setAccountId] = useState(accounts[0]?.id || '');
  const [destAccountId, setDestAccountId] = useState(accounts[1]?.id || '');
  const [categoryId, setCategoryId] = useState('');

  if (!isOpen) return null;

  const filteredCategories = categories.filter((c) => c.type === type);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = parseInt(amount.replace(/\D/g, ''), 10);
    if (!numericAmount || numericAmount <= 0) return;

    await onSubmitTx({
      title: type === 'TRANSFER' ? 'Transfer Antar Akun' : title,
      type,
      amount: numericAmount,
      account_id: accountId || accounts[0]?.id,
      destination_account_id: type === 'TRANSFER' ? destAccountId : undefined,
      category_id: type !== 'TRANSFER' ? categoryId || filteredCategories[0]?.id : undefined,
      transaction_date: new Date().toISOString(),
    });

    // Reset Form
    setTitle('');
    setAmount('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm p-0 md:p-4 transition-opacity">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-t-2xl md:rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-5 animate-in slide-in-from-bottom duration-200">

        {/* Header Modal */}
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-bold">Catat Transaksi</h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X size={20} />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="grid grid-cols-3 gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold">
          {(['EXPENSE', 'INCOME', 'TRANSFER'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={`py-2 rounded-lg transition ${type === t
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-50 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
            >
              {t === 'EXPENSE' ? 'Pengeluaran' : t === 'INCOME' ? 'Pemasukan' : 'Transfer'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nominal Input */}
          <div>
            <label className="text-xs font-medium text-slate-500">Nominal (Rp)</label>
            <input
              type="number"
              required
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
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>{acc.name}</option>
                ))}
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
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>{acc.name}</option>
                  ))}
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
                {filteredCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-sm transition shadow-sm mt-2"
          >
            Simpan Transaksi
          </button>
        </form>
      </div>
    </div>
  );
}
