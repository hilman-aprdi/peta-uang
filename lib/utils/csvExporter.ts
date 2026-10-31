import { db } from '@/lib/db/schema';

export async function exportTransactionsToCSV(): Promise<void> {
  const transactions = await db.transactions.toArray();
  const accounts = await db.accounts.toArray();
  const categories = await db.categories.toArray();

  // Map ID ke Nama agar file CSV mudah dibaca
  const accountMap = new Map(accounts.map((a) => [a.id, a.name]));
  const categoryMap = new Map(categories.map((c) => [c.id, c.name]));

  // Header CSV
  const headers = ['ID', 'Tanggal', 'Tipe', 'Judul', 'Kategori', 'Akun Asal', 'Akun Tujuan', 'Nominal (Rp)', 'Catatan'];

  // Baris Data
  const rows = transactions.map((tx) => {
    const dateStr = new Date(tx.transaction_date).toLocaleString('id-ID');
    const categoryName = tx.category_id ? categoryMap.get(tx.category_id) || '-' : '-';
    const accountName = accountMap.get(tx.account_id) || '-';
    const destAccountName = tx.destination_account_id ? accountMap.get(tx.destination_account_id) || '-' : '-';
    const noteClean = tx.note ? `"${tx.note.replace(/"/g, '""')}"` : '-';
    const titleClean = `"${tx.title.replace(/"/g, '""')}"`;

    return [
      tx.id,
      `"${dateStr}"`,
      tx.type,
      titleClean,
      `"${categoryName}"`,
      `"${accountName}"`,
      `"${destAccountName}"`,
      tx.amount,
      noteClean,
    ].join(',');
  });

  const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows].join('\n');
  const encodedUri = encodeURI(csvContent);

  // Trigger Download Client-Side
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  const today = new Date().toISOString().split('T')[0];
  link.setAttribute('download', `PetaUang_Export_${today}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
