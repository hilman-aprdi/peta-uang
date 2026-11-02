# PetaUang
[!PetaUang Icon](public/icon-512.png)
> **Know your money. Find your direction.**

PetaUang adalah aplikasi pengelolaan keuangan pribadi berbasis *local-first* untuk mencatat pemasukan, pengeluaran, transfer antar-akun, serta mengelola tagihan. Dashboard menyajikan ringkasan saldo akun, Safe-to-Spend, dan arus kas berdasarkan bulan yang dipilih.

## Overview

Mengelola keuangan pribadi seharusnya tidak menjadi sesuatu yang rumit.

PetaUang membantu individu memahami kondisi keuangan sehari-hari melalui satu tempat untuk mencatat transaksi, memantau saldo akun, mengelola anggaran, dan mengawasi kewajiban pembayaran.

Dengan pendekatan *local-first*, PetaUang tidak memerlukan proses registrasi atau login. Seluruh catatan keuangan disimpan secara lokal di browser menggunakan IndexedDB melalui Dexie.js. Saldo dan ringkasan dashboard dihitung berdasarkan data yang tersimpan tersebut.

## Fitur Utama

- **Dashboard Keuangan:** Menampilkan Current Balance, Safe-to-Spend, Cash In, Cash Out, Net Cash Flow bulanan, dan transaksi terbaru.
- **Pengelolaan Akun:** Membuat dan mengubah akun seperti uang tunai, rekening bank, dompet digital, dan investasi. Akun dapat dinonaktifkan dengan peringatan. Transaksi transfer yang melibatkan akun tersebut akan dihapus, sedangkan catatan pemasukan dan pengeluaran tetap dipertahankan.
- **Pengelolaan Transaksi:** Mencatat, mengubah, dan menghapus transaksi pemasukan maupun pengeluaran, lengkap dengan kategori, catatan, tanggal, dan akun terkait.
- **Transfer Antar-Akun:** Memindahkan saldo antar-akun. Transfer hanya dapat dilakukan jika saldo akun sumber mencukupi dan tidak dihitung sebagai pemasukan maupun pengeluaran.
- **Pengelolaan Kategori:** Membuat, mengubah, dan mengelola kategori beserta ikonnya. Penonaktifan kategori tetap mempertahankan referensi transaksi historis. Transaksi tanpa kategori ditampilkan sebagai **Uncategorized**.
- **Pengelolaan Tagihan:** Membuat, mengubah, menghapus, serta memperbarui status pembayaran tagihan menjadi lunas atau belum lunas. Tagihan yang belum dibayar menjadi pengurang dalam perhitungan Safe-to-Spend.
- **Filter Bulanan:** Memilih bulan tertentu untuk meninjau ringkasan dashboard dan transaksi.
- **Ekspor CSV:** Mengunduh catatan transaksi dalam format CSV dengan sembilan kolom.
- **Progressive Web App (PWA):** Mendukung manifest web, ikon aplikasi, dan Service Worker. Kemampuan instalasi serta penggunaan offline bergantung pada browser dan konfigurasi deployment, sehingga perlu diuji pada lingkungan target.

### Perhitungan Keuangan

**Safe-to-Spend**

Menunjukkan estimasi dana yang masih tersedia untuk digunakan setelah memperhitungkan seluruh tagihan yang belum dibayar.

```text
Current Balance - Total Unpaid Bills
```

**Cash Flow**

Arus kas dihitung berdasarkan transaksi pada bulan yang dipilih. Perhitungannya mencakup pemasukan dan pengeluaran, sedangkan transfer antar-akun tidak diperhitungkan karena bukan merupakan pemasukan atau pengeluaran.

## Tech Stack

PetaUang dibangun menggunakan teknologi berikut:

| Teknologi | Kegunaan |
|---|---|
| Next.js App Router | Framework aplikasi, pengelolaan rute, dan static export |
| React | Membangun antarmuka pengguna |
| TypeScript | Menambahkan sistem tipe dan pemeriksaan kode |
| Tailwind CSS | Styling dan pengembangan antarmuka responsif |
| IndexedDB | Penyimpanan database lokal di browser |
| Dexie.js | Mengelola akses dan transaksi IndexedDB |
| dexie-react-hooks | Menghubungkan data IndexedDB dengan antarmuka secara reaktif |
| Vitest | Menjalankan pengujian otomatis |
| fake-indexeddb | Menyediakan lingkungan IndexedDB untuk pengujian |
| Lucide React | Menyediakan ikon antarmuka |

## Getting Started

Ikuti langkah-langkah berikut untuk menjalankan PetaUang di lingkungan lokal.

### Prasyarat

Pastikan perangkat telah memiliki:

- Node.js yang kompatibel dengan versi Next.js yang digunakan (Next.js 16 membutuhkan Node.js minimal 20.9).
- npm.

### Instalasi

1. Clone repository:

   ```bash
   git clone https://github.com/hilman-aprdi/peta-uang.git
   ```

2. Masuk ke direktori proyek:

   ```bash
   cd peta-uang
   ```

3. Instal seluruh dependensi:

   ```bash
   npm install
   ```

4. Jalankan development server:

   ```bash
   npm run dev
   ```

5. Buka aplikasi melalui browser:

   [http://localhost:3000](http://localhost:3000)

Saat ini, aplikasi tidak memerlukan konfigurasi environment variables.

### Perintah yang Tersedia

| Perintah | Fungsi |
|---|---|
| `npm run dev` | Menjalankan development server |
| `npm run lint` | Menjalankan ESLint |
| `npm test` | Menjalankan pengujian otomatis |
| `npm run test:watch` | Menjalankan pengujian dalam mode watch |
| `npx tsc --noEmit` | Memeriksa tipe data TypeScript |
| `npm run build` | Membuat production build berupa static export |

Proyek ini menggunakan konfigurasi `output: "export"` pada `next.config.ts`. Hasil build akan disimpan di direktori `out/` dan dapat di-deploy ke layanan hosting statis.

Perlu diperhatikan bahwa `npm run start` bukan perintah untuk menyajikan hasil static export tersebut.

## Panduan Penggunaan

Berikut langkah dasar untuk mulai menggunakan PetaUang:

1. **Buka aplikasi.** Tidak diperlukan proses registrasi maupun login.
2. **Buat akun keuangan.** Buka menu **Dompet** untuk menambahkan akun dan menentukan saldo awal.
3. **Catat transaksi.** Buka menu **Transaksi** untuk mencatat pemasukan, pengeluaran, atau transfer antar-akun. Kategori bersifat opsional untuk pemasukan dan pengeluaran. Transaksi tanpa kategori akan ditampilkan sebagai **Uncategorized**.
4. **Kelola kategori.** Gunakan menu **Kelola Kategori** pada halaman transaksi untuk membuat, mengubah, atau menonaktifkan kategori.
5. **Kelola tagihan.** Buka menu **Tagihan** untuk membuat dan mengelola tagihan serta memperbarui status pembayarannya.
6. **Pantau kondisi keuangan.** Kembali ke dashboard dan pilih bulan yang ingin ditinjau untuk melihat Cash Flow bulanan serta transaksi terbaru. Current Balance dan Safe-to-Spend juga tersedia pada dashboard.
7. **Ekspor transaksi.** Gunakan tombol **Export CSV** pada halaman transaksi untuk mengunduh catatan transaksi.

## Data & Privasi

PetaUang menggunakan pendekatan penyimpanan data lokal (*local-first*). Informasi keuangan disimpan di browser menggunakan IndexedDB yang dikelola melalui Dexie.js.

Beberapa hal yang perlu diketahui:

- Data akun, kategori, transaksi, dan tagihan disimpan di database IndexedDB browser dengan nama `PetaUangDB`.
- Aplikasi belum menggunakan autentikasi akun, database server, maupun sinkronisasi cloud.
- Ekspor CSV hanya mencakup data transaksi, bukan seluruh data akun, kategori, tagihan, atau kondisi aplikasi.
- Penyimpanan browser bersifat spesifik terhadap profil browser dan perangkat yang digunakan.
- Menghapus data situs, menghapus profil browser, atau berpindah perangkat dapat menyebabkan data lokal tidak lagi tersedia.
- Aplikasi belum menyediakan mekanisme pemulihan data melalui server.

Simpan salinan data penting secara berkala. Perlu diingat bahwa file CSV yang tersedia bukan merupakan cadangan lengkap seluruh data aplikasi.

## Batasan Aplikasi

Sebagai aplikasi yang menggunakan pendekatan *local-first*, PetaUang memiliki beberapa batasan:

- Belum mendukung sinkronisasi data antarperangkat.
- Belum menyediakan penyimpanan atau pencadangan otomatis ke cloud.
- Data bergantung pada penyimpanan browser yang digunakan.
- Ekspor CSV belum dapat digunakan untuk memulihkan seluruh kondisi aplikasi.
- Perilaku instalasi PWA dan akses offline bergantung pada browser serta konfigurasi deployment.

## Lisensi

Informasi lisensi proyek belum ditetapkan karena repository saat ini belum memiliki file `LICENSE`.

Penggunaan, modifikasi, dan distribusi ulang kode harus mengikuti lisensi yang nantinya ditentukan oleh pemilik proyek.

## Kontribusi

Kontribusi untuk pengembangan PetaUang terbuka bagi siapa saja yang ingin membantu meningkatkan kualitas proyek.

Jika ingin berkontribusi, ikuti langkah berikut:

1. Fork repository ini.
2. Buat branch baru untuk perubahan yang akan dikerjakan.
3. Implementasikan perubahan dan tambahkan atau perbarui pengujian jika diperlukan.
4. Jalankan pemeriksaan berikut:

   ```bash
   npm test
   npx tsc --noEmit
   npm run lint
   ```

5. Buat Pull Request dengan deskripsi perubahan yang jelas serta hasil pemeriksaan yang telah dilakukan.

Sebelum mengajukan perubahan terkait produk atau arsitektur, silakan pelajari dokumentasi proyek melalui [`docs/INDEX.md`](docs/INDEX.md).

## Acknowledgements

PetaUang dikembangkan sebagai proyek open-source dengan tujuan membuat pengelolaan keuangan pribadi lebih mudah dipahami, terorganisasi, dan dapat diakses oleh siapa saja.

**PetaUang — Know your money. Find your direction.**

## Lisensi

PetaUang menggunakan MIT License.
Lihat file [LICENSE](LICENSE) untuk informasi selengkapnya.
