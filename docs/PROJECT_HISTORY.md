# Riwayat Pengembangan PetaUang

Dokumen ini mencatat peristiwa historis dan keputusan yang telah dibuat. Ia tidak menggantikan status implementasi pada `PROJECT_STATUS.md`.

## 1. Linimasa

### Inisialisasi

- Repository dan fondasi Next.js dibuat.
- TypeScript, React, styling, dan alur kerja Git disiapkan.

### Baseline MVP Historis

Commit yang diketahui:

`1f110fd — feat: complete MVP local-first ledger with PWA and CSV export`

Deskripsi commit mencatat Local-First Ledger, PWA, dan CSV export. Catatan tersebut merupakan milestone historis; verifikasi kondisi aktual dijelaskan di `PROJECT_STATUS.md`.

### Rekonstruksi Dokumentasi

Pada 1 November 2026, dokumentasi yang belum terlacak Git pernah terhapus dan kemudian direkonstruksi. Rekonstruksi ini selanjutnya direkonsiliasi berdasarkan keputusan DEC-001 sampai DEC-012 dan pemeriksaan source aktual.

## 2. Keputusan Historis yang Masih Berlaku

- Data utama menggunakan Local-First storage.
- Database MVP menggunakan IndexedDB melalui Dexie.js.
- Tidak ada database server untuk operasi lokal MVP.
- Export transaksi merupakan bagian dari scope MVP.
- Perubahan penting harus dicatat dan tidak boleh mengubah requirement secara diam-diam.

## 3. Catatan Pekerjaan

Issue #2 mencatat kebutuhan sorting transaksi secara kronologis berdasarkan `transaction_date` dengan transaksi terbaru di posisi teratas. Status pekerjaan harus dibuktikan melalui source, test, dan riwayat Git; dokumentasi ini tidak menyatakan issue tersebut selesai.

## 4. Rekonsiliasi Dokumentasi — 1 November 2026

Rekonsiliasi menetapkan:

- IndexedDB + Dexie.js sebagai arsitektur database.
- Zero-authentication untuk MVP tanpa Local PIN.
- Safe-to-Spend sebagai Current Balance dikurangi Unpaid Bills.
- Aturan transfer dengan saldo sumber yang cukup dan rejection warning.
- Filename dan schema CSV canonical.
- Route utama `/`, `/transactions`, `/accounts`, `/settings` (kemudian diubah: `/settings` dihapus dan `/goals` ditambahkan melalui DEC-018 dan DEC-019).
- Status IPD dibedakan antara Implemented dan Verified.
- Gradient hanya aksen dekoratif terbatas.
- `next.config.ts` sebagai konfigurasi aktual.
- Struktur direktori berada di luar scope rekonsiliasi.

Detail traceability berada di `docs/PROJECT_DECISIONS.md`.

## 5. Pemeliharaan Riwayat

Setiap entri baru mencatat tanggal, perubahan atau keputusan, alasan, referensi issue/commit bila ada, dan perbedaan antara rencana, implementasi, serta verifikasi.

### Scope Update — 2 November 2026

- Bill Management diterima sebagai scope MVP dan dilacak pada IPD-016.
- IPD-008 Financial Overview diverifikasi secara manual pada formula saat itu; formula kemudian diperbarui melalui DEC-018.
- Safe-to-Spend menggunakan `Current Balance - Total Unpaid Bills`; Goal Allocations masih ditunda pada tanggal ini (kemudian diaktifkan melalui DEC-018 dan dicatat pada entri 4 November 2026).

### Implementasi Goals dan Insight — 4 November 2026

- Goals dan Goal Allocations diimplementasikan sebagai pos dana virtual pada Dexie version 5.
- Safe-to-Spend diperbarui menjadi `Current Balance - Total Unpaid Bills - Total Allocated Goals`, menggantikan DEC-003.
- Financial Insight Engine diimplementasikan sebagai evaluasi in-memory tiga periode tanpa perubahan schema.
- Penyesuaian Saldo Saat Ini dicatat sebagai transaksi `Adjust Balance`.

### Revisi Dashboard dan Transaksi — 4 November 2026

- Route `/settings` dihapus sepenuhnya tanpa alias kompatibilitas.
- Filter periode Dashboard dihapus; Dashboard hanya menampilkan transaksi hari ini berdasarkan kalender lokal dan tetap memakai Cash Flow bulan berjalan.
- Dashboard menambahkan tombol navigasi ke `/transactions`.
- Halaman Transaksi mempertahankan filter bulan independen, toggle **Semua Waktu**, reset **Bulan Ini**, dan ringkasan Net Cash Flow.
- Utility tanggal lokal dan automated test ditambahkan.
- Keterbatasan diketahui: pergantian hari tengah malam tidak otomatis menyegarkan daftar transaksi hari ini.
- Keputusan lengkap dicatat sebagai DEC-019.

### Perbaikan Tanggal Jatuh Tempo Bill dan Teks Insight Harian — 5 November 2026

- Tanggal jatuh tempo pada modal bill dan default tanggal pembayaran memakai key kalender lokal, sehingga timestamp tengah malam lokal tidak tampil mundur satu hari akibat konversi UTC.
- Rule insight harian `IMMEDIATE_BILLS_DUE` tetap mendeteksi tagihan H+0 s.d. H+2, tetapi teks observasinya kini dihitung dari tanggal jatuh tempo terdekat: `hari ini`, `besok`, atau `dalam 2 hari`.
- Bila beberapa tagihan memiliki tanggal jatuh tempo berbeda, teks menyebutkan rentangnya; evidence memakai tagihan dengan jatuh tempo terdekat.
- Automated test untuk daily rules dan regresi tanggal lokal ditambahkan. Tidak ada perubahan schema maupun perilaku deteksi di luar teks observasi.

### Revisi Financial Insight Engine dan Priority Inbox — 5 November 2026

- Dashboard mengganti tiga kartu periode dengan Priority Inbox berbasis domain (`SALDO`, `TAGIHAN`, `PENGELUARAN`, `TARGET`, `DATA`). Urgensi menjadi badge dan periode menjadi metadata kecil.
- Seluruh insight actionable ditampilkan tanpa batas jumlah dan diurutkan berdasarkan urgensi, lalu nominal dampak. Periode stabil atau menunggu data diringkas menjadi chip.
- D-1 menjadi cause-aware: diagnosis membedakan tagihan, dana pos target, keduanya, atau saldo kas negatif; evidence menampilkan Saldo Kas, Tagihan Belum Dibayar, dan Dana Pos Target secara terpisah.
- W-2 kini terpicu dengan minimal 1 transaksi `EXPENSE` atau `INCOME` non-transfer tanpa kategori dan tetap tampil saat W-1 terpicu.
- M-1 membandingkan total kategori bulan berjalan dengan total penuh kategori yang sama bulan lalu, memakai comparator ketat `>`, baseline Rp100.000, dan minimal 1 transaksi kategori bulan berjalan.
- D-2 dan W-1 tetap terpisah meskipun sama-sama memakai domain `TAGIHAN`.
- Perilaku ini disetujui owner dan dicatat di `PROJECT_DECISIONS.md` tanpa ID keputusan formal. Tidak ada perubahan schema, dependensi, atau cakupan Cash Flow Dashboard.
