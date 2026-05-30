
import { useState, FormEvent } from 'react';
import { LogIn, UserPlus, Mail, Lock, User as UserIcon, LayoutDashboard, Chrome, Eye, EyeOff } from 'lucide-react';
import { login, loginEmail, registerEmail } from '../lib/firebase';
import { translateFirebaseError } from '../lib/errorUtils';

export default function LoginView() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (mode === 'login') {
        await loginEmail(email, password);
      } else {
        await registerEmail(email, password, name);
      }
    } catch (err: any) {
      setError(translateFirebaseError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      await login();
    } catch (err: any) {
      setError(translateFirebaseError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F9F9FB] p-4 font-sans">
      <div className="max-w-md w-full animate-in fade-in zoom-in-95 duration-500">
        <div className="bg-white p-10 rounded-[40px] shadow-2xl border border-gray-100">
          <div className="text-center mb-10">
            <div className="w-20 h-20 bg-black rounded-3xl mx-auto mb-6 flex items-center justify-center text-white rotate-6 hover:rotate-0 transition-transform shadow-lg">
              <LayoutDashboard size={40} />
            </div>
            <h1 className="text-4xl font-extrabold mb-2 tracking-tighter">AturDuit</h1>
            <p className="text-gray-400 font-medium leading-relaxed">
              {mode === 'login' ? 'Selamat datang kembali!' : 'Buat akun barumu sekarang.'}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-2xl text-[11px] font-bold border border-red-100 flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-red-600 rounded-full animate-pulse" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div className="bg-gray-50 p-4 rounded-2xl flex items-center gap-3 border border-gray-100 focus-within:border-black transition-all">
                <UserIcon size={18} className="text-gray-400" />
                <input
                  type="text"
                  placeholder="Nama Lengkap"
                  className="bg-transparent flex-1 outline-none text-sm font-medium"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                />
              </div>
            )}
            
            <div className="bg-gray-50 p-4 rounded-2xl flex items-center gap-3 border border-gray-100 focus-within:border-black transition-all">
              <Mail size={18} className="text-gray-400" />
              <input
                type="email"
                placeholder="Email"
                className="bg-transparent flex-1 outline-none text-sm font-medium"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="bg-gray-50 p-4 rounded-2xl flex items-center gap-3 border border-gray-100 focus-within:border-black transition-all">
              <Lock size={18} className="text-gray-400" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                className="bg-transparent flex-1 outline-none text-sm font-medium"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="p-1 hover:bg-gray-200 rounded-lg transition-colors text-gray-400 hover:text-black"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-black text-white py-4 rounded-2xl font-bold text-sm hover:bg-gray-900 transition-all flex items-center justify-center gap-3 active:scale-95 shadow-xl shadow-black/10 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                mode === 'login' ? <LogIn size={18} /> : <UserPlus size={18} />
              )}
              {mode === 'login' ? 'Masuk' : 'Daftar Sekarang'}
            </button>
          </form>

          <div className="mt-8 relative text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-100"></div>
            </div>
            <span className="relative bg-white px-4 text-gray-400 text-[10px] font-black uppercase tracking-widest">
              Atau
            </span>
          </div>

          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full mt-8 bg-white text-gray-600 py-4 rounded-2xl font-bold text-sm border-2 border-gray-100 hover:border-black hover:text-black transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
          >
            <Chrome size={18} />
            Lanjutkan dengan Google
          </button>

          <p className="mt-10 text-center text-sm font-medium text-gray-400">
            {mode === 'login' ? 'Belum punya akun?' : 'Sudah punya akun?'}
            <button
              onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
              className="ml-2 text-black font-black hover:underline"
            >
              {mode === 'login' ? 'Daftar' : 'Masuk'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
