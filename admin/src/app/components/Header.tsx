import { Menu, Bell, Settings, LogOut, User, CheckCircle, AlertCircle, Trophy, Clock, Search, ChevronRight } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { useAdminAuth } from '../context/AdminAuthContext';
import { useNavigate, useLocation } from 'react-router';
import { Link } from 'react-router';

interface Notification {
  id: number;
  icon: 'success' | 'warning' | 'info' | 'trophy';
  title: string;
  desc: string;
  time: string;
  read: boolean;
}

const MOCK_NOTIFICATIONS: Notification[] = [
  { id: 1, icon: 'success', title: 'Đã duyệt đăng ký', desc: 'Ngựa Thunder Bolt đã được duyệt vào cuộc đua Cúp Mùa Xuân', time: '5 phút trước', read: false },
  { id: 2, icon: 'trophy', title: 'Kết quả cuộc đua', desc: 'Cuộc đua Vòng Chung Kết đã kết thúc - Xem kết quả ngay', time: '1 giờ trước', read: false },
  { id: 3, icon: 'info', title: 'Trọng tài mới', desc: 'Nguyễn Văn A đã được phân công làm trọng tài cho cuộc đua G1', time: '2 giờ trước', read: false },
  { id: 4, icon: 'warning', title: 'Cuộc đua sắp diễn ra', desc: 'Cuộc đua Cúp Mùa Hè sẽ bắt đầu trong 30 phút', time: '3 giờ trước', read: true },
  { id: 5, icon: 'success', title: 'Giải đấu mới tạo', desc: 'Giải Vô Địch Quốc Gia 2026 đã được tạo thành công', time: 'Hôm qua', read: true },
  { id: 6, icon: 'warning', title: 'Đơn đăng ký chờ duyệt', desc: 'Có 3 đơn đăng ký mới đang chờ duyệt từ chủ ngựa', time: 'Hôm qua', read: true },
];

const NOTIF_ICONS: Record<string, { icon: ReactNode; bg: string }> = {
  success: { icon: <CheckCircle size={16} />, bg: 'bg-emerald-100 text-emerald-600' },
  warning: { icon: <AlertCircle size={16} />, bg: 'bg-amber-100 text-amber-600' },
  info:    { icon: <Clock size={16} />, bg: 'bg-blue-100 text-blue-600' },
  trophy:  { icon: <Trophy size={16} />, bg: 'bg-purple-100 text-purple-600' },
};

const NOTIFS_PER_PAGE = 4;

const routeNameMap: Record<string, string> = {
  '': 'Dashboard',
  'users': 'Người dùng',
  'tournaments': 'Giải đấu',
  'races': 'Chặng đua',
  'registrations': 'Duyệt đăng ký',
  'referees': 'Trọng tài',
  'results': 'Kết quả',
  'bets': 'Cược',
  'rewards': 'Phần thưởng',
};

export default function Header(props: {
  sidebarOpen: string | boolean | undefined;
  setSidebarOpen: (arg0: boolean) => void;
}) {
  const { user, logout } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);
  const [notifPage, setNotifPage] = useState(1);

  const unreadCount = notifications.filter(n => !n.read).length;
  const notifTotalPages = Math.ceil(notifications.length / NOTIFS_PER_PAGE);
  const pagedNotifs = notifications.slice((notifPage - 1) * NOTIFS_PER_PAGE, notifPage * NOTIFS_PER_PAGE);

  const markAllRead = () => setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  const markRead = (id: number) => setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));

  const handleLogout = () => {
    logout();
    setDropdownOpen(false);
    navigate('/login');
  };

  const pathnames = location.pathname.split('/').filter(x => x);

  return (
    <header className="sticky top-0 z-40 flex w-full bg-white border-b border-slate-200">
      <div className="flex flex-grow items-center justify-between h-14 px-4 md:px-6">
        
        {/* Left Side: Hamburger & Breadcrumbs */}
        <div className="flex items-center gap-4">
          <button
            aria-controls="sidebar"
            onClick={(e) => {
              e.stopPropagation();
              props.setSidebarOpen(!props.sidebarOpen);
            }}
            className="z-50 block rounded-sm p-1 hover:bg-slate-100 lg:hidden"
          >
            <Menu className="h-5 w-5 text-slate-600" />
          </button>
          
          <div className="hidden sm:flex items-center text-sm font-bold text-black">
            <Link to="/" className="hover:text-blue-600 transition">Trang chủ</Link>
            {pathnames.map((value, index) => {
              const to = `/${pathnames.slice(0, index + 1).join('/')}`;
              const isLast = index === pathnames.length - 1;
              const name = routeNameMap[value] || value;
              return (
                <div key={to} className="flex items-center">
                  <ChevronRight size={16} className="mx-1 text-slate-400" />
                  {isLast ? (
                    <span className="text-black font-normal">{name}</span>
                  ) : (
                    <Link to={to} className="hover:text-blue-600 transition">{name}</Link>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side: Search, Notifications, User */}
        <div className="flex items-center gap-4 md:gap-6">
          
          {/* Global Search */}
          <div className="hidden md:flex relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
            <input 
              type="text" 
              placeholder="Tìm kiếm..." 
              className="pl-9 pr-4 py-1.5 w-64 bg-slate-50 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
               <span className="text-[10px] text-slate-400 font-semibold px-1.5 py-0.5 rounded border border-slate-200 bg-white">⌘K</span>
            </div>
          </div>

          <div className="h-6 w-px bg-slate-200 hidden md:block"></div>

          <div className="flex items-center gap-3">
            {/* Notification */}
            <div className="relative">
              <button
                onClick={() => { setNotifOpen(o => !o); setDropdownOpen(false); }}
                className="relative flex h-8 w-8 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-blue-600 transition"
              >
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 z-10 flex h-2 w-2 rounded-full bg-red-500"></span>
                )}
                <Bell size={18} />
              </button>

              {notifOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
                  <div className="absolute right-0 mt-3 z-50 w-80 rounded-lg border border-slate-200 bg-white shadow-lg overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/50">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-extrabold text-black">Thông báo</span>
                        {unreadCount > 0 && (
                          <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-blue-100 px-1.5 text-[10px] font-bold text-blue-600">
                            {unreadCount} mới
                          </span>
                        )}
                      </div>
                      <button onClick={markAllRead} className="text-xs text-blue-600 hover:text-blue-700 font-medium transition">
                        Đọc tất cả
                      </button>
                    </div>

                    <div className="divide-y divide-slate-100">
                      {pagedNotifs.length === 0 ? (
                        <div className="py-8 text-center text-sm text-slate-500">Không có thông báo</div>
                      ) : pagedNotifs.map(notif => {
                        const style = NOTIF_ICONS[notif.icon] ?? NOTIF_ICONS.info;
                        return (
                          <div
                            key={notif.id}
                            onClick={() => markRead(notif.id)}
                            className={`flex gap-3 px-4 py-3 cursor-pointer transition hover:bg-slate-50 ${!notif.read ? 'bg-blue-50/30' : ''}`}
                          >
                            <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${style.bg}`}>
                              {style.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-1">
                                <p className={`text-sm font-extrabold leading-tight ${!notif.read ? 'text-black' : 'text-slate-600'}`}>
                                  {notif.title}
                                </p>
                                {!notif.read && <span className="mt-1 flex h-2 w-2 shrink-0 rounded-full bg-blue-500" />}
                              </div>
                              <p className="mt-1 text-xs text-slate-500 line-clamp-2">{notif.desc}</p>
                              <p className="mt-1.5 text-[10px] font-medium text-slate-400">{notif.time}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {notifTotalPages > 1 && (
                      <div className="flex items-center justify-between px-4 py-2 border-t border-slate-100 bg-slate-50/50">
                        <button
                          onClick={() => setNotifPage(p => Math.max(1, p - 1))}
                          disabled={notifPage === 1}
                          className="text-xs font-medium text-slate-500 hover:text-slate-800 disabled:opacity-40 transition"
                        >
                          ← Trước
                        </button>
                        <span className="text-[10px] text-slate-400">{notifPage} / {notifTotalPages}</span>
                        <button
                          onClick={() => setNotifPage(p => Math.min(notifTotalPages, p + 1))}
                          disabled={notifPage >= notifTotalPages}
                          className="text-xs font-medium text-slate-500 hover:text-slate-800 disabled:opacity-40 transition"
                        >
                          Sau →
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* User Dropdown */}
            <div className="relative">
              <button
                onClick={() => { setDropdownOpen(!dropdownOpen); setNotifOpen(false); }}
                className="flex items-center gap-2 hover:bg-slate-50 rounded-md p-1 transition"
              >
                <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white text-sm font-semibold shadow-sm">
                  {user?.fullName ? user.fullName.charAt(0).toUpperCase() : 'A'}
                </div>
                <div className="hidden md:flex flex-col text-left">
                  <span className="text-sm font-extrabold text-black leading-none mb-1">
                    {user?.fullName || 'Admin User'}
                  </span>
                  <span className="text-[10px] text-slate-500 leading-none">Quản trị viên</span>
                </div>
              </button>

              {dropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)}></div>
                  <div className="absolute right-0 mt-2 w-48 rounded-lg border border-slate-200 bg-white shadow-lg z-50">
                    <div className="px-4 py-3 border-b border-slate-100 md:hidden">
                       <span className="block text-sm font-extrabold text-black">{user?.fullName || 'Admin User'}</span>
                       <span className="block text-xs text-slate-500 mt-0.5">Quản trị viên</span>
                    </div>
                    <ul className="py-1">
                      <li>
                        <button className="flex w-full items-center gap-2 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-blue-600">
                          <User size={16} /> Hồ sơ cá nhân
                        </button>
                      </li>
                      <li>
                        <button className="flex w-full items-center gap-2 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-blue-600">
                          <Settings size={16} /> Cài đặt
                        </button>
                      </li>
                      <li className="border-t border-slate-100 mt-1 pt-1">
                        <button 
                          onClick={handleLogout}
                          className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                        >
                          <LogOut size={16} /> Đăng xuất
                        </button>
                      </li>
                    </ul>
                  </div>
                </>
              )}
            </div>
            
          </div>
        </div>
      </div>
    </header>
  );
}
