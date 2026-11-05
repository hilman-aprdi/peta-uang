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

Route aktif:

- `src/app/page.tsx` → `/` (Dashboard)
- `src/app/transactions/page.tsx` → `/transactions`
- `src/app/accounts/page.tsx` → `/accounts`
- `src/app/bills/page.tsx` → `/bills`
- `src/app/goals/page.tsx` → `/goals`

`/transactions` dan `/accounts` merender komponen `Home` dengan `initialTab` berbeda. `/bills` dan `/goals` merender komponen manajemen masing-masing di dalam `AppLayout`. Tidak ada route `/settings` dan tidak ada alias kompatibilitas.

Dashboard tidak memiliki state filter periode. Halaman Transaksi mempertahankan state periode sendiri melalui `PeriodNavigator` dengan opsi **Semua Waktu** dan reset **Bulan Ini**.

## 4. Struktur Source Aktual

```text
src/
├── app/                 # App Router dan route pages
├── components/          # Komponen UI, layout, dashboard, goals, PWA
└── lib/
    ├── db/              # Dexie schema, seed, transaction helper
    ├── finance/         # Kalkulasi ledger dan overview
    ├── insight/         # Financial Insight Engine dan rules
    ├── services/        # Account, category, transaction, transfer, bill, goal
    └── utils/           # CSV exporter dan local-date helper
```

Struktur direktori bukan bagian dari perubahan rekonsiliasi ini. Deskripsi di atas hanya mencatat kondisi source yang diverifikasi.

## 5. Database dan Ledger

Database bernama `PetaUangDB` dan menggunakan IndexedDB. Schema aktif adalah Dexie **version 5** dengan tabel `accounts`, `categories`, `transactions`, `bills`, `goals`, dan `goal_allocations`. Version 5 menambahkan index `transactions.goal_id` serta tabel Goal; migration versi 2–4 menangani normalisasi `is_active` dan duplikasi kategori default.

Saldo akun dihitung dari:

`initial_balance + income - expense - transfer_out + transfer_in`

Safe-to-Spend:

`Current Balance - Total Unpaid Bills - Total Allocated Goals`

`Total Allocated Goals` menjumlahkan `allocated_amount` seluruh Goal non-deleted. Alokasi Goal bersifat virtual dan tidak mengubah saldo akun.

Cash Flow dihitung client-side dari transaksi lokal: jumlah `INCOME` menjadi Cash In, jumlah `EXPENSE` menjadi Cash Out, dan Net Cash Flow adalah Cash In dikurangi Cash Out. Record `TRANSFER` dikecualikan. Hasil agregat tidak dipersist ke IndexedDB dan tidak menggunakan endpoint server. Cakupan periode:

- Dashboard: bulan berjalan menurut kalender lokal, tanpa filter pengguna.
- Halaman Transaksi: bulan terpilih, atau seluruh transaksi saat mode **Semua Waktu** aktif.

Bill Management menggunakan tabel `bills` dan service client-side. Lifecycle pada IPD-016 mencakup create, edit, delete, serta perubahan `is_paid`. Menandai bill paid membuat transaksi `EXPENSE` dan menautkan `transaction_id`; mengembalikannya ke unpaid menghapus transaksi tersebut.

Operasi transfer harus memvalidasi amount positif, akun berbeda, akun aktif, dan saldo sumber cukup. Penolakan saldo tidak cukup harus menghasilkan warning UI. Pencatatan transfer dan perubahan saldo diperlakukan sebagai satu operasi logical atomic.

Penghapusan account menggunakan operasi logical atomic yang mencakup tabel `accounts` dan `transactions`. Service menandai account sebagai inactive, lalu menghapus transaksi bertipe `TRANSFER` jika `account_id` atau `destination_account_id` cocok dengan account tersebut. Transaksi `INCOME` dan `EXPENSE` tidak dihapus. UI harus meminta konfirmasi setelah menampilkan warning sebelum service dijalankan.

Perubahan **Saldo Saat Ini** pada account modal menghitung selisih terhadap saldo ledger, lalu membuat transaksi `Adjust Balance` bertipe `INCOME` atau `EXPENSE`. `initial_balance` tidak diubah.

Kategori pada transaksi income/expense bersifat opsional. Jika tidak dipilih, `category_id` disimpan kosong dan UI menampilkan `Uncategorized`; tidak diperlukan record kategori khusus. Jika kategori dipilih, service memvalidasi status aktif dan kecocokan tipe. Kategori default maupun custom mendukung CRUD; delete dilakukan sebagai soft-delete (deactivate). Menonaktifkan kategori tidak menghapus atau memutus referensi transaksi historis.

Goal menggunakan service `goalService.ts`. Alokasi, penarikan, pembelanjaan, perubahan status, dan penghapusan divalidasi di service dan dijalankan secara atomic. `allocated_amount` direkonsiliasi dari riwayat `goal_allocations` dan dapat dihitung ulang dengan `calculateReconstructedGoalAllocation`. Edit dan delete transaksi yang tertaut Goal memicu rekonsiliasi alokasi.

Seed kategori hanya berjalan jika belum ada kategori default, agar perubahan dan penonaktifan kategori default tidak dibatalkan saat aplikasi dibuka.

## 5.1 Local Calendar Date

`src/lib/utils/localDate.ts` menyediakan helper tanggal berbasis kalender lokal perangkat. Helper ini digunakan untuk menentukan “hari ini” pada Dashboard dan key bulan berjalan, bukan memotong string UTC. Penggunaan utamanya:

- `toLocalDateKey(value)` menormalkan nilai tanggal transaksi menjadi key `YYYY-MM-DD` kalender lokal; nilai `YYYY-MM-DD` dipertahankan apa adanya dan timestamp dikonversi ke tanggal lokal.
- `getTodayLocalDateKey(referenceDate)` menghasilkan key tanggal lokal hari ini.
- `filterTransactionsByLocalDate(transactions, referenceDate)` memfilter transaksi yang tanggal lokalnya sama dengan hari ini.
- `toLocalDateKey` dan `getTodayLocalDateKey` juga dipakai untuk menampilkan tanggal jatuh tempo bill dan menghitung sisa hari kalender pada insight harian.

Filter bulan pada halaman Transaksi masih menggunakan `transaction_date.slice(0, 7)` untuk memilih bulan. Perbedaan mekanisme ini disengaja dan bukan bukti bahwa kedua halaman memiliki cakupan yang sama.

Keterbatasan yang diketahui: pergantian hari tengah malam tidak otomatis memicu render ulang. Daftar “Transaksi Hari Ini” baru memakai tanggal baru setelah ada perubahan state atau query berikutnya.

## 5.2 Financial Insight Engine

Financial Insight Engine berada di `src/lib/insight/` dan bersifat read-only serta in-memory. Engine menerima transaksi, akun, kategori, bill, goal, dan financial overview dari Dashboard melalui `evaluateAllInsights`.

Karakteristik implementasi:

- Tiga evaluasi independen: Harian, Mingguan, dan Bulanan, tanpa cross-period suppression.
- Window tanggal memakai kalender lokal melalui `periodHelper.ts`. `getMonthlyWindows` menghasilkan window MTD ekuivalen, sedangkan `getPriorFullMonthWindow` menghasilkan rentang penuh bulan lalu untuk perbandingan kategori.
- Engine mengembalikan `insight` sebagai kandidat utama dan `insights` sebagai seluruh kandidat terurut per periode. Dashboard menggabungkan kandidat dari ketiga periode dan mengurutkannya melalui `insightPriority.ts` berdasarkan urgensi, dengan nominal dampak sebagai tie-breaker.
- Data sufficiency dihitung dari beberapa dimensi sebelum evaluasi aturan. `filterCategorizableTransactions` mencakup `EXPENSE` dan `INCOME` non-transfer, sedangkan `filterExpenses` tetap hanya `EXPENSE`.
- Rule `SAFE_TO_SPEND_CRITICAL` (D-1) bersifat cause-aware. Diagnosis membedakan tagihan belum dibayar, dana pos target, keduanya, atau saldo kas negatif. Evidence memakai `evidence.breakdown` berisi Saldo Kas, Tagihan Belum Dibayar, dan Dana Pos Target. CTA mengikuti penyebab dominan: tagihan bila tagihan ada (termasuk saat pos target juga ada), target bila hanya pos target, dan transaksi bila hanya saldo kas negatif.
- Rule `IMMEDIATE_BILLS_DUE` mendeteksi tagihan belum dibayar H+0 s.d. H+2 berdasarkan kalender lokal. Teks observasinya dihitung dari tanggal jatuh tempo terdekat (`hari ini`, `besok`, atau `dalam 2 hari`); bila tagihan memiliki tanggal berbeda, teks menyebutkan rentangnya (contoh: `antara besok dan 2 hari ke depan`). Evidence memakai tagihan dengan jatuh tempo terdekat, bukan urutan array.
- Rule `UPCOMING_BILLS_RISK` (W-1) mendeteksi tagihan 7 hari ke depan yang menyerap minimal 50% saldo likuid, atau kondisi Safe-to-Spend kurang dari 20% dari total tagihan tersebut. Teks observasinya memakai frasa `dalam 7 hari ke depan`.
- Rule `UNCATEGORIZED_EXPENSES` (W-2) aktif bila terdapat minimal 1 transaksi `EXPENSE` atau `INCOME` non-transfer tanpa `category_id` pada minggu berjalan. Teks menampilkan jumlah transaksi; urgensi tetap `HYGIENE`.
- Rule `CATEGORY_SPENDING_OVER_PRIOR_MONTH` (M-1) membandingkan total kategori bulan berjalan (tanggal 1 s.d. hari ini) dengan total penuh kategori yang sama pada bulan lalu. Rule terpicu hanya bila total bulan berjalan lebih besar (`>`), baseline bulan lalu minimal Rp100.000, dan minimal 1 transaksi kategori bulan berjalan. Tidak ada gate hari dan tidak ada ambang selisih nominal. Kategori dengan selisih nominal terbesar dipilih.
- Tiga result state: `INSIGHT_AVAILABLE`, `INSUFFICIENT_DATA`, dan `NO_SIGNIFICANT_FINDING`.
- Tidak ada perubahan schema, tabel, atau mutasi database.
- CTA kartu wawasan mengarah ke route modul terkait.

Perilaku revisi ini disetujui owner dan dicatat di `PROJECT_DECISIONS.md` tanpa ID keputusan formal.

## 6. Autentikasi dan Keamanan

MVP menggunakan zero-authentication:

- Tidak ada registrasi.
- Tidak ada email/password login.
- Tidak ada provider autentikasi eksternal.
- Tidak ada Local PIN Protection.

Data terlindungi oleh isolasi storage browser, bukan oleh sistem authorization multi-user. Input teks harus dirender dengan aman dan nominal harus memakai integer.

## 7. Routing dan Render

Route memakai App Router dan Client Components jika membutuhkan IndexedDB atau browser API. Static export diaktifkan melalui file aktual `next.config.ts` dengan `output: "export"`.

Navigasi antar-modul menggunakan lima route utama: `/`, `/transactions`, `/accounts`, `/bills`, dan `/goals`. Dashboard menyediakan tombol menuju `/transactions`. Tidak ada route `/settings`. Tabs dan dialog hanya untuk state sekunder di dalam modul.

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

Repository memiliki test otomatis Vitest dengan `fake-indexeddb`. Hasil eksekusi `npm test` pada saat audit: 12 file test, 94 test lulus. Cakupan mencakup finance, transfer, bill, CSV, Goals, Insight Engine, daily rules, local-date, dan PeriodNavigator.

Status verifikasi lain pada saat audit:

- TypeScript check dan production build berhasil.
- ESLint pada file yang diubah berhasil.
- `npm run lint` penuh masih memiliki dua error `react-hooks/set-state-in-effect` yang sudah ada sebelumnya di `src/components/ui/PayBillModal.tsx` dan sejumlah warning.
- Acceptance test manual berbasis browser belum dilakukan.

Keberadaan test otomatis tidak membuktikan seluruh perilaku fitur benar, dan tidak menggantikan acceptance test manual untuk alur UI, PWA, responsive behavior, dan integrasi browser.

## 11. Deployment

Static export ditujukan untuk hosting statis. File konfigurasi yang digunakan adalah `next.config.ts`; dokumen ini tidak mengubah atau mengganti nama file tersebut. Konfigurasi deployment eksternal harus diverifikasi dari file repository sebelum dinyatakan siap.
