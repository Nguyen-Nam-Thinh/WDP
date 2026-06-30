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
    <div className="flex h-screen overflow-hidden font-sans text-slate-800 bg-slate-50 selection:bg-blue-500 selection:text-white">
      {/* SIDEBAR */}
      <Sidebar 
        sidebarOpen={sidebarOpen} 
        setSidebarOpen={setSidebarOpen} 
        sidebarCollapsed={sidebarCollapsed}
        setSidebarCollapsed={setSidebarCollapsed}
      />

      {/* CONTENT AREA */}
      <div className="relative flex flex-1 flex-col overflow-y-auto overflow-x-hidden bg-slate-50">
        {/* HEADER */}
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

        {/* MAIN CONTENT */}
        <main className="flex-1 w-full max-w-[1440px] mx-auto">
          <div className="p-4 md:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
