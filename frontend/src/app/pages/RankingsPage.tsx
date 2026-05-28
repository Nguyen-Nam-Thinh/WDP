import { useState } from 'react';
import { Navbar } from '../components/Navbar';
import {
  Trophy,
  Medal,
  Star,
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronUp,
  Search,
  Filter,
  Award,
  Zap,
  Users,
  Timer,
  Activity,
  Crown
} from 'lucide-react';

const horses = [
  { rank: 1, prevRank: 2, name: 'Tia Chớp', owner: 'Nguyễn Minh Tâm', wins: 18, races: 22, winRate: 81.8, earnings: '2,450,000,000', points: 2840, age: 5, color: '#D4A843', trend: 'up', badge: 'Huyền Thoại' },
  { rank: 2, prevRank: 1, name: 'Ngôi Sao Đêm', owner: 'Trần Gia Bảo', wins: 15, races: 19, winRate: 78.9, earnings: '1,980,000,000', points: 2610, age: 6, color: '#8B9DC3', trend: 'down', badge: 'Bạch Kim' },
  { rank: 3, prevRank: 3, name: 'Thần Gió', owner: 'Lê Công Vinh', wins: 14, races: 20, winRate: 70.0, earnings: '1,750,000,000', points: 2380, age: 4, color: '#CD7F32', trend: 'same', badge: 'Vàng' },
  { rank: 4, prevRank: 6, name: 'Móng Vàng', owner: 'Phạm Thái Sơn', wins: 12, races: 18, winRate: 66.7, earnings: '1,420,000,000', points: 2100, age: 5, color: '#4CAF82', trend: 'up', badge: 'Bạc' },
  { rank: 5, prevRank: 4, name: 'Vinh Quang Đỏ', owner: 'Hoàng Văn Nam', wins: 11, races: 17, winRate: 64.7, earnings: '1,310,000,000', points: 1980, age: 7, color: '#E74C3C', trend: 'down', badge: 'Bạc' },
  { rank: 6, prevRank: 8, name: 'Bão Tốc', owner: 'Vũ Đình Hùng', wins: 10, races: 16, winRate: 62.5, earnings: '1,150,000,000', points: 1820, age: 4, color: '#9B59B6', trend: 'up', badge: 'Đồng' },
  { rank: 7, prevRank: 5, name: 'Hổ Phong', owner: 'Đinh Quốc Bảo', wins: 9, races: 15, winRate: 60.0, earnings: '1,020,000,000', points: 1700, age: 6, color: '#3498DB', trend: 'down', badge: 'Đồng' },
  { rank: 8, prevRank: 7, name: 'Long Mã', owner: 'Bùi Thanh Hải', wins: 8, races: 14, winRate: 57.1, earnings: '920,000,000', points: 1560, age: 5, color: '#1ABC9C', trend: 'same', badge: 'Đồng' },
];

const jockeys = [
  { rank: 1, prevRank: 1, name: 'Nguyễn Văn Anh', age: 28, wins: 45, races: 58, winRate: 77.6, earnings: '4,200,000,000', points: 5200, horse: 'Tia Chớp', trend: 'same', badge: 'Huyền Thoại', nationality: '🇻🇳' },
  { rank: 2, prevRank: 3, name: 'Trần Thị Bích', age: 25, wins: 38, races: 52, winRate: 73.1, earnings: '3,650,000,000', points: 4830, horse: 'Ngôi Sao Đêm', trend: 'up', badge: 'Bạch Kim', nationality: '🇻🇳' },
  { rank: 3, prevRank: 2, name: 'Lê Văn Cường', age: 32, wins: 35, races: 50, winRate: 70.0, earnings: '3,200,000,000', points: 4540, horse: 'Thần Gió', trend: 'down', badge: 'Vàng', nationality: '🇻🇳' },
  { rank: 4, prevRank: 5, name: 'Phạm Minh Đức', age: 27, wins: 30, races: 44, winRate: 68.2, earnings: '2,800,000,000', points: 4100, horse: 'Móng Vàng', trend: 'up', badge: 'Vàng', nationality: '🇻🇳' },
  { rank: 5, prevRank: 4, name: 'Hoàng Văn Em', age: 30, wins: 28, races: 42, winRate: 66.7, earnings: '2,600,000,000', points: 3870, horse: 'Vinh Quang Đỏ', trend: 'down', badge: 'Bạc', nationality: '🇻🇳' },
  { rank: 6, prevRank: 7, name: 'Ngô Thị Phương', age: 24, wins: 25, races: 38, winRate: 65.8, earnings: '2,350,000,000', points: 3620, horse: 'Bão Tốc', trend: 'up', badge: 'Bạc', nationality: '🇻🇳' },
  { rank: 7, prevRank: 6, name: 'Dương Minh Giang', age: 35, wins: 22, races: 36, winRate: 61.1, earnings: '2,100,000,000', points: 3280, horse: 'Hổ Phong', trend: 'down', badge: 'Đồng', nationality: '🇻🇳' },
  { rank: 8, prevRank: 8, name: 'Lý Hữu Hùng', age: 29, wins: 20, races: 35, winRate: 57.1, earnings: '1,900,000,000', points: 3010, horse: 'Long Mã', trend: 'same', badge: 'Đồng', nationality: '🇻🇳' },
];

const badgeColors: Record<string, string> = {
  'Huyền Thoại': 'bg-gradient-to-r from-amber-500 to-yellow-300 text-slate-900',
  'Bạch Kim': 'bg-gradient-to-r from-slate-300 to-slate-100 text-slate-800',
  'Vàng': 'bg-gradient-to-r from-yellow-600 to-amber-400 text-slate-900',
  'Bạc': 'bg-gradient-to-r from-slate-400 to-slate-300 text-slate-800',
  'Đồng': 'bg-gradient-to-r from-orange-700 to-orange-500 text-white',
};

const rankColors: Record<number, string> = {
  1: 'text-amber-400',
  2: 'text-slate-300',
  3: 'text-orange-500',
};

function TrendIcon({ trend }: { trend: string }) {
  if (trend === 'up') return <ChevronUp className="w-4 h-4 text-emerald-400" />;
  if (trend === 'down') return <TrendingDown className="w-4 h-4 text-red-400" />;
  return <Minus className="w-4 h-4 text-slate-500" />;
}

export function RankingsPage() {
  const [tab, setTab] = useState<'horses' | 'jockeys'>('horses');
  const [search, setSearch] = useState('');

  const filteredHorses = horses.filter(h =>
    h.name.toLowerCase().includes(search.toLowerCase()) ||
    h.owner.toLowerCase().includes(search.toLowerCase())
  );
  const filteredJockeys = jockeys.filter(j =>
    j.name.toLowerCase().includes(search.toLowerCase()) ||
    j.horse.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-200">
      <Navbar />
      {/* BG glow */}
      <div className="absolute inset-x-0 top-0 h-[500px] bg-gradient-to-b from-violet-950/30 to-transparent pointer-events-none" />

      {/* Header */}
      <div className="relative pt-28 pb-16 px-6 border-b border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-8">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-violet-500/20 border border-violet-500/30 rounded-full mb-6">
                <Crown className="w-4 h-4 text-violet-400" />
                <span className="text-sm font-semibold text-violet-400 uppercase tracking-wider">Bảng Xếp Hạng</span>
              </div>
              <h1 className="text-5xl md:text-6xl font-extrabold text-white mb-4 tracking-tight">
                Bảng Xếp Hạng<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-pink-400">Mùa Giải 2026</span>
              </h1>
              <p className="text-lg text-slate-400">
                Xếp hạng cập nhật theo thời gian thực dựa trên điểm tích lũy toàn mùa giải.
              </p>
            </div>
            {/* Top 3 podium preview */}
            <div className="flex items-end gap-3">
              {[{ pos: 2, h: 'h-16' }, { pos: 1, h: 'h-24' }, { pos: 3, h: 'h-12' }].map(({ pos, h }) => {
                const item = tab === 'horses' ? horses[pos - 1] : jockeys[pos - 1];
                return (
                  <div key={pos} className="flex flex-col items-center gap-2">
                    <div className={`w-10 h-10 rounded-full border-2 ${pos === 1 ? 'border-amber-400' : pos === 2 ? 'border-slate-300' : 'border-orange-500'} bg-slate-800 flex items-center justify-center`}>
                      <span className="text-xs font-bold text-white">{item?.name?.charAt(0)}</span>
                    </div>
                    <div className={`w-14 ${h} ${pos === 1 ? 'bg-amber-500/30 border-amber-500/50' : pos === 2 ? 'bg-slate-500/20 border-slate-500/40' : 'bg-orange-700/20 border-orange-700/40'} border rounded-t-lg flex items-center justify-center`}>
                      <span className={`text-sm font-bold ${rankColors[pos] || 'text-white'}`}>{pos}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Tab + Search bar */}
      <div className="sticky top-[72px] z-30 bg-slate-950/80 backdrop-blur-xl border-b border-white/5 py-4 px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center gap-4">
          <div className="flex bg-slate-900 rounded-xl p-1 border border-white/8">
            <button
              onClick={() => setTab('horses')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${tab === 'horses' ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/25' : 'text-slate-400 hover:text-white'}`}
            >
              <Zap className="w-4 h-4" /> Ngựa Đua
            </button>
            <button
              onClick={() => setTab('jockeys')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${tab === 'jockeys' ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/25' : 'text-slate-400 hover:text-white'}`}
            >
              <Users className="w-4 h-4" /> Kỵ Sĩ
            </button>
          </div>
          <div className="relative flex-1 max-w-sm ml-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder={tab === 'horses' ? 'Tìm ngựa, chủ sở hữu...' : 'Tìm kỵ sĩ, ngựa...'}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-slate-800/60 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-violet-500/50 transition-all"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="max-w-7xl mx-auto px-6 py-10">
        {/* Top 3 cards */}
        <div className="grid md:grid-cols-3 gap-5 mb-10">
          {(tab === 'horses' ? filteredHorses : filteredJockeys).slice(0, 3).map((item: any, i) => (
            <div
              key={item.rank}
              className={`relative p-6 rounded-2xl border transition-all hover:-translate-y-1 ${
                i === 0 ? 'bg-gradient-to-br from-amber-500/15 to-yellow-600/5 border-amber-500/30' :
                i === 1 ? 'bg-gradient-to-br from-slate-400/10 to-slate-500/5 border-slate-400/20' :
                'bg-gradient-to-br from-orange-700/10 to-orange-900/5 border-orange-700/20'
              }`}
            >
              {/* Crown for #1 */}
              {i === 0 && <Crown className="absolute top-4 right-4 w-6 h-6 text-amber-400 opacity-60" />}
              <div className="flex items-center gap-4 mb-4">
                <div className={`text-4xl font-black ${rankColors[item.rank] || 'text-white'}`}>
                  #{item.rank}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">{item.name}</h3>
                  <div className="text-sm text-slate-400">{tab === 'horses' ? item.owner : item.horse}</div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <div className="text-xl font-bold text-white">{item.wins}</div>
                  <div className="text-xs text-slate-500">Chiến Thắng</div>
                </div>
                <div>
                  <div className="text-xl font-bold text-white">{item.winRate}%</div>
                  <div className="text-xs text-slate-500">Tỷ Lệ Thắng</div>
                </div>
                <div>
                  <div className="text-xl font-bold text-white">{item.points.toLocaleString()}</div>
                  <div className="text-xs text-slate-500">Điểm</div>
                </div>
              </div>
              <span className={`mt-4 inline-block px-3 py-1 rounded-full text-xs font-bold ${badgeColors[item.badge] || 'bg-slate-700 text-white'}`}>
                {item.badge}
              </span>
            </div>
          ))}
        </div>

        {/* Full Table */}
        <div className="bg-slate-900/50 border border-white/8 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/8 bg-slate-900/80">
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider w-16">Hạng</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">{tab === 'horses' ? 'Ngựa' : 'Kỵ Sĩ'}</th>
                  <th className="text-center px-4 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Thắng</th>
                  <th className="text-center px-4 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Số Đua</th>
                  <th className="text-center px-4 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Tỷ Lệ Thắng</th>
                  <th className="text-center px-4 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Điểm</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Thu Nhập</th>
                  <th className="text-center px-4 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Danh Hiệu</th>
                </tr>
              </thead>
              <tbody>
                {(tab === 'horses' ? filteredHorses : filteredJockeys).map((item: any) => (
                  <tr key={item.rank} className="border-b border-white/5 hover:bg-white/3 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <TrendIcon trend={item.trend} />
                        <span className={`text-lg font-bold ${rankColors[item.rank] || 'text-white'}`}>
                          {item.rank}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500/30 to-purple-600/20 border border-violet-500/20 flex items-center justify-center font-bold text-sm text-white shrink-0">
                          {item.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-semibold text-white group-hover:text-violet-400 transition-colors">{item.name}</div>
                          <div className="text-xs text-slate-500">{tab === 'horses' ? `Chủ: ${item.owner}` : `Ngựa: ${item.horse}`}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className="text-emerald-400 font-bold">{item.wins}</span>
                    </td>
                    <td className="px-4 py-4 text-center text-slate-300">{item.races}</td>
                    <td className="px-4 py-4 text-center">
                      <div className="flex items-center gap-2 justify-center">
                        <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-violet-500 to-pink-500 rounded-full"
                            style={{ width: `${item.winRate}%` }}
                          />
                        </div>
                        <span className="text-white font-medium text-sm">{item.winRate}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className="text-amber-400 font-bold">{item.points.toLocaleString()}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-300">{item.earnings} đ</td>
                    <td className="px-4 py-4 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${badgeColors[item.badge] || 'bg-slate-700 text-white'}`}>
                        {item.badge}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
