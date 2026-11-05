# Design Brief Document (DBD) — PetaUang

## 1. Arah Desain

PetaUang menggunakan pendekatan Swiss Editorial Design dan Modern Minimalist Utility. Fokus visual adalah keterbacaan angka, ketenangan, kejelasan status, dan entry transaksi yang cepat.

## 2. Prinsip Desain

1. **Mobile-first:** interaksi utama mudah dijangkau ibu jari.
2. **Function over decoration:** setiap elemen memiliki fungsi informasi.
3. **Clarity in numbers:** angka saldo memiliki hirarki paling kuat.
4. **Calm palette:** gunakan slate/zinc sebagai dasar, emerald untuk kondisi positif, rose untuk pengeluaran/peringatan, dan indigo/slate untuk transfer.
5. **Accessibility:** warna, focus state, label, keyboard navigation, dan screen-reader text harus memenuhi WCAG AA.

## 3. Kebijakan Gradient

Gradient bukan bahasa visual utama. Gradient boleh digunakan secara terbatas sebagai aksen dekoratif, tetapi:

- Hindari gradient agresif pada background utama, kartu, dan komponen informasi finansial.
- Utamakan warna solid, kontras yang jelas, dan hirarki visual.
- Gradient tidak boleh mengurangi keterbacaan atau aksesibilitas.

## 4. Sistem Warna

| Token | Light | Dark |
|---|---|---|
| Canvas | `slate-50` | `slate-950` |
| Surface | `white` | `slate-900` |
| Text primary | `slate-900` | `slate-50` |
| Text secondary | `slate-500` | `slate-400` |
| Border | `slate-200` | `slate-800` |
| Positive/income | `emerald-600` | `emerald-400` |
| Negative/expense | `rose-600` | `rose-400` |
| Transfer/info | `indigo-600` | `indigo-400` |

## 5. Tipografi dan Spacing

- UI text: Inter atau Plus Jakarta Sans.
- Angka/tabular data: monospace dengan tabular numbers.
- Hero balance: 36–48px, bold.
- Heading 1: 24px; Heading 2: 18px; body: 14px; caption: 12px.
- Basis spacing: skala 4px/8px.
- Padding kartu: 16px mobile, 24px desktop.
- Touch target interaktif minimal 44px.

## 6. Komponen

- Primary button: solid, kontras, rounded, minimal `h-11`.
- Secondary/ghost button: border netral dan hover lembut.
- Input nominal: monospace, mudah dibaca, integer Rupiah.
- Kartu: border tipis, rounded-xl, shadow ringan.
- Form transaksi: Bottom Sheet di mobile dan centered dialog di desktop.
- Focus state harus terlihat saat navigasi keyboard.

### 6.1 Priority Inbox

- Insight actionable ditampilkan sebagai daftar kartu vertikal tanpa batas jumlah; setiap kartu memakai kerangka visual yang sama dengan informasi finansial lain.
- Identitas utama kartu adalah label domain (`Saldo`, `Tagihan`, `Pengeluaran`, `Target`, `Data`). Badge urgensi tetap terlihat, sedangkan periode (`Harian`, `Mingguan`, `Bulanan`) menjadi metadata kecil berukuran lebih rendah.
- Angka defisit atau nominal dampak menjadi elemen paling dominan di dalam kartu. Label dan nilai evidence harus terbaca sebagai pasangan yang jelas.
- Warna mengikuti urgensi, bukan domain: merah untuk kritis, amber untuk peringatan, dan nada tenang untuk peluang, kerapian, atau informasi.
- Periode yang stabil atau menunggu data tidak dirender sebagai kartu penuh; keduanya diringkas menjadi chip kecil agar tidak berebut perhatian dengan masalah nyata.
- Empty state “Tidak ada hal mendesak” memakai nada emerald yang tenang dan tidak menampilkan CTA jika tidak ada tindakan yang diperlukan.

## 7. Layout dan Navigasi

Route utama:

- `/` — Dashboard.
- `/transactions` — Transaksi.
- `/accounts` — Dompet (Akun).
- `/bills` — Tagihan.
- `/goals` — Target tabungan.

Mobile menggunakan bottom navigation dan FAB untuk transaksi baru. Desktop menggunakan sidebar kiri sekitar `w-64` dan konten maksimal `max-w-6xl`. Tabs dan dialog hanya untuk navigasi sekunder dalam sebuah modul. Tidak ada route `/settings`.

Kartu Goal dan alokasi dana menggunakan pola kartu yang sama dengan informasi finansial lain: angka dominan, status jelas, dan aksi utama yang mudah dijangkau. Alokasi dana tidak boleh divisualisasikan sebagai perpindahan saldo akun.

## 8. Responsive Behavior

| Breakpoint | Perilaku |
|---|---|
| `< 640px` | Bottom navigation, single column, Bottom Sheet, FAB |
| `640px–1024px` | Sidebar icon-only, grid dua kolom, dialog sedang |
| `> 1024px` | Sidebar penuh, grid statistik, dialog terpusat |

## 9. UI State

- **Loading:** skeleton yang menyerupai bentuk konten akhir.
- **Error:** border dan teks rose, pesan spesifik di bawah field atau area terkait.
- **Empty:** ikon sederhana dan call-to-action yang jelas.
- **Success:** toast singkat setelah operasi berhasil.

## 10. Status Kepatuhan

Dokumen ini menetapkan arah desain, bukan klaim bahwa seluruh komponen telah tersedia. Implementasi dan verifikasi aktual dicatat di `PROJECT_STATUS.md` dan IPD.
