
import { useState, FormEvent, useEffect } from 'react';
import { UserProfile } from '../types';
import { Settings as SettingsIcon, Palette, Type, Layout, Save, Check, LogOut, Camera, Clock, Plus, Trash2, Bell, BellRing } from 'lucide-react';

interface Props {
  profile: UserProfile | null;
  onUpdate: (data: Partial<UserProfile>) => Promise<void>;
  onLogout: () => void;
}

const DEFAULT_CATEGORIES = {
  expense: ['Food', 'Transport', 'Shopping', 'Bills', 'Health', 'Entertainment', 'Others'],
  income: ['Salary', 'Investment', 'Gift', 'Side Hustle', 'Others']
};

const COMMON_CURRENCIES = [
  { code: 'Rp', name: 'Rupiah (IDR)' },
  { code: '$', name: 'US Dollar (USD)' },
  { code: '€', name: 'Euro (EUR)' },
  { code: '¥', name: 'Yen (JPY)' },
  { code: '£', name: 'Pound Sterling (GBP)' },
  { code: '₩', name: 'Won (KRW)' },
  { code: 'A$', name: 'Australian Dollar (AUD)' },
  { code: 'S$', name: 'Singapore Dollar (SGD)' },
  { code: 'RM', name: 'Malaysian Ringgit (MYR)' },
  { code: '฿', name: 'Thai Baht (THB)' }
];

export default function SettingsView({ profile, onUpdate, onLogout }: Props) {
  const [formData, setFormData] = useState({
    displayName: profile?.displayName || '',
    currency: profile?.currency || 'Rp',
    photoURL: profile?.photoURL || '',
    monthlyBudget: profile?.monthlyBudget?.toString() || '0',
    timeFormat: profile?.timeFormat || '24h' as '12h' | '24h'
  });

  const [categories, setCategories] = useState<{
    expense: string[];
    income: string[];
  }>(profile?.categories || DEFAULT_CATEGORIES);

  const [newCat, setNewCat] = useState({ type: 'expense' as 'expense' | 'income', name: '' });
  const [saved, setSaved] = useState(false);
  const [reminderType, setReminderType] = useState<'none' | 'daily' | 'weekly'>(profile?.reminderType || 'none');
  const [notificationPermission, setNotificationPermission] = useState<string>('default');
  const [reminderSaved, setReminderSaved] = useState(false);

  useEffect(() => {
    if (profile) {
      setFormData({
        displayName: profile.displayName || '',
        currency: profile.currency || 'Rp',
        photoURL: profile.photoURL || '',
        monthlyBudget: profile.monthlyBudget?.toString() || '0',
        timeFormat: profile.timeFormat || '24h'
      });
      setReminderType(profile.reminderType || 'none');
      if (profile.categories) {
        setCategories(profile.categories);
      }
    }
  }, [profile]);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotificationPermission(Notification.permission);
    } else {
      setNotificationPermission('unsupported');
    }
  }, []);

  const requestNotificationPermission = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      alert('Maaf, browser Anda tidak mendukung fitur notifikasi push.');
      return;
    }
    const permission = await Notification.requestPermission();
    setNotificationPermission(permission);
    if (permission === 'granted') {
      try {
        new Notification("Notifikasi Aktif! 🔔", {
          body: "Halo! Ini adalah tes pengingat dari AturDuit. Kami siap menyapa Anda!",
          icon: "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"
        });
      } catch (err) {
        console.warn('Failed to construct Notification object:', err);
      }
    }
  };

  const handleReminderTypeChange = async (type: 'none' | 'daily' | 'weekly') => {
    setReminderType(type);
    await onUpdate({ reminderType: type });
    setReminderSaved(true);
    setTimeout(() => setReminderSaved(false), 2000);

    // If they switched to daily/weekly and permissions are default, prompt them
    if (type !== 'none' && typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      requestNotificationPermission();
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await onUpdate({
      displayName: formData.displayName,
      currency: formData.currency,
      photoURL: formData.photoURL,
      monthlyBudget: parseFloat(formData.monthlyBudget),
      timeFormat: formData.timeFormat,
      categories
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const addCategory = () => {
    if (!newCat.name) return;
    const type = newCat.type;
    if (categories[type].includes(newCat.name)) return;

    const updated = {
      ...categories,
      [type]: [...categories[type], newCat.name]
    };
    setCategories(updated);
    setNewCat({ ...newCat, name: '' });
  };

  const removeCategory = (type: 'expense' | 'income', name: string) => {
    const updated = {
      ...categories,
      [type]: categories[type].filter(c => c !== name)
    };
    setCategories(updated);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black tracking-tight mb-2">Pengaturan</h2>
          <p className="text-gray-400 font-medium">Kustomisasi profil dan tampilan aplikasi Anda.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <section className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-purple-50 text-purple-600 p-2 rounded-xl">
              <SettingsIcon size={20} />
            </div>
            <h3 className="font-bold text-lg">Profil & Mata Uang</h3>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 d-block">Foto Profil</label>
              <div className="flex flex-col sm:flex-row items-center gap-6 bg-gray-50/50 p-6 rounded-[32px] border border-gray-100/50">
                <div 
                  className="relative group cursor-pointer"
                  onClick={() => document.getElementById('avatar-upload')?.click()}
                >
                  <img 
                    src={formData.photoURL || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix'} 
                    className="w-24 h-24 rounded-[32px] object-cover border-4 border-white shadow-xl transition-transform active:scale-95 group-hover:brightness-90"
                    alt="Preview"
                  />
                  <div className="absolute inset-0 bg-black/40 rounded-[32px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera size={24} className="text-white" />
                  </div>
                  <input 
                    id="avatar-upload"
                    type="file" 
                    className="hidden" 
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setFormData({...formData, photoURL: reader.result as string});
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </div>
                
                <div className="flex-1 space-y-2 w-full">
                  <p className="text-[10px] font-bold text-gray-400">Klik gambar untuk upload atau masukkan URL di bawah:</p>
                  <input
                    placeholder="https://example.com/image.jpg"
                    className="w-full bg-white p-4 rounded-2xl text-xs outline-none focus:ring-1 ring-black shadow-sm transition-all font-medium border border-gray-100"
                    value={formData.photoURL}
                    onChange={e => setFormData({...formData, photoURL: e.target.value})}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nama Tampilan</label>
              <input
                className="w-full bg-gray-50 p-4 rounded-2xl outline-none focus:ring-2 ring-black transition-all font-medium"
                value={formData.displayName}
                onChange={e => setFormData({...formData, displayName: e.target.value})}
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Mata Uang</label>
              <div className="grid grid-cols-2 gap-2 h-40 overflow-y-auto p-2 bg-gray-50 rounded-2xl border border-gray-100 scrollbar-hide">
                {COMMON_CURRENCIES.map((c) => (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => setFormData({...formData, currency: c.code})}
                    className={`flex items-center justify-between p-3 rounded-xl text-[10px] font-bold transition-all ${
                      formData.currency === c.code 
                      ? 'bg-black text-white shadow-lg scale-[0.98]' 
                      : 'bg-white text-gray-400 hover:text-black hover:bg-gray-100'
                    }`}
                  >
                    <span>{c.code}</span>
                    <span className="opacity-60">{c.name.split(' (')[0]}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Format Jam</label>
              <div className="flex gap-2 p-1 bg-gray-100 rounded-2xl">
                {(['12h', '24h'] as const).map(f => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFormData({...formData, timeFormat: f})}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                      formData.timeFormat === f ? 'bg-white text-black shadow-sm' : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    {f === '12h' ? 'AM/PM (12 Jam)' : '24 Jam'}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className={`w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all ${
                saved ? 'bg-green-500 text-white' : 'bg-black text-white hover:bg-gray-900 shadow-xl shadow-black/5'
              }`}
            >
              {saved ? <Check size={20} /> : <Save size={20} />}
              {saved ? 'Tersimpan' : 'Simpan Perubahan'}
            </button>
          </form>
        </section>

        <div className="space-y-6">
          <section className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm space-y-6 flex flex-col">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-blue-50 text-blue-600 p-2 rounded-xl">
                <Plus size={20} />
              </div>
              <h3 className="font-bold text-lg">Kelola Kategori</h3>
            </div>

            <div className="flex gap-2 p-1 bg-gray-100 rounded-2xl mb-4">
              {(['expense', 'income'] as const).map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setNewCat({ ...newCat, type: t })}
                  className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    newCat.type === t ? 'bg-white text-black shadow-sm' : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  {t === 'expense' ? 'Pengeluaran' : 'Pemasukan'}
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                placeholder="Nama kategori baru..."
                className="flex-1 bg-gray-50 p-3 rounded-xl text-sm font-medium outline-none border border-gray-100 focus:border-black"
                value={newCat.name}
                onChange={e => setNewCat({ ...newCat, name: e.target.value })}
                onKeyDown={e => e.key === 'Enter' && addCategory()}
              />
              <button
                onClick={addCategory}
                className="bg-black text-white p-3 rounded-xl hover:bg-gray-900 transition-colors"
              >
                <Plus size={20} />
              </button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-2 scrollbar-hide">
              {categories[newCat.type].map(cat => (
                <div key={cat} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl group">
                  <span className="text-sm font-bold text-gray-700">{cat}</span>
                  <button 
                    onClick={() => removeCategory(newCat.type, cat)}
                    className="text-gray-300 hover:text-red-500 transition-colors p-1"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* Section Pengingat Transaksi */}
          <section className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm space-y-6 flex flex-col">
            <div className="flex items-center gap-3">
              <div className="bg-amber-50 text-amber-500 p-2 rounded-xl animate-pulse">
                <BellRing size={20} />
              </div>
              <div>
                <h3 className="font-bold text-lg">Pengingat Transaksi</h3>
                <p className="text-xs text-gray-400 font-medium">Ingatkan untuk mencatat keuangan secara rutin.</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Frekuensi Pengingat</label>
                <div className="grid grid-cols-3 gap-2 p-1 bg-gray-100 rounded-2xl">
                  {(['none', 'daily', 'weekly'] as const).map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => handleReminderTypeChange(type)}
                      className={`py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
                        reminderType === type 
                          ? 'bg-black text-white shadow-sm' 
                          : 'text-gray-400 hover:text-gray-600'
                      }`}
                    >
                      {type === 'none' ? 'Nonaktif' : type === 'daily' ? 'Harian' : 'Mingguan'}
                    </button>
                  ))}
                </div>
                {reminderSaved && (
                  <p className="text-[10px] font-bold text-green-600 text-center animate-pulse mt-1">✓ Preferensi pengingat disimpan!</p>
                )}
              </div>

              <div className="bg-gray-50 p-4 rounded-3xl border border-gray-100/80 space-y-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Status Notifikasi Browser</p>
                
                {notificationPermission === 'granted' ? (
                  <div className="flex items-center gap-2 text-green-600 font-bold text-xs bg-green-50/50 p-3 rounded-2xl border border-green-100">
                    <Check size={16} />
                    <span>Aktif & Diizinkan! Kami akan mengirim notifikasi browser.</span>
                  </div>
                ) : notificationPermission === 'denied' ? (
                  <div className="space-y-2">
                    <p className="text-red-500 text-[11px] font-semibold bg-red-50/50 p-3 rounded-2xl border border-red-100">
                      Notifikasi diblokir oleh browser Anda. Silakan izinkan di menu pengaturan situs browser Anda untuk pengingat otomatis.
                    </p>
                    <p className="text-[10px] text-gray-400 font-semibold italic">
                      Tenang! Selama tidak diizinkan, kami akan menampilkan Banner khusus di dashboard aplikasi jika Anda terlambat mengisi data.
                    </p>
                  </div>
                ) : notificationPermission === 'unsupported' ? (
                  <p className="text-gray-400 text-[11px] font-semibold">
                    Browser Anda tidak mendukung Web Push Notifications. Fitur Pengingat Banner interaktif akan aktif sebagai gantinya.
                  </p>
                ) : (
                  <div className="space-y-3">
                    <p className="text-gray-400 text-[11px] font-semibold leading-relaxed">
                      Agar pengingat harian atau mingguan dapat dikirimkan langsung ke perangkat Anda, mohon berikan izin notifikasi browser.
                    </p>
                    <button
                      type="button"
                      onClick={requestNotificationPermission}
                      className="w-full py-3 bg-black text-white rounded-2xl text-[11px] font-bold hover:bg-gray-800 transition-all active:scale-95 flex items-center justify-center gap-2 shadow-md cursor-pointer"
                    >
                      <Bell size={14} />
                      Izinkan Notifikasi Push
                    </button>
                  </div>
                )}
              </div>
            </div>
          </section>

          <section className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm space-y-6 text-center">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-3xl mx-auto flex items-center justify-center">
              <LogOut size={24} />
            </div>
            <div>
              <h3 className="font-bold text-lg">Selesaikan Sesi</h3>
              <p className="text-sm text-gray-400 font-medium">Keluar dari akun Anda dengan aman.</p>
            </div>
            <button
              onClick={onLogout}
              className="w-full py-4 bg-red-50 text-red-600 rounded-2xl font-bold hover:bg-red-100 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <LogOut size={18} />
              Keluar Sekarang
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}

