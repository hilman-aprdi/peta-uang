'use client';

import React from 'react';
import { ChevronLeft, ChevronRight, Infinity as InfinityIcon, RotateCcw } from 'lucide-react';

export const ALL_TIME_PERIOD = 'ALL_TIME';

export function isAllTimePeriod(period: string): boolean {
  return period === ALL_TIME_PERIOD;
}

interface PeriodNavigatorProps {
  selectedPeriod: string; // Format: YYYY-MM atau ALL_TIME
  onPeriodChange: (newPeriod: string) => void;
  label?: string;
  className?: string;
  allowAllTime?: boolean;
}

export function getCurrentMonthPeriod(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export function formatMonthPeriod(period: string): string {
  if (!period || period.length < 7) return period;
  return new Date(`${period}-01T00:00:00`).toLocaleDateString('id-ID', {
    month: 'long',
    year: 'numeric',
  });
}

export function formatShortMonthPeriod(period: string): string {
  if (!period || period.length < 7) return period;
  return new Date(`${period}-01T00:00:00`).toLocaleDateString('id-ID', {
    month: 'short',
    year: 'numeric',
  });
}

export function PeriodNavigator({
  selectedPeriod,
  onPeriodChange,
  label,
  className = '',
  allowAllTime = false,
}: PeriodNavigatorProps) {
  const currentPeriod = getCurrentMonthPeriod();
  const isAllTime = isAllTimePeriod(selectedPeriod);
  const isCurrentMonth = selectedPeriod === currentPeriod;

  const navigateMonth = (direction: -1 | 1) => {
    if (isAllTime) return;

    const [yearStr, monthStr] = selectedPeriod.split('-');
    const year = Number(yearStr);
    const month = Number(monthStr) - 1; // 0-indexed

    const nextDate = new Date(year, month + direction, 1);
    const nextY = nextDate.getFullYear();
    const nextM = String(nextDate.getMonth() + 1).padStart(2, '0');
    onPeriodChange(`${nextY}-${nextM}`);
  };

  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0 bg-slate-900 border border-slate-800 rounded-xl p-3.5 ${className}`}
    >
      {/* Label Kiri + toggle Semua Waktu */}
      <div className="flex items-center justify-between sm:justify-start gap-2">
        {label && (
          <span className="text-[11px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">
            {label}
          </span>
        )}

        {allowAllTime && (
          <button
            type="button"
            onClick={() => onPeriodChange(isAllTime ? currentPeriod : ALL_TIME_PERIOD)}
            aria-pressed={isAllTime}
            aria-label={isAllTime ? 'Matikan mode semua waktu' : 'Tampilkan semua waktu'}
            title={isAllTime ? 'Matikan mode semua waktu' : 'Tampilkan semua waktu'}
            className={`flex h-8 shrink-0 items-center justify-center gap-1 rounded-lg border px-2.5 text-[11px] font-semibold transition ${
              isAllTime
                ? 'border-emerald-600 bg-emerald-500/10 text-emerald-400'
                : 'border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <InfinityIcon size={13} />
            <span>Semua Waktu</span>
          </button>
        )}
      </div>

      {/* Kontrol Navigasi Bulan */}
      <div className="bg-slate-800/50 sm:bg-transparent p-1 sm:p-0 rounded-lg border border-slate-700/50 sm:border-none flex items-center justify-between sm:justify-end gap-1.5">
        {/* Tombol Bulan Sebelumnya */}
        <button
          type="button"
          onClick={() => navigateMonth(-1)}
          disabled={isAllTime}
          aria-label="Bulan sebelumnya"
          title="Bulan sebelumnya"
          className="flex w-9 h-9 sm:w-8 sm:h-8 shrink-0 items-center justify-center bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 rounded-lg border border-slate-700 text-sm transition disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-slate-800 disabled:active:scale-100"
        >
          <ChevronLeft size={16} />
        </button>

        {/* Input Month Picker dengan Teks Indikator Nama Bulan */}
        <div
          className={`relative flex flex-1 sm:flex-initial items-center justify-center px-4 py-2 sm:py-1.5 bg-slate-800 text-slate-100 text-center font-bold text-xs sm:text-sm rounded-lg border border-slate-700 transition ${
            isAllTime ? 'cursor-default' : 'hover:bg-slate-700'
          }`}
        >
          <span className="whitespace-nowrap">
            {isAllTime ? 'Semua Waktu' : formatMonthPeriod(selectedPeriod)}
          </span>
          <input
            type="month"
            aria-label="Pilih bulan dan tahun"
            value={isAllTime ? '' : selectedPeriod}
            disabled={isAllTime}
            onChange={(e) => {
              if (e.target.value) onPeriodChange(e.target.value);
            }}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full disabled:cursor-default"
          />
        </div>

        {/* Tombol Bulan Berikutnya */}
        <button
          type="button"
          onClick={() => navigateMonth(1)}
          disabled={isAllTime}
          aria-label="Bulan berikutnya"
          title="Bulan berikutnya"
          className="flex w-9 h-9 sm:w-8 sm:h-8 shrink-0 items-center justify-center bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 rounded-lg border border-slate-700 text-sm transition disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-slate-800 disabled:active:scale-100"
        >
          <ChevronRight size={16} />
        </button>

        {/* Tombol Shortcut Kembali ke Bulan Ini (tampil saat bukan bulan ini / mode All Time) */}
        {!isCurrentMonth && (
          <button
            type="button"
            onClick={() => onPeriodChange(currentPeriod)}
            aria-label="Kembali ke bulan ini"
            title="Kembali ke bulan ini"
            className="flex w-9 h-9 sm:w-auto sm:h-8 shrink-0 items-center justify-center gap-1 bg-slate-800 hover:bg-slate-700 active:scale-95 text-emerald-300 rounded-lg border border-slate-700 text-[11px] font-semibold transition sm:px-2.5"
          >
            <RotateCcw size={13} />
            <span className="hidden sm:inline">Bulan Ini</span>
          </button>
        )}
      </div>
    </div>
  );
}
