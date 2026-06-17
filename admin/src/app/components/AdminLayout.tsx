import { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="dark:bg-[#121a2f] dark:text-bodydark">
      <div className="flex h-screen overflow-hidden font-sans text-slate-800 bg-slate-50 selection:bg-blue-500 selection:text-white dark:bg-[#121a2f] dark:text-slate-300">
        {/* SIDEBAR */}
        <Sidebar 
          sidebarOpen={sidebarOpen} 
          setSidebarOpen={setSidebarOpen} 
          sidebarCollapsed={sidebarCollapsed}
          setSidebarCollapsed={setSidebarCollapsed}
        />

        {/* CONTENT AREA */}
        <div className="relative flex flex-1 flex-col overflow-y-auto overflow-x-hidden">
          {/* HEADER */}
          <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

          {/* MAIN CONTENT */}
          <main>
            <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
