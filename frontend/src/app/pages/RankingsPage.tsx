import { useState, useEffect } from 'react';
import { Navbar } from '../components/Navbar';
import {
  Trophy, Medal, TrendingUp, ChevronUp, Search, Award, Zap, Users, Activity, Crown, Loader2
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import {
  rankingsApi,
  type HorseRanking,
  type JockeyRanking,
  type OwnerRanking,
} from '../api/rankings';

const GRADE_BADGE: Record<string, { label: string; cls: string }> = {
  G1:     { label: 'G1 Premier', cls: 'bg-gradient-to-r from-amber-500 to-yellow-300 text-slate-900' },
  G2:     { label: 'G2 Elite',   cls: 'bg-gradient-to-r from-purple-500 to-purple-300 text-white' },
  G3:     { label: 'G3 Classic', cls: 'bg-gradient-to-r from-blue-500 to-blue-300 text-white' },
  Maiden: { label: 'Maiden',     cls: 'bg-slate-700/80 text-slate-300' },
};

const rankColors: Record<number, string> = { 1: 'text-amber-400', 2: 'text-slate-300', 3: 'text-orange-500' };

function WinRateBar({ rate }: { rate: number }) {
  return (
    <div className="flex items-center gap-2 justify-center">
      <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <div className="h-full bg-gradient-to-r from-violet-500 to-pink-500 rounded-full" style={{ width: `${Math.min(rate, 100)}%` }} />
      </div>
      <span className="text-white font-medium text-sm">{rate}%</span>
    </div>
  );
}

function Spinner() {
  return (
    <div className="flex justify-center py-20">
      <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-slate-600">
      <Trophy className="w-12 h-12 mb-4 opacity-30" />
      <p className="text-sm">{label}</p>
    </div>
  );
}

export function RankingsPage() {
  const { token } = useAuth();
  const [tab, setTab] = useState<'horses' | 'jockeys' | 'owners'>('horses');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  const [horses, setHorses] = useState<HorseRanking[]>([]);
  const [jockeys, setJockeys] = useState<JockeyRanking[]>([]);
  const [owners, setOwners] = useState<OwnerRanking[]>([]);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    Promise.all([
      rankingsApi.getHorseRankings(token),
      rankingsApi.getJockeyRankings(token),
      rankingsApi.getOwnerRankings(token),
    ])
      .then(([h, j, o]) => { setHorses(h); setJockeys(j); setOwners(o); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  const filteredHorses = horses.filter(h =>
    h.name.toLowerCase().includes(search.toLowerCase()) ||
    h.owner.toLowerCase().includes(search.toLowerCase())
  );
  const filteredJockeys = jockeys.filter(j =>
    j.name.toLowerCase().includes(search.toLowerCase())
  );
  const filteredOwners = owners.filter(o =>
    o.name.toLowerCase().includes(search.toLowerCase())
  );

  const currentList = tab === 'horses' ? filteredHorses : tab === 'jockeys' ? filteredJockeys : filteredOwners;
  const top3 = currentList.slice(0, 3);

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-200">
      <Navbar />
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
              <p className="text-lg text-slate-400">Xếp hạng cập nhật dựa trên điểm tích lũy toàn sự nghiệp.</p>
            </div>
            {/* Top 3 podium preview */}
            <div className="flex items-end gap-3">
              {[{ pos: 2, h: 'h-16' }, { pos: 1, h: 'h-24' }, { pos: 3, h: 'h-12' }].map(({ pos, h }) => {
                const item = currentList[pos - 1] as any;
                return (
                  <div key={pos} className="flex flex-col items-center gap-2">
                    <div className={`w-10 h-10 rounded-full border-2 ${pos === 1 ? 'border-amber-400' : pos === 2 ? 'border-slate-300' : 'border-orange-500'} bg-slate-800 flex items-center justify-center`}>
                      <span className="text-xs font-bold text-white">{item?.name?.charAt(0) ?? '?'}</span>
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

      {/* Sticky Tab + Search */}
      <div className="sticky top-[72px] z-30 bg-slate-950/80 backdrop-blur-xl border-b border-white/5 py-4 px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center gap-4">
          <div className="flex bg-slate-900 rounded-xl p-1 border border-white/8">
            {([['horses', 'Ngựa Đua', Zap], ['jockeys', 'Kỵ Sĩ', Users], ['owners', 'Chủ Ngựa', Award]] as const).map(([key, label, Icon]) => (
              <button
                key={key}
                onClick={() => { setTab(key); setSearch(''); }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${tab === key ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/25' : 'text-slate-400 hover:text-white'}`}
              >
                <Icon className="w-4 h-4" /> {label}
              </button>
            ))}
          </div>
          <div className="relative flex-1 max-w-sm ml-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm kiếm..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-slate-800/60 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-violet-500/50 transition-all"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-10">
        {loading ? (
          <Spinner />
        ) : (
          <>
            {/* Top 3 cards */}
            {top3.length > 0 && (
              <div className="grid md:grid-cols-3 gap-5 mb-10">
                {top3.map((item: any, i) => (
                  <div key={item._id} className={`relative p-6 rounded-2xl border transition-all hover:-translate-y-1 ${
                    i === 0 ? 'bg-gradient-to-br from-amber-500/15 to-yellow-600/5 border-amber-500/30' :
                    i === 1 ? 'bg-gradient-to-br from-slate-400/10 to-slate-500/5 border-slate-400/20' :
                    'bg-gradient-to-br from-orange-700/10 to-orange-900/5 border-orange-700/20'
                  }`}>
                    {i === 0 && <Crown className="absolute top-4 right-4 w-6 h-6 text-amber-400 opacity-60" />}
                    <div className="flex items-center gap-4 mb-4">
                      <div className={`text-4xl font-black ${rankColors[item.rank] || 'text-white'}`}>#{item.rank}</div>
                      <div>
                        <h3 className="text-lg font-bold text-white">{item.name}</h3>
                        <div className="text-sm text-slate-400">
                          {tab === 'horses' ? item.owner : tab === 'jockeys' ? `${item.experienceYears}năm KN` : `${item.totalHorses} ngựa`}
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div>
                        <div className="text-xl font-bold text-white">{tab === 'horses' ? item.winCount : tab === 'jockeys' ? item.winCount : item.totalWins}</div>
                        <div className="text-xs text-slate-500">Thắng</div>
                      </div>
                      <div>
                        <div className="text-xl font-bold text-white">{item.winRate}%</div>
                        <div className="text-xs text-slate-500">Tỷ Lệ</div>
                      </div>
                      <div>
                        <div className="text-xl font-bold text-white">{tab === 'horses' ? item.totalPoints : tab === 'jockeys' ? item.raceCount : item.totalRaces}</div>
                        <div className="text-xs text-slate-500">{tab === 'jockeys' || tab === 'owners' ? 'Cuộc Đua' : 'Điểm'}</div>
                      </div>
                    </div>
                    {tab === 'horses' && (
                      <span className={`mt-4 inline-block px-3 py-1 rounded-full text-xs font-bold ${GRADE_BADGE[(item as HorseRanking).currentGrade]?.cls ?? 'bg-slate-700 text-white'}`}>
                        {GRADE_BADGE[(item as HorseRanking).currentGrade]?.label}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Full Table */}
            {currentList.length === 0 ? (
              <EmptyState label={`Không có dữ liệu ${tab === 'horses' ? 'ngựa' : tab === 'jockeys' ? 'kỵ sĩ' : 'chủ ngựa'}`} />
            ) : (
              <div className="bg-slate-900/50 border border-white/8 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/8 bg-slate-900/80">
                        <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider w-16">Hạng</th>
                        <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                          {tab === 'horses' ? 'Ngựa' : tab === 'jockeys' ? 'Kỵ Sĩ' : 'Chủ Ngựa'}
                        </th>
                        <th className="text-center px-4 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Thắng</th>
                        <th className="text-center px-4 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Số Đua</th>
                        <th className="text-center px-4 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Tỷ Lệ Thắng</th>
                        {tab === 'horses' && <th className="text-center px-4 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Điểm</th>}
                        {tab === 'jockeys' && <th className="text-center px-4 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Kinh Nghiệm</th>}
                        {tab === 'owners' && <th className="text-center px-4 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Ngựa</th>}
                        <th className="text-center px-4 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                          {tab === 'horses' ? 'Cấp' : tab === 'owners' ? 'Thu Nhập' : 'Danh Hiệu'}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentList.map((item: any) => (
                        <tr key={item._id} className="border-b border-white/5 hover:bg-white/3 transition-colors group">
                          <td className="px-6 py-4">
                            <span className={`text-lg font-bold ${rankColors[item.rank] || 'text-white'}`}>#{item.rank}</span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500/30 to-purple-600/20 border border-violet-500/20 flex items-center justify-center font-bold text-sm text-white shrink-0">
                                {item.name.charAt(0)}
                              </div>
                              <div>
                                <div className="font-semibold text-white group-hover:text-violet-400 transition-colors">{item.name}</div>
                                <div className="text-xs text-slate-500">
                                  {tab === 'horses' ? `Chủ: ${item.owner}` : tab === 'jockeys' ? `${item.experienceYears} năm KN` : `${item.totalHorses} ngựa đua`}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <span className="text-emerald-400 font-bold">
                              {tab === 'owners' ? item.totalWins : item.winCount}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-center text-slate-300">
                            {tab === 'owners' ? item.totalRaces : item.raceCount}
                          </td>
                          <td className="px-4 py-4 text-center">
                            <WinRateBar rate={item.winRate} />
                          </td>
                          {tab === 'horses' && (
                            <td className="px-4 py-4 text-center">
                              <span className="text-amber-400 font-bold">{item.totalPoints.toLocaleString()}</span>
                            </td>
                          )}
                          {tab === 'jockeys' && (
                            <td className="px-4 py-4 text-center text-slate-300">{item.experienceYears} năm</td>
                          )}
                          {tab === 'owners' && (
                            <td className="px-4 py-4 text-center text-slate-300">{item.totalHorses}</td>
                          )}
                          <td className="px-4 py-4 text-center">
                            {tab === 'horses' ? (
                              <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${GRADE_BADGE[item.currentGrade]?.cls ?? 'bg-slate-700 text-white'}`}>
                                {GRADE_BADGE[item.currentGrade]?.label ?? item.currentGrade}
                              </span>
                            ) : tab === 'owners' ? (
                              <span className="text-purple-400 font-bold text-sm">{item.totalEarnings.toLocaleString()}</span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-700/80 text-slate-300">
                                {item.winCount >= 30 ? 'Huyền Thoại' : item.winCount >= 20 ? 'Bạch Kim' : item.winCount >= 10 ? 'Vàng' : item.winCount >= 5 ? 'Bạc' : 'Đồng'}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
