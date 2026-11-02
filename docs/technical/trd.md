# Technical Requirements Document (TRD) — PetaUang

## 1. Arsitektur Teknis

PetaUang adalah aplikasi Client-Side Local-First. Operasi pencatatan harian menggunakan IndexedDB melalui Dexie.js. MVP tidak menggunakan database server, API route, server action, atau runtime backend untuk data finansial.

## 2. Stack Aktual

| Layer | Teknologi |
|---|---|
| Framework | Next.js App Router 16.4.3 |
| Language | TypeScript 5.x |
| UI | React 19.x |
| Styling | Tailwind CSS 4 dan konfigurasi Turbopack CSS |
| Database | IndexedDB melalui Dexie.js |
| Reactive query | `dexie-react-hooks` |
| Icon | `lucide-react` |
| Export | Client-side CSV melalui Blob/data URL |
| Output | Static export |
| Config | `next.config.ts` |

Versi dependency aktual menjadi sumber fakta untuk status implementasi; dokumen ini tidak memilih dependency tambahan.

## 3. Struktur Route

Target route produk:

- `src/app/page.tsx` → `/`
- `src/app/transactions/page.tsx` → `/transactions`
- `src/app/accounts/page.tsx` → `/accounts`
- `src/app/bills/page.tsx` → `/bills`

Source code memiliki empat route target, termasuk `/bills` untuk Bill Management. `/settings` dipertahankan sebagai alias kompatibilitas dan bukan modul utama.

## 4. Struktur Source Aktual

```text
src/
├── app/                 # App Router dan route pages
├── components/          # Komponen UI dan layout
└── lib/
    ├── db/              # Dexie schema, seed, transaction helper
    ├── finance/         # Kalkulasi ledger dan overview
    ├── services/        # Account, category, transaction, transfer service
    └── utils/           # CSV exporter
```

Struktur direktori bukan bagian dari perubahan rekonsiliasi ini. Deskripsi di atas hanya mencatat kondisi source yang diverifikasi.

## 5. Database dan Ledger

Database bernama `PetaUangDB` dan menggunakan IndexedDB. Saldo dihitung dari:

`initial_balance + income - expense - transfer_out + transfer_in`

Safe-to-Spend MVP:

`Current Balance - Unpaid Bills`

Cash Flow dashboard dihitung client-side dari transaksi lokal untuk periode bulan terpilih: jumlah `INCOME` menjadi Cash In, jumlah `EXPENSE` menjadi Cash Out, dan Net Cash Flow adalah Cash In dikurangi Cash Out. Record `TRANSFER` dikecualikan. Hasil agregat tidak dipersist ke IndexedDB dan tidak menggunakan endpoint server.

Goal Allocations tidak termasuk dalam MVP.

Bill Management menggunakan tabel `bills` pada IndexedDB dan service client-side. Lifecycle pada IPD-016 mencakup create, edit, delete, serta perubahan `is_paid`. Tidak ada API server atau database server untuk operasi bill pada MVP.

Operasi transfer harus memvalidasi amount positif, akun berbeda, akun aktif, dan saldo sumber cukup. Penolakan saldo tidak cukup harus menghasilkan warning UI. Pencatatan transfer dan perubahan saldo diperlakukan sebagai satu operasi logical atomic.

Penghapusan account menggunakan operasi logical atomic yang mencakup tabel `accounts` dan `transactions`. Service menandai account sebagai inactive, lalu menghapus transaksi bertipe `TRANSFER` jika `account_id` atau `destination_account_id` cocok dengan account tersebut. Transaksi `INCOME` dan `EXPENSE` tidak dihapus. UI harus meminta konfirmasi setelah menampilkan warning sebelum service dijalankan.

Kategori pada transaksi income/expense bersifat opsional. Jika tidak dipilih, `category_id` disimpan kosong dan UI menampilkan `Uncategorized`; tidak diperlukan record kategori khusus. Jika kategori dipilih, service memvalidasi status aktif dan kecocokan tipe. Kategori default maupun custom mendukung CRUD; delete dilakukan sebagai soft-delete (deactivate). Menonaktifkan kategori tidak menghapus atau memutus referensi transaksi historis. Seed kategori hanya berjalan jika belum ada kategori default, agar perubahan dan penonaktifan kategori default tidak dibatalkan saat aplikasi dibuka.

## 6. Autentikasi dan Keamanan

MVP menggunakan zero-authentication:

- Tidak ada registrasi.
- Tidak ada email/password login.
- Tidak ada provider autentikasi eksternal.
- Tidak ada Local PIN Protection.

Data terlindungi oleh isolasi storage browser, bukan oleh sistem authorization multi-user. Input teks harus dirender dengan aman dan nominal harus memakai integer.

## 7. Routing dan Render

Route memakai App Router dan Client Components jika membutuhkan IndexedDB atau browser API. Static export diaktifkan melalui file aktual `next.config.ts` dengan `output: "export"`.

Navigasi antar-modul menggunakan route utama. Tabs hanya untuk state sekunder di dalam modul.

## 8. PWA dan Offline

PWA menyediakan `public/manifest.json`, ikon 192/512, Service Worker `public/sw.js`, dan registrasi client. Service Worker hanya didaftarkan pada production; pada development registration lama di-unregister agar tidak mengganggu Next Dev dan routing. Kapabilitas offline/installable belum boleh dinyatakan Verified sebelum diuji melalui browser.

## 9. CSV Export Canonical

Nama file:

`PetaUang_All_Transactions_YYYY-MM-DD.csv`

Header dan urutan kolom:

```text
transaction_id,transaction_date,transaction_type,category,amount,account_from,account_to,description,created_at
```

Aturan format:

- `transaction_date` dan `created_at` menggunakan ISO 8601 UTC.
- `amount` berupa integer Rupiah tanpa pemisah ribuan.
- `account_from` diisi untuk expense dan transfer.
- `account_to` diisi untuk income dan transfer.
- Field yang tidak berlaku berisi string kosong.
- Nilai yang mengandung koma, kutip, atau newline mengikuti escaping CSV standar.

Implementasi exporter menggunakan header, nama file, dan format canonical di atas. Field `description` berisi `title`, ditambah `note` jika tersedia dengan pemisah ` — `. Field yang tidak berlaku menggunakan string kosong.

## 10. Error Handling dan Verifikasi

Kegagalan IndexedDB, kuota storage, validasi transaksi, dan saldo transfer harus memiliki pesan yang dapat dipahami pengguna. Error boundary dan loading state harus diverifikasi ketika implementasinya tersedia.

Tidak ada hasil pengujian otomatis yang tersedia dalam repository saat audit. Klaim performa, offline, dan atomicity tidak boleh diberi status Verified tanpa bukti.

## 11. Deployment

Static export ditujukan untuk hosting statis. File konfigurasi yang digunakan adalah `next.config.ts`; dokumen ini tidak mengubah atau mengganti nama file tersebut. Konfigurasi deployment eksternal harus diverifikasi dari file repository sebelum dinyatakan siap.
