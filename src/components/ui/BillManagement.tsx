'use client';

import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import type { Bill } from '@/lib/db/schema';
import { db } from '@/lib/db/schema';
import { createBill, deleteBill, setBillPaid, updateBill } from '@/lib/services/billService';
import { BillModal } from '@/components/ui/BillModal';

export function BillManagement() {
  const bills = useLiveQuery(() => db.bills.orderBy('due_date').toArray(), []);
  const [isModalOpen, setIsModalOpen] = useState(false);
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
      await setBillPaid(bill.id, !bill.is_paid);
    } catch (toggleError) {
      setError(toggleError instanceof Error ? toggleError.message : 'Gagal mengubah status tagihan');
    }
  };

  return (
    <section className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Bill Management</h2>
          <p className="text-sm text-slate-500 mt-1">Tagihan unpaid mengurangi Safe-to-Spend.</p>
        </div>
        <button type="button" onClick={openCreate} className="px-3 py-2 bg-emerald-600 text-white rounded-lg text-xs font-semibold">+ Tambah Tagihan</button>
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
              <p className={`text-xs mt-1 font-medium ${bill.is_paid ? 'text-emerald-600' : 'text-amber-600'}`}>{bill.is_paid ? 'Paid' : 'Unpaid'}</p>
            </div>
            <div className="text-right">
              <p className="font-mono font-bold">Rp {bill.amount.toLocaleString('id-ID')}</p>
              <div className="mt-2 flex gap-2 justify-end text-xs">
                <button type="button" onClick={() => handleTogglePaid(bill)} className="text-emerald-600 hover:underline">{bill.is_paid ? 'Jadikan unpaid' : 'Tandai paid'}</button>
                <button type="button" onClick={() => openEdit(bill)} className="text-slate-600 hover:underline">Edit</button>
                <button type="button" onClick={() => handleDelete(bill)} className="text-red-600 hover:underline">Hapus</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <BillModal
        key={modalKey}
        isOpen={isModalOpen}
        mode={mode}
        bill={selectedBill}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
      />
    </section>
  );
}
