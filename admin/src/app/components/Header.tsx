import { Menu, Search, Bell, Settings, LogOut, User } from 'lucide-react';
import { useState } from 'react';
import { useAdminAuth } from '../context/AdminAuthContext';
import { useNavigate } from 'react-router';
// import DarkModeSwitcher from './DarkModeSwitcher';

export default function Header(props: {
  sidebarOpen: string | boolean | undefined;
  setSidebarOpen: (arg0: boolean) => void;
}) {
  const { user, logout } = useAdminAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setDropdownOpen(false);
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-40 flex w-full bg-white drop-shadow-sm dark:bg-[#1c2434] dark:drop-shadow-none">
      <div className="flex flex-grow items-center justify-between px-4 py-4 shadow-2 md:px-6 2xl:px-11">
        <div className="flex items-center gap-2 sm:gap-4 lg:hidden">
          {/* Hamburger Toggle BTN */}
          <button
            aria-controls="sidebar"
            onClick={(e) => {
              e.stopPropagation();
              props.setSidebarOpen(!props.sidebarOpen);
            }}
            className="z-50 block rounded-sm border border-slate-200 bg-white p-1.5 shadow-sm dark:border-slate-700 dark:bg-slate-800 lg:hidden"
          >
            <Menu className="h-5 w-5 text-slate-500 dark:text-white" />
          </button>
          {/* Hamburger Toggle BTN */}
        </div>

        <div className="hidden sm:block">
          <form action="https://formbold.com/s/unique_form_id" method="POST">
            <div className="relative">
              <button className="absolute left-0 top-1/2 -translate-y-1/2 pl-2">
                <Search className="h-5 w-5 text-slate-400 hover:text-blue-500" />
              </button>
              <input
                type="text"
                placeholder="Tìm kiếm..."
                className="w-full bg-transparent pl-10 pr-4 py-2 font-medium focus:outline-none xl:w-125 dark:text-white dark:placeholder-slate-400"
              />
            </div>
          </form>
        </div>

        <div className="flex items-center gap-3 2xsm:gap-7 ml-auto">
          <ul className="flex items-center gap-2 2xsm:gap-4">
            {/* Dark Mode Toggler */}
            {/* <DarkModeSwitcher /> */}
            {/* Dark Mode Toggler */}

            {/* Notification Menu Area */}
            <li className="relative">
              <button
                className="relative flex h-8.5 w-8.5 items-center justify-center rounded-full border-[0.5px] border-slate-200 bg-slate-100 hover:text-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                <span className="absolute -top-0.5 right-0 z-1 h-2 w-2 rounded-full bg-red-500 inline-block">
                  <span className="absolute -z-1 inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75"></span>
                </span>
                <Bell size={18} />
              </button>
            </li>
            {/* Notification Menu Area */}
          </ul>

          {/* User Area */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-4"
            >
              <span className="hidden text-right lg:block">
                <span className="block text-sm font-medium text-slate-800 dark:text-white">
                  {user?.fullName || 'Admin User'}
                </span>
                <span className="block text-xs font-medium text-slate-500">Quản trị viên</span>
              </span>

              <span className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold overflow-hidden shadow-sm">
                {user?.fullName ? user.fullName.charAt(0).toUpperCase() : 'A'}
              </span>
            </button>

            {/* Dropdown Start */}
            {dropdownOpen && (
              <>
                <div 
                  className="fixed inset-0 z-40"
                  onClick={() => setDropdownOpen(false)}
                ></div>
                <div
                  className="absolute right-0 mt-4 flex w-56 flex-col rounded-lg border border-slate-200 bg-white shadow-lg z-50 dark:border-slate-700 dark:bg-[#1c2434]"
                >
                  <ul className="flex flex-col gap-1 px-3 py-3 border-b border-slate-200 dark:border-slate-700">
                    <li>
                      <button className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-blue-600 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-blue-500">
                        <User size={18} />
                        Hồ sơ cá nhân
                      </button>
                    </li>
                    <li>
                      <button className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-blue-600 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-blue-500">
                        <Settings size={18} />
                        Cài đặt
                      </button>
                    </li>
                  </ul>
                  <div className="p-3">
                    <button 
                      onClick={handleLogout}
                      className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-slate-800"
                    >
                      <LogOut size={18} />
                      Đăng xuất
                    </button>
                  </div>
                </div>
              </>
            )}
            {/* Dropdown End */}
          </div>
          {/* User Area */}
        </div>
      </div>
    </header>
  );
}
