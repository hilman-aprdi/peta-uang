# Project Decision Log — PetaUang

Decision log ini mencatat baseline yang diterima untuk rekonsiliasi dokumentasi pada 1 November 2026 dan pembaruan berikutnya. Status keputusan dapat berupa **Accepted**, **Superseded**, atau **Amended**. Keputusan historis tidak dihapus; penggantian dan amandemen dicatat pada keputusan terkait.

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

- **Status:** Superseded by DEC-018 (4 November 2026)
- **Context:** Dokumen lama menambahkan Goal Allocations tanpa model yang disetujui.
- **Decision:** `Safe-to-Spend = Current Balance - Unpaid Bills`. Goal Allocations ditunda dan tidak masuk model/kalkulasi MVP.
- **Superseded note:** DEC-018 mengaktifkan Goals sebagai virtual fund allocation. Formula MVP berlaku saat ini adalah `Safe-to-Spend = Current Balance - Total Unpaid Bills - Total Allocated Goals`.
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

- **Status:** Amended by DEC-018 dan DEC-019
- **Context:** Dokumentasi mencampur tab single-page dengan modul route.
- **Decision:** Modul utama memakai `/`, `/transactions`, `/accounts`, dan `/bills`. Modul bill menggunakan label `Tagihan` dan ikon `Receipt`. Tabs hanya navigasi sekunder dalam modul. `/settings` dipertahankan sebagai alias kompatibilitas lama.
- **Amendment note:** DEC-018 menambahkan `/goals` sebagai modul utama kelima dengan label `Target`. DEC-019 menghapus route dan alias `/settings`. Daftar route aktif saat ini adalah `/`, `/transactions`, `/accounts`, `/bills`, dan `/goals`.
- **Consequences:** Navigasi utama tidak lagi memakai label Settings untuk halaman bill. Dokumentasi dan acceptance test menggunakan route aktif di atas; tidak ada alias `/settings`.
- **Affected documents:** PRD, AFD, DBD, TRD, IPD, PROJECT_STATUS, PRODUCT_ROADMAP.

## DEC-012 — Bill Management Scope

- **Status:** Amended by DEC-018 (4 November 2026)
- **Context:** Schema `bills` dan kalkulasi Safe-to-Spend sudah tersedia, tetapi lifecycle bill belum memiliki task UI/service.
- **Decision:** Bill Management menjadi bagian MVP dan dilacak sebagai IPD-016. Pengguna dapat membuat, mengedit, menghapus, serta mengubah status paid/unpaid. Hanya bill unpaid yang mengurangi Safe-to-Spend.
- **Amendment note:** DEC-018 mengaktifkan Goals dan Goal Allocations sebagai bagian model MVP. Bagian “Budget dan Goal Allocations tetap ditunda” pada keputusan ini tidak lagi berlaku untuk Goals; `budgets` tetap ditunda.
- **Consequences:** BSD, PRD, AFD, IPD, roadmap, dan status project harus mencatat lifecycle bill serta acceptance criteria-nya. `budgets` tetap ditunda, sedangkan Goals mengikuti DEC-018.
- **Affected documents:** PRD, BSD, AFD, IPD, PROJECT_STATUS, PRODUCT_ROADMAP, PROJECT_HISTORY.

## DEC-013 — Account Deletion and Related Transfers

- **Status:** Accepted
- **Context:** Account saat ini dinonaktifkan dengan soft-delete, tetapi transfer yang merujuk account tersebut tetap tersimpan. Owner menetapkan bahwa account boleh dihapus kapan saja dengan peringatan sebelum tindakan.
- **Decision:** Penghapusan account dilakukan sebagai soft-delete setelah user mengonfirmasi warning. Semua transaksi bertipe `TRANSFER` yang memiliki account tersebut sebagai sumber atau tujuan ikut dihapus secara atomic. Transaksi income dan expense tidak ikut dihapus.
- **Consequences:** Histori transfer terkait account tidak dipertahankan. Ledger akan dihitung ulang dari transaksi yang tersisa. UI wajib menampilkan konsekuensi penghapusan sebelum konfirmasi, dan service wajib menghapus account serta transfer terkait dalam satu operasi atomic.
- **Affected documents:** PRD, BSD, AFD, TRD, IPD, PROJECT_STATUS, PRODUCT_ROADMAP.

## DEC-014 — Dashboard Cash Flow Calculation

- **Status:** Amended by DEC-019 (4 November 2026)
- **Context:** Owner meminta ringkasan Cash Flow di dashboard dan menetapkan kalkulasi hanya di front end.
- **Decision:** Untuk periode dashboard terpilih, Cash In adalah jumlah `INCOME`, Cash Out adalah jumlah `EXPENSE`, dan Net Cash Flow adalah Cash In dikurangi Cash Out. Transfer internal tidak dihitung. Hasil dihitung dari transaksi lokal di client, tidak disimpan sebagai record, dan tidak memerlukan API/server database.
- **Amendment note:** DEC-019 menghapus filter periode Dashboard. Cash Flow Dashboard kini selalu memakai transaksi bulan berjalan. Halaman `/transactions` memiliki filter periode independen (bulan atau Semua Waktu) dan menampilkan Income, Expense, serta Net Cash Flow untuk periode tersebut. Keduanya memakai definisi agregasi yang sama.
- **Consequences:** Definisi Cash In, Cash Out, dan Net Cash Flow tetap sama; cakupan periode berbeda antara Dashboard dan halaman Transaksi. Tidak ada perubahan schema.
- **Affected documents:** PRD, BSD, AFD, TRD, IPD, PROJECT_STATUS, PRODUCT_ROADMAP.

## DEC-015 — Optional Transaction Categories

- **Status:** Accepted
- **Context:** Owner menetapkan bahwa form transaksi tidak boleh mewajibkan kategori dan transaksi tanpa kategori harus tetap dapat dicatat.
- **Decision:** Kategori opsional untuk income dan expense. Jika tidak dipilih, transaksi menyimpan `category_id` kosong dan ditampilkan sebagai `Uncategorized`. Transfer tidak menggunakan kategori. Kategori default dan custom mendukung CRUD; delete dilakukan sebagai soft-delete/nonaktifkan untuk menjaga histori.
- **Consequences:** Form dan service transaksi perlu menerima kategori kosong; daftar transaksi dan tampilan terkait harus menampilkan fallback `Uncategorized`. Tidak perlu schema baru karena `category_id` sudah nullable. Seed tidak boleh membatalkan perubahan kategori default oleh pengguna.
- **Affected documents:** PRD, BSD, AFD, TRD, IPD, PROJECT_STATUS, PRODUCT_ROADMAP.

## DEC-016 — Bill Payment to Expense Integration & Cascade Unpaid

- **Status:** Accepted
- **Context:** Owner menetapkan bahwa ketika user menandai tagihan sebagai paid, saldo riil akun harus berkurang otomatis melalui pencatatan transaksi expense baru, dan jika diubah kembali ke unpaid, transaksi expense terkait otomatis dihapus.
- **Decision:** Menandai tagihan sebagai paid membuka modal konfirmasi untuk memilih akun pembayar (`account_id`), tanggal bayar, dan kategori opsional. Sistem secara atomic menandai `is_paid = true`, membuat transaksi `EXPENSE` baru, dan menyimpan referensi `transaction_id` pada tagihan. Jika tagihan diubah kembali menjadi unpaid (`is_paid = false`), transaksi `EXPENSE` terkait otomatis dihapus secara atomic dan saldo ledger akun dikembalikan.
- **Consequences:** Tabel `bills` memiliki field opsional `transaction_id`. Service `billService` dan antarmuka `BillManagement` menyediakan modal `PayBillModal` untuk memilih akun pembayar serta dialog konfirmasi saat unmark paid.
- **Affected documents:** PRD, BSD, AFD, TRD, IPD, PROJECT_STATUS.

## DEC-017 — Current Balance Adjustment via Auto-Generated Transaction

- **Status:** Accepted
- **Context:** Form edit akun sebelumnya menampilkan input "Saldo Awal", yang jika diubah secara langsung dapat merusak catatan historis `initial_balance`. Diperlukan cara agar pengguna dapat memperbarui saldo akun ke kondisi riil saat ini (Saldo Saat Ini) secara fleksibel tanpa merusak integritas ledger.
- **Decision:** Pada modal edit akun, input saldo diubah labelnya menjadi "Saldo Saat Ini (Rp)" dan menampilkan saldo aktual ledger akun. Jika pengguna memasukkan nominal target yang berbeda dari saldo saat ini:
  1. `initial_balance` akun tetap dipertahankan (tidak diubah).
  2. Selisih $\Delta = \text{target\_balance} - \text{current\_balance}$ dihitung.
  3. Jika $\Delta > 0$, sistem secara otomatis membuat transaksi baru bertipe `INCOME` dengan judul `"Adjust Balance"` sejumlah $\Delta$.
  4. Jika $\Delta < 0$, sistem secara otomatis membuat transaksi baru bertipe `EXPENSE` dengan judul `"Adjust Balance"` sejumlah $|\Delta|$.
  5. Jika transaksi penyesuaian `"Adjust Balance"` tersebut dihapus oleh pengguna dari riwayat transaksi, saldo akun otomatis kembali ke nilai semula karena transaksi penyesuaian tereliminasi dari kalkulasi ledger.
- **Consequences:** `updateAccount` di `accountService` mendukung `target_balance` dan dieksekusi secara atomic (`runAtomicTransaction`). Modal edit akun menampilkan petunjuk eksplisit mengenai pencatatan transaksi penyesuaian.
- **Affected documents:** PRD, BSD, AFD, TRD, IPD, PROJECT_STATUS.

## DEC-018 — Goals Feature & Virtual Fund Allocation in Safe-to-Spend

- **Status:** Accepted
- **Context:** Pengguna membutuhkan kemampuan membuat target tabungan/pos alokasi dana khusus (misal: "Dana Darurat", "Beli Laptop") tanpa membuat rekening bank fisik baru dan tanpa mengubah saldo kas riil.
- **Decision:**
  1. Pos Goal diperlakukan sebagai virtual fund allocation, disimpan dalam tabel Dexie `goals` dan riwayat `goal_allocations`.
  2. Formula Safe-to-Spend diperbarui: `Safe-to-Spend = Current Balance - Total Unpaid Bills - Total Allocated Goals`.
  3. Alokasi dana mengurangi Safe-to-Spend tanpa mengubah saldo kas riil. Penarikan dana mengembalikan Safe-to-Spend.
  4. Pembelanjaan dari Goal (`spendFromGoal`) mencatat transaksi `EXPENSE` riil dari akun rekening yang dipilih dan mengurangi alokasi Goal secara bersamaan. Safe-to-Spend tidak mengalami pemotongan ganda.
  5. Pengeditan dan penghapusan transaksi yang terikat Goal merekonsiliasi alokasi dana dan mencatat event penyesuaian (`SPEND_ADJUSTMENT`) atau pembalikan (`SPEND_REVERSAL`) secara atomik.
  6. Goal yang masih memiliki sisa dana alokasi tidak dapat dihapus atau diarsipkan sebelum seluruh dananya ditarik. Penghapusan Goal yang dananya kosong menggunakan soft-delete untuk menjaga keutuhan riwayat audit.
  7. Modul Target menjadi item navigasi utama ke-5 (`/goals`).
- **Consequences:** Dexie ditingkatkan ke `version(5)`. Komponen `SafeToSpendHero` menampilkan breakdown dana pos target. Modul `/goals` menyediakan manajemen target, alokasi, penarikan, pembelanjaan, dan riwayat mutasi pos dana.
- **Affected documents:** PRD, BSD, AFD, TRD, IPD, PROJECT_STATUS, PRODUCT_ROADMAP.

## DEC-019 — Dashboard and Transactions Scope Revision

- **Status:** Accepted
- **Date:** 4 November 2026
- **Context:** Owner menetapkan penyederhanaan Dashboard dan pemisahan tegas antara ringkasan Dashboard dengan halaman Transaksi. Sebelumnya Dashboard memiliki filter periode sendiri, sedangkan Cash Flow didokumentasikan mengikuti filter tersebut.
- **Decision:**
  1. Route `/settings` dihapus sepenuhnya. Tidak ada route pengganti dan tidak ada alias kompatibilitas.
  2. Dashboard tidak memiliki kalender atau filter periode yang dapat dikendalikan pengguna.
  3. Dashboard menampilkan transaksi hari ini saja berdasarkan kalender lokal perangkat, bukan berdasarkan pemotongan string UTC. Transaksi kemarin dan transaksi bertanggal masa depan tidak ditampilkan.
  4. Cash Flow Dashboard tetap dihitung dari transaksi bulan berjalan, sehingga penghapusan filter tidak mengubah definisi finansial Dashboard.
  5. Daftar transaksi Dashboard menampilkan seluruh transaksi hari ini tanpa batas 10 item, dengan empty state ketika belum ada transaksi hari ini.
  6. Dashboard menyediakan tombol navigasi ke `/transactions`.
  7. Halaman `/transactions` mempertahankan filter periode bulan yang independen, opsi **Semua Waktu** sebagai toggle on/off, dan tombol reset **Bulan Ini**. Menonaktifkan toggle Semua Waktu mengembalikan halaman ke bulan berjalan.
  8. Halaman `/transactions` menampilkan Income, Expense, dan Net Cash Flow untuk periode yang sedang dipilih, termasuk saat mode Semua Waktu. `TRANSFER` dikecualikan dari agregasi.
  9. Pembuatan, pengubahan, dan penghapusan transaksi tetap reaktif melalui query Dexie pada kedua tampilan.
- **Consequences:** Dashboard dan halaman Transaksi memiliki cakupan tanggal yang berbeda dan tidak boleh didokumentasikan seolah-olah memakai filter yang sama. `/goals` tetap merupakan modul utama kelima sesuai DEC-018. Tidak ada perubahan schema, dependensi, atau logika finansial di luar agregasi yang telah ada.
- **Known limitation:** Pergantian hari tanpa render ulang tidak otomatis menyegarkan daftar “Transaksi Hari Ini” sampai ada perubahan state atau query berikutnya.
- **Affected documents:** PRD, BSD, AFD, DBD, TRD, IPD, PROJECT_STATUS, PRODUCT_ROADMAP, PROJECT_HISTORY, INDEX, README.

## Revisi Financial Insight Engine — 5 November 2026

- **Status:** Accepted (disetujui owner; belum memiliki ID keputusan formal)
- **Context:** Versi pertama Financial Insight Engine menampilkan tiga kartu periode secara terpisah, sehingga masalah yang lebih mendesak dapat tenggelam dan beberapa diagnosis tidak sesuai penyebabnya. Owner menyetujui revisi perilaku berikut tanpa membuat ID DEC baru.
- **Decision:**
  1. **Presentasi Priority Inbox:** Dashboard menampilkan seluruh insight actionable dari periode Harian, Mingguan, dan Bulanan dalam satu daftar terurut. Identitas kartu adalah domain masalah (`SALDO`, `TAGIHAN`, `PENGELUARAN`, `TARGET`, `DATA`); urgensi tetap menjadi badge, sedangkan periode menjadi metadata kecil. Periode yang stabil atau belum memiliki data diringkas menjadi chip, bukan kartu penuh.
  2. **Urutan lintas periode:** Urgensi menjadi dasar pengurutan, lalu nominal dampak rupiah sebagai tie-breaker. Tidak ada batas jumlah kartu agar insight dengan urgensi lebih rendah tidak tersembunyi oleh insight lain.
  3. **D-1 Safe-to-Spend negatif bersifat cause-aware:** Diagnosis membedakan tagihan belum dibayar, dana pos target, keduanya, atau saldo kas negatif tanpa komitmen. Bila tagihan dan pos target sama-sama menyebabkan defisit, CTA utama mengarah ke tagihan. Bila hanya pos target, CTA mengarah ke target. Bila hanya saldo kas negatif, CTA mengarah ke transaksi. Evidence menampilkan Saldo Kas, Tagihan Belum Dibayar, dan Dana Pos Target secara terpisah.
  4. **W-2 transaksi belum dikategorikan:** Rule aktif bila terdapat minimal 1 transaksi `EXPENSE` atau `INCOME` non-transfer tanpa kategori pada minggu berjalan. Teks menampilkan jumlah transaksi. Urgensi tetap `HYGIENE`. W-2 wajib tetap terlihat saat W-1 juga terpicu.
  5. **M-1 perbandingan kategori bulanan:** Total pengeluaran kategori bulan berjalan (tanggal 1 sampai hari ini) dibandingkan dengan total penuh kategori yang sama pada bulan lalu. Rule hanya terpicu bila total bulan berjalan benar-benar lebih besar (`>`). Baseline total penuh bulan lalu minimal Rp100.000 dan minimal 1 transaksi kategori pada bulan berjalan. Tidak ada gate hari ke-3 dan tidak ada ambang selisih nominal. Kategori dengan selisih nominal terbesar dipilih. Badge selisih hanya menampilkan nominal, bukan persentase.
  6. **D-2 dan W-1 tetap terpisah:** Keduanya memakai domain `TAGIHAN`, tetapi merepresentasikan horizon dan tingkat kepentingan yang berbeda sehingga tidak digabung.
  7. **Cakupan Dashboard tidak berubah:** Cash Flow Dashboard tetap memakai bulan berjalan; revisi ini hanya mengubah penyajian dan aturan insight.
- **Consequences:** `PeriodInsightResult` menyimpan seluruh kandidat terurut selain kandidat utama. Priority Inbox tidak membatasi jumlah kartu. Tidak ada perubahan schema, dependensi, atau mutasi database. Dokumentasi PRD, BSD, AFD, DBD, TRD, IPD, status, roadmap, dan history harus mengikuti perilaku ini.
- **Affected documents:** PRD, BSD, AFD, DBD, TRD, IPD, PROJECT_STATUS, PRODUCT_ROADMAP, PROJECT_HISTORY.

## Lampiran A — Matriks Rekonsiliasi

| Issue | Dokumentasi terdampak | Baseline | Verifikasi |
|---|---|---|---|
| Database architecture conflict | PRD, BSD, TRD, IPD | IndexedDB + Dexie.js | Hanya IndexedDB/Dexie untuk MVP |
| Local PIN vs zero-auth | PRD, AFD, TRD | Zero-auth, tanpa PIN | Tidak ada flow PIN MVP |
| Formula Safe-to-Spend | PRD, BSD, AFD, TRD, IPD | Current Balance - Total Unpaid Bills - Total Allocated Goals | Formula identik di semua dokumen |
| Aturan transfer | PRD, BSD, AFD, TRD, IPD | Sumber cukup, rejection warning, atomic | Gap source dicatat, bukan disamarkan |
| CSV filename | PRD, AFD, TRD, IPD | `PetaUang_All_Transactions_YYYY-MM-DD.csv` | Satu string canonical |
| CSV schema | PRD, TRD, IPD | Sembilan kolom canonical | Urutan dan format identik |
| Status MVP | IPD, status, roadmap, history | Implemented ≠ Verified | Status berbasis evidence |
| Gradient | DBD | Aksen terbatas | Kebijakan eksplisit |
| Routing | PRD, AFD, DBD, TRD, IPD | Lima route utama: `/`, `/transactions`, `/accounts`, `/bills`, `/goals`; tabs sekunder | `/settings` dihapus; route target dan source selaras |
| Next config | TRD, IPD | `next.config.ts` | File aktual diverifikasi dari repository |
| Account deletion cascade | PRD, BSD, AFD, TRD, IPD | Soft-delete account dengan warning; hapus transfer terkait secara atomic | Income/expense tetap dipertahankan |
| Dashboard Cash Flow | PRD, BSD, AFD, TRD, IPD | Dashboard memakai bulan berjalan tanpa filter; halaman Transaksi memakai periode terpilih; transfer dikecualikan | Client-side aggregate, tanpa schema/API |
| Dashboard today scope | PRD, AFD, TRD, IPD | Dashboard hanya menampilkan transaksi hari ini berdasarkan kalender lokal; Cash Flow tetap bulan berjalan | Cakupan tanggal berbeda, bukan filter yang sama |
| Transactions page summary | PRD, BSD, AFD, TRD, IPD | Income, Expense, dan Net Cash Flow untuk periode terpilih atau Semua Waktu | Toggle All Time dan reset bulan berjalan |
| Financial Insight Engine | PRD, BSD, AFD, DBD, TRD, IPD, PROJECT_STATUS | Priority Inbox berbasis domain; D-1 cause-aware; W-2 minimal 1 transaksi EXPENSE/INCOME non-transfer; M-1 membandingkan bulan berjalan dengan total penuh bulan lalu (`>`, baseline Rp100.000) | Disetujui owner 5 November 2026; tanpa ID keputusan formal |
| Local date utilities | TRD, IPD | Key kalender lokal untuk Dashboard “hari ini” dan filter tanggal | Diuji otomatis; rollover tengah malam bergantung render berikutnya |
| Optional category | PRD, BSD, AFD, TRD, IPD | Income/expense tanpa kategori disimpan dengan category_id kosong dan ditampilkan Uncategorized | CRUD kategori custom dengan soft-delete |
| Bill Payment Integration | PRD, BSD, AFD, TRD, IPD | Paid membuat EXPENSE atomic & simpan transaction_id; unpaid menghapus EXPENSE terkait | Otomasi mutasi kas saat tagihan dibayar |
| Current Balance Adjustment | PRD, BSD, AFD, TRD, IPD | Edit akun memakai input Saldo Saat Ini; selisih dicatat sebagai transaksi Adjust Balance (INCOME/EXPENSE) tanpa mengubah initial_balance | Menghapus transaksi Adjust Balance mengembalikan saldo ke semula |
| Goals & Virtual Fund Allocation | PRD, BSD, AFD, TRD, IPD | Safe-to-Spend = Current Balance - Total Unpaid Bills - Total Allocated Goals; full allocation audit history | SpendFromGoal atomik dan rekonsiliasi edit/delete transaksi |
