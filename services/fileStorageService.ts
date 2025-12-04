/**
 * File Storage Service untuk menyimpan data prediksi ke file JSON lokal
 * Auto-download file JSON dengan nama berdasarkan tanggal dan jam
 */

import type {
  PredictionResult,
  BatchPredictionResult,
  AirportCode,
  TrafficType,
} from '../types';

// Database schema types
export interface StoredPrediction extends PredictionResult {
  id: string;
  savedAt: string;
  requestType: TrafficType;
  requestScenario?: string;
}

export interface StoredBatchPrediction {
  id: string;
  batchId: string;
  airportCode: AirportCode;
  trafficType: TrafficType;
  scenario: string;
  generatedAt: string;
  savedAt: string;
  predictions: StoredPrediction[];
}

// TIDAK lagi menggunakan localStorage untuk menyimpan data prediksi
// Semua data tersimpan sebagai file JSON di folder data/predictions/

// Generate unique ID
const generateId = (): string => {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Generate filename berdasarkan tanggal dan jam
 */
const generateFileName = (prefix: string = 'predictions'): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  
  return `${prefix}-${year}${month}${day}-${hours}${minutes}${seconds}.json`;
};

/**
 * Load predictions - TIDAK lagi dari sessionStorage, langsung dari file
 */
const loadPredictions = (): StoredPrediction[] => {
  // TIDAK lagi load dari sessionStorage
  // Data akan di-load langsung dari file saat dibutuhkan
  return [];
};

/**
 * Save predictions ke file JSON langsung di folder data/predictions/
 */
const savePredictions = async (predictions: StoredPrediction[]): Promise<void> => {
  try {
    // Generate file JSON
    const json = JSON.stringify(predictions, null, 2);
    const filename = generateFileName('predictions');
    
    // Tulis file langsung ke folder (tidak download)
    await writeJSONFileToFolder(json, filename);
    
    // Simpan metadata file untuk tracking (tanpa content)
    saveFileMetadata(filename, 'predictions');
    console.log(`✅ Predictions saved to folder: ${filename}`);
  } catch (error) {
    console.error('Failed to save predictions:', error);
    throw new Error('Failed to save predictions to file');
  }
};

/**
 * Load batch predictions - TIDAK lagi dari sessionStorage, langsung dari file
 */
const loadBatchPredictions = (): StoredBatchPrediction[] => {
  // TIDAK lagi load dari sessionStorage
  // Data akan di-load langsung dari file saat dibutuhkan via getBatchPredictions
  return [];
};

/**
 * Save batch predictions ke file JSON (tidak simpan ke localStorage)
 * Setiap batch disimpan sebagai file terpisah dengan timestamp unik
 */
const saveBatchPredictions = async (batches: StoredBatchPrediction[]): Promise<void> => {
  try {
    // Simpan setiap batch sebagai file terpisah dengan timestamp unik
    for (const batch of batches) {
      // Generate filename dengan timestamp unik (termasuk milliseconds) untuk setiap batch
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      const milliseconds = String(now.getMilliseconds()).padStart(3, '0');
      
      // Buat filename yang unik berdasarkan timestamp (dengan milliseconds) dan traffic type
      const trafficTypeLabel = batch.trafficType === 'PASSENGER' ? 'pax' : 'flight';
      // Tambahkan random string untuk memastikan unik bahkan jika dibuat dalam millisecond yang sama
      const randomSuffix = Math.random().toString(36).substring(2, 6);
      const filename = `predictions-${year}${month}${day}-${hours}${minutes}${seconds}-${milliseconds}-${trafficTypeLabel}-${randomSuffix}.json`;
      
      // Simpan batch sebagai array of predictions (format yang diharapkan oleh importDataFromJSON)
      const predictionsArray = batch.predictions.map(pred => ({
        ...pred,
        airportCode: batch.airportCode,
        requestType: batch.trafficType,
        requestScenario: batch.scenario,
      }));
      
      const json = JSON.stringify(predictionsArray, null, 2);
      
      // Tulis file langsung ke folder (tidak download)
      await writeJSONFileToFolder(json, filename);
      
      // Simpan metadata file untuk tracking (tanpa content)
      saveFileMetadata(filename, 'batch');
      console.log(`✅ Batch predictions saved to NEW file: ${filename} (${batch.predictions.length} predictions)`);
    }
  } catch (error) {
    console.error('Failed to save batch predictions:', error);
    throw new Error('Failed to save batch predictions to file');
  }
};

/**
 * Write JSON file langsung ke folder data/predictions/ menggunakan server API
 */
const writeJSONFileToFolder = async (json: string, filename: string): Promise<void> => {
  try {
    // Gunakan server API endpoint untuk write file
    const response = await fetch('/api/write-file', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        filename,
        content: json,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to write file: ${response.statusText}`);
    }

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || 'Failed to write file');
    }

    console.log(`✅ File berhasil ditulis ke folder: ${filename}`);
  } catch (error) {
    console.error('Gagal menulis file ke folder:', error);
    // Fallback ke download jika server tidak tersedia
    console.warn('Fallback ke download file');
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
};

/**
 * Initialize database (tidak lagi menggunakan localStorage untuk predictions)
 */
export const initDatabase = async (): Promise<void> => {
  // Tidak lagi initialize localStorage untuk predictions
  // Data hanya disimpan sebagai file JSON
  console.log('✅ Database initialized (file-based storage)');
};

/**
 * Initialize file handles (no-op, tidak diperlukan lagi)
 */
export const initializeFileHandles = async (): Promise<{
  predictionsReady: boolean;
  batchesReady: boolean;
}> => {
  return {
    predictionsReady: true,
    batchesReady: true,
  };
};

/**
 * Save single prediction
 */
export const savePrediction = async (
  prediction: PredictionResult,
  requestType: TrafficType,
  requestScenario?: string
): Promise<string> => {
  await initDatabase();

  const storedPrediction: StoredPrediction = {
    ...prediction,
    id: generateId(),
    savedAt: new Date().toISOString(),
    requestType,
    requestScenario,
  };

  const predictions = loadPredictions();
  predictions.push(storedPrediction);
  await savePredictions(predictions);

  return storedPrediction.id;
};

/**
 * Save batch prediction
 * Setiap prediksi membuat file JSON baru dengan timestamp unik
 */
export const saveBatchPrediction = async (
  batchResult: BatchPredictionResult
): Promise<string> => {
  await initDatabase();

  const batchId = `${batchResult.airportCode}_${batchResult.trafficType}_${batchResult.scenario}_${Date.now()}`;

  const storedBatch: StoredBatchPrediction = {
    id: generateId(),
    batchId,
    airportCode: batchResult.airportCode,
    trafficType: batchResult.trafficType,
    scenario: batchResult.scenario,
    generatedAt: batchResult.generatedAt,
    savedAt: new Date().toISOString(),
    predictions: batchResult.predictions.map((pred) => ({
      ...pred,
      id: generateId(),
      savedAt: new Date().toISOString(),
      requestType: batchResult.trafficType,
      requestScenario: batchResult.scenario,
    })),
  };

  // TIDAK lagi simpan ke sessionStorage
  // Data akan disimpan langsung ke file oleh saveCombinedBatchPredictions

  console.log(`✅ Batch prepared for saving: ${batchId}`);
  return storedBatch.id;
};

/**
 * Save combined batch predictions (passenger + flight) dalam satu file JSON
 * Sekarang juga menyimpan kesimpulan yang di-generate oleh AI
 */
export const saveCombinedBatchPredictions = async (
  passengerBatch: BatchPredictionResult,
  flightBatch: BatchPredictionResult,
  kesimpulan?: string
): Promise<void> => {
  await initDatabase();

  // Import generateKesimpulan untuk generate kesimpulan jika belum ada
  if (!kesimpulan) {
    try {
      const { generateKesimpulan } = await import('./geminiService');
      const { getAirportData } = await import('../data/nataruData');
      const baselineData = getAirportData(passengerBatch.airportCode);
      
      // Generate kesimpulan untuk PASSENGER (default)
      kesimpulan = await generateKesimpulan(
        passengerBatch,
        flightBatch,
        baselineData,
        passengerBatch.trafficType
      );
      console.log('✅ Kesimpulan generated and will be saved to JSON');
    } catch (error) {
      console.warn('⚠️ Failed to generate kesimpulan:', error);
      kesimpulan = ''; // Fallback to empty string
    }
  }

  // Convert kedua batch ke StoredBatchPrediction
  const storedPassengerBatch: StoredBatchPrediction = {
    id: generateId(),
    batchId: `${passengerBatch.airportCode}_${passengerBatch.trafficType}_${passengerBatch.scenario}_${Date.now()}`,
    airportCode: passengerBatch.airportCode,
    trafficType: passengerBatch.trafficType,
    scenario: passengerBatch.scenario,
    generatedAt: passengerBatch.generatedAt,
    savedAt: new Date().toISOString(),
    predictions: passengerBatch.predictions.map((pred) => ({
      ...pred,
      id: generateId(),
      savedAt: new Date().toISOString(),
      requestType: passengerBatch.trafficType,
      requestScenario: passengerBatch.scenario,
    })),
  };

  const storedFlightBatch: StoredBatchPrediction = {
    id: generateId(),
    batchId: `${flightBatch.airportCode}_${flightBatch.trafficType}_${flightBatch.scenario}_${Date.now()}`,
    airportCode: flightBatch.airportCode,
    trafficType: flightBatch.trafficType,
    scenario: flightBatch.scenario,
    generatedAt: flightBatch.generatedAt,
    savedAt: new Date().toISOString(),
    predictions: flightBatch.predictions.map((pred) => ({
      ...pred,
      id: generateId(),
      savedAt: new Date().toISOString(),
      requestType: flightBatch.trafficType,
      requestScenario: flightBatch.scenario,
    })),
  };

  // TIDAK lagi simpan ke sessionStorage
  // Data langsung disimpan ke file

  // Gabungkan predictions dari kedua batch menjadi satu array
  const combinedPredictions = [
    ...storedPassengerBatch.predictions.map(pred => ({
      ...pred,
      airportCode: storedPassengerBatch.airportCode,
      requestType: storedPassengerBatch.trafficType,
      requestScenario: storedPassengerBatch.scenario,
    })),
    ...storedFlightBatch.predictions.map(pred => ({
      ...pred,
      airportCode: storedFlightBatch.airportCode,
      requestType: storedFlightBatch.trafficType,
      requestScenario: storedFlightBatch.scenario,
    })),
  ];

  // Generate filename dengan timestamp unik
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  const milliseconds = String(now.getMilliseconds()).padStart(3, '0');
  const randomSuffix = Math.random().toString(36).substring(2, 6);
  const filename = `predictions-${year}${month}${day}-${hours}${minutes}${seconds}-${milliseconds}-${randomSuffix}.json`;

  // Simpan sebagai object dengan predictions dan kesimpulan
  // Format: { predictions: [...], kesimpulan: "...", metadata: {...} }
  const fileData = {
    predictions: combinedPredictions,
    kesimpulan: kesimpulan || '',
    metadata: {
      airportCode: passengerBatch.airportCode,
      generatedAt: new Date().toISOString(),
      passengerCount: storedPassengerBatch.predictions.length,
      flightCount: storedFlightBatch.predictions.length,
      version: '2.0' // Version dengan kesimpulan
    }
  };

  const json = JSON.stringify(fileData, null, 2);

  // Tulis file langsung ke folder
  await writeJSONFileToFolder(json, filename);

  // Simpan metadata file untuk tracking
  saveFileMetadata(filename, 'batch');
  console.log(`✅ Combined batch predictions saved to file: ${filename} (${storedPassengerBatch.predictions.length} passenger + ${storedFlightBatch.predictions.length} flight predictions + kesimpulan)`);
};

/**
 * Get prediction by ID
 */
export const getPredictionById = async (
  id: string
): Promise<StoredPrediction | null> => {
  await initDatabase();
  const predictions = loadPredictions();
  return predictions.find((p) => p.id === id) || null;
};

/**
 * Get predictions by query
 */
export const getPredictionsByQuery = async (filters: {
  date?: string;
  airportCode?: AirportCode;
  requestType?: TrafficType;
  startDate?: string;
  endDate?: string;
}): Promise<StoredPrediction[]> => {
  await initDatabase();
  let predictions = loadPredictions();

  if (filters.date) {
    predictions = predictions.filter((p) => p.date === filters.date);
  }
  if (filters.airportCode) {
    predictions = predictions.filter((p) => p.airportCode === filters.airportCode);
  }
  if (filters.requestType) {
    predictions = predictions.filter((p) => p.requestType === filters.requestType);
  }
  if (filters.startDate) {
    predictions = predictions.filter((p) => p.date && p.date >= filters.startDate!);
  }
  if (filters.endDate) {
    predictions = predictions.filter((p) => p.date && p.date <= filters.endDate!);
  }

  predictions.sort((a, b) => {
    if (!a.date || !b.date) return 0;
    return b.date.localeCompare(a.date);
  });

  return predictions;
};

/**
 * Get all predictions
 */
export const getAllPredictions = async (): Promise<StoredPrediction[]> => {
  return getPredictionsByQuery({});
};

/**
 * Get batch prediction by ID
 */
export const getBatchPredictionById = async (
  id: string
): Promise<StoredBatchPrediction | null> => {
  await initDatabase();
  const batches = loadBatchPredictions();
  return batches.find((b) => b.id === id) || null;
};

/**
 * Get batch prediction by batchId
 */
export const getBatchPredictionByBatchId = async (
  batchId: string
): Promise<StoredBatchPrediction | null> => {
  await initDatabase();
  const batches = loadBatchPredictions();
  return batches.find((b) => b.batchId === batchId) || null;
};

/**
 * Get all batch predictions - Load langsung dari file terbaru
 */
export const getBatchPredictions = async (filters?: {
  airportCode?: AirportCode;
  trafficType?: TrafficType;
  scenario?: string;
}): Promise<StoredBatchPrediction[]> => {
  await initDatabase();
  
  // Load langsung dari static assets di GitHub Pages
  try {
    // Import static assets helper
    const { getAvailablePredictionFiles, loadPredictionFile } = await import('../utils/staticAssets');
    
    // Get list of available files
    const files = await getAvailablePredictionFiles();
    
    if (files && files.length > 0) {
      // Ambil file terbaru (first file)
      const latestFile = files[0];
      
      // Load file dari static assets
      const parsedData = await loadPredictionFile(latestFile.name);
          
      // Handle format baru: { predictions: [...], kesimpulan: "...", metadata: {...} }
      let predictionsArray: any[] = [];
      if (parsedData.predictions && Array.isArray(parsedData.predictions)) {
        // Format baru dengan kesimpulan
        predictionsArray = parsedData.predictions;
        // Simpan kesimpulan ke sessionStorage untuk akses cepat
        if (parsedData.kesimpulan) {
          try {
            sessionStorage.setItem('latest_kesimpulan', parsedData.kesimpulan);
          } catch (e) {
            console.warn('Failed to save kesimpulan to sessionStorage:', e);
          }
        }
      } else if (Array.isArray(parsedData) && parsedData.length > 0 && parsedData[0].predictedValue !== undefined) {
        // Format lama (array langsung)
        predictionsArray = parsedData;
      }
      
      if (predictionsArray.length > 0) {
        // Group predictions by trafficType
        const predictionsByType = new Map<TrafficType, typeof predictionsArray>();
        predictionsArray.forEach((pred: any) => {
          const trafficType = (pred.requestType || TrafficType.PASSENGER) as TrafficType;
          if (!predictionsByType.has(trafficType)) {
            predictionsByType.set(trafficType, []);
          }
          predictionsByType.get(trafficType)!.push(pred);
        });
        
        // Convert ke StoredBatchPrediction format
        const batches: StoredBatchPrediction[] = Array.from(predictionsByType.entries()).map(([trafficType, predictions]) => {
          const firstPred = predictions[0];
          const airportCode = (firstPred.airportCode || 'ALL') as AirportCode;
          const scenario = firstPred.requestScenario || 'AUTO';
          
          return {
            id: generateId(),
            batchId: `${airportCode}_${trafficType}_${scenario}_${Date.now()}`,
            airportCode,
            trafficType,
            scenario,
            generatedAt: firstPred.savedAt || new Date().toISOString(),
            savedAt: new Date().toISOString(),
            predictions: predictions.map((pred: any) => ({
              ...pred,
              id: pred.id || generateId(),
              savedAt: pred.savedAt || new Date().toISOString(),
              requestType: trafficType,
              requestScenario: pred.requestScenario || scenario,
            })),
          };
        });
        
        // Apply filters
        let filteredBatches = batches;
        if (filters?.airportCode) {
          filteredBatches = filteredBatches.filter((b) => b.airportCode === filters.airportCode);
        }
        if (filters?.trafficType) {
          filteredBatches = filteredBatches.filter((b) => b.trafficType === filters.trafficType);
        }
        if (filters?.scenario) {
          filteredBatches = filteredBatches.filter((b) => b.scenario === filters.scenario);
        }
        
        filteredBatches.sort((a, b) => b.generatedAt.localeCompare(a.generatedAt));
        return filteredBatches;
      }
    }
  } catch (error) {
    console.warn('⚠️ Failed to load batch predictions from static assets:', error);
  }
  
  // Return empty jika tidak ada file atau error
  return [];
};

/**
 * Delete prediction
 */
export const deletePrediction = async (id: string): Promise<void> => {
  await initDatabase();
  const predictions = loadPredictions();
  const filtered = predictions.filter((p) => p.id !== id);
  await savePredictions(filtered);
};

/**
 * Delete batch prediction
 */
export const deleteBatchPrediction = async (id: string): Promise<void> => {
  await initDatabase();
  const batches = loadBatchPredictions();
  const filtered = batches.filter((b) => b.id !== id);
  await saveBatchPredictions(filtered);
};

/**
 * Get prediction stats
 */
export const getPredictionStats = async (): Promise<{
  totalPredictions: number;
  totalBatchPredictions: number;
  byAirport: Record<string, number>;
  byType: Record<TrafficType, number>;
  oldestPrediction: string | null;
  newestPrediction: string | null;
}> => {
  await initDatabase();
  const predictions = loadPredictions();
  const batches = loadBatchPredictions();

  const byAirport: Record<string, number> = {};
  const byType: Record<TrafficType, number> = {
    PASSENGER: 0,
    FLIGHT: 0,
  };

  let oldestDate: string | null = null;
  let newestDate: string | null = null;

  predictions.forEach((pred) => {
    if (pred.airportCode) {
      byAirport[pred.airportCode] = (byAirport[pred.airportCode] || 0) + 1;
    }
    if (pred.requestType) {
      byType[pred.requestType] = (byType[pred.requestType] || 0) + 1;
    }
    if (pred.date) {
      if (!oldestDate || pred.date < oldestDate) {
        oldestDate = pred.date;
      }
      if (!newestDate || pred.date > newestDate) {
        newestDate = pred.date;
      }
    }
  });

  return {
    totalPredictions: predictions.length,
    totalBatchPredictions: batches.length,
    byAirport,
    byType,
    oldestPrediction: oldestDate,
    newestPrediction: newestDate,
  };
};

/**
 * Clear all predictions
 */
export const clearAllPredictions = async (): Promise<void> => {
  await savePredictions([]);
  await saveBatchPredictions([]);
};

/**
 * Export all data to JSON string
 */
export const exportAllDataToJSON = async (): Promise<string> => {
  // Data tidak lagi disimpan di localStorage, hanya di file JSON
  // Return empty structure untuk compatibility
  return JSON.stringify({
    predictions: [],
    batchPredictions: [],
    exportedAt: new Date().toISOString(),
    version: '1.0',
    note: 'Data tidak lagi disimpan di localStorage. Semua data tersimpan sebagai file JSON di folder data/predictions/',
  }, null, 2);
};

/**
 * Import data from JSON string
 */
export const importDataFromJSON = async (
  jsonString: string
): Promise<{ predictionsCount: number; batchesCount: number }> => {
  try {
    const data = JSON.parse(jsonString);

    let importedPredictions: StoredPrediction[] = [];
    let importedBatches: StoredBatchPrediction[] = [];
    
    // Handle kesimpulan dari format baru
    if (data.kesimpulan) {
      try {
        sessionStorage.setItem('latest_kesimpulan', data.kesimpulan);
      } catch (e) {
        console.warn('Failed to save kesimpulan to sessionStorage:', e);
      }
    }

    if (Array.isArray(data)) {
      // Jika array, cek apakah ini batch predictions atau single predictions
      // Batch predictions biasanya memiliki struktur yang sama dan banyak item
      if (data.length > 0 && data[0].predictedValue !== undefined && data[0].date !== undefined) {
        // Ini adalah array of predictions, pisahkan berdasarkan trafficType
        // Group predictions by trafficType
        const predictionsByType = new Map<TrafficType, typeof data>();
        
        data.forEach((pred: any) => {
          const trafficType = (pred.requestType || TrafficType.PASSENGER) as TrafficType;
          if (!predictionsByType.has(trafficType)) {
            predictionsByType.set(trafficType, []);
          }
          predictionsByType.get(trafficType)!.push(pred);
        });
        
        // Buat batch untuk setiap trafficType
        importedBatches = Array.from(predictionsByType.entries()).map(([trafficType, predictions]) => {
          const firstPred = predictions[0];
          const airportCode = (firstPred.airportCode || 'ALL') as AirportCode;
          const scenario = firstPred.requestScenario || 'AUTO';
          
          const batchId = `${airportCode}_${trafficType}_${scenario}_${Date.now()}`;
          return {
            id: generateId(),
            batchId,
            airportCode,
            trafficType,
            scenario,
            generatedAt: firstPred.savedAt || new Date().toISOString(),
            savedAt: new Date().toISOString(),
            predictions: predictions.map((pred: any) => ({
              ...pred,
              id: pred.id || generateId(),
              savedAt: pred.savedAt || new Date().toISOString(),
              requestType: trafficType,
              requestScenario: pred.requestScenario || scenario,
            })),
          } as StoredBatchPrediction;
        });
        
        console.log(`✅ Converted array of ${data.length} predictions to ${importedBatches.length} batch(es) by trafficType`);
      } else {
        // Single predictions
        importedPredictions = data;
      }
    } else if (data.predictions || data.batchPredictions) {
      // Format baru: { predictions: [...], kesimpulan: "...", metadata: {...} }
      if (data.predictions && Array.isArray(data.predictions)) {
        // Handle format baru dengan kesimpulan
        const predictionsArray = data.predictions;
        if (predictionsArray.length > 0 && predictionsArray[0].predictedValue !== undefined) {
          // Group predictions by trafficType
          const predictionsByType = new Map<TrafficType, typeof predictionsArray>();
          predictionsArray.forEach((pred: any) => {
            const trafficType = (pred.requestType || TrafficType.PASSENGER) as TrafficType;
            if (!predictionsByType.has(trafficType)) {
              predictionsByType.set(trafficType, []);
            }
            predictionsByType.get(trafficType)!.push(pred);
          });
          
          // Buat batch untuk setiap trafficType
          importedBatches = Array.from(predictionsByType.entries()).map(([trafficType, predictions]) => {
            const firstPred = predictions[0];
            const airportCode = (firstPred.airportCode || 'ALL') as AirportCode;
            const scenario = firstPred.requestScenario || 'AUTO';
            
            const batchId = `${airportCode}_${trafficType}_${scenario}_${Date.now()}`;
            return {
              id: generateId(),
              batchId,
              airportCode,
              trafficType,
              scenario,
              generatedAt: firstPred.savedAt || new Date().toISOString(),
              savedAt: new Date().toISOString(),
              predictions: predictions.map((pred: any) => ({
                ...pred,
                id: pred.id || generateId(),
                savedAt: pred.savedAt || new Date().toISOString(),
                requestType: trafficType,
                requestScenario: pred.requestScenario || scenario,
              })),
            } as StoredBatchPrediction;
          });
          
          console.log(`✅ Converted ${predictionsArray.length} predictions from new format to ${importedBatches.length} batch(es) by trafficType`);
        } else {
          importedPredictions = predictionsArray;
        }
      } else if (data.batchPredictions) {
        importedBatches = Array.isArray(data.batchPredictions) ? data.batchPredictions : [];
      }
    } else {
      throw new Error('Invalid data structure');
    }

    // Process imported data
    importedPredictions = importedPredictions.map((pred) => ({
      ...pred,
      id: pred.id || generateId(),
      savedAt: pred.savedAt || new Date().toISOString(),
    }));

    importedBatches = importedBatches.map((batch) => ({
      ...batch,
      id: batch.id || generateId(),
      savedAt: batch.savedAt || new Date().toISOString(),
      predictions: batch.predictions.map((pred) => ({
        ...pred,
        id: pred.id || generateId(),
        savedAt: pred.savedAt || new Date().toISOString(),
      })),
    }));

    // TIDAK lagi simpan ke sessionStorage
    // Data sudah ada di file, akan di-load langsung dari file saat dibutuhkan
    if (importedBatches.length > 0) {
      console.log(`✅ Imported ${importedBatches.length} batch predictions with ${importedBatches[0].predictions.length} predictions`);
    }
    if (importedPredictions.length > 0) {
      console.log(`✅ Imported ${importedPredictions.length} predictions`);
    }

    // Jangan download file baru karena file sudah ada di folder
    // File hanya di-download saat save predictions baru

    return {
      predictionsCount: importedPredictions.length,
      batchesCount: importedBatches.length,
    };
  } catch (error) {
    console.error('Failed to import data:', error);
    throw new Error(`Failed to import data: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Download data as JSON file (hanya saat user request)
 */
export const downloadDataAsJSON = async (filename?: string): Promise<void> => {
  try {
    const json = await exportAllDataToJSON();
    const finalFilename = filename || generateFileName('predictions-all');
    downloadJSONFile(json, finalFilename);
    saveFileMetadata(finalFilename, 'all'); // Hanya metadata, tidak simpan content
  } catch (error) {
    console.error('Failed to download data:', error);
  }
};

/**
 * Load data from file
 */
export const loadDataFromFile = async (
  file: File
): Promise<{ predictionsCount: number; batchesCount: number }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const jsonString = e.target?.result as string;
        const result = await importDataFromJSON(jsonString);
        
        // Hanya simpan metadata (tidak simpan content)
        saveFileMetadata(file.name, 'all');
        
        resolve(result);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsText(file);
  });
};

/**
 * Get list of saved JSON files - Load langsung dari folder, bukan localStorage
 */
export const getSavedFilesList = (): Array<{
  name: string;
  type: 'predictions' | 'batch' | 'all';
  savedAt: string;
  content?: string; // TIDAK lagi store content
}> => {
  // TIDAK lagi load dari localStorage
  // Return empty array, akan di-populate oleh LoadJSONFile dari /api/list-files
  return [];
};

/**
 * Save file metadata - TIDAK lagi simpan ke localStorage
 */
const saveFileMetadata = (filename: string, type: 'predictions' | 'batch', content?: string): void => {
  // TIDAK lagi simpan metadata ke localStorage
  // File sudah tersimpan di folder, metadata akan di-load langsung dari /api/list-files
  console.log(`✅ File metadata tracked: ${filename} (${type})`);
};

/**
 * Clean old file metadata - TIDAK lagi diperlukan karena tidak pakai localStorage
 */
export const cleanOldFileMetadata = (): void => {
  // TIDAK lagi diperlukan karena tidak pakai localStorage untuk metadata
  // File list akan selalu di-load fresh dari /api/list-files
  console.log('ℹ️ File metadata cleaning not needed (using direct file system access)');
};

/**
 * Load file by name from saved files (fetch dari static assets)
 */
export const loadFileByName = async (
  filename: string
): Promise<{ predictionsCount: number; batchesCount: number }> => {
  try {
    // Load dari static assets
    const { loadPredictionFile } = await import('../utils/staticAssets');
    const parsedData = await loadPredictionFile(filename);
    
    // Convert to JSON string untuk importDataFromJSON
    const jsonString = JSON.stringify(parsedData);
    return await importDataFromJSON(jsonString);
  } catch (error) {
    console.error(`Failed to load file ${filename} from static assets:`, error);
    throw new Error(`File ${filename} tidak ditemukan. Silakan pastikan file sudah ter-include dalam build.`);
  }
};

/**
 * Get kesimpulan from latest file
 */
export const getKesimpulanFromFile = async (trafficType?: TrafficType): Promise<string> => {
  try {
    // Load dari static assets
    const { getAvailablePredictionFiles, loadPredictionFile } = await import('../utils/staticAssets');
    const files = await getAvailablePredictionFiles();
    
    if (files && files.length > 0) {
      const latestFile = files[0];
      const parsedData = await loadPredictionFile(latestFile.name);
      
      // Format baru: { predictions: [...], kesimpulan: "...", kesimpulanPassenger: "...", kesimpulanFlight: "..." }
      // Gunakan field yang sesuai dengan trafficType jika ada, fallback ke kesimpulan umum
      if (trafficType === 'PASSENGER' && parsedData.kesimpulanPassenger && parsedData.kesimpulanPassenger.trim().length > 0) {
        return parsedData.kesimpulanPassenger;
      }
      if (trafficType === 'FLIGHT' && parsedData.kesimpulanFlight && parsedData.kesimpulanFlight.trim().length > 0) {
        return parsedData.kesimpulanFlight;
      }
      // Fallback ke kesimpulan umum jika field spesifik tidak ada
      if (parsedData.kesimpulan && parsedData.kesimpulan.trim().length > 0) {
        return parsedData.kesimpulan;
      }
    }
  } catch (error) {
    console.warn('⚠️ Failed to load kesimpulan from file:', error);
  }
  
  return '';
};

/**
 * Update kesimpulan untuk file JSON yang sudah ada
 */
export const updateKesimpulanForFile = async (filename: string, trafficType?: TrafficType): Promise<string> => {
  try {
    const url = trafficType 
      ? `/api/update-kesimpulan?trafficType=${trafficType}`
      : '/api/update-kesimpulan';
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ filename }),
    });

    if (!response.ok) {
      throw new Error(`Failed to update kesimpulan: ${response.statusText}`);
    }

    const result = await response.json();
    if (result.success) {
      // Update sessionStorage dengan kesimpulan baru
      try {
        if (result.kesimpulan) {
          sessionStorage.setItem('latest_kesimpulan', result.kesimpulan);
        }
      } catch (e) {
        // Ignore sessionStorage error
      }
      console.log(`✅ Kesimpulan berhasil di-update untuk file: ${filename}`);
      return result.kesimpulan || '';
    } else {
      throw new Error(result.error || 'Failed to update kesimpulan');
    }
  } catch (error) {
    console.error('Failed to update kesimpulan:', error);
    throw error;
  }
};
