/**
 * Utility untuk membaca static assets di GitHub Pages
 * Handle base path otomatis untuk GitHub Pages
 */

// List file JSON yang tersedia di public/data/predictions/
// File ini akan ter-include dalam build
export const AVAILABLE_PREDICTION_FILES = [
  'predictions-20251204-024932-763-uq9x.json'
];

/**
 * Get base path untuk GitHub Pages
 * Di development: /
 * Di production (GitHub Pages): /api/
 */
export const getBasePath = (): string => {
  // Check jika running di GitHub Pages
  if (typeof window !== 'undefined') {
    const pathname = window.location.pathname;
    // GitHub Pages menggunakan base path seperti /api/
    if (pathname.startsWith('/api/')) {
      return '/api';
    }
  }
  return '';
};

/**
 * Get full path untuk static asset
 */
export const getStaticAssetPath = (path: string): string => {
  const base = getBasePath();
  // Remove leading slash jika ada
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  
  // Handle base path
  if (base) {
    return `${base}/${cleanPath}`;
  }
  // Jika tidak ada base path (development), return dengan leading slash
  return `/${cleanPath}`;
};

/**
 * Load list of available prediction files
 * Di GitHub Pages, kita hardcode list file yang tersedia
 */
export const getAvailablePredictionFiles = async (): Promise<Array<{
  name: string;
  size?: number;
  modified?: string;
}>> => {
  // Di GitHub Pages, return hardcoded list
  // File sudah ter-include dalam build di public/data/predictions/
  return AVAILABLE_PREDICTION_FILES.map(name => ({
    name,
    size: undefined,
    modified: undefined,
  }));
};

/**
 * Load prediction file dari static assets
 */
export const loadPredictionFile = async (filename: string): Promise<any> => {
  try {
    const filePath = getStaticAssetPath(`data/predictions/${filename}`);
    const response = await fetch(filePath);
    
    if (!response.ok) {
      throw new Error(`Failed to load file: ${response.statusText}`);
    }
    
    const jsonText = await response.text();
    return JSON.parse(jsonText);
  } catch (error) {
    console.error(`Failed to load prediction file ${filename}:`, error);
    throw error;
  }
};

