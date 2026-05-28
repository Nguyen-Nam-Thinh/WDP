import { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  ArrowLeft,
  CheckCircle,
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
  bank:    'text-blue-400',
  card:    'text-purple-400',
  ewallet: 'text-pink-400',
  crypto:  'text-amber-400',
};

const statusConfig: Record<string, { label: string; bg: string; color: string; dotColor: string }> = {
  success: { label: 'Thành Công',   bg: 'rgba(16,185,129,0.15)',  color: '#10b981', dotColor: 'bg-emerald-400' },
  pending: { label: 'Đang Xử Lý',  bg: 'rgba(245,158,11,0.15)', color: '#f59e0b', dotColor: 'bg-amber-400' },
  failed:  { label: 'Thất Bại',    bg: 'rgba(239,68,68,0.15)',   color: '#ef4444', dotColor: 'bg-red-400' },
};

export function DepositHistoryPage() {
  const navigate = useNavigate();
  const [search, setSearch]           = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterMethod, setFilterMethod] = useState('all');
  const [filterOpen, setFilterOpen]   = useState(false);

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
    <div className="min-h-screen bg-slate-950 font-sans">
      {/* Top Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-950/90 backdrop-blur-lg border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate('/spectator')}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors group"
          >
            <div className="w-8 h-8 rounded-lg bg-white/5 group-hover:bg-white/10 flex items-center justify-center transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </div>
            <span className="text-sm font-medium">Quay Lại</span>
          </button>
          <div className="w-px h-5 bg-white/10" />
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <DollarSign className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-white font-bold leading-none">Lịch Sử Nạp Tiền</div>
              <div className="text-slate-400 text-xs mt-0.5">Alex Morgan · alex.morgan@email.com</div>
            </div>
          </div>
        </div>
      </nav>

      <div className="pt-24 max-w-7xl mx-auto px-6 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Tổng Đã Nạp',    value: `$${totalDeposited.toLocaleString()}`, icon: Coins,      color: 'from-[#FFDE42] to-amber-600',  sub: 'giao dịch thành công' },
            { label: 'Số Lần Nạp',     value: depositHistory.length,                  icon: TrendingUp,  color: 'from-blue-500 to-blue-700',    sub: 'tổng giao dịch' },
            { label: 'Đang Xử Lý',     value: pendingCount,                            icon: Clock,       color: 'from-amber-500 to-amber-700',  sub: 'chờ xác nhận' },
            { label: 'Thất Bại',       value: failedCount,                             icon: AlertCircle, color: 'from-red-500 to-red-700',      sub: 'cần kiểm tra' },
          ].map((s, i) => (
            <div key={i} className="bg-white/5 border border-white/5 rounded-2xl p-5 hover:-translate-y-1 transition-all duration-200">
              <div className={`w-10 h-10 bg-gradient-to-br ${s.color} rounded-xl flex items-center justify-center mb-3 shadow-lg`}>
                <s.icon className="w-5 h-5 text-white" />
              </div>
              <div className="text-2xl font-bold text-white mb-0.5">{s.value}</div>
              <div className="text-sm text-slate-400 font-medium">{s.label}</div>
              <div className="text-xs text-slate-600 mt-0.5">{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Tìm theo mã giao dịch, phương thức, ghi chú..."
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-[#FFDE42]/50 focus:ring-1 focus:ring-[#FFDE42]/20 transition-all"
            />
          </div>

          {/* Status filter */}
          <div className="relative">
            <button
              onClick={() => setFilterOpen(filterOpen === 'status' ? false : 'status' as any)}
              className="flex items-center gap-2 bg-white/5 border border-white/10 hover:border-white/20 rounded-xl px-4 py-2.5 text-slate-300 text-sm font-medium transition-all"
            >
              <Filter className="w-4 h-4" />
              {filterStatus === 'all' ? 'Trạng Thái' : statusConfig[filterStatus]?.label}
              <ChevronDown className="w-4 h-4" />
            </button>
            {filterOpen === ('status' as any) && (
              <div className="absolute right-0 top-full mt-1 bg-slate-900 border border-white/10 rounded-xl shadow-xl z-10 overflow-hidden min-w-36">
                {[{ v: 'all', l: 'Tất Cả' }, { v: 'success', l: 'Thành Công' }, { v: 'pending', l: 'Đang Xử Lý' }, { v: 'failed', l: 'Thất Bại' }].map(opt => (
                  <button key={opt.v} onClick={() => { setFilterStatus(opt.v); setFilterOpen(false); }}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${filterStatus === opt.v ? 'bg-[#FFDE42]/10 text-[#FFDE42]' : 'text-slate-300 hover:bg-white/5'}`}>
                    {opt.l}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Method filter */}
          <div className="relative">
            <button
              onClick={() => setFilterOpen(filterOpen === 'method' ? false : 'method' as any)}
              className="flex items-center gap-2 bg-white/5 border border-white/10 hover:border-white/20 rounded-xl px-4 py-2.5 text-slate-300 text-sm font-medium transition-all"
            >
              Phương Thức
              <ChevronDown className="w-4 h-4" />
            </button>
            {filterOpen === ('method' as any) && (
              <div className="absolute right-0 top-full mt-1 bg-slate-900 border border-white/10 rounded-xl shadow-xl z-10 overflow-hidden min-w-40">
                {[{ v: 'all', l: 'Tất Cả' }, { v: 'bank', l: 'Ngân Hàng' }, { v: 'card', l: 'Thẻ Tín Dụng' }, { v: 'ewallet', l: 'Ví Điện Tử' }, { v: 'crypto', l: 'Crypto' }].map(opt => (
                  <button key={opt.v} onClick={() => { setFilterMethod(opt.v); setFilterOpen(false); }}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${filterMethod === opt.v ? 'bg-[#FFDE42]/10 text-[#FFDE42]' : 'text-slate-300 hover:bg-white/5'}`}>
                    {opt.l}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button className="flex items-center gap-2 bg-white/5 border border-white/10 hover:border-white/20 rounded-xl px-4 py-2.5 text-slate-300 text-sm font-medium transition-all">
            <Download className="w-4 h-4" />
            Xuất CSV
          </button>
        </div>

        {/* Table */}
        <div className="bg-white/5 backdrop-blur-md border border-white/5 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-900/60 border-b border-white/5">
                <tr>
                  {['Mã GD', 'Phương Thức', 'Số Tiền', 'Ghi Chú', 'Trạng Thái', 'Thời Gian'].map(h => (
                    <th key={h} className="text-left px-5 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-16 text-center">
                      <DollarSign className="w-12 h-12 text-slate-700 mx-auto mb-3" />
                      <div className="text-slate-500 font-medium">Không tìm thấy kết quả</div>
                    </td>
                  </tr>
                ) : filtered.map(dep => {
                  const cfg  = statusConfig[dep.status];
                  const Icon = methodIcons[dep.method];
                  const clr  = methodColors[dep.method];
                  return (
                    <tr key={dep.id} className="border-t border-white/5 hover:bg-white/5 transition-colors">
                      <td className="px-5 py-4">
                        <span className="text-slate-400 font-mono text-xs">{dep.reference}</span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0`}>
                            <Icon className={`w-4 h-4 ${clr}`} />
                          </div>
                          <span className="text-white text-sm font-medium">{dep.methodLabel}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-[#FFDE42] font-bold text-sm">${dep.amount.toLocaleString()}</span>
                      </td>
                      <td className="px-5 py-4 text-slate-400 text-sm">{dep.note}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg w-fit" style={{ backgroundColor: cfg.bg }}>
                          <div className={`w-1.5 h-1.5 rounded-full ${cfg.dotColor}`} />
                          <span className="text-xs font-semibold" style={{ color: cfg.color }}>{cfg.label}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-slate-500 text-xs whitespace-nowrap">{dep.date}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filtered.length > 0 && (
            <div className="px-5 py-3 border-t border-white/5 flex items-center justify-between">
              <span className="text-slate-500 text-sm">Hiển thị {filtered.length} / {depositHistory.length} giao dịch</span>
              <div className="flex items-center gap-4">
                {Object.entries(statusConfig).map(([k, v]) => (
                  <div key={k} className="flex items-center gap-1.5">
                    <div className={`w-2 h-2 rounded-full ${v.dotColor}`} />
                    <span className="text-xs text-slate-400">{v.label}: {depositHistory.filter(d => d.status === k).length}</span>
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
