import { auth, login, logout } from './lib/firebase';
import { useTransactions, useUserProfile } from './lib/hooks';
import LoginView from './components/LoginView';
import StatsGrid from './components/StatsGrid';
import TransactionForm from './components/TransactionForm';
import TransactionList from './components/TransactionList';
import TransactionChart from './components/TransactionChart';
import TransactionCalendar from './components/TransactionCalendar';
import SettingsView from './components/SettingsView';
import UserListView from './components/UserListView';
import CategoryPieChart from './components/CategoryPieChart';
import DateRangeFilter from './components/DateRangeFilter';
import FinancialPlanner from './components/FinancialPlanner';
import FinBOTChat from './components/FinBOTChat';
import FloatingFinBOT from './components/FloatingFinBOT';
import { 
  LayoutDashboard, 
  LogOut, 
  LogIn, 
  PieChart as PieChartIcon, 
  AlertCircle, 
  Settings as SettingsIcon, 
  History,
  Users,
  Eye,
  EyeOff,
  Filter,
  Calendar as CalendarIconNav,
  Target,
  MessageSquare,
  X,
  Bell,
  BellRing
} from 'lucide-react';
import { useMemo, useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';

function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
  }, []);

  return { user, loading };
}

type View = 'dashboard' | 'transactions' | 'community' | 'settings' | 'planning' | 'assistant';

function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

export default function App() {
  const isOnline = useOnlineStatus();
  const { user, loading: authLoading } = useAuth();
  const [activeView, setActiveView] = useState<View>('dashboard');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { transactions, loading: dataLoading, error: dataError, addTransaction, removeTransaction, updateTransaction } = useTransactions(user);
  const { profile, profiles, error: userError, updateProfile } = useUserProfile(user);

  const handleCreateTransaction = async (data: any) => {
    await addTransaction(data);
    if (data.type === 'goal' && data.goalId && profile?.savingsGoals) {
      const updatedGoals = profile.savingsGoals.map(goal => {
        if (goal.id === data.goalId) {
          return {
            ...goal,
            currentAmount: goal.currentAmount + (data.amount || 0)
          };
        }
        return goal;
      });
      await updateProfile({ savingsGoals: updatedGoals });
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    const txnToDelete = transactions.find(t => t.id === id);
    if (txnToDelete && txnToDelete.type === 'goal' && txnToDelete.goalId && profile?.savingsGoals) {
      const updatedGoals = profile.savingsGoals.map(goal => {
        if (goal.id === txnToDelete.goalId) {
          return {
            ...goal,
            currentAmount: Math.max(0, goal.currentAmount - (txnToDelete.amount || 0))
          };
        }
        return goal;
      });
      await updateProfile({ savingsGoals: updatedGoals });
    }
    await removeTransaction(id);
  };

  const handleUpdateTransaction = async (id: string, data: any) => {
    const oldTxn = transactions.find(t => t.id === id);
    await updateTransaction(id, data);
    if (profile?.savingsGoals) {
      let updatedGoals = [...profile.savingsGoals];
      if (oldTxn && oldTxn.type === 'goal' && oldTxn.goalId) {
        updatedGoals = updatedGoals.map(goal => {
          if (goal.id === oldTxn.goalId) {
            return {
              ...goal,
              currentAmount: Math.max(0, goal.currentAmount - (oldTxn.amount || 0))
            };
          }
          return goal;
        });
      }
      if (data.type === 'goal' && data.goalId) {
        updatedGoals = updatedGoals.map(goal => {
          if (goal.id === data.goalId) {
            return {
              ...goal,
              currentAmount: goal.currentAmount + (data.amount || 0)
            };
          }
          return goal;
        });
      }
      await updateProfile({ savingsGoals: updatedGoals });
    }
  };

  const [showCalendar, setShowCalendar] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [showReminderBanner, setShowReminderBanner] = useState(false);
  const [bannerPeriodText, setBannerPeriodText] = useState('');

  // Check and trigger reminder notifications
  useEffect(() => {
    if (!profile || !profile.reminderType || profile.reminderType === 'none' || !transactions) {
      setShowReminderBanner(false);
      return;
    }

    const now = new Date();
    // Sort transactions by date (descending)
    const sortedTxns = [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const lastTxn = sortedTxns[0];
    const lastTxnDate = lastTxn ? new Date(lastTxn.date) : null;

    let shouldRemind = false;
    let periodText = '';
    
    if (profile.reminderType === 'daily') {
      const limitMs = 24 * 60 * 60 * 1000;
      if (!lastTxnDate || (now.getTime() - lastTxnDate.getTime() > limitMs)) {
        shouldRemind = true;
        periodText = 'hari ini';
      }
    } else if (profile.reminderType === 'weekly') {
      const limitMs = 7 * 24 * 60 * 60 * 1000;
      if (!lastTxnDate || (now.getTime() - lastTxnDate.getTime() > limitMs)) {
        shouldRemind = true;
        periodText = 'minggu ini';
      }
    }

    if (shouldRemind) {
      setShowReminderBanner(true);
      setBannerPeriodText(periodText);

      // Throttle push notification to once per session to avoid spamming
      const sessionKey = `reminded_${profile.uid || 'user'}_${profile.reminderType}`;
      const alreadyRemindedInSession = sessionStorage.getItem(sessionKey);

      if (!alreadyRemindedInSession) {
        sessionStorage.setItem(sessionKey, 'true');
        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
          try {
            new Notification("Ayo Catat Transaksi AturDuit Kamu! 📝", {
              body: `Hai ${profile.displayName || 'Teman AturDuit'}! Kamu belum mencatat transaksi baru untuk ${periodText}. Luangkan waktu 1 menit agar pembukuanmu rapi!`,
              icon: "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"
            });
          } catch (e) {
            console.warn("Notification object creation failed:", e);
          }
        }
      }
    } else {
      setShowReminderBanner(false);
    }
  }, [profile?.reminderType, transactions, profile?.displayName, profile?.uid]);

  const [dateRange, setDateRange] = useState<{ start: Date | null, end: Date | null }>({
    start: null,
    end: null
  });

  const filteredTransactions = useMemo(() => {
    if (!dateRange.start && !dateRange.end) return transactions;
    return transactions.filter(t => {
      const date = new Date(t.date);
      if (dateRange.start && date < dateRange.start) return false;
      if (dateRange.end && date > dateRange.end) return false;
      return true;
    });
  }, [transactions, dateRange]);

  const isDisconnected = !isOnline || dataError?.includes('unavailable');

  const stats = useMemo(() => {
    const income = filteredTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + (t.amount || 0), 0);
    const expense = filteredTransactions.filter(t => t.type === 'expense' || t.type === 'goal').reduce((sum, t) => sum + (t.amount || 0), 0);
    return { income, expense, balance: income - expense };
  }, [filteredTransactions]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <LoginView />;
  }

  const navItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'transactions', icon: History, label: 'Transaksi' },
    { id: 'planning', icon: Target, label: 'Planning' },
    { id: 'assistant', icon: MessageSquare, label: 'Tanya FinBOT (AI)' },
    { id: 'community', icon: Users, label: 'Daftar Akun' },
    { id: 'settings', icon: SettingsIcon, label: 'Pengaturan' }
  ];

  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        return (
          <>
            {showReminderBanner && (
              <div className="mb-8 bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-transparent border-l-4 border-amber-500 p-6 rounded-r-3xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm animate-in slide-in-from-top duration-500 relative overflow-hidden backdrop-blur-xs">
                <div className="absolute right-0 bottom-0 opacity-5 pointer-events-none">
                  <BellRing size={160} className="text-amber-500 translate-x-12 translate-y-12" />
                </div>
                
                <div className="flex items-start gap-4 relative z-10 select-none">
                  <div className="bg-amber-100 text-amber-600 p-3 rounded-2xl shrink-0 mt-0.5 animate-pulse">
                    <BellRing size={20} className="text-current" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                      Halo {profile?.displayName || 'Teman AturDuit'}, Sudahkah Kamu Mencatat Transaksi? 📝
                    </h4>
                    <p className="text-xs text-gray-400 mt-1 font-medium leading-relaxed max-w-2xl">
                      Kamu mengatur pengingat <span className="font-bold text-amber-600">{profile?.reminderType === 'daily' ? 'Harian' : 'Mingguan'}</span>, dan kami mendeteksi kamu belum menambahkan data transaksi baru untuk {bannerPeriodText}. Yuk luangkan waktu sebentar untuk mencatat pengeluaran/pemasukan hari ini agar laporan tetap akurat!
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 relative z-10 shrink-0">
                  <button
                    onClick={() => {
                      setActiveView('transactions');
                    }}
                    className="p-3 px-5 bg-black hover:bg-gray-900 text-white font-bold text-xs rounded-2xl transition-all shadow-md active:scale-95 cursor-pointer"
                  >
                    Mulai Catat Sekarang
                  </button>
                  <button
                    onClick={() => setShowReminderBanner(false)}
                    className="p-3 bg-white hover:bg-gray-50 border border-gray-100 text-gray-400 hover:text-black rounded-2xl transition-all font-bold text-xs shadow-sm cursor-pointer"
                  >
                    Ingatkan Nanti
                  </button>
                </div>
              </div>
            )}
            <header className="mb-10">
              <h2 className="text-3xl font-black tracking-tight mb-2">Ringkasan Bulan Ini</h2>
              <p className="text-gray-400 font-medium">Lihat bagaimana kondisi keuanganmu bulan ini.</p>
            </header>
            <StatsGrid {...stats} currency={profile?.currency} onClick={() => setActiveView('transactions')} />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
              <div className="lg:col-span-2">
                <TransactionChart transactions={filteredTransactions} />
                <CategoryPieChart transactions={filteredTransactions} />
              </div>
              <div className="space-y-6">
                <div className="bg-black text-white p-8 rounded-[40px] shadow-xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <PieChartIcon size={120} />
                  </div>
                  <h4 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-6">Tips AI</h4>
                  <p className="text-lg font-medium leading-tight">
                    "Tulis 'makan siang 50rb tadi siang' di input AI untuk mencatat otomatis!"
                  </p>
                </div>

                {/* Summary Card - Moved from Planning to Dashboard */}
                <section className="bg-black text-white p-8 rounded-[40px] shadow-2xl relative overflow-hidden mb-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                  <div className="absolute top-0 right-0 p-6 opacity-10">
                    <Target size={100} />
                  </div>
                  <div className="relative z-10 grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-6">
                    <div className="border-b border-white/10 sm:border-b-0 sm:border-r lg:border-r-0 lg:border-b border-dashed pb-4 sm:pb-0 sm:pr-4 lg:pr-0 lg:pb-4 last:border-0 last:pb-0 last:pr-0">
                      <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">Total Impian</p>
                      <h5 className="text-2xl font-black tracking-tight">{(profile?.savingsGoals || []).length}</h5>
                    </div>
                    <div className="border-b border-white/10 sm:border-b-0 sm:border-r lg:border-r-0 lg:border-b border-dashed pb-4 sm:pb-0 sm:pr-4 lg:pr-0 lg:pb-4 last:border-0 last:pb-0 last:pr-0">
                      <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">Total Terkumpul</p>
                      <h5 className="text-2xl font-black tracking-tight">
                        {profile?.currency || 'Rp'} {new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format((profile?.savingsGoals || []).reduce((sum, g) => sum + g.currentAmount, 0))}
                      </h5>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">Target Tabungan</p>
                      <h5 className="text-2xl font-black tracking-tight">
                        {profile?.currency || 'Rp'} {new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format((profile?.savingsGoals || []).reduce((sum, g) => sum + g.targetAmount, 0))}
                      </h5>
                    </div>
                  </div>
                </section>

                {/* Planning Section on Dashboard */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between px-2">
                    <h4 className="text-white font-black text-[10px] uppercase tracking-widest">Tabungan & Impian</h4>
                    <button 
                      onClick={() => setActiveView('planning')}
                      className="text-white/40 hover:text-white text-[10px] font-black uppercase tracking-widest"
                    >
                      Lihat Semua
                    </button>
                  </div>
                  
                  {(!profile?.savingsGoals || profile.savingsGoals.length === 0) ? (
                    <div className="bg-[#0b6cd6] border-2 border-dashed border-white/20 p-10 rounded-[40px] text-center group cursor-pointer hover:border-white/40 transition-all" onClick={() => setActiveView('planning')}>
                      <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                        <Target size={32} className="text-white/40" />
                      </div>
                      <p className="text-white/40 font-black text-[10px] uppercase tracking-widest">Belum Ada Tujuan Tabungan</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-4">
                      {profile.savingsGoals.map(goal => {
                        const progress = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
                        return (
                          <div key={goal.id} className="bg-white p-5 rounded-[32px] shadow-sm space-y-3 cursor-pointer hover:shadow-md transition-all" onClick={() => setActiveView('planning')}>
                            <div className="flex justify-between items-center">
                              <div>
                                <h5 className="font-black text-gray-900 leading-none">{goal.name}</h5>
                                {goal.category && <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">{goal.category}</span>}
                              </div>
                              <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">{progress.toFixed(0)}%</span>
                            </div>
                            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full bg-blue-500 transition-all duration-1000" style={{ width: `${progress}%` }} />
                            </div>
                            <div className="flex justify-between text-[9px] font-black text-gray-400 uppercase tracking-widest">
                               <span>{profile?.currency || 'Rp'} {new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(goal.currentAmount)}</span>
                               <span>Target: {profile?.currency || 'Rp'} {new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(goal.targetAmount)}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        );
      case 'transactions':
        return (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <header className="mb-10 flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-black tracking-tight mb-2 text-white">Riwayat Transaksi</h2>
                <p className="text-white/60 font-medium">Semua catatan pengeluaran dan pemasukan Anda.</p>
              </div>
              <button 
                onClick={() => setShowCalendar(!showCalendar)}
                className={`px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${showCalendar ? 'bg-black text-white' : 'bg-white text-black hover:shadow-lg'}`}
              >
                {showCalendar ? 'Tutup Kalender' : 'Buka Kalender'}
              </button>
            </header>
            
            {showCalendar && (
              <div className="animate-in fade-in slide-in-from-top-4 duration-500">
                <TransactionCalendar 
                  transactions={filteredTransactions} 
                  currency={profile?.currency}
                  timeFormat={profile?.timeFormat}
                  profile={profile}
                  startDate={dateRange.start}
                  endDate={dateRange.end}
                  onSelectRange={(start, end) => setDateRange({ start, end })}
                  onDelete={handleDeleteTransaction}
                  onUpdate={handleUpdateTransaction}
                  onAdd={handleCreateTransaction}
                />
              </div>
            )}

            <TransactionList 
              transactions={filteredTransactions} 
              onDelete={handleDeleteTransaction} 
              onUpdate={handleUpdateTransaction}
              onAdd={handleCreateTransaction}
              currency={profile?.currency}
              timeFormat={profile?.timeFormat}
              profile={profile}
              startDate={dateRange.start}
              endDate={dateRange.end}
              onFilterChange={(start, end) => setDateRange({ start, end })}
              isFilterActive={!!(dateRange.start || dateRange.end)}
            />
          </div>
        );
      case 'community':
        return (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
             <header className="mb-10">
              <h2 className="text-3xl font-black tracking-tight mb-2">Daftar Akun User</h2>
              <p className="text-gray-400 font-medium tracking-tight">Lihat siapa saja yang terdaftar dan sedang aktif dalam komunitas AturDuit.</p>
            </header>
            <UserListView profiles={profiles} onUpdateProfile={updateProfile} error={userError} />
          </div>
        );
      case 'planning':
        return <FinancialPlanner profile={profile} transactions={transactions} onUpdateProfile={updateProfile} />;
      case 'assistant':
        return <FinBOTChat profile={profile} transactions={transactions} />;
      case 'settings':
        return <SettingsView profile={profile} onUpdate={updateProfile} onLogout={logout} />;
    }
  };

  return (
    <div className="min-h-screen pb-24 bg-[#097bed]">
      {/* Top Navbar */}
      <nav className="sticky top-0 bg-[#f20909] border-b border-white/10 z-40">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-8 relative">
            {/* Logo Trigger */}
            <div 
              className="flex items-center gap-3 cursor-pointer group" 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <div className={`p-2.5 rounded-2xl shadow-lg transition-all active:scale-95 ${isMenuOpen ? 'bg-black text-white' : 'bg-black text-white shadow-black/10'}`}>
                <LayoutDashboard size={22} strokeWidth={2.5} />
              </div>
              <div className="flex flex-col -gap-1">
                <span className="text-xl font-black tracking-tighter hidden sm:block text-white">AturDuit</span>
                {isMenuOpen && <span className="text-[9px] font-bold text-white/60 uppercase tracking-widest leading-none hidden sm:block">Menu Utama</span>}
              </div>
            </div>

            {/* Dropdown Menu */}
            {isMenuOpen && (
              <>
                <div className="fixed inset-0 z-40 bg-gray-900/5 backdrop-blur-[2px]" onClick={() => setIsMenuOpen(false)} />
                <div className="absolute top-full left-0 mt-3 p-3 bg-white rounded-[32px] shadow-2xl border border-gray-100 z-50 min-w-[260px] animate-in fade-in zoom-in-95 slide-in-from-top-4 duration-200">
                  <div className="p-2 mb-2">
                    <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em] px-4">Menu Navigasi</p>
                  </div>
                  <div className="space-y-1">
                    {navItems.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => {
                          setActiveView(item.id as View);
                          setIsMenuOpen(false);
                        }}
                        className={`w-full flex items-center gap-5 px-6 py-4 rounded-2xl font-bold transition-all text-left ${
                          activeView === item.id 
                          ? 'bg-black text-white shadow-xl shadow-black/20' 
                          : 'text-gray-400 hover:bg-gray-50 hover:text-black'
                        }`}
                      >
                        <div className={`p-2 rounded-xl ${activeView === item.id ? 'bg-white/10' : 'bg-gray-100'}`}>
                          <item.icon size={18} strokeWidth={2.5} />
                        </div>
                        <span className="text-xs uppercase tracking-widest">{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end mr-1 hidden sm:flex">
              <span className="text-white font-black text-xs tracking-tight">{profile?.displayName || user.displayName || 'User'}</span>
              <span className="text-white/60 text-[9px] font-bold uppercase tracking-widest leading-none">Profil Saya</span>
            </div>
            {profile?.photoURL || user.photoURL ? (
              <img 
                src={profile?.photoURL || user.photoURL!} 
                className="w-10 h-10 rounded-2xl border-2 border-white shadow-sm ring-1 ring-gray-100 object-cover" 
                alt="avatar" 
              />
            ) : (
              <div className="w-10 h-10 rounded-2xl bg-black text-white flex items-center justify-center font-bold shadow-lg">
                {profile?.displayName?.charAt(0) || user.displayName?.charAt(0)}
              </div>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 pt-10">
        {isDisconnected && (
          <div className="mb-10 p-3 bg-amber-50 text-amber-700 rounded-2xl border border-amber-100 flex items-center justify-between gap-3 animate-pulse">
            <div className="flex items-center gap-3">
              <AlertCircle size={18} />
              <p className="text-xs font-bold">Mode Offline: Koneksi Firebase terganggu. Data akan sinkron otomatis saat online.</p>
            </div>
          </div>
        )}
        {dataError && !dataError.includes('unavailable') && (
          <div className="mb-10 p-4 bg-red-50 text-red-600 rounded-3xl border border-red-100 flex items-center gap-3">
            <AlertCircle size={20} />
            <p className="text-sm font-semibold">Gagal memuat data transaksi. Periksa koneksi Anda.</p>
          </div>
        )}
        {userError && (
          <div className="mb-10 p-4 bg-red-50 text-red-600 rounded-3xl border border-red-100 flex items-center gap-3">
            <AlertCircle size={20} />
            <p className="text-sm font-semibold">Gagal memuat data profil (Izin ditolak). Periksa pengaturan Firebase.</p>
          </div>
        )}
        {renderView()}
      </main>

      {/* Floating Action Button (Only on Transactions/Dashboard) */}
      {(activeView === 'dashboard' || activeView === 'transactions') && (
        <TransactionForm onAdd={handleCreateTransaction} profile={profile} />
      )}

      {/* Floating AI Chatbot on Dashboard with interactive sessions */}
      {activeView === 'dashboard' && (
        <FloatingFinBOT profile={profile} transactions={transactions} />
      )}

      {/* Bottom Nav Mobile */}
      <nav className="md:hidden fixed bottom-6 left-6 right-6 bg-white/80 backdrop-blur-xl border border-gray-200 p-2 rounded-[32px] shadow-2xl z-50 flex items-center justify-around">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveView(item.id as View)}
            className={`p-3.5 rounded-2xl transition-all ${activeView === item.id ? 'bg-black text-white shadow-lg shadow-black/20 scale-110' : 'text-gray-400'}`}
          >
            <item.icon size={20} strokeWidth={2.5} />
          </button>
        ))}
      </nav>
    </div>
  );
}
