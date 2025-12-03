import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';

interface DatePickerProps {
  value: string;
  onChange: (date: string) => void;
  minDate?: string;
  maxDate?: string;
  className?: string;
  highlightedDates?: string[]; // Dates that have specific data
}

const DatePicker: React.FC<DatePickerProps> = ({ 
  value, 
  onChange, 
  minDate, 
  maxDate, 
  className,
  highlightedDates = []
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Initialize view based on value or default to today/minDate
  const [viewDate, setViewDate] = useState(() => value ? new Date(value) : new Date('2025-12-01'));

  // Sync viewDate when value changes externally
  useEffect(() => {
    if (value) {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
         setViewDate(date);
      }
    }
  }, [value]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const handlePrevMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  const handleDateClick = (day: number) => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    
    // Format manually to YYYY-MM-DD to avoid timezone shifts
    const m = (month + 1).toString().padStart(2, '0');
    const d = day.toString().padStart(2, '0');
    const dateString = `${year}-${m}-${d}`;
    
    onChange(dateString);
    setIsOpen(false);
  };

  const renderCalendarDays = () => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const totalDays = daysInMonth(year, month);
    const startDay = firstDayOfMonth(year, month);
    
    const days = [];
    
    // Empty slots for previous month days
    for (let i = 0; i < startDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-9 w-9"></div>);
    }

    // Actual days
    for (let d = 1; d <= totalDays; d++) {
        const m = (month + 1).toString().padStart(2, '0');
        const dayStr = d.toString().padStart(2, '0');
        const dateString = `${year}-${m}-${dayStr}`;

        const isSelected = value === dateString;
        const hasData = highlightedDates.includes(dateString);
      
        let isDisabled = false;
        
        // Disable logic:
        // 1. If strictly outside min/max range
        if (minDate && dateString < minDate) isDisabled = true;
        if (maxDate && dateString > maxDate) isDisabled = true;

        // 2. If highlightedDates are provided, strictly disable any date NOT in the list
        if (highlightedDates.length > 0 && !hasData) {
            isDisabled = true;
        }

        days.push(
            <button
            key={d}
            type="button"
            disabled={isDisabled}
            onClick={() => handleDateClick(d)}
            className={`relative h-9 w-9 rounded-full flex flex-col items-center justify-center text-sm font-medium transition-all
                ${isSelected 
                  ? 'bg-indigo-600 text-white shadow-md' 
                  : 'hover:bg-indigo-50 text-slate-700'
                }
                ${isDisabled ? 'opacity-20 cursor-not-allowed bg-transparent hover:bg-transparent text-slate-400' : ''}
            `}
            >
            {d}
            {hasData && !isSelected && !isDisabled && (
              <span className="absolute bottom-1 w-1 h-1 bg-indigo-400 rounded-full"></span>
            )}
            </button>
        );
    }
    return days;
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center px-4 py-3 border border-slate-300 rounded-lg bg-white hover:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-left shadow-sm group"
      >
        <CalendarIcon className="w-5 h-5 text-slate-400 mr-3 group-hover:text-indigo-500 transition-colors" />
        <span className={`block truncate ${value ? "text-slate-900 font-medium" : "text-slate-400"}`}>
          {value ? new Date(value).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Pilih Tanggal'}
        </span>
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-2 bg-white rounded-xl shadow-xl border border-slate-100 p-4 w-[340px] left-0 animate-in fade-in zoom-in-95 duration-200 origin-top-left">
          <div className="flex justify-between items-center mb-4">
            <button type="button" onClick={handlePrevMonth} className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="font-bold text-slate-800 text-base">
              {viewDate.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
            </span>
            <button type="button" onClick={handleNextMonth} className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          
          <div className="grid grid-cols-7 mb-2">
            {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map(day => (
              <div key={day} className="text-center text-xs font-bold text-slate-400 uppercase tracking-wider">
                {day}
              </div>
            ))}
          </div>
          
          <div className="grid grid-cols-7 gap-1 place-items-center">
            {renderCalendarDays()}
          </div>
          
          <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-center text-slate-400 flex items-center justify-center gap-2">
            <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full"></span>
            Hanya tanggal dengan Data Prognosa yang dapat dipilih
          </div>
        </div>
      )}
    </div>
  );
};

export default DatePicker;