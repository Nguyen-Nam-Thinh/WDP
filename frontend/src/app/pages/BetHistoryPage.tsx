import { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Activity,
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
  Filter,
  Search,
  TrendingUp,
  Coins,
  Trophy,
  ChevronDown,
  Download,
} from 'lucide-react';
import { Chip } from '@mui/material';

const betHistory = [
  { id: 'BET001', date: '2026-05-28 11:00', race: 'Cuộc Đua 15 - Chung Kết', tournament: 'Giải Vô Địch Ưu Tú 2026', amount: 100, type: 'Thắng', horse: 'Thunder Strike', jockey: 'Mike Johnson', odds: '2.5x', status: 'pending', reward: 0 },
  { id: 'BET002', date: '2026-05-27 15:30', race: 'Cuộc Đua 12 - Bán Kết', tournament: 'Giải Vô Địch Ưu Tú 2026', amount: 50, type: 'Về Đích Top 3', horse: 'Golden Arrow', jockey: 'Sarah Williams', odds: '1.8x', status: 'won', reward: 90 },
  { id: 'BET003', date: '2026-05-26 14:00', race: 'Cuộc Đua 10 - Vòng Loại', tournament: 'Giải Mùa Xuân', amount: 200, type: 'Về Đích Top 5', horse: 'Storm Chaser', jockey: 'David Chen', odds: '3.0x', status: 'lost', reward: 0 },
  { id: 'BET004', date: '2026-05-25 09:15', race: 'Cuộc Đua 8 - Khởi Động', tournament: 'Chung Kết Derby Vàng', amount: 150, type: 'Thắng', horse: 'Wild Fire', jockey: 'Emma Davis', odds: '5.5x', status: 'won', reward: 825 },
  { id: 'BET005', date: '2026-05-24 16:00', race: 'Cuộc Đua 6 - Vòng Bảng', tournament: 'Giải Mùa Xuân', amount: 80, type: 'Thắng', horse: 'Night Fury', jockey: 'Alex Kim', odds: '3.2x', status: 'lost', reward: 0 },
  { id: 'BET006', date: '2026-05-23 10:30', race: 'Cuộc Đua 5 - Cổ Điển', tournament: 'Chung Kết Derby Vàng', amount: 300, type: 'Về Đích Top 3', horse: 'Royal Thunder', jockey: 'Tom Wilson', odds: '2.0x', status: 'won', reward: 600 },
];

const statusConfig: Record<string, { label: string; bg: string; color: string; icon: any }> = {
  won:     { label: 'Thắng',   bg: 'rgba(255,222,66,0.15)',   color: '#FFDE42', icon: CheckCircle },
  lost:    { label: 'Thua',    bg: 'rgba(239,68,68,0.15)',    color: '#ef4444', icon: XCircle },
  pending: { label: 'Chờ KQ', bg: 'rgba(100,116,139,0.3)',  color: '#94a3b8', icon: Clock },
};

export function BetHistoryPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterOpen, setFilterOpen] = useState(false);

  const totalBet  = betHistory.reduce((s, b) => s + b.amount, 0);
  const totalWon  = betHistory.filter(b => b.status === 'won').reduce((s, b) => s + b.reward, 0);
  const winCount  = betHistory.filter(b => b.status === 'won').length;
  const winRate   = Math.round((winCount / betHistory.length) * 100);

  const filtered = betHistory.filter(b => {
    const matchSearch = b.race.toLowerCase().includes(search.toLowerCase()) ||
                        b.horse.toLowerCase().includes(search.toLowerCase()) ||
                        b.id.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || b.status === filterStatus;
    return matchSearch && matchStatus;
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
            <div className="w-9 h-9 bg-gradient-to-br from-purple-500 to-purple-700 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/30">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-white font-bold leading-none">Lịch Sử Cược</div>
              <div className="text-slate-400 text-xs mt-0.5">Alex Morgan · alex.morgan@email.com</div>
            </div>
          </div>
        </div>
      </nav>

      <div className="pt-24 max-w-7xl mx-auto px-6 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Tổng Số Cược', value: betHistory.length, icon: Activity, color: 'from-purple-500 to-purple-700', sub: 'giao dịch' },
            { label: 'Tổng Tiền Đặt', value: `$${totalBet}`, icon: Coins, color: 'from-[#FFDE42] to-amber-600', sub: 'đã đặt cược' },
            { label: 'Tổng Tiền Thắng', value: `$${totalWon}`, icon: TrendingUp, color: 'from-emerald-500 to-emerald-700', sub: 'nhận về' },
            { label: 'Tỷ Lệ Thắng', value: `${winRate}%`, icon: Trophy, color: 'from-blue-500 to-blue-700', sub: `${winCount}/${betHistory.length} cược` },
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
              placeholder="Tìm theo tên cuộc đua, ngựa, mã vé..."
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-[#FFDE42]/50 focus:ring-1 focus:ring-[#FFDE42]/20 transition-all"
            />
          </div>

          <div className="relative">
            <button
              onClick={() => setFilterOpen(!filterOpen)}
              className="flex items-center gap-2 bg-white/5 border border-white/10 hover:border-white/20 rounded-xl px-4 py-2.5 text-slate-300 text-sm font-medium transition-all"
            >
              <Filter className="w-4 h-4" />
              {filterStatus === 'all' ? 'Tất Cả' : statusConfig[filterStatus]?.label}
              <ChevronDown className={`w-4 h-4 transition-transform ${filterOpen ? 'rotate-180' : ''}`} />
            </button>
            {filterOpen && (
              <div className="absolute right-0 top-full mt-1 bg-slate-900 border border-white/10 rounded-xl shadow-xl z-10 overflow-hidden min-w-36">
                {[{ v: 'all', l: 'Tất Cả' }, { v: 'won', l: 'Thắng' }, { v: 'lost', l: 'Thua' }, { v: 'pending', l: 'Chờ KQ' }].map(opt => (
                  <button
                    key={opt.v}
                    onClick={() => { setFilterStatus(opt.v); setFilterOpen(false); }}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${filterStatus === opt.v ? 'bg-[#FFDE42]/10 text-[#FFDE42]' : 'text-slate-300 hover:bg-white/5'}`}
                  >
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
                  {['Mã Vé', 'Cuộc Đua', 'Ngựa & Kỵ Sĩ', 'Loại Cược', 'Số Tiền', 'Hệ Số', 'Trạng Thái', 'Thực Nhận', 'Thời Gian'].map(h => (
                    <th key={h} className="text-left px-5 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-5 py-16 text-center">
                      <Activity className="w-12 h-12 text-slate-700 mx-auto mb-3" />
                      <div className="text-slate-500 font-medium">Không tìm thấy kết quả</div>
                    </td>
                  </tr>
                ) : filtered.map((bet) => {
                  const cfg = statusConfig[bet.status];
                  const Icon = cfg.icon;
                  return (
                    <tr key={bet.id} className="border-t border-white/5 hover:bg-white/5 transition-colors group">
                      <td className="px-5 py-4">
                        <span className="text-slate-500 font-mono text-xs">{bet.id}</span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="text-white font-medium text-sm leading-snug">{bet.race}</div>
                        <div className="text-slate-500 text-xs mt-0.5">{bet.tournament}</div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="text-white text-sm font-semibold">{bet.horse}</div>
                        <div className="text-slate-500 text-xs">{bet.jockey}</div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="px-2.5 py-1 bg-blue-500/10 text-blue-400 rounded-lg text-xs font-medium border border-blue-500/20">
                          {bet.type}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-white font-semibold text-sm">${bet.amount}</td>
                      <td className="px-5 py-4 text-slate-400 text-sm font-mono">{bet.odds}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg w-fit" style={{ backgroundColor: cfg.bg }}>
                          <Icon className="w-3.5 h-3.5" style={{ color: cfg.color }} />
                          <span className="text-xs font-semibold" style={{ color: cfg.color }}>{cfg.label}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        {bet.status === 'won' ? (
                          <span className="text-[#FFDE42] font-bold text-sm">+${bet.reward}</span>
                        ) : bet.status === 'lost' ? (
                          <span className="text-slate-600 text-sm">-${bet.amount}</span>
                        ) : (
                          <span className="text-slate-500 text-sm">—</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-slate-500 text-xs whitespace-nowrap">{bet.date}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filtered.length > 0 && (
            <div className="px-5 py-3 border-t border-white/5 flex items-center justify-between">
              <span className="text-slate-500 text-sm">Hiển thị {filtered.length} / {betHistory.length} giao dịch</span>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-[#FFDE42]" />
                  <span className="text-xs text-slate-400">Thắng: {betHistory.filter(b => b.status === 'won').length}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-red-500" />
                  <span className="text-xs text-slate-400">Thua: {betHistory.filter(b => b.status === 'lost').length}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-slate-500" />
                  <span className="text-xs text-slate-400">Chờ: {betHistory.filter(b => b.status === 'pending').length}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
