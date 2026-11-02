# Project Decision Log — PetaUang

Decision log ini mencatat baseline yang diterima untuk rekonsiliasi dokumentasi pada 1 November 2026. Seluruh keputusan berstatus **Accepted**.

## DEC-001 — Database Architecture

- **Status:** Accepted
- **Context:** Dokumen lama mencampur beberapa opsi database.
- **Decision:** MVP menggunakan IndexedDB melalui Dexie.js dengan storage Local-First dan tanpa database server.
- **Consequences:** Schema, query, migration, dan acceptance test harus memakai model IndexedDB/Dexie.
- **Affected documents:** PRD, BSD, TRD, IPD, PROJECT_STATUS, PROJECT_HISTORY.

## DEC-002 — Authentication and Local Security

- **Status:** Accepted
- **Context:** AFD lama memuat Local PIN, sedangkan PRD/TRD menetapkan zero-auth.
- **Decision:** MVP tidak memiliki registrasi, login, provider eksternal, atau Local PIN Protection. Local locking hanya dapat menjadi future enhancement di luar MVP.
- **Consequences:** Akses ditentukan oleh kepemilikan perangkat dan browser storage.
- **Affected documents:** PRD, AFD, TRD, IPD, PROJECT_STATUS.

## DEC-003 — Safe-to-Spend Calculation

- **Status:** Accepted
- **Context:** Dokumen lama menambahkan Goal Allocations tanpa model yang disetujui.
- **Decision:** `Safe-to-Spend = Current Balance - Unpaid Bills`. Goal Allocations ditunda dan tidak masuk model/kalkulasi MVP.
- **Consequences:** Dashboard, calculator, BSD, dan acceptance test memakai formula yang sama.
- **Affected documents:** PRD, BSD, AFD, TRD, IPD, PRODUCT_ROADMAP.

## DEC-004 — Transfer Business Rules

- **Status:** Accepted
- **Context:** Validasi transfer belum konsisten antar-dokumen dan implementasi belum lengkap.
- **Decision:** Amount harus positif; akun sumber dan tujuan berbeda; sumber harus aktif dan memiliki saldo cukup; saldo tidak cukup ditolak dengan warning; perubahan sumber/tujuan atomic; transfer tidak mengubah net worth.
- **Consequences:** Implementasi saat ini harus diperbaiki melalui task terpisah; dokumentasi tidak mengklaimnya sudah sesuai.
- **Affected documents:** PRD, BSD, AFD, TRD, IPD, PROJECT_STATUS.

## DEC-005 — CSV Export Filename

- **Status:** Accepted
- **Context:** PRD dan IPD memakai nama file berbeda.
- **Decision:** Filename canonical adalah `PetaUang_All_Transactions_YYYY-MM-DD.csv`.
- **Consequences:** Exporter dan acceptance test harus memakai format tersebut.
- **Affected documents:** PRD, AFD, TRD, IPD, PROJECT_STATUS.

## DEC-006 — CSV Export Schema

- **Status:** Accepted
- **Context:** Header lama menggunakan nama dan urutan yang berbeda.
- **Decision:** CSV memiliki sembilan kolom berurutan: `transaction_id`, `transaction_date`, `transaction_type`, `category`, `amount`, `account_from`, `account_to`, `description`, `created_at`.
- **Consequences:** Mapping account origin/destination, format tanggal/nominal, empty value, dan escaping harus konsisten. Exporter mengimplementasikan schema ini; acceptance verification tetap diperlukan.
- **Affected documents:** PRD, AFD, TRD, IPD, PROJECT_STATUS.

## DEC-007 — Implementation Structure Scope Exclusion

- **Status:** Accepted
- **Context:** Rekonsiliasi dokumentasi tidak boleh mengubah struktur direktori.
- **Decision:** Directory migration, rename, dan reorganisasi source berada di luar scope keputusan ini.
- **Consequences:** Dokumentasi boleh mencatat struktur aktual, tetapi task ini tidak mengubahnya.
- **Affected documents:** TRD, IPD, PROJECT_STATUS.

## DEC-008 — Next.js Configuration

- **Status:** Accepted
- **Context:** Dokumentasi lama menyebut nama file konfigurasi yang berbeda dari repository.
- **Decision:** Dokumentasi menyebut file aktual `next.config.ts` dan tidak mengganti namanya.
- **Consequences:** Static export dan konfigurasi Next diverifikasi dari file tersebut.
- **Affected documents:** TRD, IPD, PROJECT_STATUS.

## DEC-009 — MVP Implementation Status

- **Status:** Accepted
- **Context:** Milestone historis disebut selesai, sementara source dan test belum mendukung status Verified penuh.
- **Decision:** IPD memakai Todo, In Progress, Implemented, Verified, Deferred, dan Blocked. Implemented tidak berarti Verified.
- **Consequences:** Status task berdasarkan bukti source/test; tidak ada klaim MVP lengkap tanpa evidence.
- **Affected documents:** IPD, PROJECT_STATUS, PRODUCT_ROADMAP, PROJECT_HISTORY, INDEX.

## DEC-010 — Design Gradient Policy

- **Status:** Accepted
- **Context:** Dokumen desain melarang gradient secara umum tanpa membedakan aksen dekoratif.
- **Decision:** Gradient boleh menjadi aksen terbatas, bukan bahasa visual utama, tidak agresif pada komponen finansial, dan tidak boleh menurunkan readability/accessibility.
- **Consequences:** Solid color dan hirarki tetap menjadi default.
- **Affected documents:** DBD, PROJECT_STATUS.

## DEC-011 — Application Routing and Navigation

- **Status:** Accepted
- **Context:** Dokumentasi mencampur tab single-page dengan modul route.
- **Decision:** Modul utama memakai `/`, `/transactions`, `/accounts`, dan `/bills`. Modul bill menggunakan label `Tagihan` dan ikon `Receipt`. Tabs hanya navigasi sekunder dalam modul. `/settings` dipertahankan sebagai alias kompatibilitas lama.
- **Consequences:** Navigasi utama tidak lagi memakai label Settings untuk halaman bill. Dokumentasi dan acceptance test menggunakan `/bills`; alias lama tetap tersedia agar bookmark/link lama tidak rusak.
- **Affected documents:** PRD, AFD, DBD, TRD, IPD, PROJECT_STATUS, PRODUCT_ROADMAP.

## DEC-012 — Bill Management Scope

- **Status:** Accepted
- **Context:** Schema `bills` dan kalkulasi Safe-to-Spend sudah tersedia, tetapi lifecycle bill belum memiliki task UI/service.
- **Decision:** Bill Management menjadi bagian MVP dan dilacak sebagai IPD-016. Pengguna dapat membuat, mengedit, menghapus, serta mengubah status paid/unpaid. Hanya bill unpaid yang mengurangi Safe-to-Spend.
- **Consequences:** BSD, PRD, AFD, IPD, roadmap, dan status project harus mencatat lifecycle bill serta acceptance criteria-nya. Budget dan Goal Allocations tetap ditunda.
- **Affected documents:** PRD, BSD, AFD, IPD, PROJECT_STATUS, PRODUCT_ROADMAP, PROJECT_HISTORY.

## DEC-013 — Account Deletion and Related Transfers

- **Status:** Accepted
- **Context:** Account saat ini dinonaktifkan dengan soft-delete, tetapi transfer yang merujuk account tersebut tetap tersimpan. Owner menetapkan bahwa account boleh dihapus kapan saja dengan peringatan sebelum tindakan.
- **Decision:** Penghapusan account dilakukan sebagai soft-delete setelah user mengonfirmasi warning. Semua transaksi bertipe `TRANSFER` yang memiliki account tersebut sebagai sumber atau tujuan ikut dihapus secara atomic. Transaksi income dan expense tidak ikut dihapus.
- **Consequences:** Histori transfer terkait account tidak dipertahankan. Ledger akan dihitung ulang dari transaksi yang tersisa. UI wajib menampilkan konsekuensi penghapusan sebelum konfirmasi, dan service wajib menghapus account serta transfer terkait dalam satu operasi atomic.
- **Affected documents:** PRD, BSD, AFD, TRD, IPD, PROJECT_STATUS, PRODUCT_ROADMAP.

## DEC-014 — Dashboard Cash Flow Calculation

- **Status:** Accepted
- **Context:** Owner meminta ringkasan Cash Flow di dashboard dan menetapkan kalkulasi hanya di front end.
- **Decision:** Untuk periode dashboard terpilih, Cash In adalah jumlah `INCOME`, Cash Out adalah jumlah `EXPENSE`, dan Net Cash Flow adalah Cash In dikurangi Cash Out. Transfer internal tidak dihitung. Hasil dihitung dari transaksi lokal di client, tidak disimpan sebagai record, dan tidak memerlukan API/server database.
- **Consequences:** Dashboard dan acceptance criteria harus memakai definisi serta period filter yang sama; tidak ada perubahan schema.
- **Affected documents:** PRD, BSD, AFD, TRD, IPD, PROJECT_STATUS, PRODUCT_ROADMAP.

## DEC-015 — Optional Transaction Categories

- **Status:** Accepted
- **Context:** Owner menetapkan bahwa form transaksi tidak boleh mewajibkan kategori dan transaksi tanpa kategori harus tetap dapat dicatat.
- **Decision:** Kategori opsional untuk income dan expense. Jika tidak dipilih, transaksi menyimpan `category_id` kosong dan ditampilkan sebagai `Uncategorized`. Transfer tidak menggunakan kategori. Kategori default dan custom mendukung CRUD; delete dilakukan sebagai soft-delete/nonaktifkan untuk menjaga histori.
- **Consequences:** Form dan service transaksi perlu menerima kategori kosong; daftar transaksi dan tampilan terkait harus menampilkan fallback `Uncategorized`. Tidak perlu schema baru karena `category_id` sudah nullable. Seed tidak boleh membatalkan perubahan kategori default oleh pengguna.
- **Affected documents:** PRD, BSD, AFD, TRD, IPD, PROJECT_STATUS, PRODUCT_ROADMAP.

## Lampiran A — Matriks Rekonsiliasi

| Issue | Dokumentasi terdampak | Baseline | Verifikasi |
|---|---|---|---|
| Database architecture conflict | PRD, BSD, TRD, IPD | IndexedDB + Dexie.js | Hanya IndexedDB/Dexie untuk MVP |
| Local PIN vs zero-auth | PRD, AFD, TRD | Zero-auth, tanpa PIN | Tidak ada flow PIN MVP |
| Formula Safe-to-Spend | PRD, BSD, AFD, TRD, IPD | Current Balance - Unpaid Bills | Formula identik di semua dokumen |
| Aturan transfer | PRD, BSD, AFD, TRD, IPD | Sumber cukup, rejection warning, atomic | Gap source dicatat, bukan disamarkan |
| CSV filename | PRD, AFD, TRD, IPD | `PetaUang_All_Transactions_YYYY-MM-DD.csv` | Satu string canonical |
| CSV schema | PRD, TRD, IPD | Sembilan kolom canonical | Urutan dan format identik |
| Status MVP | IPD, status, roadmap, history | Implemented ≠ Verified | Status berbasis evidence |
| Gradient | DBD | Aksen terbatas | Kebijakan eksplisit |
| Routing | PRD, AFD, DBD, TRD, IPD | Empat route utama, tabs sekunder | Route target dan gap source jelas |
| Next config | TRD, IPD | `next.config.ts` | File aktual diverifikasi dari repository |
| Account deletion cascade | PRD, BSD, AFD, TRD, IPD | Soft-delete account dengan warning; hapus transfer terkait secara atomic | Income/expense tetap dipertahankan |
| Dashboard Cash Flow | PRD, BSD, AFD, TRD, IPD | Income minus expense dalam periode terpilih; transfer dikecualikan | Client-side aggregate, tanpa schema/API |
| Optional category | PRD, BSD, AFD, TRD, IPD | Income/expense tanpa kategori disimpan dengan category_id kosong dan ditampilkan Uncategorized | CRUD kategori custom dengan soft-delete |
