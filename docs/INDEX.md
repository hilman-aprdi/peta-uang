# Dokumentasi PetaUang

Pusat navigasi dan referensi dokumentasi PetaUang.

## 1. Gambaran Umum

PetaUang adalah aplikasi pengelolaan keuangan pribadi Local-First. MVP menggunakan IndexedDB melalui Dexie.js, tanpa database server dan tanpa autentikasi.

## 2. Struktur Dokumentasi

| Dokumen | Tanggung jawab |
|---|---|
| [PROJECT_DECISIONS.md](./PROJECT_DECISIONS.md) | Keputusan baseline dan matriks rekonsiliasi |
| [PROJECT_STATUS.md](./PROJECT_STATUS.md) | Kondisi implementasi dan gap aktual |
| [PROJECT_HISTORY.md](./PROJECT_HISTORY.md) | Riwayat milestone dan keputusan historis |
| [PRODUCT_ROADMAP.md](./PRODUCT_ROADMAP.md) | Prioritas dan fase pengembangan |
| [product/prd.md](./product/prd.md) | Requirement produk dan scope |
| [product/bsd.md](./product/bsd.md) | Schema dan aturan domain |
| [product/ipd.md](./product/ipd.md) | Rencana implementasi dan status task |
| [design/afd.md](./design/afd.md) | User flow, system flow, dan state flow |
| [design/dbd.md](./design/dbd.md) | Prinsip UI/UX dan visual |
| [technical/trd.md](./technical/trd.md) | Arsitektur dan batasan teknis |

## 3. Hierarki Otoritas

1. Keputusan yang diterima di `PROJECT_DECISIONS.md`.
2. PRD untuk requirement dan scope produk.
3. BSD untuk aturan domain dan schema.
4. AFD untuk flow pengguna.
5. DBD untuk desain.
6. TRD untuk arsitektur teknis.
7. IPD untuk task dan status delivery.
8. PROJECT_STATUS dan PRODUCT_ROADMAP untuk kondisi/progress.
9. PROJECT_HISTORY untuk catatan historis.

Source code adalah bukti implementasi aktual, bukan otoritas untuk mengubah requirement yang telah disetujui.

## 4. Prosedur Pemeliharaan

Sebelum perubahan implementasi, baca INDEX, PROJECT_STATUS, dan dokumen yang relevan. Jika source berbeda dari requirement, catat discrepancy dan buat task implementasi terpisah. Jangan mengubah requirement secara diam-diam.

Setiap perubahan signifikan harus memperbarui status atau riwayat yang relevan. Keputusan baru harus dicatat di decision log.

**Status dokumentasi:** Direkonsiliasi berdasarkan DEC-001 sampai DEC-011; implementation gap tetap dicatat.
