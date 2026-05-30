
import { useState, FormEvent } from 'react';
import { UserProfile } from '../types';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';
import { Users, UserPlus, Mail, Lock, User as UserIcon, Edit3, ChevronUp, Save, Key, X, Loader2, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { auth, registerEmail } from '../lib/firebase';
import { updatePassword, updateEmail } from 'firebase/auth';
import { translateFirebaseError } from '../lib/errorUtils';

interface Props {
  profiles: UserProfile[];
  onUpdateProfile: (data: Partial<UserProfile>) => Promise<void>;
  error?: string | null;
}

export default function UserListView({ profiles, onUpdateProfile, error }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState({ name: '', email: '', password: '' });
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Form registration state
  const [regData, setRegData] = useState({ name: '', email: '', password: '' });
  const [regError, setRegError] = useState<string | null>(null);

  const activeProfiles = profiles.filter(p => p.lastSeen && (new Date().getTime() - new Date(p.lastSeen).getTime() < 300000));
  const currentUser = auth.currentUser;

  const [regLoading, setRegLoading] = useState(false);
  const [regSuccess, setRegSuccess] = useState(false);
  const [showRegPassword, setShowRegPassword] = useState(false);

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    setRegLoading(true);
    setRegError(null);
    setRegSuccess(false);
    try {
      let finalEmail = regData.email.trim();
      if (!finalEmail) {
        // Generate a placeholder email based on name if empty
        const safeName = regData.name.toLowerCase().replace(/[^a-z0-9]/g, '');
        const randomId = Math.random().toString(36).substring(2, 7);
        finalEmail = `${safeName || 'user'}_${randomId}@aturduit.local`;
      }

      console.log("Mendaftarkan akun baru:", finalEmail);
      await registerEmail(finalEmail, regData.password, regData.name);
      console.log("Pendaftaran berhasil!");
      setRegSuccess(true);
      
      // Keep modal open for a moment to show success
      setTimeout(() => {
        setShowAddAccount(false);
        setRegData({ name: '', email: '', password: '' });
        setRegSuccess(false);
      }, 2000);
    } catch (err: any) {
      console.error("Gagal daftar:", err);
      setRegError(translateFirebaseError(err));
    } finally {
      setRegLoading(false);
    }
  };

  const startEditing = (p: UserProfile) => {
    setEditingId(p.uid || p.email);
    setEditData({ name: p.displayName, email: p.email, password: '' });
    setMessage(null);
  };

  const handleSave = async () => {
    if (!currentUser) return;
    setLoading(true);
    setMessage(null);
    try {
      // Update Display Name & Email in Firestore
      await onUpdateProfile({ 
        displayName: editData.name,
        email: editData.email 
      });

      // Update Email in Firebase Auth if changed
      if (editData.email !== currentUser.email) {
        await updateEmail(currentUser, editData.email);
      }

      // Update Password if provided
      if (editData.password) {
        await updatePassword(currentUser, editData.password);
      }

      setMessage({ type: 'success', text: 'Profil berhasil diperbarui!' });
      setTimeout(() => setEditingId(null), 1500);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Gagal memperbarui profil.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Active Users Section */}
      <section>
        <div className="flex items-center gap-3 mb-6 px-2">
          <div className="bg-green-50 text-green-600 p-2 rounded-xl">
            <Users size={20} />
          </div>
          <h3 className="font-black text-lg tracking-tight">User Sedang Online</h3>
          <div className="flex items-center gap-2 px-3 py-1 bg-green-50 rounded-full text-[10px] font-black text-green-600 uppercase tracking-widest ml-auto">
            {activeProfiles.length} Online
          </div>
        </div>

        {activeProfiles.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {activeProfiles.map((p) => (
              <div key={`active-${p.uid || p.email}`} className="bg-white p-5 rounded-[32px] border border-gray-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-all group">
                <div className="relative">
                  {p.photoURL ? (
                     <img src={p.photoURL} className="w-12 h-12 rounded-2xl object-cover border-2 border-white shadow-sm" alt="avatar" />
                  ) : (
                    <div className="w-12 h-12 bg-black text-white rounded-2xl flex items-center justify-center font-bold">
                      {(p.displayName || 'U').charAt(0)}
                    </div>
                  )}
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-4 border-white rounded-full animate-pulse" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm truncate">{p.displayName}</p>
                  <p className="text-[10px] text-green-500 font-bold uppercase tracking-wider">Aktif Sekarang</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-gray-50 border border-dashed border-gray-200 rounded-[32px] p-8 text-center">
            <p className="text-gray-400 text-sm font-medium">Tidak ada user yang online saat ini.</p>
          </div>
        )}
      </section>

      {/* All Registered Accounts Section */}
      <section>
        <div className="bg-white rounded-[40px] p-8 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="bg-blue-50 text-blue-600 p-2 rounded-xl">
                <Users size={20} />
              </div>
              <h3 className="font-black text-lg tracking-tight">Semua Akun Terdaftar</h3>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden sm:block px-4 py-1.5 bg-gray-100 rounded-full text-[10px] font-black text-gray-500 uppercase tracking-widest">
                {profiles.length} Akun Terdaftar
              </div>
              <button 
                onClick={() => setShowAddAccount(true)}
                className="flex items-center gap-2 px-6 py-3 bg-black text-white rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-xl shadow-black/20 group"
              >
                <UserPlus size={18} className="group-hover:rotate-12 transition-transform" />
                <span className="text-xs font-bold uppercase tracking-wider">Tambah Akun Baru</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {profiles.length > 0 ? profiles.map((p) => {
              if (!p) return null;
              const profileId = p.uid || p.email;
              if (!profileId) return null;
              
              const isOnline = p.lastSeen && (new Date().getTime() - new Date(p.lastSeen).getTime() < 300000);
              const isMe = currentUser?.uid === p.uid || (p.email && currentUser?.email === p.email);
              const isEditing = editingId === profileId;

              return (
                <div key={profileId} className={`rounded-[32px] border transition-all overflow-hidden ${isEditing ? 'border-black ring-4 ring-black/5 bg-white' : 'bg-gray-50/50 border-transparent hover:border-gray-200'}`}>
                  <div className="p-6 flex items-center gap-6">
                    <div className="relative">
                      {p.photoURL ? (
                         <img src={p.photoURL} className="w-16 h-16 rounded-[24px] object-cover border-2 border-white shadow-sm" alt="avatar" />
                      ) : (
                        <div className="w-16 h-16 bg-white border border-gray-100 text-gray-400 rounded-[24px] flex items-center justify-center font-bold text-xl">
                          {(p.displayName || 'U').charAt(0)}
                        </div>
                      )}
                      {isOnline && (
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 border-4 border-white rounded-full" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-black text-lg truncate tracking-tight">{p.displayName}</p>
                        {isMe && <span className="bg-black text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-full tracking-widest">Saya</span>}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                        <div className="flex items-center gap-1.5 text-gray-400">
                          <Edit3 size={12} />
                          <span className="text-[10px] font-bold uppercase tracking-wider">
                            {p.lastSeen ? formatDistanceToNow(new Date(p.lastSeen), { addSuffix: true, locale: id }) : 'Baru bergabung'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {isMe && (
                      <button 
                        onClick={() => isEditing ? setEditingId(null) : startEditing(p)}
                        className={`p-4 rounded-2xl transition-all ${isEditing ? 'bg-black text-white' : 'bg-white shadow-sm text-gray-400 hover:text-black'}`}
                      >
                        {isEditing ? <ChevronUp size={20} /> : <Edit3 size={20} />}
                      </button>
                    )}
                  </div>

                  {isEditing && (
                    <div className="px-6 pb-8 pt-2 space-y-6 animate-in slide-in-from-top-4 duration-300">
                      <div className="h-px bg-gray-100 w-full" />
                      
                      {message && (
                        <div className={`p-4 rounded-2xl text-[11px] font-bold flex items-center gap-2 ${message.type === 'success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${message.type === 'success' ? 'bg-green-600' : 'bg-red-600 animate-pulse'}`} />
                          {message.text}
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em] ml-1">Nama Baru</label>
                          <div className="bg-gray-50 p-4 rounded-2xl flex items-center gap-3 border border-gray-100 focus-within:border-black transition-all">
                            <UserIcon size={18} className="text-gray-400" />
                            <input
                              className="bg-transparent flex-1 outline-none text-sm font-medium"
                              value={editData.name}
                              onChange={e => setEditData({...editData, name: e.target.value})}
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em] ml-1">Email Baru</label>
                          <div className="bg-gray-50 p-4 rounded-2xl flex items-center gap-3 border border-gray-100 focus-within:border-black transition-all">
                            <Mail size={18} className="text-gray-400" />
                            <input
                              className="bg-transparent flex-1 outline-none text-sm font-medium"
                              value={editData.email}
                              onChange={e => setEditData({...editData, email: e.target.value})}
                            />
                          </div>
                        </div>

                        <div className="space-y-2 md:col-span-2">
                          <label className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em] ml-1">Ganti Password (Opsional)</label>
                          <div className="bg-gray-50 p-4 rounded-2xl flex items-center gap-3 border border-gray-100 focus-within:border-black transition-all">
                            <Key size={18} className="text-gray-400" />
                            <input
                              type="text"
                              placeholder="Masukkan password baru untuk mengganti"
                              className="bg-transparent flex-1 outline-none text-sm font-medium"
                              value={editData.password}
                              onChange={e => setEditData({...editData, password: e.target.value})}
                            />
                          </div>
                          <p className="text-[9px] text-gray-400 font-medium px-2">Kosongkan jika tidak ingin mengganti password. (Dibuat terlihat sesuai permintaan)</p>
                        </div>
                      </div>

                      <button
                        onClick={handleSave}
                        disabled={loading}
                        className="w-full bg-black text-white py-4 rounded-2xl font-bold text-sm shadow-xl shadow-black/10 hover:bg-gray-900 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                      >
                        {loading ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Save size={18} />
                        )}
                        Simpan Perubahan
                      </button>
                    </div>
                  )}
                </div>
              );
            }) : (
              <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
                <div className={`w-20 h-20 rounded-full flex items-center justify-center ${error ? 'bg-red-50 text-red-500' : 'bg-gray-50 text-gray-300'}`}>
                  {error ? <AlertCircle size={40} /> : <Users size={40} />}
                </div>
                <div className="space-y-1">
                  <p className={`font-bold ${error ? 'text-red-600' : 'text-gray-400'}`}>
                    {error || 'Belum ada akun terdaftar.'}
                  </p>
                  <p className="text-xs text-gray-400 max-w-[240px]">
                    {error ? 'Sinkronisasi gagal karena masalah perizinan atau koneksi.' : 'Gunakan tombol di atas untuk mendaftarkan akun baru atau minta teman Anda bergabung.'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Info Seksi Tambah User */}
      <div className="bg-gradient-to-br from-indigo-600 to-black p-8 rounded-[40px] text-white shadow-xl shadow-indigo-500/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <UserPlus size={120} />
        </div>
        <div className="relative z-10 flex flex-col sm:flex-row items-center gap-6">
          <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center">
            <UserPlus size={32} />
          </div>
          <div>
            <h4 className="text-xl font-black tracking-tight mb-2">Ingin menambah teman?</h4>
            <p className="text-indigo-100/70 text-sm font-medium max-w-md">
              Anda tidak perlu membuatkan akun secara manual. Minta teman Anda membuka aplikasi ini dan pilih menu <b>Daftar</b> di halaman awal. Mereka akan otomatis muncul di daftar ini setelah login.
            </p>
          </div>
        </div>
      </div>

      {/* Register Modal */}
      {showAddAccount && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[40px] w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className="bg-black text-white p-2 rounded-xl">
                  <UserPlus size={20} />
                </div>
                <h2 className="text-xl font-black tracking-tight">Daftarkan Akun Baru</h2>
              </div>
              <button 
                onClick={() => setShowAddAccount(false)}
                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleRegister} className="p-8 space-y-6">
              {regError && (
                <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-[11px] font-bold border border-red-100 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-red-600 rounded-full animate-pulse" />
                  {regError}
                </div>
              )}

              {regSuccess && (
                <div className="p-4 bg-green-50 text-green-600 rounded-2xl text-[11px] font-bold border border-green-100 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-green-600 rounded-full" />
                  Pendaftaran Berhasil! Mengalihkan...
                </div>
              )}

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Nama Lengkap</label>
                  <div className="bg-gray-50 p-4 rounded-2xl flex items-center gap-3 border border-gray-100 focus-within:border-black transition-all">
                    <UserIcon size={18} className="text-gray-400" />
                    <input
                      required
                      type="text"
                      className="bg-transparent flex-1 outline-none text-sm font-medium"
                      placeholder="Masukkan nama lengkap"
                      value={regData.name}
                      onChange={e => setRegData({...regData, name: e.target.value})}
                      disabled={regLoading || regSuccess}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Email (Opsional)</label>
                  <div className="bg-gray-50 p-4 rounded-2xl flex items-center gap-3 border border-gray-100 focus-within:border-black transition-all">
                    <Mail size={18} className="text-gray-400" />
                    <input
                      type="email"
                      className="bg-transparent flex-1 outline-none text-sm font-medium"
                      placeholder="Kosongkan untuk login tanpa email"
                      value={regData.email}
                      onChange={e => setRegData({...regData, email: e.target.value})}
                      disabled={regLoading || regSuccess}
                    />
                  </div>
                  {!regData.email && regData.name && (
                    <p className="text-[9px] text-gray-400 font-medium px-2 italic">
                      * Akun akan didaftarkan menggunakan ID unik sistem.
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Password</label>
                  <div className="bg-gray-50 p-4 rounded-2xl flex items-center gap-3 border border-gray-100 focus-within:border-black transition-all group/pass">
                    <Lock size={18} className="text-gray-400" />
                    <input
                      required
                      type={showRegPassword ? "text" : "password"}
                      className="bg-transparent flex-1 outline-none text-sm font-medium"
                      placeholder="Minimal 6 karakter"
                      value={regData.password}
                      onChange={e => setRegData({...regData, password: e.target.value})}
                      disabled={regLoading || regSuccess}
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPassword(!showRegPassword)}
                      className="p-1 hover:bg-gray-200 rounded-lg transition-colors text-gray-400 hover:text-black"
                    >
                      {showRegPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                <p className="text-[10px] text-gray-500 font-medium leading-relaxed italic">
                  * Setelah berhasil mendaftar, Anda akan otomatis masuk dengan akun baru tersebut dan sesi saat ini berakhir.
                </p>
              </div>

              <button
                type="submit"
                disabled={regLoading || regSuccess}
                className="w-full bg-black text-white py-5 rounded-2xl font-bold text-sm shadow-xl shadow-black/10 hover:bg-gray-900 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
              >
                {regLoading ? <Loader2 size={18} className="animate-spin" /> : <UserPlus size={18} />}
                {regSuccess ? 'Berhasil!' : 'Daftarkan & Masuk'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
