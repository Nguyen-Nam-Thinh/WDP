import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Mail, Lock, Loader2, Trophy, AlertCircle } from 'lucide-react';
import { useAdminAuth } from '../context/AdminAuthContext';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAdminAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { 
      setError('Vui lòng nhập email và mật khẩu'); 
      return; 
    }
    setLoading(true);
    setError('');
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Đăng nhập thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-slate-50 p-4 font-sans dark:bg-[#121a2f]">
      <div className="w-full max-w-[1000px] rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-[#1c2434] overflow-hidden">
        <div className="flex flex-wrap items-stretch h-full">
          {/* Left Side: Graphic / Branding */}
          <div className="hidden w-full lg:flex lg:w-1/2 bg-blue-50 dark:bg-[#243045] p-12 border-r border-slate-200 dark:border-slate-700 flex-col items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-600 via-transparent to-transparent"></div>
            
            <div className="relative z-10 text-center flex flex-col items-center">
              <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-white p-2 shadow-xl dark:bg-slate-800">
                <img src="/images/logo.png" alt="Logo" className="h-full w-full object-contain" />
              </div>
              <h2 className="mb-3 text-3xl font-bold text-slate-800 dark:text-white leading-tight">
                Hệ Thống Quản Lý <br/> Đua Ngựa Pro
              </h2>
              <p className="text-slate-500 dark:text-slate-400 font-medium text-sm leading-relaxed max-w-[300px]">
                Nền tảng quản lý toàn diện dành cho ban tổ chức giải đua ngựa, quản lý ngựa, jockey, trọng tài.
              </p>
            </div>
            
            {/* Some decoration */}
            <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-blue-100 to-transparent dark:from-[#1c2434] dark:to-transparent opacity-50"></div>
          </div>

          {/* Right Side: Form */}
          <div className="w-full lg:w-1/2 p-6 sm:p-12.5 xl:p-16 flex flex-col justify-center">
            <div className="mb-8 lg:hidden flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white p-1 shadow-md dark:bg-slate-800">
                <img src="/images/logo.png" alt="Logo" className="h-full w-full object-contain" />
              </div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">
                Đua Ngựa Pro Admin
              </h2>
            </div>

            <h2 className="mb-2 text-2xl font-bold text-black dark:text-white sm:text-title-xl2">
              Đăng nhập hệ thống
            </h2>
            <p className="mb-8 text-sm font-medium text-slate-500 dark:text-slate-400">
              Vui lòng đăng nhập bằng tài khoản quản trị viên của bạn.
            </p>

            {error && (
              <div className="mb-6 flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-400">
                <AlertCircle size={20} className="shrink-0" />
                <p className="text-sm font-medium">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="mb-5">
                <label className="mb-2.5 block font-medium text-black dark:text-white">
                  Email
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Nhập email của bạn"
                    className="w-full rounded-lg border border-slate-300 bg-transparent py-3 pl-11 pr-4 outline-none focus:border-blue-500 focus-visible:shadow-none dark:border-slate-600 dark:bg-slate-800 dark:focus:border-blue-500 transition-colors text-black dark:text-white"
                  />
                  <Mail className="absolute left-4 top-3.5 text-slate-400" size={20} />
                </div>
              </div>

              <div className="mb-6">
                <label className="mb-2.5 block font-medium text-black dark:text-white">
                  Mật khẩu
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Nhập mật khẩu"
                    className="w-full rounded-lg border border-slate-300 bg-transparent py-3 pl-11 pr-4 outline-none focus:border-blue-500 focus-visible:shadow-none dark:border-slate-600 dark:bg-slate-800 dark:focus:border-blue-500 transition-colors text-black dark:text-white"
                  />
                  <Lock className="absolute left-4 top-3.5 text-slate-400" size={20} />
                </div>
              </div>

              <div className="mb-6 flex items-center">
                <label htmlFor="remember" className="flex cursor-pointer items-center gap-2">
                  <div className="relative">
                    <input type="checkbox" id="remember" className="sr-only" />
                    <div className="box mr-2 flex h-5 w-5 items-center justify-center rounded border border-slate-300 bg-transparent dark:border-slate-600">
                      <span className="opacity-0">✓</span>
                    </div>
                  </div>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Ghi nhớ đăng nhập</p>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-blue-600 p-3.5 text-white transition hover:bg-blue-700 disabled:opacity-70 disabled:cursor-not-allowed font-medium"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    Đang xử lý...
                  </>
                ) : (
                  'Đăng nhập'
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
