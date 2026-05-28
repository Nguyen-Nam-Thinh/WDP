import { useState } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, Mail, Lock, User, Phone, ChevronDown, Eye, EyeOff } from 'lucide-react';
import { useAuth, UserRole } from '../hooks/useAuth';
import { authApi } from '../api/auth';

import { toast } from 'sonner';

export function Register() {
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const role: UserRole = 'spectator';
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async () => {
    if (!email || !password || !fullName) {
      toast.error('Vui lòng điền đầy đủ thông tin bắt buộc');
      setError('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const data = await authApi.register({
        email, password, fullName, phone, role
      });
      login(data.user, data.accessToken);
      toast.success('Đăng ký tài khoản thành công!');
      const rolePath = data.user.role === 'owner' ? 'horse-owner' : data.user.role === 'spectator' ? '' : data.user.role;
      navigate(`/${rolePath}`);
    } catch (err: any) {
      const errorMsg = err.message || 'Đăng ký thất bại';
      toast.error(errorMsg);
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#0a0a0a] font-sans">
      <style>{`
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(50px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>

      {/* Branding Section - Left */}
      <div 
        className="hidden lg:flex lg:w-1/2 relative items-end justify-center overflow-hidden pb-12 px-12"
        style={{ animation: 'fadeIn 1s ease-out forwards' }}
      >
        <div className="absolute inset-0 bg-[url('/images/register-bg.png')] bg-cover bg-center transition-transform duration-[10000ms] hover:scale-105"></div>
        {/* Soft edge gradient to blend with the form on the right */}
        <div className="absolute inset-0 bg-gradient-to-l from-[#0a0a0a] via-transparent to-transparent opacity-90"></div>
        {/* Bottom gradient just enough to make the text readable */}
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/40 to-transparent"></div>
        
        <div className="relative z-10 w-full text-left">
          <div className="flex items-center gap-3 mb-6">
             <img src="/images/logo.png" alt="RaceTrack Pro" className="w-12 h-12 object-contain" />
             <span className="text-white font-bold tracking-wide text-lg drop-shadow-md">RaceTrack Pro</span>
          </div>
          <h1 className="text-2xl xl:text-3xl font-bold text-white mb-2 leading-tight drop-shadow-lg">
            Khởi đầu đam mê<br/>cùng RaceTrack Pro
          </h1>
          <p className="text-sm text-slate-300 max-w-md drop-shadow-md">
            Tham gia ngay cộng đồng để giao lưu, quản lý chiến mã và không bỏ lỡ giải đấu.
          </p>
        </div>
      </div>

      {/* Form Section - Right */}
      <div 
        className="w-full lg:w-1/2 flex flex-col justify-center p-6 lg:p-8 relative z-10 overflow-y-auto"
        style={{ animation: 'slideInRight 0.6s ease-out forwards' }}
      >
        {/* Dynamic Background Effects for Mobile */}
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#FFDE42] rounded-full mix-blend-screen filter blur-[150px] opacity-10 lg:hidden"></div>

        <div className="w-full max-w-md mx-auto relative flex flex-col justify-center min-h-[calc(100vh-3rem)] lg:min-h-0">
          <button
            onClick={() => navigate('/')}
            className="group flex items-center gap-2 text-slate-400 hover:text-[#FFDE42] mb-4 transition-colors text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Về Trang Chủ
          </button>

          <div className="mb-6 ">
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-2">Tạo tài khoản</h2>
            <p className="text-sm text-slate-400">Điền thông tin để gia nhập cộng đồng</p>
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
          </div>

          <div className="space-y-3">

            {/* Name */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Họ và tên</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <User className="h-4 w-4 text-slate-500" />
                </div>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Nguyễn Văn A"
                  className="block w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#FFDE42]/50 focus:border-[#FFDE42] transition-all"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-slate-500" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@example.com"
                  className="block w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#FFDE42]/50 focus:border-[#FFDE42] transition-all"
                />
              </div>
            </div>
            
            {/* Phone */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Số điện thoại</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Phone className="h-4 w-4 text-slate-500" />
                </div>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+84 123 456 789"
                  className="block w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#FFDE42]/50 focus:border-[#FFDE42] transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Mật khẩu</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-slate-500" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-10 pr-10 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#FFDE42]/50 focus:border-[#FFDE42] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              onClick={handleRegister}
              disabled={loading}
              className="w-full relative group overflow-hidden rounded-xl bg-[#FFDE42] text-black font-bold py-2.5 mt-4 transition-all hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(255,222,66,0.4)] active:scale-[0.98] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="relative z-10 text-sm">{loading ? 'Đang Xử Lý...' : 'Tạo Tài Khoản'}</span>
            </button>

            <div className="relative py-3">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-3 text-slate-500 uppercase tracking-wider bg-[#0a0a0a]">
                  Hoặc đăng ký với
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors text-white font-medium text-sm group cursor-pointer">
                <svg className="w-4 h-4 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.16v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.16C1.43 8.55 1 10.22 1 12s.43 3.45 1.16 4.93l2.85-2.22.83-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.16 7.07l3.68 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Google
              </button>
              <button className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-[#1877F2]/20 hover:border-[#1877F2]/50 transition-all text-white font-medium text-sm group cursor-pointer">
                <svg className="w-4 h-4 text-[#1877F2] group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                Facebook
              </button>
            </div>

            <div className="mt-4 text-center">
              <span className="text-slate-400 text-sm">Đã có tài khoản? </span>
              <button
                onClick={() => navigate('/login')}
                className=" cursor-pointer text-[#FFDE42] hover:text-amber-400 font-semibold transition-colors text-sm"
              >
                Đăng nhập ngay
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
