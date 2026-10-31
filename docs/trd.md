# 🛠️ Technical Requirements Document (TRD) — PetaUang

## 1. Technical Overview
PetaUang dibangun sebagai **Progressive Web App (PWA)** berperforma tinggi (*zero-latency*) dengan filosofi **Local-First / Client-Side Architecture**. 

Aplikasi tidak bergantung pada *network request* ke server database eksternal untuk operasi pencatatan harian. Seluruh pemrosesan logika finansial, *state management*, serta penyimpanan data berjalan langsung di browser pengguna (*in-device*) menggunakan **IndexedDB**. 

Strategi ini menjamin performa super cepat, *instant page load*, serta fungsi *100% offline-first* tanpa biaya infrastruktur server database harian.

---

## 2. Technology Stack

| Layer | Teknologi / Library | Alasan Pemilihan |
| :--- | :--- | :--- |
| **Language** | TypeScript (v5.x) | Menjamin ketepatan tipe data finansial (*type safety*) dan mencegah *runtime error*. |
| **Framework** | Next.js (App Router, Export SSG) | Digunakan untuk struktur UI modern, routing cepat, dan kompilasi Static Site Generation (SSG). |
| **Styling** | Tailwind CSS (v3.x / v4.x) | Utility-first CSS untuk rendering UI responsif, ringan, dan minifikasi otomatis. |
| **Local Database** | Dexie.js (Wrapper IndexedDB) | Wrapper IndexedDB yang *lightweight*, mendukung *reactive queries* (useLiveQuery), dan operasi *ACID transaction* lokal. |
| **PWA Engine** | `@ducanh2912/next-pwa` / Serwist | Manajemen Service Worker, *caching asset static*, dan kemampuan *Add to Home Screen*. |
| **State & UI Helper**| React Context / Zustand + Lucide React | *State management* lokal yang presisi untuk filter modal dan set ikon UI yang efisien. |
| **Data Export** | `papaparse` / Native Blob CSV | Konversi array objek transaksi ke format file `.csv` langsung di *client-side*. |
| **Hosting & CI/CD**| Netlify | Hosting statis gratis, sangat cepat via Global CDN, dengan *automated build* dari GitHub. |

---

## 3. System Architecture

Arsitektur PetaUang berfokus sepenuhnya pada **Client-Side Execution**:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        USER DEVICE / BROWSER                            │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                    PWA Application Layer (UI)                    │  │
│  │         Next.js App Router (Static Pages & Client Components)     │  │
│  └─────────────────────────────────┬────────────────────────────────┘  │
│                                    │                                    │
│  ┌─────────────────────────────────▼────────────────────────────────┐  │
│  │                   Financial Logic Engine (Pure JS)               │  │
│  │     - Safe-to-Spend Calculation  - Atomic Balance Modifiers       │  │
│  └─────────────────────────────────┬────────────────────────────────┘  │
│                                    │                                    │
│  ┌─────────────────────────────────▼────────────────────────────────┐  │
│  │                 Dexie.js (IndexedDB ORM Layer)                   │  │
│  └─────────────────────────────────┬────────────────────────────────┘  │
│                                    │                                    │
│  ┌─────────────────────────────────▼────────────────────────────────┐  │
│  │                Browser IndexedDB (Local Storage)                 │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Application Structure

```
petauang/
├── public/
│   ├── manifest.json            # Manifest PWA (Ikon, Nama, Standalone UI)
│   ├── sw.js                    # Service Worker File
│   └── icons/                   # App Icons (192px, 512px)
├── src/
│   ├── app/
│   │   ├── layout.tsx           # Root Layout & PWA Provider
│   │   ├── page.tsx             # Dashboard (Info Saldo, Transaksi Terakhir)
│   │   ├── transactions/
│   │   │   └── page.tsx         # Daftar Transaksi & Filter Periode
│   │   ├── accounts/
│   │   │   └── page.tsx         # Manajemen Akun Keuangan
│   │   └── settings/
│   │       └── page.tsx         # Backup, Restore & Export CSV
│   ├── components/
│   │   ├── ui/                  # Button, Modal, Card, Dropdown
│   │   ├── dashboard/           # Summary Cards, Safe-To-Spend Widget
│   │   ├── forms/               # ExpenseForm, IncomeForm, TransferForm
│   │   └── transactions/        # TransactionTable, PeriodFilter
│   ├── lib/
│   │   ├── db/
│   │   │   ├── index.ts         # Inisialisasi Dexie Database & Schema
│   │   │   └── repository.ts    # Transaksi DB Atomik (CRUD & Balance Sync)
│   │   ├── finance/
│   │   │   └── calculations.ts  # Logika Murni (Safe-to-Spend & Current Balance)
│   │   ├── utils/
│   │   │   ├── currency.ts      # Format Rupiah (Intl.NumberFormat)
│   │   │   └── exportCsv.ts     # Converter JSON ke CSV
│   │   └── types/
│   │       └── index.ts         # TypeScript Interfaces
│   └── styles/
│       └── globals.css          # Tailwind Directives
├── next.config.mjs              # Next.js Config (Static Output + PWA Config)
├── netlify.toml                 # Konfigurasi Build & Headers Netlify
└── package.json
```

---

## 5. Frontend Architecture

### Routing & Render Strategy
*   Semua *route* menggunakan Client Components (`'use client'`) yang di-*export* sebagai **Static HTML/JS Bundle** (`output: 'export'`).
*   Tidak ada ketergantungan pada Node.js server *runtime* saat halaman diakses.

### State Management & Reactivity
*   **Persistent State:** Dikelola oleh `useLiveQuery` dari `dexie-react-hooks`. Komponen React akan di-*re-render* secara otomatis hanya ketika ada data di IndexedDB yang berubah.
*   **UI State:** Menggunakan React `useState` lokal untuk kontrol pembukaan modal dialog, filter bulan, dan *loading states*.

### Form Management & Input Modals
*   Form input (Expense/Income) memanfaatkan *controlled components* dengan TypeScript type-safety.
*   Pilihan dropdown **Pay With / Account Types** di-populate secara dinamis dari tabel `accounts`.

---

## 6. Backend Architecture (Serverless / Static)

Karena proyek ini berbasis *Offline-First PWA*, **Backend Server Tradisional ditiadakan (Zero Backend)**.

*   **Server Actions / API Routes:** Tidak digunakan. Seluruh transaksi diproses langsung di *main thread / web worker* browser.
*   **Database Engine:** Direct Client Database Access melalui IndexedDB.
*   **Database Transaction Safety:** Pengubahan saldo dan pembuatan riwayat transaksi diisolasi dalam fungsi **Dexie Transaction**:
    ```typescript
    await db.transaction('rw', [db.accounts, db.transactions], async () => {
      // 1. Catat transaksi
      // 2. Sesuaikan saldo akun terkait
      // Jika salah satu gagal, seluruh operasi akan di-rollback otomatis
    });
    ```

---

## 7. Authentication

*   **Mekanisme:** **Zero Auth / No Login Required**.
*   Aplikasi berprinsip *self-contained*. Keamanan data disandarkan pada isolasi fisik *sandbox* browser tempat aplikasi dibuka.

---

## 8. Authorization

*   **Hak Akses:** *Single Owner Permission*. Siapa pun yang memegang/membuka perangkat lokal tersebut memiliki hak akses penuh terhadap data lokal di browser perangkat tersebut.

---

## 9. Data Flow

### Contoh Alur Tambah Expense (Pengeluaran):

```
[ User Input di UI Form ]
         │
         ▼ (Submit Handler)
[ Validasi Input Type-Safe (TypeScript) ]
         │
         ▼
[ Executive Function: `addExpenseTransaction()` ]
         │
         ▼
[ Dexie.js ACID Transaction (IndexedDB) ]
    ├─► INSERT Into Table `transactions`
    └─► UPDATE Table `accounts` (Current Balance - Amount)
         │
         ▼
[ Trigger Reactive Event (`useLiveQuery`) ]
         │
         ▼
[ Auto Re-Render UI Dashboard & Transaction List (< 16ms) ]
```

---

## 10. Security Requirements

1.  **Zero Cloud Exposure:** Data keuangan pribadi tidak pernah dikirim melalui jaringan internet (*zero network transmission*), sehingga kebal terhadap kebocoran data dari sisi server.
2.  **Input Sanitization:** Mencegah XSS injection pada judul transaksi/catatan dengan membersihkan string sebelum disimpan ke database local.
3.  **Strict Integer Arithmetic:** Nilai nominal keuangan diproses dan disimpan sebagai **Integer (Rupiah utuh)** untuk menghindari masalah kepresisian angka desimal desimal floating-point JavaScript.

---

## 11. Error Handling

*   **Database Failure:** Menerapkan pembungkus `try-catch` pada setiap panggilan repositori database. Jika pembacaan/penulisan ke IndexedDB gagal, tampilkan notifikasi Toast UI yang informatif.
*   **IndexedDB Quota Limit:** Deteksi kuota penyimpanan browser dan tampilkan peringatan jika penyimpanan lokal hampir penuh.
*   **Fallback Boundaries:** Menggunakan React `ErrorBoundary` untuk menangkap crash pada UI dan mencegah halaman menjadi layar putih polos.

---

## 12. Performance Optimization (Focus: Zero-Lag)

Untuk memastikan aplikasi berjalan dengan kecepatan maksimal dan tanpa lag sama sekali:

1.  **Static Export Bundle:** Aplikasi di-*build* menjadi file HTML/JS/CSS statis murni via `output: 'export'` pada `next.config.mjs`.
2.  **Zero Network Latency:** Karena data dibaca dari memori lokal (IndexedDB), waktu *fetch* data rata-rata adalah **< 5-10 ms** (dibandingkan API Cloud yang membutuhkan 200-500 ms).
3.  **Asset Minification & Code Splitting:**
    *   Penggunaan Lucide React yang di-*tree-shake* secara presisi.
    *   Dynamic import untuk komponen berat (misal: Library Ekspor CSV / Modal Form).
4.  **Service Worker Caching Strategy:**
    *   **Stale-While-Revalidate** untuk aset statis (HTML/JS/CSS/Ikon).
    *   Aplikasi dapat dibuka seketika dalam mode offline (*instant startup*).

---

## 13. Deployment & Hosting (Netlify)

### Configuration Setup
Proyek siap dideploy langsung ke **Netlify** menggunakan platform statis.

#### File: `next.config.mjs`
```javascript
/** @type {import('next').NextOptions} */
const nextConfig = {
  output: 'export', // Menghasilkan folder 'out' untuk file statis
  images: {
    unoptimized: true, // Diperlukan untuk export statis tanpa Node server
  },
};

export default nextConfig;
```

#### File: `netlify.toml`
```toml
[build]
  command = "npm run build"
  publish = "out"

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### Steps for Deployment to Netlify:
1. Push source code ke repositori GitHub.
2. Hubungkan repositori GitHub ke dashboard Netlify.
3. Set **Build Command:** `npm run build` dan **Publish Directory:** `out`.
4. Klik **Deploy Site**. Aplikasi siap diakses secara publik dan dapat diinstal sebagai PWA di HP/Desktop secara gratis.