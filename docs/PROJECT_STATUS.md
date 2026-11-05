# Status Proyek PetaUang

> Kondisi implementasi aktual dan fokus pengembangan PetaUang.

**Terakhir diperbarui:** 5 November 2026
**Status:** MVP sebagian terimplementasi; verifikasi manual browser belum lengkap
**Branch historis:** `main`
**Commit baseline yang diketahui:** `1f110fd`

## 1. Ringkasan

PetaUang adalah aplikasi keuangan pribadi Local-First dengan IndexedDB melalui Dexie.js. Tidak ada database server atau autentikasi pada MVP.

Source saat audit menyediakan sebagian alur dashboard, akun, transaksi, transfer, tagihan, Goals, wawasan finansial, dan export. Status “Implemented” pada IPD berarti kode tersedia; status “Verified” memerlukan bukti pengujian dan acceptance criteria.

## 2. Fakta Implementasi yang Terverifikasi dari Source

- Next.js App Router, TypeScript, React, Tailwind, Dexie, dan dexie-react-hooks tersedia.
- Static export dikonfigurasi di `next.config.ts`.
- Database lokal `PetaUangDB` menggunakan Dexie **version 5** dengan tabel `accounts`, `categories`, `transactions`, `bills`, `goals`, dan `goal_allocations`.
- Schema version 5 menambahkan index `transactions.goal_id` serta tabel Goal; migration version 2–4 menangani normalisasi `is_active` dan duplikasi kategori default.
- Seed kategori default tersedia.
- Komponen dashboard, akun, form transaksi, transfer, tagihan, dan Goals tersedia.
- Account lifecycle untuk create, edit, dan soft-delete tersedia; edit akun memakai **Saldo Saat Ini** dan mencatat selisih sebagai transaksi `Adjust Balance`. Akun inactive ditolak oleh service transaksi.
- Category lifecycle tersedia untuk kategori default dan custom; keduanya dapat dibuat, dilihat, diedit, dan dinonaktifkan tanpa menghapus histori transaksi.
- Income/expense transaction lifecycle untuk create, edit, delete, catatan, validasi, dan atomic ledger update tersedia; acceptance test manual masih diperlukan.
- Transfer memvalidasi akun aktif, nominal integer, tanggal, dan saldo sumber dalam operasi atomic; acceptance test manual masih diperlukan.
- Financial overview dashboard menggunakan Current Balance, Total Unpaid Bills, Total Allocated Goals, dan Safe-to-Spend `Current Balance - Total Unpaid Bills - Total Allocated Goals`.
- Bill Management service, modal, daftar bill, status paid/unpaid, dan route `/bills` tersedia; acceptance test manual masih diperlukan.
- Goals dan Goal Allocations tersedia melalui route `/goals`: create, edit, alokasi, penarikan, pembelanjaan, arsip, soft-delete, dan riwayat mutasi.
- Dashboard tidak memiliki filter periode. Dashboard menampilkan seluruh transaksi hari ini berdasarkan kalender lokal, empty state bila kosong, dan tombol menuju `/transactions`.
- Cash Flow Dashboard memakai transaksi bulan berjalan. Halaman `/transactions` memiliki filter bulan independen, toggle **Semua Waktu**, tombol reset **Bulan Ini**, serta ringkasan Income, Expense, dan Net Cash Flow.
- Financial Insight Engine tersedia sebagai evaluasi in-memory read-only untuk periode Harian, Mingguan, dan Bulanan tanpa perubahan schema. Dashboard menampilkan Priority Inbox berbasis domain dengan seluruh insight actionable terurut; D-1 mendiagnosis penyebab Safe-to-Spend negatif, W-2 mencakup `EXPENSE`/`INCOME` tanpa kategori, dan M-1 membandingkan kategori bulan berjalan dengan total penuh bulan lalu.
- Form transaksi menggunakan controlled Bottom Sheet/dialog, input integer Rupiah, dan feedback success/error; acceptance test responsive masih diperlukan.
- PWA source menyediakan manifest, ikon 192/512, Service Worker, dan registrasi client; browser verification untuk installability dan offline behavior masih diperlukan.
- CSV exporter sudah menggunakan filename dan schema canonical; acceptance test manual untuk format dan escaping masih diperlukan.
- Route source yang tersedia: `/`, `/transactions`, `/accounts`, `/bills`, dan `/goals`; tidak ada route atau alias `/settings`.
- Layout utama menyediakan sidebar desktop, bottom navigation mobile, dan active state untuk lima route utama; acceptance test responsive masih diperlukan.
- `public/manifest.json` tersedia.
- Export transaksi tersedia sebagai fungsi client-side.
- Test otomatis Vitest dan `fake-indexeddb` tersedia untuk finance, transfer, CSV, bill, Goals, Insight Engine, daily rules, local-date, dan PeriodNavigator. Hasil `npm test`: 12 file, 94 test lulus.

## 3. Hal yang Belum Terverifikasi atau Belum Sesuai Baseline

- Acceptance test manual browser untuk Dashboard, halaman Transaksi, Goals, Bill Management, dan alur UI belum dicatat.
- Pergantian hari tengah malam tidak otomatis menyegarkan daftar “Transaksi Hari Ini” hingga ada render atau query berikutnya.
- Installability dan offline behavior PWA belum diverifikasi melalui browser.
- Acceptance browser untuk routing, PWA, CSV download, dan responsive behavior belum seluruhnya dicatat.
- Schema Dexie version 5 dan migration tersedia di source, tetapi verifikasi upgrade database di browser belum dicatat.
- Build produksi dan static deployment telah diverifikasi melalui IPD-015.
- Account deletion dengan warning dan cascade delete transfer telah tersedia sebagai IPD-017; automated test lulus, acceptance UI masih diperlukan.
- Automated test tidak dianggap sebagai bukti bahwa seluruh perilaku fitur benar.
- `npm run lint` penuh masih memiliki dua error `react-hooks/set-state-in-effect` yang sudah ada sebelumnya di `src/components/ui/PayBillModal.tsx`, serta sejumlah warning.
- Financial Insight Engine telah memiliki persetujuan owner untuk revisi perilaku dan Priority Inbox, tetapi belum memiliki ID keputusan formal; acceptance visual Priority Inbox di browser masih diperlukan.
- Goals & Pos Alokasi Tabungan tersedia di Dexie version 5 dan terintegrasi ke Safe-to-Spend; acceptance UI browser untuk seluruh alur modal dan riwayat mutasi belum dicatat.

## 4. Fokus Prioritas

1. Acceptance test manual browser untuk Dashboard dan halaman Transaksi, termasuk batas hari kalender lokal.
2. Integritas ledger, Goals, dan validasi transaksi.
3. Aturan transfer, termasuk saldo sumber dan warning.
4. Bill Management melalui IPD-016.
5. CSV canonical.
6. Filter periode dan toggle Semua Waktu.
7. Verifikasi PWA/offline dan responsive behavior.
8. Perbaikan dua error lint `react-hooks/set-state-in-effect` di `PayBillModal.tsx`.

## 5. Status PWA

Manifest, ikon, dan Service Worker sudah tersedia. Status PWA saat ini **belum Verified** sampai installability dan offline behavior diuji melalui browser.

## 6. Status Dokumentasi

Dokumentasi telah direkonsiliasi berdasarkan DEC-001 sampai DEC-019. Decision log berada di `docs/PROJECT_DECISIONS.md`. Implementation gap tetap dicatat dan tidak ditutup secara dokumentasi.

## 7. Sumber Audit

- Source code dan konfigurasi repository.
- `package.json` dan lockfile.
- PRD, BSD, AFD, DBD, TRD, dan IPD.
- Test suite otomatis menggunakan Vitest dan `fake-indexeddb` tersedia di `tests/`.
