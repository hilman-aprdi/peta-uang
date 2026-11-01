'use client';

import { useState } from 'react';
import type { Category } from '@/lib/db/schema';
import { createCategory, deactivateCategory, updateCategory } from '@/lib/services/categoryService';

interface CategoryManagementProps {
  categories: Category[];
}

export function CategoryManagement({ categories }: CategoryManagementProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState<Category['type']>('EXPENSE');
  const [editingId, setEditingId] = useState<string>();
  const [error, setError] = useState('');

  const resetForm = () => {
    setName('');
    setType('EXPENSE');
    setEditingId(undefined);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      setError('');
      if (editingId) await updateCategory(editingId, { name, type });
      else await createCategory({ name, type });
      resetForm();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Gagal menyimpan kategori');
    }
  };

  const handleDeactivate = async (category: Category) => {
    if (!window.confirm(`Nonaktifkan kategori "${category.name}"?`)) return;
    try {
      setError('');
      await deactivateCategory(category.id);
    } catch (deactivateError) {
      setError(deactivateError instanceof Error ? deactivateError.message : 'Gagal menonaktifkan kategori');
    }
  };

  const activeCategories = categories.filter((category) => category.is_active !== false);

  return (
    <section className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
      <div>
        <h3 className="font-semibold">Kelola Kategori</h3>
        <p className="text-xs text-slate-500 mt-1">Kategori default tidak dapat diubah atau dinonaktifkan.</p>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-[1fr_160px_auto] gap-2">
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Nama kategori"
          required
          className="text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 outline-none"
        />
        <select
          value={type}
          onChange={(event) => setType(event.target.value as Category['type'])}
          className="text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 outline-none"
        >
          <option value="EXPENSE">Expense</option>
          <option value="INCOME">Income</option>
        </select>
        <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-semibold">
          {editingId ? 'Simpan' : 'Tambah'}
        </button>
      </form>

      {editingId && <button type="button" onClick={resetForm} className="text-xs text-slate-500 hover:underline">Batalkan edit</button>}
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {(['EXPENSE', 'INCOME'] as const).map((categoryType) => (
          <div key={categoryType} className="space-y-2">
            <h4 className="text-xs font-semibold text-slate-500">{categoryType === 'EXPENSE' ? 'Expense' : 'Income'}</h4>
            {activeCategories.filter((category) => category.type === categoryType).map((category) => (
              <div key={category.id} className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 py-2">
                <span className="text-sm">{category.name}{category.is_system_default && <span className="text-xs text-slate-400 ml-2">Default</span>}</span>
                {!category.is_system_default && (
                  <div className="flex gap-2 text-xs">
                    <button type="button" onClick={() => { setEditingId(category.id); setName(category.name); setType(category.type); }} className="text-emerald-600 hover:underline">Edit</button>
                    <button type="button" onClick={() => handleDeactivate(category)} className="text-red-600 hover:underline">Nonaktifkan</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}
