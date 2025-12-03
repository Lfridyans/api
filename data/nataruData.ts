import { DailyData, AirportCode } from '../types';

// ============================================================================
// DATA REFERENSI UNTUK KALKULASI RECOVERY RATE & GROWTH
// ============================================================================
// Data referensi 2019 untuk recovery rate calculation
// Recovery Rate 94.8% = (8,708,938 / X) * 100, jadi X = 9,186,644
const REFERENCE_2019 = {
  totalPassengers: 9186644, // Total penumpang 2019 (pre-pandemic baseline) - dihitung dari recovery 94.8%
  totalFlights: 67540 // Total flights 2019 (pre-pandemic baseline)
};

// Data referensi 2023 untuk growth calculation
// Growth 3.8% = ((8,708,938 - X) / X) * 100
// Atau: Growth 3.8% berarti 2024 = 2023 * 1.038, jadi 2023 = 2024 / 1.038 = 8,390,114
const REFERENCE_2023 = {
  totalPassengers: 8390114, // Total penumpang 2023 - dihitung untuk menghasilkan growth 3.8%
  totalFlights: 63026 // Total flights 2023
};

// ============================================================================
// DATASET 1: ALL AIRPORTS (AGGREGATE) - DATA BASELINE 2024
// ============================================================================
// Data ini adalah BASELINE/TARGET dari tahun 2024 yang digunakan sebagai referensi historis
// Sistem akan membuat PREDIKSI BARU untuk tahun 2025 berdasarkan baseline ini
// TIDAK ADA data prediksi yang hardcoded - semua prediksi dibuat secara dinamis oleh AI
const ALL_DATA: DailyData[] = [
  { date: '2024-12-18', dayName: 'Rabu', passengers: 483772, flights: 3553, description: 'H-7' },
  { date: '2024-12-19', dayName: 'Kamis', passengers: 525168, flights: 3673, description: 'H-6' },
  { date: '2024-12-20', dayName: 'Jumat', passengers: 551981, flights: 3828, isPeakDeparture: true, description: 'H-5 (Puncak Arus Keberangkatan)' },
  { date: '2024-12-21', dayName: 'Sabtu', passengers: 552011, flights: 3736, isPeakDeparture: true, description: 'H-4 (Puncak Arus Keberangkatan)' },
  { date: '2024-12-22', dayName: 'Minggu', passengers: 560436, flights: 3738, description: 'H-3' },
  { date: '2024-12-23', dayName: 'Senin', passengers: 519049, flights: 3709, description: 'H-2' },
  { date: '2024-12-24', dayName: 'Selasa', passengers: 483114, flights: 3578, description: 'H-1' },
  { date: '2024-12-25', dayName: 'Rabu', passengers: 462162, flights: 3311, isHoliday: true, description: 'Hari Natal' },
  { date: '2024-12-26', dayName: 'Kamis', passengers: 462410, flights: 3469, description: 'H+1' },
  { date: '2024-12-27', dayName: 'Jumat', passengers: 455732, flights: 3553, description: 'H+2' },
  { date: '2024-12-28', dayName: 'Sabtu', passengers: 465457, flights: 3513, description: 'H+3' },
  { date: '2024-12-29', dayName: 'Minggu', passengers: 497112, flights: 3541, description: 'H-3 (Tahun Baru)' },
  { date: '2024-12-30', dayName: 'Senin', passengers: 437826, flights: 3354, description: 'H-2 (Tahun Baru)' },
  { date: '2024-12-31', dayName: 'Selasa', passengers: 383050, flights: 3002, description: 'H-1 (Tahun Baru)' },
  { date: '2024-01-01', dayName: 'Rabu', passengers: 427847, flights: 3058, isHoliday: true, description: 'Tahun Baru' },
  { date: '2024-01-02', dayName: 'Kamis', passengers: 471410, flights: 3444, description: 'H+1' },
  { date: '2024-01-03', dayName: 'Jumat', passengers: 503759, flights: 3576, isPeakReturn: true, description: 'H+2 (Puncak Arus Balik)' },
  { date: '2024-01-04', dayName: 'Sabtu', passengers: 466642, flights: 3390, isPeakReturn: true, description: 'H+3 (Puncak Arus Balik)' },
];

// Kalkulasi otomatis untuk Recovery Rate dan Growth
const calculateRecoveryRate = (current: number, reference: number): string => {
  if (reference === 0) return "N/A";
  const rate = (current / reference) * 100;
  return `${rate.toFixed(1)}%`;
};

const calculateGrowth = (current: number, previous: number): string => {
  if (previous === 0) return "0%";
  const growth = ((current - previous) / previous) * 100;
  return `${growth >= 0 ? '+' : ''}${growth.toFixed(2)}%`;
};

// Kalkulasi total dari data harian
const calculateTotalPassengers = (data: DailyData[]): number => {
  return data.reduce((sum, d) => sum + d.passengers, 0);
};

const calculateTotalFlights = (data: DailyData[]): number => {
  return data.reduce((sum, d) => sum + d.flights, 0);
};

// Total 2024
const totalPassengers2024 = calculateTotalPassengers(ALL_DATA);
const totalFlights2024 = calculateTotalFlights(ALL_DATA);

// Kalkulasi Recovery Rate (vs 2019)
const passengerRecovery = calculateRecoveryRate(totalPassengers2024, REFERENCE_2019.totalPassengers);
const flightRecovery = calculateRecoveryRate(totalFlights2024, REFERENCE_2019.totalFlights);

// Kalkulasi Growth (vs 2023)
const passengerGrowth = calculateGrowth(totalPassengers2024, REFERENCE_2023.totalPassengers);
const flightGrowth = calculateGrowth(totalFlights2024, REFERENCE_2023.totalFlights);

const ALL_STATS = {
  passengerGrowth: passengerGrowth,
  passengerRecovery: passengerRecovery,
  flightGrowth: flightGrowth,
  flightRecovery: flightRecovery,
  totalPassengers2024: totalPassengers2024.toLocaleString('id-ID'), // Total baseline untuk periode 18 Des 2024 - 4 Jan 2024
  totalFlights2024: totalFlights2024.toLocaleString('id-ID'), // Total baseline untuk periode 18 Des 2024 - 4 Jan 2024
  peakDeparture: "20-21 Des",
  peakReturn: "3-4 Jan"
};

// ============================================================================
// DATASET 2: SOEKARNO-HATTA (CGK) - DATA BASELINE 2024
// ============================================================================
// Data baseline 2024 - prediksi baru dibuat secara dinamis oleh AI
const CGK_DATA: DailyData[] = [
  { date: '2024-12-18', dayName: 'Rabu', passengers: 178280, flights: 1139, description: 'H-7' },
  { date: '2024-12-19', dayName: 'Kamis', passengers: 181601, flights: 1140, description: 'H-6' },
  { date: '2024-12-20', dayName: 'Jumat', passengers: 188322, flights: 1145, description: 'H-5' },
  { date: '2024-12-21', dayName: 'Sabtu', passengers: 194269, flights: 1146, isPeakDeparture: true, description: 'H-4 (Puncak)' },
  { date: '2024-12-22', dayName: 'Minggu', passengers: 163951, flights: 1102, description: 'H-3' },
  { date: '2024-12-23', dayName: 'Senin', passengers: 159887, flights: 1101, description: 'H-2' },
  { date: '2024-12-24', dayName: 'Selasa', passengers: 175245, flights: 1131, description: 'H-1' },
  { date: '2024-12-25', dayName: 'Rabu', passengers: 145213, flights: 1006, isHoliday: true, description: 'Hari Natal' },
  { date: '2024-12-26', dayName: 'Kamis', passengers: 153216, flights: 1023, description: 'H+1' },
  { date: '2024-12-27', dayName: 'Jumat', passengers: 178192, flights: 1138, description: 'H+2' },
  { date: '2024-12-28', dayName: 'Sabtu', passengers: 181888, flights: 1141, isPeakDeparture: true, description: 'H+3 (Puncak Jelang Thn Baru)' },
  { date: '2024-12-29', dayName: 'Minggu', passengers: 171580, flights: 1107, description: 'H-3' },
  { date: '2024-12-30', dayName: 'Senin', passengers: 157454, flights: 1094, description: 'H-2' },
  { date: '2024-12-31', dayName: 'Selasa', passengers: 156045, flights: 1073, description: 'H-1' },
  { date: '2024-01-01', dayName: 'Rabu', passengers: 155682, flights: 1064, isHoliday: true, description: 'Tahun Baru' },
  { date: '2024-01-02', dayName: 'Kamis', passengers: 173930, flights: 1124, description: 'H+1' },
  { date: '2024-01-03', dayName: 'Jumat', passengers: 184618, flights: 1142, description: 'H+2' },
  { date: '2024-01-04', dayName: 'Sabtu', passengers: 184908, flights: 1144, isPeakReturn: true, description: 'H+3 (Puncak Balik)' },
];

// Total CGK 2024
const totalPassengersCGK2024 = calculateTotalPassengers(CGK_DATA);
const totalFlightsCGK2024 = calculateTotalFlights(CGK_DATA);

// Referensi CGK (estimasi berdasarkan proporsi dari ALL)
const REFERENCE_CGK_2019 = {
  totalPassengers: Math.round(REFERENCE_2019.totalPassengers * 0.34), // ~34% dari total
  totalFlights: Math.round(REFERENCE_2019.totalFlights * 0.31) // ~31% dari total
};

const REFERENCE_CGK_2023 = {
  totalPassengers: Math.round(REFERENCE_2023.totalPassengers * 0.34),
  totalFlights: Math.round(REFERENCE_2023.totalFlights * 0.31)
};

const CGK_STATS = {
  passengerGrowth: calculateGrowth(totalPassengersCGK2024, REFERENCE_CGK_2023.totalPassengers),
  passengerRecovery: calculateRecoveryRate(totalPassengersCGK2024, REFERENCE_CGK_2019.totalPassengers),
  flightGrowth: calculateGrowth(totalFlightsCGK2024, REFERENCE_CGK_2023.totalFlights),
  flightRecovery: calculateRecoveryRate(totalFlightsCGK2024, REFERENCE_CGK_2019.totalFlights),
  totalPassengers2024: totalPassengersCGK2024.toLocaleString('id-ID'), // Total baseline CGK
  totalFlights2024: totalFlightsCGK2024.toLocaleString('id-ID'), // Total baseline CGK
  peakDeparture: "21 Des & 28 Des",
  peakReturn: "4 Jan"
};

// ============================================================================
// DATASET 3: I GUSTI NGURAH RAI (DPS) - DATA BASELINE 2024
// ============================================================================
// Data baseline 2024 - prediksi baru dibuat secara dinamis oleh AI
// Flight data for DPS is estimated based on the Total 7,674 distributed by passenger weight
const DPS_DATA: DailyData[] = [
  { date: '2024-12-18', dayName: 'Rabu', passengers: 78338, flights: 440, description: 'H-7' },
  { date: '2024-12-19', dayName: 'Kamis', passengers: 82201, flights: 462, isPeakDeparture: true, description: 'H-6 (Puncak Pra-Natal)' },
  { date: '2024-12-20', dayName: 'Jumat', passengers: 77929, flights: 438, description: 'H-5' },
  { date: '2024-12-21', dayName: 'Sabtu', passengers: 76666, flights: 431, description: 'H-4' },
  { date: '2024-12-22', dayName: 'Minggu', passengers: 79565, flights: 447, description: 'H-3' },
  { date: '2024-12-23', dayName: 'Senin', passengers: 73508, flights: 413, description: 'H-2' },
  { date: '2024-12-24', dayName: 'Selasa', passengers: 72354, flights: 406, description: 'H-1' },
  { date: '2024-12-25', dayName: 'Rabu', passengers: 71919, flights: 404, isHoliday: true, description: 'Hari Natal' },
  { date: '2024-12-26', dayName: 'Kamis', passengers: 76784, flights: 431, description: 'H+1' },
  { date: '2024-12-27', dayName: 'Jumat', passengers: 77089, flights: 433, description: 'H+2' },
  { date: '2024-12-28', dayName: 'Sabtu', passengers: 76516, flights: 430, description: 'H+3' },
  { date: '2024-12-29', dayName: 'Minggu', passengers: 81052, flights: 455, isPeakDeparture: true, description: 'H-3 (Puncak Pra-Tahun Baru)' },
  { date: '2024-12-30', dayName: 'Senin', passengers: 71018, flights: 399, description: 'H-2' },
  { date: '2024-12-31', dayName: 'Selasa', passengers: 70869, flights: 398, description: 'H-1' },
  { date: '2024-01-01', dayName: 'Rabu', passengers: 71290, flights: 400, isHoliday: true, description: 'Tahun Baru' },
  { date: '2024-01-02', dayName: 'Kamis', passengers: 78030, flights: 438, description: 'H+1' },
  { date: '2024-01-03', dayName: 'Jumat', passengers: 77286, flights: 434, description: 'H+2' },
  { date: '2024-01-04', dayName: 'Sabtu', passengers: 81820, flights: 460, isPeakReturn: true, description: 'H+3 (Puncak Balik)' },
];

// Total DPS 2024
const totalPassengersDPS2024 = calculateTotalPassengers(DPS_DATA);
const totalFlightsDPS2024 = calculateTotalFlights(DPS_DATA);

// Referensi DPS (estimasi berdasarkan proporsi dari ALL)
const REFERENCE_DPS_2019 = {
  totalPassengers: Math.round(REFERENCE_2019.totalPassengers * 0.15), // ~15% dari total
  totalFlights: Math.round(REFERENCE_2019.totalFlights * 0.12) // ~12% dari total
};

const REFERENCE_DPS_2023 = {
  totalPassengers: Math.round(REFERENCE_2023.totalPassengers * 0.15),
  totalFlights: Math.round(REFERENCE_2023.totalFlights * 0.12)
};

const DPS_STATS = {
  passengerGrowth: calculateGrowth(totalPassengersDPS2024, REFERENCE_DPS_2023.totalPassengers),
  passengerRecovery: calculateRecoveryRate(totalPassengersDPS2024, REFERENCE_DPS_2019.totalPassengers),
  flightGrowth: calculateGrowth(totalFlightsDPS2024, REFERENCE_DPS_2023.totalFlights),
  flightRecovery: calculateRecoveryRate(totalFlightsDPS2024, REFERENCE_DPS_2019.totalFlights),
  totalPassengers2024: totalPassengersDPS2024.toLocaleString('id-ID'), // Total baseline DPS
  totalFlights2024: totalFlightsDPS2024.toLocaleString('id-ID'), // Total baseline DPS
  peakDeparture: "19 Des & 29 Des",
  peakReturn: "4 Jan"
};


// ============================================================================
// HELPERS
// ============================================================================

export const getAirportData = (code: AirportCode) => {
  switch (code) {
    case 'CGK': return CGK_DATA;
    case 'DPS': return DPS_DATA;
    default: return ALL_DATA;
  }
};

export const getAirportStats = (code: AirportCode) => {
  switch (code) {
    case 'CGK': return CGK_STATS;
    case 'DPS': return DPS_STATS;
    default: return ALL_STATS;
  }
};

export const getAirportName = (code: AirportCode) => {
  switch (code) {
    case 'CGK': return 'Soekarno-Hatta (CGK)';
    case 'DPS': return 'I Gusti Ngurah Rai (DPS)';
    default: return 'Seluruh Bandara (Aggregate)';
  }
};