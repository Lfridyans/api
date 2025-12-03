import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { getGeminiApiKey } from './load-env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables and get API key
const GEMINI_API_KEY = getGeminiApiKey();

// Import required modules
const { GoogleGenAI } = await import('@google/genai');

// Import baseline data directly (simplified version)
// We'll read the data from the JSON file structure
const baselineData = [
  { date: '2024-12-18', dayName: 'Rabu', passengers: 483772, flights: 3553, description: 'H-7' },
  { date: '2024-12-19', dayName: 'Kamis', passengers: 525168, flights: 3673, description: 'H-6' },
  { date: '2024-12-20', dayName: 'Jumat', passengers: 551981, flights: 3828, description: 'H-5 (Puncak Arus Keberangkatan)' },
  { date: '2024-12-21', dayName: 'Sabtu', passengers: 552011, flights: 3736, description: 'H-4 (Puncak Arus Keberangkatan)' },
  { date: '2024-12-22', dayName: 'Minggu', passengers: 560436, flights: 3738, description: 'H-3' },
  { date: '2024-12-23', dayName: 'Senin', passengers: 519049, flights: 3709, description: 'H-2' },
  { date: '2024-12-24', dayName: 'Selasa', passengers: 483114, flights: 3578, description: 'H-1' },
  { date: '2024-12-25', dayName: 'Rabu', passengers: 462162, flights: 3311, description: 'Hari Natal' },
  { date: '2024-12-26', dayName: 'Kamis', passengers: 462410, flights: 3469, description: 'H+1' },
  { date: '2024-12-27', dayName: 'Jumat', passengers: 455732, flights: 3553, description: 'H+2' },
  { date: '2024-12-28', dayName: 'Sabtu', passengers: 465457, flights: 3513, description: 'H+3' },
  { date: '2024-12-29', dayName: 'Minggu', passengers: 497112, flights: 3541, description: 'H-3 (Tahun Baru)' },
  { date: '2024-12-30', dayName: 'Senin', passengers: 437826, flights: 3354, description: 'H-2 (Tahun Baru)' },
  { date: '2024-12-31', dayName: 'Selasa', passengers: 383050, flights: 3002, description: 'H-1 (Tahun Baru)' },
  { date: '2024-01-01', dayName: 'Rabu', passengers: 427847, flights: 3058, description: 'Tahun Baru' },
  { date: '2024-01-02', dayName: 'Kamis', passengers: 471410, flights: 3444, description: 'H+1' },
  { date: '2024-01-03', dayName: 'Jumat', passengers: 503759, flights: 3576, description: 'H+2 (Puncak Arus Balik)' },
  { date: '2024-01-04', dayName: 'Sabtu', passengers: 466642, flights: 3390, description: 'H+3 (Puncak Arus Balik)' },
];

function getAirportData(airportCode) {
  return baselineData;
}

// API key sudah di-load dari getGeminiApiKey() di atas

// TrafficType enum
const TrafficType = {
  PASSENGER: 'PASSENGER',
  FLIGHT: 'FLIGHT'
};

// Generate kesimpulan function
async function generateKesimpulan(passengerBatch, flightBatch, baselineData, trafficType) {
  const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
  
  // Calculate statistics
  const baseline = trafficType === TrafficType.PASSENGER 
    ? baselineData.reduce((sum, d) => sum + (d.passengers || 0), 0)
    : baselineData.reduce((sum, d) => sum + (d.flights || 0), 0);
  
  const batch = trafficType === TrafficType.PASSENGER ? passengerBatch : flightBatch;
  if (!batch || !batch.predictions || batch.predictions.length === 0) {
    return "Data prediksi tidak tersedia untuk membuat kesimpulan.";
  }
  
  const forecast = batch.predictions.reduce((sum, p) => sum + p.predictedValue, 0);
  const growth = baseline > 0 ? ((forecast - baseline) / baseline) * 100 : 0;
  const avgDaily = forecast / batch.predictions.length;
  const avgDailyBaseline = baseline / baselineData.length;
  const avgDailyGrowth = avgDailyBaseline > 0 ? ((avgDaily - avgDailyBaseline) / avgDailyBaseline) * 100 : 0;
  
  // Reference 2019 data
  const REFERENCE_2019_PASSENGERS = 9192000;
  const REFERENCE_2019_FLIGHTS = 67540;
  const reference2019 = trafficType === TrafficType.PASSENGER ? REFERENCE_2019_PASSENGERS : REFERENCE_2019_FLIGHTS;
  const recovery = reference2019 > 0 ? (forecast / reference2019) * 100 : 0;
  
  const systemInstruction = `
    Anda adalah "Analyst Strategis" untuk Bandara Indonesia.
    
    TUGAS ANDA:
    Buatlah "KESIMPULAN" profesional berdasarkan data prediksi yang diberikan.
    
    FORMAT OUTPUT:
    - Gunakan bahasa Indonesia yang profesional dan jelas
    - Buat 2 paragraf:
      1. Paragraf pertama: Prognosa pertumbuhan total dan rata-rata harian
      2. Paragraf kedua: Analisis tingkat pemulihan terhadap kinerja pra-pandemi 2019
    
    ATURAN PENTING:
    - JANGAN meniru atau copy-paste teks referensi
    - Buat kesimpulan yang UNIK berdasarkan data aktual yang diberikan
    - Gunakan angka yang akurat dari data (growth, recovery rate)
    - Tulis dalam format paragraf yang natural, bukan bullet points
    - Maksimal 150 kata total
    - Fokus pada insight yang meaningful, bukan hanya menyebutkan angka
  `;
  
  const prompt = `
    DATA PREDIKSI ${trafficType === TrafficType.PASSENGER ? 'PENUMPANG' : 'PESAWAT'}:
    - Baseline 2024 (Total): ${baseline.toLocaleString('id-ID')}
    - Prediksi 2025 (Total): ${forecast.toLocaleString('id-ID')}
    - Growth Total: ${growth.toFixed(2)}%
    - Rata-rata Harian Baseline 2024: ${avgDailyBaseline.toFixed(0)}
    - Rata-rata Harian Prediksi 2025: ${avgDaily.toFixed(0)}
    - Growth Rata-rata Harian: ${avgDailyGrowth.toFixed(2)}%
    - Reference 2019: ${reference2019.toLocaleString('id-ID')}
    - Recovery Rate vs 2019: ${recovery.toFixed(1)}%
    - Jumlah Hari Prediksi: ${batch.predictions.length} hari
    
    Buat kesimpulan profesional berdasarkan data di atas.
    JANGAN meniru teks referensi, buat kesimpulan yang unik berdasarkan data aktual.
  `;
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: prompt,
      config: { systemInstruction }
    });
    return response.text || "Kesimpulan tidak tersedia.";
  } catch (e) {
    console.error("Error generating kesimpulan:", e);
    return "Gagal membuat kesimpulan.";
  }
}

// Main function
async function updateKesimpulan(filename) {
  try {
    const filePath = path.resolve(__dirname, '..', 'data', 'predictions', filename);
    
    if (!fs.existsSync(filePath)) {
      console.error(`❌ File tidak ditemukan: ${filePath}`);
      process.exit(1);
    }

    console.log(`📖 Membaca file: ${filename}`);
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const parsedData = JSON.parse(fileContent);
    
    // Check if kesimpulan already exists
    if (parsedData.kesimpulan && parsedData.kesimpulan.trim().length > 0) {
      console.log('✅ File sudah memiliki kesimpulan:');
      console.log(parsedData.kesimpulan);
      return;
    }

    // Parse predictions array (handle both old and new format)
    let predictionsArray = [];
    if (parsedData.predictions && Array.isArray(parsedData.predictions)) {
      predictionsArray = parsedData.predictions;
    } else if (Array.isArray(parsedData)) {
      predictionsArray = parsedData;
    } else {
      console.error('❌ Format file tidak valid');
      process.exit(1);
    }

    // Separate passenger and flight predictions
    const passengerPredictions = predictionsArray.filter(p => p.requestType === 'PASSENGER');
    const flightPredictions = predictionsArray.filter(p => p.requestType === 'FLIGHT');

    if (passengerPredictions.length === 0 && flightPredictions.length === 0) {
      console.error('❌ Tidak ada predictions ditemukan');
      process.exit(1);
    }

    console.log(`📊 Ditemukan ${passengerPredictions.length} prediksi penumpang dan ${flightPredictions.length} prediksi pesawat`);

    // Get baseline data
    const firstPred = predictionsArray[0];
    const airportCode = firstPred.airportCode || 'ALL';
    const baselineData = getAirportData(airportCode);

    // Convert to BatchPredictionResult format
    const passengerBatch = passengerPredictions.length > 0 ? {
      predictions: passengerPredictions.map(p => ({
        predictedValue: p.predictedValue,
        confidence: p.confidence,
        reasoning: p.reasoning,
        comprehensiveAnalysis: p.comprehensiveAnalysis,
        context: p.context,
        airportCode: p.airportCode,
        sources: p.sources || [],
        appliedScenario: p.appliedScenario,
        detectedEvent: p.detectedEvent,
        date: p.date,
      })),
      airportCode: airportCode,
      trafficType: 'PASSENGER',
      scenario: firstPred.requestScenario || 'AUTO',
      generatedAt: firstPred.savedAt || new Date().toISOString(),
    } : null;

    const flightBatch = flightPredictions.length > 0 ? {
      predictions: flightPredictions.map(p => ({
        predictedValue: p.predictedValue,
        confidence: p.confidence,
        reasoning: p.reasoning,
        comprehensiveAnalysis: p.comprehensiveAnalysis,
        context: p.context,
        airportCode: p.airportCode,
        sources: p.sources || [],
        appliedScenario: p.appliedScenario,
        detectedEvent: p.detectedEvent,
        date: p.date,
      })),
      airportCode: airportCode,
      trafficType: 'FLIGHT',
      scenario: firstPred.requestScenario || 'AUTO',
      generatedAt: firstPred.savedAt || new Date().toISOString(),
    } : null;

    // Generate kesimpulan (use passenger as primary, fallback to flight)
    const trafficType = passengerBatch ? TrafficType.PASSENGER : TrafficType.FLIGHT;
    console.log('🤖 Generating kesimpulan menggunakan AI...');
    const kesimpulan = await generateKesimpulan(
      passengerBatch,
      flightBatch,
      baselineData,
      trafficType
    );

    console.log('✅ Kesimpulan berhasil di-generate:');
    console.log(kesimpulan);
    console.log('');

    // Update file with kesimpulan
    const updatedData = {
      predictions: predictionsArray,
      kesimpulan: kesimpulan,
      metadata: parsedData.metadata || {
        airportCode: airportCode,
        generatedAt: firstPred.savedAt || new Date().toISOString(),
        passengerCount: passengerPredictions.length,
        flightCount: flightPredictions.length,
        version: '2.0'
      }
    };

    // Write updated file
    fs.writeFileSync(filePath, JSON.stringify(updatedData, null, 2), 'utf-8');
    console.log(`✅ File berhasil di-update: ${filename}`);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Get filename from command line argument
const filename = process.argv[2] || 'predictions-20251204-024932-763-uq9x.json';

console.log(`🚀 Memulai update kesimpulan untuk file: ${filename}`);
console.log('');

await updateKesimpulan(filename);
