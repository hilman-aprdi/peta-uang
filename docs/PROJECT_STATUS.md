# Status Proyek PetaUang

> Kondisi implementasi aktual dan fokus pengembangan PetaUang.

**Terakhir diperbarui:** 2 November 2026
**Status:** MVP sebagian terimplementasi; belum seluruhnya terverifikasi
**Branch historis:** `main`
**Commit baseline yang diketahui:** `1f110fd`

## 1. Ringkasan

PetaUang adalah aplikasi keuangan pribadi Local-First dengan IndexedDB melalui Dexie.js. Tidak ada database server atau autentikasi pada MVP.

Source saat audit menyediakan sebagian alur dashboard, akun, transaksi, transfer, dan export. Status “Implemented” pada IPD berarti kode tersedia; status “Verified” memerlukan bukti pengujian dan acceptance criteria.

## 2. Fakta Implementasi yang Terverifikasi dari Source

- Next.js App Router, TypeScript, React, Tailwind, Dexie, dan dexie-react-hooks tersedia.
- Static export dikonfigurasi di `next.config.ts`.
- Database lokal `PetaUangDB` memiliki tabel accounts, categories, transactions, dan bills.
- Seed kategori default tersedia.
- Komponen dashboard, akun, form transaksi, dan transfer tersedia.
- Account lifecycle untuk create, edit, dan soft-delete tersedia; validasi service menolak akun tidak valid dan akun inactive ditolak oleh service transaksi.
- Category lifecycle untuk kategori default dan custom tersedia; kategori custom dapat dibuat, diedit, dan dinonaktifkan tanpa menghapus histori transaksi.
- Income/expense transaction lifecycle untuk create, edit, delete, catatan, validasi, dan atomic ledger update tersedia; acceptance test manual masih diperlukan.
- Transfer memvalidasi akun aktif, nominal integer, tanggal, dan saldo sumber dalam operasi atomic; acceptance test manual masih diperlukan.
- Financial overview dashboard menggunakan Current Balance, Total Unpaid Bills, dan Safe-to-Spend sesuai formula MVP; acceptance test manual telah diverifikasi.
- Bill Management service, modal, daftar bill, status paid/unpaid, dan route `/settings` tersedia; acceptance test manual masih diperlukan.
- Dashboard memiliki period filter berbasis bulan dan daftar transaksi diurutkan berdasarkan `transaction_date` descending; acceptance test manual masih diperlukan.
- Form transaksi menggunakan controlled Bottom Sheet/dialog, input integer Rupiah, dan feedback success/error; acceptance test responsive masih diperlukan.
- PWA source menyediakan manifest, ikon 192/512, Service Worker, dan registrasi client; browser verification untuk installability dan offline behavior masih diperlukan.
- CSV exporter sudah menggunakan filename dan schema canonical; acceptance test manual untuk format dan escaping masih diperlukan.
- Route source yang tersedia: `/`, `/transactions`, `/accounts`, dan `/settings`.
- Layout utama menyediakan sidebar desktop, bottom navigation mobile, dan active state untuk empat route utama; acceptance test responsive masih diperlukan.
- `public/manifest.json` tersedia.
- Export transaksi tersedia sebagai fungsi client-side.
- Test otomatis Vitest untuk ledger, Safe-to-Spend, transfer rejection, CSV schema/escaping, dan bill lifecycle tersedia; IPD-014 telah diverifikasi.

## 3. Hal yang Belum Terverifikasi atau Belum Sesuai Baseline

- Acceptance test manual Bill Management belum dicatat.
- Safe-to-Spend dashboard sudah menggunakan `Current Balance - Total Unpaid Bills` dan telah diverifikasi secara manual.
- Transfer telah memeriksa saldo sumber dan menolak transfer yang tidak mencukupi; acceptance test transfer masih perlu dicatat.
- Sorting transaksi dan period filter sudah tersedia di source; acceptance test manual masih diperlukan.
- Installability dan offline behavior belum diverifikasi melalui browser.
- Acceptance browser untuk routing, PWA, CSV download, dan alur UI belum seluruhnya dicatat.
- Schema Dexie version 4 dan migration `is_active` sudah tersedia, tetapi verifikasi upgrade database di browser belum dicatat.
- Build produksi dan static deployment telah diverifikasi melalui IPD-015.

## 4. Fokus Prioritas

1. Integritas ledger dan validasi transaksi.
2. Aturan transfer, termasuk saldo sumber dan warning.
3. Bill Management melalui IPD-016.
4. CSV canonical.
5. Sorting dan filter periode.
6. Route `/settings`.
7. PWA/offline verification dan acceptance browser.

## 5. Status PWA

Manifest, ikon, dan Service Worker sudah tersedia. Status PWA saat ini **belum Verified** sampai installability dan offline behavior diuji melalui browser.

## 6. Status Dokumentasi

Dokumentasi telah direkonsiliasi berdasarkan DEC-001 sampai DEC-012. Decision log berada di `docs/PROJECT_DECISIONS.md`. Implementation gap tetap dicatat dan tidak ditutup secara dokumentasi.

## 7. Sumber Audit

- Source code dan konfigurasi repository.
- `package.json` dan lockfile.
- PRD, BSD, AFD, DBD, TRD, dan IPD.
- Test suite otomatis menggunakan Vitest dan `fake-indexeddb` tersedia di `tests/`.
