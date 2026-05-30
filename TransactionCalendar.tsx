
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Transaction } from '../types';
import { useMemo } from 'react';

interface Props {
  transactions: Transaction[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#8dd1e1'];

export default function CategoryPieChart({ transactions }: Props) {
  const data = useMemo(() => {
    const expenses = transactions.filter(t => t.type === 'expense');
    const categories: { [key: string]: number } = {};
    
    expenses.forEach(t => {
      const category = t.category || 'Others';
      categories[category] = (categories[category] || 0) + (t.amount || 0);
    });

    return Object.keys(categories).map(name => ({
      name,
      value: categories[name]
    })).sort((a, b) => b.value - a.value);
  }, [transactions]);

  if (data.length === 0) return null;

  return (
    <div className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100 mb-10 h-[400px] animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-black text-lg tracking-tight">Proporsi Pengeluaran</h3>
      </div>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
              itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
              formatter={(value: number) => `Rp${value.toLocaleString()}`}
            />
            <Legend 
              verticalAlign="bottom" 
              height={36} 
              iconType="circle"
              wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
