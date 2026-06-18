import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { ChevronDown, User as UserIcon, LogOut, Shield, Home, Trophy } from 'lucide-react';
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

  const avatarText = user.avatar || user.fullName.substring(0, 2).toUpperCase();
  const level = user.level || 'Thành Viên Vàng';
  const balance = user.balance || '$0';

  const allMenuItems = [
    { icon: Home, label: 'Trang Chủ', sub: 'Trở về màn hình chính', color: 'text-secondary', action: () => { setProfileMenuOpen(false); navigate('/'); }, showFor: ['spectator'] },
    { icon: Trophy, label: 'Khu Vực Khán Giả', sub: 'Xem bảng điều khiển', color: 'text-primary', action: () => { setProfileMenuOpen(false); navigate('/spectator'); }, showFor: ['spectator'] },
    { icon: UserIcon, label: 'Hồ Sơ Cá Nhân', sub: 'Thông tin & cài đặt tài khoản', color: 'text-primary', action: () => { setProfileMenuOpen(false); navigate('/spectator/profile'); } },
  ];

  const menuItems = allMenuItems.filter(item => !item.showFor || item.showFor.includes(user.role));

  return (
    <div className="relative" ref={profileMenuRef}>
      <button
        type="button"
        onClick={() => setProfileMenuOpen(!profileMenuOpen)}
        className="flex items-center gap-3 bg-card hover:bg-muted border border-border hover:border-primary/40 px-3 py-2 transition-all group"
      >
        {/* Avatar */}
        <div className="relative">
          <div className="w-8 h-8 bg-primary flex items-center justify-center text-sm font-bold text-primary-foreground overflow-hidden">
            {user.avatarUrl
              ? <img src={user.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
              : avatarText}
          </div>
          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-primary rounded-full border-2 border-background"></div>
        </div>
        <div className="text-left hidden lg:block">
          <div className="text-foreground text-sm font-semibold leading-none">{user.fullName}</div>
        </div>
        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${profileMenuOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Panel */}
      {profileMenuOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-card border border-border shadow-lg z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Header */}
          <div className="p-5 bg-muted/40 border-b border-border">
            <div className="flex items-center gap-4 mb-4">
              <div className="relative">
                <div className="w-14 h-14 bg-primary flex items-center justify-center text-xl font-bold text-primary-foreground overflow-hidden">
                  {user.avatarUrl
                    ? <img src={user.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                    : avatarText}
                </div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center border-2 border-card">
                  <Shield className="w-2.5 h-2.5 text-primary-foreground" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-foreground font-bold text-base">{user.fullName}</span>
                </div>
                <div className="mt-1.5">
                  <span className="text-xs bg-gold/15 text-[#8F7318] px-2 py-0.5 rounded-full font-semibold border border-gold/40">{level}</span>
                </div>
              </div>
            </div>
            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-background border border-border p-2.5 text-center">
                <div className="text-foreground font-bold text-sm tabular-nums">18</div>
                <div className="text-muted-foreground text-xs mt-0.5">Tổng Cược</div>
              </div>
              <div className="bg-background border border-border p-2.5 text-center">
                <div className="text-primary font-bold text-sm tabular-nums">67%</div>
                <div className="text-muted-foreground text-xs mt-0.5">Tỷ Lệ Thắng</div>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="p-2">
            {menuItems.map((item, i) => (
              <button
                type="button"
                key={i}
                onClick={item.action}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted transition-all group text-left"
              >
                <div className={`w-9 h-9 bg-muted flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                  <item.icon className={`w-4 h-4 ${item.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-foreground text-sm font-medium">{item.label}</div>
                  <div className="text-muted-foreground text-xs mt-0.5 truncate">{item.sub}</div>
                </div>
              </button>
            ))}
          </div>

          {/* Footer */}
          <div className="p-2 border-t border-border">
            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-destructive/10 transition-all group text-left"
            >
              <div className="w-9 h-9 bg-destructive/10 flex items-center justify-center flex-shrink-0 group-hover:bg-destructive/20 transition-colors">
                <LogOut className="w-4 h-4 text-destructive" />
              </div>
              <div>
                <div className="text-destructive text-sm font-medium">Đăng Xuất</div>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
