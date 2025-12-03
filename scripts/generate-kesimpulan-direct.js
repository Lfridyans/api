import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { loadEnv } from './load-env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env file
loadEnv();

const filename = process.argv[2] || 'predictions-20251204-024932-763-uq9x.json';
const filePath = resolve(__dirname, '..', 'data', 'predictions', filename);

try {
  // Read file
  const fileContent = readFileSync(filePath, 'utf-8');
  const parsedData = JSON.parse(fileContent);
  
  // Parse predictions
  const predictionsArray = parsedData.predictions || [];
  const passengerPredictions = predictionsArray.filter(p => p.requestType === 'PASSENGER');
  const flightPredictions = predictionsArray.filter(p => p.requestType === 'FLIGHT');
  
  if (passengerPredictions.length === 0 && flightPredictions.length === 0) {
    throw new Error('No predictions found');
  }
  
  // Import functions
  const { generateKesimpulan } = await import('../services/geminiService.ts');
  const { getAirportData } = await import('../data/nataruData.ts');
  
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
  
  // Generate kesimpulan
  const trafficType = passengerBatch ? 'PASSENGER' : 'FLIGHT';
  console.log('🔄 Generating kesimpulan...');
  const kesimpulan = await generateKesimpulan(
    passengerBatch,
    flightBatch,
    baselineData,
    trafficType
  );
  
  // Update file
  parsedData.kesimpulan = kesimpulan;
  parsedData.metadata = {
    ...parsedData.metadata,
    updatedAt: new Date().toISOString(),
    version: '2.0'
  };
  
  writeFileSync(filePath, JSON.stringify(parsedData, null, 2), 'utf-8');
  
  console.log(`✅ Kesimpulan baru berhasil dibuat dan disimpan ke ${filename}`);
  console.log(`\n📝 Kesimpulan (${kesimpulan.length} karakter):`);
  console.log(kesimpulan);
} catch (error) {
  console.error('❌ Error:', error.message);
  console.error(error.stack);
  process.exit(1);
}
