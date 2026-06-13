import { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  ArrowLeft,
  Clock,
  Filter,
  Search,
  Coins,
  DollarSign,
  ChevronDown,
  Download,
  Building2,
  CreditCard,
  Smartphone,
  Bitcoin,
  AlertCircle,
  TrendingUp,
} from 'lucide-react';

const depositHistory = [
  { id: 'DEP001', date: '2026-05-28 10:30', amount: 500, method: 'bank',    methodLabel: 'Chuyển Khoản Ngân Hàng', status: 'success', reference: 'TRX-987654321', note: 'Vietcombank' },
  { id: 'DEP002', date: '2026-05-25 14:15', amount: 200, method: 'card',    methodLabel: 'Thẻ Tín Dụng',           status: 'success', reference: 'TRX-123456789', note: 'Visa **** 4242' },
  { id: 'DEP003', date: '2026-05-20 09:00', amount: 1000, method: 'ewallet', methodLabel: 'Ví Điện Tử',            status: 'success', reference: 'TRX-456789123', note: 'MoMo' },
  { id: 'DEP004', date: '2026-05-18 16:45', amount: 300, method: 'crypto',  methodLabel: 'Tiền Điện Tử',           status: 'pending', reference: 'TRX-789123456', note: 'USDT TRC20' },
  { id: 'DEP005', date: '2026-05-15 08:00', amount: 150, method: 'card',    methodLabel: 'Thẻ Tín Dụng',           status: 'failed',  reference: 'TRX-321987654', note: 'Mastercard **** 8721' },
  { id: 'DEP006', date: '2026-05-10 13:20', amount: 600, method: 'bank',    methodLabel: 'Chuyển Khoản Ngân Hàng', status: 'success', reference: 'TRX-654321987', note: 'Techcombank' },
];

const methodIcons: Record<string, any> = {
  bank:    Building2,
  card:    CreditCard,
  ewallet: Smartphone,
  crypto:  Bitcoin,
};

const methodColors: Record<string, string> = {
  bank:    'text-primary',
  card:    'text-secondary',
  ewallet: 'text-secondary',
  crypto:  'text-[#8F7318]',
};

const statusConfig: Record<string, { label: string; bg: string; color: string; dotColor: string }> = {
  success: { label: 'Thành Công',   bg: 'rgba(31,61,43,0.12)',  color: '#1F3D2B', dotColor: 'bg-primary' },
  pending: { label: 'Đang Xử Lý',  bg: 'rgba(201,162,39,0.15)', color: '#8F7318', dotColor: 'bg-gold' },
  failed:  { label: 'Thất Bại',    bg: 'rgba(180,35,24,0.12)',   color: '#B42318', dotColor: 'bg-[#B42318]' },
};

export function DepositHistoryPage() {
  const navigate = useNavigate();
  const [search, setSearch]           = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterMethod, setFilterMethod] = useState('all');
  const [filterOpen, setFilterOpen]   = useState<string | false>(false);

  const totalDeposited = depositHistory.filter(d => d.status === 'success').reduce((s, d) => s + d.amount, 0);
  const pendingCount   = depositHistory.filter(d => d.status === 'pending').length;
  const failedCount    = depositHistory.filter(d => d.status === 'failed').length;

  const filtered = depositHistory.filter(d => {
    const matchSearch = d.reference.toLowerCase().includes(search.toLowerCase()) ||
                        d.methodLabel.toLowerCase().includes(search.toLowerCase()) ||
                        d.note.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || d.status === filterStatus;
    const matchMethod = filterMethod === 'all' || d.method === filterMethod;
    return matchSearch && matchStatus && matchMethod;
  });

  return (
    <div className="min-h-screen bg-background font-sans">
      {/* Top Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-lg border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate('/spectator')}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors group"
          >
            <div className="w-8 h-8 rounded-lg bg-card group-hover:bg-muted flex items-center justify-center transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </div>
            <span className="text-sm font-medium">Quay Lại</span>
          </button>
          <div className="w-px h-5 bg-muted" />
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-[#1F3D2B] to-[#172D20] rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <DollarSign className="w-5 h-5 text-foreground"/>
            </div>
            <div>
              <div className="text-foreground font-serif font-bold leading-none text-foreground">Lịch Sử Nạp Tiền</div>
              <div className="text-muted-foreground text-xs mt-0.5">Alex Morgan · alex.morgan@email.com</div>
            </div>
          </div>
        </div>
      </nav>

      <div className="pt-24 max-w-7xl mx-auto px-6 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Tổng Đã Nạp',    value: `$${totalDeposited.toLocaleString()}`, icon: Coins,      color: 'from-[#C9A227] to-[#8F7318]',  sub: 'giao dịch thành công' },
            { label: 'Số Lần Nạp',     value: depositHistory.length,                  icon: TrendingUp,  color: 'from-[#8C2F1B] to-[#6B2415]',    sub: 'tổng giao dịch' },
            { label: 'Đang Xử Lý',     value: pendingCount,                            icon: Clock,       color: 'from-[#C9A227] to-[#8F7318]',  sub: 'chờ xác nhận' },
            { label: 'Thất Bại',       value: failedCount,                             icon: AlertCircle, color: 'from-[#B42318] to-[#8C2F1B]',      sub: 'cần kiểm tra' },
          ].map((s, i) => (
            <div key={i} className="bg-card border border-border rounded-2xl p-5 hover:-translate-y-1 transition-all duration-200">
              <div className={`w-10 h-10 bg-gradient-to-br ${s.color} rounded-xl flex items-center justify-center mb-3 shadow-lg`}>
                <s.icon className="w-5 h-5 text-foreground"/>
              </div>
              <div className="font-serif text-2xl font-bold text-foreground mb-0.5">{s.value}</div>
              <div className="text-sm text-muted-foreground font-medium">{s.label}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Tìm theo mã giao dịch, phương thức, ghi chú..."
              className="w-full bg-card border border-border rounded-xl pl-10 pr-4 py-2.5 text-foreground placeholder-muted-foreground text-sm focus:outline-none focus:border-[#C9A227]/50 focus:ring-1 focus:ring-[#C9A227]/20 transition-all"
            />
          </div>

          {/* Status filter */}
          <div className="relative">
            <button
              onClick={() => setFilterOpen(filterOpen === 'status' ? false : 'status')}
              className="flex items-center gap-2 bg-card border border-border hover:border-border rounded-xl px-4 py-2.5 text-foreground text-sm font-medium transition-all"
            >
              <Filter className="w-4 h-4" />
              {filterStatus === 'all' ? 'Trạng Thái' : statusConfig[filterStatus]?.label}
              <ChevronDown className="w-4 h-4" />
            </button>
            {filterOpen === 'status' && (
              <div className="absolute right-0 top-full mt-1 bg-card border border-border rounded-xl shadow-xl z-10 overflow-hidden min-w-36">
                {[{ v: 'all', l: 'Tất Cả' }, { v: 'success', l: 'Thành Công' }, { v: 'pending', l: 'Đang Xử Lý' }, { v: 'failed', l: 'Thất Bại' }].map(opt => (
                  <button key={opt.v} onClick={() => { setFilterStatus(opt.v); setFilterOpen(false); }}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${filterStatus === opt.v ? 'bg-[#C9A227]/10 text-[#C9A227]' : 'text-foreground hover:bg-muted'}`}>
                    {opt.l}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Method filter */}
          <div className="relative">
            <button
              onClick={() => setFilterOpen(filterOpen === 'method' ? false : 'method')}
              className="flex items-center gap-2 bg-card border border-border hover:border-border rounded-xl px-4 py-2.5 text-foreground text-sm font-medium transition-all"
            >
              Phương Thức
              <ChevronDown className="w-4 h-4" />
            </button>
            {filterOpen === 'method' && (
              <div className="absolute right-0 top-full mt-1 bg-card border border-border rounded-xl shadow-xl z-10 overflow-hidden min-w-40">
                {[{ v: 'all', l: 'Tất Cả' }, { v: 'bank', l: 'Ngân Hàng' }, { v: 'card', l: 'Thẻ Tín Dụng' }, { v: 'ewallet', l: 'Ví Điện Tử' }, { v: 'crypto', l: 'Crypto' }].map(opt => (
                  <button key={opt.v} onClick={() => { setFilterMethod(opt.v); setFilterOpen(false); }}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${filterMethod === opt.v ? 'bg-[#C9A227]/10 text-[#C9A227]' : 'text-foreground hover:bg-muted'}`}>
                    {opt.l}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button className="flex items-center gap-2 bg-card border border-border hover:border-border rounded-xl px-4 py-2.5 text-foreground text-sm font-medium transition-all">
            <Download className="w-4 h-4" />
            Xuất CSV
          </button>
        </div>

        {/* Table */}
        <div className="bg-card backdrop-blur-md border border-border rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  {['Mã GD', 'Phương Thức', 'Số Tiền', 'Ghi Chú', 'Trạng Thái', 'Thời Gian'].map(h => (
                    <th key={h} className="text-left px-5 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-16 text-center">
                      <DollarSign className="w-12 h-12 text-muted-foreground/60 mx-auto mb-3" />
                      <div className="text-muted-foreground font-medium">Không tìm thấy kết quả</div>
                    </td>
                  </tr>
                ) : filtered.map(dep => {
                  const cfg  = statusConfig[dep.status];
                  const Icon = methodIcons[dep.method];
                  const clr  = methodColors[dep.method];
                  return (
                    <tr key={dep.id} className="border-t border-border hover:bg-muted transition-colors">
                      <td className="px-5 py-4">
                        <span className="text-muted-foreground font-mono text-xs">{dep.reference}</span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-lg bg-card flex items-center justify-center flex-shrink-0`}>
                            <Icon className={`w-4 h-4 ${clr}`} />
                          </div>
                          <span className="text-foreground text-sm font-medium">{dep.methodLabel}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-[#C9A227] font-bold text-sm">${dep.amount.toLocaleString()}</span>
                      </td>
                      <td className="px-5 py-4 text-muted-foreground text-sm">{dep.note}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg w-fit" style={{ backgroundColor: cfg.bg }}>
                          <div className={`w-1.5 h-1.5 rounded-full ${cfg.dotColor}`} />
                          <span className="text-xs font-semibold" style={{ color: cfg.color }}>{cfg.label}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-muted-foreground text-xs whitespace-nowrap">{dep.date}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filtered.length > 0 && (
            <div className="px-5 py-3 border-t border-border flex items-center justify-between">
              <span className="text-muted-foreground text-sm">Hiển thị {filtered.length} / {depositHistory.length} giao dịch</span>
              <div className="flex items-center gap-4">
                {Object.entries(statusConfig).map(([k, v]) => (
                  <div key={k} className="flex items-center gap-1.5">
                    <div className={`w-2 h-2 rounded-full ${v.dotColor}`} />
                    <span className="text-xs text-muted-foreground">{v.label}: {depositHistory.filter(d => d.status === k).length}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
