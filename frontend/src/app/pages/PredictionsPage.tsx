import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Navbar } from '../components/Navbar';
import {
  Zap,
  TrendingUp,
  TrendingDown,
  Star,
  Target,
  BarChart3,
  Clock,
  Trophy,
  Users,
  Flame,
  Activity,
  Eye,
  Check,
  AlertCircle,
  Lock,
  LogIn,
  Medal,
  Flag,
  MapPin,
  Calendar,
  Timer,
  Wind,
  ChevronRight,
  Award,
  ArrowUpRight,
  Minus,
  Crown,
  Sparkles,
  Info,
} from 'lucide-react';
import { Button } from '@mui/material';

// ─── Mock Data ────────────────────────────────────────────────────────────────

const races = [
  {
    id: 1,
    name: 'Giải Hoàng Gia 2026 — Chung Kết',
    shortName: 'Hoàng Gia CK',
    status: 'live',
    time: 'ĐANG ĐUA',
    round: 'Vòng 4/5',
    location: 'Trường Đua Phú Thọ, TP.HCM',
    distance: '2400m',
    surface: 'Cỏ Tự Nhiên',
    weather: '☀️ 28°C · Nắng nhẹ',
    prize: '500,000,000 VNĐ',
    participants: [
      { pos: 1, number: 3, horse: 'Tia Chớp', jockey: 'Nguyễn Văn Anh', owner: 'Nguyễn Hoàng Minh', age: 5, weight: '57kg', odds: 2.5, communityPick: 42, trend: 'up', form: [1,1,2,1,1], color: '#F59E0B', nationality: 'VN', wins: 12, runs: 18 },
      { pos: 2, number: 7, horse: 'Ngôi Sao Đêm', jockey: 'Trần Thị Bích', owner: 'Trần Gia Hưng', age: 4, weight: '55kg', odds: 3.8, communityPick: 28, trend: 'up', form: [2,1,1,3,2], color: '#8B5CF6', nationality: 'AU', wins: 8, runs: 15 },
      { pos: 3, number: 1, horse: 'Thần Gió', jockey: 'Lê Văn Cường', owner: 'Lê Đình Phát', age: 6, weight: '58kg', odds: 5.0, communityPick: 16, trend: 'same', form: [3,2,1,2,3], color: '#EF4444', nationality: 'GB', wins: 6, runs: 22 },
      { pos: 4, number: 5, horse: 'Móng Vàng', jockey: 'Phạm Minh Đức', owner: 'Phạm Quốc Thái', age: 5, weight: '56kg', odds: 12.0, communityPick: 9, trend: 'down', form: [1,3,4,1,4], color: '#10B981', nationality: 'FR', wins: 4, runs: 20 },
      { pos: 5, number: 9, horse: 'Vinh Quang Đỏ', jockey: 'Hoàng Văn Em', owner: 'Hoàng Bá Lộc', age: 7, weight: '59kg', odds: 15.0, communityPick: 5, trend: 'down', form: [4,4,3,5,5], color: '#3B82F6', nationality: 'JP', wins: 2, runs: 30 },
    ],
  },
  {
    id: 2,
    name: 'Cup Mùa Hè 2026 — Vòng 1',
    shortName: 'Cup Mùa Hè V1',
    status: 'upcoming',
    time: '14:30 hôm nay',
    round: 'Vòng 1/4',
    location: 'Trường Đua Đại Nam, Bình Dương',
    distance: '1800m',
    surface: 'Đất Nện',
    weather: '⛅ 25°C · Mát',
    prize: '200,000,000 VNĐ',
    participants: [
      { pos: 1, number: 2, horse: 'Bão Tốc', jockey: 'Ngô Thị Phương', owner: 'Ngô Tấn Kiệt', age: 4, weight: '56kg', odds: 2.1, communityPick: 38, trend: 'up', form: [1,2,1,1,2], color: '#8B5CF6', nationality: 'VN', wins: 9, runs: 14 },
      { pos: 2, number: 6, horse: 'Hổ Phong', jockey: 'Dương Minh Giang', owner: 'Dương Trường Sơn', age: 5, weight: '57kg', odds: 3.5, communityPick: 31, trend: 'up', form: [2,1,2,2,1], color: '#3B82F6', nationality: 'AU', wins: 7, runs: 16 },
      { pos: 3, number: 4, horse: 'Long Mã', jockey: 'Lý Hữu Hùng', owner: 'Lý Thái Sơn', age: 3, weight: '54kg', odds: 6.0, communityPick: 18, trend: 'same', form: [3,3,3,1,3], color: '#06B6D4', nationality: 'FR', wins: 3, runs: 10 },
      { pos: 4, number: 8, horse: 'Tia Chớp', jockey: 'Nguyễn Văn Anh', owner: 'Nguyễn Hoàng Minh', age: 5, weight: '57kg', odds: 8.0, communityPick: 13, trend: 'down', form: [1,2,1,3,4], color: '#F59E0B', nationality: 'VN', wins: 12, runs: 18 },
    ],
  },
];

// ─── Completed Race Results ───────────────────────────────────────────────────

const completedResults = [
  {
    id: 101,
    name: 'Tranh Tài Mùa Xuân 2026 — Chung Kết',
    date: '20/04/2026',
    location: 'Trường Đua Phú Thọ, TP.HCM',
    distance: '2000m',
    surface: 'Cỏ Tự Nhiên',
    prize: '150,000,000 VNĐ',
    totalBets: 1247,
    results: [
      { pos: 1, number: 1, horse: 'Vinh Quang Đỏ', jockey: 'Hoàng Văn Em', owner: 'Hoàng Bá Lộc', time: '1:50.4', prize: '90,000,000 VNĐ', odds: 3.1, margin: 'Đầu', color: '#F59E0B' },
      { pos: 2, number: 4, horse: 'Bão Tốc', jockey: 'Ngô Thị Phương', owner: 'Ngô Tấn Kiệt', time: '1:50.9', prize: '37,500,000 VNĐ', odds: 4.2, margin: '1/2 thân', color: '#94A3B8' },
      { pos: 3, number: 7, horse: 'Tia Chớp', jockey: 'Nguyễn Văn Anh', owner: 'Nguyễn Hoàng Minh', time: '1:51.3', prize: '22,500,000 VNĐ', odds: 2.5, margin: '3/4 thân', color: '#CD7F32' },
      { pos: 4, number: 2, horse: 'Ngôi Sao Đêm', jockey: 'Trần Thị Bích', owner: 'Trần Gia Hưng', time: '1:51.8', prize: '—', odds: 3.8, margin: '1 thân', color: '#64748B' },
      { pos: 5, number: 5, horse: 'Thần Gió', jockey: 'Lê Văn Cường', owner: 'Lê Đình Phát', time: '1:52.4', prize: '—', odds: 5.0, margin: '2 thân', color: '#64748B' },
    ],
    accumulatedPool: '98,500,000 VNĐ',
    winDividend: '3.10',
    placeDividend: '1.40',
  },
  {
    id: 102,
    name: 'Giải Miền Bắc 2026 — Bán Kết',
    date: '15/04/2026',
    location: 'Trường Đua Hà Nội',
    distance: '1600m',
    surface: 'Đất Nện',
    prize: '80,000,000 VNĐ',
    totalBets: 892,
    results: [
      { pos: 1, number: 3, horse: 'Ngôi Sao Đêm', jockey: 'Trần Thị Bích', owner: 'Trần Gia Hưng', time: '1:38.2', prize: '48,000,000 VNĐ', odds: 2.8, margin: '2 thân', color: '#F59E0B' },
      { pos: 2, number: 6, horse: 'Hổ Phong', jockey: 'Dương Minh Giang', owner: 'Dương Trường Sơn', time: '1:38.9', prize: '20,000,000 VNĐ', odds: 3.5, margin: '1/2 thân', color: '#94A3B8' },
      { pos: 3, number: 1, horse: 'Bão Tốc', jockey: 'Ngô Thị Phương', owner: 'Ngô Tấn Kiệt', time: '1:39.1', prize: '12,000,000 VNĐ', odds: 2.1, margin: '1 thân', color: '#CD7F32' },
      { pos: 4, number: 8, horse: 'Long Mã', jockey: 'Lý Hữu Hùng', owner: 'Lý Thái Sơn', time: '1:39.6', prize: '—', odds: 6.0, margin: '3 thân', color: '#64748B' },
    ],
    accumulatedPool: '62,000,000 VNĐ',
    winDividend: '2.80',
    placeDividend: '1.25',
  },
];

const userPredictions = [
  { race: 'Giải Hoàng Gia — Chung Kết', horse: 'Tia Chớp', odds: 2.5, amount: 500000, status: 'pending', potential: 1250000, date: 'Hôm nay' },
  { race: 'Cup Mùa Hè — Vòng 1', horse: 'Bão Tốc', odds: 2.1, amount: 200000, status: 'pending', potential: 420000, date: 'Hôm nay' },
  { race: 'Tranh Tài Mùa Xuân — CK', horse: 'Ngôi Sao Đêm', odds: 3.8, amount: 300000, status: 'won', potential: 1140000, date: '20/04' },
  { race: 'Giải Miền Bắc — Bán Kết', horse: 'Thần Gió', odds: 5.0, amount: 100000, status: 'lost', potential: 500000, date: '15/04' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formColor = (pos: number) => {
  if (pos === 1) return 'bg-emerald-500 text-white';
  if (pos === 2) return 'bg-blue-500 text-white';
  if (pos === 3) return 'bg-amber-500 text-white';
  return 'bg-slate-700 text-slate-400';
};

const flagEmoji: Record<string, string> = {
  VN: '🇻🇳', AU: '🇦🇺', GB: '🇬🇧', FR: '🇫🇷', JP: '🇯🇵',
};

// ─── Login Gate Modal ─────────────────────────────────────────────────────────

function LoginGateModal({ onClose, onLogin }: { onClose: () => void; onLogin: () => void }) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
      <div
        className="relative w-full max-w-md rounded-3xl overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0F1117, #141820)', border: '1px solid rgba(255,255,255,0.1)' }}
      >
        {/* Top accent */}
        <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, #10b981, #06b6d4)' }} />

        <div className="p-8 text-center">
          <div
            className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)', boxShadow: '0 0 40px rgba(16,185,129,0.3)' }}
          >
            <Lock className="w-9 h-9 text-white" />
          </div>

          <h2 className="text-2xl font-black text-white mb-3">Yêu Cầu Đăng Nhập</h2>
          <p className="text-slate-400 leading-relaxed mb-8">
            Bạn cần <strong className="text-white">đăng nhập</strong> vào tài khoản để đặt cược và theo dõi lịch sử dự đoán của mình.
          </p>

          <div className="space-y-3">
            <button
              onClick={onLogin}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-base font-bold transition-all hover:opacity-90 active:scale-95"
              style={{ background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)', color: 'white', boxShadow: '0 8px 24px rgba(16,185,129,0.3)' }}
            >
              <LogIn className="w-5 h-5" />
              Đăng Nhập Ngay
            </button>
            <button
              onClick={onClose}
              className="w-full py-3 rounded-2xl text-sm font-medium text-slate-500 hover:text-white transition-colors"
            >
              Tiếp tục xem (không đặt cược)
            </button>
          </div>

          <div className="mt-6 pt-6 border-t border-white/8 text-xs text-slate-600">
            Chưa có tài khoản?{' '}
            <button className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors" onClick={onLogin}>
              Đăng ký miễn phí
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Results Board ─────────────────────────────────────────────────────────────

function ResultsBoard() {
  const [selectedResult, setSelectedResult] = useState(completedResults[0]);

  return (
    <div className="space-y-6">
      {/* Section header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #F59E0B20, #EF444415)' }}>
          <Trophy className="w-5 h-5 text-amber-400" />
        </div>
        <div>
          <h2 className="text-lg font-black text-white">Kết Quả Chính Thức</h2>
          <p className="text-xs text-slate-500">Bảng công bố kết quả đua ngựa chi tiết</p>
        </div>
      </div>

      {/* Race selector tabs */}
      <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
        {completedResults.map(r => (
          <button
            key={r.id}
            onClick={() => setSelectedResult(r)}
            className={`flex-shrink-0 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              selectedResult.id === r.id
                ? 'text-white'
                : 'text-slate-500 hover:text-slate-300'
            }`}
            style={selectedResult.id === r.id
              ? { background: 'linear-gradient(135deg, #F59E0B, #EF4444)', boxShadow: '0 4px 16px rgba(245,158,11,0.3)' }
              : { backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }
            }
          >
            {r.shortName || r.name.split('—')[0].trim()}
            <span className="ml-2 opacity-70">{r.date}</span>
          </button>
        ))}
      </div>

      {/* Race header card */}
      <div
        className="relative overflow-hidden rounded-2xl p-6"
        style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.12), rgba(239,68,68,0.08))', border: '1px solid rgba(245,158,11,0.25)' }}
      >
        {/* Glow */}
        <div className="absolute top-0 right-0 w-48 h-48 rounded-full opacity-10 pointer-events-none" style={{ background: 'radial-gradient(circle, #F59E0B, transparent 70%)', filter: 'blur(30px)' }} />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest" style={{ background: 'rgba(245,158,11,0.2)', color: '#F59E0B', border: '1px solid rgba(245,158,11,0.3)' }}>
                ✓ Chính Thức
              </span>
              <span className="text-xs text-slate-500">{selectedResult.date}</span>
            </div>
            <h3 className="text-xl font-black text-white mb-1">{selectedResult.name}</h3>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
              <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{selectedResult.location}</span>
              <span className="flex items-center gap-1"><Flag className="w-3 h-3" />{selectedResult.distance}</span>
              <span className="flex items-center gap-1"><Wind className="w-3 h-3" />{selectedResult.surface}</span>
            </div>
          </div>
          <div className="flex gap-4 shrink-0">
            <div className="text-center">
              <div className="text-2xl font-black text-amber-400">{selectedResult.winDividend}x</div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider">Tỷ lệ thắng</div>
            </div>
            <div className="w-px bg-white/8" />
            <div className="text-center">
              <div className="text-2xl font-black text-emerald-400">{selectedResult.totalBets.toLocaleString()}</div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider">Lượt cược</div>
            </div>
            <div className="w-px bg-white/8" />
            <div className="text-center">
              <div className="text-lg font-black text-white">{selectedResult.prize}</div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider">Tổng giải</div>
            </div>
          </div>
        </div>
      </div>

      {/* Results Table */}
      <div className="overflow-hidden rounded-2xl" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
        {/* Table header */}
        <div className="grid grid-cols-12 gap-2 px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-600" style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}>
          <div className="col-span-1 text-center">Hạng</div>
          <div className="col-span-1 text-center">Số</div>
          <div className="col-span-4">Ngựa / Kỵ Sĩ</div>
          <div className="col-span-2 text-center">Thời Gian</div>
          <div className="col-span-1 text-center">Cách</div>
          <div className="col-span-1 text-center">Tỷ Lệ</div>
          <div className="col-span-2 text-right">Giải Thưởng</div>
        </div>

        {/* Table rows */}
        <div className="divide-y divide-white/5">
          {selectedResult.results.map((r, idx) => (
            <div
              key={idx}
              className={`grid grid-cols-12 gap-2 px-5 py-4 items-center transition-colors hover:bg-white/3 ${idx === 0 ? 'bg-amber-500/5' : ''}`}
            >
              {/* Position badge */}
              <div className="col-span-1 flex justify-center">
                {r.pos === 1 ? (
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black" style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)', boxShadow: '0 4px 12px rgba(245,158,11,0.4)' }}>
                    <Crown className="w-4 h-4 text-white" />
                  </div>
                ) : r.pos === 2 ? (
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black bg-slate-600" style={{ boxShadow: '0 4px 12px rgba(148,163,184,0.3)' }}>
                    <span className="text-slate-200">2</span>
                  </div>
                ) : r.pos === 3 ? (
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black" style={{ background: '#CD7F32', boxShadow: '0 4px 12px rgba(205,127,50,0.3)' }}>
                    <span className="text-white">3</span>
                  </div>
                ) : (
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold bg-white/5 text-slate-500">
                    {r.pos}
                  </div>
                )}
              </div>

              {/* Race number */}
              <div className="col-span-1 flex justify-center">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black text-white"
                  style={{ backgroundColor: r.color + '30', border: `1px solid ${r.color}50`, color: r.color }}
                >
                  {r.number}
                </div>
              </div>

              {/* Horse info */}
              <div className="col-span-4">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className={`font-black text-sm ${r.pos === 1 ? 'text-amber-400' : r.pos === 2 ? 'text-slate-300' : r.pos === 3 ? 'text-orange-400' : 'text-slate-400'}`}>
                    {r.horse}
                  </span>
                  {r.pos === 1 && <span className="text-[10px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded-md font-bold border border-amber-500/30">VÔ ĐỊCH</span>}
                </div>
                <div className="text-xs text-slate-500">
                  🏇 {r.jockey} &nbsp;·&nbsp; {r.owner}
                </div>
              </div>

              {/* Time */}
              <div className="col-span-2 text-center">
                <div className={`text-sm font-bold font-mono ${r.pos === 1 ? 'text-white' : 'text-slate-400'}`}>{r.time}</div>
              </div>

              {/* Margin */}
              <div className="col-span-1 text-center text-xs text-slate-500">
                {r.pos === 1 ? <span className="text-emerald-400 font-bold">—</span> : r.margin}
              </div>

              {/* Odds */}
              <div className="col-span-1 text-center">
                <span className={`text-sm font-bold ${r.pos === 1 ? 'text-amber-400' : 'text-slate-500'}`}>{r.odds}x</span>
              </div>

              {/* Prize */}
              <div className="col-span-2 text-right">
                {r.prize !== '—' ? (
                  <span className="text-sm font-black text-emerald-400">{r.prize}</span>
                ) : (
                  <span className="text-xs text-slate-700">—</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Dividend summary */}
      <div className="grid grid-cols-2 gap-4">
        <div
          className="flex items-center gap-4 p-4 rounded-2xl"
          style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}
        >
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0">
            <Trophy className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">Tỷ Lệ Chi Trả Thắng</div>
            <div className="text-xl font-black text-amber-400">{selectedResult.winDividend}x</div>
          </div>
        </div>
        <div
          className="flex items-center gap-4 p-4 rounded-2xl"
          style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center shrink-0">
            <Medal className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">Tỷ Lệ Chi Trả Hạng 2-3</div>
            <div className="text-xl font-black text-emerald-400">{selectedResult.placeDividend}x</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export function PredictionsPage() {
  const navigate = useNavigate();

  // Auth simulation — set to false = not logged in
  const [isLoggedIn] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  const [activeTab, setActiveTab] = useState<'predict' | 'results'>('predict');
  const [selectedRace, setSelectedRace] = useState(races[0]);
  const [selectedHorse, setSelectedHorse] = useState<number | null>(null);
  const [betAmount, setBetAmount] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const selectedParticipant = selectedHorse !== null ? selectedRace.participants[selectedHorse] : null;
  const potentialWin = selectedParticipant && betAmount
    ? (parseFloat(betAmount) * selectedParticipant.odds).toFixed(0)
    : null;

  const handleBetClick = () => {
    if (!isLoggedIn) {
      setShowLoginModal(true);
      return;
    }
    if (selectedHorse !== null && betAmount) {
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 3000);
      setSelectedHorse(null);
      setBetAmount('');
    }
  };

  const totalWon = userPredictions.filter(p => p.status === 'won').reduce((a, p) => a + p.potential, 0);
  const winRate = Math.round((userPredictions.filter(p => p.status === 'won').length / userPredictions.filter(p => p.status !== 'pending').length) * 100);

  return (
    <div className="min-h-screen text-slate-200" style={{ backgroundColor: '#09090F', fontFamily: "'Inter', 'Segoe UI', sans-serif" }}>
      <Navbar />

      {showLoginModal && (
        <LoginGateModal
          onClose={() => setShowLoginModal(false)}
          onLogin={() => navigate('/login')}
        />
      )}

      {/* Background glows */}
      <div className="absolute inset-x-0 top-0 h-[600px] pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/3 w-96 h-96 rounded-full opacity-8" style={{ background: 'radial-gradient(circle, #10b981, transparent 70%)', filter: 'blur(90px)' }} />
        <div className="absolute top-20 right-1/3 w-80 h-80 rounded-full opacity-6" style={{ background: 'radial-gradient(circle, #06b6d4, transparent 70%)', filter: 'blur(90px)' }} />
      </div>

      {/* ── Header ── */}
      <div className="relative pt-28 pb-14 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row items-start lg:items-end justify-between gap-10">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 text-sm font-bold uppercase tracking-widest" style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)', color: '#10b981' }}>
                <Zap className="w-4 h-4" />
                Dự Đoán &amp; Cược
              </div>
              <h1 className="text-5xl md:text-6xl font-black text-white mb-4 leading-none tracking-tight">
                Dự Đoán
                <br />
                <span style={{ background: 'linear-gradient(135deg, #10b981, #06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  Cuộc Đua
                </span>
              </h1>
              <p className="text-lg text-slate-400 max-w-xl leading-relaxed">
                Phân tích xu hướng, đọc chỉ số phong độ và đưa ra dự đoán chính xác. Xem kết quả đua ngựa chính thức công bố đầy đủ.
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 shrink-0">
              {[
                { label: 'Tỷ Lệ Đúng', value: `${winRate}%`, color: '#10b981', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.25)', icon: Target },
                { label: 'Đã Dự Đoán', value: `${userPredictions.length}`, color: '#F59E0B', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.25)', icon: BarChart3 },
                { label: 'Tổng Thắng', value: `${(totalWon / 1000000).toFixed(1)}M`, color: '#8B5CF6', bg: 'rgba(139,92,246,0.1)', border: 'rgba(139,92,246,0.25)', icon: Sparkles },
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

      {/* ── Tabs ── */}
      <div className="sticky top-[72px] z-30 border-b border-white/8 px-6" style={{ backgroundColor: '#09090FEE', backdropFilter: 'blur(20px)' }}>
        <div className="max-w-7xl mx-auto flex gap-0">
          {[
            { key: 'predict', label: 'Đặt Dự Đoán', icon: Target },
            { key: 'results', label: 'Kết Quả Chính Thức', icon: Trophy },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as typeof activeTab)}
              className={`flex items-center gap-2 px-6 py-4 text-sm font-bold border-b-2 transition-all uppercase tracking-wider ${
                activeTab === key ? '' : 'border-transparent text-slate-500 hover:text-slate-300'
              }`}
              style={activeTab === key
                ? { borderBottomColor: '#10b981', color: '#10b981' }
                : {}
              }
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="max-w-7xl mx-auto px-6 py-10">

        {/* ━━━ TAB: PREDICT ━━━ */}
        {activeTab === 'predict' && (
          <div className="grid lg:grid-cols-3 gap-8">

            {/* Left: Race selection + participants */}
            <div className="lg:col-span-2 space-y-8">

              {/* Live race banner */}
              {selectedRace.status === 'live' && (
                <div className="flex items-center gap-4 px-5 py-4 rounded-2xl" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_12px_rgba(239,68,68,0.9)]" />
                  <span className="text-sm font-bold text-red-400 uppercase tracking-widest">Đang Diễn Ra Trực Tiếp</span>
                  <div className="ml-auto flex items-center gap-2 text-xs text-slate-400 bg-white/5 px-3 py-1.5 rounded-full border border-white/8">
                    <Eye className="w-3.5 h-3.5 text-red-400" />
                    12,405 đang xem
                  </div>
                </div>
              )}

              {/* Race selector */}
              <div>
                <h2 className="text-sm font-black text-slate-500 uppercase tracking-widest mb-4">Chọn Cuộc Đua</h2>
                <div className="grid sm:grid-cols-2 gap-3">
                  {races.map(race => (
                    <button
                      key={race.id}
                      onClick={() => { setSelectedRace(race); setSelectedHorse(null); setBetAmount(''); }}
                      className="p-4 rounded-2xl border text-left transition-all hover:-translate-y-0.5"
                      style={selectedRace.id === race.id
                        ? { background: 'rgba(16,185,129,0.1)', borderColor: 'rgba(16,185,129,0.4)', boxShadow: '0 4px 20px rgba(16,185,129,0.1)' }
                        : { background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.08)' }
                      }
                    >
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="font-bold text-white text-sm leading-tight pr-2">{race.name}</h3>
                        <span className={`shrink-0 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wide ${
                          race.status === 'live'
                            ? 'bg-red-500 text-white'
                            : 'bg-blue-600/80 text-white'
                        }`}>
                          {race.status === 'live' ? '● LIVE' : 'Sắp Tới'}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{race.time}</span>
                        <span className="flex items-center gap-1"><Flag className="w-3 h-3" />{race.distance}</span>
                        <span className="flex items-center gap-1"><Users className="w-3 h-3" />{race.participants.length} ngựa</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Race info */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Địa Điểm', value: selectedRace.location.split(',')[0], icon: MapPin },
                  { label: 'Cự Ly', value: selectedRace.distance, icon: Flag },
                  { label: 'Mặt Đường', value: selectedRace.surface, icon: Wind },
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

              {/* Participants */}
              <div>
                <h2 className="text-sm font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Activity className="w-4 h-4" /> Phân Tích Ứng Viên
                </h2>
                <div className="space-y-3">
                  {selectedRace.participants.map((p, idx) => (
                    <div
                      key={idx}
                      onClick={() => setSelectedHorse(idx)}
                      className="relative overflow-hidden rounded-2xl cursor-pointer transition-all hover:-translate-y-0.5"
                      style={selectedHorse === idx
                        ? { background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.35)', boxShadow: '0 4px 20px rgba(16,185,129,0.1)' }
                        : { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }
                      }
                    >
                      {/* Color accent bar */}
                      <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl" style={{ backgroundColor: p.color }} />

                      <div className="pl-5 pr-5 py-4">
                        {/* Top row */}
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            {/* Race number */}
                            <div
                              className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black shrink-0"
                              style={{ backgroundColor: p.color + '25', border: `1px solid ${p.color}50`, color: p.color }}
                            >
                              {p.number}
                            </div>

                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-black text-white">{p.horse}</span>
                                {flagEmoji[p.nationality] && <span className="text-sm">{flagEmoji[p.nationality]}</span>}
                                {p.trend === 'up' && <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />}
                                {p.trend === 'down' && <TrendingDown className="w-3.5 h-3.5 text-red-400" />}
                                {p.trend === 'same' && <Minus className="w-3.5 h-3.5 text-slate-500" />}
                              </div>
                              <div className="text-xs text-slate-500">
                                🏇 {p.jockey} &nbsp;·&nbsp; {p.age} tuổi &nbsp;·&nbsp; {p.weight}
                              </div>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <div className="text-xl font-black text-amber-400">{p.odds}x</div>
                            <div className="text-[10px] text-slate-600 uppercase tracking-wider">Tỷ lệ</div>
                          </div>
                        </div>

                        {/* Bottom row: form + win rate + community */}
                        <div className="flex items-center gap-4 flex-wrap">
                          {/* Form guide */}
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-slate-600 uppercase tracking-wider shrink-0">Phong độ:</span>
                            <div className="flex gap-1">
                              {p.form.map((pos, i) => (
                                <div key={i} className={`w-6 h-6 rounded-md text-[10px] font-bold flex items-center justify-center ${formColor(pos)}`}>
                                  {pos}
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Win stats */}
                          <div className="text-xs text-slate-500">
                            <span className="text-emerald-400 font-bold">{p.wins}</span>/{p.runs} trận thắng
                          </div>

                          {/* Community pick bar */}
                          <div className="ml-auto flex-1 min-w-[100px] max-w-[140px]">
                            <div className="flex justify-between text-[10px] mb-1.5">
                              <span className="text-slate-600 uppercase tracking-wider">Cộng đồng</span>
                              <span className="font-bold" style={{ color: p.color }}>{p.communityPick}%</span>
                            </div>
                            <div className="h-1.5 rounded-full overflow-hidden bg-white/8">
                              <div
                                className="h-full rounded-full transition-all duration-700"
                                style={{ width: `${p.communityPick}%`, backgroundColor: p.color }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Bet panel + history */}
            <div className="space-y-5">

              {/* Bet Panel */}
              <div
                className="rounded-2xl overflow-hidden sticky top-[138px]"
                style={{ background: 'rgba(15,17,23,0.95)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(20px)' }}
              >
                {/* Panel header */}
                <div className="px-6 py-5 border-b border-white/8 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #10b981, #06b6d4)', boxShadow: '0 4px 16px rgba(16,185,129,0.3)' }}>
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
                  {submitted ? (
                    <div className="flex flex-col items-center py-8 text-center">
                      <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ background: 'linear-gradient(135deg, #10b981, #06b6d4)', boxShadow: '0 0 40px rgba(16,185,129,0.3)' }}>
                        <Check className="w-8 h-8 text-white" />
                      </div>
                      <h4 className="text-lg font-black text-white mb-1">Đã Gửi!</h4>
                      <p className="text-sm text-slate-400">Dự đoán đã được ghi nhận.</p>
                    </div>
                  ) : (
                    <>
                      {/* Selection display */}
                      {selectedHorse !== null && selectedParticipant ? (
                        <div
                          className="mb-5 p-4 rounded-xl"
                          style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)' }}
                        >
                          <div className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest mb-2">Đã Chọn</div>
                          <div className="flex items-center gap-3 mb-2">
                            <div
                              className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black shrink-0"
                              style={{ backgroundColor: selectedParticipant.color + '25', color: selectedParticipant.color }}
                            >
                              {selectedParticipant.number}
                            </div>
                            <div>
                              <div className="font-black text-white">{selectedParticipant.horse}</div>
                              <div className="text-xs text-slate-500">🏇 {selectedParticipant.jockey}</div>
                            </div>
                            <div className="ml-auto text-right">
                              <div className="text-2xl font-black text-amber-400">{selectedParticipant.odds}x</div>
                              <div className="text-[10px] text-slate-600">Tỷ lệ</div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div
                          className="mb-5 p-5 rounded-xl text-center cursor-pointer transition-colors hover:border-emerald-500/20"
                          style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.1)' }}
                          onClick={() => !isLoggedIn && setShowLoginModal(true)}
                        >
                          <AlertCircle className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                          <p className="text-sm text-slate-500">Chọn ngựa từ danh sách</p>
                        </div>
                      )}

                      {/* Amount input */}
                      <div className="mb-4">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">
                          Số Tiền Cược (VNĐ)
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            placeholder="Nhập số tiền..."
                            value={betAmount}
                            onChange={e => setBetAmount(e.target.value)}
                            onClick={() => !isLoggedIn && setShowLoginModal(true)}
                            readOnly={!isLoggedIn}
                            className="w-full rounded-xl px-4 py-3 text-white text-sm placeholder:text-slate-600 focus:outline-none transition-all"
                            style={{
                              background: 'rgba(255,255,255,0.05)',
                              border: '1px solid rgba(255,255,255,0.1)',
                              cursor: isLoggedIn ? 'text' : 'not-allowed',
                            }}
                          />
                          {!isLoggedIn && (
                            <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                          )}
                        </div>
                        <div className="grid grid-cols-4 gap-1.5 mt-2">
                          {[100000, 200000, 500000, 1000000].map(v => (
                            <button
                              key={v}
                              onClick={() => isLoggedIn ? setBetAmount(String(v)) : setShowLoginModal(true)}
                              className="py-2 rounded-lg text-[10px] font-bold text-slate-500 hover:text-white transition-all"
                              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
                            >
                              {v >= 1000000 ? `${v/1000000}M` : `${v/1000}K`}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Potential win */}
                      {potentialWin && isLoggedIn && (
                        <div
                          className="mb-5 p-4 rounded-xl flex items-center justify-between"
                          style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}
                        >
                          <div>
                            <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">Tiềm Năng Thắng</div>
                            <div className="text-xl font-black text-amber-400">{parseInt(potentialWin).toLocaleString()} VNĐ</div>
                          </div>
                          <ArrowUpRight className="w-6 h-6 text-amber-400 opacity-60" />
                        </div>
                      )}

                      {/* CTA button */}
                      {!isLoggedIn ? (
                        <button
                          onClick={() => setShowLoginModal(true)}
                          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-black transition-all hover:opacity-90 active:scale-95"
                          style={{ background: 'linear-gradient(135deg, #10b981, #06b6d4)', color: 'white', boxShadow: '0 8px 24px rgba(16,185,129,0.25)' }}
                        >
                          <LogIn className="w-4 h-4" />
                          Đăng Nhập Để Cược
                        </button>
                      ) : (
                        <button
                          onClick={handleBetClick}
                          disabled={selectedHorse === null || !betAmount}
                          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-black transition-all hover:opacity-90 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                          style={{ background: 'linear-gradient(135deg, #10b981, #06b6d4)', color: 'white', boxShadow: selectedHorse !== null && betAmount ? '0 8px 24px rgba(16,185,129,0.25)' : 'none' }}
                        >
                          <Zap className="w-4 h-4" />
                          Xác Nhận Đặt Cược
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Bet history */}
              <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="px-5 py-4 border-b border-white/7 flex items-center justify-between">
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
                      <button
                        onClick={() => setShowLoginModal(true)}
                        className="mt-3 text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1 mx-auto"
                      >
                        Đăng nhập ngay <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    userPredictions.map((pred, i) => (
                      <div key={i} className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <span className="text-xs text-slate-400 leading-tight">{pred.race}</span>
                          <span className={`shrink-0 px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                            pred.status === 'won' ? 'bg-emerald-500/15 text-emerald-400' :
                            pred.status === 'lost' ? 'bg-red-500/15 text-red-400' :
                            'bg-amber-500/15 text-amber-400'
                          }`}>
                            {pred.status === 'won' ? '✓ Thắng' : pred.status === 'lost' ? '✗ Thua' : '⏳ Chờ'}
                          </span>
                        </div>
                        <div className="font-bold text-white text-sm mb-1.5">{pred.horse}</div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-600">{pred.odds}x · {pred.amount.toLocaleString()}đ</span>
                          <span className={`font-bold ${pred.status === 'won' ? 'text-emerald-400' : pred.status === 'lost' ? 'text-red-400 line-through' : 'text-amber-400'}`}>
                            +{pred.potential.toLocaleString()}đ
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ━━━ TAB: RESULTS ━━━ */}
        {activeTab === 'results' && (
          <ResultsBoard />
        )}
      </div>
    </div>
  );
}
