import { useState, useEffect } from 'react';
import { PublicShell } from '../components/layout/PublicShell';
import {
  Trophy, Search, Award, Zap, Users, Crown, Loader2, Flag, ChevronRight, Clock, Coins
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Pagination } from '../components/Pagination';
import {
  rankingsApi,
  type HorseRanking,
  type JockeyRanking,
  type OwnerRanking,
  type FinishedRace,
  type RaceResultEntry,
} from '../api/rankings';

const PAGE_SIZE = 10;
const RACE_LIST_PAGE_SIZE = 8;

function formatFinishTime(ms: number | null): string {
  if (!ms) return '—';
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const centiseconds = Math.floor((ms % 1000) / 10);
  return minutes > 0
    ? `${minutes}:${String(seconds).padStart(2, '0')}.${String(centiseconds).padStart(2, '0')}`
    : `${seconds}.${String(centiseconds).padStart(2, '0')}s`;
}

const POSITION_STYLE: Record<number, string> = {
  1: 'text-gold font-bold',
  2: 'text-[#9A937F] font-bold',
  3: 'text-[#A85C32] font-bold',
};

const POSITION_MEDAL: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };

const GRADE_BADGE: Record<string, { label: string; cls: string }> = {
  G1:     { label: 'G1 Premier', cls: 'bg-gold text-foreground' },
  G2:     { label: 'G2 Elite',   cls: 'border border-secondary text-secondary' },
  G3:     { label: 'G3 Classic', cls: 'border border-primary text-primary' },
  Maiden: { label: 'Maiden',     cls: 'border border-muted-foreground text-muted-foreground' },
};

const rankColors: Record<number, string> = { 1: 'text-gold', 2: 'text-[#9A937F]', 3: 'text-[#A85C32]' };
const RACES_PER_PAGE = 10;

function WinRateBar({ rate }: { rate: number }) {
  return (
    <div className="flex items-center gap-2 justify-center">
      <div className="w-16 h-1.5 bg-muted overflow-hidden">
        <div className="h-full bg-primary" style={{ width: `${Math.min(rate, 100)}%` }} />
      </div>
      <span className="text-foreground font-medium text-sm tabular-nums">{rate}%</span>
    </div>
  );
}

function Spinner() {
  return (
    <div className="flex justify-center py-20">
      <Loader2 className="w-8 h-8 text-primary animate-spin" />
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
      <Trophy className="w-12 h-12 mb-4 opacity-30" />
      <p className="text-sm">{label}</p>
    </div>
  );
}

export function RankingsPage() {
  const { token } = useAuth();
  const [tab, setTab] = useState<'horses' | 'jockeys' | 'owners' | 'races'>('horses');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  const [horses, setHorses] = useState<HorseRanking[]>([]);
  const [jockeys, setJockeys] = useState<JockeyRanking[]>([]);
  const [owners, setOwners] = useState<OwnerRanking[]>([]);

  // Pagination
  const [page, setPage] = useState(1);
  const [racePage, setRacePage] = useState(1);

  // Race results state
  const [finishedRaces, setFinishedRaces] = useState<FinishedRace[]>([]);
  const [selectedRaceId, setSelectedRaceId] = useState<string | null>(null);
  const [raceResults, setRaceResults] = useState<RaceResultEntry[]>([]);
  const [racesLoading, setRacesLoading] = useState(false);
  const [resultsLoading, setResultsLoading] = useState(false);
  const [raceSearch, setRaceSearch] = useState('');

  useEffect(() => {
    setLoading(true);
    Promise.all([
      rankingsApi.getHorseRankings(token, 15),
      rankingsApi.getJockeyRankings(token, 15),
      rankingsApi.getOwnerRankings(token, 15),
    ])
      .then(([h, j, o]) => { setHorses(h); setJockeys(j); setOwners(o); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => {
    if (tab !== 'races') return;
    setRacesLoading(true);
    rankingsApi.getFinishedRaces(token, 200)
      .then((races) => {
        setFinishedRaces(races);
        if (races.length > 0 && !selectedRaceId) {
          setSelectedRaceId(races[0]._id);
        }
      })
      .catch(() => {})
      .finally(() => setRacesLoading(false));
  }, [tab, token]);

  useEffect(() => {
    if (!selectedRaceId) return;
    setResultsLoading(true);
    rankingsApi.getRaceResults(selectedRaceId, token)
      .then(setRaceResults)
      .catch(() => {})
      .finally(() => setResultsLoading(false));
  }, [selectedRaceId, token]);

  const selectedRace = finishedRaces.find((r) => r._id === selectedRaceId);
  const filteredRaces = finishedRaces.filter((r) =>
    r.name.toLowerCase().includes(raceSearch.toLowerCase()) ||
    r.tournamentName.toLowerCase().includes(raceSearch.toLowerCase())
  );
  const totalRacePages = Math.max(1, Math.ceil(filteredRaces.length / RACES_PER_PAGE));
  const pagedRaces = filteredRaces.slice((racePage - 1) * RACES_PER_PAGE, racePage * RACES_PER_PAGE);

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
    <PublicShell>
      {/* Header */}
      <div className="relative pt-14 pb-16 px-6 border-b border-border bg-card">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-8">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 border border-secondary/30 rounded-full mb-6">
                <Crown className="w-4 h-4 text-secondary" />
                <span className="text-sm font-semibold text-secondary uppercase tracking-wider">Bảng Xếp Hạng</span>
              </div>
              <h1 className="font-serif text-5xl md:text-6xl font-bold text-foreground mb-4 tracking-tight">
                Bảng Xếp Hạng<br />
                <span className="italic text-secondary">Mùa Giải 2026</span>
              </h1>
              <p className="text-lg text-muted-foreground">Xếp hạng cập nhật dựa trên điểm tích lũy toàn sự nghiệp.</p>
            </div>
            {/* Top 3 podium preview */}
            {tab !== 'races' && (
              <div className="flex items-end gap-3">
                {[{ pos: 2, h: 'h-16' }, { pos: 1, h: 'h-24' }, { pos: 3, h: 'h-12' }].map(({ pos, h }) => {
                  const item = currentList[pos - 1] as any;
                  return (
                    <div key={pos} className="flex flex-col items-center gap-2">
                      <div className={`w-10 h-10 rounded-full border-2 ${pos === 1 ? 'border-gold' : pos === 2 ? 'border-[#9A937F]' : 'border-[#A85C32]'} bg-card flex items-center justify-center`}>
                        <span className="text-xs font-bold text-foreground">{item?.name?.charAt(0) ?? '?'}</span>
                      </div>
                      <div className={`w-14 ${h} ${pos === 1 ? 'bg-gold/25 border-gold/60' : pos === 2 ? 'bg-[#9A937F]/20 border-[#9A937F]/50' : 'bg-[#A85C32]/15 border-[#A85C32]/40'} border flex items-center justify-center`}>
                        <span className={`text-sm font-bold ${rankColors[pos] || 'text-foreground'}`}>{pos}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sticky Tab + Search */}
      <div className="sticky top-[64px] z-30 bg-background/95 backdrop-blur-sm border-b border-border py-4 px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center gap-4">
          <div className="flex bg-card p-1 border border-border">
            {([['horses', 'Ngựa Đua', Zap], ['jockeys', 'Kỵ Sĩ', Users], ['owners', 'Chủ Ngựa', Award], ['races', 'Kết Quả Race', Flag]] as const).map(([key, label, Icon]) => (
              <button
                type="button"
                key={key}
                onClick={() => { setTab(key); setSearch(''); }}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold transition-all ${tab === key ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <Icon className="w-4 h-4" /> {label}
              </button>
            ))}
          </div>
          {tab !== 'races' && (
            <div className="relative flex-1 max-w-sm ml-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Tìm kiếm..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-card border border-border pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-all"
              />
            </div>
          )}
        </div>
      </div>

      {/* Race Results Tab */}
      {tab === 'races' && (
        <div className="max-w-7xl mx-auto px-6 py-10">
          {racesLoading ? (
            <Spinner />
          ) : finishedRaces.length === 0 ? (
            <EmptyState label="Chưa có race nào kết thúc" />
          ) : (
            <div className="flex gap-6 h-[calc(100vh-260px)] min-h-[500px]">
              {/* Left: race list */}
              <div className="w-72 shrink-0 flex flex-col border border-border bg-card overflow-hidden">
                <div className="p-3 border-b border-border">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Tìm race..."
                      value={raceSearch}
                      onChange={(e) => { setRaceSearch(e.target.value); setRacePage(1); }}
                      className="w-full bg-background border border-border pl-8 pr-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>
                <div className="overflow-y-auto flex-1">
                  {filteredRaces.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-8">Không tìm thấy</p>
                  ) : pagedRaces.map((race) => (
                    <button
                      key={race._id}
                      type="button"
                      onClick={() => setSelectedRaceId(race._id)}
                      className={`w-full text-left px-4 py-3 border-b border-border transition-colors flex items-start justify-between gap-2 group ${selectedRaceId === race._id ? 'bg-primary/10 border-l-2 border-l-primary' : 'hover:bg-muted/50'}`}
                    >
                      <div className="min-w-0">
                        <div className={`text-sm font-semibold truncate ${selectedRaceId === race._id ? 'text-primary' : 'text-foreground group-hover:text-primary'} transition-colors`}>
                          {race.name}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5 truncate">{race.tournamentName}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 uppercase tracking-wider ${GRADE_BADGE[race.grade]?.cls ?? 'border border-muted-foreground text-muted-foreground'}`}>
                            {race.grade}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {new Date(race.scheduledTime).toLocaleDateString('vi-VN')}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className={`w-4 h-4 shrink-0 mt-0.5 ${selectedRaceId === race._id ? 'text-primary' : 'text-muted-foreground'}`} />
                    </button>
                  ))}
                </div>
                {totalRacePages > 1 && (
                  <div className="shrink-0 border-t border-border px-3 py-2 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      disabled={racePage <= 1}
                      onClick={() => setRacePage((p) => p - 1)}
                      className="px-2.5 py-1 text-xs font-semibold border border-border text-muted-foreground hover:text-foreground hover:border-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      ‹ Trước
                    </button>
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {racePage} / {totalRacePages}
                    </span>
                    <button
                      type="button"
                      disabled={racePage >= totalRacePages}
                      onClick={() => setRacePage((p) => p + 1)}
                      className="px-2.5 py-1 text-xs font-semibold border border-border text-muted-foreground hover:text-foreground hover:border-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      Sau ›
                    </button>
                  </div>
                )}
              </div>

              {/* Right: results */}
              <div className="flex-1 border border-border bg-card overflow-hidden flex flex-col">
                {!selectedRaceId ? (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                    <Flag className="w-12 h-12 mb-4 opacity-30" />
                    <p className="text-sm">Chọn một race để xem kết quả</p>
                  </div>
                ) : resultsLoading ? (
                  <Spinner />
                ) : (
                  <>
                    {/* Race info header */}
                    {selectedRace && (
                      <div className="px-6 py-4 border-b border-border flex flex-wrap items-center gap-4">
                        <div>
                          <h2 className="font-serif text-xl font-bold text-foreground">{selectedRace.name}</h2>
                          <p className="text-sm text-muted-foreground">{selectedRace.tournamentName}</p>
                        </div>
                        <div className="flex items-center gap-3 ml-auto flex-wrap">
                          <span className={`px-2.5 py-1 text-xs font-bold uppercase tracking-wider ${GRADE_BADGE[selectedRace.grade]?.cls ?? 'border border-muted-foreground text-muted-foreground'}`}>
                            {GRADE_BADGE[selectedRace.grade]?.label}
                          </span>
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Clock className="w-3.5 h-3.5" />
                            {new Date(selectedRace.scheduledTime).toLocaleString('vi-VN')}
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Coins className="w-3.5 h-3.5 text-gold" />
                            <span className="text-gold font-semibold">{selectedRace.purse.toLocaleString('vi-VN')} VNĐ</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {raceResults.length === 0 ? (
                      <EmptyState label="Chưa có kết quả cho race này" />
                    ) : (
                      <div className="overflow-auto flex-1">
                        <table className="w-full">
                          <thead className="sticky top-0 z-10">
                            <tr className="border-b border-border bg-muted/70 backdrop-blur-sm">
                              <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-20">Vị Trí</th>
                              <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Ngựa</th>
                              <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Kỵ Sĩ</th>
                              <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Thời Gian</th>
                              <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Điểm</th>
                              <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Thưởng</th>
                            </tr>
                          </thead>
                          <tbody>
                            {raceResults.map((entry) => (
                              <tr key={entry._id} className="border-b border-border hover:bg-muted/40 transition-colors">
                                <td className="px-6 py-4">
                                  <div className="flex items-center gap-2">
                                    {POSITION_MEDAL[entry.position] ? (
                                      <span className="text-xl">{POSITION_MEDAL[entry.position]}</span>
                                    ) : (
                                      <span className={`text-base font-bold tabular-nums ${POSITION_STYLE[entry.position] ?? 'text-foreground'}`}>
                                        #{entry.position}
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="font-semibold text-foreground">{entry.horseName}</div>
                                  <span className={`text-[10px] font-bold px-1.5 py-0.5 uppercase tracking-wider ${GRADE_BADGE[entry.horseGrade]?.cls ?? 'border border-muted-foreground text-muted-foreground'}`}>
                                    {entry.horseGrade}
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-sm text-muted-foreground">{entry.jockeyName}</td>
                                <td className="px-4 py-4 text-center font-mono text-sm text-foreground tabular-nums">
                                  {formatFinishTime(entry.finishTime)}
                                </td>
                                <td className="px-4 py-4 text-center">
                                  {entry.pointsEarned > 0 ? (
                                    <span className="text-primary font-bold tabular-nums">+{entry.pointsEarned}</span>
                                  ) : (
                                    <span className="text-muted-foreground">—</span>
                                  )}
                                </td>
                                <td className="px-4 py-4 text-center">
                                  {entry.prizeAmount > 0 ? (
                                    <span className="text-gold font-bold tabular-nums">{entry.prizeAmount.toLocaleString('vi-VN')} VNĐ</span>
                                  ) : (
                                    <span className="text-muted-foreground">—</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-10">
        {tab === 'races' ? null : loading ? (
          <Spinner />
        ) : (
          <>
            {/* Top 3 cards */}
            {top3.length > 0 && (
              <div className="grid md:grid-cols-3 gap-5 mb-10">
                {top3.map((item: any, i) => (
                  <div key={item._id} className={`relative p-6 bg-card border transition-all hover:-translate-y-1 ${
                    i === 0 ? 'border-gold' :
                    i === 1 ? 'border-[#9A937F]' :
                    'border-[#A85C32]'
                  }`}>
                    {i === 0 && <Crown className="absolute top-4 right-4 w-6 h-6 text-gold opacity-70" />}
                    <div className="flex items-center gap-4 mb-4">
                      <div className={`font-serif text-4xl font-bold ${rankColors[item.rank] || 'text-foreground'}`}>#{item.rank}</div>
                      <div>
                        <h3 className="font-serif text-lg font-bold text-foreground">{item.name}</h3>
                        <div className="text-sm text-muted-foreground">
                          {tab === 'horses' ? item.owner : tab === 'jockeys' ? `${item.experienceYears}năm KN` : `${item.totalHorses} ngựa`}
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div>
                        <div className="text-xl font-bold text-foreground tabular-nums">{tab === 'horses' ? item.winCount : tab === 'jockeys' ? item.winCount : item.totalWins}</div>
                        <div className="text-xs text-muted-foreground">Thắng</div>
                      </div>
                      <div>
                        <div className="text-xl font-bold text-foreground tabular-nums">{item.winRate}%</div>
                        <div className="text-xs text-muted-foreground">Tỷ Lệ</div>
                      </div>
                      <div>
                        <div className="text-xl font-bold text-foreground tabular-nums">{tab === 'horses' ? item.totalPoints : tab === 'jockeys' ? item.raceCount : item.totalRaces}</div>
                        <div className="text-xs text-muted-foreground">{tab === 'jockeys' || tab === 'owners' ? 'Cuộc Đua' : 'Điểm'}</div>
                      </div>
                    </div>
                    {tab === 'horses' && (
                      <span className={`mt-4 inline-block px-3 py-1 text-xs font-bold uppercase tracking-wider ${GRADE_BADGE[(item as HorseRanking).currentGrade]?.cls ?? 'border border-muted-foreground text-muted-foreground'}`}>
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
              <div className="bg-card border border-border overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border bg-muted/50">
                        <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-16">Hạng</th>
                        <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          {tab === 'horses' ? 'Ngựa' : tab === 'jockeys' ? 'Kỵ Sĩ' : 'Chủ Ngựa'}
                        </th>
                        <th className="text-center px-4 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Thắng</th>
                        <th className="text-center px-4 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Số Đua</th>
                        <th className="text-center px-4 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tỷ Lệ Thắng</th>
                        {tab === 'horses' && <th className="text-center px-4 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Điểm</th>}
                        {tab === 'jockeys' && <th className="text-center px-4 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Kinh Nghiệm</th>}
                        {tab === 'owners' && <th className="text-center px-4 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Ngựa</th>}
                        <th className="text-center px-4 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          {tab === 'horses' ? 'Cấp' : tab === 'owners' ? 'Thu Nhập' : 'Danh Hiệu'}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentList.map((item: any) => (
                        <tr key={item._id} className="border-b border-border hover:bg-muted/40 transition-colors group">
                          <td className="px-6 py-4">
                            <span className={`text-lg font-bold tabular-nums ${rankColors[item.rank] || 'text-foreground'}`}>#{item.rank}</span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-sm text-primary shrink-0">
                                {item.name.charAt(0)}
                              </div>
                              <div>
                                <div className="font-semibold text-foreground group-hover:text-primary transition-colors">{item.name}</div>
                                <div className="text-xs text-muted-foreground">
                                  {tab === 'horses' ? `Chủ: ${item.owner}` : tab === 'jockeys' ? `${item.experienceYears} năm KN` : `${item.totalHorses} ngựa đua`}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <span className="text-primary font-bold tabular-nums">
                              {tab === 'owners' ? item.totalWins : item.winCount}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-center text-foreground tabular-nums">
                            {tab === 'owners' ? item.totalRaces : item.raceCount}
                          </td>
                          <td className="px-4 py-4 text-center">
                            <WinRateBar rate={item.winRate} />
                          </td>
                          {tab === 'horses' && (
                            <td className="px-4 py-4 text-center">
                              <span className="text-gold font-bold tabular-nums">{item.totalPoints.toLocaleString()}</span>
                            </td>
                          )}
                          {tab === 'jockeys' && (
                            <td className="px-4 py-4 text-center text-foreground tabular-nums">{item.experienceYears} năm</td>
                          )}
                          {tab === 'owners' && (
                            <td className="px-4 py-4 text-center text-foreground tabular-nums">{item.totalHorses}</td>
                          )}
                          <td className="px-4 py-4 text-center">
                            {tab === 'horses' ? (
                              <span className={`px-2.5 py-1 text-xs font-bold uppercase tracking-wider ${GRADE_BADGE[item.currentGrade]?.cls ?? 'border border-muted-foreground text-muted-foreground'}`}>
                                {GRADE_BADGE[item.currentGrade]?.label ?? item.currentGrade}
                              </span>
                            ) : tab === 'owners' ? (
                              <span className="text-gold font-bold text-sm tabular-nums">{item.totalEarnings.toLocaleString('vi-VN')} VNĐ</span>
                            ) : (
                              <span className="px-2.5 py-1 text-xs font-bold bg-muted text-muted-foreground uppercase tracking-wider">
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
    </PublicShell>
  );
}
