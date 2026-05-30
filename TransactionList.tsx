import { useState, FormEvent, useMemo } from 'react';
import { Plus, Sparkles, Loader2, X } from 'lucide-react';
import { TransactionType, UserProfile } from '../types';

interface Props {
  onAdd: (data: any) => Promise<void>;
  onUpdate?: (id: string, data: any) => Promise<void>;
  editingTransaction?: any;
  onClose?: () => void;
  profile?: UserProfile | null;
}

const DEFAULT_CATEGORIES = {
  expense: ['Food', 'Transport', 'Shopping', 'Bills', 'Health', 'Entertainment', 'Others'],
  income: ['Salary', 'Investment', 'Gift', 'Side Hustle', 'Others']
};

export default function TransactionForm({ onAdd, onUpdate, editingTransaction, onClose, profile }: Props) {
  const categories = useMemo(() => {
    return profile?.categories || DEFAULT_CATEGORIES;
  }, [profile?.categories]);

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [aiInput, setAiInput] = useState('');
  const [formData, setFormData] = useState({
    amount: editingTransaction?.amount?.toString() || '',
    type: editingTransaction?.type || 'expense' as TransactionType,
    category: editingTransaction?.category || (categories.expense[0] || 'Others'),
    description: editingTransaction?.description || '',
    date: editingTransaction?.date ? new Date(editingTransaction.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    time: editingTransaction?.date ? new Date(editingTransaction.date).toTimeString().split(' ')[0].substring(0, 5) : new Date().toTimeString().split(' ')[0].substring(0, 5),
    goalId: editingTransaction?.goalId || ''
  });

  const [localError, setLocalError] = useState<string | null>(null);

  const isEditing = !!editingTransaction;

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      setOpen(false);
      setFormData({
        amount: '',
        type: 'expense',
        category: categories.expense[0] || 'Others',
        description: '',
        date: new Date().toISOString().split('T')[0],
        time: new Date().toTimeString().split(' ')[0].substring(0, 5),
        goalId: ''
      });
    }
  };

  const handleAiParse = async () => {
    if (!aiInput) return;
    setLoading(true);
    setLocalError(null);
    try {
      const res = await fetch('/api/ai/parse-transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: aiInput })
      });
      const data = await res.json();
      if (data.amount) {
        setFormData({
          ...formData,
          amount: data.amount.toString(),
          type: data.type,
          category: data.category,
          description: data.description
        });
        setAiInput('');
      }
    } catch (err) {
      console.error(err);
      setLocalError("AI gagal memproses input. Coba manual.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setLocalError(null);
    
    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      setLocalError("Jumlah harus berupa angka lebih dari 0");
      setLoading(false);
      return;
    }

    if (formData.type === 'goal' && !formData.goalId) {
      setLocalError("Pilih target Goal (Impian) Anda terlebih dahulu");
      setLoading(false);
      return;
    }

    try {
      const payload = {
        ...formData,
        amount,
        date: new Date(`${formData.date}T${formData.time}`).toISOString()
      };

      if (isEditing && onUpdate) {
        await onUpdate(editingTransaction.id, payload);
      } else {
        await onAdd(payload);
      }
      
      handleClose();
    } catch (err) {
      console.error(err);
      setLocalError("Gagal menyimpan transaksi.");
    } finally {
      setLoading(false);
    }
  };

  if (!open && !isEditing) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-8 right-8 bg-black text-white p-4 rounded-full shadow-2xl hover:scale-105 transition-all flex items-center justify-center group z-50 animate-bounce"
        title="Transaksi Baru"
        id="btn-open-form"
      >
        <div className="relative">
          <Plus size={24} strokeWidth={2.5} />
        </div>
        <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 ease-out font-black text-xs uppercase tracking-widest pl-0 group-hover:pl-2">
          Transaksi Baru
        </span>
      </button>
    );
  }

  return (
    <div 
      className="fixed bottom-6 right-6 md:right-8 w-[calc(100vw-48px)] sm:w-[420px] max-h-[90vh] bg-white rounded-[32px] shadow-3xl border border-gray-100 flex flex-col overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-300"
      id="floating-transaction-panel"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-900 to-black p-4 flex items-center justify-between shadow-md relative overflow-hidden shrink-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.05),transparent_50%)] pointer-events-none" />
        <div className="flex items-center gap-3 relative z-10">
          <div className="w-9 h-9 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-inner">
            <Plus size={20} strokeWidth={2.5} />
          </div>
          <div>
            <h3 className="text-white font-black text-sm tracking-tight leading-none">{isEditing ? 'Edit Transaksi' : 'Tambah Transaksi'}</h3>
            <p className="text-white/60 text-[10px] font-medium mt-1">Atur & Catat Keuangan Anda</p>
          </div>
        </div>

        <button
          onClick={handleClose}
          title="Tutup Menu"
          className="p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-xl transition-all relative z-10"
        >
          <X size={18} strokeWidth={2.5} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          {localError && (
            <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-xs font-bold flex items-center gap-2">
              <Plus className="rotate-45" size={16} />
              {localError}
            </div>
          )}
          
          {!isEditing && (
            <div className="bg-gray-50 p-3 rounded-2xl flex items-center gap-2 border border-gray-100 focus-within:border-black transition-colors">
              <Sparkles size={18} className="text-purple-500 shrink-0" />
              <input
                type="text"
                placeholder="Tulis: jajan bakso 20rb..."
                className="bg-transparent flex-1 outline-none text-xs"
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAiParse())}
              />
              <button
                type="button"
                onClick={handleAiParse}
                disabled={loading}
                className="text-[10px] font-black uppercase tracking-wider bg-white px-3 py-1.5 rounded-lg shadow-sm border border-gray-100 hover:bg-gray-50 disabled:opacity-50 shrink-0"
              >
                Cek AI
              </button>
            </div>
          )}

          <div className="flex gap-1.5">
            {(['expense', 'income', 'goal'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setFormData({ 
                  ...formData, 
                  type: t, 
                  category: t === 'goal' ? '' : (categories[t as 'expense' | 'income'] ? categories[t as 'expense' | 'income'][0] : 'Others'),
                  goalId: '' 
                })}
                className={`flex-1 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all ${
                  formData.type === t 
                    ? (t === 'income' ? 'bg-green-100 text-green-700 ring-2 ring-green-500' : t === 'expense' ? 'bg-red-100 text-red-700 ring-2 ring-red-500' : 'bg-blue-100 text-blue-700 ring-2 ring-blue-500') 
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                {t === 'income' ? 'Masuk' : t === 'expense' ? 'Keluar' : 'Goal'}
              </button>
            ))}
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider ml-1">Jumlah</label>
            <input
              required
              type="number"
              placeholder="0"
              className="w-full bg-gray-50 p-3.5 rounded-2xl outline-none focus:ring-2 ring-black transition-all text-xl font-bold"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            />
          </div>

          {formData.type === 'goal' ? (
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider ml-1">Target Goal (Impian)</label>
              {(!profile?.savingsGoals || profile.savingsGoals.length === 0) ? (
                <div className="bg-amber-50 text-amber-800 p-3 rounded-xl text-[10px] font-medium leading-relaxed">
                  Belum ada tujuan tabungan. Silakan buat di tab <b>Planning</b> terlebih dahulu.
                </div>
              ) : (
                <select
                  required
                  className="w-full bg-gray-50 p-3 rounded-xl outline-none text-xs font-medium"
                  value={formData.goalId}
                  onChange={(e) => {
                    const selectedGoalId = e.target.value;
                    const selectedGoalName = profile?.savingsGoals?.find(g => g.id === selectedGoalId)?.name || 'Goal';
                    setFormData({ ...formData, goalId: selectedGoalId, category: selectedGoalName });
                  }}
                >
                  <option value="">-- Pilih Goal --</option>
                  {profile.savingsGoals.map((goal) => {
                    const progress = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
                    return (
                      <option key={goal.id} value={goal.id}>
                        {goal.name} ({progress.toFixed(0)}%)
                      </option>
                    );
                  })}
                </select>
              )}
            </div>
          ) : (
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider ml-1">Kategori</label>
              <select
                className="w-full bg-gray-50 p-3 rounded-xl outline-none text-xs font-medium"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              >
                {(categories[formData.type as 'expense' | 'income'] || []).map((c, idx) => (
                  <option key={`${c}-${idx}`} value={c}>{c}</option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider ml-1">Tanggal</label>
              <input
                type="date"
                className="w-full bg-gray-50 p-2.5 rounded-xl outline-none text-xs"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider ml-1">Jam</label>
              <input
                type="time"
                className="w-full bg-gray-50 p-2.5 rounded-xl outline-none text-xs"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider ml-1">Deskripsi</label>
            <input
              type="text"
              placeholder="Catatan tambahan..."
              className="w-full bg-gray-50 p-3 rounded-xl outline-none text-xs"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-gray-900 transition-all disabled:opacity-50 flex items-center justify-center gap-2 mt-4"
          >
            {loading && <Loader2 className="animate-spin" size={16} />}
            Simpan Transaksi
          </button>
        </form>
      </div>
    </div>
  );
}
