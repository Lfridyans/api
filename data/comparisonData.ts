import { DailyData } from '../types';

/**
 * DATA PEMBANDING - PREDIKSI PENUMPANG NATARU 2025-2026
 * 
 * Data ini adalah PREDIKSI dari sumber eksternal (grafik) yang digunakan sebagai PEMBANDING saja.
 * BUKAN untuk ditiru atau dijadikan target, hanya sebagai referensi tambahan untuk konteks.
 * 
 * Sumber: Grafik "PREDIKSI JUMLAH PENUMPANG PERIODE NATAL 2025 DAN TAHUN BARU 2026"
 * Periode: 18 Desember 2025 - 4 Januari 2026
 */

export interface ComparisonData {
  date: string;
  domestic: number; // DOM 2025
  international: number; // INT 2025
  total: number; // DOM + INT
}

/**
 * Data pembanding prediksi penumpang domestik dan internasional
 * Periode: 18 Des 2025 - 4 Jan 2026
 */
export const COMPARISON_PREDICTION_DATA: ComparisonData[] = [
  { date: '2025-12-18', domestic: 216702, international: 60100, total: 276802 },
  { date: '2025-12-19', domestic: 219534, international: 64107, total: 283641 },
  { date: '2025-12-20', domestic: 231246, international: 67210, total: 298456 },
  { date: '2025-12-21', domestic: 241020, international: 70775, total: 311795 }, // Peak Natal
  { date: '2025-12-22', domestic: 204948, international: 59437, total: 264385 },
  { date: '2025-12-23', domestic: 209985, international: 63203, total: 273188 },
  { date: '2025-12-24', domestic: 186399, international: 62540, total: 248939 },
  { date: '2025-12-25', domestic: 176378, international: 56337, total: 232715 }, // Hari Natal
  { date: '2025-12-26', domestic: 222091, international: 63918, total: 286009 },
  { date: '2025-12-27', domestic: 228486, international: 67021, total: 295507 },
  { date: '2025-12-28', domestic: 237772, international: 70341, total: 308113 }, // Peak Tahun Baru
  { date: '2025-12-29', domestic: 213544, international: 64256, total: 277800 },
  { date: '2025-12-30', domestic: 226539, international: 64571, total: 291110 },
  { date: '2025-12-31', domestic: 199241, international: 64138, total: 263379 },
  { date: '2026-01-01', domestic: 193560, international: 57000, total: 250560 }, // Tahun Baru
  { date: '2026-01-02', domestic: 224415, international: 61154, total: 285569 },
  { date: '2026-01-03', domestic: 232896, international: 67238, total: 300134 }, // Peak Balik
  { date: '2026-01-04', domestic: 234421, international: 67671, total: 302092 }, // Peak Balik
];

/**
 * Get comparison data for a specific date
 * Returns null if date not found
 */
export const getComparisonData = (date: string): ComparisonData | null => {
  return COMPARISON_PREDICTION_DATA.find(d => d.date === date) || null;
};

/**
 * Get all comparison data within a date range
 */
export const getComparisonDataRange = (startDate: string, endDate: string): ComparisonData[] => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  return COMPARISON_PREDICTION_DATA.filter(d => {
    const date = new Date(d.date);
    return date >= start && date <= end;
  });
};

/**
 * Get peak dates from comparison data
 */
export const getComparisonPeakDates = (): { date: string; type: string; value: number }[] => {
  return [
    { date: '2025-12-21', type: 'Puncak Arus Libur Natal 2025', value: 241020 },
    { date: '2025-12-28', type: 'Puncak Arus Libur Tahun Baru 2025', value: 237772 },
    { date: '2026-01-03', type: 'Puncak Arus Balik', value: 232896 },
    { date: '2026-01-04', type: 'Puncak Arus Balik', value: 234421 },
  ];
};


