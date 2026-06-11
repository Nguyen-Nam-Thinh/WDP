import { useState } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, Mail, Lock, KeyRound, Eye, EyeOff } from 'lucide-react';
import { authApi } from '../api/auth';
import { toast } from 'sonner';

export function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSendCode = async () => {
    if (!email) {
      setError('Vui lòng nhập email');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await authApi.forgotPassword(email);
      setSuccess('Mã xác nhận đã được gửi đến email của bạn');
      toast.success('Mã xác nhận đã được gửi đến email của bạn');
      setStep(2);
    } catch (err: any) {
      const errorMsg = err.message || 'Lỗi gửi mã xác nhận';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!code) {
      setError('Vui lòng nhập mã xác nhận');
      return;
    }
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const data = await authApi.verifyResetCode(email, code);
      setResetToken(data.resetToken);
      toast.success('Xác nhận thành công!');
      setStep(3);
    } catch (err: any) {
      const errorMsg = err.message || 'Mã xác nhận không hợp lệ';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword || newPassword !== confirmPassword) {
      setError('Mật khẩu không khớp hoặc chưa nhập');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await authApi.resetPassword(resetToken, newPassword);
      setSuccess('Mật khẩu đã được thay đổi thành công');
      toast.success('Mật khẩu đã được thay đổi thành công');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err: any) {
      const errorMsg = err.message || 'Lỗi đổi mật khẩu';
      setError(errorMsg);
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
            onClick={() => navigate('/login')}
            className="group flex items-center gap-2 text-muted-foreground hover:text-primary mb-6 transition-colors text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Quay lại Đăng nhập
          </button>

          <div className="mb-8">
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-foreground tracking-tight mb-2">Quên mật khẩu</h2>
            <p className="text-sm text-muted-foreground">
              {step === 1 && 'Nhập email của bạn để nhận mã xác nhận'}
              {step === 2 && 'Nhập mã xác nhận đã được gửi đến email của bạn'}
              {step === 3 && 'Tạo mật khẩu mới cho tài khoản của bạn'}
            </p>
            {error && <p className="text-destructive text-sm mt-2">{error}</p>}
            {success && <p className="text-primary text-sm mt-2">{success}</p>}
          </div>

          <div className="space-y-4">
            {step === 1 && (
              <>
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

                <button
                  type="button"
                  onClick={handleSendCode}
                  disabled={loading}
                  className="w-full bg-primary text-primary-foreground font-semibold uppercase tracking-wider py-2.5 mt-5 transition-colors hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="text-sm">{loading ? 'Đang Xử Lý...' : 'Gửi Mã Xác Nhận'}</span>
                </button>
              </>
            )}

            {step === 2 && (
              <>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-foreground mb-1.5">Mã Xác Nhận</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <KeyRound className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <input
                      type="text"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      placeholder="Nhập mã 6 chữ số"
                      className="block w-full pl-10 pr-4 py-2.5 bg-card border border-border text-foreground text-sm placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all tracking-widest"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleVerifyCode}
                  disabled={loading}
                  className="w-full bg-primary text-primary-foreground font-semibold uppercase tracking-wider py-2.5 mt-5 transition-colors hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="text-sm">{loading ? 'Đang Xử Lý...' : 'Xác Nhận Mã'}</span>
                </button>
              </>
            )}

            {step === 3 && (
              <>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-foreground mb-1.5">Mật khẩu mới</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Lock className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <input
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="block w-full pl-10 pr-10 py-2.5 bg-card border border-border text-foreground text-sm placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    >
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-foreground mb-1.5">Xác nhận mật khẩu mới</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Lock className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="block w-full pl-10 pr-10 py-2.5 bg-card border border-border text-foreground text-sm placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleResetPassword}
                  disabled={loading}
                  className="w-full bg-primary text-primary-foreground font-semibold uppercase tracking-wider py-2.5 mt-5 transition-colors hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="text-sm">{loading ? 'Đang Xử Lý...' : 'Đổi Mật Khẩu'}</span>
                </button>
              </>
            )}
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
            Khôi phục tài khoản<br/>an toàn và nhanh chóng
          </h1>
          <p className="text-sm text-[#F7F3EA]/90 max-w-md drop-shadow-md">
            Lấy lại quyền truy cập để tiếp tục theo dõi và quản lý các giải đấu đua ngựa chuyên nghiệp.
          </p>
        </div>
      </div>
    </div>
  );
}
