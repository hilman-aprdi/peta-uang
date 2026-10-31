'use client';

import React from 'react';
import { LayoutDashboard, ArrowLeftRight, Wallet, Download } from 'lucide-react';

interface AppLayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenAddModal: () => void;
}

export function AppLayout({ children, activeTab, setActiveTab, onOpenAddModal }: AppLayoutProps) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'transactions', label: 'Transaksi', icon: ArrowLeftRight },
    { id: 'accounts', label: 'Dompet', icon: Wallet },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 flex flex-col md:flex-row font-sans">
      {/* Sidebar - Desktop Only */}
      <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 p-6 space-y-8">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">PetaUang</h1>
          <p className="text-xs text-slate-500 mt-1">Local-First PWA</p>
        </div>

        <nav className="flex-1 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${isActive
                    ? 'bg-slate-900 text-white dark:bg-slate-50 dark:text-slate-900'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
              >
                <Icon size={18} />
                {item.label}
              </button>
            );
          })}
        </nav>

        <button
          onClick={onOpenAddModal}
          className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium text-sm transition shadow-sm"
        >
          + Transaksi Baru
        </button>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 pb-24 md:pb-8 p-4 md:p-8 max-w-4xl mx-auto w-full">
        {children}
      </main>

      {/* Floating Action Button (FAB) - Mobile Only */}
      <button
        onClick={onOpenAddModal}
        className="md:hidden fixed right-4 bottom-20 z-40 w-14 h-14 bg-emerald-600 text-white rounded-full flex items-center justify-center shadow-lg active:scale-95 transition"
        aria-label="Tambah Transaksi"
      >
        <span className="text-2xl font-light">+</span>
      </button>

      {/* Bottom Navigation Bar - Mobile Only */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex justify-around items-center z-30 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition ${isActive ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-slate-400'
                }`}
            >
              <Icon size={20} />
              <span className="text-[10px] tracking-tight">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}








