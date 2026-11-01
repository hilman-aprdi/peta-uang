# PetaUang — Product Roadmap

**Terakhir diperbarui:** 1 November 2026

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
| PWA | Sebagian Implemented, belum Verified |
| CSV export | Implemented, schema canonical belum sesuai |
| Routing modul | Sebagian Implemented; `/settings` belum ada |

## 3. Prioritas Stabilisasi

| Prioritas | Pekerjaan | Hasil yang diharapkan |
|---|---|---|
| 1 | Integritas ledger | Validasi akun, kategori, integer, dan atomic behavior |
| 2 | Transfer | Saldo sumber cukup, rejection warning, dan zero-net-worth effect |
| 3 | Safe-to-Spend | `Current Balance - Unpaid Bills` konsisten di calculator dan dashboard |
| 4 | Sorting/filter | Urutan `transaction_date` descending dan filter periode |
| 5 | CSV | Filename dan sembilan kolom canonical |
| 6 | PWA | Service Worker, ikon, installability, dan offline test |
| 7 | Testing | Unit dan integration/manual evidence |

## 4. Fase Berikutnya

Setelah stabilisasi MVP, pekerjaan dapat mencakup penyempurnaan UX, pencarian transaksi, laporan, dan kategori custom berdasarkan persetujuan serta acceptance criteria baru.

Goal Allocations, Local PIN Protection, sinkronisasi cloud, dan integrasi bank tetap ditunda di luar MVP.

## 5. Kriteria Masuk Fase Berikutnya

- Alur transaksi utama teruji.
- Transfer menerapkan seluruh aturan BSD.
- Safe-to-Spend konsisten.
- CSV canonical valid.
- Route utama tersedia.
- PWA telah diverifikasi.
- Tidak ada masalah kritis yang belum memiliki rencana.
- Status dokumentasi dan source code tidak saling bertentangan.

## 6. Tata Kelola

Perubahan produk, arsitektur, prioritas, atau scope memerlukan keputusan pemilik project dan harus dicatat di `PROJECT_DECISIONS.md` atau `PROJECT_HISTORY.md`. GitHub Issues dan Projects tidak diubah oleh rekonsiliasi ini.
