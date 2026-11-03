# Product Requirements Document (PRD) — PetaUang

## 1. Ringkasan Produk

PetaUang adalah aplikasi pengelolaan keuangan pribadi berbasis **Local-First Progressive Web App**. Data utama disimpan di perangkat pengguna menggunakan **IndexedDB** melalui **Dexie.js**. MVP tidak menggunakan database server, akun pengguna, login, maupun layanan autentikasi eksternal.

Produk membantu pengguna mencatat pemasukan, pengeluaran, dan transfer antar-akun; melihat saldo; menghitung Safe-to-Spend; serta mengekspor riwayat transaksi.

## 2. Masalah yang Diselesaikan

- Pengguna membutuhkan pencatatan transaksi yang cepat tanpa registrasi atau koneksi database cloud.
- Pengguna membutuhkan pemisahan antara saldo saat ini dan dana yang aman dibelanjakan setelah memperhitungkan tagihan belum dibayar.
- Pengguna membutuhkan salinan data transaksi yang dapat digunakan di luar aplikasi.

## 3. Target Pengguna

Individu yang memiliki satu atau beberapa akun keuangan seperti kas, rekening bank, dan e-wallet, serta memprioritaskan kemudahan penggunaan dan privasi data lokal.

## 4. Tujuan Produk MVP

1. Menyediakan aplikasi yang dapat digunakan secara lokal setelah aset aplikasi tersedia di perangkat.
2. Menyediakan pencatatan transaksi dengan nominal Rupiah bulat dan integritas saldo.
3. Menampilkan Current Balance dan Safe-to-Spend dengan definisi yang konsisten.
4. Menyediakan ekspor seluruh transaksi dengan format CSV yang terdokumentasi.

## 5. Ruang Lingkup MVP

### Termasuk

- Penyimpanan Local-First menggunakan IndexedDB dan Dexie.js.
- Manajemen akun keuangan.
- Pencatatan income dan expense.
- Pencatatan transfer antar-akun.
- Manajemen tagihan dan status paid/unpaid.
- Dashboard ringkasan saldo dan transaksi.
- Ringkasan Cash Flow pada dashboard berdasarkan periode terpilih.
- Filter periode bulan.
- Ekspor seluruh transaksi ke CSV.
- PWA dan dukungan offline sesuai hasil verifikasi implementasi.

### Di luar MVP atau ditunda

- Registrasi akun, login, dan autentikasi eksternal.
- Local PIN Protection atau penguncian aplikasi lokal.
- Database server dan sinkronisasi cloud.
- Sinkronisasi otomatis bank/e-wallet.
- OCR atau pemindaian struk.
- Goal Allocations dalam kalkulasi Safe-to-Spend.
- Fitur lain yang belum memiliki persyaratan dan kriteria penerimaan.

## 6. Struktur Routing Produk

Modul utama menggunakan route terpisah:

| Route | Modul |
|---|---|
| `/` | Dashboard |
| `/transactions` | Transaksi |
| `/accounts` | Akun |
| `/bills` | Tagihan dan pengelolaan bill |

Route `/settings` dipertahankan sebagai alias kompatibilitas lama dan bukan modul navigasi utama.

Tabs boleh digunakan sebagai navigasi sekunder di dalam modul, misalnya All, Income, dan Expense pada `/transactions`. Tabs tidak menggantikan route utama.

## 7. Persyaratan Fungsional

| ID | Modul | Persyaratan |
|---|---|---|
| FR-01 | Account | Pengguna dapat menambah akun dengan nama, tipe, dan saldo awal. |
| FR-02 | Expense | Pengguna dapat mencatat, mengubah, dan menghapus expense. |
| FR-03 | Income | Pengguna dapat mencatat, mengubah, dan menghapus income. |
| FR-04 | Transfer | Pengguna dapat memindahkan dana antar-akun dengan aturan transfer pada BSD. |
| FR-05 | Dashboard | Dashboard menampilkan Current Balance, Safe-to-Spend, ringkasan bulanan, dan transaksi terbaru. |
| FR-06 | Period Filter | Pengguna dapat memilih periode bulan untuk ringkasan dan daftar transaksi. |
| FR-07 | CSV Export | Pengguna dapat mengekspor seluruh transaksi menggunakan nama file dan schema CSV canonical. |
| FR-08 | Bills | Pengguna dapat menambah, mengubah, menghapus, dan menandai tagihan sebagai paid atau unpaid. |
| FR-09 | Account deletion | Pengguna dapat menghapus account kapan saja setelah menerima warning; transfer terkait account ikut dihapus, sedangkan income/expense tetap dipertahankan. |
| FR-10 | Cash Flow | Dashboard menampilkan total income, total expense, dan net cash flow untuk periode yang dipilih; transfer antar-akun tidak dihitung. |
| FR-11 | Kategori transaksi | Kategori opsional saat mencatat income/expense. Tanpa pilihan kategori, transaksi berstatus Uncategorized. Pengguna dapat melakukan CRUD kategori custom. |

## 8. Aturan Safe-to-Spend

Untuk MVP:

`Safe-to-Spend = Current Balance - Unpaid Bills`

Goal Allocations tidak termasuk dalam model maupun kalkulasi MVP.

## 9. Cash Flow Dashboard

Cash Flow adalah ringkasan pergerakan uang dari transaksi income dan expense pada periode yang dipilih di dashboard. Nilai yang ditampilkan:

- Cash In: jumlah transaksi `INCOME` pada periode tersebut.
- Cash Out: jumlah transaksi `EXPENSE` pada periode tersebut.
- Net Cash Flow: `Cash In - Cash Out`.

Transaksi `TRANSFER` dikecualikan karena hanya memindahkan dana di antara account milik pengguna dan bukan pemasukan atau pengeluaran eksternal. Perhitungan dilakukan di sisi client dari data transaksi lokal; hasil agregat tidak disimpan terpisah dan tidak memerlukan API atau database server.

## 10. Persyaratan Non-Fungsional

- Nominal keuangan disimpan sebagai integer Rupiah utuh.
- Operasi transaksi dan transfer menjaga konsistensi ledger secara atomic.
- Data transaksi tidak dikirim ke database server pada operasi lokal MVP.
- Antarmuka responsif dan dapat digunakan melalui keyboard serta pembaca layar sesuai DBD.
- Klaim offline, installability, dan performa harus diberi status berdasarkan bukti verifikasi, bukan hanya keberadaan konfigurasi.
- Penghapusan account dan transfer terkait harus atomic agar tidak meninggalkan relasi transfer yang menunjuk account yang dinonaktifkan.

## 11. Acceptance Criteria Utama

### Pencatatan transaksi

- Nominal lebih besar dari nol dan berupa integer.
- Akun yang digunakan valid dan aktif.
- Kategori income/expense sesuai tipe transaksi.
- Saldo akun mencerminkan transaksi yang disimpan.

### Transfer

- Nominal lebih besar dari nol.
- Akun sumber dan tujuan berbeda.
- Saldo sumber mencukupi.
- Transfer ditolak jika saldo sumber tidak mencukupi dan pengguna mendapat peringatan.
- Transfer berhasil mengurangi saldo sumber dan menambah saldo tujuan sebagai satu operasi logical atomic.
- Transfer tidak mengubah net worth keseluruhan.

### Bills

- Judul tagihan wajib diisi.
- Nominal tagihan harus berupa integer Rupiah lebih besar dari nol.
- Due date wajib valid.
- Tagihan baru berstatus unpaid secara default.
- Pengguna dapat mengubah status tagihan menjadi paid atau unpaid.
- Saat ditandai paid, pengguna memilih akun pembayaran dan sistem otomatis membuat transaksi EXPENSE terkait yang memotong saldo riil akun.
- Saat ditandai unpaid kembali, transaksi EXPENSE terkait otomatis dihapus dan saldo akun dikembalikan.
- Hanya tagihan unpaid yang dikurangi dari Safe-to-Spend.

### CSV

- Seluruh transaksi diekspor.
- Nama file mengikuti `PetaUang_All_Transactions_YYYY-MM-DD.csv`.
- Header dan urutan kolom mengikuti BSD/IPD.
- File dapat dibuka oleh aplikasi spreadsheet umum.

## 12. Status Implementasi

Persyaratan produk tidak menyatakan bahwa seluruh fitur telah tersedia atau terverifikasi. Status implementasi aktual dicatat di `PROJECT_STATUS.md` dan IPD berdasarkan pemeriksaan source code serta hasil pengujian.
