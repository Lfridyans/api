// ============================================================================
// TEMA WARNA UNIFIED - NATARU TRAFFIC PREDICTOR
// ============================================================================
// Skema warna konsisten untuk seluruh aplikasi berdasarkan referensi tabel

export const theme = {
  // Primary Colors - Biru untuk data utama
  primary: {
    50: 'bg-blue-50',
    100: 'bg-blue-100',
    200: 'bg-blue-200',
    300: 'bg-blue-300',
    400: 'bg-blue-400',
    500: 'bg-blue-500',
    600: 'bg-blue-600',
    700: 'bg-blue-700',
    800: 'bg-blue-800',
    900: 'bg-blue-900',
    text: {
      50: 'text-blue-50',
      100: 'text-blue-100',
      200: 'text-blue-200',
      300: 'text-blue-300',
      400: 'text-blue-400',
      500: 'text-blue-500',
      600: 'text-blue-600',
      700: 'text-blue-700',
      800: 'text-blue-800',
      900: 'text-blue-900',
    }
  },

  // Secondary Colors - Indigo untuk prediksi
  secondary: {
    50: 'bg-indigo-50',
    100: 'bg-indigo-100',
    200: 'bg-indigo-200',
    300: 'bg-indigo-300',
    400: 'bg-indigo-400',
    500: 'bg-indigo-500',
    600: 'bg-indigo-600',
    700: 'bg-indigo-700',
    text: {
      50: 'text-indigo-50',
      100: 'text-indigo-100',
      200: 'text-indigo-200',
      300: 'text-indigo-300',
      400: 'text-indigo-400',
      500: 'text-indigo-500',
      600: 'text-indigo-600',
      700: 'text-indigo-700',
    }
  },

  // Success/Peak - Hijau untuk peak dates & positive growth
  success: {
    50: 'bg-green-50',
    100: 'bg-green-100',
    200: 'bg-green-200',
    300: 'bg-green-300',
    400: 'bg-green-400',
    500: 'bg-green-500',
    600: 'bg-green-600',
    700: 'bg-green-700',
    text: {
      50: 'text-green-50',
      100: 'text-green-100',
      200: 'text-green-200',
      300: 'text-green-300',
      400: 'text-green-400',
      500: 'text-green-500',
      600: 'text-green-600',
      700: 'text-green-700',
    }
  },

  // Warning/Holiday - Merah untuk holiday dates & negative growth
  warning: {
    50: 'bg-red-50',
    100: 'bg-red-100',
    200: 'bg-red-200',
    300: 'bg-red-300',
    400: 'bg-red-400',
    500: 'bg-red-500',
    600: 'bg-red-600',
    700: 'bg-red-700',
    text: {
      50: 'text-red-50',
      100: 'text-red-100',
      200: 'text-red-200',
      300: 'text-red-300',
      400: 'text-red-400',
      500: 'text-red-500',
      600: 'text-red-600',
      700: 'text-red-700',
    }
  },

  // Neutral Colors - Slate untuk background & text
  neutral: {
    50: 'bg-slate-50',
    100: 'bg-slate-100',
    200: 'bg-slate-200',
    300: 'bg-slate-300',
    400: 'bg-slate-400',
    500: 'bg-slate-500',
    600: 'bg-slate-600',
    700: 'bg-slate-700',
    800: 'bg-slate-800',
    900: 'bg-slate-900',
    text: {
      50: 'text-slate-50',
      100: 'text-slate-100',
      200: 'text-slate-200',
      300: 'text-slate-300',
      400: 'text-slate-400',
      500: 'text-slate-500',
      600: 'text-slate-600',
      700: 'text-slate-700',
      800: 'text-slate-800',
      900: 'text-slate-900',
    }
  },

  // Accent Colors
  accent: {
    orange: {
      50: 'bg-orange-50',
      500: 'bg-orange-500',
      600: 'bg-orange-600',
      700: 'bg-orange-700',
      text: {
        50: 'text-orange-50',
        500: 'text-orange-500',
        600: 'text-orange-600',
        700: 'text-orange-700',
      }
    },
    amber: {
      50: 'bg-amber-50',
      400: 'bg-amber-400',
      500: 'bg-amber-500',
      600: 'bg-amber-600',
      text: {
        50: 'text-amber-50',
        400: 'text-amber-400',
        500: 'text-amber-500',
        600: 'text-amber-600',
      }
    },
    emerald: {
      50: 'bg-emerald-50',
      500: 'bg-emerald-500',
      600: 'bg-emerald-600',
      700: 'bg-emerald-700',
      text: {
        50: 'text-emerald-50',
        500: 'text-emerald-500',
        600: 'text-emerald-600',
        700: 'text-emerald-700',
      }
    }
  },

  // Semantic Colors
  semantic: {
    baseline: 'bg-blue-500', // Biru untuk baseline data
    prediction: 'bg-indigo-500', // Indigo untuk prediksi
    peak: 'bg-green-100', // Hijau muda untuk peak dates
    peakRing: 'ring-green-400', // Ring hijau untuk peak
    holiday: 'bg-red-100', // Merah muda untuk holiday
    holidayRing: 'ring-red-400', // Ring merah untuk holiday
    growthPositive: 'bg-emerald-500',
    growthPositiveText: 'text-emerald-600',
    growthNegative: 'bg-red-500',
    growthNegativeText: 'text-red-600',
    recovery: 'bg-slate-300',
    recoveryText: 'text-slate-800',
  }
};

// Helper functions untuk mendapatkan warna berdasarkan intensitas
export const getHeatmapColor = (value: number, maxValue: number) => {
  if (!value || value === 0) return 'bg-slate-50';
  
  const intensity = value / maxValue;
  if (intensity >= 0.9) return 'bg-blue-700 text-white';
  if (intensity >= 0.8) return 'bg-blue-600 text-white';
  if (intensity >= 0.7) return 'bg-blue-500 text-white';
  if (intensity >= 0.6) return 'bg-blue-400 text-white';
  if (intensity >= 0.5) return 'bg-blue-300';
  if (intensity >= 0.4) return 'bg-blue-200';
  if (intensity >= 0.3) return 'bg-blue-100';
  if (intensity >= 0.2) return 'bg-blue-50';
  return 'bg-slate-50';
};

export default theme;

