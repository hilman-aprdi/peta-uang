import { beforeEach, describe, expect, it, vi } from 'vitest';
import { db } from '@/lib/db/schema';
import { exportTransactionsToCSV } from '@/lib/utils/csvExporter';

describe('CSV export', () => {
  beforeEach(() => {
    const anchor = { click: vi.fn(), setAttribute: vi.fn(), href: '', download: '' };
    vi.stubGlobal('document', {
      createElement: vi.fn(() => anchor),
      body: { appendChild: vi.fn(), removeChild: vi.fn() },
    });
    vi.stubGlobal('URL', { createObjectURL: vi.fn(), revokeObjectURL: vi.fn() });
  });

  it('exports canonical headers, filename, and account mapping', async () => {
    vi.mocked(URL.createObjectURL).mockReturnValue('blob:test');
    vi.stubGlobal('Blob', class extends Blob {
      constructor(parts?: BlobPart[], options?: BlobPropertyBag) {
        super(parts, options);
        blobParts.push(this);
      }
    });
    const blobParts: Blob[] = [];

    await db.accounts.bulkAdd([
      { id: 'bank', name: 'Bank BCA', type: 'BANK', initial_balance: 0, is_active: true, created_at: '2026-11-01T00:00:00.000Z', updated_at: '2026-11-01T00:00:00.000Z' },
      { id: 'cash', name: 'Kas', type: 'CASH', initial_balance: 0, is_active: true, created_at: '2026-11-01T00:00:00.000Z', updated_at: '2026-11-01T00:00:00.000Z' },
    ]);
    await db.categories.add({ id: 'food', name: 'Makanan', type: 'EXPENSE', is_system_default: true, is_active: true, created_at: '2026-11-01T00:00:00.000Z' });
    await db.transactions.bulkAdd([
      { id: 'expense', title: 'Makan, siang', type: 'EXPENSE', amount: 25_000, account_id: 'bank', category_id: 'food', transaction_date: '2026-11-01T00:00:00.000Z', note: 'Catatan "penting"', created_at: '2026-11-01T00:00:00.000Z', updated_at: '2026-11-01T00:00:00.000Z' },
      { id: 'income', title: 'Gaji', type: 'INCOME', amount: 100_000, account_id: 'bank', transaction_date: '2026-11-01T00:00:00.000Z', created_at: '2026-11-01T00:00:00.000Z', updated_at: '2026-11-01T00:00:00.000Z' },
      { id: 'transfer', title: 'Transfer Antar Akun', type: 'TRANSFER', amount: 10_000, account_id: 'bank', destination_account_id: 'cash', transaction_date: '2026-11-01T00:00:00.000Z', created_at: '2026-11-01T00:00:00.000Z', updated_at: '2026-11-01T00:00:00.000Z' },
    ]);

    await exportTransactionsToCSV();

    const csv = await blobParts[0].text();
    expect(csv).toContain('transaction_id,transaction_date,transaction_type,category,amount,account_from,account_to,description,created_at');
    expect(csv).toContain('expense,2026-11-01T00:00:00.000Z,EXPENSE,Makanan,25000,Bank BCA,,"Makan, siang — Catatan ""penting"""');
    expect(csv).toContain('income,2026-11-01T00:00:00.000Z,INCOME,,100000,,Bank BCA,Gaji');
    expect(csv).toContain('transfer,2026-11-01T00:00:00.000Z,TRANSFER,,10000,Bank BCA,Kas,Transfer Antar Akun');

    const anchor = document.createElement('a') as unknown as { download: string };
    expect(anchor.download).toBe('PetaUang_All_Transactions_2026-11-02.csv');
  });
});
