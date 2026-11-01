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

Pada 1 November 2026, dokumentasi yang belum terlacak Git pernah terhapus dan kemudian direkonstruksi. Rekonstruksi ini selanjutnya direkonsiliasi berdasarkan keputusan DEC-001 sampai DEC-011 dan pemeriksaan source aktual.

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
- Route utama `/`, `/transactions`, `/accounts`, `/settings`.
- Status IPD dibedakan antara Implemented dan Verified.
- Gradient hanya aksen dekoratif terbatas.
- `next.config.ts` sebagai konfigurasi aktual.
- Struktur direktori berada di luar scope rekonsiliasi.

Detail traceability berada di `docs/PROJECT_DECISIONS.md`.

## 5. Pemeliharaan Riwayat

Setiap entri baru mencatat tanggal, perubahan atau keputusan, alasan, referensi issue/commit bila ada, dan perbedaan antara rencana, implementasi, serta verifikasi.
