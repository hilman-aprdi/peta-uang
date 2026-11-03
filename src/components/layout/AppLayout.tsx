'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LayoutDashboard, ArrowLeftRight, Wallet, Receipt, Target, Heart, Download, Plus } from 'lucide-react';
import { PWAInstallPrompt } from '@/components/pwa/PWAInstallPrompt';

interface AppLayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenAddModal: () => void;
  showAddTransactionButton?: boolean;
}

export function AppLayout({ children, activeTab, setActiveTab, onOpenAddModal, showAddTransactionButton = true }: AppLayoutProps) {
  const [isInstallPromptOpen, setIsInstallPromptOpen] = useState(false);
  const navItems = [
    { id: 'dashboard', href: '/', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'transactions', href: '/transactions', label: 'Transaksi', icon: ArrowLeftRight },
    { id: 'accounts', href: '/accounts', label: 'Dompet', icon: Wallet },
    { id: 'bills', href: '/bills', label: 'Tagihan', icon: Receipt },
    { id: 'goals', href: '/goals', label: 'Target', icon: Target },
  ];
  const router = useRouter();

  const navigateTo = (id: string, href: string) => {
    setActiveTab(id);
    router.push(href);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 flex flex-col md:flex-row font-sans">
      {/* Sidebar - Tablet: icon-only, Desktop: full */}
      <aside className="hidden md:flex flex-col md:w-20 lg:w-72 fixed inset-y-0 left-0 z-40 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 md:p-4 lg:p-6 space-y-6 lg:space-y-8 overflow-y-auto">
        <div className="flex items-center justify-center lg:justify-start">
          <div className="lg:hidden w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-lg shrink-0">P</div>
          <div className="hidden lg:block">
            <h1 className="text-xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">PetaUang</h1>
            <p className="text-xs text-slate-500 mt-1">Local-First PWA</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => navigateTo(item.id, item.href)}
                className={`w-full flex items-center justify-center lg:justify-start gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${isActive
                  ? 'bg-slate-900 text-white dark:bg-slate-50 dark:text-slate-900'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
              >
                <Icon size={18} />
                <span className="hidden lg:inline">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {showAddTransactionButton && (
          <button
            onClick={onOpenAddModal}
            aria-label="Buka modal transaksi baru"
            className="w-11 h-11 lg:w-full lg:h-auto flex items-center justify-center gap-2 lg:px-4 lg:py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl lg:rounded-lg font-medium text-sm transition shadow-sm"
          >
            <Plus size={18} />
            <span className="hidden lg:inline">Transaksi Baru</span>
          </button>
        )}
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 pb-24 md:pb-8 md:ml-28 lg:ml-80 flex flex-col">
        <div className="mx-auto w-full max-w-6xl px-5 pt-6 sm:px-6 md:px-8 md:pt-8 flex-1 flex flex-col">
          {children}
        <footer className="mt-auto pt-10 pb-2 flex flex-col items-center gap-2 text-xs text-slate-500">
          <p className="inline-flex items-center gap-1.5">
            Made with <Heart size={14} className="fill-rose-500 text-rose-500" aria-label="love" />
          </p>
          <a
            href="https://github.com/hilman-aprdi/peta-uang"
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center gap-2 hover:text-slate-800 dark:hover:text-slate-200 transition"
            aria-label="PetaUang Source Code di GitHub"
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
              <path d="M12 .9a11.1 11.1 0 0 0-3.51 21.63c.56.1.76-.24.76-.54v-2.1c-3.1.67-3.76-1.32-3.76-1.32-.5-1.28-1.24-1.62-1.24-1.62-1.01-.69.08-.68.08-.68 1.12.08 1.71 1.15 1.71 1.15.99 1.7 2.6 1.21 3.23.92.1-.72.39-1.21.7-1.49-2.48-.28-5.09-1.24-5.09-5.52 0-1.22.44-2.21 1.15-2.99-.12-.28-.5-1.42.11-2.95 0 0 .94-.3 3.05 1.14a10.6 10.6 0 0 1 5.55 0c2.11-1.44 3.04-1.14 3.04-1.14.61 1.53.23 2.67.12 2.95.71.78 1.14 1.77 1.14 2.99 0 4.29-2.61 5.23-5.1 5.51.4.35.75 1.03.75 2.08v3.07c0 .3.2.65.77.54A11.1 11.1 0 0 0 12 .9Z" />
            </svg>
            <span>PetaUang Source Code</span>
          </a>
          <button
            type="button"
            onClick={() => setIsInstallPromptOpen(true)}
            className="cursor-pointer inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 hover:text-emerald-700 transition"
          >
            <Download size={14} aria-hidden="true" />
            <span>Install PetaUang</span>
          </button>
        </footer>
        </div>
      </main>

      {/* Floating Action Button (FAB) - Mobile Only */}
      {showAddTransactionButton && (
        <button
          onClick={onOpenAddModal}
          className="md:hidden fixed right-4 bottom-20 z-40 w-14 h-14 bg-emerald-600 text-white rounded-full flex items-center justify-center shadow-lg active:scale-95 transition"
          aria-label="Tambah Transaksi"
        >
          <span className="text-2xl font-light">+</span>
        </button>
      )}

      {/* Bottom Navigation Bar - Mobile Only */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex justify-around items-center z-30 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => navigateTo(item.id, item.href)}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition ${isActive ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-slate-400'
                }`}
            >
              <Icon size={20} />
              <span className="text-[10px] tracking-tight">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <PWAInstallPrompt
        isOpen={isInstallPromptOpen}
        onClose={() => setIsInstallPromptOpen(false)}
      />
    </div>
  );
}








