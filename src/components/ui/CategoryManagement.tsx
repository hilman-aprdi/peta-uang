'use client';

import { useState } from 'react';
import {
  Archive, BadgePercent, Banknote, Baby, Bike, Briefcase, Bus, Car, CircleDollarSign, CircleParking,
  Cloud, CloudRain, Coffee, Coins, CreditCard, Dog, Dumbbell, Film, Fuel, Gamepad2, Gift,
  GlassWater, GraduationCap, HandCoins, Heart, Home, Landmark, Laptop, Lightbulb, Mail,
  MoreHorizontal, Music, Phone, Pizza, Plane, Plug, Receipt, Salad, Shirt, ShoppingBag,
  ShoppingCart, Smartphone, Stethoscope, Store, Ticket, TrainFront, TrendingUp, Tv,
  Pencil, Utensils, Wallet, Wifi, Wrench, X,
} from 'lucide-react';
import type { Category } from '@/lib/db/schema';
import { createCategory, deactivateCategory, updateCategory } from '@/lib/services/categoryService';

const categoryIconOptions = [
  { name: 'circle-dollar-sign', label: 'Umum', icon: CircleDollarSign },
  { name: 'utensils', label: 'Makanan', icon: Utensils },
  { name: 'coffee', label: 'Kopi', icon: Coffee },
  { name: 'car', label: 'Transportasi', icon: Car },
  { name: 'shopping-bag', label: 'Belanja', icon: ShoppingBag },
  { name: 'shirt', label: 'Pakaian', icon: Shirt },
  { name: 'receipt', label: 'Tagihan', icon: Receipt },
  { name: 'smartphone', label: 'Digital', icon: Smartphone },
  { name: 'home', label: 'Rumah', icon: Home },
  { name: 'film', label: 'Hiburan', icon: Film },
  { name: 'heart', label: 'Kesehatan', icon: Heart },
  { name: 'graduation-cap', label: 'Pendidikan', icon: GraduationCap },
  { name: 'dumbbell', label: 'Olahraga', icon: Dumbbell },
  { name: 'plane', label: 'Perjalanan', icon: Plane },
  { name: 'gift', label: 'Hadiah', icon: Gift },
  { name: 'briefcase', label: 'Pekerjaan', icon: Briefcase },
  { name: 'banknote', label: 'Uang', icon: Banknote },
  { name: 'badge-percent', label: 'Bonus', icon: BadgePercent },
  { name: 'trending-up', label: 'Investasi', icon: TrendingUp },
  { name: 'wallet', label: 'Dompet', icon: Wallet },
  { name: 'more-horizontal', label: 'Lainnya', icon: MoreHorizontal },
  { name: 'pizza', label: 'Pizza', icon: Pizza },
  { name: 'salad', label: 'Makanan sehat', icon: Salad },
  { name: 'bus', label: 'Bus', icon: Bus },
  { name: 'bike', label: 'Sepeda', icon: Bike },
  { name: 'train-front', label: 'Kereta', icon: TrainFront },
  { name: 'circle-parking', label: 'Parkir', icon: CircleParking },
  { name: 'fuel', label: 'Bensin', icon: Fuel },
  { name: 'shopping-cart', label: 'Belanja', icon: ShoppingCart },
  { name: 'store', label: 'Toko', icon: Store },
  { name: 'credit-card', label: 'Kartu', icon: CreditCard },
  { name: 'coins', label: 'Koin', icon: Coins },
  { name: 'hand-coins', label: 'Pendapatan', icon: HandCoins },
  { name: 'landmark', label: 'Bank', icon: Landmark },
  { name: 'baby', label: 'Anak', icon: Baby },
  { name: 'dog', label: 'Hewan', icon: Dog },
  { name: 'stethoscope', label: 'Medis', icon: Stethoscope },
  { name: 'glass-water', label: 'Minuman', icon: GlassWater },
  { name: 'plug', label: 'Listrik', icon: Plug },
  { name: 'lightbulb', label: 'Energi', icon: Lightbulb },
  { name: 'wifi', label: 'Internet', icon: Wifi },
  { name: 'phone', label: 'Telepon', icon: Phone },
  { name: 'laptop', label: 'Perangkat', icon: Laptop },
  { name: 'mail', label: 'Surat', icon: Mail },
  { name: 'cloud', label: 'Cloud', icon: Cloud },
  { name: 'cloud-rain', label: 'Cuaca', icon: CloudRain },
  { name: 'music', label: 'Musik', icon: Music },
  { name: 'gamepad-2', label: 'Game', icon: Gamepad2 },
  { name: 'ticket', label: 'Tiket', icon: Ticket },
  { name: 'tv', label: 'TV', icon: Tv },
  { name: 'wrench', label: 'Perbaikan', icon: Wrench },
] as const;

export function CategoryIcon({ name, size = 18 }: { name?: string; size?: number }) {
  const option = categoryIconOptions.find((item) => item.name === name) ?? categoryIconOptions[0];
  const Icon = option.icon;
  return <Icon size={size} aria-hidden="true" />;
}

interface CategoryManagementProps { categories: Category[]; }

export function CategoryManagement({ categories }: CategoryManagementProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState<Category['type']>('EXPENSE');
  const [icon, setIcon] = useState('circle-dollar-sign');
  const [editingId, setEditingId] = useState<string>();
  const [error, setError] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isIconPickerOpen, setIsIconPickerOpen] = useState(false);

  const resetForm = () => { setName(''); setType('EXPENSE'); setIcon('circle-dollar-sign'); setEditingId(undefined); setIsIconPickerOpen(false); };
  const closeModal = () => { setIsOpen(false); resetForm(); setError(''); };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      setError('');
      if (editingId) await updateCategory(editingId, { name, type, icon });
      else await createCategory({ name, type, icon });
      closeModal();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Gagal menyimpan kategori');
    }
  };

  const handleDeactivate = async (category: Category) => {
    if (!window.confirm(`Nonaktifkan kategori "${category.name}"?`)) return;
    try { setError(''); await deactivateCategory(category.id); }
    catch (deactivateError) { setError(deactivateError instanceof Error ? deactivateError.message : 'Gagal menonaktifkan kategori'); }
  };

  const activeCategories = categories.filter((category) => category.is_active !== false);

  return (
    <>
      <button type="button" onClick={() => setIsOpen(true)} className="w-full flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 text-left hover:border-emerald-400 transition">
        <span><span className="block font-semibold">Kelola Kategori</span><span className="block text-xs text-slate-500 mt-1">Atur kategori transaksi dan ikon.</span></span>
        <span className="text-emerald-600 text-sm font-semibold">Buka</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" role="dialog" aria-modal="true" aria-labelledby="category-modal-title">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-5">
            <div className="flex justify-between items-center">
              <div><h3 id="category-modal-title" className="font-semibold">Kelola Kategori</h3><p className="text-xs text-slate-500 mt-1">Kategori default dan custom dapat diedit atau dinonaktifkan.</p></div>
              <button type="button" onClick={closeModal} className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200" aria-label="Tutup modal"><X size={20} /></button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
              <div className="grid grid-cols-1 md:grid-cols-[1fr_160px] gap-2">
                <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Nama kategori" required className="text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 outline-none" />
                <select value={type} onChange={(event) => setType(event.target.value as Category['type'])} className="text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 outline-none"><option value="EXPENSE">Expense</option><option value="INCOME">Income</option></select>
              </div>
              <div>
                <button type="button" onClick={() => setIsIconPickerOpen((open) => !open)} className="w-full flex items-center justify-between px-3 py-2.5 text-sm border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-300 hover:border-emerald-400 transition">
                  <span>{isIconPickerOpen ? 'Tutup pilihan ikon' : 'Pilih ikon'}</span>
                  <span className="text-xs text-slate-400">{icon ? 'Ikon terpilih' : 'Opsional'}</span>
                </button>
                {isIconPickerOpen && <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 mt-2">
                  {categoryIconOptions.map((option) => { const Icon = option.icon; const selected = icon === option.name; return <button key={option.name} type="button" onClick={() => { setIcon(option.name); setIsIconPickerOpen(false); }} title={option.label} aria-label={`Pilih ikon ${option.label}`} className={`flex items-center justify-center p-3 rounded-xl border transition ${selected ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:border-emerald-300'}`}><Icon size={20} /></button>; })}
                </div>}
              </div>
              <div className="flex gap-2 justify-end">{editingId && <button type="button" onClick={resetForm} className="px-4 py-2 text-sm text-slate-500 hover:underline">Batalkan edit</button>}<button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-semibold">{editingId ? 'Simpan' : 'Tambah'}</button></div>
            </form>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-100 dark:border-slate-800 pt-4">
              {(['EXPENSE', 'INCOME'] as const).map((categoryType) => <div key={categoryType} className="space-y-2"><h4 className="text-xs font-semibold text-slate-500">{categoryType === 'EXPENSE' ? 'Expense' : 'Income'}</h4>{activeCategories.filter((category) => category.type === categoryType).map((category) => <div key={category.id} className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 py-2"><span className="flex items-center gap-2 text-sm"><span className="text-emerald-600"><CategoryIcon name={category.icon} /></span>{category.name}</span><div className="flex gap-3"><button type="button" onClick={() => { setEditingId(category.id); setName(category.name); setType(category.type); setIcon(category.icon ?? 'circle-dollar-sign'); }} title="Edit kategori" aria-label={`Edit kategori ${category.name}`} className="text-emerald-600 hover:text-emerald-700"><Pencil size={16} /></button><button type="button" onClick={() => handleDeactivate(category)} title="Nonaktifkan kategori" aria-label={`Nonaktifkan kategori ${category.name}`} className="text-red-600 hover:text-red-700"><Archive size={16} /></button></div></div>)}</div>)}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
