import { TrendingUp, TrendingDown, Wallet } from 'lucide-react';

interface Props {
  income: number;
  expense: number;
  balance: number;
  currency?: string;
  onClick: () => void;
}

export default function StatsGrid({ income, expense, balance, currency = 'Rp', onClick }: Props) {
  const formatVal = (val: number) => {
    return `${currency} ${new Intl.NumberFormat('id-ID').format(val)}`;
  };

  const stats = [
    { label: 'Saldo Total', value: balance, icon: Wallet, color: 'blue', text: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Pemasukan', value: income, icon: TrendingUp, color: 'green', text: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Pengeluaran', value: expense, icon: TrendingDown, color: 'red', text: 'text-red-600', bg: 'bg-red-50' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
      {stats.map((s) => (
        <button 
          key={s.label} 
          onClick={onClick}
          className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-4 transition-all hover:shadow-md hover:scale-[1.02] active:scale-95 text-left w-full"
        >
          <div className={`${s.bg} ${s.text} p-4 rounded-2xl`}>
            <s.icon size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{s.label}</p>
            <p className={`text-xl font-bold ${s.label === 'Saldo Total' ? 'text-black' : s.text}`}>
              {s.label === 'Pemasukan' ? '+' : s.label === 'Pengeluaran' ? '-' : ''} {formatVal(s.value)}
            </p>
          </div>
        </button>
      ))}
    </div>
  );
}
