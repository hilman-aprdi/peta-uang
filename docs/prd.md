# 📄 Product Requirement Document (PRD) — PetaUang

## 1. Overview

* **Nama Produk:** PetaUang

* **Deskripsi:** Aplikasi *Progressive Web App* (PWA) berbasis *browser-local database* (SQLite WASM / IndexedDB) untuk pengelolaan keuangan pribadi secara 100% *offline*, tanpa registrasi/login, dan mengutamakan privasi mutlak.

* **Ringkasan Produk:** PetaUang menyajikan navigasi finansial dengan memisahkan "Saldo Saat Ini" dan "Saldo Sesungguhnya" (*Safe-to-Spend*), membantu pengguna mencatat arus kas harian, mengelola perpindahan dana antar-akun, serta mengekspor seluruh data riwayat transaksi secara mandiri.

## 2. Background

Banyak aplikasi pencatat keuangan memerlukan pembuatan akun, koneksi internet, serta menyimpan data finansial sensitif di server pihak ketiga. Di sisi lain, sebagian besar aplikasi keuangan hanya menampilkan total saldo gabungan tanpa memberikan informasi kalkulasi riil tentang berapa uang yang sebenarnya aman untuk dibelanjakan setelah memperhitungkan seluruh kewajiban/alokasi.

## 3. Problem Statement

1. **Ilusi Saldo:** Pengguna merasa masih memiliki banyak uang karena hanya melihat akumulasi total saldo, padahal sebagian uang tersebut sudah terikat untuk tagihan atau alokasi kebutuhan esensial.

2. **Privasi Data:** Kekhawatiran pengguna akan kebocoran data keuangan pribadi ketika menggunakan layanan SaaS komersial di cloud.

3. **Hambatan Akses (Friction):** Keharusan untuk *sign up*, verifikasi email, atau konfigurasi *database server* sebelum bisa mulai mencatat keuangan harian.

## 4. Product Vision

Menjadi aplikasi navigasi keuangan pribadi yang paling cepat, ringan, 100% privat (*zero-server*), dan langsung memberikan kepastian mengenai kondisi keuangan riil pengguna kapan saja dan di mana saja.

## 5. Target Audience

* Masyarakat umum (pengguna *tech* maupun *non-tech*) yang membutuhkan pencatat keuangan cepat, simpel, dan gratis.

* Individu yang memprioritaskan privasi penuh tanpa perlu membuat akun atau melakukan login.

## 6. User Personas

* **Nama:** Budi (Pekerja / Freelancer)

* **Karakteristik:** Memiliki beberapa akun keuangan (kas, bank, e-wallet), ingin mengetahui sisa uang yang benar-benar aman dibelanjakan tanpa perlu pusing dengan *setup* server.

* **Kebutuhan:** Membuka aplikasi di HP/Laptop layaknya aplikasi *native*, mencatat transaksi dengan cepat, dan melihat ringkasan keuangan bulanan secara jernih.

## 7. Product Goals

1. Menyediakan aplikasi PWA yang dapat langsung diinstal di layar HP/Desktop (*Add to Home Screen*) dan berjalan penuh tanpa koneksi internet.

2. Menyajikan visualisasi saldo ganda pada dashboard: **Saldo Saat Ini (sebelum dikurangi)** dan **Saldo Sesungguhnya (setelah dikurangi seluruh kewajiban/alokasi)**.

3. Menyediakan alur pencatatan *Expense*, *Income*, *Account Transfer*, serta *Export All Transactions* yang presisi.

## 8. Scope

### In-Scope (MVP v1.0)

* Arsitektur PWA + SQLite Browser (Client-side local storage).

* Manajemen Akun Keuangan (Add Account).

* Pencatatan CRUD Expense & Income.

* Pencatatan Transfer Antar-Akun (Account Transfer).

* Dashboard Informasi Keuangan & Transaksi Terakhir.

* Filter Periode Bulan.

* Fitur *Export All Transactions* ke format CSV.

### Out-of-Scope (Ditunda / Tidak Dibuat)

* Sistem Auth/Login Form, User Roles, dan Cloud Server Database.

* Integrasi otomatis API Bank / E-Wallet sync.

* Fitur OCR / Scan Struk.

## 9. Functional Requirements

| ID | Modul | Deskripsi Kebutuhan Fungsional | 
| ----- | ----- | ----- | 
| **FR-01** | **Add Account** | Sistem dapat menambah akun keuangan baru (misal: Kas, Bank A, E-Wallet B) beserta nama akun, tipe akun, dan saldo awal (*initial balance*). | 
| **FR-02** | **Add / Edit / Delete Expense** | Sistem dapat mencatat, mengubah, dan menghapus pengeluaran. Form input mencakup opsi field:  • **Expense Title** (Judul pengeluaran)  • **Add Category** (Pilihan/tambah kategori)  • **Created On** (Tanggal transaksi)  • **Pay With** (Pilihan tipe/nama akun pembayaran) | 
| **FR-03** | **Add / Edit / Delete Income** | Sistem dapat mencatat, mengubah, dan menghapus pemasukan. Form input mencakup opsi field:  • **Income Title** (Judul pemasukan)  • **Add Category** (Pilihan/tambah kategori)  • **Created On** (Tanggal transaksi)  • **Deposit To / Account Types** (Pilihan tipe/nama akun penerima) | 
| **FR-04** | **Account Transfer** | Sistem dapat mencatat perpindahan dana dari Akun Asal (*From Account*) ke Akun Tujuan (*To Account*). Transaksi ini memperbarui saldo masing-masing akun tanpa dihitung sebagai Pemasukan/Pengeluaran global. | 
| **FR-05** | **Dashboard Info** | Dashboard wajib menampilkan:  1\. **Saldo Saat Ini** (Total akumulasi seluruh saldo akun sebelum dikurangi alokasi/kewajiban).  2\. **Saldo Sesungguhnya** (*Safe-to-Spend*, kalkulasi saldo aktual setelah dikurangi kewajiban/alokasi).  3\. **Info Income & Expense Bulanan** (Total akumulasi pemasukan dan pengeluaran bulan berjalan).  4\. **Transaksi Terakhir** (Daftar riwayat transaksi terbaru). | 
| **FR-06** | **Month Period Filter** | Sistem menyediakan dropdown/picker filter periode bulan untuk menampilkan data statistik dan daftar transaksi pada bulan tertentu. | 
| **FR-07** | **Export All Transactions** | Sistem menyediakan fungsi/tombol untuk mengekspor seluruh basis data riwayat transaksi ke dalam file `.csv` yang dapat diunduh langsung ke perangkat pengguna. | 

## 10. Non-Functional Requirements

* **Offline-First & Security:** 100% data disimpan di dalam basis data SQLite browser/IndexedDB di perangkat pengguna. Tidak ada data yang dikirimkan ke server luar.

* **Usability & Accessibility:** Responsif, mendukung mode PWA (*Installable*), serta antarmuka intuitif untuk pengisian form transaksi cepat di perangkat ponsel.

* **Performance:** *Load time* aplikasi instan (< 0.5 detik) karena seluruh aset berjalan secara lokal melalui *Service Worker*.

* **Data Integrity:** Setiap perubahan transaksi (tambah/edit/hapus/transfer) secara otomatis memperbarui *state* saldo akun secara konsisten (*atomic calculation*).

## 11. User Stories

1. *Sebagai pengguna*, saya ingin **menambahkan beberapa akun** (seperti Bank dan E-Wallet) agar bisa melacak sebaran uang saya.

2. *Sebagai pengguna*, saya ingin **mencatat pengeluaran** dengan mengisi judul, memilih kategori, tanggal (*Created On*), dan akun pembayaran (*Pay With*) secara presisi.

3. *Sebagai pengguna*, saya ingin **melihat Saldo Sesungguhnya di Dashboard**, agar tahu berapa uang yang benar-benar aman saya gunakan tanpa mengganggu dana yang sudah teralokasi.

4. *Sebagai pengguna*, saya ingin **membuat transfer antar-akun**, agar saldo di bank dan e-wallet saya tetap sinkron saat saya melakukan *top-up*.

5. *Sebagai pengguna*, saya ingin **memfilter transaksi berdasarkan periode bulan**, agar bisa meninjau riwayat keuangan di bulan tertentu.

6. *Sebagai pengguna*, saya ingin **mengeksport seluruh transaksi ke CSV**, agar saya memiliki salinan cadangan (*backup*) data keuangan saya di perangkat pribadi.

## 12. Acceptance Criteria

### Contoh AC: Input Expense / Income

* **GIVEN** pengguna membuka form *Add Expense*,

* **WHEN** pengguna mengisi *Expense Title*, memilih/menambah *Category*, menentukan tanggal pada *Created On*, dan memilih akun pada *Pay With*, lalu menekan simpan,

* **THEN** data transaksi tersimpan di database SQLite lokal browser,

* **AND** saldo akun yang dipilih pada *Pay With* berkurang sesuai nominal,

* **AND** total *Expense Bulanan* di Dashboard bertambah.

### Contoh AC: Export All Transactions

* **GIVEN** pengguna berada di halaman transaksi/pengaturan,

* **WHEN** pengguna mengeklik tombol **Export All Transactions**,

* **THEN** sistem mengonversi seluruh data transaksi di basis data lokal menjadi format CSV,

* **AND** browser otomatis mengunduh file bernama `PetaUang_All_Transactions_[Tanggal].csv`.

## 13. Success Metrics

1. **Zero Network Dependency:** Aplikasi dapat diakses dan digunakan penuh tanpa koneksi internet setelah *first load*.

2. **Data Consistency:** 100% kesesuaian antara histori transaksi, pemindahan akun, dan kalkulasi saldo akhir.

3. **Ease of Export:** Fitur ekspor data dapat dijalankan dalam 1 kali klik dan menghasilkan file CSV yang valid.

## 14. Risks & Assumptions

* **Risiko Clearing Browser Data:** Jika pengguna membersihkan *cache/storage* browser secara total tanpa pernah melakukan ekspor data, data lokal dapat terhapus.

  * *Mitigasi:* Sediakan banner/ingatan berkala di UI untuk menyarankan pengguna mengeklik tombol **Export All Transactions** secara rutin sebagai langkah *backup*.

* **Asumsi:** Pengguna menggunakan browser modern (Chrome, Safari, Edge, Firefox) yang mendukung PWA dan penyimpanan *IndexedDB/SQLite WASM*.