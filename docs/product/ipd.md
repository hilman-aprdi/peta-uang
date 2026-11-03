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
| IPD-008 | Current Balance dan Safe-to-Spend | 3 | Verified |
| IPD-016 | Bill management | 3 | Implemented |
| IPD-009 | Canonical CSV export | 3 | Implemented |
| IPD-010 | Layout dan route utama | 4 | Implemented |
| IPD-011 | Dashboard dan period filter | 4 | Implemented |
| IPD-012 | Form modal/bottom sheet | 4 | Implemented |
| IPD-013 | PWA dan offline support | 4 | Implemented |
| IPD-014 | Unit testing finance dan CSV | 5 | Verified |
| IPD-015 | Static build dan deployment | 5 | Verified |
| IPD-017 | Account deletion dan cascade transfer | 3 | Implemented |
| IPD-018 | Cash Flow pada dashboard | 4 | Implemented |
| IPD-019 | Kategori opsional dan Uncategorized | 3 | Implemented |

Status ini berdasarkan inspeksi source, file konfigurasi, dan hasil acceptance test manual yang dikonfirmasi owner. IPD-015 telah diverifikasi berdasarkan hasil static build dan pemeriksaan deployment.

## 4. Detail Task dan Acceptance Criteria

### IPD-001 — Fondasi Project

Next.js App Router, TypeScript, React, Tailwind, dan source modular tersedia. Verifikasi build/lint tetap diperlukan sebelum status Verified.

### IPD-002 — IndexedDB/Dexie

Target MVP memiliki tabel `accounts`, `categories`, `transactions`, dan `bills`, serta seed kategori default. `budgets` dan Goal Allocations ditunda. Schema aktual menggunakan Dexie version 4 dengan migration akun `is_active` dari representasi lama `0/1` ke boolean dan migration kategori `is_active` untuk data lama. Acceptance: schema, migration, dan seed tervalidasi di IndexedDB.

### IPD-003 — Atomic Helper

Helper menjalankan operasi read/write dalam transaksi Dexie dan mengembalikan rollback bila callback gagal. Acceptance: test rollback tersedia dan lulus.

### IPD-004 — Accounts

Account dapat dibuat dan diedit dengan nama, tipe, dan integer initial balance. Validasi dilakukan di service dan form. Penghapusan account menampilkan warning, mengubah `is_active` menjadi `false`, dan menghapus transaksi transfer yang melibatkan account tersebut secara atomic. Transaksi income dan expense tetap dipertahankan. Akun inactive tidak ditampilkan atau digunakan untuk transaksi baru. Implementasi tersedia; acceptance test manual masih diperlukan.

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

`Current Balance` adalah total saldo akun aktif. `Safe-to-Spend` adalah `Current Balance - Unpaid Bills`. Dashboard menggunakan calculator financial overview yang reactive terhadap accounts, transactions, dan bills. Nilai negatif tetap ditampilkan sebagai nilai negatif. Goal Allocations tidak digunakan dalam MVP. Acceptance criteria IPD-008 telah diverifikasi secara manual.

### IPD-016 — Bill Management

Bill Management memungkinkan pengguna menambah, mengubah, menghapus, dan menandai bill sebagai paid atau unpaid melalui `/bills`. Validasi mencakup judul wajib, nominal integer lebih besar dari nol, dan due date valid. Bill baru berstatus unpaid dan hanya bill unpaid yang dikurangi dari Safe-to-Spend. Menandai paid memicu dialog pembayaran akun dan secara atomic membuat transaksi `EXPENSE` baru yang menautkan `transaction_id`. Mengubah status kembali ke unpaid secara atomic menghapus transaksi `EXPENSE` terkait dan memulihkan saldo akun. Route `/settings` dipertahankan sebagai alias kompatibilitas lama. Acceptance test manual untuk seluruh lifecycle bill dan pengaruhnya terhadap Safe-to-Spend masih diperlukan sebelum status dinaikkan menjadi `Verified`.

### IPD-009 — CSV

Header canonical:

```text
transaction_id,transaction_date,transaction_type,category,amount,account_from,account_to,description,created_at
```

Nama file canonical: `PetaUang_All_Transactions_YYYY-MM-DD.csv`. Format tanggal, nominal, dan empty value mengikuti TRD.

Implementasi menggunakan header dan urutan canonical, ISO 8601 UTC untuk timestamp, integer Rupiah tanpa pemisah, string kosong untuk field yang tidak berlaku, serta escaping CSV standar. Field `description` memuat title dan note bila note tersedia. Acceptance test manual masih diperlukan sebelum status dinaikkan menjadi `Verified`.

### IPD-010 — Layout dan Route

Target route `/`, `/transactions`, `/accounts`, dan `/bills` tersedia. Desktop memakai sidebar, mobile memakai bottom navigation, dan active state mengikuti modul aktif. Tabs hanya navigasi sekunder. Route `/settings` dipertahankan sebagai alias kompatibilitas. Acceptance test manual untuk direct navigation dan responsive behavior masih diperlukan sebelum status dinaikkan menjadi `Verified`.

### IPD-011 — Dashboard

Dashboard menampilkan Current Balance, Safe-to-Spend, income/expense periode terpilih, dan transaksi terbaru yang diurutkan berdasarkan `transaction_date` descending. Period filter menggunakan bulan dan berlaku pada ringkasan serta daftar transaksi. Acceptance test manual untuk pergantian periode dan urutan transaksi masih diperlukan sebelum status dinaikkan menjadi `Verified`.

### IPD-012 — Input UI

Expense, income, dan transfer menggunakan form terkontrol; mobile memakai Bottom Sheet; desktop memakai dialog; nominal menggunakan input integer Rupiah; dan state success/error tersedia. Account dan Bill modal memakai centered dialog dengan pola validasi dan error yang sama. Acceptance test manual untuk responsive form, validasi, dan feedback success/error masih diperlukan sebelum status dinaikkan menjadi `Verified`.

### IPD-013 — PWA

Manifest, ikon, Service Worker, registrasi client, installability, dan offline behavior tersedia pada source. Acceptance test browser untuk installability dan offline behavior masih diperlukan sebelum status dinaikkan menjadi `Verified`.

### IPD-014 — Testing

Unit test tersedia untuk ledger, Safe-to-Spend, transfer rejection, CSV schema, CSV escaping, serta lifecycle bill. Test menggunakan Vitest dan `fake-indexeddb`. Acceptance criteria IPD-014 telah diverifikasi.

### IPD-015 — Static Export

File konfigurasi aktual `next.config.ts` menggunakan static export. Static build dan verifikasi deployment telah berhasil, sehingga IPD-015 berstatus `Verified`.

### IPD-017 — Account Deletion dan Cascade Transfer

Penghapusan account dengan warning dan konfirmasi user telah diimplementasikan. Service secara atomic menandai account inactive dan menghapus seluruh transaksi `TRANSFER` yang menggunakan account sebagai sumber atau tujuan. Transaksi income/expense tidak terhapus. Automated test untuk cascade transfer dan preservasi transaksi tersedia; acceptance manual untuk warning, pembatalan, dan refresh UI masih diperlukan.

### IPD-018 — Cash Flow Dashboard

Dashboard menampilkan Cash In, Cash Out, dan Net Cash Flow untuk bulan yang dipilih. Kalkulasi dilakukan di client dari transaksi yang sudah dibaca dari IndexedDB; hanya `INCOME` dan `EXPENSE` dihitung, sedangkan `TRANSFER` dikecualikan. Tidak ada tabel baru atau agregat yang disimpan. Acceptance manual untuk pergantian periode, perubahan transaksi, dan periode tanpa transaksi masih perlu dilakukan sebelum status `Verified`.

## 5. Implementation Gap yang Ditemukan

- Verifikasi manual upgrade database dan seed di browser masih diperlukan sebelum IPD-002 berstatus Verified.
- IPD-014 telah diverifikasi melalui test otomatis core finance, transfer, CSV, dan bill lifecycle serta acceptance manual terkait.

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
