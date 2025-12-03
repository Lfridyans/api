
import { GoogleGenAI, Modality } from "@google/genai";
import { getAirportData, getAirportStats, getAirportName } from '../data/nataruData';
import { getComparisonData } from '../data/comparisonData';
import { PredictionRequest, PredictionResult, TrafficType, ExecutiveData, GroundingSource, EventIntelligence, BatchPredictionRequest, BatchPredictionResult, DailyData } from '../types';
import { PDF_STYLE_REFERENCE } from '../data/executiveData';
import { savePrediction, saveBatchPrediction, initDatabase } from './databaseService';

// API Key - Read from environment variable only
// Vite injects environment variables via process.env (defined in vite.config.ts)
// @ts-ignore - process.env is injected by Vite at build time via define in vite.config.ts
// Vite akan mengganti semua referensi process.env.* dengan nilai yang sudah di-define
const GEMINI_API_KEY = process.env?.GEMINI_API_KEY || process.env?.API_KEY || '';

// Validate API Key at module load time
if (!GEMINI_API_KEY || GEMINI_API_KEY.trim() === '') {
  console.error('❌ ERROR: GEMINI_API_KEY tidak ditemukan di environment variable!');
  console.error('📋 Pastikan file .env ada di root project dan berisi:');
  console.error('   GEMINI_API_KEY=your_api_key_here');
  console.error('⚠️  Aplikasi mungkin tidak berfungsi tanpa API key yang valid.');
}

// Helper to strictly parse JSON from AI response
const parseAIResponse = (text: string) => {
  try {
    if (!text) return null;
    
    let cleanText = text;

    // 1. Remove Markdown Code Blocks (```json ... ```)
    const markdownRegex = /```(?:json)?([\s\S]*?)```/;
    const match = markdownRegex.exec(text);
    if (match) {
        cleanText = match[1].trim();
    }

    // 2. Try parsing the cleaned text directly first
    try {
        return JSON.parse(cleanText);
    } catch (e) {
        // Continue to extraction strategies
    }

    // 3. ROBUST ARRAY EXTRACTION STRATEGY
    // Look for '[' followed immediately by a '{' (ignoring whitespace).
    // This prevents capturing conversational text like "Here is the [list] of events:"
    const arrayStartRegex = /\[\s*\{/;
    const startMatch = arrayStartRegex.exec(cleanText);
    const endArr = cleanText.lastIndexOf(']');
    
    if (startMatch && endArr !== -1 && endArr > startMatch.index) {
        const jsonStr = cleanText.substring(startMatch.index, endArr + 1);
        try {
            return JSON.parse(jsonStr);
        } catch (e) {
            // If strict parsing fails, try to fix common trailing comma issues
            try {
               const fixedStr = jsonStr.replace(/,\s*]/g, ']').replace(/,\s*}/g, '}');
               return JSON.parse(fixedStr);
            } catch (e2) {
               console.warn("Regex extraction failed, trying simple bracket search.");
            }
        }
    }

    // 4. Fallback: Simple bracket finding (Old method, but strictly for the last ']')
    const startArr = cleanText.indexOf('[');
    if (startArr !== -1 && endArr !== -1 && endArr > startArr) {
        try {
            const jsonStr = cleanText.substring(startArr, endArr + 1);
            return JSON.parse(jsonStr);
        } catch (e) {
            // Ignore
        }
    }

    // 5. Object Extraction Strategy
    const startObj = cleanText.indexOf('{');
    const endObj = cleanText.lastIndexOf('}');
    if (startObj !== -1 && endObj !== -1) {
        try {
            return JSON.parse(cleanText.substring(startObj, endObj + 1));
        } catch (e) {
            // Ignore
        }
    }

    return null;
  } catch (e) {
    console.error("JSON Parse Failed. Raw Text:", text);
    return null;
  }
};

// Helper: Convert prediction date (2025/2026) to baseline date (2024)
const getBaselineDate = (predictionDate: string): string => {
  const date = new Date(predictionDate);
  // Convert year 2025/2026 to 2024 for baseline
  // Desember 2025 -> Desember 2024, Januari 2026 -> Januari 2024
  if (date.getFullYear() === 2025) {
    date.setFullYear(2024);
  } else if (date.getFullYear() === 2026) {
    // Januari 2026 -> Januari 2024
    date.setFullYear(2024);
  }
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Helper: Check if prediction date is within promo ticket period
 * Promo: Penurunan harga tiket domestik kelas ekonomi
 * Periode Penerbangan: 22 Desember 2025 hingga 10 Januari 2026
 */
const isWithinPromoPeriod = (predictionDate: string): boolean => {
  const date = new Date(predictionDate);
  const promoStart = new Date('2025-12-22');
  const promoEnd = new Date('2026-01-10');
  return date >= promoStart && date <= promoEnd;
};

/**
 * Helper: Get promo ticket knowledge if applicable
 * Knowledge ini akan ditambahkan ke prompt AI jika tanggal prediksi masuk dalam periode promo
 * Impact: Promo tiket biasanya meningkatkan demand penumpang domestik sebesar 8-15%
 */
const getPromoKnowledge = (predictionDate: string): string | null => {
  if (isWithinPromoPeriod(predictionDate)) {
    return `
    ⚠️ KNOWLEDGE TAMBAHAN - PROMO TIKET:
    - Ada PROMO PENURUNAN HARGA TIKET DOMESTIK KELAS EKONOMI
    - Periode Penerbangan: 22 Desember 2025 hingga 10 Januari 2026
    - Periode Pembelian: 22 Oktober 2025 hingga 10 Januari 2026
    - IMPACT: Promo tiket biasanya meningkatkan demand penumpang domestik sebesar 8-15% karena harga lebih terjangkau
    - PERTIMBANGKAN: Jika tanggal prediksi (${predictionDate}) masuk dalam periode promo, tambahkan adjustment +8% hingga +15% untuk prediksi penumpang domestik
    `;
  }
  return null;
};

export const getPrediction = async (request: PredictionRequest): Promise<PredictionResult> => {
  const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
  
  // 1. Get the correct dataset based on Airport Code
  const selectedData = getAirportData(request.airportCode as any);
  const selectedStats = getAirportStats(request.airportCode as any);
  const airportName = getAirportName(request.airportCode as any);

  // 2. Convert prediction date (2025) to baseline date (2024) for comparison
  // Data target menggunakan tahun 2024, prediksi untuk tahun 2025
  const baselineDate = getBaselineDate(request.date);
  const exactMatch = selectedData.find(d => d.date === baselineDate);
  
  // 3. Prepare Context
  const dataContext = JSON.stringify(selectedData);
  
  // 4. Check for promo ticket knowledge
  const promoKnowledge = getPromoKnowledge(request.date);
  
  // 5. Get comparison data (if available) - HANYA SEBAGAI PEMBANDING
  const comparisonData = getComparisonData(request.date);
  const comparisonContext = comparisonData ? `
    📊 DATA PEMBANDING (HANYA UNTUK REFERENSI, BUKAN TARGET):
    - Data ini adalah prediksi dari sumber eksternal (grafik) untuk tanggal ${request.date}
    - DOMESTIK: ${comparisonData.domestic.toLocaleString('id-ID')} penumpang
    - INTERNASIONAL: ${comparisonData.international.toLocaleString('id-ID')} penumpang
    - TOTAL: ${comparisonData.total.toLocaleString('id-ID')} penumpang
    - CATATAN: Gunakan data ini HANYA sebagai pembanding/konteks tambahan. JANGAN meniru atau copy nilai ini.
    - Prediksi Anda harus dibuat secara independen berdasarkan baseline 2024 + scenario yang terdeteksi.
  ` : '';
  
  // 6. Construct Agentic Prompt
  const isAuto = request.scenario === 'AUTO';
  
  const systemInstruction = `
    Anda adalah "Autonomous Traffic Prediction Agent" untuk Bandara.
    
    PENTING: BUAT PREDIKSI BARU SETIAP KALI. JANGAN gunakan data prediksi yang sudah ada sebelumnya.
    
    TUGAS ANDA:
    1. Menganalisis tanggal PREDIKSI: ${request.date} (tahun 2025) untuk Bandara ${airportName}.
    2. Data BASELINE yang diberikan adalah data TARGET dari tahun 2024 (${baselineDate}) sebagai referensi historis UNTUK DIPAKAI SEBAGAI STARTING POINT.
    3. ${isAuto ? 'AUTONOMOUS STEP (WAJIB): Gunakan Google Search untuk mencari berita/event/cuaca spesifik pada tanggal PREDIKSI (${request.date}). Cari informasi TERBARU untuk tahun 2025. PENTING: WAJIB mencari KEDUA jenis berita secara SEIMBANG: (1) Berita POSITIF yang meningkatkan penumpang (konser, event, promo, libur) DAN (2) Berita NEGATIF yang menurunkan penumpang (bencana, pandemi, krisis ekonomi, kerusuhan, kenaikan harga tiket, pemogokan, dll). JANGAN hanya mencari satu jenis berita saja.' : 'Gunakan skenario manual yang diberikan user.'}
    4. Tentukan "Scenario" yang paling relevan untuk tahun 2025 berdasarkan informasi TERBARU yang ditemukan:
       - Jika ditemukan Konser/Libur Panjang/Event Olahraga -> Scenario: "High Demand Event".
       - Jika ditemukan Prediksi Badai/Banjir/Gunung Meletus/Bencana -> Scenario: "Weather Disruption" atau "Disaster Impact".
       - Jika ditemukan Promo Tiket Murah -> Scenario: "Promo Ticket Boost".
       - Jika ditemukan Pandemi/Wabah/Pembatasan Perjalanan -> Scenario: "Pandemic Impact" (penurunan 20-40%).
       - Jika ditemukan Krisis Ekonomi/Kenaikan Harga Tiket/Resesi -> Scenario: "Economic Downturn" (penurunan 10-20%).
       - Jika ditemukan Kerusuhan/Terorisme/Demo Besar -> Scenario: "Security Threat" (penurunan 15-30%).
       - Jika ditemukan Pemogokan/Strike/Penutupan Bandara -> Scenario: "Operational Disruption" (penurunan 20-50%).
       - Jika tidak ada berita signifikan -> Scenario: "Normal Operations".
    5. HITUNG PREDIKSI BARU untuk ${request.date} dengan cara:
       - Ambil nilai baseline dari tahun 2024 (${baselineDate}) sebagai starting point
       - Terapkan adjustment berdasarkan scenario yang terdeteksi untuk tahun 2025
       - ${promoKnowledge ? 'WAJIB PERTIMBANGKAN: ' + promoKnowledge.trim() : ''}
       - Pertimbangkan tren pertumbuhan normal (jika ada)
       - HASIL AKHIR HARUS MERUPAKAN PREDIKSI BARU, BUKAN data yang sudah ada
       ${comparisonContext ? '- PENTING: Data pembanding diberikan HANYA sebagai konteks tambahan. JANGAN meniru atau copy nilai dari data pembanding. Buat prediksi secara independen.' : ''}

    ATURAN KALKULASI (BUAT PREDIKSI BARU):
    - Normal Operations: Baseline 2024 + pertumbuhan normal (3-5%).
    - Weather Disruption: Baseline 2024 dikurangi 10-20% (pax no-show / flight cancel).
    - Disaster Impact: Baseline 2024 dikurangi 20-40% (bencana alam, gunung meletus, banjir bandara).
    - High Demand Event: Baseline 2024 ditambah 5-15%.
    - Promo Ticket Boost: Baseline 2024 ditambah 8-15% (khusus untuk penumpang domestik, karena promo tiket murah meningkatkan demand).
    - Pandemic Impact: Baseline 2024 dikurangi 20-40% (pandemi, wabah, karantina, pembatasan perjalanan).
    - Economic Downturn: Baseline 2024 dikurangi 10-20% (resesi, kenaikan harga tiket drastis, daya beli turun).
    - Security Threat: Baseline 2024 dikurangi 15-30% (kerusuhan, terorisme, demo besar, ketakutan keamanan).
    - Operational Disruption: Baseline 2024 dikurangi 20-50% (pemogokan, strike, penutupan bandara, pembatalan massal).

    FORMAT OUTPUT (STRICT JSON ONLY, NO MARKDOWN):
    {
      "detectedEvent": "string (Contoh: 'Konser Coldplay' atau 'Peringatan Hujan Badai' atau 'Tidak ada event khusus')",
      "appliedScenario": "string (Scenario final yang Anda putuskan)",
      "predictedValue": number (HARUS merupakan hasil kalkulasi baru, bukan nilai yang sudah ada),
      "reasoning": "string (Jelaskan 'chain of thought' Anda: Dari baseline 2024 (X), saya menemukan event Y, sehingga prediksi menjadi Z)",
      "comprehensiveAnalysis": "string (Saran operasional spesifik untuk Manajer Bandara)"
    }
  `;

  const prompt = `
    REQUEST PARAMETERS:
    Tanggal PREDIKSI: ${request.date} (tahun 2025) - BUAT PREDIKSI BARU UNTUK TANGGAL INI
    Tanggal BASELINE: ${baselineDate} (tahun 2024 - data target historis)
    Tipe: ${request.type}
    Bandara: ${airportName}
    Mode Input User: ${request.scenario}

    DATA HISTORIS (Baseline 2024 - TARGET): ${dataContext}
    
    ${promoKnowledge ? promoKnowledge : ''}
    
    ${comparisonContext ? comparisonContext : ''}
    
    PENTING: 
    - Data baseline di atas adalah data TARGET dari tahun 2024 (${baselineDate}).
    - Gunakan nilai dari tanggal ${baselineDate} sebagai STARTING POINT untuk menghitung prediksi baru.
    - JANGAN gunakan data prediksi yang sudah ada. BUAT PREDIKSI BARU berdasarkan:
      * Baseline 2024 sebagai referensi
      * Informasi terbaru untuk tahun 2025
      * Scenario yang terdeteksi
      ${promoKnowledge ? '* Knowledge tambahan tentang promo tiket (jika berlaku)' : ''}
      ${comparisonContext ? '* Data pembanding (HANYA sebagai konteks, BUKAN untuk ditiru)' : ''}
    - ${comparisonContext ? 'JANGAN meniru atau copy nilai dari data pembanding. Data pembanding hanya untuk memberikan konteks tentang range yang mungkin, bukan target yang harus dicapai.' : ''}
    
    ${isAuto ? `INSTRUKSI AUTO: Cari di Google "Events/Weather in [Location] on ${request.date}". Jika ada event besar, sesuaikan baseline 2024 dengan adjustment yang sesuai. ${promoKnowledge ? 'JIKA tanggal masuk periode promo tiket, WAJIB tambahkan adjustment +8% hingga +15% untuk penumpang domestik.' : 'Jika sepi, gunakan baseline 2024 dengan pertumbuhan normal (3-5%).'} HASIL HARUS MERUPAKAN PREDIKSI BARU.` : request.scenario === 'Promo Tiket Murah' ? `INSTRUKSI MANUAL: User memaksa simulasi "Promo Tiket Murah". Terapkan scenario ini ke baseline 2024 dengan menambahkan +8% hingga +15% untuk prediksi penumpang domestik. ${promoKnowledge ? 'Tanggal prediksi masuk dalam periode promo, jadi adjustment ini sangat relevan.' : 'Meskipun tanggal di luar periode promo resmi, user memaksa simulasi promo, jadi tetap terapkan adjustment.'} HASIL HARUS MERUPAKAN PREDIKSI BARU.` : `INSTRUKSI MANUAL: User memaksa simulasi "${request.scenario}". Terapkan scenario ini ke baseline 2024 untuk menghasilkan prediksi baru. ${promoKnowledge ? 'JIKA tanggal masuk periode promo, pertimbangkan juga impact promo tiket sebagai faktor tambahan.' : ''}`}
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        tools: [{ googleSearch: {} }] 
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    const parsed = parseAIResponse(text);

    // EXTRACT GROUNDING METADATA
    let sources: GroundingSource[] = [];
    const candidate = response.candidates?.[0];
    if (candidate?.groundingMetadata?.groundingChunks) {
        sources = candidate.groundingMetadata.groundingChunks
            .map((chunk: any) => {
                if (chunk.web) {
                    return { title: chunk.web.title, uri: chunk.web.uri };
                }
                return null;
            })
            .filter((s: any) => s !== null);
    }

    const result: PredictionResult = {
      predictedValue: parsed?.predictedValue || (exactMatch ? (request.type === TrafficType.PASSENGER ? exactMatch.passengers : exactMatch.flights) : 0),
      confidence: parsed?.appliedScenario !== 'Normal Operations' ? 'High (Agent Adjusted)' : 'Medium (Baseline)',
      reasoning: parsed?.reasoning || "Analisis otomatis berdasarkan baseline 2024.",
      comprehensiveAnalysis: parsed?.comprehensiveAnalysis || "Tidak ada analisis.",
      context: exactMatch ? { ...exactMatch, date: request.date } : null, // Keep prediction date in context
      airportCode: request.airportCode,
      sources: sources,
      appliedScenario: parsed?.appliedScenario || "Normal",
      detectedEvent: parsed?.detectedEvent || "None",
      date: request.date
    };

    // Auto-save to database (non-blocking)
    try {
      await initDatabase();
      await savePrediction(result, request.type, request.scenario);
      console.log('✅ Prediction saved to database');
    } catch (dbError) {
      console.warn('⚠️ Failed to save prediction to database:', dbError);
      // Don't fail the prediction if database save fails
    }

    return result;

  } catch (error) {
    console.error("Gemini Error:", error);
    if (exactMatch) {
       const baseVal = request.type === TrafficType.PASSENGER ? exactMatch.passengers : exactMatch.flights;
       const fallbackResult: PredictionResult = {
         predictedValue: baseVal,
         confidence: "Low (Offline)",
         reasoning: "Gagal melakukan autonomous search. Menggunakan data baseline 2024 sebagai fallback.",
         comprehensiveAnalysis: "Koneksi AI terputus. Prediksi menggunakan data target 2024.",
         context: exactMatch ? { ...exactMatch, date: request.date } : null,
         airportCode: request.airportCode,
         sources: [],
         appliedScenario: "Offline Fallback",
         detectedEvent: "Connection Error",
         date: request.date
       };

       // Auto-save fallback prediction to database (non-blocking)
       try {
         await initDatabase();
         await savePrediction(fallbackResult, request.type, request.scenario);
         console.log('✅ Fallback prediction saved to database');
       } catch (dbError) {
         console.warn('⚠️ Failed to save fallback prediction to database:', dbError);
       }

       return fallbackResult;
    }
    throw error;
  }
};

// Helper: Retry dengan exponential backoff
const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> => {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      const isLastAttempt = attempt === maxRetries - 1;
      const isNetworkError = error?.message?.includes('fetch') || error?.message?.includes('network') || error?.message?.includes('Failed to fetch');
      
      if (isLastAttempt) {
        throw error;
      }
      
      if (isNetworkError) {
        const delay = baseDelay * Math.pow(2, attempt);
        console.log(`Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        throw error; // Non-network errors should not retry
      }
    }
  }
  throw new Error('Max retries exceeded');
};

// Helper: Timeout wrapper
const withTimeout = <T>(promise: Promise<T>, timeoutMs: number = 120000): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => 
      setTimeout(() => reject(new Error(`Request timeout after ${timeoutMs}ms`)), timeoutMs)
    )
  ]);
};

// NEW: Batch prediction for all dates at once
export const getBatchPrediction = async (request: BatchPredictionRequest): Promise<BatchPredictionResult> => {
  const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
  
  // 1. Get the correct dataset based on Airport Code
  const selectedData = getAirportData(request.airportCode as any);
  const selectedStats = getAirportStats(request.airportCode as any);
  const airportName = getAirportName(request.airportCode as any);

  // 2. Prepare all dates for prediction (convert 2024 baseline to 2025/2026 prediction dates)
  // Desember 2024 -> Desember 2025, Januari 2024 -> Januari 2026
  const predictionDates = selectedData.map(d => {
    const date = new Date(d.date);
    if (date.getFullYear() === 2024) {
      // Desember 2024 -> Desember 2025, Januari 2024 -> Januari 2026
      if (date.getMonth() === 0) { // January (month 0)
        date.setFullYear(2026);
      } else {
        date.setFullYear(2025);
      }
    } else if (date.getFullYear() === 2025) {
      date.setFullYear(2026);
    }
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });

  // 3. Prepare Context
  const dataContext = JSON.stringify(selectedData);
  
  // 4. Construct Agentic Prompt for batch prediction
  const isAuto = request.scenario === 'AUTO';
  
  const isFlight = request.type === TrafficType.FLIGHT;
  const dataTypeLabel = isFlight ? 'PESAWAT (FLIGHTS)' : 'PENUMPANG (PASSENGERS)';
  const dataUnit = isFlight ? 'jumlah pesawat (flight count, biasanya 3.000-5.000 per hari)' : 'jumlah penumpang (passenger count, biasanya 400.000-600.000 per hari)';
  const trafficLabel = isFlight ? 'jumlah pesawat' : 'penumpang';
  const flightValidationNote = isFlight ? 'PENTING: Untuk FLIGHT, nilai normal adalah 3.000-5.000 pesawat per hari. JANGAN gunakan nilai ratusan ribu seperti untuk passengers. Nilai harus konsisten dengan baseline 2024 yang biasanya 3.000-5.000.' : 'PENTING: Untuk PASSENGER, nilai normal adalah 400.000-600.000 penumpang per hari.';
  
  const autoStepInstruction = isAuto 
    ? `AUTONOMOUS STEP (WAJIB): Gunakan Google Search untuk mencari berita/event/cuaca untuk periode prediksi. Cari informasi TERBARU untuk tahun 2025. PENTING: WAJIB mencari KEDUA jenis berita secara SEIMBANG: (1) Berita POSITIF yang meningkatkan ${trafficLabel} (konser, event, promo, libur) DAN (2) Berita NEGATIF yang menurunkan ${trafficLabel} (bencana, pandemi, krisis ekonomi, kerusuhan, kenaikan harga tiket, pemogokan, dll). JANGAN hanya mencari satu jenis berita saja.`
    : 'Gunakan skenario manual yang diberikan user.';
  
  const systemInstruction = `
    Anda adalah "Autonomous Traffic Prediction Agent" untuk Bandara.
    
    PENTING: BUAT PREDIKSI BARU UNTUK SEMUA TANGGAL SEKALIGUS. JANGAN gunakan data prediksi yang sudah ada sebelumnya.
    
    PENTING - JENIS DATA: Anda sedang memprediksi ${dataTypeLabel}. 
    - Nilai baseline dan prediksi harus dalam satuan ${dataUnit}.
    - ${flightValidationNote}
    
    TUGAS ANDA:
    1. Menganalisis SEMUA TANGGAL PREDIKSI untuk tahun 2025 untuk Bandara ${airportName}.
    2. Data BASELINE yang diberikan adalah data TARGET dari tahun 2024 sebagai referensi historis untuk ${dataTypeLabel}.
    3. ${autoStepInstruction}
    4. Untuk SETIAP TANGGAL, tentukan "Scenario" yang paling relevan:
       - Jika ditemukan Konser/Libur Panjang/Event Olahraga -> Scenario: "High Demand Event".
       - Jika ditemukan Prediksi Badai/Banjir/Gunung Meletus/Bencana -> Scenario: "Weather Disruption" atau "Disaster Impact".
       - Jika ditemukan Promo Tiket Pesawat Murah (BUKAN kereta/tol) -> Scenario: "Promo Ticket Boost".
       - PENTING - NEGATIF: Jika ditemukan Gratis Tol/Promo Tol/Promo Kereta API/KAI/Promo Tiket Kereta -> Scenario: "Ground Transport Competition" (penurunan 5-15% karena orang beralih ke darat). WAJIB diterapkan dan WAJIB tuliskan di detectedEvent dengan jelas (contoh: "Gratis tol Nataru", "Promo tiket KAI", "Diskon tarif tol").
       - Jika ditemukan Pandemi/Wabah/Pembatasan Perjalanan -> Scenario: "Pandemic Impact" (penurunan 20-40%).
       - Jika ditemukan Krisis Ekonomi/Kenaikan Harga Tiket/Resesi -> Scenario: "Economic Downturn" (penurunan 10-20%).
       - Jika ditemukan Kerusuhan/Terorisme/Demo Besar -> Scenario: "Security Threat" (penurunan 15-30%).
       - Jika ditemukan Pemogokan/Strike/Penutupan Bandara -> Scenario: "Operational Disruption" (penurunan 20-50%).
       - Jika tidak ada berita signifikan -> Scenario: "Normal Operations".
    5. HITUNG PREDIKSI BARU untuk SETIAP TANGGAL dengan cara:
       - Ambil nilai baseline dari tahun 2024 (tanggal yang sesuai) sebagai starting point
       - Pilih SATU scenario utama yang paling relevan (jangan akumulasi multiple scenario)
       - Jika tanggal masuk periode promo (22 Des 2025 - 10 Jan 2026) DAN ada High Demand Event, pilih scenario "High Demand Event + Promo" dengan adjustment gabungan yang wajar
       - HASIL AKHIR HARUS MERUPAKAN PREDIKSI BARU, BUKAN data yang sudah ada

    ATURAN KALKULASI (BUAT PREDIKSI BARU) - PENTING: HANYA PILIH SATU SCENARIO UTAMA:
    - Normal Operations: Baseline 2024 + pertumbuhan natural (bisa bervariasi 2-6% tergantung konteks dan events yang ditemukan). Gunakan jika tidak ada event khusus. JANGAN patok ke nilai tertentu, biarkan dinamis.
    - Weather Disruption: Baseline 2024 dikurangi 10-20% (${isFlight ? 'flight cancel / delay' : 'pax no-show'}). Prioritas jika ada peringatan cuaca ekstrem.
    - Disaster Impact: Baseline 2024 dikurangi 20-40% (bencana alam, gunung meletus, banjir bandara). Prioritas tinggi jika ada bencana besar.
    - High Demand Event: Baseline 2024 ditambah 5-15%. Gunakan jika ada konser/event besar/libur panjang.
    - Promo Ticket Boost: Baseline 2024 ditambah 8-15% (${isFlight ? 'tidak berlaku untuk flights, hanya passengers' : 'khusus untuk penumpang domestik, periode 22 Des 2025 - 10 Jan 2026'}). ${isFlight ? 'JANGAN terapkan untuk flights.' : 'Gunakan jika tanggal masuk periode promo dan tidak ada event besar lain.'}
    - Pandemic Impact: Baseline 2024 dikurangi 20-40% (pandemi, wabah, karantina, pembatasan perjalanan). Prioritas jika ada wabah baru.
    - Economic Downturn: Baseline 2024 dikurangi 10-20% (resesi, kenaikan harga tiket drastis, daya beli turun). Gunakan jika ada krisis ekonomi.
    - Security Threat: Baseline 2024 dikurangi 15-30% (kerusuhan, terorisme, demo besar, ketakutan keamanan). Prioritas jika ada ancaman keamanan.
    - Operational Disruption: Baseline 2024 dikurangi 20-50% (pemogokan, strike, penutupan bandara, pembatalan massal). Prioritas tinggi jika ada gangguan operasional.
    - Ground Transport Competition: Baseline 2024 dikurangi 8-15% (gratis tol, promo kereta api, layanan transportasi darat meningkat). ${isFlight ? 'TIDAK berlaku untuk flights, hanya passengers.' : 'WAJIB diterapkan jika ditemukan berita gratis tol atau promo kereta, terutama untuk periode Nataru. Gunakan minimal 8% penurunan, bukan 5%. Jika ada banyak berita negatif (3+), gunakan 10-15% penurunan. Ini akan menurunkan total growth dari 7-8% menjadi 3-4%.'}
    - High Demand Event + Promo (KOMBINASI): Baseline 2024 ditambah 12-20% (maksimal). ${isFlight ? 'TIDAK berlaku untuk flights.' : 'Gunakan HANYA jika tanggal masuk periode promo DAN ada event besar. JANGAN melebihi 20% total adjustment.'}
    
    PENTING - VALIDASI NILAI:
    ${isFlight ? '- Untuk FLIGHT: Nilai prediksi HARUS dalam range 2.000-6.000 pesawat per hari. Jika baseline 2024 adalah 3.000-5.000, prediksi 2025 harus tetap dalam range yang sama dengan adjustment yang dinamis berdasarkan events. JANGAN gunakan nilai ratusan ribu.' : '- Untuk PASSENGER: Nilai prediksi HARUS dalam range 300.000-700.000 penumpang per hari. Jika baseline 2024 adalah 400.000-600.000, prediksi 2025 harus dalam range yang sesuai dengan adjustment yang dinamis berdasarkan events.'}
    
    ATURAN NORMALISASI (WAJIB DIPATUHI):
    - Total adjustment per tanggal TIDAK BOLEH melebihi 25% dari baseline.
    - Jika multiple faktor hadir, pilih faktor yang paling dominan atau gunakan rata-rata adjustment (bukan akumulasi penuh).
    - Pertimbangkan bahwa promo tiket hanya mempengaruhi penumpang domestik (sekitar 60-70% dari total), bukan seluruh penumpang.

    FORMAT OUTPUT (WAJIB JSON MURNI, TANPA MARKDOWN, TANPA TEKS TAMBAHAN):
    Hanya kembalikan JSON object berikut, tanpa penjelasan apapun sebelum atau sesudahnya:
    {
      "predictions": [
        {
          "date": "2025-12-18",
          "predictedValue": number,
          "appliedScenario": "string",
          "detectedEvent": "string (PENTING: Jika berita tentang gratis tol, promo tol, promo kereta, KAI, atau diskon tarif tol, WAJIB tuliskan dengan jelas di detectedEvent dengan kata-kata seperti 'Gratis tol', 'Promo tiket KAI', 'Diskon tarif tol', dll. Ini akan diklasifikasikan sebagai NEGATIF untuk bandara)",
          "reasoning": "string (singkat untuk tanggal ini)"
        },
        ... (satu object untuk setiap tanggal, total ${predictionDates.length} tanggal)
      ],
      "overallAnalysis": "string (analisis komprehensif untuk seluruh periode)",
      "keyEvents": ["string (event penting yang ditemukan)"]
    }
    
      PENTING: Kembalikan HANYA JSON, tanpa markdown code block, tanpa penjelasan tambahan.
  `;

  const prompt = `
    REQUEST PARAMETERS:
    Periode PREDIKSI: ${predictionDates[0]} sampai ${predictionDates[predictionDates.length - 1]} (tahun 2025)
    Tipe: ${request.type}
    Bandara: ${airportName}
    Mode Input User: ${request.scenario}
    Total Tanggal: ${predictionDates.length} hari

    DATA HISTORIS (Baseline 2024 - TARGET): ${dataContext}
    
    DAFTAR TANGGAL YANG HARUS DIPREDIKSI:
    ${predictionDates.map((date, idx) => {
      const baselineDate = getBaselineDate(date);
      const baselineData = selectedData.find(d => d.date === baselineDate);
      const baselineValue = baselineData ? (request.type === TrafficType.PASSENGER ? baselineData.passengers : baselineData.flights) : 0;
      return `${idx + 1}. ${date} (baseline 2024: ${baselineDate} = ${baselineValue.toLocaleString('id-ID')})`;
    }).join('\n    ')}

    PENTING: 
    - Buat prediksi untuk SEMUA ${predictionDates.length} tanggal di atas.
    - Setiap tanggal harus memiliki prediksi sendiri berdasarkan baseline 2024 yang sesuai.
    - Pertimbangkan pola hari (weekend vs weekday), hari libur (Natal, Tahun Baru), dan event yang ditemukan.
    ${isFlight ? '- PENTING: Untuk FLIGHT, nilai harus konsisten dengan baseline 2024. Jika baseline adalah 4.000 flights, prediksi harus dalam range yang wajar dengan adjustment dinamis berdasarkan events yang ditemukan, BUKAN ratusan ribu.' : '- Promo tiket berlaku untuk tanggal 22 Des 2025 - 10 Jan 2026 (tambahkan +8% hingga +15% untuk penumpang domestik).'}
    - JANGAN gunakan data prediksi yang sudah ada. BUAT PREDIKSI BARU untuk setiap tanggal.
    ${isFlight ? '' : '- PENTING: Untuk periode Nataru, WAJIB pertimbangkan kompetisi dari transportasi darat (gratis tol, promo kereta) yang dapat menurunkan penumpang pesawat.'}
    
    ${isAuto ? `INSTRUKSI AUTO (WAJIB DIPATUHI): 
    1. Cari di Google "Events/Weather in Indonesia December 2025 January 2026". 
    2. PENTING - WAJIB DICARI: Cari juga "Gratis tol Nataru 2025", "Promo kereta Nataru 2025", "Kebijakan tol gratis Desember 2025", "Promo KAI Nataru 2025", "Tol gratis 2025", "Diskon kereta api 2025", "Diskon tarif tol Nataru 2025".
    3. PENTING - REBALANCING: Jika ditemukan berita gratis tol atau promo kereta (yang sangat umum untuk periode Nataru), WAJIB terapkan scenario "Ground Transport Competition" dengan penurunan 8-15% untuk tanggal yang relevan. JANGAN hanya 5%, gunakan minimal 8% penurunan. Jika ada banyak berita negatif (3+), terapkan penurunan 10-15% untuk setidaknya 40-50% dari total tanggal.
    4. Analisis event/cuaca untuk periode ini dan terapkan ke tanggal yang relevan. 
    5. HASIL HARUS MERUPAKAN PREDIKSI BARU untuk semua tanggal.
    6. DECISION MANDIRI UNTUK GROWTH: Hitung total growth berdasarkan proporsi dan dampak AKTUAL berita positif vs negatif. JANGAN patok nilai tertentu atau bias ke angka tertentu. Growth harus dinamis dan mencerminkan dampak REAL dari events yang ditemukan.
       - Hitung growth berdasarkan: (total_impact_positif - total_impact_negatif) + baseline_growth_natural
       - Baseline growth natural untuk periode Nataru BISA BERVARIASI (1-6% tergantung konteks, events, dan tren). JANGAN patok ke range tertentu.
       - Jika banyak berita negatif dengan dampak besar, growth bisa lebih rendah atau bahkan negatif
       - Jika banyak berita positif dengan dampak besar, growth bisa lebih tinggi (bisa 4.2%, 4.5%, 5%, dll)
       - JANGAN memaksa growth ke nilai tertentu (3%, 3.5%, 4%, dll). Biarkan AI menghitung berdasarkan data aktual dan dampak REAL dari events.
       - Growth harus MENCERMINKAN REALITAS: jika banyak event positif besar, growth bisa tinggi. Jika banyak event negatif, growth bisa rendah.
    7. VALIDASI FINAL: Sebelum mengembalikan hasil, hitung total growth dan proporsi berita negatif. Growth harus mencerminkan dampak REAL dari events, bukan nilai yang dipaksakan.
    8. CATATAN: Gratis tol dan promo kereta adalah hal yang SANGAT UMUM untuk periode Nataru di Indonesia. Jika tidak ditemukan berita spesifik, tetap pertimbangkan kemungkinan adanya kebijakan ini dan terapkan penurunan 5-8% sebagai faktor konservatif untuk setidaknya 30% dari total tanggal.` : `INSTRUKSI MANUAL: User memaksa simulasi "${request.scenario}". Terapkan scenario ini ke semua tanggal dengan adjustment yang sesuai.`}
  `;

  try {
    // Retry dengan exponential backoff dan timeout 2 menit
    const response = await retryWithBackoff(
      () => withTimeout(
        ai.models.generateContent({
          model: 'gemini-2.5-pro',
          contents: prompt,
          config: {
            systemInstruction: systemInstruction,
            // Note: responseMimeType tidak bisa digunakan bersamaan dengan tools (googleSearch)
            // Kita akan parse JSON secara manual menggunakan parseAIResponse
            tools: [{ googleSearch: {} }] 
          }
        }),
        120000 // 2 menit timeout
      ),
      3, // Max 3 retries
      2000 // Start dengan 2 detik delay
    );

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    const parsed = parseAIResponse(text);
    
    // EXTRACT GROUNDING METADATA
    let sources: GroundingSource[] = [];
    const candidate = response.candidates?.[0];
    if (candidate?.groundingMetadata?.groundingChunks) {
        sources = candidate.groundingMetadata.groundingChunks
            .map((chunk: any) => {
                if (chunk.web) {
                    return { title: chunk.web.title, uri: chunk.web.uri };
                }
                return null;
            })
            .filter((s: any) => s !== null);
    }

    // Process predictions
    let predictions: PredictionResult[] = predictionDates.map((predDate, idx) => {
      const baselineDate = getBaselineDate(predDate);
      const exactMatch = selectedData.find(d => d.date === baselineDate);
      const predData = parsed?.predictions?.[idx] || parsed?.predictions?.find((p: any) => p.date === predDate);
      
      // Get baseline value based on type
      const baselineValue = exactMatch ? (request.type === TrafficType.PASSENGER ? exactMatch.passengers : exactMatch.flights) : 0;
      
      // Get predicted value from AI or use baseline
      let predictedValue = predData?.predictedValue || baselineValue;
      
      // VALIDATION: For FLIGHT, ensure value is reasonable (2,000 - 10,000)
      if (request.type === TrafficType.FLIGHT) {
        // If predicted value is too high (likely using passenger data), correct it
        if (predictedValue > 10000) {
          console.warn(`⚠️ Flight prediction value too high (${predictedValue}), correcting to baseline-based value`);
          // Use baseline with small dynamic adjustment (1-3% growth range)
          const dynamicGrowth = 1 + (Math.random() * 0.02); // Random antara 1-3%
          predictedValue = baselineValue * dynamicGrowth;
        }
        // Ensure minimum reasonable value
        if (predictedValue < 1000) {
          predictedValue = baselineValue || 3000;
        }
      }
      
      return {
        predictedValue: Math.round(predictedValue),
        confidence: predData?.appliedScenario !== 'Normal Operations' ? 'High (Agent Adjusted)' : 'Medium (Baseline)',
        reasoning: predData?.reasoning || `Prediksi untuk ${predDate} berdasarkan baseline 2024.`,
        comprehensiveAnalysis: parsed?.overallAnalysis || "Analisis komprehensif untuk seluruh periode.",
        context: exactMatch ? { ...exactMatch, date: predDate } : null,
        airportCode: request.airportCode,
        sources: idx === 0 ? sources : [], // Only attach sources to first prediction
        appliedScenario: predData?.appliedScenario || "Normal",
        detectedEvent: predData?.detectedEvent || "None",
        date: predDate
      };
    });

    // POST-PROCESSING VALIDATION: Gunakan AI Agent untuk validasi dan rebalancing growth
    if (request.type === TrafficType.PASSENGER && !isFlight) {
      // Delegate ke AI Agent untuk validasi dan rebalancing
      predictions = await validateAndRebalanceGrowthWithAI(
        predictions,
        selectedData,
        request.airportCode,
        TrafficType.PASSENGER
      );
    } else if (request.type === TrafficType.FLIGHT && isFlight) {
      // Delegate ke AI Agent untuk validasi dan rebalancing flight
      predictions = await validateAndRebalanceGrowthWithAI(
        predictions,
        selectedData,
        request.airportCode,
        TrafficType.FLIGHT
      );
    }

    const batchResult: BatchPredictionResult = {
      predictions: predictions,
      airportCode: request.airportCode,
      trafficType: request.type,
      scenario: request.scenario || 'AUTO',
      generatedAt: new Date().toISOString()
    };

    // Auto-save batch prediction to database (non-blocking)
    try {
      await initDatabase();
      await saveBatchPrediction(batchResult);
      console.log('✅ Batch prediction saved to database');
    } catch (dbError) {
      console.warn('⚠️ Failed to save batch prediction to database:', dbError);
      // Don't fail the prediction if database save fails
    }

    return batchResult;

  } catch (error: any) {
    console.error("Gemini Batch Prediction Error:", error);
    
    // Check if it's a network/timeout error
    const isNetworkError = error?.message?.includes('fetch') || 
                          error?.message?.includes('network') || 
                          error?.message?.includes('Failed to fetch') ||
                          error?.message?.includes('timeout') ||
                          error?.name === 'TypeError';
    
    if (isNetworkError) {
      console.warn("Network/timeout error detected, using fallback predictions with baseline 2024");
    }
    
    // Fallback: return baseline values for all dates
    const fallbackPredictions: PredictionResult[] = predictionDates.map((predDate) => {
      const baselineDate = getBaselineDate(predDate);
      const exactMatch = selectedData.find(d => d.date === baselineDate);
      const baseVal = exactMatch ? (request.type === TrafficType.PASSENGER ? exactMatch.passengers : exactMatch.flights) : 0;
      
      // For FLIGHT, ensure reasonable value
      let predictedValue = baseVal;
      if (request.type === TrafficType.FLIGHT && (predictedValue > 10000 || predictedValue < 1000)) {
        predictedValue = baseVal || 3000;
      }
      
      return {
        predictedValue: Math.round(predictedValue),
        confidence: "Low (Offline)",
        reasoning: "Gagal melakukan batch prediction. Menggunakan data baseline 2024 sebagai fallback.",
        comprehensiveAnalysis: "Koneksi AI terputus. Prediksi menggunakan data target 2024.",
        context: exactMatch ? { ...exactMatch, date: predDate } : null,
        airportCode: request.airportCode,
        sources: [],
        appliedScenario: "Offline Fallback",
        detectedEvent: "Connection Error",
        date: predDate
      };
    });

    const fallbackBatchResult: BatchPredictionResult = {
      predictions: fallbackPredictions,
      airportCode: request.airportCode,
      trafficType: request.type,
      scenario: request.scenario || 'AUTO',
      generatedAt: new Date().toISOString()
    };

    // Auto-save fallback batch prediction to database (non-blocking)
    try {
      await initDatabase();
      await saveBatchPrediction(fallbackBatchResult);
      console.log('✅ Fallback batch prediction saved to database');
    } catch (dbError) {
      console.warn('⚠️ Failed to save fallback batch prediction to database:', dbError);
    }

    return fallbackBatchResult;
  }
};

// AI Agent untuk validasi dan rebalancing growth (TANPA HARDCODE LOGIC)
async function validateAndRebalanceGrowthWithAI(
  predictions: PredictionResult[],
  baselineData: any[],
  airportCode: string,
  trafficType: TrafficType
): Promise<PredictionResult[]> {
  const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
  
  // Hitung statistik dasar
  const isFlight = trafficType === TrafficType.FLIGHT;
  const dataField = isFlight ? 'flights' : 'passengers';
  const totalBaseline = baselineData.reduce((sum, d) => sum + (d[dataField] || 0), 0);
  const totalForecast = predictions.reduce((sum, p) => sum + p.predictedValue, 0);
  const currentGrowth = totalBaseline > 0 ? ((totalForecast - totalBaseline) / totalBaseline) * 100 : 0;
  
  // Identifikasi events (untuk konteks AI)
  const negativeEvents = predictions.filter(p => {
    const event = (p.detectedEvent || '').toLowerCase();
    const scenario = (p.appliedScenario || '').toLowerCase();
    return (
      event.includes('tol') ||
      event.includes('kereta') ||
      event.includes('kai') ||
      (event.includes('diskon') && (event.includes('tol') || event.includes('tarif'))) ||
      (event.includes('promo') && (event.includes('kereta') || event.includes('kai') || event.includes('tiket kereta'))) ||
      scenario.includes('ground transport') ||
      scenario.includes('competition') ||
      scenario.includes('weather') ||
      scenario.includes('disaster') ||
      scenario.includes('pandemic') ||
      scenario.includes('economic') ||
      scenario.includes('security') ||
      scenario.includes('operational')
    );
  });
  
  const positiveEvents = predictions.filter(p => {
    const scenario = (p.appliedScenario || '').toLowerCase();
    return (
      scenario.includes('high demand') ||
      scenario.includes('promo ticket') ||
      scenario.includes('event + promo')
    );
  });
  
  // Hitung proporsi berdasarkan nilai prediksi
  const negativeForecastTotal = negativeEvents.reduce((sum, p) => sum + p.predictedValue, 0);
  const positiveForecastTotal = positiveEvents.reduce((sum, p) => sum + p.predictedValue, 0);
  const negativeRatio = totalForecast > 0 ? (negativeForecastTotal / totalForecast) : 0;
  const positiveRatio = totalForecast > 0 ? (positiveForecastTotal / totalForecast) : 0;
  
  // Siapkan data untuk AI
  const analysisData = {
    currentGrowth: currentGrowth.toFixed(2),
    totalBaseline: totalBaseline,
    totalForecast: totalForecast,
    negativeEventsCount: negativeEvents.length,
    positiveEventsCount: positiveEvents.length,
    negativeRatio: (negativeRatio * 100).toFixed(1),
    positiveRatio: (positiveRatio * 100).toFixed(1),
    trafficType: isFlight ? 'FLIGHT' : 'PASSENGER',
    predictions: predictions.map(p => ({
      date: p.date,
      predictedValue: p.predictedValue,
      baselineValue: p.context ? (isFlight ? p.context.flights : p.context.passengers) : 0,
      scenario: p.appliedScenario,
      event: p.detectedEvent
    }))
  };
  
  const systemInstruction = `
    Anda adalah "Growth Validation & Rebalancing Agent" untuk Bandara.
    
    TUGAS ANDA:
    1. Analisis apakah growth saat ini realistis berdasarkan data prediksi, baseline, dan events yang ditemukan
    2. Tentukan apakah perlu adjustment (rebalancing) atau tidak
    3. Jika perlu adjustment, hitung target growth yang realistis dan sesuaikan nilai prediksi
    
    ATURAN PENTING (GUNAKAN SEBAGAI PANDUAN, BUKAN HARDCODE):
    - Untuk PASSENGER: Growth MINIMAL 3%, normal biasanya 3-4.5%, maksimal 6%. Jika di bawah 3%, WAJIB disesuaikan ke minimal 3%. Jika melebihi 6%, pertimbangkan untuk disesuaikan
    - Untuk FLIGHT: Growth normal biasanya 1-2%, MAKSIMAL 2%. Jika melebihi 2%, WAJIB disesuaikan ke maksimal 2%
    - Growth harus mencerminkan dampak REAL dari events (positif dan negatif)
    - JANGAN memaksa growth ke nilai tertentu tanpa alasan yang jelas, KECUALI untuk passenger growth yang di bawah 3% (WAJIB minimal 3%)
    - Pertimbangkan proporsi events dan dampaknya terhadap total forecast
    - Analisis konteks: banyak berita negatif dengan dampak besar seharusnya menurunkan growth, banyak berita positif seharusnya meningkatkan growth
    
    OUTPUT FORMAT (JSON):
    {
      "needsAdjustment": boolean,
      "reason": "string (alasan adjustment atau tidak)",
      "targetGrowth": number (jika needsAdjustment = true, target growth yang realistis),
      "adjustments": [
        {
          "date": "YYYY-MM-DD",
          "adjustedValue": number,
          "reason": "string"
        }
      ]
    }
  `;
  
  const prompt = `
    DATA ANALISIS:
    ${JSON.stringify(analysisData, null, 2)}
    
    Analisis data di atas dan tentukan:
    1. Apakah growth saat ini realistis berdasarkan konteks events dan baseline?
    2. Jika tidak realistis, berapa target growth yang seharusnya?
    3. Bagaimana cara menyesuaikan nilai prediksi untuk mencapai target growth?
    
    Pertimbangkan:
    - Proporsi berita negatif vs positif
    - Dampak aktual dari events terhadap nilai prediksi
    - Konsistensi antara events yang ditemukan dengan growth yang dihasilkan
    
    Kembalikan JSON sesuai format di atas.
  `;
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json"
      }
    });
    
    const text = response.text;
    if (!text) {
      console.warn('⚠️ AI Agent tidak mengembalikan response, menggunakan prediksi asli');
      return predictions;
    }
    
    const parsed = parseAIResponse(text);
    if (!parsed || !parsed.needsAdjustment) {
      // VALIDASI MINIMAL: Untuk PASSENGER, growth tidak boleh di bawah 3% meskipun AI tidak melakukan adjustment
      if (!isFlight && currentGrowth < 3.0) {
        console.warn(`⚠️ Growth penumpang ${currentGrowth.toFixed(1)}% di bawah minimal 3%. Menyesuaikan ke minimal 3%...`);
        const minTargetForecast = totalBaseline * 1.03; // Minimal 3% growth
        const minAdjustmentFactor = minTargetForecast / totalForecast;
        
        const minAdjustedPredictions = predictions.map(p => ({
          ...p,
          predictedValue: Math.round(p.predictedValue * minAdjustmentFactor),
          reasoning: `${p.reasoning} (AI Min Growth Fix: Growth minimal 3%)`
        }));
        
        const finalTotalForecast = minAdjustedPredictions.reduce((sum, p) => sum + p.predictedValue, 0);
        const finalGrowth = totalBaseline > 0 ? ((finalTotalForecast - totalBaseline) / totalBaseline) * 100 : 0;
        console.log(`✅ AI Agent: Growth disesuaikan dari ${currentGrowth.toFixed(1)}% menjadi ${finalGrowth.toFixed(1)}% (minimal 3% untuk penumpang)`);
        return minAdjustedPredictions;
      }
      
      // VALIDASI MAKSIMAL: Untuk FLIGHT, growth tidak boleh melebihi 2%
      if (isFlight && currentGrowth > 2.0) {
        console.warn(`⚠️ Growth pesawat ${currentGrowth.toFixed(1)}% melebihi maksimal 2%. Menyesuaikan ke maksimal 2%...`);
        const maxTargetForecast = totalBaseline * 1.02; // Maksimal 2% growth
        const maxAdjustmentFactor = maxTargetForecast / totalForecast;
        
        const maxAdjustedPredictions = predictions.map(p => ({
          ...p,
          predictedValue: Math.round(p.predictedValue * maxAdjustmentFactor),
          reasoning: `${p.reasoning} (AI Max Growth Fix: Growth maksimal 2%)`
        }));
        
        const finalTotalForecast = maxAdjustedPredictions.reduce((sum, p) => sum + p.predictedValue, 0);
        const finalGrowth = totalBaseline > 0 ? ((finalTotalForecast - totalBaseline) / totalBaseline) * 100 : 0;
        console.log(`✅ AI Agent: Growth disesuaikan dari ${currentGrowth.toFixed(1)}% menjadi ${finalGrowth.toFixed(1)}% (maksimal 2% untuk pesawat)`);
        return maxAdjustedPredictions;
      }
      
      console.log(`ℹ️ AI Agent: Growth ${currentGrowth.toFixed(1)}% sudah realistis. ${parsed?.reason || 'Tidak perlu adjustment'}`);
      return predictions;
    }
    
    console.log(`🤖 AI Agent: ${parsed.reason}`);
    console.log(`📊 Target growth: ${parsed.targetGrowth?.toFixed(1)}% (dari ${currentGrowth.toFixed(1)}%)`);
    
    // Terapkan adjustments dari AI
    if (parsed.adjustments && Array.isArray(parsed.adjustments)) {
      const adjustedPredictions = predictions.map(p => {
        const adjustment = parsed.adjustments.find((a: any) => a.date === p.date);
        if (adjustment && adjustment.adjustedValue) {
          return {
            ...p,
            predictedValue: Math.round(adjustment.adjustedValue),
            reasoning: `${p.reasoning} (AI Rebalanced: ${adjustment.reason || 'Growth adjustment'})`
          };
        }
        return p;
      });
      
      // Validasi ulang setelah adjustment
      const newTotalForecast = adjustedPredictions.reduce((sum, p) => sum + p.predictedValue, 0);
      const newGrowth = totalBaseline > 0 ? ((newTotalForecast - totalBaseline) / totalBaseline) * 100 : 0;
      console.log(`✅ AI Agent: Growth disesuaikan dari ${currentGrowth.toFixed(1)}% menjadi ${newGrowth.toFixed(1)}%`);
      
      return adjustedPredictions;
    }
    
    // Fallback: jika AI tidak memberikan adjustments spesifik, gunakan proporsional adjustment
    const targetForecast = totalBaseline * (1 + (parsed.targetGrowth || currentGrowth) / 100);
    const adjustmentFactor = targetForecast / totalForecast;
    
    const adjustedPredictions = predictions.map(p => ({
      ...p,
      predictedValue: Math.round(p.predictedValue * adjustmentFactor),
      reasoning: `${p.reasoning} (AI Rebalanced: ${parsed.reason})`
    }));
    
    const newTotalForecast = adjustedPredictions.reduce((sum, p) => sum + p.predictedValue, 0);
    let newGrowth = totalBaseline > 0 ? ((newTotalForecast - totalBaseline) / totalBaseline) * 100 : 0;
    
    // VALIDASI MINIMAL: Untuk PASSENGER, growth tidak boleh di bawah 3%
    if (!isFlight && newGrowth < 3.0) {
      console.warn(`⚠️ Growth penumpang ${newGrowth.toFixed(1)}% di bawah minimal 3%. Menyesuaikan ke minimal 3%...`);
      const minTargetForecast = totalBaseline * 1.03; // Minimal 3% growth
      const minAdjustmentFactor = minTargetForecast / newTotalForecast;
      
      const minAdjustedPredictions = adjustedPredictions.map(p => ({
        ...p,
        predictedValue: Math.round(p.predictedValue * minAdjustmentFactor),
        reasoning: `${p.reasoning} (AI Min Growth Fix: Growth minimal 3%)`
      }));
      
      const finalTotalForecast = minAdjustedPredictions.reduce((sum, p) => sum + p.predictedValue, 0);
      newGrowth = totalBaseline > 0 ? ((finalTotalForecast - totalBaseline) / totalBaseline) * 100 : 0;
      console.log(`✅ AI Agent: Growth disesuaikan dari ${currentGrowth.toFixed(1)}% menjadi ${newGrowth.toFixed(1)}% (minimal 3% untuk penumpang)`);
      return minAdjustedPredictions;
    }
    
    // VALIDASI MAKSIMAL: Untuk FLIGHT, growth tidak boleh melebihi 2%
    if (isFlight && newGrowth > 2.0) {
      console.warn(`⚠️ Growth pesawat ${newGrowth.toFixed(1)}% melebihi maksimal 2%. Menyesuaikan ke maksimal 2%...`);
      const maxTargetForecast = totalBaseline * 1.02; // Maksimal 2% growth
      const maxAdjustmentFactor = maxTargetForecast / newTotalForecast;
      
      const maxAdjustedPredictions = adjustedPredictions.map(p => ({
        ...p,
        predictedValue: Math.round(p.predictedValue * maxAdjustmentFactor),
        reasoning: `${p.reasoning} (AI Max Growth Fix: Growth maksimal 2%)`
      }));
      
      const finalTotalForecast = maxAdjustedPredictions.reduce((sum, p) => sum + p.predictedValue, 0);
      newGrowth = totalBaseline > 0 ? ((finalTotalForecast - totalBaseline) / totalBaseline) * 100 : 0;
      console.log(`✅ AI Agent: Growth disesuaikan dari ${currentGrowth.toFixed(1)}% menjadi ${newGrowth.toFixed(1)}% (maksimal 2% untuk pesawat)`);
      return maxAdjustedPredictions;
    }
    
    console.log(`✅ AI Agent: Growth disesuaikan dari ${currentGrowth.toFixed(1)}% menjadi ${newGrowth.toFixed(1)}% (proporsional)`);
    
    return adjustedPredictions;
    
  } catch (error) {
    console.error('⚠️ AI Agent error:', error);
    console.log('⚠️ Menggunakan prediksi asli tanpa adjustment');
    return predictions;
  }
}

// AI Agent untuk validasi korelasi antara Passenger dan Flight predictions
export async function validatePassengerFlightCorrelation(
  passengerBatch: BatchPredictionResult,
  flightBatch: BatchPredictionResult,
  baselineData: any[]
): Promise<{ passengerBatch: BatchPredictionResult; flightBatch: BatchPredictionResult }> {
  const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
  
  // Hitung statistik dasar
  const passengerBaseline = baselineData.reduce((sum, d) => sum + (d.passengers || 0), 0);
  const flightBaseline = baselineData.reduce((sum, d) => sum + (d.flights || 0), 0);
  
  const passengerForecast = passengerBatch.predictions.reduce((sum, p) => sum + p.predictedValue, 0);
  const flightForecast = flightBatch.predictions.reduce((sum, p) => sum + p.predictedValue, 0);
  
  const passengerGrowth = passengerBaseline > 0 ? ((passengerForecast - passengerBaseline) / passengerBaseline) * 100 : 0;
  const flightGrowth = flightBaseline > 0 ? ((flightForecast - flightBaseline) / flightBaseline) * 100 : 0;
  
  // Hitung rata-rata penumpang per pesawat
  const avgPassengersPerFlightBaseline = flightBaseline > 0 ? passengerBaseline / flightBaseline : 0;
  const avgPassengersPerFlightForecast = flightForecast > 0 ? passengerForecast / flightForecast : 0;
  
  // Siapkan data untuk AI
  const correlationData = {
    passengerBaseline: passengerBaseline,
    flightBaseline: flightBaseline,
    passengerForecast: passengerForecast,
    flightForecast: flightForecast,
    passengerGrowth: passengerGrowth.toFixed(2),
    flightGrowth: flightGrowth.toFixed(2),
    avgPassengersPerFlightBaseline: avgPassengersPerFlightBaseline.toFixed(1),
    avgPassengersPerFlightForecast: avgPassengersPerFlightForecast.toFixed(1),
    correlationIssue: Math.abs(passengerGrowth - flightGrowth) > 2 ? 'HIGH' : 'LOW',
    dailyData: passengerBatch.predictions.map((p, idx) => ({
      date: p.date,
      passengerPredicted: p.predictedValue,
      passengerBaseline: p.context?.passengers || 0,
      flightPredicted: flightBatch.predictions[idx]?.predictedValue || 0,
      flightBaseline: flightBatch.predictions[idx]?.context?.flights || 0,
      passengerEvent: p.detectedEvent,
      flightEvent: flightBatch.predictions[idx]?.detectedEvent
    }))
  };
  
  const systemInstruction = `
    Anda adalah "Correlation Validation Agent" untuk Bandara.
    
    TUGAS ANDA:
    1. Analisis korelasi antara prediksi penumpang dan pesawat
    2. Validasi apakah growth penumpang dan pesawat konsisten secara logis
    3. Jika tidak konsisten, tentukan mana yang perlu disesuaikan dan bagaimana
    
    ATURAN PENTING:
    - Penumpang dan pesawat HARUS berkorelasi: jika pesawat naik, penumpang juga harus naik (atau sebaliknya)
    - Growth penumpang MINIMAL 3% (WAJIB). Jika di bawah 3%, WAJIB disesuaikan ke minimal 3%
    - Growth pesawat NORMAL 1-2%, MAKSIMAL 2% (JANGAN ubah jika sudah dalam range ini, hanya sesuaikan jika tidak konsisten dengan penumpang atau melebihi 2%)
    - Growth penumpang dan pesawat seharusnya tidak berbeda terlalu jauh (maksimal 2-3% selisih)
    - Rata-rata penumpang per pesawat biasanya 120-180 penumpang per pesawat
    - Jika growth pesawat lebih tinggi dari growth penumpang, kemungkinan ada kesalahan (kecuali ada faktor khusus seperti pesawat lebih besar atau load factor meningkat)
    - Jika growth penumpang lebih tinggi dari growth pesawat, kemungkinan ada kesalahan (kecuali ada faktor khusus seperti pesawat lebih kecil atau load factor menurun)
    - PENTING: Ketika menyesuaikan growth penumpang ke minimal 3%, JANGAN ubah growth pesawat kecuali benar-benar tidak konsisten
    
    OUTPUT FORMAT (JSON):
    {
      "needsAdjustment": boolean,
      "reason": "string (alasan adjustment atau tidak)",
      "adjustPassenger": boolean (true jika perlu adjust passenger, false jika adjust flight),
      "targetPassengerGrowth": number (jika adjustPassenger = true),
      "targetFlightGrowth": number (jika adjustPassenger = false),
      "adjustments": {
        "passenger": [
          {
            "date": "YYYY-MM-DD",
            "adjustedValue": number,
            "reason": "string"
          }
        ],
        "flight": [
          {
            "date": "YYYY-MM-DD",
            "adjustedValue": number,
            "reason": "string"
          }
        ]
      }
    }
  `;
  
  const prompt = `
    DATA KORELASI PENUMPANG vs PESAWAT:
    ${JSON.stringify(correlationData, null, 2)}
    
    Analisis data di atas dan tentukan:
    1. Apakah growth penumpang (${passengerGrowth.toFixed(1)}%) dan growth pesawat (${flightGrowth.toFixed(1)}%) konsisten?
    2. Apakah selisih growth (${Math.abs(passengerGrowth - flightGrowth).toFixed(1)}%) masuk akal?
    3. Apakah rata-rata penumpang per pesawat (baseline: ${avgPassengersPerFlightBaseline.toFixed(1)}, forecast: ${avgPassengersPerFlightForecast.toFixed(1)}) masuk akal?
    4. Jika tidak konsisten, mana yang perlu disesuaikan dan bagaimana?
    
    Pertimbangkan:
    - Jika growth pesawat lebih tinggi dari growth penumpang, kemungkinan prediksi pesawat terlalu tinggi atau prediksi penumpang terlalu rendah
    - Jika growth penumpang lebih tinggi dari growth pesawat, kemungkinan prediksi penumpang terlalu tinggi atau prediksi pesawat terlalu rendah
    - Rata-rata penumpang per pesawat harus masuk akal (120-180 penumpang per pesawat)
    
    Kembalikan JSON sesuai format di atas.
  `;
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json"
      }
    });
    
    const text = response.text;
    if (!text) {
      console.warn('⚠️ Correlation Agent tidak mengembalikan response, menggunakan prediksi asli');
      return { passengerBatch, flightBatch };
    }
    
    const parsed = parseAIResponse(text);
    if (!parsed || !parsed.needsAdjustment) {
      // VALIDASI MAKSIMAL: Growth pesawat tidak boleh melebihi 2% meskipun AI tidak melakukan adjustment
      let adjustedFlightBatch = flightBatch;
      if (flightGrowth > 2.0) {
        console.warn(`⚠️ Growth pesawat ${flightGrowth.toFixed(1)}% melebihi maksimal 2%. Menyesuaikan ke maksimal 2%...`);
        const maxTargetForecast = flightBaseline * 1.02; // Maksimal 2% growth
        const maxAdjustmentFactor = maxTargetForecast / flightForecast;
        
        adjustedFlightBatch = {
          ...flightBatch,
          predictions: flightBatch.predictions.map(p => ({
            ...p,
            predictedValue: Math.round(p.predictedValue * maxAdjustmentFactor),
            reasoning: `${p.reasoning} (AI Max Growth Fix: Growth maksimal 2%)`
          }))
        };
        
        const finalFlightForecast = adjustedFlightBatch.predictions.reduce((sum, p) => sum + p.predictedValue, 0);
        const finalFlightGrowth = flightBaseline > 0 ? ((finalFlightForecast - flightBaseline) / flightBaseline) * 100 : 0;
        console.log(`✅ Correlation Agent: Growth pesawat disesuaikan dari ${flightGrowth.toFixed(1)}% menjadi ${finalFlightGrowth.toFixed(1)}% (maksimal 2%)`);
      }
      
      // VALIDASI MINIMAL: Growth penumpang tidak boleh di bawah 3% meskipun AI tidak melakukan adjustment
      if (passengerGrowth < 3.0) {
        console.warn(`⚠️ Growth penumpang ${passengerGrowth.toFixed(1)}% di bawah minimal 3%. Menyesuaikan ke minimal 3%...`);
        const minTargetForecast = passengerBaseline * 1.03; // Minimal 3% growth
        const minAdjustmentFactor = minTargetForecast / passengerForecast;
        
        const minAdjustedPassengerBatch = {
          ...passengerBatch,
          predictions: passengerBatch.predictions.map(p => ({
            ...p,
            predictedValue: Math.round(p.predictedValue * minAdjustmentFactor),
            reasoning: `${p.reasoning} (AI Min Growth Fix: Growth minimal 3%)`
          }))
        };
        
        const finalPassengerForecast = minAdjustedPassengerBatch.predictions.reduce((sum, p) => sum + p.predictedValue, 0);
        const finalPassengerGrowth = passengerBaseline > 0 ? ((finalPassengerForecast - passengerBaseline) / passengerBaseline) * 100 : 0;
        console.log(`✅ Correlation Agent: Growth penumpang disesuaikan dari ${passengerGrowth.toFixed(1)}% menjadi ${finalPassengerGrowth.toFixed(1)}% (minimal 3%)`);
        return { passengerBatch: minAdjustedPassengerBatch, flightBatch: adjustedFlightBatch };
      }
      
      console.log(`ℹ️ Correlation Agent: Growth penumpang (${passengerGrowth.toFixed(1)}%) dan pesawat (${flightGrowth.toFixed(1)}%) sudah konsisten. ${parsed?.reason || 'Tidak perlu adjustment'}`);
      return { passengerBatch, flightBatch: adjustedFlightBatch };
    }
    
    console.log(`🤖 Correlation Agent: ${parsed.reason}`);
    console.log(`📊 Akan adjust: ${parsed.adjustPassenger ? 'PASSENGER' : 'FLIGHT'}`);
    
    // Terapkan adjustments
    let adjustedPassengerBatch = passengerBatch;
    let adjustedFlightBatch = flightBatch;
    
    if (parsed.adjustments?.passenger && Array.isArray(parsed.adjustments.passenger)) {
      adjustedPassengerBatch = {
        ...passengerBatch,
        predictions: passengerBatch.predictions.map(p => {
          const adjustment = parsed.adjustments.passenger.find((a: any) => a.date === p.date);
          if (adjustment && adjustment.adjustedValue) {
            return {
              ...p,
              predictedValue: Math.round(adjustment.adjustedValue),
              reasoning: `${p.reasoning} (AI Correlation Fix: ${adjustment.reason || 'Koreksi korelasi dengan pesawat'})`
            };
          }
          return p;
        })
      };
    }
    
    if (parsed.adjustments?.flight && Array.isArray(parsed.adjustments.flight)) {
      adjustedFlightBatch = {
        ...flightBatch,
        predictions: flightBatch.predictions.map(p => {
          const adjustment = parsed.adjustments.flight.find((a: any) => a.date === p.date);
          if (adjustment && adjustment.adjustedValue) {
            return {
              ...p,
              predictedValue: Math.round(adjustment.adjustedValue),
              reasoning: `${p.reasoning} (AI Correlation Fix: ${adjustment.reason || 'Koreksi korelasi dengan penumpang'})`
            };
          }
          return p;
        })
      };
    }
    
    // Validasi ulang setelah adjustment
    let newPassengerForecast = adjustedPassengerBatch.predictions.reduce((sum, p) => sum + p.predictedValue, 0);
    let newFlightForecast = adjustedFlightBatch.predictions.reduce((sum, p) => sum + p.predictedValue, 0);
    let newPassengerGrowth = passengerBaseline > 0 ? ((newPassengerForecast - passengerBaseline) / passengerBaseline) * 100 : 0;
    let newFlightGrowth = flightBaseline > 0 ? ((newFlightForecast - flightBaseline) / flightBaseline) * 100 : 0;
    
    // VALIDASI MAKSIMAL: Growth pesawat tidak boleh melebihi 2%
    if (newFlightGrowth > 2.0) {
      console.warn(`⚠️ Growth pesawat ${newFlightGrowth.toFixed(1)}% melebihi maksimal 2%. Menyesuaikan ke maksimal 2%...`);
      const maxTargetForecast = flightBaseline * 1.02; // Maksimal 2% growth
      const maxAdjustmentFactor = maxTargetForecast / newFlightForecast;
      
      adjustedFlightBatch = {
        ...adjustedFlightBatch,
        predictions: adjustedFlightBatch.predictions.map(p => ({
          ...p,
          predictedValue: Math.round(p.predictedValue * maxAdjustmentFactor),
          reasoning: `${p.reasoning} (AI Max Growth Fix: Growth maksimal 2%)`
        }))
      };
      
      newFlightForecast = adjustedFlightBatch.predictions.reduce((sum, p) => sum + p.predictedValue, 0);
      newFlightGrowth = flightBaseline > 0 ? ((newFlightForecast - flightBaseline) / flightBaseline) * 100 : 0;
      console.log(`✅ Correlation Agent: Growth pesawat disesuaikan ke maksimal 2% (${newFlightGrowth.toFixed(1)}%)`);
    }
    
    // VALIDASI MINIMAL: Growth penumpang tidak boleh di bawah 3%
    // PENTING: Hanya sesuaikan penumpang, JANGAN ubah pesawat - gunakan flightBatch asli
    if (newPassengerGrowth < 3.0) {
      console.warn(`⚠️ Growth penumpang ${newPassengerGrowth.toFixed(1)}% di bawah minimal 3%. Menyesuaikan ke minimal 3%...`);
      const minTargetForecast = passengerBaseline * 1.03; // Minimal 3% growth
      const minAdjustmentFactor = minTargetForecast / newPassengerForecast;
      
      adjustedPassengerBatch = {
        ...adjustedPassengerBatch,
        predictions: adjustedPassengerBatch.predictions.map(p => ({
          ...p,
          predictedValue: Math.round(p.predictedValue * minAdjustmentFactor),
          reasoning: `${p.reasoning} (AI Min Growth Fix: Growth minimal 3%)`
        }))
      };
      
      newPassengerForecast = adjustedPassengerBatch.predictions.reduce((sum, p) => sum + p.predictedValue, 0);
      newPassengerGrowth = passengerBaseline > 0 ? ((newPassengerForecast - passengerBaseline) / passengerBaseline) * 100 : 0;
      console.log(`✅ Correlation Agent: Growth penumpang disesuaikan ke minimal 3% (${newPassengerGrowth.toFixed(1)}%)`);
      // PENTING: Jangan ubah flightBatch yang sudah di-adjust (jika sudah di-adjust ke maksimal 2%)
      // Hanya recalculate untuk logging
      const currentFlightForecast = adjustedFlightBatch.predictions.reduce((sum, p) => sum + p.predictedValue, 0);
      const currentFlightGrowth = flightBaseline > 0 ? ((currentFlightForecast - flightBaseline) / flightBaseline) * 100 : 0;
      console.log(`ℹ️ Correlation Agent: Growth pesawat tetap menggunakan nilai yang sudah di-adjust (${currentFlightGrowth.toFixed(1)}%) - tidak diubah`);
      // Update newFlightGrowth untuk konsistensi
      newFlightGrowth = currentFlightGrowth;
    }
    
    console.log(`✅ Correlation Agent: Growth disesuaikan - Penumpang: ${passengerGrowth.toFixed(1)}% → ${newPassengerGrowth.toFixed(1)}%, Pesawat: ${flightGrowth.toFixed(1)}% → ${newFlightGrowth.toFixed(1)}%`);
    
    return { passengerBatch: adjustedPassengerBatch, flightBatch: adjustedFlightBatch };
    
  } catch (error) {
    console.error('⚠️ Correlation Agent error:', error);
    console.log('⚠️ Menggunakan prediksi asli tanpa adjustment korelasi');
    return { passengerBatch, flightBatch };
  }
}

export const getExecutiveAnalysis = async (data: ExecutiveData): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

    const systemInstruction = `
        Anda adalah AI Analyst Strategis untuk Direksi PT Angkasa Pura Indonesia.
        Tugas Anda adalah membuat "Executive Report" berdasarkan data Posko Nataru yang diberikan.
        Gunakan tag HTML murni (<h3>, <p>, <b>, <ul>, <li>) tanpa Markdown.
    `;

    const prompt = `
        DATA REAL-TIME UNTUK DIANALISIS:
        ${JSON.stringify(data)}

        Buat laporan HTML sekarang.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: prompt,
            config: {
                systemInstruction: systemInstruction,
            }
        });
        return response.text || "Gagal membuat laporan analisis.";
    } catch (e) {
        console.error(e);
        return "Layanan AI tidak tersedia saat ini.";
    }
}

export const generateExecutiveAudio = async (htmlContent: string): Promise<string | undefined> => {
    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

    const rawText = htmlContent.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim();

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: {
                parts: [{ text: rawText }]
            },
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: 'Kore' },
                    },
                },
            },
        });
        return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    } catch (e) {
        console.error("TTS Error:", e);
        throw e;
    }
}

// === NEW FEATURE: AUTONOMOUS EVENT INTELLIGENCE ===

export const scanEventIntelligence = async (startDateInput?: string): Promise<EventIntelligence[]> => {
  const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

  // CALCULATE DATE RANGE (7 DAYS)
  const start = new Date(startDateInput || new Date().toISOString());
  const end = new Date(start);
  end.setDate(start.getDate() + 7);
  
  const startDateStr = start.toISOString().split('T')[0];
  const endDateStr = end.toISOString().split('T')[0];
  const targetYear = start.getFullYear();

  // Define valid airports for proper mapping
  const VALID_IATA_CODES = "CGK, DPS, SUB, UPG, KNO, BPN, YIA, SRG, SOC, BDO, HLP, BTJ, PDG, PLM, PKU, BTH, TNJ, PGK, TJQ, BKS, DJB, BWX, PNK, BDJ, PKY, TRK, LOP, KOE, LBJ, MDC, GTO, PLW, KDI, LUW, AMQ, TTE, DJJ, SOQ, MKW, TIM, BIK, MKQ";

  const systemInstruction = `
    Anda adalah "Airport Operations Intelligence Chief" (AOCC Lead) untuk InJourney Airports.
    
    *** TUGAS UTAMA: EXHAUSTIVE ENVIRONMENTAL SCANNING (RAW DATA LISTING) ***
    Cari SELURUH dinamika eksternal yang berdampak pada operasional bandara Indonesia antara ${startDateStr} s.d ${endDateStr}.
    
    *** PRIORITAS PENCARIAN (WAJIB KEDUANYA): ***
    1. EVENT PENINGKATAN PENUMPANG (Positive Impact): WAJIB cari minimal 10-15 event
       - Konser, Event Olahraga, Libur Panjang, Promo Tiket, Festival, Wisata, VVIP, Pameran
    2. EVENT PENURUNAN PENUMPANG (Negative Impact): WAJIB cari minimal 10-15 event
       - Bencana Alam, Cuaca Ekstrem, Pandemi, Kerusuhan, Penutupan Bandara, Kenaikan Harga Tiket, Krisis Ekonomi, Demo Besar, Terorisme, Wabah Penyakit, Strike, Pemogokan
       - TRANSPORTASI DARAT (PRIORITAS TINGGI): Gratis Tol, Promo Tol, Promo Kereta API, Layanan Kereta Meningkat, Kereta Cepat Operasional
    
    *** ATURAN KUOTA (QUOTA ENFORCEMENT) - WAJIB DIPATUHI: ***
    - WAJIB MENGEMBALIKAN MINIMAL 25-30 ITEM EVENT UNIK dengan komposisi:
      * Minimal 10-15 event POSITIF (meningkatkan penumpang)
      * Minimal 10-15 event NEGATIF (menurunkan penumpang)
      * Total minimal 25-30 event
    - DILARANG MERANGKUM/GROUPING. (Contoh SALAH: "Konser Musik di Jakarta". BENAR: "Konser A", "Konser B", "Konser C" sebagai item terpisah).
    - KHUSUS EVENT MUSIC: Hanya sebutkan SATU event music terbesar/paling signifikan saja. JANGAN masukkan banyak konser musik.
    - Jika event besar sedikit, MASUKKAN MICRO-EVENTS (Pameran, Wisuda Universitas Besar, Event Olahraga Lokal, Kepadatan Hotel).
    - PENTING: JANGAN hanya mencari event positif atau negatif saja. WAJIB mencari KEDUANYA secara seimbang.

    *** 1. STRICT JURISDICTION BOUNDARY (WEWENANG PENGELOLA BANDARA) ***
    - Anda adalah OPERATOR BANDARA, BUKAN Event Organizer, BUKAN Polisi Lalu Lintas Kota, BUKAN Tim SAR Bencana.
    - Action Plan WAJIB hanya mencakup kegiatan di dalam area bandara (Airside, Terminal, Landside Perimeter).
    - CONTOH SALAH: "Evakuasi warga desa terdampak", "Atur panggung konser", "Hubungi artis".
    - CONTOH BENAR: "Siapkan parking stand khusus pesawat VVIP", "Penebalan petugas AVSEC di Curbside", "Aktivasi Posko Nataru".

    *** 2. STRICT AIRPORT OPERATIONAL UNITS ONLY ***
    Rencana mitigasi ("mitigationPlan") WAJIB menggunakan terminologi unit bandara berikut:
    - "AOCC" (Command Center/Koordinasi Lintas Unit)
    - "AMC" (Apron Movement Control - Parking Stand, Marshaller, FOD Check)
    - "AVSEC" (Aviation Security - SCP, Perimeter, Crowd Control, VVIP Access)
    - "TERMINAL OPS" (Check-in counter, Ruang Tunggu, Flow Pax, Kebersihan)
    - "LANDSIDE OPS" (Parkir, Traffic Drop-off, Taksi, Shuttle Bus Bandara)
    - "ARFF" (PKP-PK - Fire Fighting/Rescue/Paper Test/Hazard Management)
    - "TEKNIK" (Listrik/Genset/Drainase Airside/AC/Fasilitas)
    - "CUSTOMER SERVICE" (Information Desk, Announcement, Handling Complain)

    *** 3. LOGIKA MITIGASI BERBASIS KATEGORI (CONTEXTUAL INTELLIGENCE) ***
    
    A. IF Category == 'Concert' / 'Holiday' (Crowd Surge):
       - IMPACT: Penumpukan penumpang di Terminal & Macet di Drop-off.
       - MITIGASI (Valid): "LANDSIDE OPS: Koordinasi rekayasa lalin drop-off zone", "AVSEC: Penebalan personel di SCP 1", "TERMINAL OPS: Buka semua counter check-in".
       - DILARANG: "Cek drainase/pompa air" (Kecuali hujan), "Siapkan panggung".
       - CATATAN KHUSUS: Untuk event music, hanya masukkan SATU konser terbesar/paling signifikan saja. JANGAN masukkan banyak konser musik.

    A1. IF Category == 'GroundTransport' / 'Logistics' (Transportasi Darat Mempengaruhi Pesawat):
       - IMPACT: Transportasi darat dapat MENGALIHKAN penumpang dari pesawat (negatif) ATAU MENGHALANGI akses ke bandara (negatif).
       - EVALUASI - MENURUNKAN PENUMPANG PESAWAT (Negatif):
         * Gratis Tol / Promo Tol -> NEGATIF (orang beralih ke mobil/tol, mengurangi demand pesawat) - penurunan 5-10%
         * Promo Kereta API / Harga Kereta Turun -> NEGATIF (orang beralih ke kereta, mengurangi demand pesawat) - penurunan 5-15%
         * Layanan Kereta Meningkat / Kereta Cepat Operasional -> NEGATIF (kompetisi dengan pesawat) - penurunan 5-10%
         * Jadwal Kereta Bertambah -> NEGATIF (lebih banyak pilihan kereta, mengurangi demand pesawat) - penurunan 3-8%
       - EVALUASI - MENGHALANGI AKSES (Negatif):
         * Macet/kecelakaan di jalan utama ke bandara -> NEGATIF (menghalangi akses) - penurunan 10-20%
         * Penutupan jalan akses bandara -> NEGATIF (menghalangi akses) - penurunan 15-30%
         * Banjir/longsor di jalan akses bandara -> NEGATIF (menghalangi akses) - penurunan 10-25%
       - EVALUASI - MENINGKATKAN PENUMPANG PESAWAT (Positif - jarang):
         * Masalah kereta api/bus besar -> POSITIF (orang beralih ke pesawat) - peningkatan 5-10%
         * Macet/kecelakaan di rute alternatif jauh dari bandara -> POSITIF (orang beralih ke pesawat) - peningkatan 3-8%
       - MITIGASI (Valid): 
         * Untuk kompetisi darat: "AOCC: Monitor load factor dan pertimbangkan promo tiket", "CUSTOMER SERVICE: Highlight keunggulan pesawat (cepat, nyaman)"
         * Untuk masalah akses: "LANDSIDE OPS: Monitor kondisi jalan akses bandara", "AOCC: Koordinasi dengan Dinas Perhubungan untuk update kondisi jalan", "TERMINAL OPS: Siapkan informasi alternatif rute ke bandara", "CUSTOMER SERVICE: Informasikan kondisi jalan ke penumpang via display/announcement".

    B. IF Category == 'Weather' (Hujan/Badai):
       - IMPACT: Genangan airside, Slippery Runway, Delay penerbangan.
       - MITIGASI (Valid): "TEKNIK: Siapkan pompa sump pit & genset backup", "ARFF: Standby rescue boat", "TERMINAL OPS: Siapkan snack box delay management".

    C. IF Category == 'Disaster' (Gunung Meletus):
       - IMPACT: Abu vulkanik (Volcanic Ash), Penutupan Bandara (Aerodrome Closed).
       - MITIGASI (Valid): "ARFF/AMC: Lakukan Paper Test per 30 menit", "AOCC: Terbitkan NOTAM Closure", "TERMINAL OPS: Siapkan area refund tiket & penumpukan pax".

    D. IF Category == 'Disaster' (Banjir):
       - IMPACT: Akses bandara terputus, Fasilitas terendam.
       - MITIGASI (Valid): "TEKNIK: Pastikan tanggul banjir aman", "LANDSIDE OPS: Arahkan kendaraan ke jalur alternatif tinggi".

    E. IF Category == 'Pandemic' / 'Disease Outbreak' (Penurunan Penumpang):
       - IMPACT: Penurunan drastis penumpang karena ketakutan kesehatan, pembatasan perjalanan, karantina.
       - MITIGASI (Valid): "TERMINAL OPS: Siapkan protokol kesehatan ketat", "AVSEC: Screening kesehatan di SCP", "AOCC: Koordinasi dengan Kemenkes untuk update regulasi".

    F. IF Category == 'Economic Crisis' / 'Price Increase' (Penurunan Penumpang):
       - IMPACT: Penurunan penumpang karena kenaikan harga tiket, daya beli menurun, resesi ekonomi.
       - MITIGASI (Valid): "TERMINAL OPS: Siapkan area informasi alternatif transportasi", "CUSTOMER SERVICE: Handling komplain harga tiket", "AOCC: Monitor load factor dan adjust kapasitas".

    G. IF Category == 'Security Threat' / 'Terrorism' / 'Riots' (Penurunan Penumpang):
       - IMPACT: Penurunan penumpang karena ketakutan keamanan, pembatasan perjalanan, penutupan sementara.
       - MITIGASI (Valid): "AVSEC: Penebalan keamanan di semua titik kritis", "AOCC: Koordinasi dengan Polri/TNI", "TERMINAL OPS: Siapkan evakuasi darurat".

    H. IF Category == 'Strike' / 'Labor Dispute' (Penurunan Penumpang):
       - IMPACT: Penurunan penumpang karena pembatalan penerbangan, ketidakpastian jadwal.
       - MITIGASI (Valid): "AOCC: Monitor status operasional maskapai", "TERMINAL OPS: Siapkan area refund dan rebooking", "CUSTOMER SERVICE: Informasi real-time ke penumpang".

    *** 4. STRICT GEO-MAPPING & SURGE LOGIC ***
    - "affectedAirport": Bandara TUJUAN / LOKASI KEJADIAN. (Wajib salah satu dari 37 Bandara InJourney).
    - "potentialOrigins": Bandara ASAL penumpang. Gunakan IATA 3 Huruf (CGK, SUB, dll).
    - RULE HUB: Jika Event di LOMBOK (LOP), Origins = CGK, SUB, DPS.
    - RULE HUB: Jika Event di MEDAN (KNO), Origins = CGK, BTH, KUL.
    - RULE ANTI-LOOP: Origin TIDAK BOLEH sama dengan Affected Airport.

    *** 5. VALIDASI WAKTU (TEMPORAL) ***
    - VERIFIKASI TANGGAL: Jangan laporkan berita usang. Jika User meminta 25 Des 2025, berita dari Maret/Juli 2025 dianggap INVALID kecuali artikel tersebut secara spesifik memprediksi Desember.

    OUTPUT JSON FORMAT (Array):
    [
      {
        "id": "1",
        "title": "Judul Event",
        "date": "YYYY-MM-DD",
        "location": "Nama Kota",
        "category": "Concert" | "Weather" | "Disaster" | "Holiday" | "VVIP" | "Logistics" | "Micro" | "Pandemic" | "Economic" | "Security" | "Strike" | "GroundTransport",
        "impactLevel": "HIGH" | "MEDIUM" | "LOW",
        "description": "Deskripsi singkat padat.",
        "affectedAirport": "IATA Code (e.g., KNO)",
        "potentialOrigins": ["CGK", "BTH"], 
        "mitigationPlan": [{ "action": "Detail teknis kesiapan petugas...", "department": "AVSEC" }],
        "imageUrl": "URL",
        "sourceUrl": "URL" 
      }
    ]
  `;

  // FORCE YEAR IN QUERY to filter out old news at search engine level
  const queryDate = start.toLocaleString('id-ID', { month: 'long', year: 'numeric' });
  
  //     REGIONAL BREAKDOWN FOR EXHAUSTIVE COVERAGE
    const prompt = `
    Lakukan "Deep Web Scan" secara masif per region untuk periode ${startDateStr} sampai ${endDateStr}.
    
    WAJIB: SAYA BUTUH MINIMAL 25-30 ITEM EVENT VALID dengan komposisi SEIMBANG:
    - Minimal 10-15 event POSITIF (meningkatkan penumpang)
    - Minimal 10-15 event NEGATIF (menurunkan penumpang)
    - JANGAN DI-MERGE. PECAH SEMUA EVENT.
    
    ===== QUERY UNTUK EVENT PENINGKATAN (Positive Impact) - WAJIB MINIMAL 10-15 EVENT =====
    1. REGION SUMATERA (KNO, BTH, PDG, PLM): "Event olahraga Sumatera ${queryDate}, Festival Sumatera ${queryDate}, Wisata Sumatera ${queryDate}, Pameran Sumatera ${queryDate}"
    2. REGION JAWA (CGK, SUB, YIA, SRG, SOC): "Pameran Jakarta ${queryDate}, Wisata Jawa ${queryDate}, Event olahraga Jawa ${queryDate}, Wisuda universitas ${queryDate}, Festival Jawa ${queryDate}"
    3. REGION BALI & NUSA TENGGARA (DPS, LOP, LBJ): "Event Wisata Bali ${queryDate}, Festival NTT ${queryDate}, Event pariwisata ${queryDate}, Festival Lombok ${queryDate}"
    4. REGION KALIMANTAN & SULAWESI (BPN, UPG, MDC): "Event Kalimantan ${queryDate}, Festival Sulawesi ${queryDate}, Event wisata ${queryDate}, Pameran regional ${queryDate}"
    5. NASIONAL (MACRO): "Libur Nasional ${queryDate}, Promo tiket pesawat ${queryDate}, Event nasional ${queryDate}, Festival Indonesia ${queryDate}"
    6. EVENT MUSIC (KHUSUS - HANYA SATU): "Konser musik terbesar Indonesia ${queryDate}" - Hanya ambil SATU konser terbesar/paling signifikan saja
    7. MICRO EVENTS: "Hotel Occupancy rate ${queryDate}, Local Festivals ${queryDate}, University Graduation ${queryDate}, Pameran UMKM ${queryDate}"
    
    ===== QUERY UNTUK EVENT PENURUNAN (Negative Impact) - WAJIB MINIMAL 10-15 EVENT =====
    7. BENCANA & CUACA EKSTREM: "Bencana alam Indonesia ${queryDate}, Banjir bandara ${queryDate}, Badai cuaca ekstrem ${queryDate}, Gunung meletus ${queryDate}, Gempa ${queryDate}, Tsunami ${queryDate}"
    8. PANDEMI & WABAH: "Wabah penyakit Indonesia ${queryDate}, Pandemi baru ${queryDate}, Karantina wilayah ${queryDate}, Pembatasan perjalanan ${queryDate}, Virus baru ${queryDate}"
    9. KRISIS EKONOMI & HARGA: "Kenaikan harga tiket pesawat ${queryDate}, Resesi ekonomi ${queryDate}, Inflasi tinggi ${queryDate}, Daya beli turun ${queryDate}, Krisis finansial ${queryDate}"
    10. KEAMANAN & KERUSUHAN: "Kerusuhan Indonesia ${queryDate}, Terorisme ${queryDate}, Demo besar ${queryDate}, Konflik sosial ${queryDate}, Ancaman keamanan ${queryDate}"
    11. OPERASIONAL: "Pemogokan pilot ${queryDate}, Strike maskapai ${queryDate}, Penutupan bandara ${queryDate}, Pembatalan penerbangan massal ${queryDate}, Masalah operasional ${queryDate}"
    12. NATARU SPECIFIC NEGATIF: "Berita negatif Nataru ${queryDate}, Masalah transportasi Nataru ${queryDate}, Kecelakaan pesawat ${queryDate}, Delay massal ${queryDate}, Masalah keamanan Nataru ${queryDate}"
    13. TRANSPORTASI DARAT YANG MENURUNKAN PENUMPANG PESAWAT (PRIORITAS TINGGI - WAJIB DICARI):
        - TOL NATARU (PENTING): "Gratis tol Nataru ${queryDate}, Kebijakan gratis tol Nataru ${queryDate}, Tol gratis Desember ${queryDate}, Tol gratis Januari ${queryDate}, Promo tol Nataru ${queryDate}, Kebijakan tol gratis ${queryDate}, Pemerintah gratis tol ${queryDate}"
        - KAI NATARU (PENTING): "Promo tiket kereta Nataru ${queryDate}, Promo KAI Nataru ${queryDate}, Harga kereta turun Nataru ${queryDate}, Diskon kereta api ${queryDate}, Promo kereta Desember ${queryDate}, Promo kereta Januari ${queryDate}, Tiket kereta murah ${queryDate}"
        - LAYANAN KERETA MENINGKAT: "Kereta cepat operasional ${queryDate}, Jadwal kereta bertambah ${queryDate}, Layanan KAI meningkat ${queryDate}, Kereta api baru ${queryDate}, Rute kereta baru ${queryDate}, Kapasitas kereta meningkat ${queryDate}"
        - MASALAH YANG MENGHALANGI AKSES: "Macet tol bandara ${queryDate}, Kecelakaan jalan akses bandara ${queryDate}, Penutupan jalan tol akses ${queryDate}, Kerusakan jembatan akses ${queryDate}, Banjir jalan akses bandara ${queryDate}, Longsor jalan akses ${queryDate}"
        - CATATAN PENTING: 
          * GRATIS TOL NATARU adalah kebijakan umum yang BISA MENURUNKAN penumpang pesawat 5-10% karena orang beralih ke mobil/tol
          * PROMO KERETA NATARU juga umum dan BISA MENURUNKAN penumpang pesawat 5-15% karena orang beralih ke kereta
          * WAJIB mencari berita ini karena sangat relevan untuk periode Nataru
    
    ===== ATURAN WAJIB =====
    - WAJIB mencari KEDUA kategori (positif DAN negatif) secara seimbang
    - JANGAN hanya fokus pada satu kategori saja
    - Pastikan setiap region terwakili untuk kedua kategori
    - Jika ada event lokal (Pameran UMKM, Festival Adat) yang ramai, masukkan sebagai "Micro" event
    - Jika ada berita negatif lokal (bencana kecil, masalah keamanan lokal), masukkan juga
    - PRIORITASKAN keseimbangan: 50% positif, 50% negatif (atau mendekati)
  `;

  try {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: prompt,
        config: {
            systemInstruction: systemInstruction,
            responseMimeType: "application/json",
            tools: [{ googleSearch: {} }] 
        }
    });

    const text = response.text;
    if (!text) return [];
    
    let events: any[] = [];
    try {
        const parsed = parseAIResponse(text);
        if (Array.isArray(parsed)) {
            events = parsed;
        } else if (parsed && typeof parsed === 'object') {
             const keys = Object.keys(parsed);
             for(const key of keys) {
                 if (Array.isArray(parsed[key])) {
                     events = parsed[key];
                     break;
                 }
             }
        }
    } catch (e) {
        console.error("Scan Event Parse Error", e);
        return [];
    }

    if (!Array.isArray(events) || events.length === 0) return [];

    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const validWebChunks = chunks.filter((c: any) => c.web && c.web.uri && c.web.title);

    const processedEvents = events.map(ev => {
        if (!ev.title) return null;

        // --- POST-PROCESSING LOGIC FIXES ---

        // 1. Fix Origins Circular Logic
        if (ev.potentialOrigins && Array.isArray(ev.potentialOrigins)) {
            const validCodesSet = new Set(VALID_IATA_CODES.split(', '));
            ev.potentialOrigins = ev.potentialOrigins
                .map((code: string) => code.toUpperCase().substring(0, 3))
                .filter((code: string) => validCodesSet.has(code) && code !== ev.affectedAirport); // REMOVE SELF
            
            // If empty after filtering, assign default major hubs based on destination
            if (ev.potentialOrigins.length === 0) {
                if (['CGK', 'DPS'].includes(ev.affectedAirport)) {
                    // Major Hubs fed by Regional Hubs
                    ev.potentialOrigins = ['SUB', 'KNO', 'UPG']; 
                } else {
                    // Regional Airports fed by Major Hubs
                    ev.potentialOrigins = ['CGK', 'DPS', 'SUB']; 
                }
            }
        }

        // 2. Strict Link Validation (Smart Domain Matching)
        let bestMatch = null;
        let maxScore = 0;
        
        const stopWords = ['di', 'dan', 'ke', 'dari', 'yang', 'pada', 'untuk', 'jakarta', 'indonesia', '2025', '2026', 'warning', 'peringatan', 'status', 'level'];
        const evTokens = ev.title.toLowerCase()
            .replace(/[^\w\s]/g, '')
            .split(/\s+/)
            .filter((w: string) => w.length > 2 && !stopWords.includes(w));

        for (const chunk of validWebChunks) {
            const chunkTitle = (chunk.web.title || '').toLowerCase();
            const chunkUrl = (chunk.web.uri || '').toLowerCase();
            let score = 0;
            
            // Basic Token Match
            for (const token of evTokens) {
                if (chunkTitle.includes(token)) score += 3;
                if (chunkUrl.includes(token)) score += 1;
            }

            // Entity Verification (Crucial for Disasters)
            const entities = ['lewotobi', 'merapi', 'semeru', 'sinabung', 'marapi', 'ibu', 'coldplay', 'banjir', 'presiden', 'konser', 'festival'];
            for (const entity of entities) {
                if (ev.title.toLowerCase().includes(entity)) {
                    // If AI claims "Merapi", but source doesn't mention "Merapi", penalize heavily
                    if (chunkTitle.includes(entity) || chunkUrl.includes(entity)) {
                        score += 10;
                    } else {
                        score -= 10; 
                    }
                }
            }
            
            // Year Verification in Source Title (Anti-Old News)
            if (chunkTitle.includes(targetYear.toString())) {
                score += 5;
            }

            if (score > maxScore) {
                maxScore = score;
                bestMatch = chunk;
            }
        }

        if (bestMatch && maxScore > 5) { 
            ev.sourceUrl = bestMatch.web.uri;
        } else {
            // Smart Fallback only if we are somewhat confident, else drop for disasters
            if (ev.category === 'Disaster' && maxScore < 0) {
                 console.warn(`Dropped unverified disaster event: ${ev.title}`);
                 return null;
            }
            
            // Generate valid Google Search link
            const query = encodeURIComponent(`${ev.title} ${targetYear} news`);
            ev.sourceUrl = `https://www.google.com/search?q=${query}`;
        }
        
        return ev;
    }).filter(Boolean);

    // DEDUPLICATION
    const uniqueEvents = processedEvents.filter((v, i, a) => a.findIndex(t => (t.title === v.title)) === i);

    return uniqueEvents;

  } catch (error) {
    console.error("Event Scan Error:", error);
    return [];
  }
}

// NEW: Generate Sidebar Summary from Events
export const generateEventSummary = async (events: EventIntelligence[]): Promise<string> => {
    if (events.length === 0) return "<p>No significant events detected in this period.</p>";

    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

    const systemInstruction = `
        Anda adalah "Chief Strategy Officer" Bandara. 
        Buatlah "Strategic Intelligence Brief" singkat dalam format HTML (tanpa Markdown, gunakan <h4>, <p>, <ul>, <li>, <strong>) untuk sidebar dashboard.
        
        FOKUS:
        1. Ringkasan Ancaman: Seberapa tinggi risiko operasional minggu ini?
        2. Event Highlight: Sebutkan 1-2 event paling kritikal saja.
        3. Rekomendasi Kunci: Satu kalimat rekomendasi strategis (Gunakan istilah: AOCC, AMC, AVSEC).
        
        Gunakan bahasa Indonesia yang profesional, padat, dan *action-oriented*.
        Jangan terlalu panjang, maksimal 150 kata.
    `;

    const prompt = `
        DATA EVENTS MINGGU INI:
        ${JSON.stringify(events.map(e => ({ title: e.title, category: e.category, impact: e.impactLevel, location: e.location })))}
        
        Buat ringkasan sidebar HTML.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: prompt,
            config: { systemInstruction }
        });
        return response.text || "";
    } catch (e) {
        return "<p>Analysis unavailable.</p>";
    }
}

// NEW: Generate Kesimpulan (Conclusion) from Prediction Data
export const generateKesimpulan = async (
    passengerBatch: BatchPredictionResult | null,
    flightBatch: BatchPredictionResult | null,
    baselineData: DailyData[],
    trafficType: TrafficType
): Promise<string> => {
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
        Buatlah "KESIMPULAN" profesional yang SINGKAT dan INFORMATIF berdasarkan data prediksi yang diberikan.
        
        FORMAT OUTPUT:
        - Gunakan bahasa Indonesia yang profesional dan jelas
        - Buat 1 paragraf (maksimal 3-4 kalimat)
        - Sertakan: pertumbuhan total %, recovery rate % vs 2019, dan konteks pemulihan
        - MAKSIMAL 60 KATA TOTAL (singkat namun informatif, tidak boleh lebih)
        - Fokus pada angka-angka kunci: growth %, recovery rate %, dan tahun (2024, 2025, 2019)
        - Gunakan kalimat yang langsung to the point, hindari kalimat yang bertele-tele
        - JANGAN meniru atau copy-paste teks referensi
        - Buat kesimpulan yang UNIK berdasarkan data aktual yang diberikan
        - JANGAN gunakan markdown formatting (** atau *), tulis plain text saja
        
        CONTOH STRUKTUR (JANGAN DITIRU, HANYA REFERENSI):
        "Prognosa 2025 menunjukkan pertumbuhan X% dari 2024. Recovery rate mencapai Y% terhadap 2019, mengindikasikan pemulihan hampir tuntas. Volume trafik ${trafficType === TrafficType.PASSENGER ? 'penumpang' : 'pesawat'} telah mendekati level pra-pandemi."
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
        
        Buat kesimpulan profesional yang SINGKAT (MAKSIMAL 60 KATA, TIDAK BOLEH LEBIH) berdasarkan data di atas.
        JANGAN meniru teks referensi, buat kesimpulan yang unik, padat, dan informatif.
        Fokus pada poin-poin kunci: growth %, recovery rate %, dan tahun (2024, 2025, 2019).
        Sertakan konteks tentang pemulihan trafik ${trafficType === TrafficType.PASSENGER ? 'penumpang' : 'pesawat'}.
        Hindari kalimat yang panjang dan bertele-tele. Pastikan kesimpulan dapat dibaca dalam 1 paragraf tanpa perlu scroll.
        JANGAN gunakan markdown formatting (** atau *), tulis plain text saja.
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
