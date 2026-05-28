import { TrendingUp, TrendingDown } from '@mui/icons-material';

const statCards = [
  {
    label: 'Tổng người dùng',
    value: '1,245',
    change: '+12%',
    up: true,
    sub: 'so với tháng trước',
    color: '#4f6ef7',
    bg: '#eef1ff',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    label: 'Giải đấu đang diễn ra',
    value: '5',
    change: '8 sắp tới',
    up: true,
    sub: 'giải đấu sắp tới',
    color: '#d4a017',
    bg: '#fffbea',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 21h8" /><path d="M12 17v4" />
        <path d="M7 4h10l1 7H6L7 4Z" /><path d="M6 11c0 3.31 2.69 6 6 6s6-2.69 6-6" />
      </svg>
    ),
  },
  {
    label: 'Ngựa đang thi đấu',
    value: '87',
    change: '+15 mới',
    up: true,
    sub: 'ngựa đăng ký mới',
    color: '#10b981',
    bg: '#edfaf4',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" /><line x1="4" y1="22" x2="4" y2="15" />
      </svg>
    ),
  },
  {
    label: 'Đơn chờ duyệt',
    value: '23',
    change: 'Cần xử lý',
    up: false,
    sub: 'cần xử lý ngay',
    color: '#ef4444',
    bg: '#fff1f1',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    ),
  },
];

const upcomingTournaments = [
  { name: 'Giải Vô Địch Quốc Gia 2026', date: '15/06/2026', location: 'Sài Gòn', status: 'upcoming', participants: 48 },
  { name: 'Cúp Mùa Hè', date: '20/07/2026', location: 'Hà Nội', status: 'preparing', participants: 32 },
  { name: 'Giải Thiếu Niên', date: '10/08/2026', location: 'Đà Nẵng', status: 'preparing', participants: 24 },
];

const tasks = [
  { label: 'Duyệt đăng ký', done: 23, total: 30, color: '#ef4444', bg: '#fff1f1' },
  { label: 'Phân công trọng tài', done: 8, total: 12, color: '#f59e0b', bg: '#fffbea' },
  { label: 'Công bố kết quả', done: 12, total: 12, color: '#10b981', bg: '#edfaf4' },
];

const recentActivities = [
  { icon: '✅', title: 'Đã duyệt đăng ký', desc: 'Thunder Bolt', time: '5 phút trước', color: '#10b981' },
  { icon: '📢', title: 'Công bố kết quả', desc: 'Vòng Final — Cúp Mùa Xuân', time: '1 giờ trước', color: '#4f6ef7' },
  { icon: '🏆', title: 'Tạo giải đấu mới', desc: 'Cúp Mùa Hè 2026', time: '2 giờ trước', color: '#d4a017' },
  { icon: '👤', title: 'Người dùng mới đăng ký', desc: 'nguyen.van.a@email.com', time: '3 giờ trước', color: '#8b5cf6' },
];

const statusMap: Record<string, { label: string; color: string; bg: string }> = {
  upcoming: { label: 'Sắp diễn ra', color: '#4f6ef7', bg: '#eef1ff' },
  preparing: { label: 'Chuẩn bị', color: '#f59e0b', bg: '#fffbea' },
  active: { label: 'Đang diễn ra', color: '#10b981', bg: '#edfaf4' },
};

export default function Dashboard() {
  return (
    <div style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", color: '#111' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        .stat-card { transition: box-shadow 0.2s, transform 0.2s; }
        .stat-card:hover { box-shadow: 0 8px 24px rgba(0,0,0,0.08) !important; transform: translateY(-2px); }
        .table-row:hover td { background: #fafafa; }
        .progress-bar { transition: width 0.5s ease; }
      `}</style>

      {/* Welcome banner */}
      <div style={{
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 60%, #0f3460 100%)',
        borderRadius: 16,
        padding: '24px 28px',
        marginBottom: 24,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
        overflow: 'hidden',
        position: 'relative',
      }}>
        <div style={{ position: 'absolute', right: -20, top: -20, width: 180, height: 180, borderRadius: '50%', background: 'rgba(212,160,23,0.08)' }} />
        <div style={{ position: 'absolute', right: 60, bottom: -40, width: 120, height: 120, borderRadius: '50%', background: 'rgba(212,160,23,0.05)' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, marginBottom: 6 }}>Chào mừng trở lại 👋</div>
          <div style={{ color: '#fff', fontWeight: 700, fontSize: 22, marginBottom: 6 }}>Bảng điều khiển Admin</div>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>
            {new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </div>
        <img src="/images/logo.png" alt="logo" style={{ height: 72, opacity: 0.9, position: 'relative', zIndex: 1 }} />
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {statCards.map((s, i) => (
          <div
            key={i}
            className="stat-card"
            style={{ backgroundColor: '#fff', borderRadius: 14, padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid #f0f0f0' }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color }}>
                {s.icon}
              </div>
              <span style={{
                fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 20,
                color: s.up ? '#10b981' : '#ef4444',
                background: s.up ? '#edfaf4' : '#fff1f1',
                display: 'flex', alignItems: 'center', gap: 3,
              }}>
                {s.up ? <TrendingUp sx={{ fontSize: 12 }} /> : <TrendingDown sx={{ fontSize: 12 }} />}
                {s.change}
              </span>
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#111', lineHeight: 1, marginBottom: 4 }}>{s.value}</div>
            <div style={{ fontSize: 13, color: '#666', fontWeight: 500 }}>{s.label}</div>
            <div style={{ fontSize: 11, color: '#bbb', marginTop: 3 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Bottom section */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20 }}>
        {/* Upcoming Tournaments Table */}
        <div style={{ backgroundColor: '#fff', borderRadius: 14, border: '1px solid #f0f0f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid #f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: '#111' }}>Giải đấu sắp tới</div>
              <div style={{ fontSize: 12, color: '#bbb', marginTop: 2 }}>Các giải đấu trong thời gian tới</div>
            </div>
            <button style={{ fontSize: 12, color: '#d4a017', border: '1px solid #f0e2a4', background: '#fffbea', borderRadius: 8, padding: '5px 12px', cursor: 'pointer', fontWeight: 600 }}>
              Xem tất cả
            </button>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#fafafa' }}>
                {['Tên giải đấu', 'Ngày bắt đầu', 'Địa điểm', 'Số tham gia', 'Trạng thái'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '10px 20px', fontSize: 11.5, fontWeight: 600, color: '#999', textTransform: 'uppercase', letterSpacing: '0.04em', borderBottom: '1px solid #f0f0f0', whiteSpace: 'nowrap' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {upcomingTournaments.map((t, i) => {
                const st = statusMap[t.status];
                return (
                  <tr key={i} className="table-row">
                    <td style={{ padding: '13px 20px', borderBottom: '1px solid #f5f5f5' }}>
                      <div style={{ fontWeight: 600, fontSize: 13.5, color: '#111' }}>{t.name}</div>
                    </td>
                    <td style={{ padding: '13px 20px', borderBottom: '1px solid #f5f5f5', fontSize: 13, color: '#555' }}>{t.date}</td>
                    <td style={{ padding: '13px 20px', borderBottom: '1px solid #f5f5f5', fontSize: 13, color: '#555' }}>{t.location}</td>
                    <td style={{ padding: '13px 20px', borderBottom: '1px solid #f5f5f5', fontSize: 13, color: '#555', fontWeight: 500 }}>{t.participants}</td>
                    <td style={{ padding: '13px 20px', borderBottom: '1px solid #f5f5f5' }}>
                      <span style={{ fontSize: 11.5, fontWeight: 600, padding: '4px 10px', borderRadius: 20, color: st.color, background: st.bg }}>
                        {st.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Tasks progress */}
          <div style={{ backgroundColor: '#fff', borderRadius: 14, border: '1px solid #f0f0f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', padding: '20px 20px 18px' }}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>Công việc cần làm</div>
            <div style={{ fontSize: 12, color: '#bbb', marginBottom: 18 }}>Tiến độ xử lý hôm nay</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {tasks.map((t, i) => {
                const pct = Math.round((t.done / t.total) * 100);
                return (
                  <div key={i}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
                      <span style={{ fontSize: 13, fontWeight: 500, color: '#333' }}>{t.label}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: t.color }}>{t.done}/{t.total}</span>
                    </div>
                    <div style={{ height: 7, borderRadius: 99, background: '#f5f5f5', overflow: 'hidden' }}>
                      <div
                        className="progress-bar"
                        style={{ height: '100%', width: `${pct}%`, borderRadius: 99, background: t.color }}
                      />
                    </div>
                    <div style={{ fontSize: 11, color: '#bbb', marginTop: 4, textAlign: 'right' }}>{pct}%</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent activities */}
          <div style={{ backgroundColor: '#fff', borderRadius: 14, border: '1px solid #f0f0f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', padding: '20px 20px 16px', flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>Hoạt động gần đây</div>
            <div style={{ fontSize: 12, color: '#bbb', marginBottom: 18 }}>Nhật ký hành động mới nhất</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {recentActivities.map((a, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <div style={{ width: 34, height: 34, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0, background: '#f9f9f9' }}>
                    {a.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#111', marginBottom: 2 }}>{a.title}</div>
                    <div style={{ fontSize: 12, color: '#888', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.desc}</div>
                  </div>
                  <div style={{ fontSize: 11, color: '#ccc', flexShrink: 0, marginTop: 2 }}>{a.time}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
