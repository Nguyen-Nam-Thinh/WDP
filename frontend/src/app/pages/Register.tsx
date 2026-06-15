import { useState } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, Mail, Lock, User, Phone, Eye, EyeOff } from 'lucide-react';
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
        fullName,
        email,
        phone,
        password,
        role,
      });
      login(data.user, data.accessToken, data.refreshToken);
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
    <div className="min-h-screen flex bg-background font-sans">
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
        <div className="absolute inset-0 bg-gradient-to-l from-[#F7F3EA] via-transparent to-transparent opacity-90"></div>
        {/* Bottom gradient just enough to make the text readable */}
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#1F3D2B] via-[#1F3D2B]/40 to-transparent"></div>

        <div className="relative z-10 w-full text-left">
          <div className="flex items-center gap-3 mb-6">
             <img src="/images/logo.png" alt="The Paddock" className="w-12 h-12 object-contain" />
             <span className="font-serif text-white font-bold tracking-wide text-lg drop-shadow-md">The Paddock</span>
          </div>
          <h1 className="font-serif text-2xl xl:text-3xl font-bold text-white mb-2 leading-tight drop-shadow-lg">
            Khởi đầu đam mê<br/>cùng The Paddock
          </h1>
          <p className="text-sm text-[#F7F3EA]/90 max-w-md drop-shadow-md">
            Tham gia ngay cộng đồng để giao lưu, quản lý chiến mã và không bỏ lỡ giải đấu.
          </p>
        </div>
      </div>

      {/* Form Section - Right */}
      <div
        className="w-full lg:w-1/2 flex flex-col justify-center p-6 lg:p-8 relative z-10 overflow-y-auto"
        style={{ animation: 'slideInRight 0.6s ease-out forwards' }}
      >
        <div className="w-full max-w-md mx-auto relative flex flex-col justify-center min-h-[calc(100vh-3rem)] lg:min-h-0">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="group flex items-center gap-2 text-muted-foreground hover:text-primary mb-4 transition-colors text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Về Trang Chủ
          </button>

          <div className="mb-6">
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-foreground tracking-tight mb-2">Tạo tài khoản</h2>
            <p className="text-sm text-muted-foreground">Điền thông tin để gia nhập cộng đồng</p>
            {error && <p className="text-destructive text-sm mt-2">{error}</p>}
          </div>

          <div className="space-y-3">

            {/* Name */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-foreground mb-1">Họ và tên</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <User className="h-4 w-4 text-muted-foreground" />
                </div>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Nguyễn Văn A"
                  className="block w-full pl-10 pr-4 py-2.5 bg-card border border-border text-foreground text-sm placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-foreground mb-1">Email</label>
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

            {/* Phone */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-foreground mb-1">Số điện thoại</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                </div>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+84 123 456 789"
                  className="block w-full pl-10 pr-4 py-2.5 bg-card border border-border text-foreground text-sm placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-foreground mb-1">Mật khẩu</label>
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
            </div>

            <button
              type="button"
              onClick={handleRegister}
              disabled={loading}
              className="w-full bg-primary text-primary-foreground font-semibold uppercase tracking-wider py-2.5 mt-4 transition-colors hover:bg-primary/90 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="text-sm">{loading ? 'Đang Xử Lý...' : 'Tạo Tài Khoản'}</span>
            </button>


            <div className="mt-4 text-center">
              <span className="text-muted-foreground text-sm">Đã có tài khoản? </span>
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="cursor-pointer text-secondary hover:text-secondary/80 font-semibold transition-colors text-sm"
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
