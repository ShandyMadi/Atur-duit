import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  isSameMonth, 
  isSameDay, 
  eachDayOfInterval,
  isToday,
  startOfDay,
  endOfDay,
  isWithinInterval,
  setMonth,
  setYear,
  getYear,
  getMonth
} from 'date-fns';
import { id } from 'date-fns/locale';
import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, RotateCcw, Edit2, Trash2, Clock, MoreHorizontal, Settings2, X } from 'lucide-react';
import { Transaction, UserProfile } from '../types';
import TransactionForm from './TransactionForm';

interface Props {
  transactions: Transaction[];
  currency?: string;
  timeFormat?: '12h' | '24h';
  profile?: UserProfile | null;
  onSelectRange?: (start: Date | null, end: Date | null) => void;
  startDate?: Date | null;
  endDate?: Date | null;
  onDelete?: (id: string) => void;
  onUpdate?: (id: string, data: any) => Promise<void>;
  onAdd?: (data: any) => Promise<void>;
}

export default function TransactionCalendar({ 
  transactions, 
  currency = 'Rp', 
  timeFormat = '24h',
  profile,
  onSelectRange, 
  startDate, 
  endDate,
  onDelete,
  onUpdate,
  onAdd
}: Props) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [showPicker, setShowPicker] = useState(false);

  const selectedDayTransactions = useMemo(() => {
    if (!startDate) return [];
    if (endDate) {
      try {
        return transactions.filter(t => {
          const d = new Date(t.date);
          return isWithinInterval(d, { start: startOfDay(startDate), end: endOfDay(endDate) });
        }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      } catch (e) {
        return [];
      }
    }
    return transactions.filter(t => isSameDay(new Date(t.date), startDate))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, startDate, endDate]);

  const years = useMemo(() => {
    const currentYear = getYear(new Date());
    const result = [];
    for (let i = currentYear - 5; i <= currentYear + 5; i++) {
      result.push(i);
    }
    return result;
  }, []);

  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const formatVal = (val: number) => {
    return `${currency} ${new Intl.NumberFormat('id-ID').format(Math.abs(val))}`;
  };

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const stats = useMemo(() => {
    const dayStats: Record<string, { income: number; expense: number }> = {};
    
    transactions.forEach(t => {
      const dateKey = format(new Date(t.date), 'yyyy-MM-dd');
      if (!dayStats[dateKey]) {
        dayStats[dateKey] = { income: 0, expense: 0 };
      }
      if (t.type === 'income') {
        dayStats[dateKey].income += (t.amount || 0);
      } else {
        dayStats[dateKey].expense += (t.amount || 0);
      }
    });
    
    return dayStats;
  }, [transactions]);

  const monthStats = useMemo(() => {
    const income = transactions
      .filter(t => isSameMonth(new Date(t.date), currentMonth) && t.type === 'income')
      .reduce((sum, t) => sum + (t.amount || 0), 0);
    const expense = transactions
      .filter(t => isSameMonth(new Date(t.date), currentMonth) && t.type === 'expense')
      .reduce((sum, t) => sum + (t.amount || 0), 0);
    return { income, expense, balance: income - expense };
  }, [transactions, currentMonth]);

  const handleDayClick = (day: Date) => {
    if (!onSelectRange) return;
    
    // Toggle single day mode
    if (startDate && endDate) {
      onSelectRange(startOfDay(day), null);
    } else if (startDate && isSameDay(day, startDate)) {
      onSelectRange(null, null);
    } else if (!startDate) {
      onSelectRange(startOfDay(day), null);
    } else {
      if (day < startDate) {
        onSelectRange(startOfDay(day), null);
      } else {
        onSelectRange(startDate, endOfDay(day));
      }
    }
  };

  return (
    <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden mb-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
      <div className="p-8 border-b border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-gray-50/20">
        <div className="flex items-center gap-4">
          <div className="bg-black text-white p-4 rounded-2xl shadow-xl">
            <CalendarIcon size={24} />
          </div>
          <div className="relative">
            <button 
              onClick={() => setShowPicker(!showPicker)}
              className="group flex flex-col items-start"
            >
              <h3 className="text-2xl font-black tracking-tight capitalize group-hover:text-blue-600 transition-colors flex items-center gap-2">
                {format(currentMonth, 'MMMM yyyy', { locale: id })}
                <Settings2 size={16} className="text-gray-300 group-hover:text-blue-500" />
              </h3>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Klik untuk Filter Bulan/Tahun</p>
            </button>

            {showPicker && (
              <div className="absolute top-full left-0 mt-4 p-6 bg-white rounded-[32px] shadow-2xl border border-gray-100 z-50 w-72 animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-xs font-black uppercase tracking-[0.2em] text-gray-300">Pilih Periode</h4>
                  <button onClick={() => setShowPicker(false)}>
                    <X size={16} className="text-gray-400 hover:text-black" />
                  </button>
                </div>
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Tahun</label>
                    <select 
                      value={getYear(currentMonth)}
                      onChange={(e) => {
                        setCurrentMonth(setYear(currentMonth, parseInt(e.target.value)));
                      }}
                      className="w-full bg-gray-50 p-3 rounded-xl font-bold text-sm outline-none border border-transparent focus:border-black transition-all"
                    >
                      {years.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Bulan</label>
                    <div className="grid grid-cols-3 gap-1">
                      {months.map((m, idx) => (
                        <button
                          key={m}
                          onClick={() => {
                            setCurrentMonth(setMonth(currentMonth, idx));
                          }}
                          className={`p-2 rounded-lg text-[10px] font-black uppercase transition-all ${getMonth(currentMonth) === idx ? 'bg-black text-white shadow-lg' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}
                        >
                          {m.substring(0, 3)}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onSelectRange && (startDate || endDate) && (
            <button 
              onClick={() => onSelectRange(null, null)}
              className="p-3 bg-white hover:bg-neutral-100 text-black rounded-2xl border border-gray-100 transition-all active:scale-90 shadow-sm"
              title="Reset Filter"
            >
              <RotateCcw size={20} />
            </button>
          )}
          <button 
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="p-3 bg-white hover:bg-gray-50 rounded-2xl border border-gray-100 transition-all active:scale-90 shadow-sm"
          >
            <ChevronLeft size={20} />
          </button>
          <button 
            onClick={() => setCurrentMonth(new Date())}
            className="px-6 py-2 bg-white rounded-xl border border-gray-100 text-[10px] font-black uppercase tracking-widest hover:bg-gray-50 transition-all active:scale-95 shadow-sm"
          >
            Sekarang
          </button>
          <button 
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="p-3 bg-white hover:bg-gray-50 rounded-2xl border border-gray-100 transition-all active:scale-90 shadow-sm"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row">
        <div className="flex-1 lg:border-r border-gray-50">
          <div className="grid grid-cols-7 border-b border-gray-50">
            {['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'].map(day => (
              <div key={day} className="py-4 text-center text-[10px] font-black text-gray-300 uppercase tracking-widest">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7">
            {days.map((day, i) => {
              const dateKey = format(day, 'yyyy-MM-dd');
              const dayData = stats[dateKey];
              const isCurrentMonth = isSameMonth(day, currentMonth);
              const today = isToday(day);
              
              const isSelected = startDate && isSameDay(day, startDate);
              const isEndSelected = endDate && isSameDay(day, endDate);
              const isInRange = startDate && endDate && isWithinInterval(day, { start: startDate, end: endDate });

              return (
                <button 
                  key={dateKey} 
                  onClick={() => handleDayClick(day)}
                  className={`min-h-[100px] lg:min-h-[120px] p-2 border-r border-b border-gray-50 transition-all group relative text-left outline-none
                    ${!isCurrentMonth ? 'bg-gray-50/20' : 'bg-white'}
                    ${isInRange ? 'bg-black/[0.02]' : 'hover:bg-gray-50/50'}
                    ${(isSelected || isEndSelected) ? 'bg-blue-600/5' : ''}
                    ${(i + 1) % 7 === 0 ? 'border-r-0' : ''}
                  `}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className={`text-xs font-black w-7 h-7 flex items-center justify-center rounded-xl transition-all
                      ${isSelected || isEndSelected ? 'bg-blue-600 text-white shadow-lg scale-110' : 
                        today ? 'bg-black text-white shadow-lg' : 
                        isCurrentMonth ? 'text-gray-900 group-hover:scale-110' : 'text-gray-300'}
                    `}>
                      {format(day, 'd')}
                    </span>
                    {isInRange && !isSelected && !isEndSelected && (
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-400 opacity-50" />
                    )}
                  </div>
                  
                  <div className="space-y-1">
                    {dayData?.income > 0 && (
                      <div className="bg-green-50/50 text-green-600 px-1.5 py-0.5 rounded-lg text-[8px] font-black truncate border border-green-100/50">
                        + {new Intl.NumberFormat('id-ID').format(dayData.income)}
                      </div>
                    )}
                    {dayData?.expense > 0 && (
                      <div className="bg-red-50/50 text-red-600 px-1.5 py-0.5 rounded-lg text-[8px] font-black truncate border border-red-100/50">
                        - {new Intl.NumberFormat('id-ID').format(dayData.expense)}
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {startDate && (
          <div className="w-full lg:w-80 xl:w-96 p-8 bg-gray-50/10 animate-in fade-in slide-in-from-right-4 overflow-y-auto">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-black text-white rounded-xl flex items-center justify-center shadow-lg">
                  <Clock size={20} />
                </div>
                <div>
                  <h4 className="font-black text-lg tracking-tight">Detail Riwayat</h4>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mt-1">
                    {endDate 
                      ? `${format(startDate, 'd MMM')} - ${format(endDate, 'd MMM yyyy')}`
                      : format(startDate, 'd MMMM yyyy', { locale: id })
                    }
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-black bg-gray-100 text-gray-400 px-3 py-1 rounded-full uppercase tracking-widest leading-none">
                {selectedDayTransactions.length} item
              </span>
            </div>

            <div className="space-y-4">
              {selectedDayTransactions.length === 0 ? (
                <div className="p-12 border border-dashed border-gray-100 rounded-[32px] text-center bg-white">
                  <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MoreHorizontal className="text-gray-200" />
                  </div>
                  <p className="text-gray-300 font-black text-[10px] uppercase tracking-widest">No History</p>
                </div>
              ) : (
                selectedDayTransactions.map(t => (
                  <div key={t.id} className="bg-white p-5 rounded-[28px] border border-gray-50 shadow-sm space-y-4 group hover:shadow-md transition-all">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${t.type === 'goal' ? 'bg-blue-50 text-blue-600' : t.type === 'income' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                          <Clock size={16} />
                        </div>
                        <div>
                          <p className="font-black text-gray-900 text-sm tracking-tight">{t.description || t.category}</p>
                          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{format(new Date(t.date), timeFormat === '12h' ? 'hh:mm a' : 'HH:mm')}</p>
                        </div>
                      </div>
                      <p className={`font-black tracking-tight ${t.type === 'goal' ? 'text-blue-600' : t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                        {t.type === 'goal' ? '🎯' : t.type === 'income' ? '+' : '-'} {new Intl.NumberFormat('id-ID').format(t.amount)}
                      </p>
                    </div>
                    <div className="flex items-center justify-end gap-1 pt-2 border-t border-gray-50">
                      <button 
                        onClick={() => setEditingTransaction(t)}
                        className="p-2 hover:bg-blue-50 text-gray-300 hover:text-blue-600 rounded-lg transition-all"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button 
                        onClick={() => t.id && onDelete?.(t.id)}
                        className="p-2 hover:bg-red-50 text-gray-300 hover:text-red-600 rounded-lg transition-all"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      <div className="p-8 bg-gray-50/50 grid grid-cols-1 md:grid-cols-3 gap-6 border-t border-gray-50">
        <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm flex items-center justify-between group hover:shadow-md transition-all">
          <div>
            <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-1">Total Pemasukan</p>
            <p className="text-xl font-black text-green-600 tracking-tight">+ {formatVal(monthStats.income)}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-2xl text-green-600 group-hover:scale-110 transition-transform">
            <ChevronLeft size={20} className="rotate-90" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm flex items-center justify-between group hover:shadow-md transition-all">
          <div>
            <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-1">Total Pengeluaran</p>
            <p className="text-xl font-black text-red-600 tracking-tight">- {formatVal(monthStats.expense)}</p>
          </div>
          <div className="bg-red-50 p-4 rounded-2xl text-red-600 group-hover:scale-110 transition-transform">
            <ChevronRight size={20} className="rotate-90" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm flex items-center justify-between group hover:shadow-md transition-all">
          <div>
            <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-1">Saldo Akhir</p>
            <p className={`text-xl font-black tracking-tight ${monthStats.balance >= 0 ? 'text-black' : 'text-red-600'}`}>
              {formatVal(monthStats.balance)}
            </p>
          </div>
          <div className="bg-blue-50 p-4 rounded-2xl text-blue-600 group-hover:scale-110 transition-transform">
            <RotateCcw size={20} />
          </div>
        </div>
      </div>

      {editingTransaction && (
        <TransactionForm 
          onAdd={onAdd!}
          onUpdate={onUpdate}
          editingTransaction={editingTransaction}
          onClose={() => setEditingTransaction(null)}
          profile={profile}
        />
      )}
    </div>
  );
}
