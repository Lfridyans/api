# 📊 Database Usage Guide - JSON File Storage

Sistem database menggunakan **localStorage** untuk menyimpan data prediksi sebagai **JSON**, dan menyediakan fungsi untuk **export/import sebagai file JSON**.

## 🚀 Fitur

- ✅ **Auto-save**: Semua prediksi otomatis tersimpan ke localStorage sebagai JSON
- ✅ **JSON File Export**: Download semua data sebagai file JSON
- ✅ **JSON File Import**: Upload dan import data dari file JSON
- ✅ **Query & Filter**: Query predictions berdasarkan date, airport, type, dll
- ✅ **Batch Support**: Support untuk batch predictions
- ✅ **Statistics**: Statistik lengkap tentang predictions yang tersimpan

## 📦 Storage Format

Data disimpan di `localStorage` dengan format JSON:
- Key: `nataru_predictions` - untuk single predictions
- Key: `nataru_batch_predictions` - untuk batch predictions

### Prediction Schema
```json
{
  "id": "unique-id",
  "predictedValue": 12345,
  "confidence": "High",
  "reasoning": "...",
  "comprehensiveAnalysis": "...",
  "date": "2025-01-15",
  "airportCode": "CGK",
  "requestType": "PASSENGER",
  "requestScenario": "AUTO",
  "appliedScenario": "High Demand Event",
  "detectedEvent": "Concert",
  "savedAt": "2025-01-15T10:30:00.000Z"
}
```

### Batch Prediction Schema
```json
{
  "id": "unique-id",
  "batchId": "CGK_PASSENGER_AUTO_1234567890",
  "airportCode": "CGK",
  "trafficType": "PASSENGER",
  "scenario": "AUTO",
  "generatedAt": "2025-01-15T10:30:00.000Z",
  "savedAt": "2025-01-15T10:30:00.000Z",
  "predictions": [...]
}
```

## 💻 Usage Examples

### 1. Menggunakan React Hook

```typescript
import { usePredictions } from '../hooks/usePredictions';

function PredictionHistory() {
  const {
    predictions,
    loading,
    error,
    refresh,
    removePrediction,
    exportData,
    importData,
  } = usePredictions({
    autoLoad: true,
    filters: {
      airportCode: 'CGK',
      requestType: TrafficType.PASSENGER,
    },
  });

  const handleExport = () => {
    exportData('my-predictions.json');
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        const result = await importData(file);
        alert(`Imported ${result.predictionsCount} predictions!`);
      } catch (error) {
        alert('Failed to import: ' + error.message);
      }
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h2>Prediction History ({predictions.length})</h2>
      <button onClick={refresh}>Refresh</button>
      <button onClick={handleExport}>Export JSON</button>
      <input type="file" accept=".json" onChange={handleImport} />
      
      {predictions.map((pred) => (
        <div key={pred.id}>
          <p>Date: {pred.date}</p>
          <p>Value: {pred.predictedValue}</p>
          <button onClick={() => removePrediction(pred.id)}>Delete</button>
        </div>
      ))}
    </div>
  );
}
```

### 2. Manual Database Operations

```typescript
import {
  initDatabase,
  getAllPredictions,
  getPredictionsByQuery,
  getPredictionStats,
  savePrediction,
  downloadDataAsJSON,
  loadDataFromFile,
} from '../services/databaseService';

// Initialize database
await initDatabase();

// Get all predictions
const allPredictions = await getAllPredictions();

// Query dengan filter
const filteredPredictions = await getPredictionsByQuery({
  airportCode: 'CGK',
  requestType: TrafficType.PASSENGER,
  startDate: '2025-01-01',
  endDate: '2025-01-31',
});

// Get statistics
const stats = await getPredictionStats();
console.log('Total predictions:', stats.totalPredictions);
console.log('By airport:', stats.byAirport);

// Save prediction manually (biasanya sudah auto-save)
await savePrediction(predictionResult, TrafficType.PASSENGER, 'AUTO');

// Export to JSON file
downloadDataAsJSON('predictions-backup.json');

// Import from JSON file
const fileInput = document.createElement('input');
fileInput.type = 'file';
fileInput.accept = '.json';
fileInput.onchange = async (e) => {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (file) {
    const result = await loadDataFromFile(file);
    console.log(`Imported ${result.predictionsCount} predictions`);
  }
};
fileInput.click();
```

### 3. Export/Import JSON

```typescript
import {
  exportAllDataToJSON,
  importDataFromJSON,
  downloadDataAsJSON,
  loadDataFromFile,
} from '../services/databaseService';

// Export sebagai JSON string
const jsonString = exportAllDataToJSON();
console.log(jsonString);

// Download sebagai file
downloadDataAsJSON('my-predictions.json');

// Import dari JSON string
const jsonData = `{
  "predictions": [...],
  "batchPredictions": [...]
}`;
const result = await importDataFromJSON(jsonData);
console.log(`Imported ${result.predictionsCount} predictions`);

// Import dari file
const file = /* file dari input */;
const result = await loadDataFromFile(file);
```

### 4. Batch Predictions

```typescript
import {
  getBatchPredictions,
  getBatchPredictionById,
} from '../services/databaseService';

// Get all batch predictions
const batches = await getBatchPredictions({
  airportCode: 'CGK',
  trafficType: TrafficType.PASSENGER,
});

// Get specific batch
const batch = await getBatchPredictionById('batch-id');
```

## 🔍 Query Options

### getPredictionsByQuery

```typescript
const predictions = await getPredictionsByQuery({
  date?: string,              // Exact date match
  airportCode?: AirportCode,  // Filter by airport
  requestType?: TrafficType,  // PASSENGER or FLIGHT
  startDate?: string,         // Date range start
  endDate?: string,           // Date range end
});
```

### getBatchPredictions

```typescript
const batches = await getBatchPredictions({
  airportCode?: AirportCode,
  trafficType?: TrafficType,
  scenario?: string,
});
```

## 📊 Statistics

```typescript
const stats = await getPredictionStats();

// Returns:
{
  totalPredictions: number;
  totalBatchPredictions: number;
  byAirport: Record<string, number>;
  byType: Record<TrafficType, number>;
  oldestPrediction: string | null;
  newestPrediction: string | null;
}
```

## 🗑️ Delete Operations

```typescript
// Delete single prediction
await deletePrediction(predictionId);

// Delete batch prediction
await deleteBatchPrediction(batchId);

// Clear all (use with caution!)
await clearAllPredictions();
```

## 📥 Export/Import Functions

### Export
```typescript
// Export sebagai JSON string
const json = exportAllDataToJSON();

// Download sebagai file JSON
downloadDataAsJSON('predictions.json');
downloadDataAsJSON(); // Auto-generate filename
```

### Import
```typescript
// Import dari JSON string
await importDataFromJSON(jsonString);

// Import dari File object
await loadDataFromFile(file);
```

**Note**: Import akan **merge** dengan data yang sudah ada (tidak replace). Duplicate entries (berdasarkan ID) akan di-skip.

## 🔄 Auto-Save

Semua prediksi **otomatis tersimpan** ke localStorage ketika:
- ✅ `getPrediction()` berhasil
- ✅ `getBatchPrediction()` berhasil
- ✅ Fallback predictions juga tersimpan

Tidak perlu memanggil `savePrediction()` atau `saveBatchPrediction()` secara manual, kecuali untuk use case khusus.

## 📝 Notes

- Data disimpan di **localStorage** browser
- Data **persisten** sampai browser cache di-clear atau user clear storage
- **Tidak ada limit storage** (tergantung browser, biasanya 5-10MB)
- Semua operations adalah **asynchronous**
- Error handling sudah diimplementasi untuk tidak mengganggu prediction flow
- Export/Import menggunakan **JSON file format** standar

## 🛠️ Development

Untuk development, gunakan browser DevTools:
1. Buka DevTools (F12)
2. Tab "Application" → "Local Storage"
3. Lihat keys: `nataru_predictions` dan `nataru_batch_predictions`
4. Copy JSON untuk backup atau debugging

## 📋 JSON File Format

Format file JSON untuk export/import:

```json
{
  "predictions": [
    {
      "id": "1234567890_abc123",
      "predictedValue": 12345,
      "confidence": "High",
      "date": "2025-01-15",
      "airportCode": "CGK",
      "requestType": "PASSENGER",
      ...
    }
  ],
  "batchPredictions": [
    {
      "id": "1234567890_def456",
      "batchId": "CGK_PASSENGER_AUTO_1234567890",
      "airportCode": "CGK",
      "trafficType": "PASSENGER",
      "predictions": [...],
      ...
    }
  ],
  "exportedAt": "2025-01-15T10:30:00.000Z",
  "version": "1.0"
}
```

## 🔧 Backup & Restore

### Backup
```typescript
// Download backup
downloadDataAsJSON(`backup-${new Date().toISOString().split('T')[0]}.json`);
```

### Restore
```typescript
// Upload backup file
const fileInput = document.createElement('input');
fileInput.type = 'file';
fileInput.accept = '.json';
fileInput.onchange = async (e) => {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (file) {
    await loadDataFromFile(file);
    alert('Data restored successfully!');
  }
};
fileInput.click();
```