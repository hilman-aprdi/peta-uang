'use client';

import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import type { Bill } from '@/lib/db/schema';
import { db } from '@/lib/db/schema';
import { createBill, deleteBill, setBillPaid, updateBill } from '@/lib/services/billService';
import { BillModal } from '@/components/ui/BillModal';
import { PayBillModal } from '@/components/ui/PayBillModal';
import { CheckCircle2, Circle, Pencil, Trash2 } from 'lucide-react';

export function BillManagement() {
  const bills = useLiveQuery(() => db.bills.orderBy('due_date').toArray(), []);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [billToPay, setBillToPay] = useState<Bill>();
  const [mode, setMode] = useState<'create' | 'edit'>('create');
  const [selectedBill, setSelectedBill] = useState<Bill>();
  const [modalKey, setModalKey] = useState(0);
  const [error, setError] = useState('');

  const openCreate = () => {
    setMode('create');
    setSelectedBill(undefined);
    setModalKey((key) => key + 1);
    setIsModalOpen(true);
  };

  const openEdit = (bill: Bill) => {
    setMode('edit');
    setSelectedBill(bill);
    setModalKey((key) => key + 1);
    setIsModalOpen(true);
  };

  const handleSubmit = async (data: { title: string; amount: number; due_date: string }) => {
    if (mode === 'edit' && selectedBill) await updateBill(selectedBill.id, data);
    else await createBill(data);
  };

  const handleDelete = async (bill: Bill) => {
    if (!window.confirm(`Hapus tagihan "${bill.title}"?`)) return;
    try {
      setError('');
      await deleteBill(bill.id);
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Gagal menghapus tagihan');
    }
  };

  const handleTogglePaid = async (bill: Bill) => {
    try {
      setError('');
      if (!bill.is_paid) {
        setBillToPay(bill);
        setIsPayModalOpen(true);
      } else {
        if (!window.confirm(`Kembalikan status tagihan "${bill.title}" menjadi Belum Lunas? Transaksi pengeluaran terkait akan otomatis dihapus.`)) {
          return;
        }
        await setBillPaid(bill.id, false);
      }
    } catch (toggleError) {
      setError(toggleError instanceof Error ? toggleError.message : 'Gagal mengubah status tagihan');
    }
  };

  const handleConfirmPay = async (paymentDetails: { account_id: string; payment_date: string; category_id?: string }) => {
    if (!billToPay) return;
    await setBillPaid(billToPay.id, true, paymentDetails);
  };

  return (
    <section className="space-y-4">
      <div>
        <div>
          <h2 className="text-xl font-bold tracking-tight">Tagihan</h2>
          <p className="text-sm text-slate-500 mt-1">Tagihan unpaid mengurangi Safe-to-Spend.</p>
        </div>
      </div>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      {!bills && <p className="text-sm text-slate-500">Memuat tagihan...</p>}
      {bills && bills.length === 0 && <p className="text-sm text-slate-500 bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800">Belum ada tagihan.</p>}

      <div className="space-y-3">
        {bills?.map((bill) => (
          <div key={bill.id} className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex justify-between gap-4 items-center">
            <div>
              <p className="font-semibold text-sm">{bill.title}</p>
              <p className="text-xs text-slate-400">Jatuh tempo: {new Date(bill.due_date).toLocaleDateString('id-ID')}</p>
              <p className={`mt-1 ${bill.is_paid ? 'text-emerald-600' : 'text-yellow-600 dark:text-yellow-400'}`} title={bill.is_paid ? 'Paid' : 'Unpaid'} aria-label={`Status: ${bill.is_paid ? 'Paid' : 'Unpaid'}`}>
                {bill.is_paid
                  ? <CheckCircle2 size={16} aria-hidden="true" />
                  : <Circle size={16} aria-hidden="true" />}
              </p>
            </div>
            <div className="text-right">
              <p className="font-mono font-bold">Rp {bill.amount.toLocaleString('id-ID')}</p>
              <div className="mt-2 flex gap-3 justify-end">
                <button type="button" onClick={() => handleTogglePaid(bill)} title={bill.is_paid ? 'Tandai unpaid' : 'Tandai paid'} aria-label={`${bill.is_paid ? 'Tandai unpaid' : 'Tandai paid'}: ${bill.title}`} className="text-emerald-600 hover:text-emerald-700">
                  {bill.is_paid ? <Circle size={16} /> : <CheckCircle2 size={16} />}
                </button>
                <button type="button" onClick={() => openEdit(bill)} title="Edit tagihan" aria-label={`Edit tagihan ${bill.title}`} className="text-slate-600 hover:text-slate-800"><Pencil size={16} /></button>
                <button type="button" onClick={() => handleDelete(bill)} title="Hapus tagihan" aria-label={`Hapus tagihan ${bill.title}`} className="text-red-600 hover:text-red-700"><Trash2 size={16} /></button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button type="button" onClick={openCreate} className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition">
        + Tambah Tagihan
      </button>

      <BillModal
        key={modalKey}
        isOpen={isModalOpen}
        mode={mode}
        bill={selectedBill}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
      />

      <PayBillModal
        isOpen={isPayModalOpen}
        bill={billToPay}
        onClose={() => setIsPayModalOpen(false)}
        onConfirm={handleConfirmPay}
      />
    </section>
  );
}
