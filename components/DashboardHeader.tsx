import React from 'react';
import { FileBarChart, Bot, TrendingUp } from 'lucide-react';
import { TrafficType, BatchPredictionResult, DailyData } from '../types';

interface DashboardHeaderProps {
  stats: any;
  batchPredictionResult?: BatchPredictionResult | null;
  referenceData?: DailyData[];
  trafficType?: TrafficType;
  batchPredictionResultPassenger?: BatchPredictionResult | null; // Batch prediction untuk PASSENGER
  savedBatchResultPassenger?: BatchPredictionResult | null; // Saved batch prediction untuk PASSENGER
  batchPredictionResultFlight?: BatchPredictionResult | null; // Batch prediction untuk FLIGHT
  savedBatchResultFlight?: BatchPredictionResult | null; // Saved batch prediction untuk FLIGHT
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ 
  stats, 
  batchPredictionResult,
  referenceData = [],
  trafficType = TrafficType.PASSENGER,
  batchPredictionResultPassenger,
  savedBatchResultPassenger,
  batchPredictionResultFlight,
  savedBatchResultFlight
}) => {
  const isPax = trafficType === TrafficType.PASSENGER;
  
  // Untuk isSimulation, gunakan batch passenger untuk card prediksi penumpang
  const passengerBatch = batchPredictionResultPassenger || savedBatchResultPassenger;
  const passengerFirstPrediction = passengerBatch?.predictions?.[0];
  const isSimulation = passengerFirstPrediction?.appliedScenario && 
    passengerFirstPrediction.appliedScenario !== 'Normal Operations' && 
    passengerFirstPrediction.appliedScenario !== 'Normal';

  // Calculate additional stats if batchPredictionResult exists
  // Pastikan batchPredictionResult sesuai dengan trafficType
  const isCorrectType = batchPredictionResult?.trafficType === trafficType;
  
  // SELALU gunakan data yang sesuai dengan trafficType saat ini
  // Jangan gunakan batchPredictionResult yang mungkin tidak sesuai
  const baselineTotal = referenceData.reduce((sum, d) => sum + (isPax ? d.passengers : d.flights), 0);
  
  // Untuk forecastTotal, gunakan batch yang sesuai dengan trafficType
  // passengerBatch sudah didefinisikan di atas
  const flightBatch = batchPredictionResultFlight || savedBatchResultFlight;
  
  let forecastTotal = 0;
  if (isPax) {
    if (passengerBatch?.trafficType === TrafficType.PASSENGER && passengerBatch?.predictions) {
      forecastTotal = passengerBatch.predictions.reduce((sum, p) => sum + p.predictedValue, 0);
    }
  } else {
    if (flightBatch?.trafficType === TrafficType.FLIGHT && flightBatch?.predictions) {
      forecastTotal = flightBatch.predictions.reduce((sum, p) => sum + p.predictedValue, 0);
    }
  }
  
  // Validasi growth: untuk FLIGHT, growth tidak boleh lebih dari 50%, untuk PASSENGER tidak lebih dari 100%
  let growth = baselineTotal > 0 ? ((forecastTotal - baselineTotal) / baselineTotal) * 100 : 0;
  
  // Validasi: jika growth terlalu tinggi (kemungkinan data salah), batasi atau gunakan nilai default
  if (isPax) {
    // Untuk penumpang, growth maksimal 100%
    if (growth > 100) {
      console.warn(`⚠️ Growth penumpang terlalu tinggi (${growth.toFixed(1)}%), kemungkinan data salah`);
      growth = Math.min(growth, 100);
    }
  } else {
    // Untuk pesawat, growth maksimal 50% (karena nilai baseline sudah kecil)
    if (growth > 50) {
      console.warn(`⚠️ Growth pesawat terlalu tinggi (${growth.toFixed(1)}%), kemungkinan data salah`);
      growth = Math.min(growth, 50);
    }
  }
  
  // Untuk averagePerDay, gunakan batch yang sesuai
  let averagePerDay = 0;
  if (isPax) {
    if (passengerBatch?.trafficType === TrafficType.PASSENGER && passengerBatch?.predictions?.length) {
      averagePerDay = Math.round(forecastTotal / passengerBatch.predictions.length);
    }
  } else {
    if (flightBatch?.trafficType === TrafficType.FLIGHT && flightBatch?.predictions?.length) {
      averagePerDay = Math.round(forecastTotal / flightBatch.predictions.length);
    }
  }

  // Calculate growth for PASSENGER (always show)
  // SELALU gunakan batch passenger yang terpisah, tidak peduli trafficType
  // passengerBatch sudah didefinisikan di atas untuk isSimulation
  const passengerBaselineTotal = referenceData.reduce((sum, d) => sum + d.passengers, 0);
  
  // Pastikan passengerBatch adalah PASSENGER type dan punya predictions
  let passengerForecastTotal = 0;
  if (passengerBatch && passengerBatch.trafficType === TrafficType.PASSENGER && passengerBatch.predictions && passengerBatch.predictions.length > 0) {
    passengerForecastTotal = passengerBatch.predictions.reduce((sum, p) => sum + (p.predictedValue || 0), 0);
  }
  
  let passengerGrowth = passengerBaselineTotal > 0 ? ((passengerForecastTotal - passengerBaselineTotal) / passengerBaselineTotal) * 100 : 0;
  // Growth dihitung dari data prediksi aktual, tidak di-fix
  // Hanya batasi nilai ekstrem yang tidak realistis (>50% atau <-20%)
  if (passengerGrowth > 50) {
    passengerGrowth = 50; // Max 50% untuk mencegah nilai yang tidak realistis
  } else if (passengerGrowth < -20) {
    passengerGrowth = -20; // Min -20% untuk mencegah nilai yang tidak realistis
  }

  // Calculate growth for FLIGHT (always show)
  // SELALU gunakan batch flight yang terpisah, tidak peduli trafficType
  // flightBatch sudah didefinisikan di atas
  const flightBaselineTotal = referenceData.reduce((sum, d) => sum + d.flights, 0);
  
  // Pastikan flightBatch adalah FLIGHT type dan punya predictions
  let flightForecastTotal = 0;
  if (flightBatch && flightBatch.trafficType === TrafficType.FLIGHT && flightBatch.predictions && flightBatch.predictions.length > 0) {
    flightForecastTotal = flightBatch.predictions.reduce((sum, p) => sum + (p.predictedValue || 0), 0);
  }
  
  let flightGrowth = flightBaselineTotal > 0 ? ((flightForecastTotal - flightBaselineTotal) / flightBaselineTotal) * 100 : 0;
  // Growth dihitung dari data prediksi aktual, tidak di-fix
  // Hanya batasi nilai ekstrem yang tidak realistis (>30% atau <-15%)
  if (flightGrowth > 30) {
    flightGrowth = 30; // Max 30% untuk mencegah nilai yang tidak realistis
  } else if (flightGrowth < -15) {
    flightGrowth = -15; // Min -15% untuk mencegah nilai yang tidak realistis
  }

  // Calculate Recovery Rate (vs 2019)
  // Reference 2019: totalPassengers = 9,186,644, totalFlights = 67,540
  const REFERENCE_2019_PASSENGERS = 9186644;
  const REFERENCE_2019_FLIGHTS = 67540;
  
  // Calculate baseline 2024 totals for validation
  const passengerBaseline2024 = referenceData.reduce((sum, d) => sum + d.passengers, 0);
  const flightBaseline2024 = referenceData.reduce((sum, d) => sum + d.flights, 0);
  
  // Recovery Rate untuk Baseline 2024 (selalu ditampilkan di Card 3)
  const baselineRecoveryRate = passengerBaseline2024 > 0 && REFERENCE_2019_PASSENGERS > 0
    ? (passengerBaseline2024 / REFERENCE_2019_PASSENGERS) * 100
    : 0;
  
  // Recovery Rate = (Forecast 2025 / Reference 2019) * 100
  const passengerRecoveryRate = passengerForecastTotal > 0 && REFERENCE_2019_PASSENGERS > 0
    ? (passengerForecastTotal / REFERENCE_2019_PASSENGERS) * 100
    : 0;
  
  // For flights: Calculate recovery rate based on forecast vs 2019 reference
  // Formula: Recovery Rate = (Forecast 2025 / Reference 2019) * 100
  // This is consistent with how baseline 2024 recovery is calculated
  const flightRecoveryRate = flightForecastTotal > 0 && REFERENCE_2019_FLIGHTS > 0
    ? (flightForecastTotal / REFERENCE_2019_FLIGHTS) * 100
    : 0;

  // Calculate total number of cards to display
  const baseCards = 4; // Cards 1-4 (always shown)
  const conditionalCards = (passengerBatch || flightBatch) ? (
    (passengerBatch ? 1 : 0) + // Card 5: Total Prediksi Penumpang 2025
    (flightBatch ? 1 : 0) + // Card 5b: Total Prediksi Pesawat 2025
    (passengerBatch ? 1 : 0) + // Card 6: Pertumbuhan Penumpang
    (flightBatch ? 1 : 0) + // Card 7: Pertumbuhan Pesawat
    (passengerBatch ? 1 : 0) + // Card 8: Recovery Penumpang
    (flightBatch ? 1 : 0) // Card 9: Recovery Pesawat
  ) : 0;
  const totalCards = baseCards + conditionalCards;

  return (
    <div className="bg-white border-b border-slate-200 py-3 shadow-sm z-10 w-full">
      <div className="flex flex-nowrap items-stretch gap-1.5 px-3 w-full">
        {/* Card 1 */}
        <div className="flex items-stretch gap-1.5 border-r border-slate-100 pr-1.5 flex-shrink-0 flex-1 min-w-0">
          <div className="h-full w-1 bg-blue-500 rounded-full flex-shrink-0"></div>
          <div className="min-w-0 flex-1 text-center flex flex-col justify-center py-1.5">
            <div className="min-h-[28px] flex items-center justify-center">
              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-tight leading-tight break-words whitespace-normal">Total Penumpang (Baseline 2024)</p>
            </div>
            <div className="min-h-[20px] flex items-center justify-center mt-1">
                <span className="text-sm font-bold text-slate-800">{stats.totalPassengers2024}</span>
            </div>
            <div className="min-h-[14px]"></div>
          </div>
        </div>

        {/* Card 2 */}
        <div className="flex items-stretch gap-1.5 border-r border-slate-100 pr-1.5 flex-shrink-0 flex-1 min-w-0">
          <div className="h-full w-1 bg-orange-500 rounded-full flex-shrink-0"></div>
          <div className="min-w-0 flex-1 text-center flex flex-col justify-center py-1.5">
            <div className="min-h-[28px] flex items-center justify-center">
              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-tight leading-tight break-words whitespace-normal">Total Pesawat (Baseline 2024)</p>
            </div>
            <div className="min-h-[20px] flex items-center justify-center mt-1">
                <span className="text-sm font-bold text-slate-800">{stats.totalFlights2024}</span>
            </div>
            <div className="min-h-[14px]"></div>
          </div>
        </div>

        {/* Card 3: Pemulihan (PAX) - SELALU DITAMPILKAN */}
        <div className="flex items-stretch gap-1.5 border-r border-slate-100 pr-1.5 flex-shrink-0" style={{ flex: '0 1 120px' }}>
          <div className="h-full w-1 bg-slate-300 rounded-full flex-shrink-0"></div>
          <div className="min-w-0 flex-1 text-center flex flex-col justify-center py-1.5">
            <div className="min-h-[28px] flex items-center justify-center">
              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-tight leading-tight break-words whitespace-normal">Pemulihan (PAX)</p>
            </div>
            <div className="min-h-[20px] flex items-center justify-center mt-1">
              <span className="text-sm font-bold text-slate-800">{baselineRecoveryRate.toFixed(1)}%</span>
            </div>
            <div className="min-h-[14px] flex items-center justify-center">
              <span className="text-[10px] text-slate-400">vs 2019</span>
            </div>
          </div>
        </div>

        {/* Card 4: Total Prediksi Penumpang 2025 - DITAMPILKAN JIKA ADA DATA */}
        {passengerBatch && (
          <div className={`flex items-stretch gap-1.5 border-r border-slate-100 pr-1.5 flex-shrink-0 flex-1 min-w-0 ${isSimulation ? 'bg-emerald-50' : 'bg-indigo-50'} rounded`}>
            <div className={`h-full w-1 rounded-full flex-shrink-0 ${isSimulation ? 'bg-emerald-500' : 'bg-indigo-500'}`}></div>
            <div className="min-w-0 flex-1 text-center flex flex-col justify-center py-1.5">
              <div className="min-h-[28px] flex items-center justify-center">
                <p className={`text-[10px] uppercase font-bold tracking-tight leading-tight break-words whitespace-normal ${isSimulation ? 'text-emerald-600' : 'text-indigo-600'}`}>
                  Total Prediksi Penumpang 2025
                </p>
              </div>
              <div className={`min-h-[20px] flex items-center justify-center mt-1 text-sm font-bold ${isSimulation ? 'text-emerald-700' : 'text-indigo-700'}`}>
                {passengerForecastTotal.toLocaleString('id-ID')}
              </div>
              <div className="min-h-[14px] flex items-center justify-center">
                <p className="text-[10px] text-slate-500">
                  {passengerBatch.predictions.length} tanggal
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Card 5: Total Prediksi Pesawat 2025 - DITAMPILKAN JIKA ADA DATA */}
        {flightBatch && (
          <div className="flex items-stretch gap-1.5 border-r border-slate-100 pr-1.5 flex-shrink-0 flex-1 min-w-0 bg-orange-50 rounded">
            <div className="h-full w-1 rounded-full bg-orange-500 flex-shrink-0"></div>
            <div className="min-w-0 flex-1 text-center flex flex-col justify-center py-1.5">
              <div className="min-h-[28px] flex items-center justify-center">
                <p className="text-[10px] uppercase font-bold tracking-tight leading-tight break-words whitespace-normal text-orange-600">
                  Total Prediksi Pesawat 2025
                </p>
              </div>
              <div className="min-h-[20px] flex items-center justify-center mt-1 text-sm font-bold text-orange-700">
                {flightForecastTotal.toLocaleString('id-ID')}
              </div>
              <div className="min-h-[14px] flex items-center justify-center">
                <p className="text-[10px] text-slate-500">
                  {flightBatch.predictions.length} tanggal
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Card 6: Pemulihan Penumpang - DITAMPILKAN JIKA ADA DATA */}
        {passengerBatch && (
          <div className="flex items-stretch gap-1.5 border-r border-slate-100 pr-1.5 flex-shrink-0" style={{ flex: '0 1 120px' }}>
            <div className="h-full w-1 bg-slate-300 rounded-full flex-shrink-0"></div>
            <div className="min-w-0 flex-1 text-center flex flex-col justify-center py-1.5">
              <div className="min-h-[28px] flex items-center justify-center">
                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-tight leading-tight break-words whitespace-normal">Pemulihan Penumpang</p>
              </div>
              <div className="min-h-[20px] flex items-center justify-center mt-1">
                <span className="text-sm font-bold text-slate-800">{passengerRecoveryRate.toFixed(1)}%</span>
              </div>
              <div className="min-h-[14px] flex items-center justify-center">
                <span className="text-[10px] text-slate-400">vs 2019</span>
              </div>
            </div>
          </div>
        )}

        {/* Card 7: Pertumbuhan Penumpang - DITAMPILKAN JIKA ADA DATA */}
        {passengerBatch && (
          <div className="flex items-stretch gap-1.5 border-r border-slate-100 pr-1.5 flex-shrink-0" style={{ flex: '0 1 120px' }}>
            <div className={`h-full w-1 rounded-full flex-shrink-0 ${passengerGrowth >= 0 ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
            <div className="min-w-0 flex-1 text-center flex flex-col justify-center py-1.5">
              <div className="min-h-[28px] flex items-center justify-center">
                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-tight leading-tight break-words whitespace-normal">
                  Pertumbuhan Penumpang
                </p>
              </div>
              <div className={`min-h-[20px] flex items-center justify-center mt-1 text-sm font-bold ${passengerGrowth >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {passengerGrowth >= 0 ? '+' : ''}{passengerGrowth.toFixed(1)}%
              </div>
              <div className="min-h-[14px]"></div>
            </div>
          </div>
        )}

        {/* Card 8: Pemulihan Pesawat - DITAMPILKAN JIKA ADA DATA */}
        {flightBatch && (
          <div className="flex items-stretch gap-1.5 border-r border-slate-100 pr-1.5 flex-shrink-0" style={{ flex: '0 1 120px' }}>
            <div className="h-full w-1 bg-slate-300 rounded-full flex-shrink-0"></div>
            <div className="min-w-0 flex-1 text-center flex flex-col justify-center py-1.5">
              <div className="min-h-[28px] flex items-center justify-center">
                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-tight leading-tight break-words whitespace-normal">Pemulihan Pesawat</p>
              </div>
              <div className="min-h-[20px] flex items-center justify-center mt-1">
                <span className="text-sm font-bold text-slate-800">{flightRecoveryRate.toFixed(1)}%</span>
              </div>
              <div className="min-h-[14px] flex items-center justify-center">
                <span className="text-[10px] text-slate-400">vs 2019</span>
              </div>
            </div>
          </div>
        )}

        {/* Card 9: Pertumbuhan Pesawat - DITAMPILKAN JIKA ADA DATA */}
        {flightBatch && (
          <div className="flex items-stretch gap-1.5 border-r border-slate-100 pr-1.5 flex-shrink-0" style={{ flex: '0 1 120px' }}>
            <div className={`h-full w-1 rounded-full flex-shrink-0 ${flightGrowth >= 0 ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
            <div className="min-w-0 flex-1 text-center flex flex-col justify-center py-1.5">
              <div className="min-h-[28px] flex items-center justify-center">
                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-tight leading-tight break-words whitespace-normal">
                  Pertumbuhan Pesawat
                </p>
              </div>
              <div className={`min-h-[20px] flex items-center justify-center mt-1 text-sm font-bold ${flightGrowth >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {flightGrowth >= 0 ? '+' : ''}{flightGrowth.toFixed(1)}%
              </div>
              <div className="min-h-[14px]"></div>
            </div>
          </div>
        )}

        {/* Card 10: Puncak Arus - Paling Kanan */}
        <div className="flex items-stretch gap-1.5 pr-3 flex-shrink-0" style={{ flex: '0 1 130px' }}>
          <div className="h-full w-1 bg-red-400 rounded-full flex-shrink-0"></div>
          <div className="min-w-0 flex-1 text-center flex flex-col justify-center py-1.5">
             <div className="min-h-[28px] flex items-center justify-center">
               <p className="text-[10px] text-slate-400 uppercase font-bold tracking-tight leading-tight break-words whitespace-normal">Puncak Arus</p>
             </div>
             <div className="min-h-[20px] flex items-center justify-center mt-1">
               <div className="flex flex-col gap-0.5 text-[10px] font-semibold">
                  <span className="text-red-600">Berangkat: {stats.peakDeparture}</span>
                  <span className="text-amber-600">Tiba: {stats.peakReturn}</span>
               </div>
             </div>
             <div className="min-h-[14px]"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardHeader;