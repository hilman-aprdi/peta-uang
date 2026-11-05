# PetaUang — Product Roadmap

**Terakhir diperbarui:** 5 November 2026

## 1. Prinsip Roadmap

Roadmap membedakan pencapaian historis, kondisi implementasi saat ini, dan pekerjaan yang masih direncanakan. Fitur yang belum disetujui atau belum memiliki acceptance criteria tidak dianggap sebagai scope aktif.

## 2. Pencapaian Historis

Commit baseline yang diketahui:

`1f110fd — feat: complete MVP local-first ledger with PWA and CSV export`

Commit tersebut merupakan catatan historis dan tidak otomatis membuktikan seluruh acceptance criteria saat ini telah Verified.

| Area | Status saat ini |
|---|---|
| Fondasi Next.js/TypeScript | Implemented, belum Verified penuh |
| Local-First ledger | Sebagian Implemented, perlu validasi integrity |
| PWA | Implemented, browser verification belum selesai |
| CSV export | Implemented, acceptance verification masih diperlukan |
| Routing modul | Lima route target tersedia; responsive acceptance verification masih berjalan |
| Static build dan deployment | Verified melalui IPD-015 |

## 3. Prioritas Stabilisasi

| Prioritas | Pekerjaan | Hasil yang diharapkan |
|---|---|---|
| 1 | Integritas ledger | Validasi akun, kategori, integer, dan atomic behavior |
| 2 | Transfer | Saldo sumber cukup, rejection warning, dan zero-net-worth effect |
| 3 | Safe-to-Spend | `Current Balance - Total Unpaid Bills - Total Allocated Goals` konsisten di calculator dan dashboard |
| 4 | Bill Management | Lifecycle bill dan status paid/unpaid — Implemented, perlu verification |
| 5 | Dashboard dan Transaksi | Dashboard menampilkan transaksi hari ini; halaman Transaksi memiliki filter bulan dan toggle Semua Waktu — Implemented, perlu verification |
| 6 | CSV | Filename dan sembilan kolom canonical — Implemented, perlu verification |
| 7 | PWA | Service Worker dan ikon implemented; installability dan offline test perlu verification |
| 8 | Testing | Automated test 12 file/94 test lulus; acceptance browser masih diperlukan |
| 9 | Account deletion | Warning dan cascade transfer — Implemented, perlu acceptance UI IPD-017 |
| 10 | Cash Flow | Dashboard bulan berjalan; halaman Transaksi mengikuti periode atau Semua Waktu — Implemented IPD-018, perlu verifikasi |
| 11 | Kategori opsional | Form transaksi menerima kategori kosong dan menampilkan Uncategorized — Implemented IPD-019, perlu verifikasi |
| 12 | Goals | Alokasi dana virtual dan integrasi Safe-to-Spend — Implemented IPD-020, perlu acceptance UI |
| 13 | Financial Insight | Priority Inbox berbasis domain dengan D-1 cause-aware, W-2 minimal 1 transaksi, dan M-1 vs total penuh bulan lalu — Implemented IPD-021; acceptance browser diperlukan |

## 4. Fase Berikutnya

Setelah stabilisasi MVP dan acceptance browser selesai, pekerjaan dapat mencakup penyempurnaan UX, pencarian transaksi, laporan, dan kategori custom berdasarkan persetujuan serta acceptance criteria baru.

Bill Management diimplementasikan sebagai IPD-016 dan menunggu acceptance verification.

Goals dan Financial Insight Engine sudah diimplementasikan masing-masing sebagai IPD-020 dan IPD-021, sehingga tidak lagi berada di fase berikutnya; keduanya menunggu acceptance verification. Revisi Financial Insight Engine dan Priority Inbox telah disetujui owner, tetapi belum memiliki ID keputusan formal. Local PIN Protection, sinkronisasi cloud, integrasi bank, dan budgets tetap ditunda di luar MVP.

## 5. Kriteria Masuk Fase Berikutnya

- Alur transaksi utama teruji.
- Transfer menerapkan seluruh aturan BSD.
- Safe-to-Spend konsisten.
- CSV canonical valid.
- Route utama tersedia.
- PWA terverifikasi melalui pengujian browser.
- Tidak ada masalah kritis yang belum memiliki rencana.
- Status dokumentasi dan source code tidak saling bertentangan.

## 6. Tata Kelola

Perubahan produk, arsitektur, prioritas, atau scope memerlukan keputusan pemilik project dan harus dicatat di `PROJECT_DECISIONS.md` atau `PROJECT_HISTORY.md`. GitHub Issues dan Projects tidak diubah oleh rekonsiliasi ini.
