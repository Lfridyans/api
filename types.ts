
export enum TrafficType {
  PASSENGER = 'PASSENGER',
  FLIGHT = 'FLIGHT',
}

// Updated to allow generic string for the expanded airport list while keeping major ones suggested
export type AirportCode = 'ALL' | 'CGK' | 'DPS' | 'KNO' | 'SUB' | 'UPG' | 'BPN' | 'YIA' | 'DJJ' | string;

export type Page = 'PREDICTOR' | 'EXECUTIVE' | 'EVENT';

export interface DailyData {
  date: string; // YYYY-MM-DD
  dayName: string; // Senin, Selasa, etc.
  passengers: number;
  flights: number;
  isPeakDeparture?: boolean;
  isPeakReturn?: boolean;
  isHoliday?: boolean; // Natal or Tahun Baru
  description?: string;
}

export interface PredictionRequest {
  date: string;
  type: TrafficType;
  airportCode: AirportCode;
  scenario?: string; // "AUTO" | "Normal" | "Cuaca..."
}

export interface BatchPredictionRequest {
  type: TrafficType;
  airportCode: AirportCode;
  scenario?: string; // "AUTO" | "Normal" | "Cuaca..."
}

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface PredictionResult {
  predictedValue: number;
  confidence: string;
  reasoning: string;
  comprehensiveAnalysis: string;
  context: DailyData | null;
  airportCode: AirportCode;
  sources?: GroundingSource[];
  appliedScenario?: string; // The scenario finally applied
  detectedEvent?: string; // New: What the agent autonomously found (e.g., "Heavy Rain Warning")
  date?: string; // Date for this prediction
}

// New: Result for batch prediction (all dates)
export interface BatchPredictionResult {
  predictions: PredictionResult[]; // One prediction per date
  airportCode: AirportCode;
  trafficType: TrafficType;
  scenario: string;
  generatedAt: string; // Timestamp
}

// --- Event Intelligence Types ---

export type ImpactLevel = 'HIGH' | 'MEDIUM' | 'LOW';

export interface OperationalMitigation {
  action: string; // e.g., "Open Overflow Parking"
  department: string; // e.g., "Security & Landside"
}

export interface EventIntelligence {
  id: string;
  title: string;
  date: string;
  location: string;
  // Added 'Disaster' category
  category: 'Concert' | 'Weather' | 'Disaster' | 'Holiday' | 'VVIP' | 'Other' | 'Logistics' | 'Micro' | 'Pandemic' | 'Economic' | 'Security' | 'Strike' | 'GroundTransport';
  impactLevel: ImpactLevel;
  description: string;
  weatherForecast: string; // e.g. "Heavy Rain, 28°C"
  affectedAirport: AirportCode;
  potentialOrigins?: AirportCode[]; // New: For map animation
  mitigationPlan: OperationalMitigation[];
  sourceUrl?: string;
  imageUrl?: string; // New: Image for Tooltip/Card
}

// --- Executive Report Types ---

export interface MetricGrowth {
  value: string;
  growth: string; // e.g. "+5%" or "-4%"
  trend: 'up' | 'down';
  recovery?: string;
}

export interface TrafficHighlight {
  period: string;
  date: string;
  hDate: string; // e.g. "H-3"
  flight: MetricGrowth;
  pax: MetricGrowth;
  cargo: MetricGrowth;
  cgk: { flight: string; pax: string; cargo: string };
  dps: { flight: string; pax: string; cargo: string };
}

export interface AccumulationData {
  flight: { total: string; growth: string; recovery: string };
  pax: { total: string; growth: string; recovery: string };
  cargo: { total: string; growth: string; recovery: string };
}

export interface TopListItem {
  name: string;
  value: string;
}

export interface OperationalData {
  otp: { dom: string; int: string; all: string };
  loadFactor: { dom: string; int: string; all: string };
  slotUtilization: { dom: string; int: string; all: string };
  routes: { dom: string; int: string; all: string };
}

export interface IrregularityDetail {
  daily: string;
  branch: string;
  flightNo: string;
  kronologis: string;
  dampak: string;
  category: string;
  type: string;
}

export interface ExecutiveData {
  lastUpdated: string;
  highlightBefore: TrafficHighlight;
  highlightAfter: TrafficHighlight;
  accumulation: AccumulationData;
  topAirports: TopListItem[];
  topDestInt: TopListItem[];
  topDestDom: TopListItem[];
  operational: OperationalData;
  extraFlight: { plan: string; realization: string; percentage: string };
  opsCondition: { yesterdayRealization: { flight: string; pax: string }; todayPlan: { flight: string; pax: string } };
  irregularities: { 
    total: number; 
    topCause: string;
    details: IrregularityDetail[];
  };
}