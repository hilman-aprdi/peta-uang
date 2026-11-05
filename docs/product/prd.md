# Product Requirements Document (PRD) — PetaUang

## 1. Ringkasan Produk

PetaUang adalah aplikasi pengelolaan keuangan pribadi berbasis **Local-First Progressive Web App**. Data utama disimpan di perangkat pengguna menggunakan **IndexedDB** melalui **Dexie.js**. MVP tidak menggunakan database server, akun pengguna, login, maupun layanan autentikasi eksternal.

Produk membantu pengguna mencatat pemasukan, pengeluaran, dan transfer antar-akun; melihat saldo; menghitung Safe-to-Spend; mengelola target tabungan virtual; menerima wawasan finansial; serta mengekspor riwayat transaksi.

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
- Manajemen akun keuangan, termasuk penyesuaian saldo saat ini melalui transaksi Adjust Balance.
- Pencatatan income dan expense.
- Pencatatan transfer antar-akun.
- Manajemen tagihan dan status paid/unpaid.
- Dashboard ringkasan saldo, Safe-to-Spend, Cash Flow bulan berjalan, dan transaksi hari ini.
- Ringkasan Cash Flow pada halaman Transaksi berdasarkan periode terpilih atau Semua Waktu.
- Filter periode bulan dan opsi Semua Waktu pada halaman Transaksi.
- Target tabungan virtual (Goals) beserta alokasi, penarikan, dan pembelanjaan dari pos dana.
- Wawasan finansial in-memory untuk periode Harian, Mingguan, dan Bulanan.
- Ekspor seluruh transaksi ke CSV.
- PWA dan dukungan offline sesuai hasil verifikasi implementasi.

### Di luar MVP atau ditunda

- Registrasi akun, login, dan autentikasi eksternal.
- Local PIN Protection atau penguncian aplikasi lokal.
- Database server dan sinkronisasi cloud.
- Sinkronisasi otomatis bank/e-wallet.
- OCR atau pemindaian struk.
- Budgets.
- Fitur lain yang belum memiliki persyaratan dan kriteria penerimaan.

## 6. Struktur Routing Produk

Modul utama menggunakan route terpisah:

| Route | Modul |
|---|---|
| `/` | Dashboard |
| `/transactions` | Transaksi |
| `/accounts` | Akun (label navigasi **Dompet**) |
| `/bills` | Tagihan (label navigasi **Tagihan**) |
| `/goals` | Target tabungan dan alokasi dana (label navigasi **Target**) |

Route `/settings` tidak tersedia dan tidak memiliki alias kompatibilitas.

Kontrol sekunder seperti filter bulan dan toggle **Semua Waktu** berada di dalam modul Transaksi dan tidak menggantikan route utama.

## 7. Persyaratan Fungsional

| ID | Modul | Persyaratan |
|---|---|---|
| FR-01 | Account | Pengguna dapat menambah akun dengan nama, tipe, dan saldo awal. |
| FR-02 | Expense | Pengguna dapat mencatat, mengubah, dan menghapus expense. |
| FR-03 | Income | Pengguna dapat mencatat, mengubah, dan menghapus income. |
| FR-04 | Transfer | Pengguna dapat memindahkan dana antar-akun dengan aturan transfer pada BSD. |
| FR-05 | Dashboard | Dashboard menampilkan Current Balance, Safe-to-Spend, ringkasan Cash Flow bulan berjalan, wawasan finansial, dan transaksi hari ini. |
| FR-06 | Period Filter | Pengguna dapat memilih periode bulan, mengaktifkan/menonaktifkan mode Semua Waktu, dan kembali ke bulan berjalan pada halaman Transaksi. |
| FR-07 | CSV Export | Pengguna dapat mengekspor seluruh transaksi menggunakan nama file dan schema CSV canonical. |
| FR-08 | Bills | Pengguna dapat menambah, mengubah, menghapus, dan menandai tagihan sebagai paid atau unpaid. |
| FR-09 | Account deletion | Pengguna dapat menghapus account kapan saja setelah menerima warning; transfer terkait account ikut dihapus, sedangkan income/expense tetap dipertahankan. |
| FR-10 | Cash Flow | Dashboard menampilkan Cash In, Cash Out, dan Net Cash Flow bulan berjalan; halaman Transaksi menampilkan nilai yang sama untuk periode terpilih atau Semua Waktu. Transfer antar-akun tidak dihitung. |
| FR-11 | Kategori transaksi | Kategori opsional saat mencatat income/expense. Tanpa pilihan kategori, transaksi berstatus Uncategorized. Pengguna dapat melakukan CRUD kategori custom. |
| FR-12 | Dashboard navigation | Dashboard menyediakan tombol untuk membuka halaman `/transactions`. |
| FR-13 | Goals | Pengguna dapat membuat target tabungan virtual, mengalokasikan dana, menarik dana, dan mencatat pembelanjaan dari pos target. |
| FR-14 | Account adjustment | Saat mengedit akun, pengguna dapat menetapkan Saldo Saat Ini; selisih dicatat sebagai transaksi Adjust Balance tanpa mengubah `initial_balance`. |
| FR-15 | Financial Insight | Dashboard menampilkan Priority Inbox berbasis domain (`SALDO`, `TAGIHAN`, `PENGELUARAN`, `TARGET`, `DATA`) yang menggabungkan wawasan Harian, Mingguan, dan Bulanan dari data lokal. Urgensi tampil sebagai badge dan periode sebagai metadata kecil. D-1 mendiagnosis penyebab Safe-to-Spend negatif, W-2 mendeteksi transaksi `EXPENSE`/`INCOME` non-transfer tanpa kategori, dan M-1 membandingkan kategori bulan berjalan dengan total penuh bulan lalu. |

## 8. Aturan Safe-to-Spend

Untuk MVP:

`Safe-to-Spend = Current Balance - Total Unpaid Bills - Total Allocated Goals`

Total Allocated Goals adalah jumlah dana yang dialokasikan ke Goal non-deleted, termasuk Goal ACTIVE, COMPLETED, dan ARCHIVED yang masih memiliki saldo. Alokasi Goal tidak mengubah saldo kas akun. Pembelanjaan dari Goal mencatat transaksi `EXPENSE` riil sekaligus mengurangi alokasi Goal, sehingga dana tidak dipotong dua kali. Aturan domain lengkap berada di BSD.

## 9. Cash Flow

Cash Flow adalah ringkasan pergerakan uang dari transaksi income dan expense. Nilai yang ditampilkan:

- Cash In: jumlah transaksi `INCOME` pada cakupan periode.
- Cash Out: jumlah transaksi `EXPENSE` pada cakupan periode.
- Net Cash Flow: `Cash In - Cash Out`.

Cakupan periode berbeda menurut tampilan:

- **Dashboard:** selalu memakai transaksi bulan berjalan. Dashboard tidak memiliki filter periode yang dapat diubah pengguna.
- **Halaman Transaksi:** memakai periode bulan yang dipilih, atau seluruh transaksi saat mode **Semua Waktu** aktif.

Transaksi `TRANSFER` dikecualikan karena hanya memindahkan dana di antara account milik pengguna dan bukan pemasukan atau pengeluaran eksternal. Perhitungan dilakukan di sisi client dari data transaksi lokal; hasil agregat tidak disimpan terpisah dan tidak memerlukan API atau database server.

## 10. Dashboard dan Halaman Transaksi

- Dashboard menampilkan transaksi pada hari kalender lokal perangkat saja. Transaksi kemarin dan transaksi bertanggal masa depan tidak ditampilkan.
- Jika belum ada transaksi hari ini, Dashboard menampilkan empty state.
- Daftar transaksi Dashboard menampilkan seluruh transaksi hari ini dan menyediakan tombol menuju `/transactions`.
- Halaman Transaksi mempertahankan filter periode bulan dan opsi **Semua Waktu** secara independen dari Dashboard.
- Tombol **Semua Waktu** berfungsi sebagai toggle. Saat dinonaktifkan, halaman kembali ke bulan berjalan. Tombol **Bulan Ini** juga tersedia untuk reset.
- Pembuatan, pengubahan, dan penghapusan transaksi tercermin secara reaktif pada kedua tampilan.

## 11. Persyaratan Non-Fungsional

- Nominal keuangan disimpan sebagai integer Rupiah utuh.
- Operasi transaksi dan transfer menjaga konsistensi ledger secara atomic.
- Data transaksi tidak dikirim ke database server pada operasi lokal MVP.
- Antarmuka responsif dan dapat digunakan melalui keyboard serta pembaca layar sesuai DBD.
- Klaim offline, installability, dan performa harus diberi status berdasarkan bukti verifikasi, bukan hanya keberadaan konfigurasi.
- Penghapusan account dan transfer terkait harus atomic agar tidak meninggalkan relasi transfer yang menunjuk account yang dinonaktifkan.

## 12. Acceptance Criteria Utama

### Pencatatan transaksi

- Nominal lebih besar dari nol dan berupa integer.
- Akun yang digunakan valid dan aktif.
- Kategori income/expense sesuai tipe transaksi.
- Saldo akun mencerminkan transaksi yang disimpan.

### Dashboard dan halaman Transaksi

- Dashboard tidak menampilkan kontrol filter periode.
- Dashboard hanya menampilkan transaksi yang tanggal kalender lokalnya sama dengan hari ini.
- Transaksi kemarin dan transaksi bertanggal masa depan tidak muncul di Dashboard.
- Empty state tampil jika tidak ada transaksi hari ini.
- Tombol navigasi Dashboard membuka `/transactions`.
- Halaman Transaksi tetap memiliki filter bulan dan mode Semua Waktu yang independen dari Dashboard.
- Toggle Semua Waktu dapat dinonaktifkan dan mengembalikan halaman ke bulan berjalan.
- Income, Expense, dan Net Cash Flow halaman Transaksi mengikuti periode terpilih.
- Aksi create, edit, dan delete transaksi tercermin pada kedua tampilan.

### Goals

- Alokasi Goal mengurangi Safe-to-Spend tanpa mengubah saldo kas akun.
- Penarikan mengembalikan dana ke Safe-to-Spend.
- Pembelanjaan dari Goal mencatat `EXPENSE` riil dan mengurangi alokasi Goal secara atomic.
- Alokasi tidak boleh melebihi Safe-to-Spend yang tersedia.
- Goal dengan sisa alokasi tidak dapat dihapus atau diarsipkan.
- Edit dan delete transaksi yang terhubung Goal merekonsiliasi alokasi.

### Account adjustment

- Mengubah Saldo Saat Ini membuat transaksi `Adjust Balance` sesuai selisih.
- `initial_balance` tidak berubah.
- Menghapus transaksi Adjust Balance mengembalikan saldo ledger ke nilai sebelumnya.

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

### Financial Insight

- Dashboard menampilkan seluruh insight actionable dalam satu Priority Inbox tanpa batas jumlah kartu.
- Identitas kartu adalah domain masalah; urgensi tampil sebagai badge dan periode sebagai metadata kecil.
- Periode yang stabil atau belum memiliki data diringkas menjadi chip, bukan kartu penuh.
- D-1 mendiagnosis penyebab Safe-to-Spend negatif dan menampilkan Saldo Kas, Tagihan Belum Dibayar, serta Dana Pos Target secara terpisah.
- CTA D-1 mengarah ke tagihan bila tagihan menjadi penyebab, ke target bila hanya dana pos target yang menyebabkan defisit, dan ke transaksi bila hanya saldo kas yang negatif.
- W-2 terpicu dengan minimal 1 transaksi `EXPENSE` atau `INCOME` non-transfer tanpa kategori dan tetap terlihat saat W-1 juga terpicu.
- M-1 hanya terpicu bila total kategori bulan berjalan lebih besar dari total penuh kategori yang sama pada bulan lalu, dengan baseline bulan lalu minimal Rp100.000 dan minimal 1 transaksi kategori bulan berjalan.

### CSV

- Seluruh transaksi diekspor.
- Nama file mengikuti `PetaUang_All_Transactions_YYYY-MM-DD.csv`.
- Header dan urutan kolom mengikuti BSD/IPD.
- File dapat dibuka oleh aplikasi spreadsheet umum.

## 13. Status Implementasi

Persyaratan produk tidak menyatakan bahwa seluruh fitur telah tersedia atau terverifikasi. Status implementasi aktual dicatat di `PROJECT_STATUS.md` dan IPD berdasarkan pemeriksaan source code serta hasil pengujian.
