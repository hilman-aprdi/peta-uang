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
| IPD-002 | Dexie schema, connection, dan seed | 2 | In Progress |
| IPD-003 | Atomic transaction helper | 2 | Implemented |
| IPD-004 | Account create dan lifecycle | 3 | In Progress |
| IPD-005 | Default dan custom categories | 3 | In Progress |
| IPD-006 | Income/expense CRUD dan ledger | 3 | In Progress |
| IPD-007 | Transfer dengan seluruh business rules | 3 | In Progress |
| IPD-008 | Current Balance dan Safe-to-Spend | 3 | In Progress |
| IPD-009 | Canonical CSV export | 3 | In Progress |
| IPD-010 | Layout dan route utama | 4 | In Progress |
| IPD-011 | Dashboard dan period filter | 4 | In Progress |
| IPD-012 | Form modal/bottom sheet | 4 | In Progress |
| IPD-013 | PWA dan offline support | 4 | In Progress |
| IPD-014 | Unit testing finance dan CSV | 5 | Todo |
| IPD-015 | Static build dan deployment | 5 | In Progress |

Status ini berdasarkan inspeksi source dan file konfigurasi pada audit dokumentasi. Tidak ada task yang diberi status Verified karena tidak tersedia bukti acceptance test yang memadai.

## 4. Detail Task dan Acceptance Criteria

### IPD-001 — Fondasi Project

Next.js App Router, TypeScript, React, Tailwind, dan source modular tersedia. Verifikasi build/lint tetap diperlukan sebelum status Verified.

### IPD-002 — IndexedDB/Dexie

Target MVP memiliki tabel `accounts`, `categories`, `transactions`, dan `bills`, serta seed kategori default. `budgets` dan Goal Allocations ditunda. Acceptance: schema dan migration tervalidasi di IndexedDB.

### IPD-003 — Atomic Helper

Helper menjalankan operasi read/write dalam transaksi Dexie dan mengembalikan rollback bila callback gagal. Acceptance: test rollback tersedia dan lulus.

### IPD-004 — Accounts

Account dapat dibuat dengan nama, tipe, dan integer initial balance; akun inactive tidak dipakai untuk transaksi baru. Edit dan soft-delete harus memiliki acceptance test.

### IPD-005 — Categories

Kategori default tersedia dan kategori custom dapat dikelola. Tipe kategori harus cocok dengan tipe transaksi.

### IPD-006 — Income/Expense

Tambah, edit, dan hapus harus menjaga ledger, menolak nominal tidak valid, memvalidasi akun aktif, dan memvalidasi kategori. Setiap perubahan harus atomic.

### IPD-007 — Transfer

Transfer harus:

1. Menolak amount `<= 0`.
2. Menolak akun sumber dan tujuan yang sama.
3. Menolak akun yang tidak aktif atau tidak ditemukan.
4. Menolak saldo sumber yang tidak mencukupi.
5. Menampilkan warning saat ditolak karena saldo.
6. Mengurangi sumber dan menambah tujuan secara logical atomic.
7. Tidak mengubah net worth keseluruhan.

### IPD-008 — Financial Overview

`Current Balance` adalah total saldo akun aktif. `Safe-to-Spend` adalah `Current Balance - Unpaid Bills`. Goal Allocations tidak digunakan dalam MVP.

### IPD-009 — CSV

Header canonical:

```text
transaction_id,transaction_date,transaction_type,category,amount,account_from,account_to,description,created_at
```

Nama file canonical: `PetaUang_All_Transactions_YYYY-MM-DD.csv`. Format tanggal, nominal, dan empty value mengikuti TRD.

### IPD-010 — Layout dan Route

Target route adalah `/`, `/transactions`, `/accounts`, dan `/settings`. Desktop memakai sidebar; mobile memakai bottom navigation. Tabs hanya navigasi sekunder.

### IPD-011 — Dashboard

Dashboard menampilkan Current Balance, Safe-to-Spend, income/expense periode terpilih, dan transaksi terbaru yang diurutkan berdasarkan `transaction_date` descending.

### IPD-012 — Input UI

Expense, income, dan transfer menggunakan form terkontrol; mobile memakai Bottom Sheet; desktop memakai dialog; nominal ditampilkan sebagai integer Rupiah; state success/error tersedia.

### IPD-013 — PWA

Manifest, ikon, Service Worker, installability, dan offline behavior harus tersedia serta diuji. Keberadaan manifest saja tidak cukup untuk status Verified.

### IPD-014 — Testing

Tambahkan unit test untuk ledger, Safe-to-Spend, transfer rejection, CSV schema, dan CSV escaping. Tambahkan integration/manual test untuk IndexedDB dan routing.

### IPD-015 — Static Export

Gunakan file konfigurasi aktual `next.config.ts` dengan static export. Deployment hanya dinyatakan siap setelah build dan verifikasi hosting berhasil.

## 5. Implementation Gap yang Ditemukan

- Source belum memiliki `/settings`.
- Dashboard belum menggunakan Safe-to-Spend unpaid bills secara penuh.
- Transfer belum memeriksa saldo sumber cukup.
- Export aktual memakai nama file dan header berbeda dari canonical.
- Filter periode belum tersedia.
- Service Worker dan ikon manifest belum terbukti tersedia.
- Test otomatis belum tersedia.

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
