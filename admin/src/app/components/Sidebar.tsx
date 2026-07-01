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

  const trigger = useRef<HTMLButtonElement>(null);
  const sidebar = useRef<HTMLElement>(null);

  // close on click outside on mobile
  useEffect(() => {
    const clickHandler = ({ target }: MouseEvent) => {
      if (!sidebar.current || !trigger.current) return;
      if (
        !sidebarOpen ||
        sidebar.current.contains(target as Node) ||
        trigger.current.contains(target as Node)
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
      className={`absolute left-0 top-0 z-50 flex h-screen flex-col overflow-y-hidden bg-white border-r border-slate-200 duration-300 ease-linear lg:static lg:translate-x-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } ${sidebarCollapsed ? 'w-[80px]' : 'w-[240px]'}`}
    >
      {/* SIDEBAR HEADER */}
      <div className={`flex items-center justify-between gap-2 py-4 lg:py-5 ${sidebarCollapsed ? 'px-4 flex-col' : 'px-6'}`}>
        <NavLink to="/dashboard" className={`flex items-center gap-3 ${sidebarCollapsed ? 'justify-center' : ''}`}>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-slate-100 p-1">
            <img src="/images/logo.png" alt="Logo" className="h-full w-full object-contain mix-blend-multiply" />
          </div>
          {!sidebarCollapsed && (
            <div>
              <h1 className="text-lg font-bold text-slate-800 leading-none tracking-tight whitespace-nowrap">Paddock Admin</h1>
            </div>
          )}
        </NavLink>

        {/* Mobile Close Button */}
        <button
          ref={trigger}
          onClick={() => setSidebarOpen(false)}
          className="block lg:hidden text-slate-500 hover:text-slate-800 p-1"
        >
          <ChevronLeft size={20} />
        </button>
        
        {/* Desktop Collapse Button */}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className={`hidden lg:flex h-6 w-6 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-transform ${sidebarCollapsed ? 'rotate-180 mt-4' : ''}`}
        >
          <ChevronLeft size={16} />
        </button>
      </div>
      {/* SIDEBAR HEADER */}

      <div className="no-scrollbar flex flex-col overflow-y-auto duration-300 ease-linear mt-2">
        {/* Sidebar Menu */}
        <nav className={`px-4 ${sidebarCollapsed ? 'px-2' : ''}`}>
          <div>
            {!sidebarCollapsed && (
              <h3 className="mb-4 ml-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">
                Quản lý
              </h3>
            )}

            <ul className="mb-6 flex flex-col gap-1">
              {menuItems.map((item, index) => {
                // simple active matching
                const isActive = item.path === '/dashboard' ? pathname === item.path : pathname.includes(item.path);
                const Icon = item.icon;
                return (
                  <li key={index}>
                    <NavLink
                      to={item.path}
                      className={`group relative flex items-center gap-3 rounded-md py-2 font-semibold text-sm transition-all duration-300 transform hover:translate-x-1 ${
                        isActive
                          ? 'bg-blue-50 text-blue-700 shadow-sm'
                          : 'text-black hover:bg-slate-50 hover:text-black hover:shadow-sm'
                      } ${sidebarCollapsed ? 'justify-center px-0 py-2.5' : 'px-3'}`}
                      title={sidebarCollapsed ? item.label : undefined}
                    >
                      <Icon size={18} className={`shrink-0 ${isActive ? 'text-blue-700' : 'text-slate-700 group-hover:text-black'}`} />
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
