/**
 * Komponen untuk load/import JSON file dengan dropdown
 */

import React, { useState, useEffect } from 'react';
import { loadFileByName, getSavedFilesList, cleanOldFileMetadata } from '../services/fileStorageService';
import { FileText, CheckCircle, AlertCircle, Loader2, ChevronDown, RefreshCw } from 'lucide-react';

interface LoadJSONFileProps {
  onLoadComplete?: (result: { predictionsCount: number; batchesCount: number }) => void;
}

const LoadJSONFile: React.FC<LoadJSONFileProps> = ({ onLoadComplete }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<string>('');
  const [savedFiles, setSavedFiles] = useState<Array<{name: string; type: 'predictions' | 'batch' | 'all'; savedAt: string}>>([]);

  useEffect(() => {
    // Clean old file metadata on mount, keep only the latest
    cleanOldFileMetadata();
    refreshFileList();
    autoLoadFromFolder();
    // Auto-update kesimpulan untuk file terbaru jika belum ada
    autoUpdateKesimpulan();
  }, []);

  // Auto-update kesimpulan untuk file terbaru jika belum ada
  const autoUpdateKesimpulan = async () => {
    try {
      const response = await fetch('/api/list-files');
      if (!response.ok) {
        return;
      }

      const data = await response.json();
      if (!data.success || !data.files || data.files.length === 0) {
        return;
      }

      // Ambil file terbaru
      const latestFile = data.files[0];
      if (latestFile && latestFile.name) {
        try {
          // Cek apakah file sudah punya kesimpulan
          const fileResponse = await fetch(`/data/predictions/${latestFile.name}`);
          if (fileResponse.ok) {
            const jsonText = await fileResponse.text();
            const parsedData = JSON.parse(jsonText);
            
            // Jika belum punya kesimpulan, update
            if (!parsedData.kesimpulan || parsedData.kesimpulan.trim().length === 0) {
              const { updateKesimpulanForFile } = await import('../services/fileStorageService');
              await updateKesimpulanForFile(latestFile.name);
              console.log(`✅ Kesimpulan berhasil di-generate untuk file: ${latestFile.name}`);
            }
          }
        } catch (fileError) {
          console.warn(`Gagal update kesimpulan untuk ${latestFile.name}:`, fileError);
        }
      }
    } catch (error) {
      console.log('ℹ️ Tidak bisa update kesimpulan:', error);
    }
  };

  // Auto-load file dari folder data/predictions/ saat page load
  const autoLoadFromFolder = async () => {
    try {
      // Langsung scan folder dan ambil file terbaru
      const response = await fetch('/api/list-files');
      if (!response.ok) {
        throw new Error('Failed to list files');
      }

      const data = await response.json();
      if (!data.success || !data.files || data.files.length === 0) {
        console.log('ℹ️ Tidak ada file JSON di folder data/predictions/');
        return;
      }

      // Ambil file terbaru (sudah sorted by modified time)
      const latestFile = data.files[0];
      
      if (latestFile && latestFile.name) {
        try {
          const fileResponse = await fetch(`/data/predictions/${latestFile.name}`);
          if (fileResponse.ok) {
            const jsonText = await fileResponse.text();
            
            // Import data
            const { importDataFromJSON } = await import('../services/fileStorageService');
            const result = await importDataFromJSON(jsonText);
            
            // TIDAK lagi update metadata ke localStorage
            // File list akan selalu di-load fresh dari /api/list-files
            
            // Auto-select file
            setSelectedFile(latestFile.name);
            refreshFileList();
            
            if (onLoadComplete) {
              onLoadComplete(result);
            }
            
            console.log(`✅ Auto-loaded file terbaru: ${latestFile.name} from data/predictions/`);
            return; // Berhasil load
          }
        } catch (fileError) {
          console.error(`Gagal load file ${latestFile.name}:`, fileError);
        }
      }
      
      console.log('ℹ️ Tidak ada file yang bisa di-load');
    } catch (error) {
      console.log('ℹ️ Tidak bisa akses folder data/predictions/:', error);
    }
  };

  const refreshFileList = async () => {
    // Load langsung dari folder, bukan dari localStorage
    try {
      const response = await fetch('/api/list-files');
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.files) {
          const files = data.files.map((f: any) => ({
            name: f.name,
            type: 'all' as const,
            savedAt: f.modified || new Date().toISOString(),
          }));
          setSavedFiles(files);
          // Auto-select latest file if available
          if (files.length > 0 && !selectedFile) {
            setSelectedFile(files[0].name); // File sudah sorted by modified time (newest first)
          }
        } else {
          setSavedFiles([]);
        }
      } else {
        setSavedFiles([]);
      }
    } catch (error) {
      console.warn('Failed to refresh file list:', error);
      setSavedFiles([]);
    }
  };

  const handleFileSelect = async (filename: string) => {
    if (!filename) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Coba load dari folder dulu
      let result;
      try {
        const response = await fetch(`/data/predictions/${filename}`);
        if (response.ok) {
          const jsonText = await response.text();
          const { importDataFromJSON } = await import('../services/fileStorageService');
          result = await importDataFromJSON(jsonText);
          
          // TIDAK lagi simpan content ke localStorage
          // Hanya update metadata jika perlu
        } else {
          throw new Error('File not found in folder');
        }
      } catch (folderError) {
        // Jika gagal dari folder, coba load dari metadata
        result = await loadFileByName(filename);
      }
      
      setSuccess(`Berhasil load ${result.predictionsCount} predictions dan ${result.batchesCount} batch predictions!`);
      refreshFileList();
      
      if (onLoadComplete) {
        onLoadComplete(result);
      }
      setLoading(false);
    } catch (err: any) {
      setError(err instanceof Error ? err.message : 'Gagal memuat file JSON');
      setLoading(false);
    }
  };


  const formatFileDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="p-4 bg-white rounded-lg border border-slate-200 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-slate-600" />
          <h3 className="font-bold text-sm text-slate-800">
            Muat Prediksi
          </h3>
          {savedFiles.length > 0 && (
            <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-full">
              ({savedFiles.length})
            </span>
          )}
        </div>
        <button
          onClick={refreshFileList}
          className="p-1 text-slate-400 hover:text-slate-600 transition-colors"
          title="Muat ulang daftar"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-3">
        {/* Dropdown untuk pilih file */}
        <div className="relative">
          <label className="block text-xs font-semibold text-slate-600 mb-2">
            Pilih File Predict:
          </label>
          <div className="relative">
            <select
              value={selectedFile}
              onChange={(e) => {
                setSelectedFile(e.target.value);
                if (e.target.value) {
                  handleFileSelect(e.target.value);
                }
              }}
              disabled={loading || savedFiles.length === 0}
              className="w-full appearance-none bg-slate-50 border border-slate-200 text-slate-700 py-2.5 px-3 pr-8 rounded-lg text-xs leading-tight focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">
                {savedFiles.length === 0 ? 'Belum ada file tersimpan' : '-- Pilih File --'}
              </option>
              {savedFiles
                .slice()
                .reverse()
                .map((file, idx) => (
                  <option key={idx} value={file.name}>
                    {file.name} - {formatFileDate(file.savedAt)}
                  </option>
                ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
              <ChevronDown className="w-4 h-4" />
            </div>
          </div>
        </div>

      </div>

      {error && (
        <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded text-xs text-green-700 flex items-start gap-2">
          <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{success}</span>
        </div>
      )}

      {loading && (
        <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700 flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Memuat file...</span>
        </div>
      )}

    </div>
  );
};

export default LoadJSONFile;