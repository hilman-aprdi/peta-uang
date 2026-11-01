<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

# PetaUang — Pedoman Pengembangan AI Agent

## 1. Otoritas Project

Dokumentasi project merupakan sumber acuan utama (Single Source of Truth).

Seluruh implementasi wajib mengikuti persyaratan, arsitektur, spesifikasi desain, dan keputusan produk yang telah disetujui dan didokumentasikan dalam repository ini.

AI Agent tidak boleh secara mandiri memperkenalkan perilaku produk, fitur, dependensi, keputusan arsitektur, atau perubahan ruang lingkup baru.

## 2. Prosedur Wajib Membaca Dokumentasi

Sebelum memulai tugas implementasi:

1. Baca file `AGENTS.md` ini.
2. Baca `docs/INDEX.md` untuk memahami struktur dokumentasi.
3. Identifikasi dokumen yang relevan dengan tugas yang diberikan.
4. Baca dokumen dan bagian yang relevan sebelum mengubah kode.
5. Periksa implementasi yang sudah ada untuk memahami kondisi project saat ini.
6. Pastikan implementasi yang diminta sesuai dengan dokumentasi.

Jangan membaca seluruh dokumen jika tidak diperlukan. Baca hanya dokumen yang relevan dengan tugas untuk menghemat penggunaan context window.

## 3. Kepatuhan terhadap Dokumentasi

Aturan berikut wajib dipatuhi:

- Jangan membuat persyaratan yang tidak tercantum dalam dokumentasi.
- Jangan menganggap perilaku yang belum didokumentasikan sebagai keputusan yang telah disetujui.
- Jangan mengubah perilaku produk yang sudah ada secara diam-diam.
- Jangan menambahkan fitur di luar ruang lingkup yang telah disetujui.
- Jangan mengubah teknologi atau arsitektur yang telah disepakati tanpa persetujuan.
- Jangan menambahkan dependensi tanpa alasan yang jelas dan persetujuan.
- Jangan mengganti keputusan yang telah didokumentasikan hanya berdasarkan preferensi pribadi.

## 4. Penanganan Persyaratan yang Belum Didokumentasikan

Jika implementasi yang diminta membutuhkan informasi yang belum tersedia dalam dokumentasi:

1. Hentikan sementara bagian implementasi yang bergantung pada keputusan tersebut.
2. Jelaskan informasi apa yang belum tersedia.
3. Jelaskan mengapa informasi tersebut diperlukan.
4. Berikan rekomendasi solusi beserta konsekuensinya.
5. Minta persetujuan pemilik project sebelum melanjutkan.

Jangan menganggap tidak adanya tanggapan sebagai bentuk persetujuan.

AI Agent boleh melanjutkan pekerjaan lain yang tidak berkaitan dengan keputusan tersebut, selama pekerjaan tersebut memiliki spesifikasi yang jelas dan tidak bergantung pada informasi yang belum diputuskan.

## 5. Penanganan Alternatif Teknis yang Lebih Baik

Jika ditemukan pendekatan teknis yang lebih baik:

- Jangan langsung menerapkannya apabila perubahan tersebut memengaruhi persyaratan yang telah disetujui, arsitektur, dependensi, kebijakan keamanan, atau perilaku yang terlihat oleh pengguna.
- Jelaskan pendekatan yang sedang digunakan dan alternatif yang diusulkan.
- Uraikan kelebihan, kekurangan, dan dampak migrasinya.
- Minta persetujuan sebelum menerapkan perubahan.

Refactoring internal berskala kecil yang tidak mengubah perilaku maupun arsitektur yang telah disepakati boleh dilakukan tanpa persetujuan tambahan.

## 6. Penyelesaian Konflik Dokumentasi

Jika terdapat pertentangan antara dokumentasi, source code, atau dokumen lainnya:

1. Jangan menentukan sendiri sumber mana yang harus diikuti.
2. Identifikasi pernyataan yang saling bertentangan.
3. Jelaskan dampak dari pertentangan tersebut.
4. Minta pemilik project untuk menentukan keputusan.

Jangan mengubah dokumentasi secara diam-diam hanya untuk membenarkan implementasi yang telah dilakukan.

## 7. Disiplin Implementasi

Untuk setiap tugas:

- Ikuti ruang lingkup pekerjaan yang diberikan.
- Utamakan perubahan yang minimal dan mudah dipelihara.
- Pertahankan konvensi yang sudah digunakan dalam project.
- Jalankan pengujian yang relevan untuk memvalidasi perubahan.
- Hindari perubahan yang tidak berkaitan dengan tugas.
- Laporkan file yang diubah, detail implementasi, hasil pengujian, dan masalah yang belum terselesaikan.

## 8. Pembaruan Dokumentasi

Ketika implementasi yang telah disetujui mengubah perilaku yang didokumentasikan:

- Identifikasi dokumentasi yang terdampak.
- Usulkan pembaruan dokumentasi yang diperlukan.
- Pastikan dokumentasi tetap konsisten dengan implementasi yang telah disetujui.
- Jangan mengubah persyaratan produk secara mandiri.

## 9. Kewenangan Pemilik Project

Pemilik project memiliki kewenangan akhir dalam menentukan:

- Persyaratan produk.
- Ruang lingkup fitur.
- Keputusan pengalaman pengguna (UX).
- Perubahan arsitektur.
- Pemilihan teknologi.
- Perilaku yang belum didokumentasikan.
- Pertimbangan dan kompromi antaralternatif solusi.

Jika terdapat ketidakpastian, tanyakan kepada pemilik project daripada membuat asumsi sendiri.

<!-- END:nextjs-agent-rules -->
