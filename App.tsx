
import React, { useState, useMemo, useRef, useEffect } from 'react';
import Layout from './components/Layout';
import DashboardHeader from './components/DashboardHeader';
import ChartSection from './components/ChartSection';
import ExecutiveReport from './components/ExecutiveReport';
import EventDashboard from './components/EventDashboard'; // New Component
import LoadJSONFile from './components/LoadJSONFile'; // Load JSON File Component
import { TrafficType, AirportCode, Page, EventIntelligence, BatchPredictionResult } from './types'; 
import { getBatchPrediction, getExecutiveAnalysis, generateExecutiveAudio, generateEventSummary, validatePassengerFlightCorrelation } from './services/geminiService';
import { getAirportData, getAirportStats } from './data/nataruData';
import { EXECUTIVE_DATA } from './data/executiveData';
import { getBatchPredictions, initDatabase, saveCombinedBatchPredictions, type StoredBatchPrediction } from './services/databaseService';
import { Loader2, Search, Plane, Users, Building2, ChevronDown, LayoutDashboard, LineChart, Sparkles, RefreshCw, FileText, Volume2, StopCircle, Zap, Bot, Menu, CalendarRange } from 'lucide-react';

// --- Audio Helper Functions (From Google GenAI Guidelines) ---
function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

const App: React.FC = () => {
  const [activePage, setActivePage] = useState<Page>('PREDICTOR'); // Navigation State
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); // Mobile Menu Toggle

  const [trafficType, setTrafficType] = useState<TrafficType>(TrafficType.PASSENGER);
  const [selectedAirport, setSelectedAirport] = useState<AirportCode>('ALL');
  const [selectedScenario, setSelectedScenario] = useState<string>('AUTO'); // DEFAULT TO AUTO AGENT
  const [loading, setLoading] = useState<boolean>(false);
  const [batchResult, setBatchResult] = useState<BatchPredictionResult | null>(null);
  const [savedBatchResult, setSavedBatchResult] = useState<BatchPredictionResult | null>(null); // Data sebelumnya dari database
  const [batchResultFlight, setBatchResultFlight] = useState<BatchPredictionResult | null>(null); // Batch result untuk FLIGHT
  const [savedBatchResultFlight, setSavedBatchResultFlight] = useState<BatchPredictionResult | null>(null); // Saved batch result untuk FLIGHT

  // Executive State
  const [execReport, setExecReport] = useState<string | null>(null);
  const [execLoading, setExecLoading] = useState<boolean>(false);

  // Event Intelligence State (Shared for Sidebar)
  const [eventAnalysis, setEventAnalysis] = useState<string | null>(null);
  const [isEventAnalysisLoading, setIsEventAnalysisLoading] = useState<boolean>(false);

  // Audio State
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isAudioLoading, setIsAudioLoading] = useState<boolean>(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);


  const currentData = useMemo(() => getAirportData(selectedAirport), [selectedAirport]);
  const currentStats = useMemo(() => getAirportStats(selectedAirport), [selectedAirport]);

  // Load saved predictions on page load (setelah auto-load selesai)
  useEffect(() => {
    const loadSavedPredictions = async () => {
      // Tunggu sebentar untuk memastikan auto-load dari LoadJSONFile selesai
      await new Promise(resolve => setTimeout(resolve, 500));
      
      try {
        await initDatabase();
        
        // Load untuk PASSENGER
        const savedBatchesPax = await getBatchPredictions({
          airportCode: selectedAirport,
          trafficType: TrafficType.PASSENGER,
        });
        
        if (savedBatchesPax.length > 0) {
          const latestBatch = savedBatchesPax[0];
          const batchResult: BatchPredictionResult = {
            predictions: latestBatch.predictions.map(pred => ({
              predictedValue: pred.predictedValue,
              confidence: pred.confidence,
              reasoning: pred.reasoning,
              comprehensiveAnalysis: pred.comprehensiveAnalysis,
              context: pred.context,
              airportCode: pred.airportCode,
              sources: pred.sources,
              appliedScenario: pred.appliedScenario,
              detectedEvent: pred.detectedEvent,
              date: pred.date,
            })),
            airportCode: latestBatch.airportCode,
            trafficType: latestBatch.trafficType,
            scenario: latestBatch.scenario,
            generatedAt: latestBatch.generatedAt,
          };
          
          setSavedBatchResult(batchResult);
          console.log(`✅ Loaded saved PASSENGER predictions: ${batchResult.predictions.length} predictions`);
        } else {
          console.warn('⚠️ No PASSENGER batches found matching filters');
        }
        
        // Load untuk FLIGHT juga
        const savedBatchesFlight = await getBatchPredictions({
          airportCode: selectedAirport,
          trafficType: TrafficType.FLIGHT,
        });
        
        if (savedBatchesFlight.length > 0) {
          const latestBatch = savedBatchesFlight[0];
          const batchResult: BatchPredictionResult = {
            predictions: latestBatch.predictions.map(pred => ({
              predictedValue: pred.predictedValue,
              confidence: pred.confidence,
              reasoning: pred.reasoning,
              comprehensiveAnalysis: pred.comprehensiveAnalysis,
              context: pred.context,
              airportCode: pred.airportCode,
              sources: pred.sources,
              appliedScenario: pred.appliedScenario,
              detectedEvent: pred.detectedEvent,
              date: pred.date,
            })),
            airportCode: latestBatch.airportCode,
            trafficType: latestBatch.trafficType,
            scenario: latestBatch.scenario,
            generatedAt: latestBatch.generatedAt,
          };

          setSavedBatchResultFlight(batchResult);
          console.log(`✅ Loaded saved FLIGHT predictions: ${batchResult.predictions.length} predictions`);
        } else {
          console.warn('⚠️ No FLIGHT batches found matching filters');
        }
      } catch (error) {
        console.warn('⚠️ Failed to load saved predictions:', error);
      }
    };

    loadSavedPredictions();
  }, [selectedAirport, trafficType]); // Reload ketika filter berubah

  // Reload saved predictions ketika filter berubah
  useEffect(() => {
    const reloadSavedPredictions = async () => {
      try {
        await initDatabase();
        const savedBatches = await getBatchPredictions({
          airportCode: selectedAirport,
          trafficType: trafficType,
        });

        if (savedBatches.length > 0) {
          const latestBatch = savedBatches[0];
          const batchResult: BatchPredictionResult = {
            predictions: latestBatch.predictions.map(pred => ({
              predictedValue: pred.predictedValue,
              confidence: pred.confidence,
              reasoning: pred.reasoning,
              comprehensiveAnalysis: pred.comprehensiveAnalysis,
              context: pred.context,
              airportCode: pred.airportCode,
              sources: pred.sources,
              appliedScenario: pred.appliedScenario,
              detectedEvent: pred.detectedEvent,
              date: pred.date,
            })),
            airportCode: latestBatch.airportCode,
            trafficType: latestBatch.trafficType,
            scenario: latestBatch.scenario,
            generatedAt: latestBatch.generatedAt,
          };
          
          setSavedBatchResult(batchResult);
        } else {
          setSavedBatchResult(null);
        }
        
        // Reload untuk FLIGHT juga
        const savedBatchesFlight = await getBatchPredictions({
          airportCode: selectedAirport,
          trafficType: TrafficType.FLIGHT,
        });
        
        if (savedBatchesFlight.length > 0) {
          const latestBatch = savedBatchesFlight[0];
          const batchResult: BatchPredictionResult = {
            predictions: latestBatch.predictions.map(pred => ({
              predictedValue: pred.predictedValue,
              confidence: pred.confidence,
              reasoning: pred.reasoning,
              comprehensiveAnalysis: pred.comprehensiveAnalysis,
              context: pred.context,
              airportCode: pred.airportCode,
              sources: pred.sources,
              appliedScenario: pred.appliedScenario,
              detectedEvent: pred.detectedEvent,
              date: pred.date,
            })),
            airportCode: latestBatch.airportCode,
            trafficType: latestBatch.trafficType,
            scenario: latestBatch.scenario,
            generatedAt: latestBatch.generatedAt,
          };
          
          setSavedBatchResultFlight(batchResult);
        } else {
          setSavedBatchResultFlight(null);
        }
      } catch (error) {
        console.warn('⚠️ Failed to reload saved predictions:', error);
      }
    };

    reloadSavedPredictions();
  }, [selectedAirport, trafficType]);

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
        if (sourceNodeRef.current) {
            sourceNodeRef.current.stop();
        }
        if (audioContextRef.current) {
            audioContextRef.current.close();
        }
    };
  }, []);

  const handleTypeChange = (newType: TrafficType) => {
    setTrafficType(newType);
    // Jangan clear batchResult karena sudah ada data untuk kedua traffic type
  };

  const handleAirportChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedAirport(e.target.value as AirportCode);
    setBatchResult(null); 
  };

  const handleScenarioChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedScenario(e.target.value);
    // Don't clear result immediately to allow comparison
  };

  const handlePredict = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // On mobile, close menu after predicting to show results
    setIsMobileMenuOpen(false);
    
    try {
      // Generate prediksi untuk BOTH penumpang dan pesawat sekaligus
      console.log('🚀 Starting batch prediction for both PASSENGER and FLIGHT...');
      
      const [passengerData, flightData] = await Promise.all([
        getBatchPrediction({
          type: TrafficType.PASSENGER,
          airportCode: selectedAirport,
          scenario: selectedScenario
        }),
        getBatchPrediction({
          type: TrafficType.FLIGHT,
          airportCode: selectedAirport,
          scenario: selectedScenario
        })
      ]);
      
      console.log('✅ Generated predictions for both PASSENGER and FLIGHT');
      
      // Validasi korelasi antara penumpang dan pesawat menggunakan AI Agent
      console.log('🔍 Validating correlation between passenger and flight predictions...');
      const baselineData = getAirportData(selectedAirport);
      const { passengerBatch: validatedPassengerData, flightBatch: validatedFlightData } = 
        await validatePassengerFlightCorrelation(passengerData, flightData, baselineData);
      
      // Set hasil yang sudah divalidasi untuk kedua traffic type
      setBatchResult(validatedPassengerData);
      setBatchResultFlight(validatedFlightData);
      
      console.log('✅ Correlation validation completed');
      
      // Simpan kedua batch yang sudah divalidasi dalam satu file JSON
      try {
        await saveCombinedBatchPredictions(validatedPassengerData, validatedFlightData);
        console.log('✅ Combined predictions (with correlation validation) saved to single JSON file');
      } catch (saveError) {
        console.warn('⚠️ Failed to save combined predictions:', saveError);
      }
      
      // Reload saved predictions setelah predict baru (untuk update savedBatchResult)
      try {
        await initDatabase();
        
        // Reload untuk PASSENGER
        const savedBatchesPax = await getBatchPredictions({
          airportCode: selectedAirport,
          trafficType: TrafficType.PASSENGER,
        });
        
        if (savedBatchesPax.length > 0) {
          const latestBatch = savedBatchesPax[0];
          const batchResult: BatchPredictionResult = {
            predictions: latestBatch.predictions.map(pred => ({
              predictedValue: pred.predictedValue,
              confidence: pred.confidence,
              reasoning: pred.reasoning,
              comprehensiveAnalysis: pred.comprehensiveAnalysis,
              context: pred.context,
              airportCode: pred.airportCode,
              sources: pred.sources,
              appliedScenario: pred.appliedScenario,
              detectedEvent: pred.detectedEvent,
              date: pred.date,
            })),
            airportCode: latestBatch.airportCode,
            trafficType: latestBatch.trafficType,
            scenario: latestBatch.scenario,
            generatedAt: latestBatch.generatedAt,
          };
          
          setSavedBatchResult(batchResult);
          console.log(`✅ Loaded saved PASSENGER predictions: ${batchResult.predictions.length} predictions`);
        } else {
          console.warn('⚠️ No PASSENGER batches found matching filters');
        }
        
        // Reload untuk FLIGHT
        const savedBatchesFlight = await getBatchPredictions({
          airportCode: selectedAirport,
          trafficType: TrafficType.FLIGHT,
        });
        
        if (savedBatchesFlight.length > 0) {
          const latestBatch = savedBatchesFlight[0];
          const batchResult: BatchPredictionResult = {
            predictions: latestBatch.predictions.map(pred => ({
              predictedValue: pred.predictedValue,
              confidence: pred.confidence,
              reasoning: pred.reasoning,
              comprehensiveAnalysis: pred.comprehensiveAnalysis,
              context: pred.context,
              airportCode: pred.airportCode,
              sources: pred.sources,
              appliedScenario: pred.appliedScenario,
              detectedEvent: pred.detectedEvent,
              date: pred.date,
            })),
            airportCode: latestBatch.airportCode,
            trafficType: latestBatch.trafficType,
            scenario: latestBatch.scenario,
            generatedAt: latestBatch.generatedAt,
          };
          
          setSavedBatchResultFlight(batchResult);
        }
      } catch (error) {
        console.warn('⚠️ Failed to reload saved predictions:', error);
      }
    } catch (err) {
      console.error(err);
      alert("Gagal mendapatkan prediksi batch.");
    } finally {
      setLoading(false);
    }
  };

  const handleEventsLoaded = async (events: EventIntelligence[]) => {
      if (events.length === 0) {
          return;
      }
      
      setIsEventAnalysisLoading(true);
      try {
          const summary = await generateEventSummary(events);
          setEventAnalysis(summary);
      } catch (e) {
          console.error("Failed to generate sidebar summary", e);
      } finally {
          setIsEventAnalysisLoading(false);
      }
  };

  // Helper to init/resume audio context
  const getAudioContext = async () => {
    if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }
    return audioContextRef.current;
  };

  const playAudio = async (textToSpeak: string) => {
    try {
        const ctx = await getAudioContext();
        
        setIsAudioLoading(true);
        const base64Audio = await generateExecutiveAudio(textToSpeak);
        if (!base64Audio) throw new Error("No audio returned");

        const audioBytes = decode(base64Audio);
        const audioBuffer = await decodeAudioData(audioBytes, ctx, 24000, 1);

        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(ctx.destination);
        
        source.onended = () => setIsPlaying(false);
        source.start();
        
        sourceNodeRef.current = source;
        setIsPlaying(true);
    } catch (e) {
        console.error("Audio Playback Error:", e);
        alert("Gagal memutar audio.");
        setIsAudioLoading(false);
    }
  };

  const handleGenExecReport = async () => {
    // 1. Capture user interaction immediately to unlock AudioContext
    try {
        await getAudioContext();
    } catch (e) {
        console.warn('AudioContext initialization failed:', e);
    }

    setExecLoading(true);
    handleStopAudio();
    
    try {
        const text = await getExecutiveAnalysis(EXECUTIVE_DATA);
        setExecReport(text);
        
        // 2. Automatically play audio after generation
        if (text) {
            await playAudio(text);
        }
    } catch (e) {
        console.error(e);
        alert("Gagal generate report");
    } finally {
        setExecLoading(false);
    }
  };

  const handlePlayAudioClick = async () => {
    if (execReport) {
        await playAudio(execReport);
    }
  };

  const handleStopAudio = () => {
    if (sourceNodeRef.current) {
        sourceNodeRef.current.stop();
        setIsPlaying(false);
    }
  };

  const getPageTitle = () => {
      switch(activePage) {
          case 'PREDICTOR': return 'Traffic Prediction';
          case 'EXECUTIVE': return 'Executive Dashboard';
          case 'EVENT': return 'Event Intelligence';
          default: return '';
      }
  };

  return (
    <Layout>
        {/* MOBILE TOGGLE BAR */}
        <div className="md:hidden bg-white border-b border-slate-200 p-4 flex justify-between items-center z-30 sticky top-0 shadow-sm h-16">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                {getPageTitle()}
            </span>
            <button 
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className={`p-2 rounded text-slate-700 hover:bg-slate-200 transition-colors ${isMobileMenuOpen ? 'bg-slate-200' : 'bg-slate-100'}`}
            >
                <Menu className="w-5 h-5" />
            </button>
        </div>

        {/* SIDEBAR (Navigation & Control Panel) */}
        {/* 
           FIX FOR MOBILE SCROLLING:
           1. Use fixed positioning with explicit top/bottom to handle viewport height correctly.
           2. h-[calc(100dvh-4rem)] ensures it fits perfectly between header and screen bottom.
           3. z-40 ensures it sits above other content.
        */}
        <aside className={`
            bg-white border-r border-slate-200 flex flex-col z-40 shadow-2xl md:shadow-[4px_0_24px_rgba(0,0,0,0.02)]
            fixed md:static w-full md:w-80 
            top-16 bottom-0 md:top-auto md:bottom-auto md:h-full
            supports-[height:100dvh]:h-[calc(100dvh-4rem)] h-[calc(100vh-4rem)] md:h-auto
            transition-transform duration-300 ease-in-out
            ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}>
            
            {/* Main Navigation Menu (PRIORITIZED) */}
            <div className="p-4 border-b border-slate-100 flex-none bg-white z-10">
               <nav className="space-y-1">
                  <button 
                    onClick={() => { setActivePage('PREDICTOR'); setIsMobileMenuOpen(false); }}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-bold transition-all ${
                        activePage === 'PREDICTOR' 
                        ? 'bg-indigo-50 text-indigo-700' 
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                     <LineChart className="w-4 h-4" />
                     Analisis Prediksi
                  </button>
                  <button 
                    onClick={() => { setActivePage('EXECUTIVE'); setIsMobileMenuOpen(false); }}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-bold transition-all ${
                        activePage === 'EXECUTIVE' 
                        ? 'bg-indigo-50 text-indigo-700' 
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                     <LayoutDashboard className="w-4 h-4" />
                     Executive Report
                  </button>
                  <button 
                    onClick={() => { setActivePage('EVENT'); setIsMobileMenuOpen(false); }}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-bold transition-all ${
                        activePage === 'EVENT' 
                        ? 'bg-indigo-50 text-indigo-700' 
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                     <CalendarRange className="w-4 h-4" />
                     Event Intelligence
                  </button>
               </nav>
            </div>

            {/* NEW: SIDEBAR NEWS ANALYSIS (Only on Event Page) */}
            {activePage === 'EVENT' && (
                <div className="flex-1 flex flex-col min-h-0 overflow-y-auto scroll-smooth">
                    <SidebarNewsAnalysis 
                        analysis={eventAnalysis} 
                        isLoading={isEventAnalysisLoading} 
                    />
                </div>
            )}

            {/* Render Controls ONLY if on Predictor Page */}
            {activePage === 'PREDICTOR' && (
                <div className="flex-1 flex flex-col min-h-0 overflow-y-auto scroll-smooth">
                    {/* Visual Separator for Mobile */}
                    <div className="h-2 bg-slate-50 border-b border-slate-100 flex-none md:hidden"></div>
                    
                    <div className="p-6 pb-40 md:pb-6"> {/* Increased bottom padding for mobile scroll safety */}
                        <LoadJSONFile onLoadComplete={async () => {
                            // Reload saved predictions setelah import
                            try {
                                const savedBatches = await getBatchPredictions({
                                    airportCode: selectedAirport,
                                    trafficType: trafficType,
                                });
                                
                                console.log(`✅ Found ${savedBatches.length} batches after import`);
                                
                                if (savedBatches.length > 0) {
                                    const latestBatch = savedBatches[0];
                                    const batchResult: BatchPredictionResult = {
                                        predictions: latestBatch.predictions.map(pred => ({
                                            predictedValue: pred.predictedValue,
                                            confidence: pred.confidence,
                                            reasoning: pred.reasoning,
                                            comprehensiveAnalysis: pred.comprehensiveAnalysis,
                                            context: pred.context,
                                            airportCode: pred.airportCode,
                                            sources: pred.sources,
                                            appliedScenario: pred.appliedScenario,
                                            detectedEvent: pred.detectedEvent,
                                            date: pred.date,
                                        })),
                                        airportCode: latestBatch.airportCode,
                                        trafficType: latestBatch.trafficType,
                                        scenario: latestBatch.scenario,
                                        generatedAt: latestBatch.generatedAt,
                                    };
                                    setSavedBatchResult(batchResult);
                                    console.log(`✅ Set savedBatchResult with ${batchResult.predictions.length} predictions`);
                                } else {
                                    console.warn('⚠️ No batches found after import');
                                }
                            } catch (error) {
                                console.error('Failed to reload saved predictions:', error);
                            }
                        }} />
                        <h2 className="font-bold text-xs text-slate-400 uppercase tracking-wider mb-5 flex items-center gap-2 mt-4">
                        <Search className="w-3 h-3" />
                        Parameter Prediksi
                        </h2>
                        
                        <form onSubmit={handlePredict} className="space-y-5">
                        {/* Airport */}
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Pilih Bandara</label>
                            <div className="relative">
                            <select
                                value={selectedAirport}
                                onChange={handleAirportChange}
                                className="w-full appearance-none bg-slate-50 border border-slate-200 text-slate-700 py-3 px-3 pr-8 rounded-lg text-sm leading-tight focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium"
                            >
                                <option value="ALL">Seluruh Bandara</option>
                                <option value="CGK">Soekarno-Hatta (CGK)</option>
                                <option value="DPS">I Gusti Ngurah Rai (DPS)</option>
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                                <Building2 className="w-3.5 h-3.5 mr-1" />
                                <ChevronDown className="w-3.5 h-3.5" />
                            </div>
                            </div>
                        </div>
                        
                        {/* Traffic Type */}
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Tipe Trafik</label>
                            <div className="grid grid-cols-2 gap-2">
                            <button
                                type="button"
                                onClick={() => handleTypeChange(TrafficType.PASSENGER)}
                                className={`flex flex-col items-center justify-center p-3 rounded-lg border transition-all ${
                                trafficType === TrafficType.PASSENGER 
                                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm' 
                                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-500'
                                }`}
                            >
                                <Users className="w-5 h-5 mb-1" />
                                <span className="font-medium text-xs">Penumpang</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => handleTypeChange(TrafficType.FLIGHT)}
                                className={`flex flex-col items-center justify-center p-3 rounded-lg border transition-all ${
                                trafficType === TrafficType.FLIGHT 
                                    ? 'border-orange-500 bg-orange-50 text-orange-700 shadow-sm' 
                                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-500'
                                }`}
                            >
                                <Plane className="w-5 h-5 mb-1" />
                                <span className="font-medium text-xs">Pesawat</span>
                            </button>
                            </div>
                        </div>

                        {/* Info: Batch Prediction */}
                        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3">
                            <div className="flex items-start gap-2">
                                <Sparkles className="w-4 h-4 text-indigo-600 mt-0.5 flex-none" />
                                <div>
                                    <div className="text-xs font-bold text-indigo-800 mb-1">Prediksi Semua Tanggal</div>
                                    <div className="text-[10px] text-indigo-700 leading-tight">
                                        Sistem akan memprediksi semua tanggal periode Nataru (18 Des 2025 - 4 Jan 2026) sekaligus dalam sekali prediksi.
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* AGENTIC FEATURE: SCENARIO SIMULATION */}
                        <div className="pt-2 border-t border-dashed border-slate-200">
                            <label className="flex items-center gap-1 text-xs font-bold text-indigo-600 uppercase tracking-wider mb-2">
                                <Bot className="w-3 h-3" />
                                Mode Agen (Otonom)
                            </label>
                            <div className="relative">
                                <select
                                    value={selectedScenario}
                                    onChange={handleScenarioChange}
                                    className={`w-full appearance-none border text-sm py-3 px-3 pr-8 rounded-lg leading-tight focus:outline-none transition-all font-medium ${
                                        selectedScenario === 'AUTO' 
                                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800 focus:ring-emerald-500' 
                                        : 'bg-indigo-50 border-indigo-200 text-indigo-800 focus:ring-indigo-500'
                                    }`}
                                >
                                    <option value="AUTO">✨ Deteksi Otomatis (Agen)</option>
                                    <option value="Normal">Manual: Normal (Dasar)</option>
                                    <option value="Cuaca Ekstrim / Bencana">Manual: Cuaca Ekstrim</option>
                                    <option value="Lonjakan Tiba-tiba / Event Besar">Manual: Lonjakan Event</option>
                                    <option value="Promo Tiket Murah">Manual: Promo Tiket</option>
                                </select>
                                <div className={`pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 ${selectedScenario === 'AUTO' ? 'text-emerald-500' : 'text-indigo-500'}`}>
                                    <ChevronDown className="w-3.5 h-3.5" />
                                </div>
                            </div>
                            <p className="text-[10px] text-slate-400 mt-1.5 leading-tight">
                                {selectedScenario === 'AUTO' 
                                    ? "Agent akan mencari berita/cuaca secara otonom dan menentukan skenario terbaik." 
                                    : "Agent akan dipaksa mengikuti skenario manual yang Anda pilih."}
                            </p>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full flex justify-center py-3.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all mt-6 ${
                                selectedScenario === 'AUTO' 
                                    ? 'bg-emerald-600 hover:bg-emerald-700' 
                                    : (selectedScenario !== 'Normal' ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-slate-800 hover:bg-slate-900')
                            }`}
                        >
                            {loading ? (
                            <>
                                <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                                {selectedScenario === 'AUTO' ? 'Agent Scanning Semua Tanggal...' : 'Memproses Semua Tanggal...'}
                            </>
                            ) : (
                                selectedScenario === 'AUTO' ? 'Prediksi Semua Tanggal' : (selectedScenario !== 'Normal' ? 'Simulasikan Semua Tanggal' : 'Prediksi Semua Tanggal')
                            )}
                        </button>
                        </form>
                    </div>

                    <div className="mt-auto p-6 bg-slate-50 border-t border-slate-200 hidden md:block space-y-4">
                        <div>
                            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Informasi Penting</h4>
                        <ul className="space-y-2 text-xs text-slate-600 font-medium">
                            <li className="flex gap-2 items-center">
                                <span className="w-2 h-2 rounded-full bg-red-500"></span>
                                Puncak Dep: {currentStats.peakDeparture}
                            </li>
                            <li className="flex gap-2 items-center">
                                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                                Puncak Arr: {currentStats.peakReturn}
                            </li>
                            <li className="flex gap-2 items-center">
                                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                Target Growth: +{currentStats.passengerGrowth}
                            </li>
                        </ul>
                        </div>
                    </div>
                </div>
            )}

            {/* Render AI Analysis ONLY if on Executive Page */}
            {activePage === 'EXECUTIVE' && (
                <div className="flex-1 flex flex-col min-h-0 bg-slate-50/50 pb-20 md:pb-0">
                    <div className="p-4 border-b border-slate-200 bg-white">
                        <h4 className="font-bold text-slate-700 text-xs flex items-center gap-2 mb-1">
                            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                            AI Analyst Summary
                        </h4>
                        <p className="text-[10px] text-slate-500">
                           Analisis naratif otomatis (Mode: Executive HTML)
                        </p>
                    </div>
                    
                    <div className="flex-1 p-4 overflow-y-auto custom-scrollbar">
                         {!execReport ? (
                            <div className="h-full flex flex-col items-center justify-center text-center opacity-60 min-h-[200px]">
                                <FileText className="w-10 h-10 text-slate-300 mb-2" />
                                <p className="text-xs text-slate-500 mb-4 max-w-[200px]">
                                    Belum ada laporan. Klik tombol di bawah untuk generate.
                                </p>
                                <button 
                                    onClick={handleGenExecReport}
                                    disabled={execLoading}
                                    className="bg-indigo-600 text-white text-xs font-bold px-4 py-2 rounded-lg shadow-sm flex items-center gap-2 hover:bg-indigo-700 transition-colors disabled:opacity-50"
                                >
                                    {execLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                                    Generate Report
                                </button>
                            </div>
                        ) : (
                             <div className="space-y-4">
                                <div 
                                    className="bg-white border border-slate-200 rounded-lg p-3 shadow-sm text-xs leading-relaxed text-slate-700 font-medium [&>h3]:font-bold [&>h3]:text-sm [&>h3]:text-indigo-800 [&>h3]:mb-1 [&>h3]:mt-3 [&>h3:first-child]:mt-0 [&>p]:mb-2 [&>ul]:mb-2 [&>li]:mb-1 [&>ul]:list-disc [&>ul]:pl-4"
                                    dangerouslySetInnerHTML={{ __html: execReport }}
                                >
                                </div>
                                <div className="flex justify-center gap-2">
                                     <button 
                                        onClick={handleGenExecReport}
                                        disabled={execLoading || isAudioLoading}
                                        className="text-slate-500 text-xs font-bold hover:text-indigo-600 border border-slate-200 bg-white px-3 py-1.5 rounded-md shadow-sm flex items-center gap-1 transition-all"
                                    >
                                        <RefreshCw className="w-3 h-3" /> Regenerate
                                    </button>

                                    {isPlaying ? (
                                        <button 
                                            onClick={handleStopAudio}
                                            className="text-white text-xs font-bold bg-red-500 hover:bg-red-600 px-3 py-1.5 rounded-md shadow-sm flex items-center gap-1 transition-all"
                                        >
                                            <StopCircle className="w-3 h-3" /> Stop
                                        </button>
                                    ) : (
                                        <button 
                                            onClick={handlePlayAudioClick}
                                            disabled={isAudioLoading}
                                            className="text-white text-xs font-bold bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 rounded-md shadow-sm flex items-center gap-1 transition-all disabled:opacity-50"
                                        >
                                            {isAudioLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Volume2 className="w-3 h-3" />}
                                            Replay Audio
                                        </button>
                                    )}
                                </div>
                                {isAudioLoading && (
                                     <div className="text-center text-[10px] text-indigo-600 font-medium animate-pulse">
                                        Generating Audio...
                                     </div>
                                )}
                             </div>
                        )}
                    </div>
                </div>
            )}
        </aside>

        {/* MAIN CONTENT */}
        {/* CRITICAL FIX: overflow-y-auto enables scrolling on ALL devices (Desktop & Mobile) */}
        {/* We removed md:overflow-hidden which was trapping content on desktop */}
        <div className="flex-1 flex flex-col min-w-0 bg-slate-50 overflow-y-auto relative w-full">
           
           {/* CONDITIONAL RENDERING BASED ON ACTIVE PAGE */}
           
           {activePage === 'PREDICTOR' && (
             <div className="flex flex-col h-auto min-h-full pb-32"> {/* pb-32 ensures bottom content is never cut off */}
                {/* Predictor View */}
                <DashboardHeader 
                  stats={currentStats}
                  batchPredictionResult={
                    trafficType === TrafficType.PASSENGER 
                      ? (batchResult || savedBatchResult)
                      : (batchResultFlight || savedBatchResultFlight)
                  }
                  referenceData={currentData}
                  trafficType={trafficType}
                  batchPredictionResultPassenger={batchResult || savedBatchResult}
                  savedBatchResultPassenger={savedBatchResult}
                  batchPredictionResultFlight={batchResultFlight || savedBatchResultFlight}
                  savedBatchResultFlight={savedBatchResultFlight}
                />
                <div className="p-4">
                    {/* CRITICAL FIX: h-auto allows the card to grow as much as needed for analysis text */}
                    {/* Removed fixed height constraints */}
                    <div className="flex flex-col rounded-xl border border-slate-200 overflow-hidden shadow-sm bg-white h-auto">
                        <ChartSection 
                            trafficType={trafficType}
                            batchPredictionResult={
                              trafficType === TrafficType.PASSENGER 
                                ? (batchResult || savedBatchResult)
                                : (batchResultFlight || savedBatchResultFlight)
                            }
                            referenceData={currentData}
                            savedBatchResult={
                              trafficType === TrafficType.PASSENGER 
                                ? savedBatchResult
                                : savedBatchResultFlight
                            }
                            isNewPrediction={
                              trafficType === TrafficType.PASSENGER 
                                ? (batchResult !== null)
                                : (batchResultFlight !== null)
                            }
                            batchPredictionResultPassenger={batchResult || savedBatchResult}
                            savedBatchResultPassenger={savedBatchResult}
                            batchPredictionResultFlight={batchResultFlight || savedBatchResultFlight}
                            savedBatchResultFlight={savedBatchResultFlight}
                        />
                    </div>
                </div>
             </div>
           )}

           {activePage === 'EXECUTIVE' && (
             <ExecutiveReport />
           )}

           {activePage === 'EVENT' && (
             <EventDashboard onEventsLoaded={handleEventsLoaded} />
           )}

        </div>
    </Layout>
  );
};

export default App;
