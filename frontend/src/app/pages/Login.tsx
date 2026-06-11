import { useState } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { authApi } from '../api/auth';

import { toast } from 'sonner';

export function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      toast.error('Vui lòng nhập email và mật khẩu');
      return;
    }
    setLoading(true);
    try {
      const data = await authApi.login(email, password);

      if (data.user.role === 'admin') {
        toast.error('Tài khoản Admin vui lòng đăng nhập tại Admin Portal.');
        return;
      }

      login(data.user, data.accessToken, data.refreshToken);
      toast.success('Đăng nhập thành công! Chào mừng ' + data.user.fullName);

      const rolePath = data.user.role === 'owner' ? 'horse-owner' : data.user.role === 'spectator' ? '' : data.user.role;
      navigate(`/${rolePath}`);
    } catch (err: any) {
      const errorMsg = 'Thông tin đăng nhập không chính xác. Vui lòng kiểm tra lại email và mật khẩu.';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-background font-sans">
      <style>{`
        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(-50px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>

      {/* Form Section - Left */}
      <div
        className="w-full lg:w-1/2 flex flex-col justify-center p-6 lg:p-8 relative z-10"
        style={{ animation: 'slideInLeft 0.6s ease-out forwards' }}
      >
        <div className="w-full max-w-md mx-auto relative flex flex-col justify-center min-h-[calc(100vh-3rem)] lg:min-h-0">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="group flex items-center gap-2 text-muted-foreground hover:text-primary mb-6 transition-colors text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Về Trang Chủ
          </button>

          <div className="mb-8">
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-foreground tracking-tight mb-2">Chào mừng trở lại</h2>
            <p className="text-sm text-muted-foreground">Đăng nhập vào tài khoản The Paddock của bạn</p>
          </div>

          <div className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-foreground mb-1.5">Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@example.com"
                  className="block w-full pl-10 pr-4 py-2.5 bg-card border border-border text-foreground text-sm placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-foreground mb-1.5">Mật khẩu</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-10 pr-10 py-2.5 bg-card border border-border text-foreground text-sm placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <div className="flex justify-end mt-1.5">
                <button
                  type="button"
                  onClick={() => navigate('/forgot-password')}
                  className="text-xs text-secondary hover:text-secondary/80 transition-colors cursor-pointer"
                >
                  Quên mật khẩu?
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogin}
              disabled={loading}
              className="w-full bg-primary text-primary-foreground font-semibold uppercase tracking-wider py-2.5 mt-5 transition-colors hover:bg-primary/90 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="text-sm">{loading ? 'Đang Xử Lý...' : 'Đăng Nhập'}</span>
            </button>

            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-3 text-muted-foreground uppercase tracking-wider bg-background">
                  Hoặc tiếp tục với
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button type="button" className="flex items-center justify-center gap-2 py-2.5 border border-border bg-card hover:bg-muted transition-colors text-foreground font-medium text-sm group cursor-pointer">
                <svg className="w-4 h-4 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.16v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.16C1.43 8.55 1 10.22 1 12s.43 3.45 1.16 4.93l2.85-2.22.83-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.16 7.07l3.68 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Google
              </button>
              <button type="button" className="flex items-center justify-center gap-2 py-2.5 border border-border bg-card hover:bg-muted transition-colors text-foreground font-medium text-sm group cursor-pointer">
                <svg className="w-4 h-4 text-[#1877F2] group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                Facebook
              </button>
            </div>

            <div className="mt-6 text-center">
              <span className="text-muted-foreground text-sm">Chưa có tài khoản? </span>
              <button
                type="button"
                onClick={() => navigate('/register')}
                className="text-secondary hover:text-secondary/80 font-semibold transition-colors text-sm cursor-pointer"
              >
                Đăng ký ngay
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Branding Section - Right */}
      <div
        className="hidden lg:flex lg:w-1/2 relative items-end justify-center overflow-hidden pb-12 px-12"
        style={{ animation: 'fadeIn 1s ease-out forwards' }}
      >
        <div className="absolute inset-0 bg-[url('/images/login-bg.png')] bg-cover bg-center transition-transform duration-[10000ms] hover:scale-105"></div>
        {/* Soft edge gradient to blend with the form on the left */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#F7F3EA] via-transparent to-transparent opacity-90"></div>
        {/* Bottom gradient just enough to make the text readable */}
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#1F3D2B] via-[#1F3D2B]/40 to-transparent"></div>

        <div className="relative z-10 w-full text-left">
          <div className="flex items-center gap-3 mb-6">
             <img src="/images/logo.png" alt="The Paddock" className="w-12 h-12 object-contain" />
             <span className="font-serif text-white font-bold tracking-wide text-lg drop-shadow-md">The Paddock</span>
          </div>
          <h1 className="font-serif text-2xl xl:text-3xl font-bold text-white mb-2 leading-tight drop-shadow-lg">
            Trải nghiệm đua ngựa<br/>đẳng cấp quốc tế
          </h1>
          <p className="text-sm text-[#F7F3EA]/90 max-w-md drop-shadow-md">
            Nền tảng quản lý và theo dõi đua ngựa chuyên nghiệp. Cập nhật kết quả trực tiếp và thống kê chi tiết.
          </p>
        </div>
      </div>
    </div>
  );
}
