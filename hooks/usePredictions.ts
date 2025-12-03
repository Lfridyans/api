/**
 * React Hook untuk mengakses dan mengelola predictions dari database
 */

import { useState, useEffect, useCallback } from 'react';
import type {
  AirportCode,
  TrafficType,
  PredictionResult,
  BatchPredictionResult,
} from '../types';
import {
  getAllPredictions,
  getPredictionsByQuery,
  getBatchPredictions,
  getPredictionStats,
  deletePrediction,
  deleteBatchPrediction,
  initDatabase,
  exportAllDataToJSON,
  downloadDataAsJSON,
  loadDataFromFile,
  importDataFromJSON,
  type StoredPrediction,
  type StoredBatchPrediction,
} from '../services/databaseService';

interface UsePredictionsOptions {
  autoLoad?: boolean;
  filters?: {
    date?: string;
    airportCode?: AirportCode;
    requestType?: TrafficType;
    startDate?: string;
    endDate?: string;
  };
}

interface UsePredictionsReturn {
  predictions: StoredPrediction[];
  batchPredictions: StoredBatchPrediction[];
  stats: {
    totalPredictions: number;
    totalBatchPredictions: number;
    byAirport: Record<string, number>;
    byType: Record<TrafficType, number>;
    oldestPrediction: string | null;
    newestPrediction: string | null;
  } | null;
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
  refreshBatch: () => Promise<void>;
  refreshStats: () => Promise<void>;
  removePrediction: (id: string) => Promise<void>;
  removeBatchPrediction: (id: string) => Promise<void>;
  exportData: (filename?: string) => void;
  importData: (file: File) => Promise<{ predictionsCount: number; batchesCount: number }>;
  exportJSON: () => string;
}

/**
 * Hook untuk mengakses predictions dari database
 */
export const usePredictions = (
  options: UsePredictionsOptions = {}
): UsePredictionsReturn => {
  const { autoLoad = true, filters } = options;

  const [predictions, setPredictions] = useState<StoredPrediction[]>([]);
  const [batchPredictions, setBatchPredictions] = useState<
    StoredBatchPrediction[]
  >([]);
  const [stats, setStats] = useState<UsePredictionsReturn['stats']>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const loadPredictions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      await initDatabase();

      const results = filters
        ? await getPredictionsByQuery(filters)
        : await getAllPredictions();

      setPredictions(results);
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error('Failed to load predictions')
      );
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const loadBatchPredictions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      await initDatabase();

      const results = await getBatchPredictions({
        airportCode: filters?.airportCode,
        trafficType: filters?.requestType,
      });

      setBatchPredictions(results);
    } catch (err) {
      setError(
        err instanceof Error
          ? err
          : new Error('Failed to load batch predictions')
      );
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const loadStats = useCallback(async () => {
    try {
      setError(null);
      await initDatabase();

      const statistics = await getPredictionStats();
      setStats(statistics);
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error('Failed to load statistics')
      );
    }
  }, []);

  const removePrediction = useCallback(async (id: number) => {
    try {
      await deletePrediction(id);
      await loadPredictions();
      await loadStats();
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error('Failed to delete prediction')
      );
      throw err;
    }
  }, [loadPredictions, loadStats]);

  const removeBatchPrediction = useCallback(async (id: number) => {
    try {
      await deleteBatchPrediction(id);
      await loadBatchPredictions();
      await loadStats();
    } catch (err) {
      setError(
        err instanceof Error
          ? err
          : new Error('Failed to delete batch prediction')
      );
      throw err;
    }
  }, [loadBatchPredictions, loadStats]);

  useEffect(() => {
    if (autoLoad) {
      loadPredictions();
      loadBatchPredictions();
      loadStats();
    }
  }, [autoLoad, loadPredictions, loadBatchPredictions, loadStats]);

  const exportData = useCallback(async (filename?: string) => {
    await downloadDataAsJSON(filename);
  }, []);

  const importData = useCallback(async (file: File) => {
    try {
      setError(null);
      const result = await loadDataFromFile(file);
      await loadPredictions();
      await loadBatchPredictions();
      await loadStats();
      return result;
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error('Failed to import data')
      );
      throw err;
    }
  }, [loadPredictions, loadBatchPredictions, loadStats]);

  const exportJSON = useCallback(async () => {
    return await exportAllDataToJSON();
  }, []);

  return {
    predictions,
    batchPredictions,
    stats,
    loading,
    error,
    refresh: loadPredictions,
    refreshBatch: loadBatchPredictions,
    refreshStats: loadStats,
    removePrediction,
    removeBatchPrediction,
    exportData,
    importData,
    exportJSON,
  };
};
