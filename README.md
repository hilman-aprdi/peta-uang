# PetaUang

> **Kenali uang Anda. Temukan arah Anda.**

PetaUang adalah aplikasi keuangan pribadi dengan pendekatan *local-first* yang membantu individu memahami, mengatur, dan mengelola keuangan sehari-hari.

Catat pemasukan dan pengeluaran, kelola akun dan tagihan, atur target tabungan, serta pahami kondisi keuangan Anda — semuanya dalam satu aplikasi.

Tanpa registrasi akun. Tanpa ketergantungan pada cloud. Data keuangan Anda tetap tersimpan di browser.

---

## Gambaran Umum

Mengelola keuangan pribadi seharusnya tidak rumit.

PetaUang menyediakan satu tempat untuk mencatat aktivitas keuangan, memantau saldo akun, mengelola kewajiban keuangan, dan memahami pola pengeluaran.

Dibangun dengan arsitektur **local-first**, PetaUang menyimpan data keuangan langsung di browser menggunakan IndexedDB. Pengguna dapat mulai mengelola keuangannya tanpa membuat akun atau bergantung pada database jarak jauh.

### Fitur Utama

- **Dashboard Keuangan** — Pantau saldo saat ini, Safe-to-Spend, arus kas bulanan, wawasan finansial, dan transaksi hari ini.
- **Pengelolaan Akun** — Buat dan kelola beberapa akun keuangan, termasuk uang tunai, rekening bank, dompet digital, dan investasi. Penyesuaian saldo saat ini dicatat sebagai transaksi penyesuaian.
- **Pengelolaan Transaksi** — Catat, ubah, dan hapus transaksi pemasukan maupun pengeluaran, dengan kategori opsional, catatan, tanggal, dan akun terkait. Transaksi tanpa kategori ditampilkan sebagai **Uncategorized**.
- **Transfer Antar-Akun** — Pindahkan dana antar-akun tanpa menghitung transfer sebagai pemasukan atau pengeluaran.
- **Pengelolaan Kategori** — Buat, ubah, dan nonaktifkan kategori tanpa menghapus referensi transaksi historis.
- **Pengelolaan Tagihan** — Buat dan kelola tagihan, catat status pembayarannya, dan perhitungkan tagihan yang belum dibayar dalam Safe-to-Spend.
- **Target Tabungan** — Buat target tabungan, alokasikan dana, tarik alokasi, dan catat pengeluaran langsung dari target.
- **Wawasan Finansial** — Tinjau wawasan harian, mingguan, dan bulanan yang dihasilkan secara deterministik berdasarkan data keuangan lokal.
- **Filter Transaksi** — Tinjau transaksi berdasarkan bulan atau gunakan **Semua Waktu** untuk melihat seluruh riwayat transaksi.
- **Ekspor CSV** — Ekspor catatan transaksi ke file CSV.
- **Progressive Web App (PWA)** — Menyediakan manifest aplikasi web, ikon aplikasi, dan dukungan Service Worker. Kemampuan instalasi dan penggunaan offline bergantung pada dukungan browser serta konfigurasi deployment dan belum diverifikasi pada seluruh browser target.

---

## Ringkasan Keuangan

PetaUang menggunakan beberapa perhitungan keuangan untuk membantu pengguna memahami dana yang tersedia.

### Safe-to-Spend

Safe-to-Spend menunjukkan perkiraan dana yang tersedia untuk digunakan setelah memperhitungkan tagihan yang belum dibayar dan dana yang dialokasikan ke target tabungan.

```text
Safe-to-Spend =
Saldo Saat Ini
- Total Tagihan Belum Dibayar
- Total Dana yang Dialokasikan ke Target
```

Membuat target tabungan tidak memindahkan saldo akun yang sebenarnya. Alokasi dana mengurangi bagian dana yang dianggap aman untuk dibelanjakan, sedangkan penarikan alokasi mengembalikannya. Pengeluaran dari target mencatat pengeluaran aktual sekaligus mengurangi alokasi target.

### Arus Kas

Arus kas menunjukkan selisih antara pemasukan dan pengeluaran. Transfer antar-akun tidak dihitung karena bukan pemasukan atau pengeluaran eksternal.

| Bagian | Periode |
|---|---|
| Dashboard | Bulan kalender berjalan |
| Transaksi | Bulan yang dipilih atau **Semua Waktu** |

Daftar transaksi di Dashboard terpisah dari ringkasan keuangan bulanan. Daftar tersebut menampilkan seluruh transaksi yang tanggalnya termasuk hari kalender lokal saat ini. Daftar tidak otomatis diperbarui tepat tengah malam kecuali halaman dirender ulang atau datanya berubah.

---

## Cara Kerja

### Arsitektur Local-First

PetaUang menggunakan penyimpanan berbasis browser, bukan backend terpusat.

```text
Interaksi Pengguna
       |
       v
Antarmuka Aplikasi
       |
       v
Layanan Aplikasi
       |
       v
Dexie.js
       |
       v
IndexedDB
```

Catatan keuangan disimpan secara lokal di browser melalui IndexedDB, sementara Dexie.js mengelola operasi database.

Dengan arsitektur ini, aplikasi tidak memerlukan:

- Registrasi atau autentikasi pengguna.
- Database aplikasi jarak jauh.
- Sinkronisasi data keuangan melalui cloud.

**Penting:** Penyimpanan lokal tidak sama dengan penyimpanan permanen atau pencadangan otomatis. Menghapus data browser atau berpindah perangkat dapat membuat catatan yang ada tidak lagi tersedia.

---

## Teknologi

| Teknologi | Kegunaan |
|---|---|
| Next.js App Router | Framework aplikasi, routing, dan static export |
| React | Antarmuka pengguna |
| TypeScript | Keamanan tipe |
| Tailwind CSS v4 | Styling |
| IndexedDB | Penyimpanan database lokal |
| Dexie.js | Pengelolaan IndexedDB |
| dexie-react-hooks | Query database reaktif |
| Vitest | Pengujian otomatis |
| fake-indexeddb | Lingkungan IndexedDB untuk pengujian |
| Lucide React | Ikon antarmuka |

---

## Memulai

### Prasyarat

- Node.js versi 20.9 atau lebih baru
- npm

### Instalasi

Clone repository:

```bash
git clone https://github.com/hilman-aprdi/peta-uang.git
```

Masuk ke direktori proyek:

```bash
cd peta-uang
```

Instal dependensi:

```bash
npm install
```

Jalankan development server:

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser. Saat ini aplikasi tidak memerlukan environment variable.

### Perintah yang Tersedia

| Perintah | Keterangan |
|---|---|
| `npm run dev` | Menjalankan development server |
| `npm run lint` | Menjalankan ESLint |
| `npm test` | Menjalankan pengujian otomatis |
| `npm run test:watch` | Menjalankan pengujian dalam mode watch |
| `npx tsc --noEmit` | Menjalankan pemeriksaan tipe TypeScript |
| `npm run build` | Membuat static export untuk production |

### Production Build

PetaUang menggunakan static export Next.js melalui konfigurasi `output: "export"`.

Jalankan:

```bash
npm run build
```

File hasil build akan tersedia di direktori `out/` dan dapat di-deploy ke layanan hosting statis yang kompatibel. Perintah `npm run start` tidak digunakan untuk menyajikan hasil static export.

---

## Panduan Aplikasi

| Bagian | Keterangan |
|---|---|
| Dashboard | Melihat ringkasan keuangan, wawasan, dan transaksi hari ini |
| Dompet | Mengelola akun keuangan dan saldo |
| Transaksi | Mencatat dan meninjau pemasukan, pengeluaran, serta transfer |
| Tagihan | Mengelola tagihan dan status pembayaran |
| Target | Mengelola target tabungan dan alokasi dana |

Pengelolaan kategori dan ekspor CSV tersedia dari bagian Transaksi.

---

## Data & Privasi

PetaUang dirancang dengan mengutamakan kepemilikan data lokal.

| Aspek | Implementasi Saat Ini |
|---|---|
| Penyimpanan data | IndexedDB di browser |
| Pustaka database | Dexie.js |
| Nama database | `PetaUangDB` |
| Autentikasi | Tidak diperlukan |
| Database jarak jauh | Belum diimplementasikan |
| Sinkronisasi cloud | Belum diimplementasikan |
| Ekspor CSV | Hanya catatan transaksi |
| Cadangan seluruh data aplikasi | Belum tersedia |

### Batasan Penting

- Data hanya tersedia pada profil browser dan perangkat tempat data tersebut disimpan.
- Menghapus data situs atau profil browser dapat menyebabkan kehilangan data.
- Data tidak disinkronkan secara otomatis antarperangkat.
- Ekspor CSV tidak mencakup seluruh data aplikasi, seperti akun, kategori, tagihan, target tabungan, atau riwayat alokasi.
- Instalasi PWA dan penggunaan offline bergantung pada dukungan browser serta konfigurasi deployment.

Pengguna sebaiknya mengambil langkah pencegahan yang sesuai saat mengelola catatan keuangan penting.

---

## Dokumentasi Proyek

Untuk informasi lebih rinci tentang persyaratan produk, aturan bisnis, arsitektur, desain database, keputusan teknis, dan status pengembangan, lihat [Dokumentasi Proyek](docs/INDEX.md).

---

## Ucapan Terima Kasih

PetaUang adalah proyek open-source yang dibuat untuk membantu pengelolaan keuangan pribadi menjadi lebih mudah dipahami, teratur, dan dapat diakses.

**PetaUang — Kenali uang Anda. Temukan arah Anda.**

---

## Lisensi

Proyek ini menggunakan [Lisensi MIT](LICENSE).
