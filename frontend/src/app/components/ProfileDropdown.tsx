import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { ChevronDown, User as UserIcon, Wallet, Activity, History, LogOut, Shield, Home, Trophy } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export function ProfileDropdown() {
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  // If there's no user logged in, we shouldn't render the dropdown
  if (!user) return null;

  // Use the user's data or fallback values
  const avatarText = user.avatar || user.fullName.substring(0, 2).toUpperCase();
  const level = user.level || 'Thành Viên Vàng';
  const balance = user.balance || '$0';

  const allMenuItems = [
    { icon: Home, label: 'Trang Chủ', sub: 'Trở về màn hình chính', color: 'text-rose-400', action: () => { setProfileMenuOpen(false); navigate('/'); }, showFor: ['spectator'] },
    { icon: Trophy, label: 'Khu Vực Khán Giả', sub: 'Xem bảng điều khiển', color: 'text-emerald-400', action: () => { setProfileMenuOpen(false); navigate('/spectator'); }, showFor: ['spectator'] },
    { icon: UserIcon, label: 'Hồ Sơ Cá Nhân', sub: 'Thông tin & cài đặt tài khoản', color: 'text-blue-400', action: () => { setProfileMenuOpen(false); navigate('/spectator/profile'); } },
    { icon: Wallet, label: 'Cổng Nạp Xu', sub: '1 xu = 1.000 VND · CK & Ví điện tử', color: 'text-[#FFDE42]', action: () => { setProfileMenuOpen(false); navigate('/spectator/deposit'); } },
    { icon: Activity, label: 'Lịch Sử Cược', sub: 'Xem lại các vé cược của bạn', color: 'text-purple-400', action: () => { setProfileMenuOpen(false); navigate('/spectator/bet-history'); } },
    { icon: History, label: 'Lịch Sử Nạp', sub: 'Theo dõi giao dịch nạp tiền', color: 'text-emerald-400', action: () => { setProfileMenuOpen(false); navigate('/spectator/deposit-history'); } },
  ];

  const menuItems = allMenuItems.filter(item => !item.showFor || item.showFor.includes(user.role));

  return (
    <div className="relative" ref={profileMenuRef}>
      <button
        onClick={() => setProfileMenuOpen(!profileMenuOpen)}
        className="flex items-center gap-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#FFDE42]/40 px-3 py-2 rounded-xl transition-all group"
      >
        {/* Avatar */}
        <div className="relative">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#FFDE42] to-amber-600 flex items-center justify-center text-sm font-bold text-slate-900 shadow-lg">
            {avatarText}
          </div>
          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-slate-950"></div>
        </div>
        <div className="text-left hidden lg:block">
          <div className="text-white text-sm font-semibold leading-none mb-0.5">{user.fullName}</div>
          <div className="text-[#FFDE42] text-xs">{level}</div>
        </div>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${profileMenuOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Panel */}
      {profileMenuOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-slate-950 border border-white/10 rounded-2xl shadow-2xl shadow-black/50 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Header */}
          <div className="p-5 bg-gradient-to-br from-[#FFDE42]/10 to-transparent border-b border-white/5">
            <div className="flex items-center gap-4 mb-4">
              <div className="relative">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#FFDE42] to-amber-600 flex items-center justify-center text-xl font-bold text-slate-900 shadow-xl">
                  {avatarText}
                </div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center border-2 border-slate-900">
                  <Shield className="w-2.5 h-2.5 text-white" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-white font-bold text-base">{user.fullName}</span>
                </div>
                <div className="text-slate-400 text-xs mt-0.5">{user.email}</div>
                <div className="mt-1.5">
                  <span className="text-xs bg-[#FFDE42]/20 text-[#FFDE42] px-2 py-0.5 rounded-full font-semibold border border-[#FFDE42]/30">{level}</span>
                </div>
              </div>
            </div>
            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-slate-800/80 rounded-lg p-2.5 text-center">
                <div className="text-[#FFDE42] font-bold text-sm">{balance}</div>
                <div className="text-slate-500 text-xs mt-0.5">Số Dư</div>
              </div>
              <div className="bg-slate-800/80 rounded-lg p-2.5 text-center">
                <div className="text-white font-bold text-sm">18</div>
                <div className="text-slate-500 text-xs mt-0.5">Tổng Cược</div>
              </div>
              <div className="bg-slate-800/80 rounded-lg p-2.5 text-center">
                <div className="text-emerald-400 font-bold text-sm">67%</div>
                <div className="text-slate-500 text-xs mt-0.5">Tỷ Lệ Thắng</div>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="p-2">
            {menuItems.map((item, i) => (
              <button
                key={i}
                onClick={item.action}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 transition-all group text-left"
              >
                <div className={`w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                  <item.icon className={`w-4 h-4 ${item.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-white text-sm font-medium">{item.label}</div>
                  <div className="text-slate-500 text-xs mt-0.5 truncate">{item.sub}</div>
                </div>
                {/* Remove ChevronRight to save import space or add it back if needed, but simple is fine. */}
              </button>
            ))}
          </div>

          {/* Footer */}
          <div className="p-2 border-t border-white/5">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-500/10 transition-all group text-left"
            >
              <div className="w-9 h-9 rounded-lg bg-red-500/10 flex items-center justify-center flex-shrink-0 group-hover:bg-red-500/20 transition-colors">
                <LogOut className="w-4 h-4 text-red-400" />
              </div>
              <div>
                <div className="text-red-400 text-sm font-medium">Đăng Xuất</div>
                {/* <div className="text-slate-500 text-xs mt-0.5">Thoát khỏi phiên làm việc</div> */}
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
