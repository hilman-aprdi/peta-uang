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
- `src/app/settings/page.tsx` → `/settings`

Source code saat audit memiliki tiga route pertama. Route `/settings` belum tersedia dan dicatat sebagai implementation gap.

## 4. Struktur Source Aktual

```text
src/
├── app/                 # App Router dan route pages
├── components/          # Komponen UI dan layout
└── lib/
    ├── db/              # Dexie schema, seed, transaction helper
    ├── finance/         # Kalkulasi ledger dan overview
    ├── services/        # Account, transaction, transfer service
    └── utils/           # CSV exporter
```

Struktur direktori bukan bagian dari perubahan rekonsiliasi ini. Deskripsi di atas hanya mencatat kondisi source yang diverifikasi.

## 5. Database dan Ledger

Database bernama `PetaUangDB` dan menggunakan IndexedDB. Saldo dihitung dari:

`initial_balance + income - expense - transfer_out + transfer_in`

Safe-to-Spend MVP:

`Current Balance - Unpaid Bills`

Goal Allocations tidak termasuk dalam MVP.

Operasi transfer harus memvalidasi amount positif, akun berbeda, akun aktif, dan saldo sumber cukup. Penolakan saldo tidak cukup harus menghasilkan warning UI. Pencatatan transfer dan perubahan saldo diperlakukan sebagai satu operasi logical atomic.

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

PWA membutuhkan manifest, ikon yang tersedia, dan Service Worker/caching yang dapat diverifikasi. Pada audit saat ini, `public/manifest.json` ada, tetapi Service Worker dan file ikon yang dirujuk belum terbukti tersedia. Karena itu kapabilitas offline/installable belum boleh dinyatakan Verified.

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

Implementasi aktual saat audit memakai header, nama file, dan format yang berbeda. Itu adalah implementation gap yang memerlukan task terpisah.

## 10. Error Handling dan Verifikasi

Kegagalan IndexedDB, kuota storage, validasi transaksi, dan saldo transfer harus memiliki pesan yang dapat dipahami pengguna. Error boundary dan loading state harus diverifikasi ketika implementasinya tersedia.

Tidak ada hasil pengujian otomatis yang tersedia dalam repository saat audit. Klaim performa, offline, dan atomicity tidak boleh diberi status Verified tanpa bukti.

## 11. Deployment

Static export ditujukan untuk hosting statis. File konfigurasi yang digunakan adalah `next.config.ts`; dokumen ini tidak mengubah atau mengganti nama file tersebut. Konfigurasi deployment eksternal harus diverifikasi dari file repository sebelum dinyatakan siap.
