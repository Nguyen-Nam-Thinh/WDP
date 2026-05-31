import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router';

const drawerWidth = 260;

const menuItems = [
  {
    path: '/dashboard',
    label: 'Tổng quan',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
      </svg>
    ),
  },
  {
    path: '/users',
    label: 'Quản lý người dùng',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    path: '/tournaments',
    label: 'Quản lý giải đấu',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 21h8" /><path d="M12 17v4" />
        <path d="M7 4h10l1 7H6L7 4Z" /><path d="M6 11c0 3.31 2.69 6 6 6s6-2.69 6-6" />
      </svg>
    ),
  },
  {
    path: '/races',
    label: 'Quản lý chặng đua',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" /><line x1="4" y1="22" x2="4" y2="15" />
      </svg>
    ),
  },
  {
    path: '/registrations',
    label: 'Duyệt đăng ký',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" />
      </svg>
    ),
  },
  {
    path: '/referees',
    label: 'Phân công trọng tài',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    ),
  },
  {
    path: '/results',
    label: 'Công bố kết quả',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
  },
  {
    path: '/bets',
    label: 'Quản lý cược',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 6v6l4 2" />
        <path d="M16 8H8" />
      </svg>
    ),
  },


];

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const currentPage = menuItems.find((item) => isActive(item.path));

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: '#f8f9fb', fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        .nav-item { transition: all 0.15s ease; }
        .nav-item:hover { background: #f5f5f5; }
        .nav-item.active { background: #fffbea; color: #c98f00; }
        .nav-item.active svg { stroke: #d4a017; }
        .header-btn:hover { background: #f5f5f5; }
        .user-menu-item:hover { background: #f9f9f9; }
        .sidebar { transition: width 0.2s ease; }
        .main-scroll::-webkit-scrollbar { width: 5px; }
        .main-scroll::-webkit-scrollbar-track { background: transparent; }
        .main-scroll::-webkit-scrollbar-thumb { background: #e2e2e2; border-radius: 99px; }
      `}</style>

      {/* Sidebar */}
      <aside className="sidebar" style={{
        width: sidebarOpen ? drawerWidth : 68,
        minWidth: sidebarOpen ? drawerWidth : 68,
        backgroundColor: '#ffffff',
        borderRight: '1px solid #f0f0f0',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        zIndex: 10,
        boxShadow: '2px 0 8px rgba(0,0,0,0.04)',
      }}>
        {/* Logo area */}
        <div style={{ padding: '20px 16px 16px', borderBottom: '1px solid #f5f5f5', display: 'flex', alignItems: 'center', gap: 12, minHeight: 72 }}>
          <img
            src="/images/logo.png"
            alt="Logo"
            style={{ width: 36, height: 36, objectFit: 'contain', flexShrink: 0 }}
          />
          {sidebarOpen && (
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: '#111', lineHeight: 1.2 }}>Horse Racing</div>
              <div style={{ fontSize: 11, color: '#999', fontWeight: 500, marginTop: 2 }}>Admin Panel</div>
            </div>
          )}
        </div>

        {/* Nav items */}
        <nav style={{ flex: 1, padding: '12px 10px', overflowY: 'auto' }}>
          {menuItems.map((item) => {
            const active = isActive(item.path);
            return (
              <button
                key={item.path}
                className={`nav-item${active ? ' active' : ''}`}
                onClick={() => navigate(item.path)}
                title={!sidebarOpen ? item.label : undefined}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  width: '100%',
                  padding: sidebarOpen ? '10px 12px' : '10px',
                  justifyContent: sidebarOpen ? 'flex-start' : 'center',
                  borderRadius: 8,
                  border: 'none',
                  cursor: 'pointer',
                  marginBottom: 2,
                  background: active ? '#fffbea' : 'transparent',
                  color: active ? '#c98f00' : '#555',
                  fontWeight: active ? 600 : 500,
                  fontSize: 13.5,
                  textAlign: 'left',
                }}
              >
                <span style={{ flexShrink: 0, color: active ? '#d4a017' : '#888', display: 'flex' }}>
                  {item.icon}
                </span>
                {sidebarOpen && <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.label}</span>}
                {active && sidebarOpen && (
                  <span style={{ marginLeft: 'auto', width: 6, height: 6, borderRadius: '50%', background: '#d4a017', flexShrink: 0 }} />
                )}
              </button>
            );
          })}
        </nav>

        {/* Collapse toggle */}
        <div style={{ padding: '12px 10px', borderTop: '1px solid #f5f5f5' }}>
          <button
            className="nav-item"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: sidebarOpen ? 'flex-start' : 'center',
              gap: 10,
              width: '100%',
              padding: sidebarOpen ? '9px 12px' : '9px',
              borderRadius: 8,
              border: 'none',
              cursor: 'pointer',
              background: 'transparent',
              color: '#888',
              fontSize: 13,
              fontWeight: 500,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              style={{ transform: sidebarOpen ? 'rotate(0deg)' : 'rotate(180deg)', transition: 'transform 0.2s ease', flexShrink: 0 }}>
              <polyline points="15 18 9 12 15 6" />
            </svg>
            {sidebarOpen && <span>Thu gọn</span>}
          </button>
        </div>
      </aside>

      {/* Right side */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Header */}
        <header style={{
          height: 64,
          backgroundColor: '#ffffff',
          borderBottom: '1px solid #f0f0f0',
          display: 'flex',
          alignItems: 'center',
          padding: '0 24px',
          gap: 16,
          boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
          position: 'sticky',
          top: 0,
          zIndex: 9,
        }}>
          {/* Breadcrumb */}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: '#bbb', marginBottom: 2, fontWeight: 500 }}>Trang chủ / {currentPage?.label || 'Tổng quan'}</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#111' }}>{currentPage?.label || 'Tổng quan'}</div>
          </div>

          {/* Notification bell */}
          <button className="header-btn" style={{ position: 'relative', width: 38, height: 38, borderRadius: 8, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            <span style={{ position: 'absolute', top: 6, right: 6, width: 8, height: 8, borderRadius: '50%', background: '#ef4444', border: '2px solid white' }} />
          </button>

          {/* User profile */}
          <div style={{ position: 'relative' }}>
            <button
              className="header-btn"
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 10px', borderRadius: 8, border: 'none', background: 'transparent', cursor: 'pointer' }}
            >
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #f5c842 0%, #d4a017 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: 13 }}>
                A
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#111', lineHeight: 1.2 }}>Admin</div>
                <div style={{ fontSize: 11, color: '#999' }}>Quản trị viên</div>
              </div>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                style={{ transform: userMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.15s ease' }}>
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {userMenuOpen && (
              <div style={{
                position: 'absolute', right: 0, top: '100%', marginTop: 6,
                backgroundColor: '#fff', border: '1px solid #f0f0f0', borderRadius: 10,
                boxShadow: '0 8px 24px rgba(0,0,0,0.1)', minWidth: 180, zIndex: 999, overflow: 'hidden',
              }}>
                {[
                  { label: 'Hồ sơ', icon: '👤' },
                  { label: 'Cài đặt', icon: '⚙️' },
                ].map((item) => (
                  <button
                    key={item.label}
                    className="user-menu-item"
                    onClick={() => setUserMenuOpen(false)}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 14px', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 13.5, color: '#333', fontWeight: 500, textAlign: 'left' }}
                  >
                    <span>{item.icon}</span> {item.label}
                  </button>
                ))}
                <div style={{ borderTop: '1px solid #f5f5f5', margin: '4px 0' }} />
                <button
                  className="user-menu-item"
                  onClick={() => setUserMenuOpen(false)}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 14px', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 13.5, color: '#ef4444', fontWeight: 500, textAlign: 'left' }}
                >
                  <span>🚪</span> Đăng xuất
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Main content */}
        <main className="main-scroll" style={{ flex: 1, overflowY: 'auto', padding: '28px 28px' }}>
          {children}
        </main>
      </div>

      {/* Overlay for user menu */}
      {userMenuOpen && (
        <div
          onClick={() => setUserMenuOpen(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 998 }}
        />
      )}
    </div>
  );
}
