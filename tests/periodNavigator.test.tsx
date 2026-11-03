import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { ALL_TIME_PERIOD, PeriodNavigator } from '@/components/ui/PeriodNavigator';

const renderNavigator = (selectedPeriod: string, allowAllTime = false) =>
  renderToStaticMarkup(
    React.createElement(PeriodNavigator, {
      selectedPeriod,
      onPeriodChange: () => undefined,
      label: 'Periode Transaksi',
      allowAllTime,
    })
  );

describe('PeriodNavigator — mode Semua Waktu', () => {
  it('menampilkan label Semua Waktu dan menonaktifkan prev/next serta month picker', () => {
    const markup = renderNavigator(ALL_TIME_PERIOD, true);

    expect(markup).toContain('Semua Waktu');
    expect(markup).toContain('aria-pressed="true"');
    expect(markup).toContain('aria-label="Kembali ke bulan ini"');
    expect(markup.match(/ disabled=""/g)?.length).toBe(3); // prev, next, month input
  });

  it('tidak menonaktifkan navigasi saat masih memakai periode bulan', () => {
    const markup = renderNavigator('2026-11', true);

    expect(markup).toContain('Semua Waktu');
    expect(markup).toContain('November 2026');
    expect(markup).not.toMatch(/ disabled=""/);
  });

  it('tidak menampilkan opsi Semua Waktu bila allowAllTime tidak diaktifkan', () => {
    const markup = renderNavigator('2026-11');

    expect(markup).not.toContain('Semua Waktu');
  });
});
