import { useEffect, useRef } from 'react';
import { NavLink, useLocation } from 'react-router';
import {
  LayoutDashboard,
  Users,
  Trophy,
  Flag,
  FileCheck,
  UserCheck,
  Medal,
  Wallet,
  ChevronLeft,
  Gift,
} from 'lucide-react';

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (arg: boolean) => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (arg: boolean) => void;
}

const menuItems = [
  { path: '/dashboard', label: 'Tổng quan', icon: LayoutDashboard },
  { path: '/users', label: 'Người dùng', icon: Users },
  { path: '/tournaments', label: 'Giải đấu', icon: Trophy },
  { path: '/races', label: 'Chặng đua', icon: Flag },
  { path: '/registrations', label: 'Duyệt đăng ký', icon: FileCheck },
  { path: '/referees', label: 'Trọng tài', icon: UserCheck },
  { path: '/results', label: 'Kết quả', icon: Medal },
  { path: '/bets', label: 'Quản lý dự đoán', icon: Wallet },
  { path: '/rewards', label: 'Phần thưởng', icon: Gift },
];

export default function Sidebar({ sidebarOpen, setSidebarOpen, sidebarCollapsed, setSidebarCollapsed }: SidebarProps) {
  const location = useLocation();
  const { pathname } = location;

  const trigger = useRef<any>(null);
  const sidebar = useRef<any>(null);

  // close on click outside on mobile
  useEffect(() => {
    const clickHandler = ({ target }: MouseEvent) => {
      if (!sidebar.current || !trigger.current) return;
      if (
        !sidebarOpen ||
        sidebar.current.contains(target) ||
        trigger.current.contains(target)
      )
        return;
      setSidebarOpen(false);
    };
    document.addEventListener('click', clickHandler);
    return () => document.removeEventListener('click', clickHandler);
  });

  return (
    <aside
      ref={sidebar}
      className={`absolute left-0 top-0 z-50 flex h-screen flex-col overflow-y-hidden bg-white border-r border-slate-200 duration-300 ease-linear lg:static lg:translate-x-0 dark:bg-[#1c2434] dark:border-slate-700 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } ${sidebarCollapsed ? 'w-[80px]' : 'w-[280px]'}`}
    >
      {/* SIDEBAR HEADER */}
      <div className={`flex items-center justify-between gap-2 py-[22px] lg:py-[26px] ${sidebarCollapsed ? 'px-4 flex-col' : 'px-6'}`}>
        <NavLink to="/dashboard" className={`flex items-center gap-3 ${sidebarCollapsed ? 'justify-center' : ''}`}>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded bg-white p-1 shadow-md dark:bg-slate-800">
            <img src="/images/logo.png" alt="Logo" className="h-full w-full object-contain" />
          </div>
          {!sidebarCollapsed && (
            <div>
              <h1 className="text-xl font-bold text-slate-800 dark:text-white leading-none tracking-tight whitespace-nowrap">Đua Ngựa Pro</h1>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1 whitespace-nowrap">Admin Dashboard</p>
            </div>
          )}
        </NavLink>

        {/* Mobile Close Button */}
        <button
          ref={trigger}
          onClick={() => setSidebarOpen(false)}
          className="block lg:hidden text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
        >
          <ChevronLeft size={24} />
        </button>
        
        {/* Desktop Collapse Button */}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className={`hidden lg:block text-slate-400 hover:text-blue-600 dark:text-slate-500 dark:hover:text-white transition-transform ${sidebarCollapsed ? 'rotate-180 mt-4' : ''}`}
        >
          <ChevronLeft size={24} />
        </button>
      </div>
      {/* SIDEBAR HEADER */}

      <div className="no-scrollbar flex flex-col overflow-y-auto duration-300 ease-linear mt-2">
        {/* Sidebar Menu */}
        <nav className={`px-4 lg:px-6 ${sidebarCollapsed ? 'px-2 lg:px-2' : ''}`}>
          {/* Menu Group */}
          <div>
            {!sidebarCollapsed && (
              <h3 className="mb-4 ml-4 text-xs font-semibold text-slate-400 uppercase tracking-widest whitespace-nowrap">
                Menu Chính
              </h3>
            )}

            <ul className="mb-6 flex flex-col gap-1.5">
              {menuItems.map((item, index) => {
                const isActive = pathname.includes(item.path);
                const Icon = item.icon;
                return (
                  <li key={index}>
                    <NavLink
                      to={item.path}
                      className={`group relative flex items-center gap-3 rounded-lg py-2.5 font-medium duration-300 ease-in-out ${
                        isActive
                          ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-500'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
                      } ${sidebarCollapsed ? 'justify-center px-0' : 'px-4'}`}
                      title={sidebarCollapsed ? item.label : undefined}
                    >
                      <Icon size={20} className={`shrink-0 ${isActive ? 'text-blue-600 dark:text-blue-500' : 'text-slate-500 group-hover:text-slate-900 dark:text-slate-400 dark:group-hover:text-white'}`} />
                      {!sidebarCollapsed && <span className="whitespace-nowrap">{item.label}</span>}
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </div>
        </nav>
        {/* Sidebar Menu */}
      </div>
    </aside>
  );
}
