import React from 'react';
import { EXECUTIVE_DATA } from '../data/executiveData';
import { 
    Download, Plane, Users, Package, 
    ArrowUpRight, ArrowDownRight, Globe, 
    Clock, BarChart3, AlertCircle, RefreshCw,
    Calendar, ChevronRight
} from 'lucide-react';

const MetricBox = ({ label, value, growth, trend, icon: Icon, colorClass }: any) => (
    <div className="flex-1">
        <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
            {Icon && <Icon className="w-3 h-3" />} {label}
        </div>
        <div className="flex items-baseline gap-2">
            <span className={`text-lg font-bold ${colorClass}`}>{value}</span>
            <span className={`text-[10px] px-1 rounded flex items-center ${trend === 'up' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                {growth}
                {trend === 'up' ? <ArrowUpRight className="w-2.5 h-2.5 ml-0.5" /> : <ArrowDownRight className="w-2.5 h-2.5 ml-0.5" />}
            </span>
        </div>
    </div>
);

const SubMetric = ({ label, f, p, c }: any) => (
    <div className="flex justify-between items-center text-[10px] border-t border-dashed border-slate-200 pt-1 mt-1">
        <span className="font-bold text-slate-600 w-8">{label}</span>
        <div className="flex gap-2">
            <span className="text-slate-500">F: <b className="text-slate-700">{f}</b></span>
            <span className="text-slate-500">P: <b className="text-slate-700">{p}</b></span>
            <span className="text-slate-500">C: <b className="text-slate-700">{c}</b></span>
        </div>
    </div>
);

const HighlightCard = ({ title, badge, data }: any) => (
    <div className="bg-white rounded border border-slate-200 p-2 shadow-sm h-full flex flex-col justify-between">
        <div className="flex justify-between items-start mb-2">
            <div>
                <h4 className="font-bold text-xs text-slate-800">{title}</h4>
                <div className="text-[10px] text-slate-500">{data.date}</div>
            </div>
            <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-200">
                {badge} {data.hDate}
            </span>
        </div>
        <div className="flex gap-2 mb-2">
            <MetricBox label="Flight" value={data.flight.value} growth={data.flight.growth} trend={data.flight.trend} icon={Plane} colorClass="text-slate-800" />
            <MetricBox label="Pax" value={data.pax.value} growth={data.pax.growth} trend={data.pax.trend} icon={Users} colorClass="text-slate-800" />
            <MetricBox label="Cargo" value={data.cargo.value} growth={data.cargo.growth} trend={data.cargo.trend} icon={Package} colorClass="text-slate-800" />
        </div>
        <div className="bg-slate-50 p-1.5 rounded space-y-1">
            <SubMetric label="CGK" f={data.cgk.flight} p={data.cgk.pax} c={data.cgk.cargo} />
            <SubMetric label="DPS" f={data.dps.flight} p={data.dps.pax} c={data.dps.cargo} />
        </div>
    </div>
);

const OpIndicator = ({ icon: Icon, title, data }: any) => (
    <div className="bg-white border border-slate-200 rounded p-2 flex items-center gap-3 shadow-sm min-w-0 h-full">
        <div className="p-1.5 bg-blue-50 text-blue-600 rounded flex-none">
            <Icon className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
            <div className="text-[9px] font-bold text-slate-400 uppercase truncate">{title}</div>
            <div className="flex justify-between items-baseline mt-0.5">
                <div className="flex flex-col items-center">
                    <span className="text-[9px] text-slate-400">DOM</span>
                    <span className="text-xs font-bold text-slate-700">{data.dom}</span>
                </div>
                <div className="w-px h-4 bg-slate-100 mx-1"></div>
                <div className="flex flex-col items-center">
                    <span className="text-[9px] text-slate-400">INT</span>
                    <span className="text-xs font-bold text-slate-700">{data.int}</span>
                </div>
                <div className="w-px h-4 bg-slate-100 mx-1"></div>
                <div className="flex flex-col items-center">
                    <span className="text-[9px] text-slate-400">ALL</span>
                    <span className="text-xs font-bold text-blue-600">{data.all}</span>
                </div>
            </div>
        </div>
    </div>
);

const AccumulationCard = ({ icon: Icon, title, value, growth, recv, color }: any) => (
    <div className="bg-white border border-slate-200 rounded p-3 flex flex-col items-center justify-center text-center shadow-sm h-full relative overflow-hidden min-h-[80px]">
        <div className={`absolute top-0 left-0 w-1 h-full ${color}`}></div>
        <Icon className="w-6 h-6 text-slate-300 mb-1" />
        <div className="text-lg font-bold text-slate-800 leading-tight">{value} <span className="text-xs font-normal text-slate-500">{title}</span></div>
        <div className="flex gap-3 mt-1 w-full justify-center border-t border-slate-50 pt-1">
             <div className="flex flex-col">
                <span className="text-[9px] text-slate-400 uppercase">Rcv Rate</span>
                <span className="text-xs font-bold text-amber-600">{recv}</span>
             </div>
             <div className="flex flex-col">
                <span className="text-[9px] text-slate-400 uppercase">Growth</span>
                <span className={`text-xs font-bold ${growth.includes('-') ? 'text-red-600' : 'text-emerald-600'}`}>{growth}</span>
             </div>
        </div>
    </div>
);

const ExecutiveReport: React.FC = () => {
    const d = EXECUTIVE_DATA;

    return (
        <div className="w-full bg-slate-100 p-2 flex flex-col font-sans pb-32 h-auto min-h-full md:h-full md:overflow-y-auto md:pb-0">
            {/* Header / Filter Bar */}
            <div className="flex flex-col md:flex-row justify-between md:items-center mb-2 px-1 flex-none gap-2 md:gap-0">
                <div className="flex items-center gap-2">
                   <div className="w-6 h-6 bg-gradient-to-br from-amber-400 to-orange-500 rounded flex items-center justify-center text-white font-bold text-xs">P</div>
                   <h1 className="font-bold text-slate-800 text-sm">Posko Nataru 2024 &gt; <span className="text-slate-500">Executive Report - Head Office</span></h1>
                </div>
                
                <div className="flex flex-wrap items-center gap-2">
                     <div className="bg-white border border-slate-300 rounded flex items-center px-2 py-1 gap-2 text-xs text-slate-600">
                        <Calendar className="w-3 h-3" />
                        <span>18 Dec - 5 Jan</span>
                     </div>
                     <button className="bg-white border border-slate-300 text-slate-600 px-2 py-1 rounded text-xs font-medium hover:bg-slate-50 flex items-center gap-1">
                        <Download className="w-3 h-3" /> <span className="hidden sm:inline">Export PDF</span>
                     </button>
                     <div className="text-[10px] text-right ml-2 text-slate-400 leading-tight">
                        Last Updated<br/>
                        <span className="text-slate-600 font-medium">{d.lastUpdated}</span>
                     </div>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="flex-1 grid grid-cols-12 gap-2">
                
                {/* TOP ROW: Highlights */}
                <div className="col-span-12 md:col-span-6 h-auto md:h-[160px]">
                    <HighlightCard 
                        title="Traffic Tertinggi Sebelum Natal" 
                        badge="H-3" 
                        data={d.highlightBefore} 
                    />
                </div>
                <div className="col-span-12 md:col-span-6 h-auto md:h-[160px]">
                    <HighlightCard 
                        title="Traffic Tertinggi Setelah Tahun Baru" 
                        badge="H+5" 
                        data={d.highlightAfter} 
                    />
                </div>

                {/* MIDDLE ROW: Operational Indicators */}
                <div className="col-span-12 h-auto md:h-16 grid grid-cols-2 md:grid-cols-4 gap-2">
                    <OpIndicator icon={Clock} title="On Time Performance" data={d.operational.otp} />
                    <OpIndicator icon={BarChart3} title="Load Factor" data={d.operational.loadFactor} />
                    <OpIndicator icon={RefreshCw} title="Slot Utilization" data={d.operational.slotUtilization} />
                    <OpIndicator icon={Globe} title="Routes" data={d.operational.routes} />
                </div>

                {/* BOTTOM MAIN AREA: 3 Columns */}
                
                {/* COL 1: Traffic Accumulation (30%) */}
                <div className="col-span-12 md:col-span-4 flex flex-col gap-2 min-h-0">
                    <div className="bg-white p-1 border border-slate-200 rounded text-center text-xs font-bold text-slate-700 uppercase tracking-wider flex-none">
                        Traffic Accumulation
                    </div>
                    <div className="flex-1 grid grid-rows-3 gap-2 min-h-[250px] md:min-h-0">
                        <AccumulationCard icon={Plane} title="Flight" value={d.accumulation.flight.total} growth={d.accumulation.flight.growth} recv={d.accumulation.flight.recovery} color="bg-blue-500" />
                        <AccumulationCard icon={Users} title="Pax" value={d.accumulation.pax.total} growth={d.accumulation.pax.growth} recv={d.accumulation.pax.recovery} color="bg-emerald-500" />
                        <AccumulationCard icon={Package} title="TON Cargo" value={d.accumulation.cargo.total} growth={d.accumulation.cargo.growth} recv={d.accumulation.cargo.recovery} color="bg-amber-500" />
                    </div>
                </div>

                {/* COL 2: Top Traffic Lists (35%) */}
                <div className="col-span-12 md:col-span-4 flex flex-col gap-2 min-h-[300px] md:min-h-0">
                    <div className="bg-white rounded border border-slate-200 p-2 flex-1 shadow-sm overflow-hidden flex flex-col min-h-[120px]">
                        <h5 className="font-bold text-[10px] text-slate-600 uppercase mb-2 border-b border-slate-100 pb-1 flex-none">Top Traffic by Passengers</h5>
                        <div className="flex-1 overflow-auto">
                            <table className="w-full text-xs">
                                <tbody>
                                    {d.topAirports.map((item, i) => (
                                        <tr key={i} className="border-b border-slate-50 last:border-0">
                                            <td className="py-1 text-slate-400 w-4">{i + 1}.</td>
                                            <td className="py-1 font-bold text-slate-700">{item.name}</td>
                                            <td className="py-1 text-right text-slate-600">{item.value}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div className="flex gap-2 flex-1 min-h-0">
                        <div className="bg-white rounded border border-slate-200 p-2 flex-1 shadow-sm flex flex-col min-h-[100px]">
                            <h5 className="font-bold text-[9px] text-slate-600 uppercase mb-2 border-b border-slate-100 pb-1 flex-none">Top Dest Intl</h5>
                            <div className="flex-1 overflow-auto">
                                <table className="w-full text-[10px]">
                                    <tbody>
                                        {d.topDestInt.map((item, i) => (
                                            <tr key={i}>
                                                <td className="py-0.5 text-slate-400 w-3">{i + 1}.</td>
                                                <td className="font-bold text-slate-700">{item.name}</td>
                                                <td className="text-right text-slate-500">{item.value}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <div className="bg-white rounded border border-slate-200 p-2 flex-1 shadow-sm flex flex-col min-h-[100px]">
                            <h5 className="font-bold text-[9px] text-slate-600 uppercase mb-2 border-b border-slate-100 pb-1 flex-none">Top Dest Dom</h5>
                            <div className="flex-1 overflow-auto">
                                <table className="w-full text-[10px]">
                                    <tbody>
                                        {d.topDestDom.map((item, i) => (
                                            <tr key={i}>
                                                <td className="py-0.5 text-slate-400 w-3">{i + 1}.</td>
                                                <td className="font-bold text-slate-700">{item.name}</td>
                                                <td className="text-right text-slate-500">{item.value}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>

                {/* COL 3: Extra Flight & Ops (35%) */}
                <div className="col-span-12 md:col-span-4 flex flex-col gap-2 min-h-[300px] md:min-h-0">
                    {/* Extra Flight */}
                    <div className="bg-white rounded border border-slate-200 p-3 shadow-sm flex-none flex flex-col justify-center min-h-[80px]">
                        <div className="flex items-center gap-1 font-bold text-[10px] text-blue-600 uppercase mb-3">
                            <Plane className="w-3 h-3" /> Extra Flight
                        </div>
                        <div className="flex justify-between text-center px-2">
                            <div>
                                <div className="text-[9px] text-slate-400 uppercase">Plan</div>
                                <div className="text-lg font-bold text-slate-800">{d.extraFlight.plan}</div>
                            </div>
                            <div className="border-l border-slate-100 mx-2"></div>
                            <div>
                                <div className="text-[9px] text-slate-400 uppercase">Realization</div>
                                <div className="text-lg font-bold text-slate-800">{d.extraFlight.realization}</div>
                            </div>
                            <div className="border-l border-slate-100 mx-2"></div>
                            <div>
                                <div className="text-[9px] text-slate-400 uppercase">% Realization</div>
                                <div className="text-lg font-bold text-emerald-600">{d.extraFlight.percentage}</div>
                            </div>
                        </div>
                    </div>

                    {/* Operation Condition */}
                    <div className="bg-white rounded border border-slate-200 p-3 shadow-sm flex-none flex flex-col min-h-[90px]">
                         <div className="flex items-center gap-1 font-bold text-[10px] text-slate-600 uppercase mb-2 flex-none">
                            <BarChart3 className="w-3 h-3" /> Operation Condition
                        </div>
                        <div className="flex gap-4 flex-1">
                            <div className="flex-1 flex flex-col justify-between border-r border-slate-100 pr-2">
                                <div className="text-[10px] font-bold text-orange-600">YESTERDAY</div>
                                <div className="flex justify-between items-end gap-2">
                                    <div>
                                        <div className="text-[8px] text-slate-400 font-bold uppercase">Flt Realization</div>
                                        <div className="text-sm font-bold text-slate-800">{d.opsCondition.yesterdayRealization.flight}</div>
                                    </div>
                                    <div>
                                        <div className="text-[8px] text-slate-400 font-bold uppercase text-right">Pax Realization</div>
                                        <div className="text-sm font-bold text-slate-800 text-right">{d.opsCondition.yesterdayRealization.pax}</div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex-1 flex flex-col justify-between">
                                <div className="text-[10px] font-bold text-blue-600">TODAY</div>
                                <div className="flex justify-between items-end gap-2">
                                    <div>
                                        <div className="text-[8px] text-slate-400 font-bold uppercase">Flt Planning</div>
                                        <div className="text-sm font-bold text-slate-700">{d.opsCondition.todayPlan.flight}</div>
                                    </div>
                                    <div>
                                        <div className="text-[8px] text-slate-400 font-bold uppercase text-right">Pax Predict</div>
                                        <div className="text-sm font-bold text-slate-700 text-right">{d.opsCondition.todayPlan.pax}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Irregularities Table */}
                    <div className="bg-white rounded border border-slate-200 p-2 shadow-sm flex-1 flex flex-col overflow-hidden min-h-[150px]">
                         <div className="flex items-center gap-2 font-bold text-[10px] text-slate-600 uppercase mb-2 flex-none px-1 pt-1">
                            <AlertCircle className="w-3 h-3 text-slate-500" /> Irregularities Condition
                        </div>
                        <div className="flex-1 overflow-auto rounded border border-slate-100">
                             <table className="w-full text-[9px] text-left">
                                <thead className="bg-[#5d8aa8] text-white sticky top-0">
                                    <tr>
                                        <th className="py-1 px-1 font-bold">DAILY</th>
                                        <th className="py-1 px-1 font-bold">BRANCH</th>
                                        <th className="py-1 px-1 font-bold">FLIGHT NO</th>
                                        <th className="py-1 px-1 font-bold">KRONOLOGIS</th>
                                        <th className="py-1 px-1 font-bold">DAMPAK</th>
                                        <th className="py-1 px-1 font-bold">CATEGORY</th>
                                        <th className="py-1 px-1 font-bold">TYPE</th>
                                    </tr>
                                </thead>
                                <tbody className="text-slate-700">
                                    {d.irregularities.details.map((item, idx) => (
                                        <tr key={idx} className="border-b border-slate-50 last:border-0 hover:bg-slate-50">
                                            <td className="py-1 px-1 font-medium">{item.daily}</td>
                                            <td className="py-1 px-1">{item.branch}</td>
                                            <td className="py-1 px-1">{item.flightNo}</td>
                                            <td className="py-1 px-1 font-medium">{item.kronologis}</td>
                                            <td className="py-1 px-1">{item.dampak}</td>
                                            <td className="py-1 px-1">{item.category}</td>
                                            <td className="py-1 px-1">{item.type}</td>
                                        </tr>
                                    ))}
                                </tbody>
                             </table>
                        </div>
                        <div className="flex justify-between items-center mt-1 px-1 text-[9px] text-slate-400 flex-none">
                            <span>Total: {d.irregularities.total} records</span>
                            <div className="flex gap-2">
                                <span>1 - 16 / 16</span>
                                <div className="flex gap-1">
                                    <span className="cursor-pointer hover:text-slate-600">&lt;</span>
                                    <span className="cursor-pointer hover:text-slate-600">&gt;</span>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>

            </div>
        </div>
    );
};

export default ExecutiveReport;