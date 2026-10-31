# 🗄️ Backend Schema Documentation (BSD) — PetaUang

## 1. Schema Overview
PetaUang menggunakan arsitektur **Local-First Database** berbasis **IndexedDB** yang dikelola melalui **Dexie.js**. Seluruh data disimpan secara lokal pada perangkat pengguna (*client-side*).

Untuk menjamin integritas data finansial, PetaUang menggunakan **Single-Entry Ledger-like Model**, di mana **saldo akun bersifat *computed value*** yang merupakan akumulasi hasil penjumlahan (*aggregation*) dari seluruh riwayat mutasi transaksi di dalam database.

---

## 2. Database Tables Specification

### A. Table: `accounts`
Menyimpan daftar wadah penyimpanan uang pengguna (misal: Kas, Bank, E-Wallet).

| Field | Type | Constraint | Description |
| :--- | :--- | :--- | :--- |
| `id` | `VARCHAR(36)` | Primary Key | UUID v4 unik untuk setiap akun |
| `name` | `VARCHAR(100)` | Required | Nama akun (misal: "Bank Mandiri", "Gopay", "Dompet Kas") |
| `type` | `VARCHAR(20)` | Required | Jenis akun: `CASH` \| `BANK` \| `EWALLET` \| `INVESTMENT` |
| `initial_balance` | `BIGINT` | Required, Default: 0 | Saldo awal saat akun pertama kali dibuat (satuan Rupiah utuh) |
| `is_active` | `BOOLEAN` | Required, Default: `true` | Status keaktifan akun (untuk *soft-delete* / arsip) |
| `created_at` | `TIMESTAMP` | Required | Tanggal & waktu pembuatan akun |
| `updated_at` | `TIMESTAMP` | Required | Tanggal & waktu perubahan data akun terakhir |

---

### B. Table: `categories`
Menyimpan pengelompokan jenis transaksi pemasukan dan pengeluaran.

| Field | Type | Constraint | Description |
| :--- | :--- | :--- | :--- |
| `id` | `VARCHAR(36)` | Primary Key | UUID v4 unik untuk setiap kategori |
| `name` | `VARCHAR(100)` | Required | Nama kategori (misal: "Makanan & Minuman", "Gaji", "Transportasi") |
| `type` | `VARCHAR(10)` | Required | Tipe kategori: `INCOME` \| `EXPENSE` |
| `icon` | `VARCHAR(50)` | Nullable | Nama ikon identifier (misal: "utensils", "briefcase", "car") |
| `color` | `VARCHAR(20)` | Nullable | Kode warna hex/Tailwind untuk visualisasi UI |
| `is_system_default`| `BOOLEAN` | Default: `false` | `true` jika kategori bawaan sistem yang tidak bisa dihapus |
| `created_at` | `TIMESTAMP` | Required | Tanggal pembuatan kategori |

---

### C. Table: `transactions`
Menyimpan seluruh catatan mutasi keuangan (Pemasukan, Pengeluaran, dan Transfer).

| Field | Type | Constraint | Description |
| :--- | :--- | :--- | :--- |
| `id` | `VARCHAR(36)` | Primary Key | UUID v4 unik untuk setiap transaksi |
| `title` | `VARCHAR(255)` | Required | Judul/Deskripsi singkat transaksi |
| `type` | `VARCHAR(10)` | Required | Tipe transaksi: `INCOME` \| `EXPENSE` \| `TRANSFER` |
| `amount` | `BIGINT` | Required, Positive | Nominal uang dalam satuan Rupiah utuh (`> 0`) |
| `account_id` | `VARCHAR(36)` | Foreign Key -> `accounts.id` | Akun utama (Akun Pembayar pada *Expense*, Akun Penerima pada *Income*, Akun Asal pada *Transfer*) |
| `destination_account_id` | `VARCHAR(36)` | Nullable, Foreign Key -> `accounts.id` | Akun Tujuan (HANYA diisi jika `type = 'TRANSFER'`) |
| `category_id` | `VARCHAR(36)` | Nullable, Foreign Key -> `categories.id` | Kategori transaksi (Wajib untuk `INCOME`/`EXPENSE`, `null` untuk `TRANSFER`) |
| `transaction_date` | `TIMESTAMP` | Required | Tanggal & waktu sebenarnya transaksi terjadi |
| `note` | `TEXT` | Nullable | Catatan rincian tambahan |
| `created_at` | `TIMESTAMP` | Required | Waktu entri dicatat ke sistem |
| `updated_at` | `TIMESTAMP` | Required | Waktu entri terakhir diperbarui |

---

### D. Table: `budgets`
Menyimpan alokasi batas pengeluaran bulanan per kategori.

| Field | Type | Constraint | Description |
| :--- | :--- | :--- | :--- |
| `id` | `VARCHAR(36)` | Primary Key | UUID v4 unik untuk setiap entri anggaran |
| `category_id` | `VARCHAR(36)` | Foreign Key -> `categories.id` | Kategori yang dibatasi anggarannya |
| `period` | `VARCHAR(7)` | Required | Format periode bulan: `YYYY-MM` (contoh: "2026-10") |
| `limit_amount` | `BIGINT` | Required, Positive | Batas maksimal pengeluaran yang dialokasikan |
| `created_at` | `TIMESTAMP` | Required | Tanggal pembuatan budget |

---

### E. Table: `bills` (Unpaid Commitments for Safe-to-Spend)
Menyimpan daftar tagihan rutin mendatang yang digunakan untuk kalkulasi *Safe-to-Spend*.

| Field | Type | Constraint | Description |
| :--- | :--- | :--- | :--- |
| `id` | `VARCHAR(36)` | Primary Key | UUID v4 unik tagihan |
| `title` | `VARCHAR(255)` | Required | Nama tagihan (misal: "Listrik PLN", "Kost Bulanan", "WiFi") |
| `amount` | `BIGINT` | Required, Positive | Nominal tagihan yang harus dibayar |
| `due_date` | `TIMESTAMP` | Required | Tanggal jatuh tempo tagihan |
| `is_paid` | `BOOLEAN` | Default: `false` | `true` jika tagihan sudah dilunasi (diubah jadi *Expense*) |
| `created_at` | `TIMESTAMP` | Required | Tanggal pembuatan entri tagihan |

---

## 3. Core Business Rules & Invariants

Berikut adalah aturan bisnis mutlak (*Invariants*) yang **wajib dipatuhi oleh seluruh fungsi manipulasi data** di tingkat repositori/service:

### 1. Integer Currency Precision
*   Semua nilai moneter (`amount`, `initial_balance`, `limit_amount`) **wajib disimpan sebagai nilai Integer bulat (satuan Rupiah utuh)**.
*   Dilarang keras menggunakan tipe data *Float* / *Double* untuk menghindarkan kesalahan presisi aritmatika (*floating-point rounding bugs*).

### 2. Strict Positive Amounts
*   Atribut `amount` pada semua transaksi **harus selalu lebih besar dari nol (`amount > 0`)**.
*   Pengurangan saldo tidak ditentukan oleh tanda minus (`-`) pada nominal, melainkan ditentukan secara terstruktur oleh `type` transaksi (`EXPENSE` mengurangi, `INCOME` menambah).

### 3. Category Type Matching
*   Transaksi bertipe `EXPENSE` hanya boleh dihubungkan dengan `category_id` yang memiliki `type = 'EXPENSE'`.
*   Transaksi bertipe `INCOME` hanya boleh dihubungkan dengan `category_id` yang memiliki `type = 'INCOME'`.
*   Transaksi bertipe `TRANSFER` **wajib mengosongkan `category_id` (`null`)**.

### 4. Account Validation & Transfer Constraints
*   Transaksi hanya dapat menggunakan akun yang berstatus **`is_active = true`**.
*   Pada transaksi `TRANSFER`:
    *   `destination_account_id` **wajib diisi**.
    *   `account_id` (Akun Asal) dan `destination_account_id` (Akun Tujuan) **tidak boleh sama** (`account_id != destination_account_id`).

### 5. Atomic Balance Recalculation (Ledger Integrity)
*    **Saldo berjalan (*Current Balance*)** suatu akun tidak disimpan sebagai variabel bebas yang diubah manual, melainkan dihitung secara otomatis dengan rumus Ledger:

  `Saldo Akun` = `initial_balance` + Σ(`INCOME`) - Σ(`EXPENSE`) - Σ(`TRANSFER_out`) + Σ(`TRANSFER_in`)

*   Setiap operasi **Tambah**, **Edit**, atau **Hapus** transaksi HARUS dibungkus dalam satu **Dexie Database Transaction** (`db.transaction('rw', [db.transactions, db.accounts], ...)`).
*   Jika salah satu langkah penulisan data gagal, seluruh proses transaksi database wajib di-*rollback* secara otomatis.

---

## 4. Ledger Recalculation Algorithm

Berikut adalah contoh fungsi query logika perhitungan saldo mutlak pada Dexie.js:

```typescript
// Algorithm: Calculate Account Balance on-the-fly
async function getAccountBalance(accountId: string): Promise<number> {
  const account = await db.accounts.get(accountId);
  if (!account) throw new Error("Account not found");

  // 1. Get initial balance
  let balance = account.initial_balance;

  // 2. Fetch all transactions related to this account
  const transactions = await db.transactions
    .where('account_id').equals(accountId)
    .or('destination_account_id').equals(accountId)
    .toArray();

  // 3. Aggregate Ledger Entries
  for (const tx of transactions) {
    if (tx.type === 'INCOME' && tx.account_id === accountId) {
      balance += tx.amount;
    } else if (tx.type === 'EXPENSE' && tx.account_id === accountId) {
      balance -= tx.amount;
    } else if (tx.type === 'TRANSFER') {
      if (tx.account_id === accountId) {
        balance -= tx.amount; // Transfer Out
      }
      if (tx.destination_account_id === accountId) {
        balance += tx.amount; // Transfer In
      }
    }
  }

  return balance;
}