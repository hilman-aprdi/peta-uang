import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { InsightUrgency, PeriodInsightResult } from '@/lib/insight/insightTypes';
import { FinancialInsightCard } from '@/components/dashboard/FinancialInsightCard';
import { InsightSection } from '@/components/dashboard/InsightSection';

const renderCard = (result: PeriodInsightResult, onActionClick?: Parameters<typeof FinancialInsightCard>[0]['onActionClick']) =>
  renderToStaticMarkup(React.createElement(FinancialInsightCard, { result, onActionClick }));

const renderSection = (
  daily: PeriodInsightResult,
  weekly: PeriodInsightResult,
  monthly: PeriodInsightResult
) =>
  renderToStaticMarkup(
    React.createElement(InsightSection, {
      daily,
      weekly,
      monthly,
      onActionClick: () => {},
    })
  );

describe('Phase 3: Financial Insight UI Components Logic', () => {
  const availableResult: PeriodInsightResult = {
    periodType: 'DAILY',
    state: 'INSIGHT_AVAILABLE',
    insight: {
      id: 'daily-safe-to-spend-critical',
      periodType: 'DAILY',
      domain: 'SALDO',
      urgency: 'CRITICAL',
      title: 'Saldo Kas Tidak Menutup Komitmen',
      observation:
        'Safe-to-Spend defisit sebesar -Rp 500.000 karena total tagihan belum dibayar dan dana pos target melebihi saldo kas Anda.',
      evidence: {
        currentValue: '-Rp 500.000',
        breakdown: [
          { label: 'Saldo Kas', value: 'Rp 1.000.000' },
          { label: 'Tagihan Belum Dibayar', value: 'Rp 1.200.000' },
          { label: 'Dana Pos Target', value: 'Rp 300.000' },
        ],
      },
      interpretation: 'Saldo kas belum cukup menutup komitmen.',
      recommendation: 'Prioritaskan peninjauan tagihan belum dibayar.',
      actionTarget: 'bills',
      actionLabel: 'Lihat Tagihan',
      nominalImpact: 500_000,
    },
  };

  const insufficientResult: PeriodInsightResult = {
    periodType: 'WEEKLY',
    state: 'INSUFFICIENT_DATA',
    fallbackMessage: 'Catat transaksi mingguan untuk mengaktifkan analisis.',
  };

  const stableResult: PeriodInsightResult = {
    periodType: 'MONTHLY',
    state: 'NO_SIGNIFICANT_FINDING',
    fallbackMessage: 'Pengeluaran stabil dan terkendali.',
  };

  const weeklyBillsResult: PeriodInsightResult = {
    periodType: 'WEEKLY',
    state: 'INSIGHT_AVAILABLE',
    insight: {
      id: 'weekly-upcoming-bills-risk',
      periodType: 'WEEKLY',
      domain: 'TAGIHAN',
      urgency: 'WARNING',
      title: 'Beban Tagihan 7 Hari ke Depan Tinggi',
      observation:
        'Terdapat 1 tagihan senilai Rp 3.000.000 (83% dari total saldo kas) yang jatuh tempo dalam 7 hari ke depan.',
      evidence: {
        currentValue: 'Rp 3.000.000',
        previousValue: 'Total Saldo Kas: Rp 3.630.000',
        diff: '83% dari Saldo',
      },
      interpretation: 'Porsi tagihan tinggi dapat menekan likuiditas kas.',
      recommendation: 'Siapkan dana di rekening pembayaran.',
      actionTarget: 'bills',
      actionLabel: 'Kelola Tagihan',
      nominalImpact: 3_000_000,
    },
  };

  const monthlySurgeResult: PeriodInsightResult = {
    periodType: 'MONTHLY',
    state: 'INSIGHT_AVAILABLE',
    insight: {
      id: 'monthly-category-surge-food',
      periodType: 'MONTHLY',
      domain: 'PENGELUARAN',
      urgency: 'WARNING',
      title: 'Melebihi Total Bulan Lalu: Makanan & Minuman',
      observation:
        'Pengeluaran kategori "Makanan & Minuman" bulan ini Rp 300.000 sudah melebihi total pengeluaran bulan lalu Rp 100.000.',
      evidence: {
        currentValue: 'Bulan ini: Rp 300.000',
        previousValue: 'Bulan lalu: Rp 100.000',
        diff: '+Rp 200.000',
      },
      interpretation: 'Kategori ini menyerap dana lebih besar dibanding total bulan lalu.',
      recommendation: 'Tinjau detail transaksi kategori ini.',
      actionTarget: 'transactions',
      actionLabel: 'Tinjau Transaksi Kategori',
      nominalImpact: 200_000,
    },
  };

  const uncategorizedResult: PeriodInsightResult = {
    periodType: 'WEEKLY',
    state: 'INSIGHT_AVAILABLE',
    insight: {
      id: 'weekly-uncategorized-expenses',
      periodType: 'WEEKLY',
      domain: 'DATA',
      urgency: 'HYGIENE',
      title: 'Transaksi Belum Dikategorikan',
      observation:
        'Terdapat 3 transaksi senilai Rp 150.000 minggu ini yang belum memiliki kategori.',
      evidence: {
        currentValue: '3 transaksi',
        diff: 'Total: Rp 150.000',
      },
      interpretation: 'Transaksi tanpa kategori menyulitkan analisis pola belanja.',
      recommendation: 'Lengkapi kategori pada transaksi tersebut.',
      actionTarget: 'transactions',
      actionLabel: 'Kategorikan Transaksi',
      nominalImpact: 150_000,
    },
  };

  // T-U01: Validasi keberadaan 3 result states secara simultan
  it('T-U01: should support all three result states simultaneously across periods', () => {
    expect(availableResult.state).toBe('INSIGHT_AVAILABLE');
    expect(insufficientResult.state).toBe('INSUFFICIENT_DATA');
    expect(stableResult.state).toBe('NO_SIGNIFICANT_FINDING');

    expect(availableResult.insight).toBeDefined();
    expect(insufficientResult.fallbackMessage).toBeDefined();
    expect(stableResult.fallbackMessage).toBeDefined();
  });

  // T-U02: Validasi konten lengkap pada state INSIGHT_AVAILABLE
  it('T-U02: should contain complete presentation fields for INSIGHT_AVAILABLE', () => {
    const insight = availableResult.insight!;
    expect(insight.title).toBe('Saldo Kas Tidak Menutup Komitmen');
    expect(insight.observation).toContain('-Rp 500.000');
    expect(insight.evidence.currentValue).toBe('-Rp 500.000');
    expect(insight.evidence.breakdown?.map((item) => item.label)).toEqual([
      'Saldo Kas',
      'Tagihan Belum Dibayar',
      'Dana Pos Target',
    ]);
    expect(insight.interpretation).toBeTruthy();
    expect(insight.recommendation).toBeTruthy();
    expect(insight.actionTarget).toBe('bills');
    expect(insight.actionLabel).toBe('Lihat Tagihan');
  });

  // T-U03: Validasi fallback message pada state INSUFFICIENT_DATA
  it('T-U03: should have guidance message for INSUFFICIENT_DATA', () => {
    expect(insufficientResult.fallbackMessage).toContain('Catat transaksi');
  });

  // T-U04: Validasi pesan stabilitas pada state NO_SIGNIFICANT_FINDING
  it('T-U04: should have stability message for NO_SIGNIFICANT_FINDING', () => {
    expect(stableResult.fallbackMessage).toContain('stabil');
  });

  // T-U05: Validasi routing action target ke tab yang benar
  it('T-U05: should route to correct application tab when action is invoked', () => {
    let currentTab = 'dashboard';
    const handleAction = (tab: 'transactions' | 'bills' | 'goals') => {
      currentTab = tab;
    };

    handleAction(availableResult.insight!.actionTarget!);
    expect(currentTab).toBe('bills');
  });

  // T-U06: Ketiga state memakai kerangka kartu yang sama dan label periode yang benar
  it('T-U06: should render all three result states with the same card shell', () => {
    const daily = renderCard(availableResult, () => {});
    const weekly = renderCard(insufficientResult);
    const monthly = renderCard(stableResult);

    for (const markup of [daily, weekly, monthly]) {
      expect(markup).toContain('rounded-2xl');
      expect(markup).toContain('h-full');
      expect(markup).toContain('mt-auto');
    }

    expect(daily).toContain('Harian');
    expect(weekly).toContain('Mingguan');
    expect(monthly).toContain('Bulanan');
  });

  // T-U07: Seluruh urgency badge tampil konsisten
  it('T-U07: should render a consistent badge for every urgency level', () => {
    const urgencyCases: Array<[InsightUrgency, string]> = [
      ['CRITICAL', 'Kritis'],
      ['WARNING', 'Perhatian'],
      ['OPPORTUNITY', 'Peluang'],
      ['HYGIENE', 'Kerapian'],
      ['NEUTRAL', 'Info'],
    ];

    for (const [urgency, label] of urgencyCases) {
      const result: PeriodInsightResult = {
        ...availableResult,
        insight: { ...availableResult.insight!, urgency },
      };
      expect(renderCard(result)).toContain(label);
    }
  });

  // T-U08: Card harian tampil sebagai hero number + grid perbandingan konteks
  it('T-U08: should render the daily deficit card as a hero number with context comparison', () => {
    const markup = renderCard(availableResult, () => {});

    // Hero number dengan tone merah soft
    expect(markup).toContain('-Rp 500.000');
    expect(markup).toContain('text-red-500 dark:text-red-400');

    // Evidence terpisah per komponen, bukan satu angka gabungan
    expect(markup).toContain('Saldo Kas');
    expect(markup).toContain('Tagihan Belum Dibayar');
    expect(markup).toContain('Dana Pos Target');
    expect(markup).toContain('Rp 1.000.000');
    expect(markup).toContain('Rp 1.200.000');
    expect(markup).toContain('Rp 300.000');
    expect(markup).toContain('bg-slate-800/50');

    // Tabel meta-label lama sudah dihapus
    expect(markup).not.toContain('Nilai Observasi');
    expect(markup).not.toContain('Pembanding');
    expect(markup).not.toContain('Selisih / Rincian');
    expect(markup).not.toContain('<dl');
  });

  // T-U09: Grid komparasi dihilangkan bila field konteks tidak tersedia
  it('T-U09: should hide the comparison grid when no context fields exist', () => {
    const result: PeriodInsightResult = {
      ...availableResult,
      insight: {
        ...availableResult.insight!,
        evidence: { currentValue: 'Rp 10.000' },
      },
    };
    const markup = renderCard(result, () => {});

    expect(markup).toContain('Rp 10.000');
    expect(markup).not.toContain('bg-slate-800/50');
    expect(markup).not.toContain('Saldo Riil Saat Ini');
  });

  // T-U10: Tombol aksi hanya tampil bila target, label, dan handler tersedia
  it('T-U10: should render the action button only when it is actionable', () => {
    const withAction = renderCard(availableResult, () => {});
    const withoutHandler = renderCard(availableResult);

    expect(withAction).toContain('<button');
    expect(withAction).toContain('Lihat Tagihan');
    expect(withoutHandler).not.toContain('<button');
  });

  // T-U11: State fallback tidak merender callout, evidence, atau tombol aksi
  it('T-U11: should not render evidence, callout, or actions for fallback states', () => {
    const insufficient = renderCard(insufficientResult, () => {});
    const stable = renderCard(stableResult, () => {});

    for (const markup of [insufficient, stable]) {
      expect(markup).not.toContain('<dl');
      expect(markup).not.toContain('<button');
      expect(markup).not.toContain('Nilai Observasi');
      expect(markup).not.toContain('border-amber-500');
    }

    expect(insufficient).toContain('Analisis Belum Aktif');
    expect(stable).toContain('Kondisi Terkendali');
  });

  // T-U12: Card mingguan memakai progress bar dan info saldo kas
  it('T-U12: should render the weekly bills risk with a progress bar', () => {
    const markup = renderCard(weeklyBillsResult, () => {});

    expect(markup).toContain('Beban Tagihan 7 Hari ke Depan');
    expect(markup).toContain('Rp 3.000.000');
    expect(markup).toContain('(1 Tagihan)');
    expect(markup).toContain('role="progressbar"');
    expect(markup).toContain('aria-valuenow="83"');
    expect(markup).toContain('Total Saldo Kas');
    expect(markup).toContain('Rp 3.630.000');
    expect(markup).toContain('Kelola Tagihan');
  });

  // T-U13: Card bulanan membandingkan bulan berjalan dengan total penuh bulan lalu
  it('T-U13: should render the monthly comparison with a nominal diff badge', () => {
    const markup = renderCard(monthlySurgeResult, () => {});

    expect(markup).toContain('Melebihi Bulan Lalu: ');
    expect(markup).toContain('Makanan &amp; Minuman');
    expect(markup).toContain('Bulan berjalan vs total bulan lalu');
    expect(markup).not.toContain('(+200%)');
    expect(markup).toContain('Bulan Ini');
    expect(markup).toContain('Bulan Lalu');
    expect(markup).toContain('Rp 300.000');
    expect(markup).toContain('Rp 100.000');
    expect(markup).toContain('+Rp 200.000');
    expect(markup).toContain('Tinjau Transaksi Kategori');
  });

  // T-U14: Rule lain tetap tampil rapi lewat layout generik
  it('T-U14: should render other insight rules with the generic clean layout', () => {
    const markup = renderCard(uncategorizedResult, () => {});

    expect(markup).toContain('Transaksi Belum Dikategorikan');
    expect(markup).toContain('3 transaksi');
    expect(markup).toContain('Total');
    expect(markup).toContain('Rp 150.000');
    expect(markup).toContain('border-amber-500');
    expect(markup).toContain('Kategorikan Transaksi');
  });

  // T-U15: Priority Inbox menampilkan semua masalah actionable, termasuk W-2 saat W-1 aktif
  it('T-U15: should show every actionable insight in the domain-based Priority Inbox', () => {
    const dailyBillsResult: PeriodInsightResult = {
      periodType: 'DAILY',
      state: 'INSIGHT_AVAILABLE',
      insight: {
        id: 'daily-immediate-bills-due',
        periodType: 'DAILY',
        domain: 'TAGIHAN',
        urgency: 'WARNING',
        title: 'Tagihan Jatuh Tempo Segera',
        observation: '1 tagihan sebesar Rp 1.000.000 jatuh tempo besok.',
        evidence: {
          currentValue: 'Rp 1.000.000',
          diff: '1 tagihan: Listrik',
        },
        interpretation: 'Tagihan dekat jatuh tempo.',
        recommendation: 'Siapkan dana pembayaran.',
        actionTarget: 'bills',
        actionLabel: 'Lihat Daftar Tagihan',
        nominalImpact: 1_000_000,
      },
    };

    const weeklyCombinedResult: PeriodInsightResult = {
      periodType: 'WEEKLY',
      state: 'INSIGHT_AVAILABLE',
      insight: weeklyBillsResult.insight,
      insights: [weeklyBillsResult.insight!, uncategorizedResult.insight!],
    };

    const markup = renderSection(dailyBillsResult, weeklyCombinedResult, stableResult);

    expect(markup).toContain('Perlu Perhatian');
    expect(markup).toContain('3 hal perlu ditinjau');
    expect(markup).toContain('Tagihan Jatuh Tempo Segera');
    expect(markup).toContain('Beban Tagihan 7 Hari ke Depan');
    expect(markup).toContain('Transaksi Belum Dikategorikan');

    // W-1 dan W-2 sama-sama tampil; W-2 tidak ditekan oleh W-1.
    expect(markup.indexOf('Beban Tagihan 7 Hari ke Depan')).toBeLessThan(
      markup.indexOf('Transaksi Belum Dikategorikan')
    );

    // Status stabil diringkas menjadi metadata kecil, bukan kartu penuh.
    expect(markup).toContain('Bulanan stabil');
    expect(markup).not.toContain('Kondisi Terkendali');
    expect(markup).not.toContain('Analisis Belum Aktif');
  });

  // T-U16: Priority Inbox meringkas periode aman dan periode yang menunggu data
  it('T-U16: should summarize non-actionable periods without rendering fallback cards', () => {
    const dailyInsufficientResult: PeriodInsightResult = {
      ...insufficientResult,
      periodType: 'DAILY',
      fallbackMessage: 'Tambahkan akun dompet untuk melihat ringkasan harian.',
    };
    const weeklyStableResult: PeriodInsightResult = {
      ...stableResult,
      periodType: 'WEEKLY',
    };

    const markup = renderSection(dailyInsufficientResult, weeklyStableResult, stableResult);

    expect(markup).toContain('Tidak ada hal mendesak');
    expect(markup).toContain('Harian menunggu data');
    expect(markup).toContain('Mingguan stabil');
    expect(markup).toContain('Bulanan stabil');
    expect(markup).not.toContain('Kondisi Terkendali');
    expect(markup).not.toContain('Analisis Belum Aktif');
    expect(markup).not.toContain('<button');
  });
});
