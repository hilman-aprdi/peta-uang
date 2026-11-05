# Backend Schema Documentation (BSD) — PetaUang

## 1. Arsitektur Data

PetaUang menggunakan **IndexedDB** yang diakses melalui **Dexie.js**. Penyimpanan bersifat Local-First dan tidak menggunakan database server untuk MVP.

Saldo akun adalah nilai ledger yang dihitung dari `initial_balance` dan seluruh mutasi transaksi, bukan nilai saldo bebas yang diubah tanpa riwayat.

## 2. Tabel MVP

### `accounts`

| Field | Tipe | Aturan |
|---|---|---|
| `id` | string | Primary key unik |
| `name` | string | Wajib |
| `type` | `CASH \| BANK \| EWALLET \| INVESTMENT` | Wajib |
| `initial_balance` | integer | Rupiah utuh, default 0 |
| `is_active` | boolean | Default true; akun tidak aktif tidak digunakan untuk transaksi baru |
| `created_at` | timestamp | Wajib |
| `updated_at` | timestamp | Wajib |

### `categories`

| Field | Tipe | Aturan |
|---|---|---|
| `id` | string | Primary key unik |
| `name` | string | Wajib |
| `type` | `INCOME \| EXPENSE` | Wajib |
| `icon` | string | Opsional |
| `color` | string | Opsional |
| `is_system_default` | boolean | Menandai kategori yang berasal dari seed; tidak membatasi CRUD |
| `is_active` | boolean | Default true; kategori inactive tidak digunakan untuk transaksi baru |
| `created_at` | timestamp | Wajib |

### `transactions`

| Field | Tipe | Aturan |
|---|---|---|
| `id` | string | Primary key unik |
| `title` | string | Wajib |
| `type` | `INCOME \| EXPENSE \| TRANSFER` | Wajib |
| `amount` | integer | Wajib, lebih besar dari 0 |
| `account_id` | string | Akun utama; sumber untuk expense/transfer dan akun penerima untuk income |
| `destination_account_id` | string nullable | Wajib hanya untuk transfer |
| `category_id` | string nullable | Opsional untuk income/expense; kosong berarti Uncategorized. Transfer selalu kosong. |
| `goal_id` | string nullable | Opsional untuk expense; menautkan transaksi belanja ke Goal. |
| `transaction_date` | timestamp | Wajib |
| `note` | string nullable | Opsional |
| `created_at` | timestamp | Wajib |
| `updated_at` | timestamp | Wajib |

### `bills`

| Field | Tipe | Aturan |
|---|---|---|
| `id` | string | Primary key unik |
| `title` | string | Wajib |
| `amount` | integer | Rupiah utuh, lebih besar dari 0 |
| `due_date` | timestamp | Wajib |
| `is_paid` | boolean | Default false |
| `transaction_id` | string nullable | ID transaksi EXPENSE terkait jika tagihan telah dilunasi |
| `created_at` | timestamp | Wajib |

### `goals`

| Field | Tipe | Aturan |
|---|---|---|
| `id` | string | Primary key unik |
| `name` | string | Wajib |
| `target_amount` | integer | Rupiah utuh, lebih besar dari 0 |
| `allocated_amount` | integer | Snapshot dana yang dialokasikan; direkonsiliasi dari riwayat |
| `target_date` | timestamp nullable | Opsional |
| `status` | `ACTIVE \| COMPLETED \| ARCHIVED` | Default ACTIVE |
| `note` | string nullable | Opsional |
| `is_deleted` | boolean nullable | Soft-delete; histori terkait dipertahankan |
| `created_at` | timestamp | Wajib |
| `updated_at` | timestamp | Wajib |

### `goal_allocations`

| Field | Tipe | Aturan |
|---|---|---|
| `id` | string | Primary key unik |
| `goal_id` | string | Referensi Goal |
| `type` | `ALLOCATE \| WITHDRAW \| SPEND \| SPEND_ADJUSTMENT \| SPEND_REVERSAL` | Jenis mutasi alokasi |
| `amount` | integer | Nominal mutasi; `SPEND_ADJUSTMENT` dapat bernilai bertanda |
| `related_transaction_id` | string nullable | Referensi transaksi untuk mutasi `SPEND`, `SPEND_ADJUSTMENT`, atau `SPEND_REVERSAL` |
| `note` | string nullable | Opsional |
| `created_at` | timestamp | Wajib |

`budgets` tidak termasuk model MVP dan ditunda sampai memiliki keputusan produk serta schema yang disetujui. Goals dan Goal Allocations adalah bagian dari model MVP sesuai DEC-018.

## 3. Invariant Bisnis

1. Semua nominal moneter disimpan sebagai integer Rupiah utuh.
2. `amount` transaksi harus lebih besar dari nol.
3. Expense yang memiliki kategori hanya menggunakan kategori bertipe `EXPENSE`.
4. Income yang memiliki kategori hanya menggunakan kategori bertipe `INCOME`.
5. Transfer tidak menggunakan kategori.
6. Transaksi baru hanya boleh menggunakan akun aktif.
7. Transfer wajib memiliki akun sumber dan tujuan yang berbeda.
8. Transfer wajib memiliki saldo sumber yang cukup.
9. Transfer yang tidak memenuhi aturan ditolak dan menghasilkan peringatan saldo tidak mencukupi bila penyebabnya adalah saldo sumber.
10. Kategori default dan custom dapat dibuat, dilihat, diedit, dan dinonaktifkan.
11. Nama dan tipe kategori aktif harus unik.
12. Kategori custom dapat memilih satu ikon dari daftar ikon yang disediakan aplikasi; jika tidak dipilih, gunakan ikon umum.
13. Bill baru berstatus `is_paid=false`.
14. Bill hanya dapat berstatus paid atau unpaid.
15. Hanya bill dengan `is_paid=false` yang masuk ke Total Unpaid Bills.
16. Account dapat dinonaktifkan kapan saja setelah user mengonfirmasi warning.
17. Saat account dinonaktifkan, semua transaksi `TRANSFER` yang menggunakan account tersebut sebagai sumber atau tujuan dihapus.
18. Transaksi `INCOME` dan `EXPENSE` tidak ikut dihapus saat account dinonaktifkan.
19. Penghapusan account dan transfer terkait dilakukan sebagai satu operasi logical atomic.
20. Kategori bersifat opsional untuk income dan expense.
21. Transaksi income/expense tanpa `category_id` ditampilkan sebagai `Uncategorized`; status ini bukan record kategori.
22. Kategori default dan custom mendukung CRUD. Delete dilakukan sebagai soft-delete/nonaktifkan agar transaksi historis tetap terhubung.
23. Saat bill ditandai lunas (paid), sistem secara atomic membuat transaksi `EXPENSE` baru pada akun yang dipilih dan menautkan `transaction_id`. Jika status bill dikembalikan ke unpaid, transaksi `EXPENSE` terkait dihapus secara atomic dan saldo ledger akun dikembalikan.
24. Goal adalah pos dana virtual. Alokasi ke Goal mengurangi Safe-to-Spend tanpa membuat transaksi atau mengubah saldo kas akun.
25. Total Allocated Goals adalah jumlah `allocated_amount` seluruh Goal yang tidak dihapus, termasuk berstatus `ACTIVE`, `COMPLETED`, dan `ARCHIVED`.
26. Alokasi Goal tidak boleh melebihi Safe-to-Spend yang tersedia pada saat alokasi.
27. Penarikan dana Goal tidak boleh melebihi sisa `allocated_amount` Goal tersebut.
28. Pembelanjaan dari Goal membuat transaksi `EXPENSE` riil pada akun aktif, menautkan `goal_id`, dan mengurangi `allocated_amount` dalam satu operasi atomic. Dana tidak dipotong dua kali karena Safe-to-Spend sudah memperhitungkan alokasi.
29. Goal yang masih memiliki `allocated_amount > 0` tidak dapat dihapus maupun diarsipkan.
30. `allocated_amount` adalah snapshot yang dapat direkonstruksi dari riwayat `goal_allocations`: `ALLOCATE` dan `SPEND_REVERSAL` menambah, `WITHDRAW` dan `SPEND` mengurangi, sedangkan `SPEND_ADJUSTMENT` mengikuti tanda nominalnya.
31. Edit transaksi yang tertaut Goal menyesuaikan alokasi melalui `SPEND_ADJUSTMENT` atau `SPEND_REVERSAL`; penghapusan transaksi tertaut Goal mengembalikan alokasi melalui `SPEND_REVERSAL`. Transaksi `EXPENSE` yang tertaut Goal tidak boleh diubah tipenya.
32. Mengubah Saldo Saat Ini pada akun membuat transaksi penyesuaian `Adjust Balance` sebesar selisihnya dan tidak mengubah `initial_balance`. Transaksi penyesuaian mengikuti tipe `INCOME` bila saldo bertambah atau `EXPENSE` bila saldo berkurang.

## 4. Perhitungan Ledger

`Saldo Akun = initial_balance + Σ(INCOME) - Σ(EXPENSE) - Σ(TRANSFER_out) + Σ(TRANSFER_in)`

Current Balance adalah total saldo seluruh akun aktif.

Safe-to-Spend MVP adalah:

`Safe-to-Spend = Current Balance - Total Unpaid Bills - Total Allocated Goals`

Total Allocated Goals berasal dari `allocated_amount` Goal non-deleted. Alokasi Goal tidak mengurangi saldo kas akun; ia hanya mengurangi dana yang dianggap aman dibelanjakan. Safe-to-Spend boleh bernilai negatif.

## 4.1 Cash Flow

Definisi agregasi sama untuk semua tampilan:

`Cash In = Σ(amount transaksi INCOME)`

`Cash Out = Σ(amount transaksi EXPENSE)`

`Net Cash Flow = Cash In - Cash Out`

Cakupan periode berbeda menurut tampilan:

- **Dashboard:** transaksi bulan berjalan menurut kalender lokal. Dashboard tidak memiliki filter periode yang dapat diubah pengguna.
- **Halaman Transaksi:** transaksi pada bulan yang dipilih, atau seluruh transaksi saat mode **Semua Waktu** aktif.

Transfer tidak termasuk Cash In maupun Cash Out karena tidak mengubah total dana milik pengguna. Cash Flow merupakan nilai agregat yang dihitung di client dari transaksi lokal dan tidak menjadi record atau tabel tersendiri. Dashboard dan halaman Transaksi tidak boleh diperlakukan seolah-olah memakai cakupan tanggal yang sama.

## 4.2 Bill Management

Bill Management mencakup create, edit, delete, dan perubahan status paid/unpaid. Operasi bill harus mempertahankan nominal integer dan due date yang valid.

## 5. Penghapusan Account

Penghapusan account bersifat soft-delete: record account dipertahankan dengan `is_active=false` agar identitas account tetap tersedia untuk proses ledger dan audit internal. Sebelum tindakan, UI wajib menampilkan warning bahwa transfer terkait akan dihapus.

Setelah user mengonfirmasi:

- Account ditandai inactive.
- Transfer dengan `account_id` atau `destination_account_id` yang sama dengan account tersebut dihapus.
- Income dan expense yang terkait account tetap dipertahankan.
- Perubahan account dan penghapusan transfer dijalankan secara atomic.
- Saldo dan ringkasan dihitung ulang dari transaksi yang tersisa.

## 6. Aturan Transfer

Transfer yang berhasil:

- Mengurangi saldo akun sumber sebesar `N`.
- Menambah saldo akun tujuan sebesar `N`.
- Dicatat sebagai satu transaksi bertipe `TRANSFER`.
- Diproses sebagai satu operasi logical atomic.
- Tidak mengubah net worth keseluruhan pengguna.

Jika salah satu langkah atomic gagal, perubahan tidak boleh dianggap berhasil.

## 7. Schema dan Implementasi Aktual

Schema aktual menggunakan Dexie **version 5**. Riwayat migration:

- **Version 2:** menormalkan `accounts.is_active` dari representasi lama `0/1` menjadi boolean.
- **Version 3:** menggabungkan kategori default duplikat berdasarkan kombinasi nama dan tipe, lalu memindahkan referensi transaksi ke kategori kanonis.
- **Version 4:** mengaktifkan `categories.is_active` untuk data lama yang belum memilikinya.
- **Version 5:** menambahkan index `transactions.goal_id` serta tabel `goals` dan `goal_allocations`. Tidak ada backfill data pada migration ini.

Karena boolean bukan IndexedDB index key, akun dan kategori aktif diambil melalui filter, bukan melalui `.equals(true)` pada index.

Pemeriksaan saldo sumber transfer diimplementasikan di service transfer dan dijalankan dalam operasi atomic bersama penyimpanan transaksi.

## 8. Goal dan Alokasi Dana

Goal adalah pos dana virtual, bukan akun atau rekening terpisah. Membuat Goal tidak memindahkan uang dan tidak mengubah saldo akun. Alokasi hanya membatasi dana yang dianggap aman dibelanjakan melalui Safe-to-Spend.

Aturan mutasi:

| Mutasi | Efek pada `allocated_amount` | Efek pada saldo kas | Efek pada Safe-to-Spend |
|---|---|---|---|
| `ALLOCATE` | Bertambah | Tidak berubah | Berkurang |
| `WITHDRAW` | Berkurang | Tidak berubah | Bertambah |
| `SPEND` | Berkurang | Berkurang melalui transaksi `EXPENSE` | Tidak berubah relatif terhadap alokasi |
| `SPEND_ADJUSTMENT` | Bertambah atau berkurang sesuai tanda | Tidak berubah | Menyesuaikan |
| `SPEND_REVERSAL` | Bertambah | Tidak berubah | Menyesuaikan |

Aturan tambahan:

- Alokasi hanya dapat dilakukan ke Goal yang tidak dihapus dan tidak berstatus `ARCHIVED`.
- Alokasi dibatasi oleh Safe-to-Spend yang tersedia pada saat transaksi.
- Pembelanjaan dari Goal memerlukan akun aktif dengan saldo yang cukup dan kategori `EXPENSE` yang valid bila dipilih.
- Goal berstatus `COMPLETED` kembali menjadi `ACTIVE` bila `allocated_amount` turun di bawah `target_amount`.
- Penghapusan Goal bersifat soft-delete (`is_deleted=true`) dan hanya diizinkan saat tidak ada sisa alokasi.
- Riwayat `goal_allocations` dipertahankan untuk audit dan rekonsiliasi.

## 9. Aturan Financial Insight Engine

Financial Insight Engine bersifat read-only dan in-memory; tidak menulis ke IndexedDB dan tidak menambah tabel. Evaluasi Harian, Mingguan, dan Bulanan berjalan independen tanpa saling menekan. Setiap evaluasi mengembalikan seluruh kandidat terurut, dan Dashboard menggabungkannya menjadi Priority Inbox berbasis domain.

| Domain | Rule | Syarat | CTA |
|---|---|---|---|
| `SALDO` | D-1 Safe-to-Spend negatif | `safeToSpend < 0`; diagnosis dibedakan menurut tagihan, dana pos target, keduanya, atau saldo kas negatif | Tagihan bila tagihan ada; target bila hanya pos target; transaksi bila hanya saldo kas negatif |
| `TAGIHAN` | D-2 Tagihan mendesak | Bill unpaid dengan jatuh tempo H+0 s.d. H+2 kalender lokal | Tagihan |
| `TAGIHAN` | W-1 Beban tagihan 7 hari | Total bill unpaid dalam 7 hari ke depan minimal 50% saldo likuid, atau Safe-to-Spend kurang dari 20% dari total tagihan tersebut | Tagihan |
| `DATA` | W-2 Transaksi belum dikategorikan | Minimal 1 transaksi `EXPENSE` atau `INCOME` non-transfer tanpa `category_id` pada minggu berjalan | Transaksi |
| `PENGELUARAN` | M-1 Perbandingan kategori | Total kategori bulan berjalan (tanggal 1 s.d. hari ini) > total penuh kategori yang sama bulan lalu; baseline bulan lalu minimal Rp100.000; minimal 1 transaksi kategori bulan berjalan | Transaksi |
| `TARGET` | M-2 Target mendekati selesai | Target aktif mencapai 80% s.d. kurang dari 100%; target non-positif dan over-allocation tidak memicu | Target |

Aturan tambahan:

- Urutan Priority Inbox memakai urgensi, lalu nominal dampak sebagai tie-breaker.
- Tidak ada batas jumlah kartu; W-2 tidak boleh tersembunyi saat W-1 terpicu.
- D-2 dan W-1 tetap terpisah meskipun sama-sama memakai domain `TAGIHAN`.
- D-1 menampilkan evidence Saldo Kas, Tagihan Belum Dibayar, dan Dana Pos Target secara terpisah.
- M-1 tidak memakai persentase atau ambang selisih nominal pada badge; badge hanya menampilkan selisih nominal.
- Tidak ada gate hari ke-3 pada M-1.
