import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { PublicShell } from "../components/layout/PublicShell";
import { GradeBadge } from "../components/shared/GradeBadge";
import {
  Zap,
  Target,
  BarChart3,
  Clock,
  Trophy,
  Users,
  Activity,
  Eye,
  Check,
  AlertCircle,
  Lock,
  LogIn,
  Flag,
  ChevronRight,
  Award,
  ArrowUpRight,
  Crown,
  Sparkles,
  Loader2,
  Bot,
  RefreshCw,
  TrendingUp,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { Pagination } from "../components/Pagination";
import {
  raceApi,
  type Race,
  type RaceResultEntry,
  type HorsePrediction,
} from "../api/race";
import { betApi, type Bet, type BetType, BET_MULTIPLIERS } from "../api/bet";
import { toast } from "sonner";

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

// ─── Login Gate Modal ─────────────────────────────────────────────────────────

function LoginGateModal({
  onClose,
  onLogin,
}: {
  onClose: () => void;
  onLogin: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md overflow-hidden bg-card border border-border shadow-xl">
        <div className="h-1 w-full bg-primary" />
        <div className="p-8 text-center">
          <h2 className="font-serif text-2xl font-bold text-foreground mb-3">
            Yêu Cầu Đăng Nhập
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-8">
            Bạn cần <strong className="text-foreground">đăng nhập</strong> để đặt
            cược và xem lịch sử dự đoán.
          </p>
          <div className="space-y-3">
            <button
              type="button"
              onClick={onLogin}
              className="w-full flex items-center justify-center gap-2 py-3.5 text-base font-bold bg-primary text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <LogIn className="w-5 h-5" /> Đăng Nhập Ngay
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-full py-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Tiếp tục xem (không đặt cược)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Auth Gate ───────────────────────────────────────────────────────────────

const AUTH_FEATURES = [
  {
    icon: Bot,
    color: "#1F3D2B",
    label: "Dự đoán AI",
    desc: "Xác suất chiến thắng từng ngựa theo mô hình XGBoost",
  },
  {
    icon: Zap,
    color: "#C9A227",
    label: "Đặt cược",
    desc: "Win / Place / Show với hệ số nhân cố định x1.5 – x3",
  },
  {
    icon: BarChart3,
    color: "#8C2F1B",
    label: "Lịch sử cá cược",
    desc: "Theo dõi tỷ lệ đúng và tổng coin thắng của bạn",
  },
  {
    icon: Trophy,
    color: "#7A7468",
    label: "Kết quả cuộc đua",
    desc: "Xem bảng xếp hạng và thông tin ngựa/kỵ sĩ sau mỗi race",
  },
];

function AuthGate({
  onLogin,
  onRegister,
}: {
  onLogin: () => void;
  onRegister: () => void;
}) {
  return (
    <div className="relative max-w-7xl mx-auto px-6 pt-24 pb-24">
      {/* Blurred preview rows */}
      <div
        className="pointer-events-none select-none blur-[6px] opacity-40 mb-0"
        aria-hidden
      >
        <div className="h-12 bg-muted mb-3" />
        <div className="grid grid-cols-2 gap-4">
          <div className="h-48 bg-muted" />
          <div className="h-48 bg-muted" />
        </div>
      </div>

      {/* Gate card — overlaps the blur */}
      <div className="relative -mt-32 z-10">
        <div className="relative overflow-hidden bg-card border border-border shadow-lg">
          {/* Top accent bar */}
          <div className="h-1 w-full bg-primary" />

          <div className="px-8 py-12 md:px-14 md:py-14">
            <div className="flex flex-col lg:flex-row items-center gap-12">
              {/* Left — icon + text */}
              <div className="flex-1 text-center lg:text-left">

                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-5 text-xs font-bold uppercase tracking-widest border border-primary/30 text-primary">
                  <AlertCircle className="w-3 h-3" />
                  Yêu cầu đăng nhập
                </div>

                <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-4 leading-tight">
                  Đăng nhập để mở khóa
                  <br />
                  <span className="italic text-secondary">toàn bộ tính năng</span>
                </h2>
                <p className="text-muted-foreground leading-relaxed max-w-md mx-auto lg:mx-0 mb-8">
                  Trang dự đoán yêu cầu tài khoản để bảo vệ dữ liệu cá cược và
                  cung cấp phân tích AI cá nhân hóa cho bạn.
                </p>

                {/* CTAs */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                  <button
                    type="button"
                    onClick={onLogin}
                    className="flex items-center justify-center gap-2.5 px-7 py-3.5 text-base font-bold bg-primary text-primary-foreground transition-colors hover:bg-primary/90 active:scale-[.98]"
                  >
                    <LogIn className="w-5 h-5" />
                    Đăng Nhập Ngay
                  </button>
                  <button
                    type="button"
                    onClick={onRegister}
                    className="flex items-center justify-center gap-2.5 px-7 py-3.5 text-base font-semibold border border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                  >
                    <Users className="w-5 h-5" />
                    Tạo Tài Khoản
                  </button>
                </div>
              </div>

              {/* Right — feature list */}
              <div className="w-full lg:w-80 shrink-0 space-y-3">
                <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-4 text-center lg:text-left">
                  Bạn sẽ mở khóa được
                </p>
                {AUTH_FEATURES.map(({ icon: Icon, color, label, desc }) => (
                  <div
                    key={label}
                    className="flex items-start gap-4 p-4 bg-background border border-border transition-colors"
                  >
                    <div
                      className="w-9 h-9 flex items-center justify-center shrink-0"
                      style={{
                        background: `${color}18`,
                        border: `1px solid ${color}30`,
                      }}
                    >
                      <Icon className="w-4 h-4" style={{ color }} />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-foreground mb-0.5">
                        {label}
                      </div>
                      <div className="text-xs text-muted-foreground leading-relaxed">
                        {desc}
                      </div>
                    </div>
                    <Check
                      className="w-4 h-4 shrink-0 mt-0.5"
                      style={{ color }}
                    />
                  </div>
                ))}
              </div>
            </div>
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
    raceApi
      .getRaces(token, { status: "finished", limit: 5 })
      .then((r) => {
        const races = r.races ?? [];
        setFinishedRaces(races);
        if (races.length > 0) setSelectedRace(races[0]);
      })
      .catch(() => {});
  }, [token]);

  useEffect(() => {
    if (!selectedRace || !token) return;
    setLoading(true);
    raceApi
      .getRaceResults(token, selectedRace._id)
      .then((r) => setResults(r.results ?? []))
      .catch(() => setResults([]))
      .finally(() => setLoading(false));
  }, [selectedRace, token]);

  if (!token)
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <Lock className="w-12 h-12 mb-4 opacity-30" />
        <p>Đăng nhập để xem kết quả</p>
      </div>
    );

  if (finishedRaces.length === 0)
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <Trophy className="w-12 h-12 mb-4 opacity-30" />
        <p>Chưa có cuộc đua nào hoàn thành</p>
      </div>
    );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 flex items-center justify-center bg-gold/15 border border-gold/30">
          <Trophy className="w-5 h-5 text-gold" />
        </div>
        <div>
          <h2 className="font-serif text-lg font-bold text-foreground">Kết Quả Chính Thức</h2>
          <p className="text-xs text-muted-foreground">
            Bảng kết quả đua ngựa chi tiết
          </p>
        </div>
      </div>

      {/* Race selector */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {finishedRaces.map((r) => (
          <button
            type="button"
            key={r._id}
            onClick={() => setSelectedRace(r)}
            className={`flex-shrink-0 px-4 py-2.5 text-xs font-bold transition-all ${
              selectedRace?._id === r._id
                ? "bg-primary text-primary-foreground"
                : "bg-card border border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {r.name}
          </button>
        ))}
      </div>

      {/* Race info */}
      {selectedRace && (
        <div className="relative overflow-hidden p-6 bg-gold/10 border border-gold/40">
          <h3 className="font-serif text-xl font-bold text-foreground mb-2">
            {selectedRace.name}
          </h3>
          <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Flag className="w-3 h-3" />
              {selectedRace.grade}
            </span>
            <span className="flex items-center gap-1">
              <Activity className="w-3 h-3" />
              {selectedRace.distance}m
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {new Date(selectedRace.scheduledTime).toLocaleDateString("vi-VN")}
            </span>
            <span className="ml-auto text-[#8F7318] font-bold">
              {selectedRace.purse.toLocaleString('vi-VN')} VNĐ giải thưởng
            </span>
          </div>
        </div>
      )}

      {/* Results */}
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : results.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground text-sm">
          Chưa có kết quả
        </div>
      ) : (
        <div className="overflow-hidden border border-border bg-card">
          <div className="grid grid-cols-12 gap-2 px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground bg-muted/50">
            <div className="col-span-1 text-center">Hạng</div>
            <div className="col-span-5">Ngựa / Kỵ Sĩ</div>
            <div className="col-span-2 text-center">Thời Gian</div>
            <div className="col-span-2 text-center">Điểm</div>
            <div className="col-span-2 text-right">Giải Thưởng</div>
          </div>
          <div className="divide-y divide-border">
            {results
              .sort((a, b) => a.position - b.position)
              .map((r, idx) => (
                <div
                  key={r._id}
                  className={`grid grid-cols-12 gap-2 px-5 py-4 items-center hover:bg-muted/40 ${idx === 0 ? "bg-gold/5" : ""}`}
                >
                  <div className="col-span-1 flex justify-center">
                    {r.position === 1 ? (
                      <div className="w-9 h-9 flex items-center justify-center bg-gold">
                        <Crown className="w-4 h-4 text-foreground" />
                      </div>
                    ) : r.position <= 3 ? (
                      <div
                        className="w-9 h-9 flex items-center justify-center font-black text-sm"
                        style={{
                          background: r.position === 2 ? "#9A937F" : "#A85C32",
                        }}
                      >
                        <span className="text-white">{r.position}</span>
                      </div>
                    ) : (
                      <div className="w-9 h-9 flex items-center justify-center text-sm font-bold bg-muted text-muted-foreground">
                        {r.position}
                      </div>
                    )}
                  </div>
                  <div className="col-span-5">
                    <div className="font-black text-sm text-foreground">
                      {r.horseId?.name ?? "—"}
                      {r.position === 1 && (
                        <span className="ml-2 text-[10px] bg-gold/20 text-[#8F7318] px-1.5 py-0.5 border border-gold/40 font-bold">
                          VÔ ĐỊCH
                        </span>
                      )}
                    </div>
                    {r.jockeyId && (
                      <div className="text-xs text-muted-foreground mt-0.5">
                        🏇 {r.jockeyId.fullName}
                      </div>
                    )}
                  </div>
                  <div className="col-span-2 text-center">
                    <span className="text-sm font-mono text-muted-foreground">
                      {(r.finishTime / 1000).toFixed(2)}s
                    </span>
                  </div>
                  <div className="col-span-2 text-center">
                    <span className="text-[#8F7318] font-bold tabular-nums">
                      +{r.pointsEarned}
                    </span>
                  </div>
                  <div className="col-span-2 text-right">
                    {r.prizeAmount > 0 ? (
                      <span className="text-primary font-black text-sm tabular-nums">
                        {r.prizeAmount.toLocaleString('vi-VN')} VNĐ
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
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

// ─── AI Predictions Panel ─────────────────────────────────────────────────────

function AIPredictionsPanel({
  raceId,
  token,
}: {
  raceId: string;
  token: string;
}) {
  const [predictions, setPredictions] = useState<HorsePrediction[]>([]);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);
  const [fromCache, setFromCache] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = (refresh = false) => {
    setLoading(true);
    setError(null);
    raceApi
      .getAIPredictions(token, raceId, refresh)
      .then((data) => {
        setPredictions(data.predictions ?? []);
        setGeneratedAt(data.generatedAt);
        setFromCache(data.fromCache);
      })
      .catch((err) => setError(err.message || "Không thể tải dự đoán AI"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [raceId]);

  return (
    <div className="overflow-hidden mt-6 bg-secondary/5 border border-secondary/25">
      {/* Header */}
      <div className="px-5 py-4 flex items-center justify-between border-b border-secondary/15">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 flex items-center justify-center shrink-0 bg-secondary">
            <Bot className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="font-serif font-bold text-foreground text-sm">
              Dự Đoán AI Thứ Hạng
            </h3>
            {generatedAt && (
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {fromCache
                  ? `Cập nhật lúc ${new Date(generatedAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}`
                  : "Vừa phân tích"}
              </p>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={() => load(true)}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-secondary border border-secondary/30 bg-secondary/10 hover:bg-secondary/20 transition-colors disabled:opacity-40"
        >
          <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
          Làm mới
        </button>
      </div>

      {/* Body */}
      <div className="p-4">
        {loading && predictions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 gap-3">
            <div className="w-10 h-10 flex items-center justify-center bg-secondary/15">
              <Bot className="w-5 h-5 text-secondary animate-pulse" />
            </div>
            <p className="text-sm text-muted-foreground">
              Gemini AI đang phân tích...
            </p>
            <p className="text-xs text-muted-foreground/70">Thường mất 1–3 giây</p>
          </div>
        ) : error ? (
          <div className="flex items-center gap-3 py-4 px-2 text-sm text-destructive">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        ) : predictions.length === 0 ? (
          <div className="text-center py-6 text-sm text-muted-foreground">
            Chưa có đủ dữ liệu để dự đoán
          </div>
        ) : (
          <div className="space-y-2">
            {predictions.map((p) => (
              <div
                key={p.horseId}
                className={`p-3.5 transition-all border ${
                  p.rank <= 3
                    ? "bg-card border-secondary/25"
                    : "bg-card border-border"
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  {/* Rank badge */}
                  {p.rank === 1 ? (
                    <div className="w-8 h-8 flex items-center justify-center shrink-0 bg-gold">
                      <Crown className="w-4 h-4 text-foreground" />
                    </div>
                  ) : p.rank === 2 ? (
                    <div
                      className="w-8 h-8 flex items-center justify-center shrink-0 text-sm font-black text-white"
                      style={{ background: "#9A937F" }}
                    >
                      {p.rank}
                    </div>
                  ) : p.rank === 3 ? (
                    <div
                      className="w-8 h-8 flex items-center justify-center shrink-0 text-sm font-black text-white"
                      style={{ background: "#A85C32" }}
                    >
                      {p.rank}
                    </div>
                  ) : (
                    <div className="w-8 h-8 flex items-center justify-center shrink-0 text-sm font-bold text-muted-foreground bg-muted">
                      {p.rank}
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-black text-foreground text-sm truncate">
                        {p.horseName}
                      </span>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-secondary font-bold tabular-nums">
                          {p.winProbability}%
                        </span>
                        <span className="text-[10px] text-muted-foreground">win</span>
                      </div>
                    </div>
                    {/* Win probability bar */}
                    <div className="mt-1.5 h-1.5 bg-muted overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${p.rank === 1 ? "bg-gold" : "bg-secondary"}`}
                        style={{ width: `${p.winProbability}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Stats row */}
                <div className="flex items-center ml-11">
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <TrendingUp className="w-3 h-3" />
                    Top 3:{" "}
                    <span className="text-primary font-bold ml-0.5 tabular-nums">
                      {p.top3Probability}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        {!loading && !error && predictions.length > 0 && (
          <div className="mt-3 flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <Bot className="w-3 h-3" />
            <span>Powered by Gemini AI · Chỉ mang tính tham khảo</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export function PredictionsPage() {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const isLoggedIn = !!user && !!token;

  const [showLoginModal, setShowLoginModal] = useState(false);
  const [activeTab, setActiveTab] = useState<"predict" | "results">("predict");

  // Races
  const [races, setRaces] = useState<Race[]>([]);
  const [selectedRace, setSelectedRace] = useState<Race | null>(null);
  const [loadingRaces, setLoadingRaces] = useState(false);

  // Horses for selected race
  const [horses, setHorses] = useState<HorseEntry[]>([]);
  const [loadingHorses, setLoadingHorses] = useState(false);

  // Bet
  const [selectedHorseIdx, setSelectedHorseIdx] = useState<number | null>(null);
  const [betType, setBetType] = useState<BetType>("win");
  const [betAmount, setBetAmount] = useState("");
  const [placing, setPlacing] = useState(false);
  const [placed, setPlaced] = useState(false);

  // Bet history
  const [myBets, setMyBets] = useState<Bet[]>([]);
  const [loadingBets, setLoadingBets] = useState(false);
  const [betPage, setBetPage] = useState(1);
  const BET_PAGE_SIZE = 5;

  // Load open+running races on mount
  useEffect(() => {
    if (!token) return;
    setLoadingRaces(true);
    Promise.all([
      raceApi.getRaces(token, { status: "open", limit: 5 }),
      raceApi.getRaces(token, { status: "running", limit: 3 }),
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
    raceApi
      .getRaceHorses(token, selectedRace._id)
      .then((r) => setHorses(r.horses ?? []))
      .catch(() => setHorses([]))
      .finally(() => setLoadingHorses(false));
  }, [selectedRace, token]);

  // Load bets on mount
  useEffect(() => {
    if (!token) return;
    setLoadingBets(true);
    betApi
      .getMyBets(token, { limit: 50 })
      .then((r) => { setMyBets(r.bets ?? []); setBetPage(1); })
      .catch(() => {})
      .finally(() => setLoadingBets(false));
  }, [token, placed]);

  const selectedHorse =
    selectedHorseIdx !== null ? horses[selectedHorseIdx] : null;
  const multiplier = BET_MULTIPLIERS[betType];
  const potentialWin =
    selectedHorse && betAmount && !isNaN(Number(betAmount))
      ? Math.floor(Number(betAmount) * multiplier)
      : null;

  const handleBetClick = async () => {
    if (!isLoggedIn) {
      setShowLoginModal(true);
      return;
    }
    if (!selectedRace || !selectedHorse || !betAmount) return;
    const amount = Number(betAmount);
    if (isNaN(amount) || amount < 1) {
      toast.error("Số tiền tối thiểu là 1");
      return;
    }
    setPlacing(true);
    try {
      await betApi.place(token!, {
        raceId: selectedRace._id,
        horseId: selectedHorse.horseId,
        betType,
        amount,
      });
      toast.success(
        `Đặt cược thành công! Tiềm năng: +${potentialWin?.toLocaleString('vi-VN')} VNĐ`,
      );
      setPlaced((p) => !p);
      setSelectedHorseIdx(null);
      setBetAmount("");
    } catch (err: any) {
      toast.error(err.message || "Đặt cược thất bại");
    } finally {
      setPlacing(false);
    }
  };

  const wonBets = myBets.filter((b) => b.status === "won").length;
  const settledBets = myBets.filter(
    (b) => b.status === "won" || b.status === "lost",
  ).length;
  const winRate =
    settledBets > 0 ? Math.round((wonBets / settledBets) * 100) : 0;
  const totalWon = myBets.reduce((s, b) => s + (b.payoutAmount || 0), 0);

  return (
    <PublicShell>
      {showLoginModal && (
        <LoginGateModal
          onClose={() => setShowLoginModal(false)}
          onLogin={() => navigate("/login")}
        />
      )}

      {/* Header — chỉ hiện khi đã đăng nhập */}
      {isLoggedIn && <div className="relative pt-14 pb-4 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row items-start lg:items-end justify-between gap-10">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 text-sm font-bold uppercase tracking-widest border border-primary/30 text-primary">
                <Zap className="w-4 h-4" /> Dự Đoán &amp; Cược
              </div>
              <h1 className="font-serif text-5xl md:text-6xl font-bold text-foreground mb-4 leading-none tracking-tight">
                Dự Đoán
                <br />
                <span className="italic text-secondary">Cuộc Đua</span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-xl leading-relaxed">
                Phân tích xu hướng, xem phong độ ngựa và đưa ra dự đoán chính
                xác.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3 shrink-0">
              {[
                {
                  label: "Tỷ Lệ Đúng",
                  value: isLoggedIn ? `${winRate}%` : "—",
                  color: "#1F3D2B",
                  icon: Target,
                },
                {
                  label: "Đã Cược",
                  value: isLoggedIn ? String(myBets.length) : "—",
                  color: "#8F7318",
                  icon: BarChart3,
                },
                {
                  label: "Tổng Thắng",
                  value: isLoggedIn ? `${(totalWon / 1000).toFixed(0)}K` : "—",
                  color: "#8C2F1B",
                  icon: Sparkles,
                },
              ].map(({ label, value, color, icon: Icon }) => (
                <div
                  key={label}
                  className="flex flex-col items-center text-center px-5 py-4 bg-card border border-border"
                >
                  <Icon className="w-4 h-4 mb-2" style={{ color }} />
                  <div className="font-serif text-2xl font-bold tabular-nums" style={{ color }}>
                    {value}
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-wider">
                    {label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>}

      {/* Auth Gate — hiển thị khi chưa đăng nhập */}
      {!isLoggedIn && (
        <AuthGate
          onLogin={() => navigate("/login")}
          onRegister={() => navigate("/register")}
        />
      )}

      {/* Tabs + Content — chỉ hiện khi đã đăng nhập */}
      {isLoggedIn && (
        <>
          <div className="sticky top-[64px] z-30 border-b border-border px-6 bg-background/95 backdrop-blur-sm">
            <div className="max-w-7xl mx-auto flex gap-0">
              {[
                ["predict", "Đặt Dự Đoán", Target],
                ["results", "Kết Quả Chính Thức", Trophy],
              ].map(([key, label, Icon]: any) => (
                <button
                  type="button"
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`flex items-center gap-2 px-6 py-4 text-sm font-bold border-b-2 transition-all uppercase tracking-wider ${activeTab === key ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
                >
                  <Icon className="w-4 h-4" /> {label}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="max-w-7xl mx-auto px-6 py-10">
            {/* PREDICT TAB */}
            {activeTab === "predict" && (
              <div className="grid lg:grid-cols-3 gap-8">
                {/* Left: Race + Participants */}
                <div className="lg:col-span-2 space-y-8">
                  {selectedRace?.status === "running" && (
                    <div className="flex items-center gap-4 px-5 py-4 bg-secondary/8 border border-secondary/25">
                      <div className="w-2.5 h-2.5 rounded-full bg-secondary animate-pulse" />
                      <span className="text-sm font-bold text-secondary uppercase tracking-widest">
                        Đang Diễn Ra Trực Tiếp
                      </span>
                    </div>
                  )}

                  {/* Race selector */}
                  <div>
                    <h2 className="text-sm font-black text-muted-foreground uppercase tracking-widest mb-4">
                      Chọn Cuộc Đua
                    </h2>
                    {loadingRaces ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                      </div>
                    ) : races.length === 0 ? (
                      <div className="p-6 text-center text-muted-foreground text-sm bg-card border border-border">
                        Không có cuộc đua nào đang mở đặt cược
                      </div>
                    ) : (
                      <div className="grid sm:grid-cols-2 gap-3">
                        {races.map((race) => (
                          <button
                            type="button"
                            key={race._id}
                            onClick={() => {
                              setSelectedRace(race);
                              setSelectedHorseIdx(null);
                              setBetAmount("");
                            }}
                            className={`p-4 border text-left transition-all hover:-translate-y-0.5 ${
                              selectedRace?._id === race._id
                                ? "bg-primary/10 border-primary/50"
                                : "bg-card border-border"
                            }`}
                          >
                            <div className="flex items-start justify-between mb-3">
                              <h3 className="font-serif font-bold text-foreground text-sm leading-tight pr-2">
                                {race.name}
                              </h3>
                              <span
                                className={`shrink-0 px-2.5 py-1 text-[10px] font-black uppercase ${race.status === "running" ? "bg-secondary text-white" : "bg-primary text-primary-foreground"}`}
                              >
                                {race.status === "running"
                                  ? "● TRỰC TIẾP"
                                  : "Mở Cược"}
                              </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {new Date(race.scheduledTime).toLocaleString(
                                  "vi-VN",
                                )}
                              </span>
                              <span className="flex items-center gap-1">
                                <Flag className="w-3 h-3" />
                                {race.distance}m
                              </span>
                              <span className="flex items-center gap-1">
                                <Award className="w-3 h-3" />
                                {race.purse.toLocaleString()}c
                              </span>
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
                        {
                          label: "Cự Ly",
                          value: `${selectedRace.distance}m`,
                          icon: Flag,
                        },
                        {
                          label: "Cấp Hạng",
                          value: selectedRace.grade,
                          icon: Award,
                        },
                        {
                          label: "Giải Thưởng",
                          value: `${selectedRace.purse.toLocaleString('vi-VN')} VNĐ`,
                          icon: Trophy,
                        },
                      ].map(({ label, value, icon: Icon }) => (
                        <div
                          key={label}
                          className="flex items-center gap-3 p-3 bg-card border border-border"
                        >
                          <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
                          <div>
                            <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
                              {label}
                            </div>
                            <div className="text-xs font-semibold text-foreground truncate">
                              {value}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* AI Predictions */}
                  {selectedRace &&
                    token &&
                    !["finished", "cancelled"].includes(
                      selectedRace.status,
                    ) && (
                      <AIPredictionsPanel
                        raceId={selectedRace._id}
                        token={token}
                      />
                    )}

                  {/* Participants */}
                  {selectedRace && (
                    <div>
                      <h2 className="text-sm font-black text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Activity className="w-4 h-4" /> Ngựa Tham Gia
                      </h2>
                      {loadingHorses ? (
                        <div className="flex justify-center py-10">
                          <Loader2 className="w-6 h-6 animate-spin text-primary" />
                        </div>
                      ) : horses.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground text-sm bg-card border border-dashed border-border">
                          Chưa có ngựa đăng ký
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {horses.map((h, idx) => (
                            <div
                              key={h.horseId}
                              onClick={() => setSelectedHorseIdx(idx)}
                              className={`relative overflow-hidden cursor-pointer transition-all hover:-translate-y-0.5 border ${
                                selectedHorseIdx === idx
                                  ? "bg-primary/10 border-primary/50"
                                  : "bg-card border-border"
                              }`}
                            >
                              <div className="pl-5 pr-5 py-4">
                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 flex items-center justify-center text-sm font-black shrink-0 bg-muted text-foreground">
                                      {idx + 1}
                                    </div>
                                    <div>
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span className="font-black text-foreground">
                                          {h.horseName}
                                        </span>
                                        <GradeBadge grade={h.currentGrade} />
                                      </div>
                                      <div className="text-xs text-muted-foreground">
                                        {h.jockeyName
                                          ? `🏇 ${h.jockeyName}`
                                          : "Chưa có kỵ sĩ"}
                                        {h.jockeyExperience
                                          ? ` · ${h.jockeyExperience}năm KN`
                                          : ""}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="text-right shrink-0">
                                    <div className="font-serif text-xl font-bold text-[#8F7318] tabular-nums">
                                      {h.totalPoints}
                                    </div>
                                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
                                      Điểm
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider shrink-0">
                                    Win Rate:
                                  </span>
                                  <div className="flex-1 h-1.5 bg-muted overflow-hidden">
                                    <div
                                      className="h-full bg-primary"
                                      style={{ width: `${h.winRate}%` }}
                                    />
                                  </div>
                                  <span className="text-xs font-bold text-primary shrink-0 tabular-nums">
                                    {h.winRate}%
                                  </span>
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
                  <div className="overflow-hidden bg-card border border-border">
                    <div className="px-6 py-5 border-b border-border flex items-center gap-3">
                      <div className="w-9 h-9 flex items-center justify-center bg-secondary">
                        <Zap className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <h3 className="font-serif font-bold text-foreground">Đặt Cược</h3>
                        {!isLoggedIn && (
                          <p className="text-[10px] text-destructive">
                            Yêu cầu đăng nhập
                          </p>
                        )}
                      </div>
                      {!isLoggedIn && (
                        <div className="ml-auto flex items-center gap-1.5 px-2.5 py-1 bg-destructive/10 border border-destructive/20">
                          <Lock className="w-3 h-3 text-destructive" />
                          <span className="text-[10px] font-bold text-destructive">
                            Khóa
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="p-6">
                      {/* Bet type */}
                      {isLoggedIn && (
                        <div className="mb-4">
                          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2 block">
                            Loại Cược
                          </label>
                          <div className="grid grid-cols-3 gap-2">
                            {(["win", "place", "show"] as const).map((bt) => (
                              <button
                                type="button"
                                key={bt}
                                onClick={() => setBetType(bt)}
                                className={`py-2 text-xs font-bold transition-all border ${betType === bt ? "text-primary bg-primary/10 border-primary/50" : "text-muted-foreground hover:text-foreground bg-background border-border"}`}
                              >
                                {bt === "win"
                                  ? `Win ${BET_MULTIPLIERS.win}x`
                                  : bt === "place"
                                    ? `Place ${BET_MULTIPLIERS.place}x`
                                    : `Show ${BET_MULTIPLIERS.show}x`}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Selected horse */}
                      {selectedHorse ? (
                        <div className="mb-5 p-4 bg-primary/8 border border-primary/30">
                          <div className="text-[10px] text-primary font-bold uppercase tracking-widest mb-2">
                            Đã Chọn
                          </div>
                          <div className="font-black text-foreground">
                            {selectedHorse.horseName}
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {selectedHorse.jockeyName ?? "Chưa có kỵ sĩ"}
                          </div>
                        </div>
                      ) : (
                        <div
                          className="mb-5 p-5 text-center cursor-pointer bg-background border border-dashed border-border"
                          onClick={() => !isLoggedIn && setShowLoginModal(true)}
                        >
                          <AlertCircle className="w-8 h-8 text-muted-foreground/60 mx-auto mb-2" />
                          <p className="text-sm text-muted-foreground">
                            Chọn ngựa từ danh sách
                          </p>
                        </div>
                      )}

                      {/* Amount */}
                      <div className="mb-4">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2 block">
                          Số Tiền Cược (VNĐ)
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            placeholder="Nhập số tiền..."
                            value={betAmount}
                            onChange={(e) => setBetAmount(e.target.value)}
                            onClick={() =>
                              !isLoggedIn && setShowLoginModal(true)
                            }
                            readOnly={!isLoggedIn}
                            className="w-full px-4 py-3 text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-all bg-background border border-border"
                            style={{
                              cursor: isLoggedIn ? "text" : "not-allowed",
                            }}
                          />
                          {!isLoggedIn && (
                            <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          )}
                        </div>
                        <div className="grid grid-cols-4 gap-1.5 mt-2">
                          {[100, 500, 1000, 5000].map((v) => (
                            <button
                              type="button"
                              key={v}
                              onClick={() =>
                                isLoggedIn
                                  ? setBetAmount(String(v))
                                  : setShowLoginModal(true)
                              }
                              className="py-2 text-[10px] font-bold text-muted-foreground hover:text-foreground transition-all bg-background border border-border"
                            >
                              {v >= 1000 ? `${v / 1000}K` : v}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Potential win */}
                      {potentialWin !== null && isLoggedIn && (
                        <div className="mb-5 p-4 flex items-center justify-between bg-gold/10 border border-gold/40">
                          <div>
                            <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">
                              Tiềm Năng Thắng ({multiplier}x)
                            </div>
                            <div className="font-serif text-xl font-bold text-[#8F7318] tabular-nums">
                              {potentialWin.toLocaleString('vi-VN')} VNĐ
                            </div>
                          </div>
                          <ArrowUpRight className="w-6 h-6 text-[#8F7318] opacity-60" />
                        </div>
                      )}

                      {/* CTA */}
                      {!isLoggedIn ? (
                        <button
                          type="button"
                          onClick={() => setShowLoginModal(true)}
                          className="w-full flex items-center justify-center gap-2 py-3.5 text-sm font-black bg-primary text-primary-foreground transition-colors hover:bg-primary/90"
                        >
                          <LogIn className="w-4 h-4" /> Đăng Nhập Để Cược
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={handleBetClick}
                          disabled={!selectedHorse || !betAmount || placing}
                          className="w-full flex items-center justify-center gap-2 py-3.5 text-sm font-black bg-secondary text-white transition-colors hover:bg-secondary/90 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          {placing ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Zap className="w-4 h-4" />
                          )}
                          {placing ? "Đang xử lý..." : "Xác Nhận Đặt Cược"}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Bet history */}
                  <div className="overflow-hidden bg-card border border-border">
                    <div className="px-5 py-4 flex items-center justify-between border-b border-border">
                      <h3 className="font-serif text-sm font-bold text-foreground flex items-center gap-2">
                        <Eye className="w-4 h-4 text-muted-foreground" /> Lịch Sử Cược
                      </h3>
                      {!isLoggedIn && (
                        <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="p-3 space-y-2">
                      {!isLoggedIn ? (
                        <div className="py-8 text-center">
                          <Lock className="w-8 h-8 text-muted-foreground/50 mx-auto mb-3" />
                          <p className="text-sm text-muted-foreground">
                            Đăng nhập để xem lịch sử
                          </p>
                          <button
                            type="button"
                            onClick={() => setShowLoginModal(true)}
                            className="mt-3 text-xs font-bold text-primary hover:text-primary/80 transition-colors flex items-center gap-1 mx-auto"
                          >
                            Đăng nhập ngay <ChevronRight className="w-3 h-3" />
                          </button>
                        </div>
                      ) : loadingBets ? (
                        <div className="flex justify-center py-6">
                          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                        </div>
                      ) : myBets.length === 0 ? (
                        <div className="py-6 text-center text-sm text-muted-foreground">
                          Chưa có lịch sử cược
                        </div>
                      ) : (
                        <>
                          {myBets.slice((betPage - 1) * BET_PAGE_SIZE, betPage * BET_PAGE_SIZE).map((bet) => {
                            const race = bet.raceId as any;
                            const horse = bet.horseId as any;
                            return (
                              <div
                                key={bet._id}
                                className="p-3 bg-background border border-border"
                              >
                                <div className="flex items-start justify-between gap-2 mb-1">
                                  <span className="text-xs text-muted-foreground leading-tight">
                                    {race?.name ?? "Race"}
                                  </span>
                                  <span
                                    className={`shrink-0 px-2 py-0.5 text-[10px] font-black uppercase ${bet.status === "won" ? "bg-primary/10 text-primary" : bet.status === "lost" ? "bg-destructive/10 text-destructive" : "bg-gold/15 text-[#8F7318]"}`}
                                  >
                                    {bet.status === "won"
                                      ? "✓ Thắng"
                                      : bet.status === "lost"
                                        ? "✗ Thua"
                                        : "⏳ Chờ"}
                                  </span>
                                </div>
                                <div className="font-bold text-foreground text-sm mb-1">
                                  {horse?.name ?? "—"}
                                </div>
                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-muted-foreground">
                                    {bet.betType} · {bet.amount.toLocaleString()}c
                                  </span>
                                  <span
                                    className={`font-bold tabular-nums ${bet.status === "won" ? "text-primary" : bet.status === "lost" ? "text-destructive line-through" : "text-[#8F7318]"}`}
                                  >
                                    +
                                    {Math.floor(
                                      bet.amount * bet.multiplier,
                                    ).toLocaleString()}
                                    c
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                          <Pagination
                            page={betPage}
                            totalPages={Math.ceil(myBets.length / BET_PAGE_SIZE)}
                            onPageChange={setBetPage}
                          />
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* RESULTS TAB */}
            {activeTab === "results" && <ResultsBoard token={token} />}
          </div>
        </>
      )}
    </PublicShell>
  );
}
