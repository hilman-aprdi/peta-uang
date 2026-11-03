/**
 * periodHelper.ts
 * Utilitas penanggalan kalender lokal ekuivalen untuk Financial Insight Engine PetaUang.
 * 
 * Prinsip:
 * 1. Murni menggunakan waktu kalender lokal (tanpa konversi offset UTC yang menggeser tanggal).
 * 2. Menghasilkan batas waktu pengamatan ekuivalen (Daily, Weekly WTD, Monthly MTD).
 * 3. Menangani kasus tanggal overflow antarbulan secara deterministik.
 */

export interface DateRange {
  start: Date;
  end: Date;
}

export interface ObservationWindows {
  currentWindow: DateRange;
  priorWindow: DateRange;
}

/**
 * Mengembalikan batas rentang hari ini dan hari kemarin berdasarkan kalender lokal.
 * Current: Hari ini 00:00:00.000 s.d. 23:59:59.999
 * Prior: Hari kemarin 00:00:00.000 s.d. 23:59:59.999
 */
export function getDailyWindows(referenceDate: Date = new Date()): ObservationWindows {
  const year = referenceDate.getFullYear();
  const month = referenceDate.getMonth();
  const day = referenceDate.getDate();

  const currentStart = new Date(year, month, day, 0, 0, 0, 0);
  const currentEnd = new Date(year, month, day, 23, 59, 59, 999);

  // Hari kemarin
  const priorStart = new Date(year, month, day - 1, 0, 0, 0, 0);
  const priorEnd = new Date(year, month, day - 1, 23, 59, 59, 999);

  return {
    currentWindow: { start: currentStart, end: currentEnd },
    priorWindow: { start: priorStart, end: priorEnd },
  };
}

/**
 * Mengembalikan batas rentang mingguan berjalan (WTD) vs periode ekuivalen minggu lalu.
 * Asumsi standar kalender lokal: Minggu dimulai dari hari Senin (Monday = 1, Sunday = 0).
 * Current: Senin minggu ini 00:00:00.000 s.d. referenceDate (atau akhir hari ini).
 * Prior: Senin minggu lalu 00:00:00.000 s.d. hari & jam yang setara pada minggu lalu.
 */
export function getWeeklyWindows(referenceDate: Date = new Date()): ObservationWindows {
  const current = new Date(referenceDate);
  const dayOfWeek = current.getDay(); // 0 = Minggu, 1 = Senin, ..., 6 = Sabtu
  // Hitung selisih hari dari hari Senin (Senin = 0 hari mundur, Minggu = 6 hari mundur)
  const daysFromMonday = (dayOfWeek + 6) % 7;

  const currentYear = current.getFullYear();
  const currentMonth = current.getMonth();
  const currentDay = current.getDate();

  // Awal minggu ini (Senin 00:00)
  const currentStart = new Date(currentYear, currentMonth, currentDay - daysFromMonday, 0, 0, 0, 0);
  // Akhir observasi minggu ini (akhir hari dari referenceDate)
  const currentEnd = new Date(currentYear, currentMonth, currentDay, 23, 59, 59, 999);

  // Awal minggu lalu (Senin - 7 hari)
  const priorStart = new Date(currentYear, currentMonth, currentDay - daysFromMonday - 7, 0, 0, 0, 0);
  // Akhir observasi minggu lalu (hari yang sama dengan currentDay - 7 hari)
  const priorEnd = new Date(currentYear, currentMonth, currentDay - 7, 23, 59, 59, 999);

  return {
    currentWindow: { start: currentStart, end: currentEnd },
    priorWindow: { start: priorStart, end: priorEnd },
  };
}

/**
 * Mengembalikan batas rentang bulanan berjalan (MTD) vs periode ekuivalen bulan lalu.
 * Current: Tanggal 1 bulan ini 00:00:00.000 s.d. referenceDate (akhir hari ini).
 * Prior: Tanggal 1 bulan lalu 00:00:00.000 s.d. tanggal setara bulan lalu (akhir hari).
 * 
 * Aturan Overflow:
 * Jika tanggal saat ini (misal 31 Maret) tidak ada di bulan sebelumnya (misal Februari hanya 28/29 hari),
 * maka priorEnd secara deterministik dipatok pada hari terakhir bulan tersebut (misal 28/29 Februari).
 */
export function getMonthlyWindows(referenceDate: Date = new Date()): ObservationWindows {
  const currentYear = referenceDate.getFullYear();
  const currentMonth = referenceDate.getMonth();
  const currentDay = referenceDate.getDate();

  // Current: Tanggal 1 bulan ini s.d. akhir hari referenceDate
  const currentStart = new Date(currentYear, currentMonth, 1, 0, 0, 0, 0);
  const currentEnd = new Date(currentYear, currentMonth, currentDay, 23, 59, 59, 999);

  // Bulan lalu
  const priorYear = currentMonth === 0 ? currentYear - 1 : currentYear;
  const priorMonth = currentMonth === 0 ? 11 : currentMonth - 1;

  // Hitung jumlah hari maksimal di bulan lalu (Date(year, month + 1, 0).getDate())
  const maxDaysInPriorMonth = new Date(priorYear, priorMonth + 1, 0).getDate();
  const priorDay = Math.min(currentDay, maxDaysInPriorMonth);

  const priorStart = new Date(priorYear, priorMonth, 1, 0, 0, 0, 0);
  const priorEnd = new Date(priorYear, priorMonth, priorDay, 23, 59, 59, 999);

  return {
    currentWindow: { start: currentStart, end: currentEnd },
    priorWindow: { start: priorStart, end: priorEnd },
  };
}

/**
 * Mengecek apakah timestamp ISO string berada di dalam rentang DateRange.
 */
export function isWithinRange(dateStr: string, range: DateRange): boolean {
  const time = Date.parse(dateStr);
  if (Number.isNaN(time)) return false;
  return time >= range.start.getTime() && time <= range.end.getTime();
}

/**
 * Mengambil key tanggal lokal (YYYY-MM-DD) dari string tanggal transaksi.
 */
export function getLocalDateKey(dateStr: string): string {
  if (dateStr.length >= 10) {
    return dateStr.slice(0, 10);
  }
  const d = new Date(dateStr);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}
