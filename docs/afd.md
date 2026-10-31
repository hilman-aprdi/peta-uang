# 🔄 Application Flow Documentation (AFD) — PetaUang

Dokumen ini menjelaskan alur kerja aplikasi PetaUang yang mencakup perjalanan pengguna (*User Flow*), logika sistem internal (*System Flow*), serta perubahan status data (*State Flow*) menggunakan format diagram Mermaid.

---

## 1. User Flow (Perjalanan Pengguna Utama)

Alur umum pengguna dari membuka aplikasi PWA PetaUang hingga mengelola keuangan harian.

```mermaid
flowchart TD
    Start([Buka Aplikasi PetaUang]) --> CheckPWA{Apakah Terinstal PWA?}
    CheckPWA -- Belum --> PromptInstall[Tampilkan Banner 'Install App']
    CheckPWA -- Sudah/Abaikan --> Dashboard[Halaman Utama Dashboard]
    
    PromptInstall --> Dashboard
    
    Dashboard --> ActionChoice{Pilih Aksi Pengguna}
    
    ActionChoice -->|Tambah Akun| FormAccount[Form Add Account]
    ActionChoice -->|Tambah Transaksi| FormTx[Form Expense/Income]
    ActionChoice -->|Transfer Uang| FormTransfer[Form Account Transfer]
    ActionChoice -->|Filter Periode| FilterMonth[Pilih Periode Bulan]
    ActionChoice -->|Export Data| ExportAction[Klik Export CSV]
    
    FormAccount --> SaveAccount[Simpan ke IndexedDB] --> Dashboard
    FormTx --> SaveTx[Simpan & Recalculate Saldo] --> Dashboard
    FormTransfer --> ExecTransfer[Eksekusi Atomic Transfer] --> Dashboard
    FilterMonth --> UpdateView[Update Tampilan Dashboard & List]
    ExportAction --> DownloadCSV[Download File CSV]
```

---

## 2. System Flow (Proses Internal Local-First)

Proses internal aplikasi dalam memproses data tanpa ketergantungan server (*Client-Side Engine*).

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant UI as React UI Component
    participant Storage as LocalStorage / State
    participant Engine as Finance Calculation Engine
    participant DB as Dexie.js (IndexedDB)

    User->>UI: Submit Form Transaksi
    UI->>Engine: Kirim Data Payload Transaksi
    Engine->>Engine: Validasi Input (TypeScript & Rules)
    
    alt Input Valid
        Engine->>DB: Atomic Transaction (Write Tx + Update Balance)
        DB-->>Engine: Transaction Success Status
        Engine->>UI: Trigger Live Query Refresh
        UI-->>User: Tampilkan Toast Success & Update Summary
    else Input Tidak Valid
        Engine-->>UI: Return Validation Error
        UI-->>User: Tampilkan Pesan Error di Form
    end
```

---

## 3. State Flow (Perubahan Status Objek Saldo & Transaksi)

### A. Lifecycle Status Transaksi
```mermaid
stateDiagram-v2
    [*] --> Draft: User Mengisi Form
    Draft --> Created: Validasi Sukses & Commit DB
    Created --> Active: Saldo Akun Ter-update
    
    state Active {
        [*] --> Normal
        Normal --> Edited: User Mengubah Nominal/Akun
        Edited --> Normal: Balance Adjustment Executed
    }
    
    Active --> SoftDeleted: User Menghapus Transaksi
    SoftDeleted --> [*]: Balance Restored & Record Removed
```

### B. Saldo Lifecycle (Current vs Safe-To-Spend)
```mermaid
stateDiagram-v2
    [*] --> InitialState : Buat Akun Baru (Initial Balance)

    state InitialState {
        direction TB
        InitCB : Current Balance = Initial Balance
        InitSTS : Safe-To-Spend = Initial Balance - Allocation
    }

    InitialState --> ActiveLifecycle : Transaksi / Operasi Pertama

    state ActiveLifecycle {
        direction TB

        state "Kalkulasi Saldo Berjalan" as CalcState {
            direction TB
            CB : Current Balance = Sum(Accounts)
            STS : Safe-To-Spend = Current Balance - UnpaidBills - GoalAllocations
        }

        state "Tipe Transaksi & Perubahan Data" as Operations {
            direction TB
            OpIncomeExpense : Tambah / Edit / Hapus Income & Expense
            OpTransfer : Transfer Antar-Akun (Pengisian / Top-Up)
        }

        Operations --> CalcState : Atomic Recalculation (Setiap Perubahan Data)
    }

    state OpTransfer {
        direction TB
        SrcAcc : Saldo Akun Asal (-N)
        DstAcc : Saldo Akun Tujuan (+N)
        NetBal : Total Current Balance (TETAP / Tidak Berubah)
    }

    ActiveLifecycle --> [*] : Reset / Hapus Database Lokal
```

---

## 4. Authentication & Registration Flow (Local Security Setup)

Karena PetaUang berarsitektur *Zero-Server / Local-First*, autentikasi bersifat **Local PIN Protection** (Opsional) untuk mengunci aplikasi di perangkat lokal.

```mermaid
flowchart TD
    A[Buka PetaUang] --> B{Apakah Local PIN Aktif?}
    B -- Tidak --> C[Langsung Masuk Dashboard]
    B -- Ya --> D[Tampilkan Prompt PIN / Biometric]
    D --> E{PIN Benar?}
    E -- Ya --> C
    E -- Tidak --> F[Tampilkan Pesan Error & Shake Animation] --> D
```

---

## 5. Transaction Flow (Expense & Income)

Alur penambahan pengeluaran atau pemasukan beserta kalkulasi saldo atomik.

```mermaid
flowchart TD
    A[Klik + Transaksi] --> B[Pilih Tipe: Expense / Income]
    B --> C[Isi Title, Amount, Category, Date, & Pay With/Account]
    C --> D[Klik Simpan]
    D --> E{Validasi Nominal > 0?}
    E -- Tidak --> F[Munculkan Validasi Input]
    E -- Ya --> G[Mulai Dexie Transaction]
    G --> H[Create Record Transaction]
    G --> I{Tipe Transaksi?}
    I -- Expense --> J[Update Balance: Akun - Amount]
    I -- Income --> K[Update Balance: Akun + Amount]
    J --> L[Commit Database]
    K --> L
    L --> M[Update Live Query & Dashboard UI]
```

---

## 6. Transfer Flow (Account Transfer)

Alur pemindahan dana antar-akun tanpa memengaruhi total Income/Expense bulanan.

```mermaid
flowchart TD
    A[Mulai Account Transfer] --> B[Pilih Akun Asal & Akun Tujuan]
    B --> C[Isi Nominal & Tanggal]
    C --> D{Akun Asal == Akun Tujuan?}
    D -- Ya --> E[Error: Akun asal & tujuan harus berbeda]
    D -- Tidak --> F{Saldo Akun Asal Cukup?}
    F -- Tidak/Warning --> G[Tampilkan Peringatan Saldo Minus]
    F -- Cukup/Lanjut --> H[Mulai Dexie Atomic Transaction]
    H --> I[Kurangi Saldo Akun Asal]
    H --> J[Tambah Saldo Akun Tujuan]
    H --> K[Catat Record Type: TRANSFER]
    I & J & K --> L[Commit & Sync UI]
```

---

## 7. Budget Tracking & Safe-to-Spend Flow

Logika pemrosesan indikator "Saldo Sesungguhnya" (*Safe-to-Spend*).

```mermaid
flowchart TD
    A[Fetch Total Saldo Seluruh Akun] --> B[Current Balance]
    C[Fetch Total Tagihan Belum Dibayar] --> D[Pending Obligations]
    E[Fetch Alokasi Target Tabungan] --> F[Savings Allocations]
    
    B & D & F --> G[Engine Calculations: SafeToSpend = Current - Pending - Savings]
    G --> H{Hasil SafeToSpend < 0?}
    H -- Ya --> I[Display Warning: Defisit / Warning Color Red]
    H -- Tidak --> J[Display Safe-to-Spend: Safe/Color Green]
```

---

## 8. Export All Transactions Flow

Alur ekspor seluruh data lokal ke format file CSV.

```mermaid
flowchart TD
    A[Klik Export All Transactions] --> B[Query Seluruh Data dari Tabel Transactions]
    B --> C{Data Ada?}
    C -- Tidak --> D[Toast Notification: Tidak ada data transaksi]
    C -- Ada --> E[Formatting Data Array ke JSON Clean]
    E --> F[Parse JSON ke CSV String via PapaParse / Utility]
    F --> G[Generate Blob File: PetaUang_Transactions_Date.csv]
    G --> H[Trigger Browser Auto Download]
```

---

## 9. Error and Empty-State Flow

Penanganan tampilan saat data kosong (*Empty State*) atau terjadi kegagalan lokal.

```mermaid
flowchart TD
    A[Aplikasi Dibuka] --> B{Cek Data Akun di IndexedDB}
    B -- Kosong --> C[Tampilkan Empty State: 'Belum Ada Akun Keuangan']
    C --> D[Button Call-To-Action: 'Buat Akun Pertama']
    
    B -- Ada --> E{Cek Data Transaksi}
    E -- Kosong --> F[Tampilkan Summary Saldo Akun & Card Empty Transaction]
    E -- Ada --> G[Tampilkan Full Dashboard]
    
    G --> H{Terjadi Error IndexedDB?}
    H -- Ya --> I[Trigger ErrorBoundary UI]
    I --> J[Tampilkan Button 'Reload Application' / 'Reset Local Data']
```