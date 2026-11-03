'use client';

import { useState, useEffect, type FormEvent } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Bill } from '@/lib/db/schema';

interface PayBillModalProps {
  isOpen: boolean;
  bill?: Bill;
  onClose: () => void;
  onConfirm: (data: { account_id: string; payment_date: string; category_id?: string }) => Promise<void>;
}

export function PayBillModal({ isOpen, bill, onClose, onConfirm }: PayBillModalProps) {
  const accounts = useLiveQuery(() => db.accounts.filter((acc) => acc.is_active).toArray(), []);
  const categories = useLiveQuery(
    () => db.categories.filter((cat) => cat.type === 'EXPENSE' && cat.is_active !== false).toArray(),
    []
  );

  const [accountId, setAccountId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Set default account and category
  useEffect(() => {
    if (accounts && accounts.length > 0 && !accountId) {
      setAccountId(accounts[0].id);
    }
  }, [accounts, accountId]);

  useEffect(() => {
    if (categories && categories.length > 0 && !categoryId) {
      const defaultCat = categories.find((c) => c.name.toLowerCase().includes('tagihan')) ?? categories[0];
      if (defaultCat) setCategoryId(defaultCat.id);
    }
  }, [categories, categoryId]);

  if (!isOpen || !bill) return null;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!accountId) {
      setError('Pilih akun pembayaran terlebih dahulu');
      return;
    }

    try {
      setError('');
      setIsSubmitting(true);
      await onConfirm({
        account_id: accountId,
        payment_date: new Date(`${paymentDate}T12:00:00`).toISOString(),
        category_id: categoryId || undefined,
      });
      onClose();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Gagal melunasi tagihan');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-6">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-bold">Lunasi Tagihan</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X size={20} />
          </button>
        </div>

        <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-1">
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Tagihan yang akan dibayar:</p>
          <div className="flex justify-between items-center">
            <span className="font-semibold text-sm">{bill.title}</span>
            <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
              Rp {bill.amount.toLocaleString('id-ID')}
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            Saldo akun yang dipilih akan langsung dipotong dan dicatat sebagai transaksi pengeluaran.
          </p>
        </div>

        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

        {(!accounts || accounts.length === 0) ? (
          <div className="space-y-3 py-2">
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 text-sm">
              <AlertCircle size={18} />
              <span>Belum ada akun dompet aktif.</span>
            </div>
            <p className="text-xs text-slate-500">
              Silakan buat akun dompet/bank terlebih dahulu di menu <strong>Akun</strong> sebelum melunasi tagihan.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 px-4 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-sm font-semibold"
            >
              Tutup
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-slate-500">Bayar Pakai Akun</label>
              <select
                required
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 mt-1 focus:ring-2 focus:ring-emerald-500 outline-none"
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} ({acc.type})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-500">Kategori Pengeluaran (Opsional)</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 mt-1 focus:ring-2 focus:ring-emerald-500 outline-none"
              >
                <option value="">Tanpa Kategori (Uncategorized)</option>
                {categories?.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-500">Tanggal Pembayaran</label>
              <input
                type="date"
                required
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 mt-1 focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-sm transition shadow-sm mt-2 disabled:opacity-50"
            >
              {isSubmitting ? 'Memproses...' : 'Konfirmasi Pembayaran'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
