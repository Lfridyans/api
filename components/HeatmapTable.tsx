import React, { useMemo } from 'react';
import { DailyData, TrafficType, BatchPredictionResult } from '../types';
import { getHistoricalData } from '../data/historicalData';

interface HeatmapTableProps {
  trafficType: TrafficType;
  referenceData: DailyData[];
  batchPredictionResult?: BatchPredictionResult | null;
  savedBatchResult?: BatchPredictionResult | null;
}

const HeatmapTable: React.FC<HeatmapTableProps> = ({
  trafficType,
  referenceData,
  batchPredictionResult,
  savedBatchResult
}) => {
  const isPax = trafficType === TrafficType.PASSENGER;
  const currentBatch = batchPredictionResult || savedBatchResult;

  // Generate date range: 18 Dec - 4 Jan
  const dateRange = useMemo(() => {
    const dates: Array<{ date: string; month: number; day: number; dayName: string; isHoliday: boolean; isPeak: boolean }> = [];
    
    // 18-31 Desember 2024
    for (let day = 18; day <= 31; day++) {
      const date = new Date(2024, 11, day); // Month 11 = December
      const dateStr = `2024-12-${String(day).padStart(2, '0')}`;
      const dayName = date.toLocaleDateString('id-ID', { weekday: 'short' });
      const isHoliday = day === 25; // Natal
      const isPeak = day === 20 || day === 21; // Peak departure
      
      dates.push({
        date: dateStr,
        month: 12,
        day,
        dayName,
        isHoliday,
        isPeak
      });
    }
    
    // 1-4 Januari 2025
    for (let day = 1; day <= 4; day++) {
      const date = new Date(2025, 0, day); // Month 0 = January
      const dateStr = `2025-01-${String(day).padStart(2, '0')}`;
      const dayName = date.toLocaleDateString('id-ID', { weekday: 'short' });
      const isHoliday = day === 1; // Tahun Baru
      const isPeak = day === 3 || day === 4; // Peak return
      
      dates.push({
        date: dateStr,
        month: 1,
        day,
        dayName,
        isHoliday,
        isPeak
      });
    }
    
    return dates;
  }, []);

  // Prepare data for historical years
  const historicalYears = [2019, 2021, 2022, 2023];
  
  const historicalDataMap = useMemo(() => {
    const map = new Map<number, Array<{ date: string; value: number }>>();
    
    historicalYears.forEach(year => {
      const yearData = getHistoricalData(year, isPax ? 'PASSENGER' : 'FLIGHT');
      const dataMap = new Map<string, DailyData>();
      yearData.forEach(d => {
        dataMap.set(d.date, d);
      });
      
      const mapped = dateRange.map(d => {
        // Map date range to historical year dates
        const historicalDate = d.month === 1
          ? `${year + 1}-01-${String(d.day).padStart(2, '0')}`
          : `${year}-12-${String(d.day).padStart(2, '0')}`;
        
        const historicalData = dataMap.get(historicalDate);
        if (historicalData) {
          return {
            date: d.date,
            value: isPax ? historicalData.passengers : historicalData.flights
          };
        }
        return { date: d.date, value: 0 };
      });
      
      map.set(year, mapped);
    });
    
    return map;
  }, [dateRange, isPax]);

  // Prepare data for 2024 (baseline)
  const data2024 = useMemo(() => {
    const dataMap = new Map<string, DailyData>();
    referenceData.forEach(d => {
      dataMap.set(d.date, d);
    });
    
    return dateRange.map(d => {
      const baselineDate = d.month === 1 
        ? `2024-01-${String(d.day).padStart(2, '0')}`
        : `2024-12-${String(d.day).padStart(2, '0')}`;
      
      const baselineData = dataMap.get(baselineDate);
      if (baselineData) {
        return {
          date: d.date,
          value: isPax ? baselineData.passengers : baselineData.flights
        };
      }
      return { date: d.date, value: 0 };
    });
  }, [referenceData, dateRange, isPax]);

  // Prepare data for 2025 (prediction)
  const data2025 = useMemo(() => {
    if (!currentBatch || !currentBatch.predictions) {
      return dateRange.map(d => ({ date: d.date, value: 0 }));
    }
    
    const predictionMap = new Map<string, number>();
    currentBatch.predictions.forEach(pred => {
      if (pred.date) {
        predictionMap.set(pred.date, pred.predictedValue || 0);
      }
    });
    
    return dateRange.map(d => {
      const predDate = d.month === 1
        ? `2026-01-${String(d.day).padStart(2, '0')}`
        : `2025-12-${String(d.day).padStart(2, '0')}`;
      
      const value = predictionMap.get(predDate) || 0;
      return { date: d.date, value };
    });
  }, [currentBatch, dateRange]);

  // Calculate totals for all years
  const totals = useMemo(() => {
    const result: { [year: number]: number } = {};
    
    historicalYears.forEach(year => {
      const yearData = historicalDataMap.get(year) || [];
      result[year] = yearData.reduce((sum, d) => sum + d.value, 0);
    });
    
    result[2024] = data2024.reduce((sum, d) => sum + d.value, 0);
    result[2025] = data2025.reduce((sum, d) => sum + d.value, 0);
    
    return result;
  }, [historicalDataMap, data2024, data2025]);

  // Calculate heatmap color intensity - menggunakan warna yang lebih konsisten
  const getHeatmapColor = (value: number, maxValue: number) => {
    if (!value || value === 0) return 'bg-slate-50';
    
    const intensity = value / maxValue;
    // Intensitas tinggi - biru gelap
    if (intensity >= 0.9) return 'bg-blue-700 text-white';
    if (intensity >= 0.8) return 'bg-blue-600 text-white';
    if (intensity >= 0.7) return 'bg-blue-500 text-white';
    if (intensity >= 0.6) return 'bg-blue-400 text-white';
    // Intensitas sedang - biru terang
    if (intensity >= 0.5) return 'bg-blue-300 text-slate-800';
    if (intensity >= 0.4) return 'bg-blue-200 text-slate-800';
    if (intensity >= 0.3) return 'bg-blue-100 text-slate-800';
    if (intensity >= 0.2) return 'bg-blue-50 text-slate-700';
    return 'bg-slate-50 text-slate-600';
  };

  const maxValue = useMemo(() => {
    const allValues: number[] = [];
    
    historicalYears.forEach(year => {
      const yearData = historicalDataMap.get(year) || [];
      allValues.push(...yearData.map(d => d.value));
    });
    
    allValues.push(...data2024.map(d => d.value));
    allValues.push(...data2025.map(d => d.value));
    
    return Math.max(...allValues, 1);
  }, [historicalDataMap, data2024, data2025]);

  // Format relative day indicator
  const getRelativeDay = (date: { month: number; day: number; isHoliday: boolean }) => {
    if (date.isHoliday) {
      if (date.month === 12 && date.day === 25) return 'Hari Natal';
      if (date.month === 1 && date.day === 1) return 'Tahun baru';
    }
    
    if (date.month === 12) {
      const daysBeforeXmas = 25 - date.day;
      if (daysBeforeXmas > 0) return `H-${daysBeforeXmas}`;
      if (daysBeforeXmas === 0) return 'Hari Natal';
      return `H+${Math.abs(daysBeforeXmas)}`;
    } else {
      const daysAfterNewYear = date.day - 1;
      return `H+${daysAfterNewYear}`;
    }
  };

  return (
    <div className="w-full overflow-x-auto">
      <div className="inline-block min-w-full">
        <table className="min-w-full border-collapse bg-white text-xs">
          <thead>
            <tr>
              <th 
                rowSpan={3} 
                className="border border-slate-300 bg-slate-100 px-3 py-2 text-left font-bold text-slate-700 align-top sticky left-0 z-10"
              >
                {isPax ? 'PAX' : 'FLIGHT'}
              </th>
              {dateRange.map((d, idx) => (
                <th 
                  key={idx} 
                  colSpan={1}
                  className={`border border-slate-300 bg-slate-50 px-2 py-1 text-center ${
                    d.isPeak ? 'bg-green-100' : d.isHoliday ? 'bg-red-100' : ''
                  }`}
                >
                  <div className="flex flex-col">
                    <span className="font-semibold text-slate-700">
                      {d.month === 12 ? 'Dec' : 'Jan'} {d.day}
                    </span>
                  </div>
                </th>
              ))}
              <th 
                rowSpan={3}
                className="border border-slate-300 bg-slate-100 px-3 py-2 text-right font-bold text-slate-700 align-top sticky right-0 z-10"
              >
                Total
              </th>
            </tr>
            <tr>
              {dateRange.map((d, idx) => (
                <th 
                  key={idx}
                  className={`border border-slate-300 bg-slate-50 px-2 py-1 text-center text-[10px] ${
                    d.isPeak ? 'bg-green-100' : d.isHoliday ? 'bg-red-100' : ''
                  }`}
                >
                  {getRelativeDay(d)}
                </th>
              ))}
            </tr>
            <tr>
              {dateRange.map((d, idx) => (
                <th 
                  key={idx}
                  className={`border border-slate-300 bg-slate-50 px-2 py-1 text-center text-[10px] text-slate-600 ${
                    d.isPeak ? 'bg-green-100' : d.isHoliday ? 'bg-red-100' : ''
                  }`}
                >
                  {d.dayName}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* Historical years rows */}
            {historicalYears.map(year => {
              const yearData = historicalDataMap.get(year) || [];
              return (
                <tr key={year}>
                  <td className="border border-slate-300 bg-slate-50 px-3 py-2 font-semibold text-slate-700 sticky left-0 z-10">
                    {year}
                  </td>
                  {yearData.map((d, idx) => {
                    const dateInfo = dateRange[idx];
                    return (
                      <td
                        key={idx}
                        className={`border border-slate-300 px-2 py-2 text-center font-medium ${
                          getHeatmapColor(d.value, maxValue)
                        } ${
                          dateInfo.isPeak ? 'ring-2 ring-green-400' : ''
                        } ${
                          dateInfo.isHoliday ? 'ring-2 ring-red-400' : ''
                        }`}
                      >
                        {d.value > 0 ? d.value.toLocaleString('id-ID') : '-'}
                      </td>
                    );
                  })}
                  <td className="border border-slate-300 bg-blue-50 px-3 py-2 text-right font-bold text-slate-800 sticky right-0 z-10">
                    {totals[year] ? totals[year].toLocaleString('id-ID') : '-'}
                  </td>
                </tr>
              );
            })}
            
            {/* Row 2024 */}
            <tr>
              <td className="border border-slate-300 bg-slate-50 px-3 py-2 font-semibold text-slate-700 sticky left-0 z-10">
                2024
              </td>
              {data2024.map((d, idx) => {
                const dateInfo = dateRange[idx];
                return (
                  <td
                    key={idx}
                    className={`border border-slate-300 px-2 py-2 text-center font-medium ${
                      getHeatmapColor(d.value, maxValue)
                    } ${
                      dateInfo.isPeak ? 'ring-2 ring-green-400' : ''
                    } ${
                      dateInfo.isHoliday ? 'ring-2 ring-red-400' : ''
                    }`}
                  >
                    {d.value > 0 ? d.value.toLocaleString('id-ID') : '-'}
                  </td>
                );
              })}
              <td className="border border-slate-300 bg-blue-50 px-3 py-2 text-right font-bold text-slate-800 sticky right-0 z-10">
                {totals[2024].toLocaleString('id-ID')}
              </td>
            </tr>
            
            {/* Row 2025P (Prediction) */}
            <tr>
              <td className="border border-slate-300 bg-slate-50 px-3 py-2 font-semibold text-slate-700 sticky left-0 z-10">
                2025P
              </td>
              {data2025.map((d, idx) => {
                const dateInfo = dateRange[idx];
                return (
                  <td
                    key={idx}
                    className={`border border-slate-300 px-2 py-2 text-center font-medium ${
                      getHeatmapColor(d.value, maxValue)
                    } ${
                      dateInfo.isPeak ? 'ring-2 ring-green-400' : ''
                    } ${
                      dateInfo.isHoliday ? 'ring-2 ring-red-400' : ''
                    }`}
                  >
                    {d.value > 0 ? d.value.toLocaleString('id-ID') : '-'}
                  </td>
                );
              })}
              <td className="border border-slate-300 bg-indigo-50 px-3 py-2 text-right font-bold text-slate-800 sticky right-0 z-10">
                {totals[2025] > 0 ? totals[2025].toLocaleString('id-ID') : '-'}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default HeatmapTable;
