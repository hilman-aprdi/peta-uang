# Implementation Plan Document (IPD) — PetaUang

## 1. Tujuan

IPD menerjemahkan PRD, BSD, AFD, DBD, dan TRD menjadi pekerjaan implementasi yang dapat diverifikasi. Status task harus membedakan keberadaan kode dari hasil verifikasi.

## 2. Definisi Status

- **Todo:** Belum diimplementasikan.
- **In Progress:** Sebagian sudah tersedia atau sedang dikerjakan.
- **Implemented:** Implementasi ada di source code.
- **Verified:** Implementasi diuji dan memenuhi acceptance criteria.
- **Deferred:** Sengaja ditunda ke fase berikutnya.
- **Blocked:** Tidak dapat dilanjutkan karena dependency atau keputusan yang belum tersedia.

Implemented tidak berarti Verified.

## 3. Progress Matrix

| ID | Task | Fase | Status audit |
|---|---|---|---|
| IPD-001 | Next.js, TypeScript, Tailwind, dan fondasi source | 1 | Implemented |
| IPD-002 | Dexie schema, connection, dan seed | 2 | Implemented |
| IPD-003 | Atomic transaction helper | 2 | Implemented |
| IPD-004 | Account create dan lifecycle | 3 | Verified |
| IPD-005 | Default dan custom categories | 3 | Verified |
| IPD-006 | Income/expense CRUD dan ledger | 3 | Implemented |
| IPD-007 | Transfer dengan seluruh business rules | 3 | Implemented |
| IPD-008 | Current Balance dan Safe-to-Spend | 3 | Implemented |
| IPD-016 | Bill management | 3 | Implemented |
| IPD-009 | Canonical CSV export | 3 | Implemented |
| IPD-010 | Layout dan route utama | 4 | Implemented |
| IPD-011 | Dashboard | 4 | Implemented |
| IPD-012 | Form modal/bottom sheet | 4 | Implemented |
| IPD-013 | PWA dan offline support | 4 | Implemented |
| IPD-014 | Automated testing finance, CSV, Goals, dan Insight | 5 | Verified |
| IPD-015 | Static build dan deployment | 5 | Verified |
| IPD-017 | Account deletion dan cascade transfer | 3 | Implemented |
| IPD-018 | Cash Flow Dashboard dan halaman Transaksi | 4 | Implemented |
| IPD-019 | Kategori opsional dan Uncategorized | 3 | Implemented |
| IPD-020 | Goals dan alokasi dana virtual | 3 | Implemented |
| IPD-021 | Financial Insight Engine | 4 | Implemented |
| IPD-022 | Local calendar date utilities | 4 | Implemented |

Status ini berdasarkan inspeksi source, file konfigurasi, hasil test otomatis, dan acceptance test manual yang telah dicatat. IPD-014 dan IPD-015 telah diverifikasi berdasarkan hasil test/build. Task lain yang berstatus `Implemented` belum memiliki acceptance test manual lengkap.

## 4. Detail Task dan Acceptance Criteria

### IPD-001 — Fondasi Project

Next.js App Router, TypeScript, React, Tailwind, dan source modular tersedia. Verifikasi build/lint tetap diperlukan sebelum status Verified.

### IPD-002 — IndexedDB/Dexie

Target MVP memiliki tabel `accounts`, `categories`, `transactions`, `bills`, `goals`, dan `goal_allocations`, serta seed kategori default. `budgets` ditunda. Schema aktual menggunakan Dexie **version 5**: version 5 menambahkan index `transactions.goal_id` dan tabel Goal tanpa backfill; version 2–4 menangani normalisasi `is_active` akun, penggabungan kategori default duplikat, dan aktivasi `categories.is_active` untuk data lama. Acceptance: schema, migration, dan seed tervalidasi di IndexedDB. Verifikasi upgrade database di browser belum dicatat.

### IPD-003 — Atomic Helper

Helper menjalankan operasi read/write dalam transaksi Dexie dan mengembalikan rollback bila callback gagal. Acceptance: test rollback tersedia dan lulus.

### IPD-004 — Accounts

Account dapat dibuat dan diedit dengan nama, tipe, dan integer initial balance. Pada mode edit, form menampilkan **Saldo Saat Ini**; selisih terhadap saldo ledger dicatat sebagai transaksi `Adjust Balance` bertipe `INCOME` atau `EXPENSE` tanpa mengubah `initial_balance`. Validasi dilakukan di service dan form. Penghapusan account menampilkan warning, mengubah `is_active` menjadi `false`, dan menghapus transaksi transfer yang melibatkan account tersebut secara atomic. Transaksi income dan expense tetap dipertahankan. Akun inactive tidak ditampilkan atau digunakan untuk transaksi baru. Implementasi tersedia; acceptance test manual masih diperlukan.

### IPD-005 — Categories

Kategori default dan custom mendukung CRUD. Delete dilakukan sebagai soft-delete untuk menjaga histori transaksi. Nama dan tipe kategori aktif harus unik. Kategori opsional pada income/expense; jika kosong ditampilkan sebagai `Uncategorized`. Jika dipilih, tipe kategori harus cocok dengan tipe transaksi. Category Management menggunakan modal overlay dan menyediakan daftar ikon.

### IPD-006 — Income/Expense

Income dan expense dapat ditambah, diedit, dan dihapus. Form mendukung catatan dan tanggal transaksi. Service menolak nominal non-integer atau tidak valid, memvalidasi akun aktif dan kategori bila dipilih, serta menjalankan perubahan secara atomic. Kategori kosong disimpan tanpa `category_id` dan ditampilkan sebagai `Uncategorized`. Transfer tetap ditangani oleh IPD-007.

### IPD-019 — Kategori Opsional dan Uncategorized

Form income/expense menerima kategori opsional. Nilai kosong disimpan tanpa `category_id`; UI daftar transaksi menampilkan `Uncategorized`. Saat mengedit, pengguna dapat memilih kategori atau mengosongkannya. Acceptance test manual untuk create/edit tanpa kategori, kategori yang dipilih, dan histori setelah kategori dinonaktifkan masih diperlukan sebelum status dinaikkan menjadi `Verified`.

### IPD-007 — Transfer

Transfer harus:

1. Menolak amount `<= 0`.
2. Menolak akun sumber dan tujuan yang sama.
3. Menolak akun yang tidak aktif atau tidak ditemukan.
4. Menolak saldo sumber yang tidak mencukupi.
5. Menampilkan warning saat ditolak karena saldo.
6. Mengurangi sumber dan menambah tujuan secara logical atomic.
7. Tidak mengubah net worth keseluruhan.

Pemeriksaan akun, saldo sumber, dan penyimpanan transfer dilakukan dalam satu operasi logical atomic. Acceptance test manual masih diperlukan sebelum status dinaikkan menjadi `Verified`.

### IPD-008 — Financial Overview

`Current Balance` adalah total saldo akun aktif. `Safe-to-Spend` adalah `Current Balance - Total Unpaid Bills - Total Allocated Goals`. Dashboard menggunakan calculator financial overview yang reactive terhadap accounts, transactions, bills, dan goals. Nilai negatif tetap ditampilkan sebagai nilai negatif. Acceptance manual untuk kombinasi Goal aktif, completed, dan archived dengan sisa alokasi masih diperlukan.

### IPD-016 — Bill Management

Bill Management memungkinkan pengguna menambah, mengubah, menghapus, dan menandai bill sebagai paid atau unpaid melalui `/bills`. Validasi mencakup judul wajib, nominal integer lebih besar dari nol, dan due date valid. Bill baru berstatus unpaid dan hanya bill unpaid yang dikurangi dari Safe-to-Spend. Menandai paid memicu dialog pembayaran akun dan secara atomic membuat transaksi `EXPENSE` baru yang menautkan `transaction_id`. Mengubah status kembali ke unpaid secara atomic menghapus transaksi `EXPENSE` terkait dan memulihkan saldo akun. Tidak ada alias `/settings`. Acceptance test manual untuk seluruh lifecycle bill dan pengaruhnya terhadap Safe-to-Spend masih diperlukan sebelum status dinaikkan menjadi `Verified`.

### IPD-009 — CSV

Header canonical:

```text
transaction_id,transaction_date,transaction_type,category,amount,account_from,account_to,description,created_at
```

Nama file canonical: `PetaUang_All_Transactions_YYYY-MM-DD.csv`. Format tanggal, nominal, dan empty value mengikuti TRD.

Implementasi menggunakan header dan urutan canonical, ISO 8601 UTC untuk timestamp, integer Rupiah tanpa pemisah, string kosong untuk field yang tidak berlaku, serta escaping CSV standar. Field `description` memuat title dan note bila note tersedia. Acceptance test manual masih diperlukan sebelum status dinaikkan menjadi `Verified`.

### IPD-010 — Layout dan Route

Target route `/`, `/transactions`, `/accounts`, `/bills`, dan `/goals` tersedia. Desktop memakai sidebar, mobile memakai bottom navigation, dan active state mengikuti modul aktif. Tabs dan dialog hanya navigasi sekunder. Tidak ada route `/settings` dan tidak ada alias kompatibilitas. Acceptance test manual untuk direct navigation dan responsive behavior masih diperlukan sebelum status dinaikkan menjadi `Verified`.

### IPD-011 — Dashboard

Dashboard menampilkan Current Balance, Safe-to-Spend, Cash Flow bulan berjalan, Priority Inbox insight berbasis domain, dan seluruh transaksi hari ini. Dashboard tidak memiliki filter periode. Daftar “Transaksi Hari Ini” memakai kecocokan tanggal kalender lokal, bukan pemotongan string UTC; transaksi kemarin dan bertanggal masa depan tidak ditampilkan. Empty state tampil jika tidak ada transaksi hari ini. Dashboard menyediakan tombol menuju `/transactions`. Acceptance test manual untuk pergantian hari, empty state, dan urutan transaksi masih diperlukan sebelum status dinaikkan menjadi `Verified`.

### IPD-012 — Input UI

Expense, income, dan transfer menggunakan form terkontrol; mobile memakai Bottom Sheet; desktop memakai dialog; nominal menggunakan input integer Rupiah; dan state success/error tersedia. Account dan Bill modal memakai centered dialog dengan pola validasi dan error yang sama. Acceptance test manual untuk responsive form, validasi, dan feedback success/error masih diperlukan sebelum status dinaikkan menjadi `Verified`.

### IPD-013 — PWA

Manifest, ikon, Service Worker, registrasi client, installability, dan offline behavior tersedia pada source. Acceptance test browser untuk installability dan offline behavior masih diperlukan sebelum status dinaikkan menjadi `Verified`.

### IPD-014 — Testing

Test otomatis menggunakan Vitest dan `fake-indexeddb`. Hasil eksekusi `npm test` saat audit: 12 file test dan 94 test lulus. Cakupan mencakup ledger, Safe-to-Spend, transfer rejection, CSV schema/escaping, lifecycle bill, Goals, Insight Engine, daily rules, local-date, dan PeriodNavigator. TypeScript check dan production build juga berhasil. `npm run lint` penuh masih memiliki dua error `react-hooks/set-state-in-effect` yang sudah ada sebelumnya di `src/components/ui/PayBillModal.tsx` serta sejumlah warning. Acceptance criteria otomatis IPD-014 terpenuhi; test otomatis tidak menggantikan acceptance test manual browser.

### IPD-015 — Static Export

File konfigurasi aktual `next.config.ts` menggunakan static export. Static build dan verifikasi deployment telah berhasil, sehingga IPD-015 berstatus `Verified`.

### IPD-017 — Account Deletion dan Cascade Transfer

Penghapusan account dengan warning dan konfirmasi user telah diimplementasikan. Service secara atomic menandai account inactive dan menghapus seluruh transaksi `TRANSFER` yang menggunakan account sebagai sumber atau tujuan. Transaksi income/expense tidak terhapus. Automated test untuk cascade transfer dan preservasi transaksi tersedia; acceptance manual untuk warning, pembatalan, dan refresh UI masih diperlukan.

### IPD-018 — Cash Flow

Dashboard menampilkan Cash In, Cash Out, dan Net Cash Flow untuk bulan berjalan tanpa kontrol periode. Halaman `/transactions` menampilkan Income, Expense, dan Net Cash Flow untuk bulan terpilih, atau seluruh transaksi saat toggle **Semua Waktu** aktif. Toggle dapat dinonaktifkan dan tombol **Bulan Ini** mengembalikan halaman ke bulan berjalan. Kalkulasi dilakukan di client dari transaksi yang dibaca dari IndexedDB; hanya `INCOME` dan `EXPENSE` dihitung, sedangkan `TRANSFER` dikecualikan. Tidak ada tabel baru atau agregat yang disimpan. Acceptance manual untuk pergantian periode, toggle Semua Waktu, perubahan transaksi, dan periode tanpa transaksi masih perlu dilakukan sebelum status `Verified`.

### IPD-020 — Goals dan Alokasi Dana

Goal dapat dibuat, diedit, diarsipkan, dan dihapus sebagai soft-delete. Alokasi dana mengurangi Safe-to-Spend tanpa mengubah saldo kas; penarikan mengembalikan dana; pembelanjaan dari Goal membuat transaksi `EXPENSE` riil dan mengurangi alokasi secara atomic. Goal dengan sisa alokasi tidak dapat dihapus atau diarsipkan. Edit dan delete transaksi tertaut Goal merekonsiliasi alokasi melalui `SPEND_ADJUSTMENT` atau `SPEND_REVERSAL`. Automated test Goals tersedia; acceptance UI manual untuk seluruh alur modal dan riwayat mutasi masih diperlukan.

### IPD-021 — Financial Insight Engine

Engine in-memory dan read-only mengevaluasi wawasan Harian, Mingguan, dan Bulanan secara independen dengan window kalender lokal. Engine menghasilkan `INSIGHT_AVAILABLE`, `INSUFFICIENT_DATA`, atau `NO_SIGNIFICANT_FINDING`, serta menyediakan CTA ke modul terkait. Tidak ada perubahan schema atau mutasi database.

Revisi yang telah disetujui owner dan diimplementasikan:

- Dashboard memakai Priority Inbox berbasis domain (`SALDO`, `TAGIHAN`, `PENGELUARAN`, `TARGET`, `DATA`); urgensi tampil sebagai badge dan periode sebagai metadata kecil.
- Seluruh kandidat insight actionable ditampilkan tanpa batas jumlah dan diurutkan berdasarkan urgensi, lalu nominal dampak.
- D-1 mendiagnosis penyebab Safe-to-Spend negatif, menampilkan Saldo Kas, Tagihan Belum Dibayar, dan Dana Pos Target secara terpisah, serta memilih CTA sesuai penyebab.
- D-2 mendeteksi tagihan H+0 s.d. H+2 dan memakai teks jatuh tempo terdekat atau rentang bila tanggal berbeda.
- W-2 terpicu dengan minimal 1 transaksi `EXPENSE` atau `INCOME` non-transfer tanpa kategori dan tetap terlihat saat W-1 juga terpicu.
- M-1 membandingkan total kategori bulan berjalan dengan total penuh kategori yang sama bulan lalu, memakai comparator ketat `>`, baseline Rp100.000, dan minimal 1 transaksi kategori bulan berjalan.

Automated test untuk engine, daily rules, period helper, dan regression tersedia; acceptance visual Priority Inbox di browser masih diperlukan.

### IPD-022 — Local Calendar Date Utilities

`src/lib/utils/localDate.ts` menyediakan key tanggal kalender lokal untuk Dashboard “hari ini”, agregasi bulan berjalan, tampilan tanggal jatuh tempo bill, dan sisa hari pada insight harian. Helper memiliki automated test. Diketahui bahwa pergantian hari tengah malam tidak otomatis memicu render ulang; daftar transaksi hari ini baru memakai tanggal baru setelah render atau query berikutnya.

## 5. Implementation Gap yang Ditemukan

- Verifikasi manual upgrade database dan seed di browser masih diperlukan sebelum IPD-002 berstatus Verified.
- Acceptance test browser untuk Dashboard/Transaksi, Goals, Insight, PWA, dan responsive behavior masih diperlukan.
- Dua error lint `react-hooks/set-state-in-effect` pada `PayBillModal.tsx` belum diperbaiki dan berada di luar scope dokumentasi ini.
- Pergantian hari tengah malam belum memicu refresh otomatis daftar transaksi hari ini.

Gap tersebut adalah rekomendasi task implementasi dan tidak diubah dalam rekonsiliasi dokumentasi.

## 6. Dependency dan Prioritas

1. Validasi dan integritas data.
2. Aturan transfer dan Safe-to-Spend.
3. CSV canonical.
4. Routing dan dashboard.
5. PWA/offline.
6. Automated tests dan deployment verification.

## 7. Definition of Done

Task hanya dapat berstatus Verified jika kode tersedia, acceptance criteria diuji, hasil pengujian dicatat, dan dokumentasi terkait telah sinkron. Commit bukan syarat status Verified dalam dokumen ini.
