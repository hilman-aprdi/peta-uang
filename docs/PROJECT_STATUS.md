# Status Proyek PetaUang

> Kondisi implementasi aktual dan fokus pengembangan PetaUang.

**Terakhir diperbarui:** 1 November 2026
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
- Route source yang tersedia: `/`, `/transactions`, dan `/accounts`.
- `public/manifest.json` tersedia.
- Export transaksi tersedia sebagai fungsi client-side.

## 3. Hal yang Belum Terverifikasi atau Belum Sesuai Baseline

- Route `/settings` belum tersedia.
- Safe-to-Spend pada dashboard belum terbukti mengurangi unpaid bills, walaupun calculator terpisah memiliki kalkulasi tersebut.
- Transfer belum memeriksa saldo sumber yang mencukupi dan belum menampilkan warning penolakan saldo.
- Export aktual belum menggunakan nama file dan schema canonical.
- Sorting transaksi masih perlu diverifikasi terhadap `transaction_date` descending.
- Filter periode bulan belum terbukti tersedia.
- Service Worker dan ikon yang dirujuk manifest belum terbukti tersedia.
- Test otomatis dan hasil acceptance test belum tersedia.
- Build produksi belum berstatus Verified.

## 4. Fokus Prioritas

1. Integritas ledger dan validasi transaksi.
2. Aturan transfer, termasuk saldo sumber dan warning.
3. Safe-to-Spend berbasis unpaid bills.
4. CSV canonical.
5. Sorting dan filter periode.
6. Route `/settings`.
7. PWA/offline verification dan automated tests.

## 5. Status PWA

Manifest saja belum membuktikan aplikasi installable atau offline. Status PWA saat ini **belum Verified** sampai Service Worker, ikon, installability, dan offline behavior diuji.

## 6. Status Dokumentasi

Dokumentasi telah direkonsiliasi berdasarkan DEC-001 sampai DEC-011. Decision log berada di `docs/PROJECT_DECISIONS.md`. Implementation gap tetap dicatat dan tidak ditutup secara dokumentasi.

## 7. Sumber Audit

- Source code dan konfigurasi repository.
- `package.json` dan lockfile.
- PRD, BSD, AFD, DBD, TRD, dan IPD.
- Tidak ada test suite otomatis yang ditemukan pada saat audit.
