import React, { useMemo, useState, useEffect } from 'react';
import { ResponsiveContainer, BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, Legend, LabelList } from 'recharts';
import { DailyData, TrafficType, PredictionResult, BatchPredictionResult } from '../types';
import { TrendingUp, Info, FileBarChart, Lightbulb, Globe, ExternalLink, Zap, Bot, TrendingDown, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { generateKesimpulan } from '../services/geminiService';
import HeatmapTable from './HeatmapTable';

interface ChartSectionProps {
  trafficType: TrafficType;
  batchPredictionResult: BatchPredictionResult | null;
  referenceData: DailyData[];
  savedBatchResult?: BatchPredictionResult | null; // Data sebelumnya dari database
  isNewPrediction?: boolean; // Flag untuk membedakan data baru vs data tersimpan
  batchPredictionResultPassenger?: BatchPredictionResult | null; // Batch prediction untuk PASSENGER (untuk berita)
  savedBatchResultPassenger?: BatchPredictionResult | null; // Saved batch prediction untuk PASSENGER (untuk berita)
  batchPredictionResultFlight?: BatchPredictionResult | null; // Batch prediction untuk FLIGHT (untuk kesimpulan)
  savedBatchResultFlight?: BatchPredictionResult | null; // Saved batch prediction untuk FLIGHT (untuk kesimpulan)
}

const ChartSection: React.FC<ChartSectionProps> = ({ 
  trafficType, 
  batchPredictionResult, 
  referenceData,
  savedBatchResult,
  isNewPrediction = false,
  batchPredictionResultPassenger,
  savedBatchResultPassenger,
  batchPredictionResultFlight,
  savedBatchResultFlight
}) => {
  const [kesimpulan, setKesimpulan] = useState<string>('');
  const [isGeneratingKesimpulan, setIsGeneratingKesimpulan] = useState(false);
  
  // Load atau generate kesimpulan when prediction data changes
  useEffect(() => {
    const loadOrGenerateKesimpulan = async () => {
      const passengerBatch = batchPredictionResultPassenger || savedBatchResultPassenger;
      const flightBatch = batchPredictionResultFlight || savedBatchResultFlight;
      
      // Pilih batch yang sesuai dengan trafficType saat ini
      const currentBatch = trafficType === TrafficType.PASSENGER ? passengerBatch : flightBatch;
      
      if (!currentBatch) {
        setKesimpulan('');
        return;
      }
      
      setIsGeneratingKesimpulan(true);
      try {
        // Coba load dari JSON file dulu
        const { getKesimpulanFromFile } = await import('../services/fileStorageService');
        const fileKesimpulan = await getKesimpulanFromFile(trafficType);
        
        // Jika ada kesimpulan di file, gunakan itu
        if (fileKesimpulan && fileKesimpulan.trim().length > 0) {
          setKesimpulan(fileKesimpulan);
          setIsGeneratingKesimpulan(false);
          return;
        }
        
        // Jika tidak ada di file, generate baru berdasarkan trafficType saat ini
        const result = await generateKesimpulan(
          passengerBatch,
          flightBatch,
          referenceData,
          trafficType
        );
        setKesimpulan(result);
        
        // Di GitHub Pages, tidak bisa update file (read-only static assets)
        // Kesimpulan hanya ditampilkan, tidak disimpan
        console.log('ℹ️ Kesimpulan tidak bisa di-update di static assets (GitHub Pages)');
      } catch (error) {
        console.error('Error loading/generating kesimpulan:', error);
        setKesimpulan('');
      } finally {
        setIsGeneratingKesimpulan(false);
      }
    };
    
    loadOrGenerateKesimpulan();
  }, [batchPredictionResultPassenger, savedBatchResultPassenger, batchPredictionResultFlight, savedBatchResultFlight, referenceData, trafficType]);
  // Determine Data Key and Colors
  const isPax = trafficType === TrafficType.PASSENGER;
  // Standard colors - konsisten dengan tema
  const colorPax = '#3b82f6';   // Blue-500 untuk baseline penumpang
  const colorFlight = '#f97316'; // Orange-500 untuk baseline pesawat
  // Dynamic color based on scenario (check first prediction)
  const firstPrediction = batchPredictionResult?.predictions?.[0];
  const isSimulation = firstPrediction?.appliedScenario && firstPrediction.appliedScenario !== 'Normal Operations' && firstPrediction.appliedScenario !== 'Normal';
  // Warna prediksi: Indigo untuk normal, Emerald untuk simulation (tetap konsisten)
  const colorPredict = isSimulation ? '#10b981' : '#4f46e5'; // Emerald-500 for Auto Agent, Indigo-600 for normal

  // Helper: Convert prediction date (2025/2026) to baseline date (2024)
  const getBaselineDate = (predictionDate: string): string => {
    const date = new Date(predictionDate);
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

  // Get predictions map for quick lookup
  const predictionsMap = useMemo(() => {
    if (!batchPredictionResult?.predictions) return new Map();
    const map = new Map();
    batchPredictionResult.predictions.forEach(pred => {
      if (pred.date) {
        map.set(pred.date, pred);
      }
    });
    return map;
  }, [batchPredictionResult]);

  // Prepare Data: Add ALL Predictions for side-by-side comparison
  // Reference data menggunakan tahun 2024 (baseline), tapi untuk display kita map ke 2025/2026
  const chartData = useMemo(() => {
    // Map referenceData (2024) ke tanggal 2025/2026 untuk display
    // Desember 2024 -> Desember 2025, Januari 2024 -> Januari 2026
    let combinedData: any[] = referenceData.map(d => {
      const date = new Date(d.date);
      let displayDate = d.date;
      // Convert 2024 dates to 2025/2026 for display
      if (date.getFullYear() === 2024) {
        // Desember 2024 -> Desember 2025, Januari 2024 -> Januari 2026
        if (date.getMonth() === 0) { // January (month 0)
          date.setFullYear(2026);
        } else {
          date.setFullYear(2025);
        }
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        displayDate = `${year}-${month}-${day}`;
      } else if (date.getFullYear() === 2025) {
        date.setFullYear(2026);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        displayDate = `${year}-${month}-${day}`;
      }
      return { ...d, date: displayDate };
    });
    
    // Add all predictions from batch result
    if (batchPredictionResult && batchPredictionResult.predictions) {
      batchPredictionResult.predictions.forEach(pred => {
        if (!pred.date) return;
        
        const idx = combinedData.findIndex(d => d.date === pred.date);
        
        if (idx >= 0) {
          // Inject specific prediction key based on type
          if (trafficType === TrafficType.PASSENGER) {
            combinedData[idx].paxPrediction = pred.predictedValue;
          } else {
            combinedData[idx].flightPrediction = pred.predictedValue;
          }
          combinedData[idx].isPredictionDate = true;
        } else {
          // Handle out of range dates
          const newDataPoint: any = {
            date: pred.date,
            dayName: new Date(pred.date).toLocaleDateString('id-ID', { weekday: 'long' }),
            description: 'Prediksi AI',
            isPredictionDate: true,
            passengers: 0,
            flights: 0
          };
          
          if (trafficType === TrafficType.PASSENGER) {
            newDataPoint.paxPrediction = pred.predictedValue;
          } else {
            newDataPoint.flightPrediction = pred.predictedValue;
          }
          combinedData.push(newDataPoint);
        }
      });
      
      // Sort by date
      combinedData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }
    
    return combinedData;
  }, [batchPredictionResult, trafficType, referenceData]);

  const formatXAxis = (tickItem: string) => {
    const date = new Date(tickItem);
    return `${date.getDate()}/${date.getMonth() + 1}`;
  };

  const formatYAxisPax = (value: number) => {
    return value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value.toString();
  };

  const formatYAxisFlight = (value: number) => {
    return value.toLocaleString('id-ID');
  };

  // Format label untuk bar chart (real number dengan pemisah ribuan)
  const formatBarLabel = (value: number) => {
    if (!value || value === 0) return '';
    // Tampilkan angka penuh dengan format Indonesia (titik sebagai pemisah ribuan)
    return value.toLocaleString('id-ID');
  };

  // Custom label component untuk bar chart
  const CustomBarLabel = ({ x, y, width, value, fill }: any) => {
    if (!value || value === 0) return null;
    // Ukuran font responsif berdasarkan lebar bar, tapi lebih kecil untuk angka panjang
    const fontSize = width > 40 ? 9 : width > 30 ? 8 : width > 20 ? 7 : 6;
    const labelText = formatBarLabel(value);
    const labelY = y - 4; // Posisi di atas bar
    
    return (
      <text
        x={x + width / 2}
        y={labelY}
        fill={fill}
        fontSize={fontSize}
        fontWeight="600"
        textAnchor="middle"
        dominantBaseline="bottom"
        className="drop-shadow-sm"
      >
        {labelText}
      </text>
    );
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      // Filter payload based on trafficType
      const filteredPayload = payload.filter((entry: any) => {
        if (isPax) {
          return entry.dataKey === 'passengers' || entry.dataKey === 'paxPrediction';
        } else {
          return entry.dataKey === 'flights' || entry.dataKey === 'flightPrediction';
        }
      });

      if (filteredPayload.length === 0) return null;

      return (
        <div className="bg-white p-3 border border-slate-200 shadow-lg rounded-lg text-xs z-50">
          <p className="font-bold text-slate-700 mb-2">{new Date(label).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' })}</p>
          {filteredPayload.map((entry: any, index: number) => (
             <div key={index} className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></span>
                <span className="text-slate-500 capitalize">
                    {entry.name === 'paxPrediction' ? 'Prediksi Penumpang 2025' : 
                     entry.name === 'flightPrediction' ? 'Prediksi Pesawat 2025' : 
                     entry.name === 'passengers' ? 'Penumpang 2024' :
                     entry.name === 'flights' ? 'Pesawat 2024' :
                     entry.name}
                </span>: 
                <span className="font-bold ml-auto">{entry.value.toLocaleString('id-ID')}</span>
             </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex flex-col h-full bg-white">
      
      {/* Chart Area */}
      {/* 
         FIX: Set fixed height for Mobile (250px) and Desktop (420px). 
         Removed flex-1 to prevent it from squishing content below.
      */}
      <div className="h-[250px] md:h-[380px] p-3 relative flex flex-col flex-none">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-2 gap-2 flex-none">
            <div>
                <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                  Grafik Batang Komparasi
                </h3>
            </div>
            {batchPredictionResult && (
              <div className="flex items-center gap-2 flex-wrap">
                 <span className={`text-[10px] font-bold px-2 py-0.5 rounded border flex items-center gap-1 ${isSimulation ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-indigo-50 text-indigo-600 border-indigo-100'}`}>
                    {isSimulation ? (
                         <>
                            <Bot className="w-3 h-3" /> Auto: {firstPrediction?.appliedScenario || 'Agent Mode'}
                         </>
                    ) : (
                        firstPrediction?.sources && firstPrediction.sources.length > 0 ? (
                            <>
                                <Globe className="w-3 h-3" /> Grounded ({batchPredictionResult.predictions.length} tanggal)
                            </>
                        ) : (
                            `Mode Normal (${batchPredictionResult.predictions.length} tanggal)`
                        )
                    )}
                 </span>
                 {!isNewPrediction && savedBatchResult && (
                   <span className="text-[10px] font-bold px-2 py-0.5 rounded border bg-slate-50 text-slate-600 border-slate-200 flex items-center gap-1">
                     <FileBarChart className="w-3 h-3" /> Data Tersimpan
                   </span>
                 )}
                 {isNewPrediction && (
                   <span className="text-[10px] font-bold px-2 py-0.5 rounded border bg-blue-50 text-blue-600 border-blue-200 flex items-center gap-1">
                     <Zap className="w-3 h-3" /> Prediksi Baru
                   </span>
                 )}
              </div>
            )}
          </div>
          
          {/* Chart and Kesimpulan Side by Side */}
          <div className="flex-1 w-full min-h-0 relative flex gap-3">
            {/* Chart - Left Side */}
            <div className="flex-1 min-w-0 relative">
              <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 30, right: 10, left: 0, bottom: 0 }} barGap={0}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                    dataKey="date" 
                    tickFormatter={formatXAxis} 
                    stroke="#94a3b8" 
                    fontSize={10} 
                    tickMargin={8}
                />
                {isPax && (
                  <YAxis 
                      yAxisId="left" 
                      orientation="left"
                      stroke={colorPax} 
                      fontSize={10}
                      width={30}
                      tickFormatter={formatYAxisPax}
                  />
                )}
                {!isPax && (
                  <YAxis 
                      yAxisId="right" 
                      orientation="right"
                      stroke={colorFlight} 
                      fontSize={10}
                      width={30}
                      tickFormatter={formatYAxisFlight}
                  />
                )}
                
                <Tooltip content={<CustomTooltip />} />

                <Legend 
                  verticalAlign="top" 
                  height={30} 
                  iconType="square"
                  wrapperStyle={{ fontSize: '10px' }}
                  content={({ payload }) => {
                    if (!payload) return null;
                    // Urutkan payload: 2024 dulu, baru 2025
                    const sortedPayload = [...payload].sort((a, b) => {
                      const order2024 = ['passengers', 'flights'];
                      const order2025 = ['paxPrediction', 'flightPrediction'];
                      const aIs2024 = order2024.includes(a.value as string);
                      const bIs2024 = order2024.includes(b.value as string);
                      if (aIs2024 && !bIs2024) return -1; // 2024 dulu
                      if (!aIs2024 && bIs2024) return 1;  // 2025 kemudian
                      return 0;
                    });
                    return (
                      <ul className="recharts-legend-wrapper" style={{ display: 'flex', justifyContent: 'center', gap: '20px', padding: '0', margin: '0', listStyle: 'none' }}>
                        {sortedPayload.map((entry: any, index: number) => (
                          <li key={index} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <span style={{ display: 'inline-block', width: '10px', height: '10px', backgroundColor: entry.color }}></span>
                            <span style={{ fontSize: '10px' }}>
                              {entry.value === 'passengers' ? 'Penumpang 2024' : 
                               entry.value === 'flights' ? 'Pesawat 2024' : 
                               entry.value === 'paxPrediction' ? 'Prediksi Penumpang 2025' : 
                               entry.value === 'flightPrediction' ? 'Prediksi Pesawat 2025' : 
                               entry.value}
                            </span>
                          </li>
                        ))}
                      </ul>
                    );
                  }}
                />
                
                <ReferenceLine x="2025-12-25" stroke="#ef4444" strokeDasharray="3 3" yAxisId={isPax ? "left" : "right"} label={{ value: "Natal", position: 'insideTop', fill: '#ef4444', fontSize: 10 }} />
                <ReferenceLine x="2026-01-01" stroke="#ef4444" strokeDasharray="3 3" yAxisId={isPax ? "left" : "right"} label={{ value: "Thn Baru", position: 'insideTop', fill: '#ef4444', fontSize: 10 }} />
                
                {/* Reference Bars - Only show based on trafficType */}
                {isPax && (
                  <Bar 
                      yAxisId="left"
                      dataKey="passengers" 
                      name="passengers"
                      fill={colorPax}
                      radius={[4, 4, 0, 0]}
                      animationDuration={800}
                  >
                    <LabelList 
                      content={<CustomBarLabel fill={colorPax} />} 
                      position="top"
                    />
                  </Bar>
                )}
                
                {!isPax && (
                  <Bar 
                      yAxisId="right"
                      dataKey="flights" 
                      name="flights"
                      fill={colorFlight}
                      radius={[4, 4, 0, 0]}
                      animationDuration={800}
                  >
                    <LabelList 
                      content={<CustomBarLabel fill={colorFlight} />} 
                      position="top"
                    />
                  </Bar>
                )}

                {/* Prediction Bar - Only show based on trafficType */}
                {isPax && (
                  <Bar 
                      yAxisId="left"
                      dataKey="paxPrediction" 
                      name="paxPrediction"
                      fill={colorPredict}
                      radius={[4, 4, 0, 0]}
                      animationDuration={500}
                  >
                    <LabelList 
                      content={<CustomBarLabel fill={colorPredict} />} 
                      position="top"
                    />
                  </Bar>
                )}

                {!isPax && (
                  <Bar 
                      yAxisId="right"
                      dataKey="flightPrediction" 
                      name="flightPrediction"
                      fill={colorPredict}
                      radius={[4, 4, 0, 0]}
                      animationDuration={500}
                  >
                    <LabelList 
                      content={<CustomBarLabel fill={colorPredict} />} 
                      position="top"
                    />
                  </Bar>
                )}

              </BarChart>
            </ResponsiveContainer>
            </div>

            {/* Kesimpulan - Right Side of Chart (Desktop) */}
            {batchPredictionResult && batchPredictionResult.predictions.length > 0 && (
              <div className="hidden md:flex w-[280px] flex-shrink-0">
                <div className="bg-gradient-to-br from-indigo-50 to-blue-50 p-3 rounded-lg border border-indigo-200 shadow-sm w-full flex flex-col">
                  <div className="flex gap-2 items-center mb-2 pb-1.5 border-b border-indigo-200">
                    <FileBarChart className="w-3.5 h-3.5 text-indigo-600" />
                    <h5 className="text-xs font-bold text-indigo-800">Kesimpulan Strategis</h5>
                  </div>
                  {isGeneratingKesimpulan ? (
                    <div className="flex items-center gap-2 text-slate-500 text-xs py-2">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span>Membuat kesimpulan...</span>
                    </div>
                  ) : kesimpulan ? (
                    <div className="text-xs text-slate-700 leading-relaxed flex-1 min-h-0">
                      {(() => {
                        // Clean kesimpulan: remove all markdown symbols
                        let cleanedKesimpulan = kesimpulan
                          // Remove markdown bold (**text** or **text**)
                          .replace(/\*\*(.*?)\*\*/g, '$1')
                          // Remove markdown italic (*text*)
                          .replace(/\*(.*?)\*/g, '$1')
                          // Remove headers
                          .replace(/#{1,6}\s/g, '')
                          // Remove links
                          .replace(/\[(.*?)\]\(.*?\)/g, '$1')
                          .trim();
                        
                        // Format: Bold tahun (2024, 2025, 2019) dan persentase (X%, Y%)
                        // Pattern untuk tahun: 2024, 2025, 2019 (dengan word boundary)
                        cleanedKesimpulan = cleanedKesimpulan.replace(/\b(202[4-9]|2019)\b/g, '<strong class="font-bold text-slate-900">$1</strong>');
                        // Pattern untuk persentase: X.XX% atau X% (dengan atau tanpa spasi sebelum %)
                        cleanedKesimpulan = cleanedKesimpulan.replace(/(\d+[.,]?\d*)\s*%/g, '<strong class="font-bold text-slate-900">$1%</strong>');
                        
                        // Split by double newlines (paragraphs) or single newline
                        const paragraphs = cleanedKesimpulan
                          .split(/\n\n+/)
                          .map(p => p.trim())
                          .filter(p => p.length > 0);
                        
                        if (paragraphs.length === 0) {
                          // If no paragraphs found, try splitting by single newline
                          const lines = cleanedKesimpulan
                            .split(/\n+/)
                            .map(p => p.trim())
                            .filter(p => p.length > 0);
                          
                          return lines.map((line, idx) => (
                            <p key={idx} className="text-xs text-slate-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: line }} />
                          ));
                        }
                        
                        return paragraphs.map((paragraph, idx) => (
                          <p key={idx} className="text-xs text-slate-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: paragraph }} />
                        ));
                      })()}
                    </div>
                  ) : null}
                </div>
              </div>
            )}
          </div>

          {/* Kesimpulan - Below Chart (Mobile) */}
          {batchPredictionResult && batchPredictionResult.predictions.length > 0 && (
            <div className="md:hidden mt-3">
              <div className="bg-gradient-to-br from-indigo-50 to-blue-50 p-3 rounded-lg border border-indigo-200 shadow-sm">
                <div className="flex gap-2 items-center mb-2 pb-1.5 border-b border-indigo-200">
                  <FileBarChart className="w-3.5 h-3.5 text-indigo-600" />
                  <h5 className="text-xs font-bold text-indigo-800">Kesimpulan Strategis</h5>
                </div>
                {isGeneratingKesimpulan ? (
                  <div className="flex items-center gap-2 text-slate-500 text-xs py-2">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>Membuat kesimpulan...</span>
                  </div>
                ) : kesimpulan ? (
                  <div className="text-xs text-slate-700 leading-relaxed">
                    {(() => {
                      // Clean kesimpulan: remove all markdown symbols
                      let cleanedKesimpulan = kesimpulan
                        // Remove markdown bold (**text** or **text**)
                        .replace(/\*\*(.*?)\*\*/g, '$1')
                        // Remove markdown italic (*text*)
                        .replace(/\*(.*?)\*/g, '$1')
                        // Remove headers
                        .replace(/#{1,6}\s/g, '')
                        // Remove links
                        .replace(/\[(.*?)\]\(.*?\)/g, '$1')
                        .trim();
                      
                      // Format: Bold tahun (2024, 2025, 2019) dan persentase (X%, Y%)
                      // Pattern untuk tahun: 2024, 2025, 2019 (dengan word boundary)
                      cleanedKesimpulan = cleanedKesimpulan.replace(/\b(202[4-9]|2019)\b/g, '<strong class="font-bold text-slate-900">$1</strong>');
                      // Pattern untuk persentase: X.XX% atau X% (dengan atau tanpa spasi sebelum %)
                      cleanedKesimpulan = cleanedKesimpulan.replace(/(\d+[.,]?\d*)\s*%/g, '<strong class="font-bold text-slate-900">$1%</strong>');
                      
                      // Split by double newlines (paragraphs) or single newline
                      const paragraphs = cleanedKesimpulan
                        .split(/\n\n+/)
                        .map(p => p.trim())
                        .filter(p => p.length > 0);
                      
                      if (paragraphs.length === 0) {
                        // If no paragraphs found, try splitting by single newline
                        const lines = cleanedKesimpulan
                          .split(/\n+/)
                          .map(p => p.trim())
                          .filter(p => p.length > 0);
                        
                        return lines.map((line, idx) => (
                          <p key={idx} className="text-xs text-slate-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: line }} />
                        ));
                      }
                      
                      return paragraphs.map((paragraph, idx) => (
                        <p key={idx} className="text-xs text-slate-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: paragraph }} />
                      ));
                    })()}
                  </div>
                ) : null}
              </div>
            </div>
          )}
      </div>

      {/* Heatmap Table Section */}
      {(batchPredictionResult || savedBatchResult) && (
        <div className="border-t border-slate-200 bg-white p-4 flex-none">
          <div className="mb-3">
            <h3 className="font-bold text-sm text-slate-800">
              Tabel Heatmap {isPax ? 'Penumpang' : 'Pesawat'}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Perbandingan data baseline 2024 dengan prediksi 2025
            </p>
          </div>
          <HeatmapTable
            trafficType={trafficType}
            referenceData={referenceData}
            batchPredictionResult={batchPredictionResult}
            savedBatchResult={savedBatchResult}
          />
        </div>
      )}

      {/* Analysis Section (Responsive Grid) */}
      <div className="border-t border-slate-200 bg-slate-50/50 p-3 flex-none">
        {batchPredictionResult && batchPredictionResult.predictions.length > 0 ? (
           <div className="grid grid-cols-1 lg:grid-cols-[60%_40%] gap-3">
              
              {/* Col 1: Scenario Analysis & Key Events */}
              <div className="flex flex-col gap-2">
                <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm flex flex-col gap-2">
                    <div className="flex gap-2 items-center pb-1.5 border-b border-slate-100">
                        <Info className="w-3.5 h-3.5 text-slate-400" />
                        <h5 className="text-xs font-bold text-slate-700">Event & Analisis Periode</h5>
                    </div>
                    
                    {/* Scenario Analysis */}
                    {(() => {
                        const scenarioCounts: { [key: string]: number } = {};
                        const promoPeriodDates: string[] = [];
                        const highDemandDates: string[] = [];
                        const combinedDates: string[] = [];
                        
                        batchPredictionResult.predictions.forEach(pred => {
                            const scenario = pred.appliedScenario || 'Unknown';
                            scenarioCounts[scenario] = (scenarioCounts[scenario] || 0) + 1;
                            
                            // Check promo period (22 Des 2025 - 10 Jan 2026)
                            const date = new Date(pred.date);
                            const promoStart = new Date('2025-12-22');
                            const promoEnd = new Date('2026-01-10');
                            const isPromo = date >= promoStart && date <= promoEnd;
                            
                            if (isPromo) promoPeriodDates.push(pred.date);
                            if (scenario.includes('High Demand') || scenario.includes('Event')) {
                                highDemandDates.push(pred.date);
                            }
                            if (isPromo && (scenario.includes('High Demand') || scenario.includes('Event'))) {
                                combinedDates.push(pred.date);
                            }
                        });
                        
                        return (
                            <div className="bg-blue-50 border border-blue-200 rounded p-2">
                                <div className="text-[10px] font-bold text-blue-700 uppercase mb-1.5 flex items-center gap-1">
                                    <FileBarChart className="w-3 h-3" /> Analisis Scenario
                                </div>
                                <div className="space-y-0.5 text-xs text-blue-900">
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <span>Promo Ticket Boost:</span>
                                            <div className="text-[10px] text-blue-600 mt-0.5">
                                                22 Des 2025 - 10 Jan 2026
                                            </div>
                                        </div>
                                        <span className="font-bold ml-2">{promoPeriodDates.length} hari</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>High Demand Event:</span>
                                        <span className="font-bold">{highDemandDates.length} hari</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Kombinasi (Promo + Event):</span>
                                        <span className="font-bold">{combinedDates.length} hari</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Normal Operations:</span>
                                        <span className="font-bold">{scenarioCounts['Normal Operations'] || scenarioCounts['Normal'] || 0} hari</span>
                                    </div>
                                    <div className="pt-0.5 mt-0.5 border-t border-blue-200 text-[10px] text-blue-700">
                                        Total: {batchPredictionResult.predictions.length} hari
                                    </div>
                                </div>
                            </div>
                        );
                    })()}
                    
                    {/* Detected Events */}
                    {batchPredictionResult.predictions.some(p => p.detectedEvent && p.detectedEvent !== 'None') && (
                        <div className="bg-amber-50 border border-amber-200 rounded p-2">
                             <div className="text-[10px] font-bold text-amber-700 uppercase mb-1.5 flex items-center gap-1">
                                <Zap className="w-3 h-3" /> Event yang Terdeteksi
                             </div>
                             <ul className="space-y-0.5 text-xs text-amber-900">
                                {Array.from(new Set(batchPredictionResult.predictions
                                    .filter(p => p.detectedEvent && p.detectedEvent !== 'None')
                                    .map(p => p.detectedEvent)))
                                    .slice(0, 3)
                                    .map((event, i) => (
                                        <li key={i} className="flex items-start gap-1">
                                            <span className="text-amber-600">•</span>
                                            <span>{event}</span>
                                        </li>
                                    ))}
                             </ul>
                        </div>
                    )}

                    {(() => {
                        const analysisText = firstPrediction?.comprehensiveAnalysis || firstPrediction?.reasoning || 'Analisis komprehensif untuk seluruh periode prediksi.';
                        
                        if (!analysisText) return null;
                        
                        // Split analysis text into readable points
                        const splitAnalysis = (text: string): string[] => {
                            // Clean text - remove leading numbers/dashes/whitespace
                            let cleanText = text.trim().replace(/^[\d\.\-\s]+/, '').trim();
                            
                            // Split by sentences: period/question/exclamation followed by space and capital letter
                            const sentences = cleanText
                                .split(/(?<=[.!?])\s+(?=[A-Z])/)
                                .map(s => s.trim())
                                .filter(s => {
                                    // Filter out very short sentences and number-only lines
                                    const isTooShort = s.length < 25;
                                    const isNumberOnly = /^[\d\.\-\s]+$/.test(s);
                                    return !isTooShort && !isNumberOnly;
                                });
                            
                            // If we got multiple good sentences, use them
                            if (sentences.length > 1) {
                                return sentences.map(s => s.endsWith('.') || s.endsWith('!') || s.endsWith('?') ? s : s + '.');
                            }
                            
                            // Fallback: split by periods (more aggressive)
                            const byPeriods = cleanText
                                .split(/\.\s+/)
                                .map(s => s.trim())
                                .filter(s => {
                                    const isTooShort = s.length < 30;
                                    const isNumberOnly = /^[\d\.\-\s]+$/.test(s);
                                    return !isTooShort && !isNumberOnly;
                                })
                                .map(s => s.endsWith('.') ? s : s + '.');
                            
                            if (byPeriods.length > 1) {
                                return byPeriods;
                            }
                            
                            // Last resort: return cleaned text as single point
                            return [cleanText];
                        };
                        
                        const analysisPoints = splitAnalysis(analysisText);
                        
                        return (
                            <div className="mt-2">
                                <div className="text-[10px] font-bold text-slate-500 uppercase mb-1.5">
                                    Analisis Komprehensif
                                </div>
                                <ul className="space-y-1 text-xs text-slate-600 leading-snug">
                                    {analysisPoints
                                        .filter(point => point && point.trim().length > 10)
                                        .slice(0, 5) // Limit to 5 points to save space
                                        .map((point, idx) => {
                                            const cleanPoint = point.trim().replace(/^[\d\.\-\s]+/, '').trim();
                                            if (!cleanPoint || cleanPoint.length < 10) return null;
                                            
                                            return (
                                                <li key={idx} className="flex items-start gap-2">
                                                    <span className="text-slate-400 mt-0.5 flex-shrink-0 font-bold">•</span>
                                                    <span className="flex-1 leading-snug">{cleanPoint}</span>
                                                </li>
                                            );
                                        })}
                                </ul>
                            </div>
                        );
                    })()}

                </div>
              </div>

              {/* Col 2: News Analysis - Positive & Negative */}
              <div className="flex flex-col gap-2">
                 {/* Positive News (Berita Bagus) - Hanya event spesifik, bukan generic */}
                 {(() => {
                    // SELALU gunakan batch prediction PASSENGER untuk berita (yang valid)
                    // Jangan gunakan batch prediction saat ini karena bisa berbeda
                    const newsBatch = batchPredictionResultPassenger || savedBatchResultPassenger;
                    
                    if (!newsBatch || !newsBatch.predictions) {
                      return null;
                    }
                    
                    const positiveEvents = Array.from(new Set(
                      newsBatch.predictions
                        .filter(p => {
                          const scenario = (p.appliedScenario || '').toLowerCase();
                          const event = (p.detectedEvent || '').toLowerCase();
                          
                          // EXCLUDE: Event yang terlalu generic (bukan berita spesifik)
                          const isGenericEvent = 
                            event.includes('awal periode') ||
                            event.includes('belum puncak') ||
                            event.includes('sebelum puncak') ||
                            event.includes('akhir pekan') ||
                            event.includes('weekend') ||
                            event.includes('hari biasa') ||
                            event.includes('normal') ||
                            event.length < 20; // Event terlalu pendek biasanya generic
                          
                          if (isGenericEvent) {
                            return false;
                          }
                          
                          // PRIORITAS TINGGI: EXCLUDE cuaca/bencana - SELALU NEGATIF, tidak peduli konteksnya
                          const isCuacaBencana = (
                            scenario.includes('weather disruption') ||
                            scenario.includes('disaster impact') ||
                            event.includes('hujan') ||
                            event.includes('badai') ||
                            event.includes('cuaca') ||
                            event.includes('weather') ||
                            event.includes('angin kencang') ||
                            event.includes('kabut') ||
                            event.includes('visibility') ||
                            event.includes('banjir') ||
                            event.includes('flood') ||
                            event.includes('gempa') ||
                            event.includes('earthquake') ||
                            event.includes('gunung meletus') ||
                            event.includes('erupsi') ||
                            event.includes('tsunami') ||
                            event.includes('longsor') ||
                            event.includes('landslide') ||
                            event.includes('bencana') ||
                            event.includes('disaster') ||
                            event.includes('bmkg') ||
                            event.includes('potensi cuaca') ||
                            event.includes('cuaca ekstrem') ||
                            event.includes('musim hujan') ||
                            event.includes('peringatan cuaca')
                          );
                          
                          if (isCuacaBencana) {
                            return false; // Cuaca/bencana SELALU negatif, jangan masukkan ke positif
                          }
                          
                          // EXCLUDE: Transportasi darat (KAI, kereta, tol) - ini NEGATIF untuk bandara
                          const isTransportasiDarat = 
                            event.includes('kai') ||
                            event.includes('kereta') ||
                            event.includes('kereta api') ||
                            event.includes('tol') ||
                            event.includes('diskon tol') ||
                            event.includes('gratis tol') ||
                            event.includes('promo tol') ||
                            event.includes('promo tiket kereta') ||
                            event.includes('promo tiket kai') ||
                            event.includes('diskon tarif tol') ||
                            event.includes('transportasi darat') ||
                            scenario.includes('ground transport') ||
                            scenario.includes('competition');
                          
                          if (isTransportasiDarat) {
                            return false; // Jangan masukkan ke positif
                          }
                          
                          // Hanya tampilkan event yang spesifik dan relevan (event positif murni)
                          return (
                            (scenario.includes('high demand') ||
                            scenario.includes('event') ||
                            event.includes('konser') ||
                            event.includes('festival') ||
                            event.includes('olahraga') ||
                            event.includes('wisata') ||
                            event.includes('pameran') ||
                            event.includes('big bang') ||
                            event.includes('cuti bersama') ||
                            (event.includes('natal') && !isCuacaBencana) || // Natal OK, tapi bukan jika ada cuaca
                            (event.includes('tahun baru') && !isCuacaBencana) || // Tahun baru OK, tapi bukan jika ada cuaca
                            (scenario.includes('promo') && !event.includes('kereta') && !event.includes('kai') && !event.includes('tol'))) // Promo tiket pesawat OK, tapi bukan promo kereta/tol
                          ) && p.detectedEvent && p.detectedEvent !== 'None' && p.detectedEvent !== '';
                        })
                        .map(p => p.detectedEvent)
                    ));

                    return positiveEvents.length > 0 ? (
                      <div className="bg-gradient-to-br from-emerald-50 to-green-50 p-3 rounded-lg border border-emerald-200 shadow-sm">
                        <div className="flex gap-2 items-center mb-2 pb-1.5 border-b border-emerald-200">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                          <h5 className="text-xs font-bold text-emerald-800">
                            Berita yang Mempengaruhi Peningkatan Penumpang
                          </h5>
                        </div>
                        <div className="space-y-1">
                          {positiveEvents.slice(0, 5).map((event, idx) => (
                            <div key={idx} className="flex items-start gap-2 text-xs">
                              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0"></div>
                              <span className="text-emerald-900 leading-snug">{event}</span>
                            </div>
                          ))}
                          {positiveEvents.length > 5 && (
                            <div className="text-[10px] text-emerald-700 italic pt-0.5">
                              +{positiveEvents.length - 5} berita positif lainnya
                            </div>
                          )}
                        </div>
                      </div>
                    ) : null;
                 })()}

                 {/* Negative News (Berita Penurunan) - Transportasi pesaing DAN cuaca/bencana */}
                 {(() => {
                    // SELALU gunakan batch prediction PASSENGER untuk berita (yang valid)
                    // Jangan gunakan batch prediction saat ini karena bisa berbeda
                    const newsBatch = batchPredictionResultPassenger || savedBatchResultPassenger;
                    
                    if (!newsBatch || !newsBatch.predictions) {
                      return null;
                    }
                    
                    const negativeEvents = Array.from(new Set(
                      newsBatch.predictions
                        .filter(p => {
                          const scenario = (p.appliedScenario || '').toLowerCase();
                          const event = (p.detectedEvent || '').toLowerCase();
                          
                          // EXCLUDE: Event yang terlalu generic
                          const isGenericEvent = 
                            event.includes('awal periode') ||
                            event.includes('belum puncak') ||
                            event.includes('sebelum puncak') ||
                            event.includes('akhir pekan') ||
                            event.includes('weekend') ||
                            event.includes('hari biasa') ||
                            event.includes('normal') ||
                            event.length < 20; // Event terlalu pendek biasanya generic
                          
                          if (isGenericEvent) {
                            return false;
                          }
                          
                          // Filter untuk transportasi pesaing (tol, kereta, transportasi darat)
                          const isTransportasiPesaing = (
                            // Scenario terkait transportasi pesaing
                            scenario.includes('ground transport') ||
                            scenario.includes('competition') ||
                            // Event terkait tol
                            event.includes('gratis tol') ||
                            event.includes('promo tol') ||
                            event.includes('diskon tol') ||
                            event.includes('diskon tarif tol') ||
                            event.includes('tol gratis') ||
                            event.includes('tarif tol') ||
                            event.includes('toll') ||
                            // Event terkait kereta
                            event.includes('promo kereta') ||
                            event.includes('promo tiket kereta') ||
                            event.includes('promo tiket kai') ||
                            event.includes('kereta api') ||
                            event.includes('kai') ||
                            event.includes('kereta') ||
                            // Event terkait transportasi darat
                            event.includes('transportasi darat') ||
                            event.includes('bus') ||
                            event.includes('angkutan darat')
                          );

                          // Filter untuk cuaca/bencana - PRIORITAS TINGGI: SELALU NEGATIF
                          const isCuacaBencana = (
                            // Scenario terkait cuaca/bencana
                            scenario.includes('weather disruption') ||
                            scenario.includes('disaster impact') ||
                            // Event terkait cuaca
                            event.includes('hujan') ||
                            event.includes('badai') ||
                            event.includes('cuaca') ||
                            event.includes('weather') ||
                            event.includes('angin kencang') ||
                            event.includes('kabut') ||
                            event.includes('visibility') ||
                            event.includes('visibility rendah') ||
                            // Event terkait bencana
                            event.includes('banjir') ||
                            event.includes('flood') ||
                            event.includes('gempa') ||
                            event.includes('earthquake') ||
                            event.includes('gunung meletus') ||
                            event.includes('erupsi') ||
                            event.includes('tsunami') ||
                            event.includes('longsor') ||
                            event.includes('landslide') ||
                            event.includes('bencana') ||
                            event.includes('disaster') ||
                            // BMKG dan peringatan cuaca - SELALU NEGATIF
                            event.includes('bmkg') ||
                            event.includes('potensi cuaca') ||
                            event.includes('cuaca ekstrem') ||
                            event.includes('musim hujan') ||
                            event.includes('peringatan cuaca') ||
                            event.includes('peringatan bmkg')
                          );

                          return (isTransportasiPesaing || isCuacaBencana) && p.detectedEvent && p.detectedEvent !== 'None' && p.detectedEvent !== '';
                        })
                        .map(p => p.detectedEvent)
                    ));

                    return negativeEvents.length > 0 ? (
                      <div className="bg-gradient-to-br from-red-50 to-orange-50 p-3 rounded-lg border border-red-200 shadow-sm">
                        <div className="flex gap-2 items-center mb-2 pb-1.5 border-b border-red-200">
                          <AlertCircle className="w-3.5 h-3.5 text-red-600" />
                          <h5 className="text-xs font-bold text-red-800">
                            Berita yang Mempengaruhi Penurunan Penumpang
                          </h5>
                        </div>
                        <div className="space-y-1">
                          {negativeEvents.slice(0, 5).map((event, idx) => (
                            <div key={idx} className="flex items-start gap-2 text-xs">
                              <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 flex-shrink-0"></div>
                              <span className="text-red-900 leading-snug">{event}</span>
                            </div>
                          ))}
                          {negativeEvents.length > 5 && (
                            <div className="text-[10px] text-red-700 italic pt-0.5">
                              +{negativeEvents.length - 5} berita negatif lainnya
                            </div>
                          )}
                        </div>
                      </div>
                    ) : null;
                 })()}

                 {/* Peak Dates */}
                 <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                    <div className="flex gap-2 items-center mb-1.5 pb-1.5 border-b border-slate-100">
                      <TrendingUp className="w-3.5 h-3.5 text-slate-500" />
                      <h5 className="text-xs font-bold text-slate-800">Puncak Prediksi</h5>
                    </div>
                    <div className="space-y-1">
                      {[...batchPredictionResult.predictions]
                        .sort((a, b) => b.predictedValue - a.predictedValue)
                        .slice(0, 3)
                        .map((pred, idx) => {
                          const date = pred.date ? new Date(pred.date) : null;
                          const dayName = date ? date.toLocaleDateString('id-ID', { weekday: 'long' }) : '';
                          const dateStr = date ? date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : 'N/A';
                          return (
                            <div key={idx} className="flex justify-between items-center text-xs">
                              <span className="text-slate-600">
                                {dateStr} {dayName && `(${dayName})`}
                              </span>
                              <span className="font-bold text-slate-800">
                                {pred.predictedValue.toLocaleString('id-ID')}
                              </span>
                            </div>
                          );
                        })}
                    </div>
                 </div>
              </div>

           </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 min-h-[100px]">
             <div className="p-3 bg-white rounded-full mb-2 shadow-sm">
                <TrendingUp className="w-5 h-5 text-indigo-200" />
             </div>
             <p className="text-sm font-medium">Area analisis akan muncul di sini.</p>
          </div>
        )}
      </div>

    </div>
  );
};

export default ChartSection;