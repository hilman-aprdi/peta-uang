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
| `created_at` | timestamp | Wajib |

`budgets` dan Goal Allocations tidak termasuk model Safe-to-Spend MVP. Keduanya ditunda sampai memiliki keputusan produk dan schema yang disetujui.

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

## 4. Perhitungan Ledger

`Saldo Akun = initial_balance + Σ(INCOME) - Σ(EXPENSE) - Σ(TRANSFER_out) + Σ(TRANSFER_in)`

Current Balance adalah total saldo seluruh akun aktif.

Safe-to-Spend MVP adalah:

`Safe-to-Spend = Current Balance - Total Unpaid Bills`

## Cash Flow

Untuk periode dashboard yang dipilih:

`Cash In = Σ(amount transaksi INCOME)`

`Cash Out = Σ(amount transaksi EXPENSE)`

`Net Cash Flow = Cash In - Cash Out`

Hanya income dan expense dalam periode terpilih yang dihitung. Transfer tidak termasuk Cash In maupun Cash Out karena tidak mengubah total dana milik pengguna. Cash Flow merupakan nilai agregat yang dihitung di client dari transaksi lokal dan tidak menjadi record atau tabel tersendiri.

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

Schema aktual menggunakan Dexie version 4. Migration mengonversi data lama `is_active` dengan nilai `0/1` menjadi boolean dan mengaktifkan kategori lama yang belum memiliki `is_active`. Karena boolean bukan IndexedDB index key, akun dan kategori aktif diambil melalui filter, bukan melalui `.equals(true)` pada index.

Pemeriksaan saldo sumber transfer diimplementasikan di service transfer dan dijalankan dalam operasi atomic bersama penyimpanan transaksi.
