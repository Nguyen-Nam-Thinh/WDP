import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Navbar } from '../components/Navbar';
import {
  Zap, Target, BarChart3, Clock, Trophy, Users, Flame, Activity,
  Eye, Check, AlertCircle, Lock, LogIn, Medal, Flag, MapPin, Wind,
  ChevronRight, Award, ArrowUpRight, Crown, Sparkles, Info, Loader2,
} from 'lucide-react';
import { Button } from '@mui/material';
import { useAuth } from '../hooks/useAuth';
import { raceApi, type Race, type RaceResultEntry } from '../api/race';
import { betApi, type Bet, type BetType, BET_MULTIPLIERS } from '../api/bet';
import { toast } from 'sonner';

// ─── Types ────────────────────────────────────────────────────────────────────

interface HorseEntry {
  registrationId: string;
  horseId: string;
  horseName: string;
  currentGrade: string;
  totalPoints: number;
  winRate: number;
  jockeyId?: string;
  jockeyName?: string;
  jockeyExperience?: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const formColor = (pos: number) => {
  if (pos === 1) return 'bg-emerald-500 text-white';
  if (pos === 2) return 'bg-blue-500 text-white';
  if (pos === 3) return 'bg-amber-500 text-white';
  return 'bg-slate-700 text-slate-400';
};

const GRADE_COLOR: Record<string, string> = {
  G1: 'text-[#FFDE42] border-[#FFDE42]/40 bg-[#FFDE42]/10',
  G2: 'text-purple-300 border-purple-500/40 bg-purple-500/10',
  G3: 'text-blue-300 border-blue-500/40 bg-blue-500/10',
  Maiden: 'text-slate-400 border-slate-600/40 bg-slate-700/20',
};

// ─── Login Gate Modal ─────────────────────────────────────────────────────────

function LoginGateModal({ onClose, onLogin }: { onClose: () => void; onLogin: () => void }) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-3xl overflow-hidden" style={{ background: 'linear-gradient(135deg,#0F1117,#141820)', border: '1px solid rgba(255,255,255,0.1)' }}>
        <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg,#10b981,#06b6d4)' }} />
        <div className="p-8 text-center">
          <div className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#10b981,#06b6d4)', boxShadow: '0 0 40px rgba(16,185,129,0.3)' }}>
            <Lock className="w-9 h-9 text-white" />
          </div>
          <h2 className="text-2xl font-black text-white mb-3">Yêu Cầu Đăng Nhập</h2>
          <p className="text-slate-400 leading-relaxed mb-8">Bạn cần <strong className="text-white">đăng nhập</strong> để đặt cược và xem lịch sử dự đoán.</p>
          <div className="space-y-3">
            <button onClick={onLogin} className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-base font-bold transition-all hover:opacity-90"
              style={{ background: 'linear-gradient(135deg,#10b981,#06b6d4)', color: 'white', boxShadow: '0 8px 24px rgba(16,185,129,0.3)' }}>
              <LogIn className="w-5 h-5" /> Đăng Nhập Ngay
            </button>
            <button onClick={onClose} className="w-full py-3 rounded-2xl text-sm font-medium text-slate-500 hover:text-white transition-colors">
              Tiếp tục xem (không đặt cược)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Results Board ────────────────────────────────────────────────────────────

function ResultsBoard({ token }: { token: string | null }) {
  const [finishedRaces, setFinishedRaces] = useState<Race[]>([]);
  const [selectedRace, setSelectedRace] = useState<Race | null>(null);
  const [results, setResults] = useState<RaceResultEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) return;
    raceApi.getRaces(token, { status: 'finished', limit: 5 })
      .then(r => {
        const races = r.races ?? [];
        setFinishedRaces(races);
        if (races.length > 0) setSelectedRace(races[0]);
      }).catch(() => {});
  }, [token]);

  useEffect(() => {
    if (!selectedRace || !token) return;
    setLoading(true);
    raceApi.getRaceResults(token, selectedRace._id)
      .then(r => setResults(r.results ?? []))
      .catch(() => setResults([]))
      .finally(() => setLoading(false));
  }, [selectedRace, token]);

  if (!token) return (
    <div className="flex flex-col items-center justify-center py-20 text-slate-500">
      <Lock className="w-12 h-12 mb-4 opacity-30" />
      <p>Đăng nhập để xem kết quả</p>
    </div>
  );

  if (finishedRaces.length === 0) return (
    <div className="flex flex-col items-center justify-center py-20 text-slate-500">
      <Trophy className="w-12 h-12 mb-4 opacity-30" />
      <p>Chưa có cuộc đua nào hoàn thành</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#F59E0B20,#EF444415)' }}>
          <Trophy className="w-5 h-5 text-amber-400" />
        </div>
        <div>
          <h2 className="text-lg font-black text-white">Kết Quả Chính Thức</h2>
          <p className="text-xs text-slate-500">Bảng kết quả đua ngựa chi tiết</p>
        </div>
      </div>

      {/* Race selector */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {finishedRaces.map(r => (
          <button key={r._id} onClick={() => setSelectedRace(r)}
            className={`flex-shrink-0 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${selectedRace?._id === r._id ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
            style={selectedRace?._id === r._id ? { background: 'linear-gradient(135deg,#F59E0B,#EF4444)', boxShadow: '0 4px 16px rgba(245,158,11,0.3)' } : { backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
            {r.name}
          </button>
        ))}
      </div>

      {/* Race info */}
      {selectedRace && (
        <div className="relative overflow-hidden rounded-2xl p-6" style={{ background: 'linear-gradient(135deg,rgba(245,158,11,0.12),rgba(239,68,68,0.08))', border: '1px solid rgba(245,158,11,0.25)' }}>
          <h3 className="text-xl font-black text-white mb-2">{selectedRace.name}</h3>
          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
            <span className="flex items-center gap-1"><Flag className="w-3 h-3" />{selectedRace.grade}</span>
            <span className="flex items-center gap-1"><Activity className="w-3 h-3" />{selectedRace.distance}m</span>
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(selectedRace.scheduledTime).toLocaleDateString('vi-VN')}</span>
            <span className="ml-auto text-amber-400 font-bold">{selectedRace.purse.toLocaleString()} coins giải thưởng</span>
          </div>
        </div>
      )}

      {/* Results */}
      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-amber-400" /></div>
      ) : results.length === 0 ? (
        <div className="text-center py-10 text-slate-500 text-sm">Chưa có kết quả</div>
      ) : (
        <div className="overflow-hidden rounded-2xl" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="grid grid-cols-12 gap-2 px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-600" style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}>
            <div className="col-span-1 text-center">Hạng</div>
            <div className="col-span-5">Ngựa / Kỵ Sĩ</div>
            <div className="col-span-2 text-center">Thời Gian</div>
            <div className="col-span-2 text-center">Điểm</div>
            <div className="col-span-2 text-right">Giải Thưởng</div>
          </div>
          <div className="divide-y divide-white/5">
            {results.sort((a, b) => a.position - b.position).map((r, idx) => (
              <div key={r._id} className={`grid grid-cols-12 gap-2 px-5 py-4 items-center hover:bg-white/3 ${idx === 0 ? 'bg-amber-500/5' : ''}`}>
                <div className="col-span-1 flex justify-center">
                  {r.position === 1 ? (
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#F59E0B,#D97706)', boxShadow: '0 4px 12px rgba(245,158,11,0.4)' }}>
                      <Crown className="w-4 h-4 text-white" />
                    </div>
                  ) : r.position <= 3 ? (
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm" style={{ background: r.position === 2 ? '#64748B' : '#CD7F32' }}>
                      <span className="text-white">{r.position}</span>
                    </div>
                  ) : (
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold bg-white/5 text-slate-500">{r.position}</div>
                  )}
                </div>
                <div className="col-span-5">
                  <div className={`font-black text-sm ${r.position === 1 ? 'text-amber-400' : r.position === 2 ? 'text-slate-300' : 'text-slate-400'}`}>
                    {r.horseId?.name ?? '—'}
                    {r.position === 1 && <span className="ml-2 text-[10px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded border border-amber-500/30">VÔ ĐỊCH</span>}
                  </div>
                  {r.jockeyId && <div className="text-xs text-slate-500 mt-0.5">🏇 {r.jockeyId.fullName}</div>}
                </div>
                <div className="col-span-2 text-center">
                  <span className="text-sm font-mono text-slate-400">{(r.finishTime / 1000).toFixed(2)}s</span>
                </div>
                <div className="col-span-2 text-center">
                  <span className="text-amber-400 font-bold">+{r.pointsEarned}</span>
                </div>
                <div className="col-span-2 text-right">
                  {r.prizeAmount > 0 ? (
                    <span className="text-emerald-400 font-black text-sm">{r.prizeAmount.toLocaleString()}</span>
                  ) : (
                    <span className="text-slate-700 text-xs">—</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export function PredictionsPage() {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const isLoggedIn = !!user && !!token;

  const [showLoginModal, setShowLoginModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'predict' | 'results'>('predict');

  // Races
  const [races, setRaces] = useState<Race[]>([]);
  const [selectedRace, setSelectedRace] = useState<Race | null>(null);
  const [loadingRaces, setLoadingRaces] = useState(false);

  // Horses for selected race
  const [horses, setHorses] = useState<HorseEntry[]>([]);
  const [loadingHorses, setLoadingHorses] = useState(false);

  // Bet
  const [selectedHorseIdx, setSelectedHorseIdx] = useState<number | null>(null);
  const [betType, setBetType] = useState<BetType>('win');
  const [betAmount, setBetAmount] = useState('');
  const [placing, setPlacing] = useState(false);
  const [placed, setPlaced] = useState(false);

  // Bet history
  const [myBets, setMyBets] = useState<Bet[]>([]);
  const [loadingBets, setLoadingBets] = useState(false);

  // Load open+running races on mount
  useEffect(() => {
    if (!token) return;
    setLoadingRaces(true);
    Promise.all([
      raceApi.getRaces(token, { status: 'open', limit: 5 }),
      raceApi.getRaces(token, { status: 'running', limit: 3 }),
    ])
      .then(([openRes, runningRes]) => {
        const all = [...(runningRes.races ?? []), ...(openRes.races ?? [])];
        setRaces(all);
        if (all.length > 0) setSelectedRace(all[0]);
      })
      .catch(() => {})
      .finally(() => setLoadingRaces(false));
  }, [token]);

  // Load horses when race changes
  useEffect(() => {
    if (!selectedRace || !token) return;
    setHorses([]);
    setSelectedHorseIdx(null);
    setLoadingHorses(true);
    raceApi.getRaceHorses(token, selectedRace._id)
      .then(r => setHorses(r.horses ?? []))
      .catch(() => setHorses([]))
      .finally(() => setLoadingHorses(false));
  }, [selectedRace, token]);

  // Load bets on mount
  useEffect(() => {
    if (!token) return;
    setLoadingBets(true);
    betApi.getMyBets(token, { limit: 10 })
      .then(r => setMyBets(r.bets ?? []))
      .catch(() => {})
      .finally(() => setLoadingBets(false));
  }, [token, placed]);

  const selectedHorse = selectedHorseIdx !== null ? horses[selectedHorseIdx] : null;
  const multiplier = BET_MULTIPLIERS[betType];
  const potentialWin = selectedHorse && betAmount && !isNaN(Number(betAmount))
    ? Math.floor(Number(betAmount) * multiplier)
    : null;

  const handleBetClick = async () => {
    if (!isLoggedIn) { setShowLoginModal(true); return; }
    if (!selectedRace || !selectedHorse || !betAmount) return;
    const amount = Number(betAmount);
    if (isNaN(amount) || amount < 1) { toast.error('Số tiền tối thiểu là 1'); return; }
    setPlacing(true);
    try {
      await betApi.place(token!, { raceId: selectedRace._id, horseId: selectedHorse.horseId, betType, amount });
      toast.success(`Đặt cược thành công! Tiềm năng: +${potentialWin?.toLocaleString()} coins`);
      setPlaced(p => !p);
      setSelectedHorseIdx(null);
      setBetAmount('');
    } catch (err: any) {
      toast.error(err.message || 'Đặt cược thất bại');
    } finally {
      setPlacing(false);
    }
  };

  const wonBets = myBets.filter(b => b.status === 'won').length;
  const settledBets = myBets.filter(b => b.status === 'won' || b.status === 'lost').length;
  const winRate = settledBets > 0 ? Math.round((wonBets / settledBets) * 100) : 0;
  const totalWon = myBets.reduce((s, b) => s + (b.payoutAmount || 0), 0);

  return (
    <div className="min-h-screen text-slate-200" style={{ backgroundColor: '#09090F', fontFamily: "'Inter','Segoe UI',sans-serif" }}>
      <Navbar />

      {showLoginModal && (
        <LoginGateModal onClose={() => setShowLoginModal(false)} onLogin={() => navigate('/login')} />
      )}

      {/* BG glows */}
      <div className="absolute inset-x-0 top-0 h-[600px] pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/3 w-96 h-96 rounded-full opacity-8" style={{ background: 'radial-gradient(circle,#10b981,transparent 70%)', filter: 'blur(90px)' }} />
        <div className="absolute top-20 right-1/3 w-80 h-80 rounded-full opacity-6" style={{ background: 'radial-gradient(circle,#06b6d4,transparent 70%)', filter: 'blur(90px)' }} />
      </div>

      {/* Header */}
      <div className="relative pt-28 pb-14 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row items-start lg:items-end justify-between gap-10">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 text-sm font-bold uppercase tracking-widest" style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)', color: '#10b981' }}>
                <Zap className="w-4 h-4" /> Dự Đoán &amp; Cược
              </div>
              <h1 className="text-5xl md:text-6xl font-black text-white mb-4 leading-none tracking-tight">
                Dự Đoán<br />
                <span style={{ background: 'linear-gradient(135deg,#10b981,#06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  Cuộc Đua
                </span>
              </h1>
              <p className="text-lg text-slate-400 max-w-xl leading-relaxed">
                Phân tích xu hướng, xem phong độ ngựa và đưa ra dự đoán chính xác.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3 shrink-0">
              {[
                { label: 'Tỷ Lệ Đúng', value: isLoggedIn ? `${winRate}%` : '—', color: '#10b981', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.25)', icon: Target },
                { label: 'Đã Cược', value: isLoggedIn ? String(myBets.length) : '—', color: '#F59E0B', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.25)', icon: BarChart3 },
                { label: 'Tổng Thắng', value: isLoggedIn ? `${(totalWon / 1000).toFixed(0)}K` : '—', color: '#8B5CF6', bg: 'rgba(139,92,246,0.1)', border: 'rgba(139,92,246,0.25)', icon: Sparkles },
              ].map(({ label, value, color, bg, border, icon: Icon }) => (
                <div key={label} className="flex flex-col items-center text-center px-5 py-4 rounded-2xl" style={{ backgroundColor: bg, border: `1px solid ${border}` }}>
                  <Icon className="w-4 h-4 mb-2" style={{ color }} />
                  <div className="text-2xl font-black" style={{ color }}>{value}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5 uppercase tracking-wider">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="sticky top-[72px] z-30 border-b border-white/8 px-6" style={{ backgroundColor: '#09090FEE', backdropFilter: 'blur(20px)' }}>
        <div className="max-w-7xl mx-auto flex gap-0">
          {[['predict', 'Đặt Dự Đoán', Target], ['results', 'Kết Quả Chính Thức', Trophy]].map(([key, label, Icon]: any) => (
            <button key={key} onClick={() => setActiveTab(key)}
              className={`flex items-center gap-2 px-6 py-4 text-sm font-bold border-b-2 transition-all uppercase tracking-wider ${activeTab === key ? '' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
              style={activeTab === key ? { borderBottomColor: '#10b981', color: '#10b981' } : {}}>
              <Icon className="w-4 h-4" /> {label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-10">

        {/* PREDICT TAB */}
        {activeTab === 'predict' && (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left: Race + Participants */}
            <div className="lg:col-span-2 space-y-8">
              {selectedRace?.status === 'running' && (
                <div className="flex items-center gap-4 px-5 py-4 rounded-2xl" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_12px_rgba(239,68,68,0.9)]" />
                  <span className="text-sm font-bold text-red-400 uppercase tracking-widest">Đang Diễn Ra Trực Tiếp</span>
                </div>
              )}

              {/* Race selector */}
              <div>
                <h2 className="text-sm font-black text-slate-500 uppercase tracking-widest mb-4">Chọn Cuộc Đua</h2>
                {loadingRaces ? (
                  <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-emerald-400" /></div>
                ) : races.length === 0 ? (
                  <div className="p-6 rounded-2xl text-center text-slate-500 text-sm" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    Không có cuộc đua nào đang mở đặt cược
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 gap-3">
                    {races.map(race => (
                      <button key={race._id} onClick={() => { setSelectedRace(race); setSelectedHorseIdx(null); setBetAmount(''); }}
                        className="p-4 rounded-2xl border text-left transition-all hover:-translate-y-0.5"
                        style={selectedRace?._id === race._id
                          ? { background: 'rgba(16,185,129,0.1)', borderColor: 'rgba(16,185,129,0.4)', boxShadow: '0 4px 20px rgba(16,185,129,0.1)' }
                          : { background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.08)' }}>
                        <div className="flex items-start justify-between mb-3">
                          <h3 className="font-bold text-white text-sm leading-tight pr-2">{race.name}</h3>
                          <span className={`shrink-0 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase ${race.status === 'running' ? 'bg-red-500 text-white' : 'bg-blue-600/80 text-white'}`}>
                            {race.status === 'running' ? '● TRỰC TIẾP' : 'Mở Cược'}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(race.scheduledTime).toLocaleString('vi-VN')}</span>
                          <span className="flex items-center gap-1"><Flag className="w-3 h-3" />{race.distance}m</span>
                          <span className="flex items-center gap-1"><Award className="w-3 h-3" />{race.purse.toLocaleString()}c</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Race info */}
              {selectedRace && (
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Cự Ly', value: `${selectedRace.distance}m`, icon: Flag },
                    { label: 'Cấp Hạng', value: selectedRace.grade, icon: Award },
                    { label: 'Giải Thưởng', value: `${selectedRace.purse.toLocaleString()} coins`, icon: Trophy },
                  ].map(({ label, value, icon: Icon }) => (
                    <div key={label} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <Icon className="w-4 h-4 text-slate-500 shrink-0" />
                      <div>
                        <div className="text-[10px] text-slate-600 uppercase tracking-wider">{label}</div>
                        <div className="text-xs font-semibold text-white truncate">{value}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Participants */}
              {selectedRace && (
                <div>
                  <h2 className="text-sm font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Activity className="w-4 h-4" /> Ngựa Tham Gia
                  </h2>
                  {loadingHorses ? (
                    <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-emerald-400" /></div>
                  ) : horses.length === 0 ? (
                    <div className="text-center py-8 text-slate-500 text-sm" style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.08)', borderRadius: '16px' }}>
                      Chưa có ngựa đăng ký
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {horses.map((h, idx) => (
                        <div key={h.horseId} onClick={() => setSelectedHorseIdx(idx)}
                          className="relative overflow-hidden rounded-2xl cursor-pointer transition-all hover:-translate-y-0.5"
                          style={selectedHorseIdx === idx
                            ? { background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.35)', boxShadow: '0 4px 20px rgba(16,185,129,0.1)' }
                            : { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                          <div className="pl-5 pr-5 py-4">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black shrink-0 bg-white/10 text-white">
                                  {idx + 1}
                                </div>
                                <div>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-black text-white">{h.horseName}</span>
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded border font-semibold ${GRADE_COLOR[h.currentGrade] ?? GRADE_COLOR.Maiden}`}>{h.currentGrade}</span>
                                  </div>
                                  <div className="text-xs text-slate-500">
                                    {h.jockeyName ? `🏇 ${h.jockeyName}` : 'Chưa có kỵ sĩ'}
                                    {h.jockeyExperience ? ` · ${h.jockeyExperience}năm KN` : ''}
                                  </div>
                                </div>
                              </div>
                              <div className="text-right shrink-0">
                                <div className="text-xl font-black text-amber-400">{h.totalPoints}</div>
                                <div className="text-[10px] text-slate-600 uppercase tracking-wider">Điểm</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-[10px] text-slate-600 uppercase tracking-wider shrink-0">Win Rate:</span>
                              <div className="flex-1 h-1.5 bg-white/8 rounded-full overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full" style={{ width: `${h.winRate}%` }} />
                              </div>
                              <span className="text-xs font-bold text-emerald-400 shrink-0">{h.winRate}%</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right: Bet panel + history */}
            <div className="space-y-5">
              {/* Bet panel */}
              <div className="rounded-2xl overflow-hidden"
                style={{ background: 'rgba(15,17,23,0.95)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <div className="px-6 py-5 border-b border-white/8 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#10b981,#06b6d4)', boxShadow: '0 4px 16px rgba(16,185,129,0.3)' }}>
                    <Zap className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="font-black text-white">Đặt Cược</h3>
                    {!isLoggedIn && <p className="text-[10px] text-red-400">Yêu cầu đăng nhập</p>}
                  </div>
                  {!isLoggedIn && (
                    <div className="ml-auto flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-500/10 border border-red-500/20">
                      <Lock className="w-3 h-3 text-red-400" />
                      <span className="text-[10px] font-bold text-red-400">Khóa</span>
                    </div>
                  )}
                </div>

                <div className="p-6">
                  {/* Bet type */}
                  {isLoggedIn && (
                    <div className="mb-4">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">Loại Cược</label>
                      <div className="grid grid-cols-3 gap-2">
                        {(['win', 'place', 'show'] as const).map(bt => (
                          <button key={bt} onClick={() => setBetType(bt)}
                            className={`py-2 rounded-xl text-xs font-bold transition-all ${betType === bt ? 'text-emerald-400' : 'text-slate-500 hover:text-white'}`}
                            style={betType === bt
                              ? { background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.4)' }
                              : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}>
                            {bt === 'win' ? `Win ${BET_MULTIPLIERS.win}x` : bt === 'place' ? `Place ${BET_MULTIPLIERS.place}x` : `Show ${BET_MULTIPLIERS.show}x`}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Selected horse */}
                  {selectedHorse ? (
                    <div className="mb-5 p-4 rounded-xl" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)' }}>
                      <div className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest mb-2">Đã Chọn</div>
                      <div className="font-black text-white">{selectedHorse.horseName}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{selectedHorse.jockeyName ?? 'Chưa có kỵ sĩ'}</div>
                    </div>
                  ) : (
                    <div className="mb-5 p-5 rounded-xl text-center cursor-pointer" style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.1)' }}
                      onClick={() => !isLoggedIn && setShowLoginModal(true)}>
                      <AlertCircle className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                      <p className="text-sm text-slate-500">Chọn ngựa từ danh sách</p>
                    </div>
                  )}

                  {/* Amount */}
                  <div className="mb-4">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">Số Tiền Cược (coins)</label>
                    <div className="relative">
                      <input type="number" placeholder="Nhập số tiền..." value={betAmount}
                        onChange={e => setBetAmount(e.target.value)}
                        onClick={() => !isLoggedIn && setShowLoginModal(true)}
                        readOnly={!isLoggedIn}
                        className="w-full rounded-xl px-4 py-3 text-white text-sm placeholder:text-slate-600 focus:outline-none transition-all"
                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', cursor: isLoggedIn ? 'text' : 'not-allowed' }} />
                      {!isLoggedIn && <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />}
                    </div>
                    <div className="grid grid-cols-4 gap-1.5 mt-2">
                      {[100, 500, 1000, 5000].map(v => (
                        <button key={v} onClick={() => isLoggedIn ? setBetAmount(String(v)) : setShowLoginModal(true)}
                          className="py-2 rounded-lg text-[10px] font-bold text-slate-500 hover:text-white transition-all"
                          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                          {v >= 1000 ? `${v/1000}K` : v}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Potential win */}
                  {potentialWin !== null && isLoggedIn && (
                    <div className="mb-5 p-4 rounded-xl flex items-center justify-between" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
                      <div>
                        <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">Tiềm Năng Thắng ({multiplier}x)</div>
                        <div className="text-xl font-black text-amber-400">{potentialWin.toLocaleString()} coins</div>
                      </div>
                      <ArrowUpRight className="w-6 h-6 text-amber-400 opacity-60" />
                    </div>
                  )}

                  {/* CTA */}
                  {!isLoggedIn ? (
                    <button onClick={() => setShowLoginModal(true)} className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-black transition-all hover:opacity-90"
                      style={{ background: 'linear-gradient(135deg,#10b981,#06b6d4)', color: 'white', boxShadow: '0 8px 24px rgba(16,185,129,0.25)' }}>
                      <LogIn className="w-4 h-4" /> Đăng Nhập Để Cược
                    </button>
                  ) : (
                    <button onClick={handleBetClick} disabled={!selectedHorse || !betAmount || placing}
                      className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-black transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{ background: 'linear-gradient(135deg,#10b981,#06b6d4)', color: 'white' }}>
                      {placing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                      {placing ? 'Đang xử lý...' : 'Xác Nhận Đặt Cược'}
                    </button>
                  )}
                </div>
              </div>

              {/* Bet history */}
              <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  <h3 className="text-sm font-black text-white flex items-center gap-2">
                    <Eye className="w-4 h-4 text-slate-500" /> Lịch Sử Cược
                  </h3>
                  {!isLoggedIn && <Lock className="w-3.5 h-3.5 text-slate-600" />}
                </div>
                <div className="p-3 space-y-2">
                  {!isLoggedIn ? (
                    <div className="py-8 text-center">
                      <Lock className="w-8 h-8 text-slate-700 mx-auto mb-3" />
                      <p className="text-sm text-slate-600">Đăng nhập để xem lịch sử</p>
                      <button onClick={() => setShowLoginModal(true)} className="mt-3 text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1 mx-auto">
                        Đăng nhập ngay <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  ) : loadingBets ? (
                    <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-slate-500" /></div>
                  ) : myBets.length === 0 ? (
                    <div className="py-6 text-center text-sm text-slate-600">Chưa có lịch sử cược</div>
                  ) : (
                    myBets.map(bet => {
                      const race = (bet.raceId as any);
                      const horse = (bet.horseId as any);
                      return (
                        <div key={bet._id} className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <span className="text-xs text-slate-400 leading-tight">{race?.name ?? 'Race'}</span>
                            <span className={`shrink-0 px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${bet.status === 'won' ? 'bg-emerald-500/15 text-emerald-400' : bet.status === 'lost' ? 'bg-red-500/15 text-red-400' : 'bg-amber-500/15 text-amber-400'}`}>
                              {bet.status === 'won' ? '✓ Thắng' : bet.status === 'lost' ? '✗ Thua' : '⏳ Chờ'}
                            </span>
                          </div>
                          <div className="font-bold text-white text-sm mb-1">{horse?.name ?? '—'}</div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-600">{bet.betType} · {bet.amount.toLocaleString()}c</span>
                            <span className={`font-bold ${bet.status === 'won' ? 'text-emerald-400' : bet.status === 'lost' ? 'text-red-400 line-through' : 'text-amber-400'}`}>
                              +{Math.floor(bet.amount * bet.multiplier).toLocaleString()}c
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* RESULTS TAB */}
        {activeTab === 'results' && <ResultsBoard token={token} />}
      </div>
    </div>
  );
}
