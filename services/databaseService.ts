/**
 * Database Service untuk menyimpan semua data prediksi ke file JSON lokal
 * Menggunakan File System Access API untuk write ke file lokal
 * Re-export dari fileStorageService untuk backward compatibility
 */

// Re-export semua dari fileStorageService
export {
  initDatabase,
  initializeFileHandles,
  savePrediction,
  saveBatchPrediction,
  saveCombinedBatchPredictions,
  getPredictionById,
  getPredictionsByQuery,
  getAllPredictions,
  getBatchPredictionById,
  getBatchPredictionByBatchId,
  getBatchPredictions,
  deletePrediction,
  deleteBatchPrediction,
  getPredictionStats,
  clearAllPredictions,
  exportAllDataToJSON,
  importDataFromJSON,
  downloadDataAsJSON,
  loadDataFromFile,
  loadFileByName,
  getSavedFilesList,
  getKesimpulanFromFile,
  updateKesimpulanForFile,
  type StoredPrediction,
  type StoredBatchPrediction,
} from './fileStorageService';