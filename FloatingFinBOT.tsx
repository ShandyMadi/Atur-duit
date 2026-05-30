import { useState, ReactNode } from 'react';
import { Calendar as CalendarIcon, ChevronDown, Check } from 'lucide-react';
import { format, subDays, startOfMonth, endOfMonth, subMonths, startOfDay, endOfDay } from 'date-fns';
import { id } from 'date-fns/locale';

interface Props {
  onFilter: (start: Date | null, end: Date | null) => void;
  startDate: Date | null;
  endDate: Date | null;
  trigger?: ReactNode;
  align?: 'left' | 'right';
}

export default function DateRangeFilter({ onFilter, startDate, endDate, trigger, align = 'left' }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  const presets = [
    { label: 'Semua Waktu', value: 'all', getRange: () => [null, null] },
    { label: 'Hari Ini', value: 'today', getRange: () => [startOfDay(new Date()), endOfDay(new Date())] },
    { label: '7 Hari Terakhir', value: '7days', getRange: () => [startOfDay(subDays(new Date(), 7)), endOfDay(new Date())] },
    { label: 'Bulan Ini', value: 'thisMonth', getRange: () => [startOfMonth(new Date()), endOfMonth(new Date())] },
    { label: 'Bulan Lalu', value: 'lastMonth', getRange: () => [startOfMonth(subMonths(new Date(), 1)), endOfMonth(subMonths(new Date(), 1))] },
  ];

  const currentLabel = startDate && endDate 
    ? `${format(startDate, 'dd MMM')} - ${format(endDate, 'dd MMM')}`
    : 'Semua Waktu';

  return (
    <div className="relative">
      {trigger ? (
        <div onClick={() => setIsOpen(!isOpen)} className="cursor-pointer">
          {trigger}
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full bg-white px-6 py-4 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between group hover:border-black transition-all mb-6"
        >
          <div className="flex items-center gap-4">
            <div className="p-2 bg-gray-50 rounded-xl group-hover:bg-black group-hover:text-white transition-colors">
              <CalendarIcon size={18} />
            </div>
            <div className="text-left">
              <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Periode Transaksi</p>
              <p className="font-bold text-sm tracking-tight">{currentLabel}</p>
            </div>
          </div>
          <ChevronDown size={20} className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      )}

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className={`absolute top-full ${align === 'right' ? 'right-0' : 'left-0'} mt-3 w-80 p-4 bg-white rounded-[32px] shadow-2xl border border-gray-100 z-50 animate-in fade-in zoom-in-95 slide-in-from-top-4 duration-200`}>
            <div className="grid grid-cols-1 gap-2">
              {presets.map((p) => {
                const isActive = p.value === 'all' 
                  ? !startDate 
                  : startDate && p.getRange()[0] && format(startDate, 'yyyyMMdd') === format(p.getRange()[0]!, 'yyyyMMdd');

                return (
                  <button
                    key={p.value}
                    onClick={() => {
                      const [s, e] = p.getRange();
                      onFilter(s, e);
                      setIsOpen(false);
                    }}
                    className={`flex items-center justify-between px-6 py-4 rounded-2xl font-bold transition-all ${
                      isActive ? 'bg-black text-white' : 'hover:bg-gray-50 text-gray-400 hover:text-black'
                    }`}
                  >
                    <span className="text-xs uppercase tracking-widest">{p.label}</span>
                    {isActive && <Check size={16} />}
                  </button>
                );
              })}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-50">
              <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest px-4 mb-4">Atur Tanggal Manual</p>
              <div className="grid grid-cols-2 gap-3 px-2">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-gray-400 uppercase ml-2">Mulai</label>
                  <input 
                    type="date" 
                    className="w-full bg-gray-50 p-3 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-black"
                    value={startDate ? format(startDate, 'yyyy-MM-dd') : ''}
                    onChange={(e) => {
                      const date = e.target.value ? startOfDay(new Date(e.target.value)) : null;
                      onFilter(date, endDate);
                    }}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-gray-400 uppercase ml-2">Sampai</label>
                  <input 
                    type="date" 
                    className="w-full bg-gray-50 p-3 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-black"
                    value={endDate ? format(endDate, 'yyyy-MM-dd') : ''}
                    onChange={(e) => {
                      const date = e.target.value ? endOfDay(new Date(e.target.value)) : null;
                      onFilter(startDate, date);
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
