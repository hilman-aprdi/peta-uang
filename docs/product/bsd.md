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
| `is_system_default` | boolean | Kategori bawaan tidak dihapus |
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
| `category_id` | string nullable | Wajib untuk income/expense; kosong untuk transfer |
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
3. Expense hanya menggunakan kategori bertipe `EXPENSE`.
4. Income hanya menggunakan kategori bertipe `INCOME`.
5. Transfer tidak menggunakan kategori.
6. Transaksi baru hanya boleh menggunakan akun aktif.
7. Transfer wajib memiliki akun sumber dan tujuan yang berbeda.
8. Transfer wajib memiliki saldo sumber yang cukup.
9. Transfer yang tidak memenuhi aturan ditolak dan menghasilkan peringatan saldo tidak mencukupi bila penyebabnya adalah saldo sumber.
10. Kategori custom dapat dibuat, diedit, dan dinonaktifkan; kategori default tidak dapat diubah atau dinonaktifkan.
11. Nama dan tipe kategori aktif harus unik.
12. Bill baru berstatus `is_paid=false`.
13. Bill hanya dapat berstatus paid atau unpaid.
14. Hanya bill dengan `is_paid=false` yang masuk ke Total Unpaid Bills.

## 4. Perhitungan Ledger

`Saldo Akun = initial_balance + Σ(INCOME) - Σ(EXPENSE) - Σ(TRANSFER_out) + Σ(TRANSFER_in)`

Current Balance adalah total saldo seluruh akun aktif.

Safe-to-Spend MVP adalah:

`Safe-to-Spend = Current Balance - Total Unpaid Bills`

Bill Management mencakup create, edit, delete, dan perubahan status paid/unpaid. Operasi bill harus mempertahankan nominal integer dan due date yang valid.

## 5. Aturan Transfer

Transfer yang berhasil:

- Mengurangi saldo akun sumber sebesar `N`.
- Menambah saldo akun tujuan sebesar `N`.
- Dicatat sebagai satu transaksi bertipe `TRANSFER`.
- Diproses sebagai satu operasi logical atomic.
- Tidak mengubah net worth keseluruhan pengguna.

Jika salah satu langkah atomic gagal, perubahan tidak boleh dianggap berhasil.

## 6. Schema dan Implementasi Aktual

Schema aktual menggunakan Dexie version 4. Migration mengonversi data lama `is_active` dengan nilai `0/1` menjadi boolean dan mengaktifkan kategori lama yang belum memiliki `is_active`. Karena boolean bukan IndexedDB index key, akun dan kategori aktif diambil melalui filter, bukan melalui `.equals(true)` pada index.

Pemeriksaan saldo sumber transfer diimplementasikan di service transfer dan dijalankan dalam operasi atomic bersama penyimpanan transaksi.
