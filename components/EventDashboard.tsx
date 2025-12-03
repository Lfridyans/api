
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { EventIntelligence, ImpactLevel, AirportCode } from '../types';
import { scanEventIntelligence } from '../services/geminiService';
import DatePicker from './DatePicker';
import { 
    Calendar, MapPin, AlertTriangle, CloudRain, ShieldAlert, 
    Music, Flag, Plane, Info, ExternalLink, Loader2, Radar, 
    Target, BarChart3, PieChart, TrendingUp, Zap, Truck, Users, Radio,
    RefreshCw, Plus, Minus, Maximize, ImageOff, SearchX, Activity, LayoutList, Flame, ArrowRight, Filter, ChevronDown
} from 'lucide-react';
import { 
    PieChart as RechartsPie, Pie, Cell, ResponsiveContainer, 
    BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid 
} from 'recharts';

// --- HOOKS FOR PERFORMANCE ---

function useInView(options = { threshold: 0.1 }) {
    const [isInView, setIsInView] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
  
    useEffect(() => {
      const observer = new IntersectionObserver(([entry]) => {
        setIsInView(entry.isIntersecting);
      }, options);
  
      if (ref.current) {
        observer.observe(ref.current);
      }
  
      return () => {
        if (ref.current) {
          observer.unobserve(ref.current);
        }
      };
    }, [ref, options]);
  
    return [ref, isInView] as const;
}

// --- COMPONENTS ---

const ImpactBadge = ({ level }: { level: ImpactLevel }) => {
    const styles = {
        HIGH: "bg-red-50 text-red-600 border-red-200 ring-1 ring-red-100",
        MEDIUM: "bg-amber-50 text-amber-600 border-amber-200 ring-1 ring-amber-100",
        LOW: "bg-emerald-50 text-emerald-600 border-emerald-200 ring-1 ring-emerald-100"
    };

    const icons = {
        HIGH: <AlertTriangle className="w-3 h-3" />,
        MEDIUM: <Zap className="w-3 h-3" />,
        LOW: <ShieldAlert className="w-3 h-3" />
    };

    return (
        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border flex items-center gap-1.5 shadow-sm ${styles[level]}`}>
            {icons[level]}
            {level} IMPACT
        </span>
    );
};

const CategoryIcon = ({ category }: { category: string }) => {
    const getIcon = () => {
        switch (category) {
            case 'Concert': return { icon: <Music className="w-4 h-4" />, color: "bg-purple-100 text-purple-600" };
            case 'Weather': return { icon: <CloudRain className="w-4 h-4" />, color: "bg-blue-100 text-blue-600" };
            case 'Disaster': return { icon: <Flame className="w-4 h-4" />, color: "bg-orange-100 text-orange-600" };
            case 'Holiday': return { icon: <Calendar className="w-4 h-4" />, color: "bg-pink-100 text-pink-600" };
            case 'VVIP': return { icon: <Flag className="w-4 h-4" />, color: "bg-red-100 text-red-600" };
            case 'Logistics': return { icon: <Truck className="w-4 h-4" />, color: "bg-orange-100 text-orange-600" };
            case 'Micro': return { icon: <Users className="w-4 h-4" />, color: "bg-teal-100 text-teal-600" };
            default: return { icon: <Info className="w-4 h-4" />, color: "bg-slate-100 text-slate-600" };
        }
    };

    const style = getIcon();

    return (
        <div className={`p-2 rounded-lg ${style.color} shadow-sm border border-white/50`}>
            {style.icon}
        </div>
    );
};

// --- SAFE IMAGE COMPONENT (Handles Broken/Empty Images) ---
interface SafeImageProps {
    src?: string;
    alt: string;
    className?: string;
    category: string;
}

const SafeImage: React.FC<SafeImageProps> = ({ src, alt, className, category }) => {
    const [hasError, setHasError] = useState(false);
    
    // If no source or error detected, show Fallback Pattern
    if (!src || hasError) {
        let bgClass = "bg-slate-100";
        let icon = <ImageOff className="w-6 h-6 text-slate-300" />;
        
        // Contextual Fallback Colors
        switch(category) {
            case 'Concert': bgClass = "bg-purple-50"; icon = <Music className="w-8 h-8 text-purple-200" />; break;
            case 'Weather': bgClass = "bg-blue-50"; icon = <CloudRain className="w-8 h-8 text-blue-200" />; break;
            case 'Disaster': bgClass = "bg-orange-50"; icon = <Flame className="w-8 h-8 text-orange-200" />; break;
            case 'Holiday': bgClass = "bg-pink-50"; icon = <Calendar className="w-8 h-8 text-pink-200" />; break;
            case 'VVIP': bgClass = "bg-red-50"; icon = <Flag className="w-8 h-8 text-red-200" />; break;
        }

        return (
            <div className={`w-full h-full flex flex-col items-center justify-center ${bgClass} ${className}`}>
                {icon}
                <span className="text-[9px] text-slate-400 font-medium mt-1 uppercase tracking-wider">No Image</span>
            </div>
        );
    }

    return (
        <img 
            src={src} 
            alt={alt} 
            className={className}
            onError={() => setHasError(true)}
        />
    );
};

// --- SKELETON LOADER (For Scanning State) ---
const SkeletonEventCard = () => (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 flex flex-col gap-3 animate-pulse">
        {/* Header */}
        <div className="flex gap-3 items-center">
            <div className="w-10 h-10 bg-slate-200 rounded-lg"></div>
            <div className="flex-1">
                <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
                <div className="h-2 bg-slate-200 rounded w-1/2"></div>
            </div>
        </div>
        {/* Body */}
        <div className="h-16 bg-slate-200 rounded w-full"></div>
        {/* Footer */}
        <div className="mt-auto pt-3 border-t border-slate-100 flex gap-2">
            <div className="h-3 bg-slate-200 rounded w-1/4"></div>
            <div className="h-3 bg-slate-200 rounded w-1/2"></div>
        </div>
    </div>
);

// --- INDONESIA LIVE MAP COMPONENT ---

interface MapProps {
    events: EventIntelligence[];
    isLoading?: boolean;
}

const IndonesiaMap: React.FC<MapProps> = ({ events, isLoading }) => {
    // PERFORMANCE: Track if map is in view to pause animations
    const [containerRef, isInView] = useInView({ threshold: 0.1 });

    // COMPLETE 37 INJOURNEY AIRPORTS MAPPING (Calibrated for 800x350 PNG projection)
    const airports: Record<string, { x: number, y: number, name: string, isMajor: boolean }> = {
        // --- SUMATRA ---
        'BTJ': { x: 70, y: 50, name: 'Sultan Iskandar Muda (Aceh)', isMajor: false },
        'KNO': { x: 120, y: 105, name: 'Kualanamu (Medan)', isMajor: true },
        'PDG': { x: 135, y: 160, name: 'Minangkabau (Padang)', isMajor: false },
        'PKU': { x: 155, y: 135, name: 'Sultan Syarif Kasim II (Pekanbaru)', isMajor: false },
        'BTH': { x: 190, y: 120, name: 'Hang Nadim (Batam)', isMajor: true },
        'TNJ': { x: 200, y: 125, name: 'Raja Haji Fisabilillah (Tanjungpinang)', isMajor: false },
        'PLM': { x: 205, y: 190, name: 'SMB II (Palembang)', isMajor: false },
        'BKS': { x: 185, y: 205, name: 'Fatmawati (Bengkulu)', isMajor: false },
        'TJQ': { x: 225, y: 190, name: 'HAS Hanandjoeddin (Belitung)', isMajor: false },
        // Additional
        'DJB': { x: 190, y: 170, name: 'Sultan Thaha (Jambi)', isMajor: false },
        'PGK': { x: 215, y: 180, name: 'Depati Amir (Pangkal Pinang)', isMajor: false },
        'TKG': { x: 220, y: 220, name: 'Radin Inten II (Lampung)', isMajor: false },

        // --- JAVA ---
        'CGK': { x: 250, y: 240, name: 'Soekarno-Hatta (Jakarta)', isMajor: true },
        'HLP': { x: 255, y: 243, name: 'Halim Perdanakusuma', isMajor: false },
        'BDO': { x: 265, y: 250, name: 'Husein Sastranegara (Bandung)', isMajor: false },
        'SRG': { x: 295, y: 240, name: 'Ahmad Yani (Semarang)', isMajor: false },
        'SOC': { x: 310, y: 250, name: 'Adi Soemarmo (Solo)', isMajor: false },
        'JOG': { x: 300, y: 255, name: 'Adisutjipto (Yogya)', isMajor: false },
        'YIA': { x: 295, y: 257, name: 'YIA (Kulon Progo)', isMajor: true },
        'SUB': { x: 340, y: 250, name: 'Juanda (Surabaya)', isMajor: true },
        'BWX': { x: 355, y: 260, name: 'Banyuwangi', isMajor: false },

        // --- KALIMANTAN ---
        'PNK': { x: 275, y: 155, name: 'Supadio (Pontianak)', isMajor: false },
        'BDJ': { x: 345, y: 195, name: 'Syamsudin Noor (Banjarmasin)', isMajor: false },
        'BPN': { x: 365, y: 175, name: 'SAMS Sepinggan (Balikpapan)', isMajor: true },
        'PKY': { x: 315, y: 175, name: 'Tjilik Riwut (Palangkaraya)', isMajor: false },
        'TRK': { x: 370, y: 130, name: 'Juwata (Tarakan)', isMajor: false },

        // --- BALI & NUSA TENGGARA ---
        'DPS': { x: 390, y: 260, name: 'Ngurah Rai (Bali)', isMajor: true },
        'LOP': { x: 410, y: 260, name: 'Lombok Praya', isMajor: false },
        'KOE': { x: 495, y: 285, name: 'El Tari (Kupang)', isMajor: false },
        'LBJ': { x: 430, y: 255, name: 'Komodo (Labuan Bajo)', isMajor: false },

        // --- SULAWESI ---
        'UPG': { x: 465, y: 190, name: 'Hasanuddin (Makassar)', isMajor: true },
        'MDC': { x: 515, y: 105, name: 'Sam Ratulangi (Manado)', isMajor: true },
        'GTO': { x: 490, y: 115, name: 'Djalaluddin (Gorontalo)', isMajor: false },
        'PLW': { x: 460, y: 145, name: 'Mutiara SIS Al-Jufrie (Palu)', isMajor: false },
        'KDI': { x: 485, y: 175, name: 'Haluoleo (Kendari)', isMajor: false },
        'LUW': { x: 495, y: 155, name: 'Syukuran Aminuddin Amir (Luwuk)', isMajor: false },
        
        // --- MALUKU & PAPUA ---
        'AMQ': { x: 595, y: 195, name: 'Pattimura (Ambon)', isMajor: false },
        'TTE': { x: 560, y: 125, name: 'Sultan Babullah (Ternate)', isMajor: false },
        'BIK': { x: 675, y: 155, name: 'Frans Kaisiepo (Biak)', isMajor: false },
        'DJJ': { x: 745, y: 175, name: 'Sentani (Jayapura)', isMajor: true },
        'MKQ': { x: 760, y: 240, name: 'Mopah (Merauke)', isMajor: false },
        'TIM': { x: 710, y: 190, name: 'Mozes Kilangin (Timika)', isMajor: false },
        'SOQ': { x: 620, y: 160, name: 'Domine Eduard Osok (Sorong)', isMajor: false },
        'MKW': { x: 645, y: 165, name: 'Rendani (Manokwari)', isMajor: false },
    };

    const [hoveredEvent, setHoveredEvent] = useState<EventIntelligence | null>(null);
    const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
    
    // ZOOM & PAN STATE
    const [view, setView] = useState({ x: 0, y: 0, scale: 1 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

    const handleMouseMove = (e: React.MouseEvent) => {
        if (containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            // Update Tooltip Position based on mouse relative to CONTAINER (not zoomed content)
            setTooltipPos({
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
            });

            // Handle Dragging
            if (isDragging) {
                const dx = e.clientX - dragStart.x;
                const dy = e.clientY - dragStart.y;
                setView(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
                setDragStart({ x: e.clientX, y: e.clientY });
            }
        }
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        setDragStart({ x: e.clientX, y: e.clientY });
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleMouseLeave = () => {
        setIsDragging(false);
    };

    const handleWheel = (e: React.WheelEvent) => {
        e.preventDefault(); // Stop page scroll inside map
        const scaleAmount = -e.deltaY * 0.001;
        const newScale = Math.min(Math.max(1, view.scale + scaleAmount), 4);
        setView(prev => ({ ...prev, scale: newScale }));
    };

    const zoom = (factor: number) => {
        setView(prev => ({ ...prev, scale: Math.min(Math.max(1, prev.scale + factor), 4) }));
    };

    const resetView = () => {
        setView({ x: 0, y: 0, scale: 1 });
    };

    // Generate Flight Paths - MEMOIZED & CONDITIONAL RENDER
    const flightPaths = useMemo(() => {
        // PERF OPTIMIZATION: If not in view, don't calculate or render paths
        if (!isInView || isLoading) return null;

        const paths: React.ReactElement[] = [];
        
        events.forEach((ev, idx) => {
            // Split if duplicate airports are returned e.g. "CGK, HLP"
            const destCodes = ev.affectedAirport.split(',').map(s => s.trim());
            
            destCodes.forEach((destCode, dIdx) => {
                const dest = airports[destCode];
                if (!dest) return;

                // Color based on Impact
                const color = ev.impactLevel === 'HIGH' ? '#ef4444' : (ev.impactLevel === 'MEDIUM' ? '#f59e0b' : '#34d399');
                
                // If origins exist, draw line from origin to dest
                ev.potentialOrigins?.forEach((originCode) => {
                    const origin = airports[originCode];
                    if (!origin) return; 
                    if (originCode === destCode) return;

                    const deltaX = dest.x - origin.x;
                    const deltaY = dest.y - origin.y;
                    const dist = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
                    const midX = (origin.x + dest.x) / 2;
                    const arcHeight = Math.max(40, dist * 0.25); 
                    const midY = Math.min(origin.y, dest.y) - arcHeight;
                    const d = `M${origin.x},${origin.y} Q${midX},${midY} ${dest.x},${dest.y}`;
                    const pathId = `flow-${idx}-${dIdx}-${originCode}`;

                    // Static Path (Shadow) - Always visible
                    paths.push(
                        <path key={`shadow-${pathId}`} d={d} fill="none" stroke={color} strokeWidth="1.5" strokeOpacity="0.15" />
                    );

                    // Animated Flow - Only if in view
                    paths.push(
                        <path key={pathId} d={d} fill="none" stroke={color} strokeWidth="2" strokeDasharray="4,6" strokeOpacity="0.8">
                            <animate attributeName="stroke-dashoffset" from="10" to="0" dur="1s" repeatCount="indefinite" />
                        </path>
                    );

                    paths.push(
                        <circle key={`plane-${pathId}`} r="2" fill="white">
                            <animateMotion dur={`${1.5 + Math.random()}s`} repeatCount="indefinite" path={d} rotate="auto">
                                <mpath xlinkHref={`#${pathId}`} />
                            </animateMotion>
                        </circle>
                    );

                    paths.push(
                        <circle key={`origin-pulse-${pathId}`} cx={origin.x} cy={origin.y} r="3" fill="none" stroke={color} strokeWidth="1" opacity="0.5">
                            <animate attributeName="r" values="1;8" dur="1.5s" repeatCount="indefinite" />
                            <animate attributeName="opacity" values="0.8;0" dur="1.5s" repeatCount="indefinite" />
                        </circle>
                    );
                });
                
                // Destination Marker (Impact Zone Radar Effect - Circle Ripple)
                paths.push(
                    <g key={`dest-${idx}-${dIdx}`}>
                        {/* Visuals - REPLACED WITH CIRCLE RIPPLE */}
                        <circle cx={dest.x} cy={dest.y} r="8" fill="none" stroke={color} strokeWidth="1" opacity="0.6" pointerEvents="none">
                            <animate attributeName="r" values="8;24" dur="2.5s" repeatCount="indefinite" />
                            <animate attributeName="opacity" values="0.6;0" dur="2.5s" repeatCount="indefinite" />
                        </circle>
                        <circle cx={dest.x} cy={dest.y} r="4" fill="none" stroke={color} strokeWidth="0.5" opacity="0.8" pointerEvents="none">
                            <animate attributeName="r" values="4;16" dur="2.5s" begin="0.8s" repeatCount="indefinite" />
                            <animate attributeName="opacity" values="0.8;0" dur="2.5s" begin="0.8s" repeatCount="indefinite" />
                        </circle>
                        <circle cx={dest.x} cy={dest.y} r="3" fill="white" stroke={color} strokeWidth="2" pointerEvents="none" />
                        
                        {/* HIT AREA */}
                        <circle 
                            cx={dest.x} 
                            cy={dest.y} 
                            r="16" 
                            fill="transparent" 
                            stroke="none"
                            className="cursor-pointer"
                            style={{ pointerEvents: 'auto' }}
                            onMouseEnter={(e) => {
                                e.stopPropagation();
                                setHoveredEvent(ev);
                            }}
                            onMouseLeave={(e) => {
                                e.stopPropagation();
                                setHoveredEvent(null);
                            }}
                        />
                    </g>
                );
            });
        });
        return paths;
    }, [events, airports, isInView, isLoading]);

    return (
        <div 
            className="relative w-full h-full bg-[#1e293b] rounded-xl overflow-hidden flex items-center justify-center border border-slate-700 shadow-inner group will-change-transform"
            ref={containerRef}
            onMouseMove={handleMouseMove}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            onWheel={handleWheel}
            onDoubleClick={resetView}
            style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
        >
            
            {/* Grid Background Effect (Fixed) */}
            <div className="absolute inset-0 z-0 opacity-10 pointer-events-none" 
                 style={{ backgroundImage: 'linear-gradient(#334155 1px, transparent 1px), linear-gradient(90deg, #334155 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
            </div>
            
            {/* ZOOM CONTROLS */}
            <div className="absolute bottom-4 right-4 z-30 flex flex-col gap-2">
                <button onClick={() => zoom(0.5)} className="p-2 bg-slate-800 text-slate-300 rounded border border-slate-600 hover:bg-slate-700 hover:text-white transition-colors">
                    <Plus className="w-4 h-4" />
                </button>
                <button onClick={() => zoom(-0.5)} className="p-2 bg-slate-800 text-slate-300 rounded border border-slate-600 hover:bg-slate-700 hover:text-white transition-colors">
                    <Minus className="w-4 h-4" />
                </button>
                <button onClick={resetView} className="p-2 bg-slate-800 text-slate-300 rounded border border-slate-600 hover:bg-slate-700 hover:text-white transition-colors" title="Reset View">
                    <Maximize className="w-4 h-4" />
                </button>
            </div>

            {/* Header Overlay (Fixed) */}
            <div className="absolute top-4 left-4 z-20 flex flex-col gap-1 pointer-events-none">
                <div className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded border backdrop-blur-sm ${isLoading ? 'bg-amber-900/80 text-amber-400 border-amber-500/30' : 'bg-slate-900/80 text-emerald-400 border-emerald-500/30'}`}>
                    <Radio className={`w-3 h-3 ${isLoading || isInView ? 'animate-pulse' : ''}`} />
                    {isLoading ? 'SCANNING SECTOR...' : (isInView ? 'LIVE MONITORING' : 'MONITORING PAUSED')}
                </div>
                <div className="text-[9px] text-slate-500 font-mono">
                    COVERAGE: 37 AIRPORTS<br/>
                    LATENCY: 12ms<br/>
                    ZOOM: {view.scale.toFixed(1)}x
                </div>
            </div>

            {/* TRANSFORM CONTAINER (Zoomable Area) */}
            <div 
                className="relative w-full max-w-[800px] aspect-[800/350] z-10 transition-transform duration-100 ease-out origin-center"
                style={{ 
                    transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})`
                }}
            >
                {/* PNG Map Image */}
                <img 
                    src="https://static.vecteezy.com/system/resources/thumbnails/018/825/780/small/indonesia-map-for-app-art-illustration-website-pictogram-infographic-or-graphic-design-element-format-free-png.png" 
                    alt="Indonesia Map"
                    className="absolute inset-0 w-full h-full object-contain opacity-90 drop-shadow-2xl pointer-events-none"
                    style={{ filter: 'grayscale(30%) contrast(120%) brightness(110%)' }}
                />

                {/* SVG Overlay for Animations */}
                <svg viewBox="0 0 800 350" className="absolute inset-0 w-full h-full" style={{ pointerEvents: 'none' }}>
                    
                    {/* Airport Dots & Labels */}
                    {Object.entries(airports).map(([code, pos]) => (
                        <g key={code} className="group pointer-events-auto">
                            {/* Hover Tooltip (Labels) */}
                            <g className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                                <rect x={pos.x - 40} y={pos.y - 24} width="80" height="16" rx="4" fill="#0f172a" fillOpacity="0.9" stroke="#475569" strokeWidth="0.5" />
                                <text x={pos.x} y={pos.y - 13} textAnchor="middle" fill="#f8fafc" fontSize="8" fontWeight="bold" fontFamily="sans-serif">{pos.name}</text>
                                <line x1={pos.x} y1={pos.y - 8} x2={pos.x} y2={pos.y} stroke="#475569" strokeWidth="0.5" />
                            </g>
                            
                            {/* The Dot */}
                            {pos.isMajor ? (
                                <g>
                                    <circle cx={pos.x} cy={pos.y} r="2.5" fill={isLoading ? '#f59e0b' : '#ef4444'} stroke="#ffffff" strokeWidth="1" className="opacity-80" />
                                    {/* TARGET LOCK ANIMATION DURING LOADING - CIRCLE RIPPLE */}
                                    {isLoading && (
                                        <g>
                                            <circle cx={pos.x} cy={pos.y} r="4" fill="none" stroke="#f59e0b" strokeWidth="1.5" opacity="0.8">
                                                <animate attributeName="r" from="4" to="14" dur={`${1.5 + Math.random()}s`} repeatCount="indefinite" />
                                                <animate attributeName="opacity" from="0.8" to="0" dur={`${1.5 + Math.random()}s`} repeatCount="indefinite" />
                                            </circle>
                                             <circle cx={pos.x} cy={pos.y} r="8" fill="none" stroke="#f59e0b" strokeWidth="0.5" opacity="0.4">
                                                <animate attributeName="r" from="8" to="20" dur={`${1.5 + Math.random()}s`} begin="0.3s" repeatCount="indefinite" />
                                                <animate attributeName="opacity" from="0.4" to="0" dur={`${1.5 + Math.random()}s`} begin="0.3s" repeatCount="indefinite" />
                                            </circle>
                                        </g>
                                    )}
                                    <text x={pos.x} y={pos.y + 9} textAnchor="middle" fill="#94a3b8" fontSize="6" fontWeight="bold" fontFamily="monospace" opacity="0.6">{code}</text>
                                </g>
                            ) : (
                                <circle cx={pos.x} cy={pos.y} r="1.5" fill="#64748b" />
                            )}
                        </g>
                    ))}

                    {/* Animated Flight Paths */}
                    {!isLoading && flightPaths}
                </svg>
            </div>

            {/* FLOATING HOVER CARD */}
            {hoveredEvent && (
                <div 
                    className="absolute z-50 pointer-events-none transition-all duration-150 ease-out"
                    style={{ 
                        left: tooltipPos.x + 20, 
                        top: tooltipPos.y - 80,
                    }}
                >
                    <div className="bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-100 overflow-hidden w-64 animate-in fade-in zoom-in-95 duration-200">
                        {/* Image Header */}
                        <div className="h-24 w-full relative">
                            <SafeImage 
                                src={hoveredEvent.imageUrl} 
                                alt={hoveredEvent.title} 
                                category={hoveredEvent.category} 
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                            <div className="absolute bottom-2 left-2 right-2 flex justify-between items-end">
                                <span className="text-white text-[10px] font-bold bg-black/40 backdrop-blur-md px-1.5 py-0.5 rounded border border-white/20">
                                    {hoveredEvent.affectedAirport}
                                </span>
                                <div className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${hoveredEvent.impactLevel === 'HIGH' ? 'bg-red-500/80 border-red-400 text-white' : 'bg-emerald-500/80 border-emerald-400 text-white'}`}>
                                    {hoveredEvent.impactLevel}
                                </div>
                            </div>
                        </div>
                        
                        {/* Content */}
                        <div className="p-3">
                            <h4 className="text-xs font-bold text-slate-800 leading-tight mb-1">{hoveredEvent.title}</h4>
                            <div className="flex items-center gap-2 text-[10px] text-slate-500 mb-2">
                                <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {hoveredEvent.date}</span>
                            </div>
                            <p className="text-[10px] text-slate-600 line-clamp-2 leading-relaxed">
                                {hoveredEvent.description}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- IMPACT ANALYTICS COMPONENT (Bar + Pie) ---

interface ImpactAnalysisProps {
    stats: any;
    airportData: { name: string; load: number }[]; // Passed from parent
    isLoading: boolean;
}

const ImpactAnalysis: React.FC<ImpactAnalysisProps> = ({ stats, airportData, isLoading }) => {
    const [activeTab, setActiveTab] = useState<'RISK' | 'AIRPORT'>('AIRPORT');

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col h-[350px]">
            <div className="flex items-center justify-between mb-4">
                <h4 className="text-xs font-bold text-slate-700 uppercase flex items-center gap-2">
                    {activeTab === 'RISK' ? 'Impact Distribution' : 'Top Impacted Airports'}
                </h4>
                <div className="flex gap-1 bg-slate-100 p-0.5 rounded-lg">
                     <button 
                        onClick={() => setActiveTab('AIRPORT')}
                        className={`p-1 rounded text-xs transition-all ${activeTab === 'AIRPORT' ? 'bg-white shadow text-indigo-600 font-bold' : 'text-slate-400 hover:text-slate-600'}`}
                        title="Airport Load"
                     >
                        <BarChart3 className="w-4 h-4" />
                     </button>
                     <button 
                        onClick={() => setActiveTab('RISK')}
                        className={`p-1 rounded text-xs transition-all ${activeTab === 'RISK' ? 'bg-white shadow text-indigo-600 font-bold' : 'text-slate-400 hover:text-slate-600'}`}
                        title="Risk Distribution"
                     >
                        <PieChart className="w-4 h-4" />
                     </button>
                </div>
            </div>

            <div className="flex-1 min-h-0 relative">
                {isLoading ? (
                    // SKELETON LOADER FOR CHART
                    <div className="w-full h-full flex flex-col gap-3 justify-center animate-pulse">
                        <div className="flex items-center gap-2">
                            <div className="w-10 h-4 bg-slate-300 rounded"></div>
                            <div className="flex-1 h-6 bg-slate-300 rounded-r-lg"></div>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-10 h-4 bg-slate-300 rounded"></div>
                            <div className="flex-1 h-6 bg-slate-300 rounded-r-lg w-3/4"></div>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-10 h-4 bg-slate-300 rounded"></div>
                            <div className="flex-1 h-6 bg-slate-200 rounded-r-lg w-1/2"></div>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-10 h-4 bg-slate-300 rounded"></div>
                            <div className="flex-1 h-6 bg-slate-200 rounded-r-lg w-2/3"></div>
                        </div>
                    </div>
                ) : (
                    <>
                        {activeTab === 'RISK' && (
                            <>
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                    <span className="text-3xl font-bold text-slate-800">{stats.total}</span>
                                    <span className="text-[10px] text-slate-400 uppercase">Events</span>
                                </div>
                                <ResponsiveContainer width="100%" height="100%">
                                    <RechartsPie>
                                        <Pie
                                            data={stats.riskData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={70}
                                            outerRadius={90}
                                            paddingAngle={5}
                                            dataKey="value"
                                            stroke="none"
                                            cornerRadius={4}
                                        >
                                            {stats.riskData.map((entry: any, index: number) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip 
                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                            itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                                        />
                                        <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: '500' }} />
                                    </RechartsPie>
                                </ResponsiveContainer>
                            </>
                        )}

                        {activeTab === 'AIRPORT' && (
                            <div className="w-full h-full flex flex-col">
                                <div className="flex-1 w-full min-h-0">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart 
                                            data={airportData} 
                                            layout="vertical" 
                                            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                                            <XAxis type="number" hide />
                                            <YAxis 
                                                dataKey="name" 
                                                type="category" 
                                                tick={{ fontSize: 11, fontWeight: 600, fill: '#64748b' }} 
                                                width={40}
                                                axisLine={false}
                                                tickLine={false}
                                            />
                                            <Tooltip 
                                                cursor={{fill: '#f8fafc'}}
                                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '12px' }}
                                            />
                                            <Bar dataKey="load" name="Impact Score" radius={[0, 4, 4, 0]} barSize={20} fill="#6366f1" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

// --- EVENT CARD COMPONENT ---

interface EventCardProps {
    event: EventIntelligence;
}

const EventCard: React.FC<EventCardProps> = ({ event }) => {
    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-lg transition-all duration-300 flex flex-col h-full overflow-hidden group hover:-translate-y-1">
            {/* Header */}
            <div className="p-4 border-b border-slate-50 flex justify-between items-start bg-gradient-to-br from-white to-slate-50">
                <div className="flex gap-3">
                    <CategoryIcon category={event.category} />
                    <div className="min-w-0 pt-0.5">
                        <h4 className="font-bold text-slate-800 text-sm leading-tight line-clamp-2 pr-1 group-hover:text-indigo-600 transition-colors">
                            {event.title}
                        </h4>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-xs text-slate-500 font-medium">
                             <span className="flex items-center gap-1"><Calendar className="w-3 h-3 text-slate-400" /> {event.date}</span>
                             <span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-slate-400" /> {event.location}</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="px-4 py-2 bg-white flex justify-end -mt-3 relative z-10">
                <ImpactBadge level={event.impactLevel} />
            </div>

            {/* Body */}
            <div className="p-4 pt-1 flex-1 flex flex-col gap-3">
                <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                    {event.description}
                </p>
                
                {/* Origins Analysis (New Visualization with Destination) */}
                {event.potentialOrigins && event.potentialOrigins.length > 0 && (
                    <div className="flex flex-col gap-1.5 text-[10px] text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                 <div className="bg-white p-1 rounded shadow-sm">
                                    <Plane className="w-3 h-3 text-indigo-500" />
                                </div>
                                <span className="font-bold uppercase tracking-wide text-slate-500">Incoming Surge</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            {/* Origins Group */}
                            <div className="flex gap-1 flex-wrap flex-1">
                                {event.potentialOrigins.slice(0, 3).map(o => (
                                    <span key={o} className="font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded shadow-sm">{o}</span>
                                ))}
                                {event.potentialOrigins.length > 3 && (
                                    <span className="text-slate-400 text-[9px] py-0.5">+{event.potentialOrigins.length - 3}</span>
                                )}
                            </div>

                            {/* Visual Flow Indicator */}
                            <ArrowRight className="w-3.5 h-3.5 text-slate-400 flex-none" />

                            {/* Destination Badge (Highlighted) */}
                            <div className="flex flex-col items-end">
                                <span className="text-[8px] text-slate-400 font-bold uppercase mb-0.5">Impact At</span>
                                <span className="font-bold text-white bg-slate-800 border border-slate-900 px-2 py-0.5 rounded shadow-sm tracking-wider">
                                    {event.affectedAirport}
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Mitigation Plan */}
                <div className="mt-auto pt-3 border-t border-slate-100">
                    <div className="flex items-center gap-2 mb-2">
                        <ShieldAlert className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                            AI Operational Plan
                        </span>
                    </div>
                    <ul className="space-y-2">
                        {event.mitigationPlan.slice(0,2).map((plan, idx) => (
                            <li key={idx} className="text-[10px] flex gap-2 items-start bg-slate-50 p-1.5 rounded border border-slate-100/50">
                                <span className="font-bold text-slate-700 min-w-[70px] uppercase text-[9px] flex-none tracking-tight">{plan.department}</span>
                                <span className="text-slate-600 leading-tight border-l border-slate-200 pl-2">{plan.action}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
            
             {/* Footer / Source */}
             {event.sourceUrl && event.sourceUrl.startsWith('http') && (
                <a href={event.sourceUrl} target="_blank" rel="noreferrer" className="block bg-slate-50 border-t border-slate-100 px-4 py-2 text-[10px] text-indigo-500 text-center font-medium hover:text-indigo-700 hover:bg-indigo-50 transition-colors flex items-center justify-center gap-1 group/link">
                    Verify Source <ExternalLink className="w-3 h-3 group-hover/link:translate-x-0.5 transition-transform" />
                </a>
            )}
        </div>
    );
};

// --- ANALYTICS SUMMARY CARDS ---

const SummaryCard = ({ title, value, sub, icon: Icon, color, secondaryValue, secondaryLabel }: any) => (
    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow relative overflow-hidden">
        <div className={`absolute right-0 top-0 p-8 rounded-bl-full opacity-5 ${color.replace('text-', 'bg-')}`}></div>
        <div className="relative z-10">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">{title}</p>
            <h3 className="text-2xl font-bold text-slate-800 tracking-tight">{value}</h3>
            {secondaryValue ? (
                <div className="flex flex-col mt-0.5">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">{secondaryLabel}</span>
                    <span className={`text-xs font-bold ${color}`}>{secondaryValue}</span>
                </div>
            ) : (
                <p className={`text-[10px] font-medium mt-1 ${color} flex items-center gap-1`}>
                    <TrendingUp className="w-3 h-3" /> {sub}
                </p>
            )}
        </div>
        <div className={`p-3 rounded-xl ${color.replace('text-', 'bg-').replace('600', '50')} border ${color.replace('text-', 'border-').replace('600', '100')} relative z-10`}>
            <Icon className={`w-5 h-5 ${color}`} />
        </div>
    </div>
);

// --- MAIN DASHBOARD ---

interface EventDashboardProps {
    onEventsLoaded?: (events: EventIntelligence[], isLoading: boolean) => void;
}

const EventDashboard: React.FC<EventDashboardProps> = ({ onEventsLoaded }) => {
    const [events, setEvents] = useState<EventIntelligence[]>([]);
    const [loading, setLoading] = useState(false);
    // Initialize with TODAY'S DATE
    const [scanDate, setScanDate] = useState<string>(() => {
        const today = new Date();
        return today.toISOString().split('T')[0];
    });
    
    // FILTERS
    const [filterCategory, setFilterCategory] = useState<string>('ALL');
    const [filterImpactAt, setFilterImpactAt] = useState<string>('ALL');
    const [filterPriority, setFilterPriority] = useState<string>('ALL');
    
    const [hasInitialScan, setHasInitialScan] = useState(false);

    // Calculate End Date for display
    const endDateDisplay = useMemo(() => {
        const d = new Date(scanDate);
        d.setDate(d.getDate() + 7);
        return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
    }, [scanDate]);

    const doScan = async () => {
        setLoading(true);
        // Reset Filters on new scan
        setFilterCategory('ALL');
        setFilterImpactAt('ALL');
        setFilterPriority('ALL');

        if (onEventsLoaded) onEventsLoaded([], true);
        setEvents([]); 
        
        try {
            const data = await scanEventIntelligence(scanDate);
            setEvents(data);
            setHasInitialScan(true);
            if (onEventsLoaded) onEventsLoaded(data, false);
        } catch (e) {
            console.error(e);
            if (onEventsLoaded) onEventsLoaded([], false);
        } finally {
            setLoading(false);
        }
    };

    // AUTO SCAN ON LOAD OR DATE CHANGE
    useEffect(() => {
        doScan();
    }, [scanDate]);

    // Analytics Data Preparation
    const stats = useMemo(() => {
        const total = events.length;
        const highRisk = events.filter(e => e.impactLevel === 'HIGH').length;
        const weather = events.filter(e => e.category === 'Weather').length;
        const disaster = events.filter(e => e.category === 'Disaster').length;
        
        const riskData = [
            { name: 'High', value: highRisk, color: '#ef4444' },
            { name: 'Medium', value: events.filter(e => e.impactLevel === 'MEDIUM').length, color: '#f59e0b' },
            { name: 'Low', value: events.filter(e => e.impactLevel === 'LOW').length, color: '#10b981' },
        ].filter(d => d.value > 0);

        return { total, highRisk, weather, disaster, riskData };
    }, [events]);

    // Calculate Top Impacted Airport Logic (Hoisted for Summary Card)
    const airportImpactData = useMemo(() => {
        const counts: Record<string, number> = {};
        
        events.forEach(ev => {
            const codes = ev.affectedAirport.split(',').map(s => s.trim());
            const score = ev.impactLevel === 'HIGH' ? 3 : ev.impactLevel === 'MEDIUM' ? 2 : 1;
            
            codes.forEach(code => {
                if (code) {
                    counts[code] = (counts[code] || 0) + score;
                }
            });
        });

        return Object.entries(counts)
            .map(([name, load]) => ({ name, load }))
            .sort((a, b) => b.load - a.load)
            .slice(0, 5);
    }, [events]);

    const topAirport = airportImpactData.length > 0 ? airportImpactData[0] : null;

    // --- FILTER OPTIONS (Dynamic based on data) ---
    const filterOptions = useMemo(() => {
        const categories = Array.from(new Set(events.map(e => e.category))).sort();
        const impactAts = Array.from(new Set(events.map(e => e.affectedAirport))).sort();
        return { categories, impactAts };
    }, [events]);

    const filteredEvents = useMemo(() => {
        return events.filter(ev => {
            if (filterCategory !== 'ALL' && ev.category !== filterCategory) return false;
            if (filterImpactAt !== 'ALL' && ev.affectedAirport !== filterImpactAt) return false;
            if (filterPriority !== 'ALL' && ev.impactLevel !== filterPriority) return false;
            return true;
        });
    }, [events, filterCategory, filterImpactAt, filterPriority]);


    return (
        <div className="flex flex-col h-full bg-slate-50 pb-32 md:pb-0">
            {/* Header / Toolbar */}
            <div className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-20 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.1)]">
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                    <div>
                        <h1 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <div className="bg-indigo-600 p-1.5 rounded-lg">
                                <Radar className={`w-4 h-4 text-white ${loading ? 'animate-spin' : ''}`} />
                            </div>
                            Event Analytics Airport
                        </h1>
                        <p className="text-xs text-slate-500 mt-0.5 ml-9">Operational Awareness and Readiness</p>
                    </div>
                    <div className="flex items-center gap-3">
                         <div className="flex flex-col items-end mr-2">
                             <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Scan Window</span>
                             <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                                {new Date(scanDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} - {endDateDisplay}
                             </span>
                         </div>
                         <div className="w-40 relative z-30">
                             <DatePicker value={scanDate} onChange={setScanDate} className="text-sm shadow-sm" />
                         </div>
                         <button 
                            onClick={doScan} // Force re-trigger
                            disabled={loading}
                            className="p-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 shadow-md shadow-indigo-200 transition-all hover:shadow-lg active:scale-95"
                         >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                         </button>
                    </div>
                </div>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto">
                
                {/* Top Stats Row */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <SummaryCard title="Total Detected" value={loading ? '-' : stats.total} sub="Events in 7-Days" icon={Target} color="text-indigo-600" />
                    <SummaryCard title="High Risk" value={loading ? '-' : stats.highRisk} sub="Requires Mitigation" icon={AlertTriangle} color="text-red-600" />
                    <SummaryCard title="Weather & Disaster" value={loading ? '-' : stats.weather + stats.disaster} sub="Environmental Alerts" icon={CloudRain} color="text-blue-600" />
                    <SummaryCard 
                        title="Primary Hotspot" 
                        value={loading ? '-' : (topAirport ? topAirport.name : 'N/A')} 
                        secondaryValue={loading ? '' : (topAirport ? `${topAirport.load} pts` : '0 pts')}
                        secondaryLabel="IMPACT SCORE"
                        icon={Flame} 
                        color="text-red-600" 
                    />
                </div>

                {/* Main Visuals Row */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Live Map (2 Cols) */}
                    <div className="lg:col-span-2 h-[350px]">
                        <IndonesiaMap events={events} isLoading={loading} />
                    </div>

                    {/* Analytics Panel (1 Col) - Filter removed from here */}
                    <ImpactAnalysis 
                        stats={stats} 
                        airportData={airportImpactData} 
                        isLoading={loading} 
                    />
                </div>

                {/* Events Grid */}
                <div>
                     <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4">
                        <div className="flex items-center gap-2">
                            <div className="h-6 w-1 bg-indigo-500 rounded-full"></div>
                            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                                Intelligence Feed (7-Day Outlook)
                            </h3>
                        </div>
                        
                        {/* DROPDOWN FILTERS */}
                        <div className="flex flex-wrap gap-2">
                            {/* Category Filter */}
                            <div className="relative">
                                <select 
                                    value={filterCategory} 
                                    onChange={(e) => setFilterCategory(e.target.value)}
                                    className="appearance-none bg-white border border-slate-200 text-slate-600 text-xs font-bold py-1.5 pl-3 pr-8 rounded-lg shadow-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                                >
                                    <option value="ALL">All Categories</option>
                                    {filterOptions.categories.map(c => (
                                        <option key={c} value={c}>{c}</option>
                                    ))}
                                </select>
                                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                            </div>

                            {/* Impact At Filter */}
                            <div className="relative">
                                <select 
                                    value={filterImpactAt} 
                                    onChange={(e) => setFilterImpactAt(e.target.value)}
                                    className="appearance-none bg-white border border-slate-200 text-slate-600 text-xs font-bold py-1.5 pl-3 pr-8 rounded-lg shadow-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                                >
                                    <option value="ALL">All Airports (Impact At)</option>
                                    {filterOptions.impactAts.map(c => (
                                        <option key={c} value={c}>{c}</option>
                                    ))}
                                </select>
                                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                            </div>

                            {/* Priority Filter */}
                            <div className="relative">
                                <select 
                                    value={filterPriority} 
                                    onChange={(e) => setFilterPriority(e.target.value)}
                                    className="appearance-none bg-white border border-slate-200 text-slate-600 text-xs font-bold py-1.5 pl-3 pr-8 rounded-lg shadow-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                                >
                                    <option value="ALL">All Priorities</option>
                                    <option value="HIGH">High Impact</option>
                                    <option value="MEDIUM">Medium Impact</option>
                                    <option value="LOW">Low Impact</option>
                                </select>
                                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                            </div>
                        </div>
                     </div>
                     
                     {loading ? (
                         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                             {/* Render 6 Skeletons */}
                             {[1,2,3,4,5,6].map(i => <SkeletonEventCard key={i} />)}
                         </div>
                     ) : events.length === 0 ? (
                        <div className="text-center py-20 bg-white rounded-xl border border-dashed border-slate-300">
                             <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                 <SearchX className="w-8 h-8 text-slate-300" />
                             </div>
                             <h3 className="text-slate-800 font-bold text-sm">No Verified Events Found</h3>
                             <p className="text-slate-400 text-xs mt-1 max-w-md mx-auto">
                                The Agent could not verify any sources for this week. <br/>
                                This may happen if news sources are unreachable or no major events are scheduled.
                             </p>
                             <button 
                                onClick={doScan}
                                className="mt-4 px-4 py-2 bg-slate-800 text-white text-xs font-bold rounded-lg hover:bg-slate-900 transition-colors inline-flex items-center gap-2"
                             >
                                <RefreshCw className="w-3 h-3" /> Retry Scan
                             </button>
                         </div>
                     ) : filteredEvents.length === 0 ? (
                        <div className="text-center py-20 bg-white rounded-xl border border-dashed border-slate-300">
                             <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                 <Filter className="w-8 h-8 text-slate-300" />
                             </div>
                             <h3 className="text-slate-800 font-bold text-sm">No Events Match Filters</h3>
                             <p className="text-slate-400 text-xs mt-1">
                                Try adjusting or clearing your filters.
                             </p>
                             <button 
                                onClick={() => {
                                    setFilterCategory('ALL');
                                    setFilterImpactAt('ALL');
                                    setFilterPriority('ALL');
                                }}
                                className="mt-4 px-4 py-2 bg-indigo-100 text-indigo-700 text-xs font-bold rounded-lg hover:bg-indigo-200 transition-colors"
                             >
                                Reset Filters
                             </button>
                        </div>
                     ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {filteredEvents.map((ev, i) => (
                                <EventCard key={i} event={ev} />
                            ))}
                        </div>
                     )}
                </div>

            </div>
        </div>
    );
};

export default EventDashboard;
