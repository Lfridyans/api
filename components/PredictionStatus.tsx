/**
 * Komponen untuk menampilkan status data prediksi yang tersimpan
 */

import React, { useState, useEffect } from 'react';
import {
  checkPredictionStatus,
  type PredictionStatus,
} from '../utils/checkPredictions';
import {
  downloadDataAsJSON,
  exportAllDataToJSON,
} from '../services/databaseService';
import { Database, Download, FileText, CheckCircle, XCircle, FolderOpen } from 'lucide-react';

const PredictionStatus: React.FC = () => {
  const [status, setStatus] = useState<PredictionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const loadStatus = async () => {
      try {
        const data = await checkPredictionStatus();
        setStatus(data);
      } catch (error) {
        console.error('Failed to load status:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStatus();
  }, []);

  const handleExport = async () => {
    await downloadDataAsJSON(
      `nataru-predictions-${new Date().toISOString().split('T')[0]}.json`
    );
  };

  const handleCopyJSON = async () => {
    const json = await exportAllDataToJSON();
    navigator.clipboard.writeText(json);
    alert('JSON data copied to clipboard!');
  };

  if (loading) {
    return (
      <div className="p-4 bg-white rounded-lg border border-slate-200">
        <div className="animate-pulse">Loading status...</div>
      </div>
    );
  }

  if (!status) {
    return null;
  }

  return (
    <div className="p-4 bg-white rounded-lg border border-slate-200 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Database className="w-5 h-5 text-slate-600" />
          <h3 className="font-bold text-sm text-slate-800">
            Status Data Prediksi
          </h3>
        </div>
        {status.hasData ? (
          <CheckCircle className="w-5 h-5 text-green-500" />
        ) : (
          <XCircle className="w-5 h-5 text-slate-400" />
        )}
      </div>

      {status.hasData ? (
        <>
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Total Predictions:</span>
              <span className="font-semibold text-slate-800">
                {status.totalPredictions}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Total Batch Predictions:</span>
              <span className="font-semibold text-slate-800">
                {status.totalBatchPredictions}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Data Size:</span>
              <span className="font-semibold text-slate-800">
                {status.dataSize}
              </span>
            </div>
            {status.newestPrediction && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Newest Prediction:</span>
                <span className="font-semibold text-slate-800">
                  {new Date(status.newestPrediction).toLocaleDateString('id-ID')}
                </span>
              </div>
            )}
            {status.latestBatchDate && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Latest Batch:</span>
                <span className="font-semibold text-slate-800">
                  {new Date(status.latestBatchDate).toLocaleDateString('id-ID')}
                </span>
              </div>
            )}
          </div>

          {Object.keys(status.byAirport).length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-semibold text-slate-600 mb-2">
                By Airport:
              </p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(status.byAirport).map(([airport, count]) => (
                  <span
                    key={airport}
                    className="text-xs px-2 py-1 bg-slate-100 text-slate-700 rounded"
                  >
                    {airport}: {count}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <div className="flex gap-2">
              <button
                onClick={handleExport}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-500 text-white text-xs font-semibold rounded hover:bg-blue-600 transition-colors"
              >
                <Download className="w-4 h-4" />
                Export JSON
              </button>
              <button
                onClick={handleCopyJSON}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-slate-100 text-slate-700 text-xs font-semibold rounded hover:bg-slate-200 transition-colors"
              >
                <FileText className="w-4 h-4" />
                Copy JSON
              </button>
            </div>
            <div className="text-[10px] text-slate-500 bg-slate-50 p-2 rounded border border-slate-200">
              <div className="flex items-center gap-1 mb-1">
                <FolderOpen className="w-3 h-3" />
                <span className="font-semibold">Lokasi File:</span>
              </div>
              <code className="text-[9px] break-all">
                data/predictions/predictions-YYYYMMDD-HHmmss.json
              </code>
              <div className="mt-1 text-[9px] text-slate-400">
                File otomatis terdownload setiap kali ada prediksi baru
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-4">
          <p className="text-sm text-slate-500 mb-2">
            Belum ada data prediksi yang tersimpan
          </p>
          <p className="text-xs text-slate-400">
            Buat prediksi baru untuk menyimpan data
          </p>
        </div>
      )}
    </div>
  );
};

export default PredictionStatus;
