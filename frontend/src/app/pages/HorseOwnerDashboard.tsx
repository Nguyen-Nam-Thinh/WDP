import { useState, useEffect, useRef, useMemo } from "react";
import { Pagination } from "../components/Pagination";
import { useNavigate, useLocation } from "react-router";
import { toast } from "sonner";
import {
  Plus,
  Calendar,
  Trophy,
  DollarSign,
  Users,
  LogOut,
  Menu,
  X,
  Medal,
  CheckCircle,
  Clock,
  Sparkles,
  Activity,
  ChevronRight,
  TrendingUp,
  Image as ImageIcon,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Send,
  Loader2,
  AlertTriangle,
  Coins,
} from "lucide-react";
import {
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from "@mui/material";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import { AppShell, type NavItem } from "../components/layout/AppShell";
import { Home } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useWallet } from "../hooks/useWallet";
import { horseApi, Horse } from "../api/horse";
import { userApi, JockeyListItem, type Transaction, type OwnerRaceResult } from "../api/user";
import { tournamentApi, Tournament } from "../api/tournament";
import { raceApi, Race } from "../api/race";
import { invitationApi } from "../api/invitation";
import { registrationApi, Registration } from "../api/registration";

const GRADE_COLORS: Record<string, string> = {
  Maiden: "#7A7468",
  G3: "#3b82f6",
  G2: "#8b5cf6",
  G1: "#C9A227",
};

const OWNER_NAV: NavItem[] = [
  { to: "/horse-owner", label: "Tổng Quan", icon: <Home /> },
  { to: "/horse-owner/horses", label: "Ngựa Của Tôi", icon: <span className="text-base leading-none">🐎</span> },
  { to: "/horse-owner/jockeys", label: "Kỵ Sĩ", icon: <Users /> },
  { to: "/horse-owner/schedule", label: "Lịch Đua", icon: <Calendar /> },
  { to: "/horse-owner/results", label: "Thành Tích", icon: <TrendingUp /> },
  { to: "/horse-owner/wallet", label: "Ví Tiền", icon: <Wallet /> },
];

export function HorseOwnerDashboard() {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const { balance: walletBalance } = useWallet();

  useEffect(() => {
    if (!user) navigate("/");
  }, [user, navigate]);

  const { pathname } = useLocation();
  const activeTab = pathname === "/horse-owner/jockeys" ? "jockeys"
    : pathname === "/horse-owner/schedule" ? "schedule"
    : pathname === "/horse-owner/results" ? "results"
    : pathname === "/horse-owner/wallet" ? "wallet"
    : pathname === "/horse-owner/horses" ? "horses"
    : "overview";
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Dialogs
  const [addHorseOpen, setAddHorseOpen] = useState(false);
  const [registerRaceOpen, setRegisterRaceOpen] = useState(false);
  const [inviteJockeyOpen, setInviteJockeyOpen] = useState(false);
  const [invitingJockey, setInvitingJockey] = useState<JockeyListItem | null>(null);
  const [inviteForm, setInviteForm] = useState({ tournamentId: "", raceId: "", horseId: "", message: "" });
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loadingTournaments, setLoadingTournaments] = useState(false);
  const [racesForTournament, setRacesForTournament] = useState<Race[]>([]);
  const [loadingRaces, setLoadingRaces] = useState(false);
  const [submittingInvite, setSubmittingInvite] = useState(false);
  const [viewJockeyOpen, setViewJockeyOpen] = useState(false);
  const [viewingJockey, setViewingJockey] = useState<JockeyListItem | null>(null);
  const [topupOpen, setTopupOpen] = useState(false);

  // Horses — real API
  const [horses, setHorses] = useState<Horse[]>([]);
  const [loadingHorses, setLoadingHorses] = useState(false);
  const [horsePage, setHorsePage] = useState(1);
  const [jockeyPage, setJockeyPage] = useState(1);

  const loadHorses = async () => {
    if (!token) return;
    setLoadingHorses(true);
    try {
      const result = await horseApi.getMyHorses(token);
      setHorses(result.horses ?? []);
    } catch (err: any) {
      toast.error(err.message || "Không thể tải danh sách ngựa");
    } finally {
      setLoadingHorses(false);
    }
  };

  useEffect(() => {
    loadHorses();
  }, [token]);

  // Jockeys — real API
  const [jockeys, setJockeys] = useState<JockeyListItem[]>([]);
  const [loadingJockeys, setLoadingJockeys] = useState(false);

  const loadJockeys = async () => {
    if (!token) return;
    setLoadingJockeys(true);
    try {
      const result = await userApi.getJockeys(token);
      setJockeys(result.jockeys);
    } catch (err: any) {
      toast.error(err.message || "Không thể tải danh sách kỵ sĩ");
    } finally {
      setLoadingJockeys(false);
    }
  };

  useEffect(() => {
    loadJockeys();
  }, [token]);

  // Invite dialog — load tournaments when dialog opens
  useEffect(() => {
    if (!inviteJockeyOpen || !token) return;
    setInviteForm({ tournamentId: "", raceId: "", horseId: "", message: "" });
    setRacesForTournament([]);
    setLoadingTournaments(true);
    tournamentApi.getTournaments(token)
      .then((res) => setTournaments(res.tournaments ?? []))
      .catch((err: any) => toast.error(err.message || "Không thể tải danh sách giải đấu"))
      .finally(() => setLoadingTournaments(false));
  }, [inviteJockeyOpen, token]);

  // Invite dialog — load races when tournament changes
  useEffect(() => {
    if (!inviteForm.tournamentId || !token) return;
    setInviteForm((prev) => ({ ...prev, raceId: "", horseId: "" }));
    setRacesForTournament([]);
    setLoadingRaces(true);
    raceApi.getRaces(token, { tournamentId: inviteForm.tournamentId })
      .then((res) => {
        const active = (res.races ?? []).filter(
          (r) => !["running", "finished", "cancelled"].includes(r.status),
        );
        setRacesForTournament(active);
      })
      .catch((err: any) => toast.error(err.message || "Không thể tải danh sách race"))
      .finally(() => setLoadingRaces(false));
  }, [inviteForm.tournamentId, token]);

  const handleSubmitInvite = async () => {
    if (!invitingJockey || !inviteForm.raceId || !inviteForm.horseId) {
      toast.error("Vui lòng chọn đầy đủ thông tin");
      return;
    }
    setSubmittingInvite(true);
    try {
      await invitationApi.createInvitation(token!, {
        jockeyId: invitingJockey._id,
        raceId: inviteForm.raceId,
        horseId: inviteForm.horseId,
        message: inviteForm.message || undefined,
      });
      toast.success(`Đã gửi lời mời đến ${invitingJockey.fullName}`);
      setInviteJockeyOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Không thể gửi lời mời");
    } finally {
      setSubmittingInvite(false);
    }
  };

  // Add Horse form state
  const [horseForm, setHorseForm] = useState({
    name: "",
    breed: "",
    gender: "male" as "male" | "female",
    birthDate: "",
    weight: "",
    color: "",
    preferredTrackCondition: "" as "" | "dry" | "wet" | "muddy",
    temperament: "balanced" as "aggressive" | "balanced" | "conservative",
  });
  const [horseImageFiles, setHorseImageFiles] = useState<File[]>([]);
  const [horseImagePreviews, setHorseImagePreviews] = useState<string[]>([]);
  const horseImageInputRef = useRef<HTMLInputElement>(null);
  const [creatingHorse, setCreatingHorse] = useState(false);

  // Edit Horse form state
  const [editHorseOpen, setEditHorseOpen] = useState(false);
  const [editingHorse, setEditingHorse] = useState<Horse | null>(null);
  const [editHorseForm, setEditHorseForm] = useState({
    name: "",
    breed: "",
    gender: "male" as "male" | "female",
    birthDate: "",
    weight: "",
    color: "",
    preferredTrackCondition: "" as "" | "dry" | "wet" | "muddy",
    temperament: "balanced" as "aggressive" | "balanced" | "conservative",
  });
  const [updatingHorse, setUpdatingHorse] = useState(false);
  const [editHorseImageFiles, setEditHorseImageFiles] = useState<File[]>([]);
  const [editHorseImagePreviews, setEditHorseImagePreviews] = useState<string[]>([]);
  const editHorseImageInputRef = useRef<HTMLInputElement>(null);

  // View Horse state
  const [viewHorseOpen, setViewHorseOpen] = useState(false);
  const [viewingHorse, setViewingHorse] = useState<Horse | null>(null);
  const [viewHorseActiveImage, setViewHorseActiveImage] = useState<string>("");

  const openViewHorse = (horse: Horse) => {
    setViewingHorse(horse);
    const allImages = horse.imageUrls?.length ? horse.imageUrls : (horse.primaryImageUrl ? [horse.primaryImageUrl] : []);
    setViewHorseActiveImage(allImages[0] || "");
    setViewHorseOpen(true);
  };

  const handleEditHorseImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const newFiles = Array.from(e.target.files);
    
    const validFiles = newFiles.filter(file => {
      if (!file.type.startsWith("image/")) {
        toast.error(`File ${file.name} không phải là ảnh`);
        return false;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`Kích thước file ${file.name} vượt quá 5MB`);
        return false;
      }
      return true;
    });

    setEditHorseImageFiles(prev => [...prev, ...validFiles]);
    setEditHorseImagePreviews(prev => [
      ...prev,
      ...validFiles.map(file => URL.createObjectURL(file))
    ]);
  };

  const handleHorseImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const newFiles = Array.from(e.target.files);
    
    const validFiles = newFiles.filter(file => {
      if (!file.type.startsWith("image/")) {
        toast.error(`File ${file.name} không phải là ảnh`);
        return false;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`Kích thước file ${file.name} vượt quá 5MB`);
        return false;
      }
      return true;
    });

    setHorseImageFiles(prev => [...prev, ...validFiles]);
    setHorseImagePreviews(prev => [
      ...prev,
      ...validFiles.map(file => URL.createObjectURL(file))
    ]);
  };

  const handleCreateHorse = async () => {
    if (!horseForm.name || !horseForm.gender || !horseForm.birthDate || !horseForm.weight) {
      toast.error("Vui lòng điền đầy đủ thông tin bắt buộc");
      return;
    }
    if (!token) return;
    setCreatingHorse(true);
    try {
      const newHorse = await horseApi.createHorse(token, {
        name: horseForm.name,
        breed: horseForm.breed || undefined,
        gender: horseForm.gender,
        birthDate: horseForm.birthDate,
        weight: Number(horseForm.weight),
        color: horseForm.color || undefined,
        preferredTrackCondition: horseForm.preferredTrackCondition || undefined,
        temperament: horseForm.temperament,
      });

      if (horseImageFiles.length > 0) {
        await horseApi.uploadImages(token, newHorse._id, horseImageFiles);
      }

      toast.success("Đăng ký ngựa thành công!");
      setAddHorseOpen(false);
      setHorseForm({ name: "", breed: "", gender: "male", birthDate: "", weight: "", color: "", preferredTrackCondition: "", temperament: "balanced" });
      setHorseImageFiles([]);
      setHorseImagePreviews([]);
      await loadHorses();
    } catch (err: any) {
      toast.error(err.message || "Đăng ký ngựa thất bại");
    } finally {
      setCreatingHorse(false);
    }
  };

  const handleUpdateHorse = async () => {
    if (!editHorseForm.name || !editHorseForm.gender || !editHorseForm.birthDate || !editHorseForm.weight) {
      toast.error("Vui lòng điền đầy đủ thông tin bắt buộc");
      return;
    }
    if (!token || !editingHorse) return;
    setUpdatingHorse(true);
    try {
      await horseApi.updateHorse(token, editingHorse._id, {
        name: editHorseForm.name,
        breed: editHorseForm.breed || undefined,
        gender: editHorseForm.gender,
        birthDate: editHorseForm.birthDate,
        weight: Number(editHorseForm.weight),
        color: editHorseForm.color || undefined,
        preferredTrackCondition: editHorseForm.preferredTrackCondition || undefined,
        temperament: editHorseForm.temperament,
      });

      if (editHorseImageFiles.length > 0) {
        await horseApi.uploadImages(token, editingHorse._id, editHorseImageFiles);
      }

      toast.success("Cập nhật thông tin ngựa thành công!");
      setEditHorseOpen(false);
      setEditingHorse(null);
      setEditHorseImageFiles([]);
      setEditHorseImagePreviews([]);
      await loadHorses();
    } catch (err: any) {
      toast.error(err.message || "Cập nhật ngựa thất bại");
    } finally {
      setUpdatingHorse(false);
    }
  };

  const openEditHorse = (horse: Horse) => {
    setEditingHorse(horse);
    setEditHorseForm({
      name: horse.name,
      breed: horse.breed || "",
      gender: horse.gender,
      birthDate: horse.birthDate ? horse.birthDate.split('T')[0] : "",
      weight: horse.weight.toString(),
      color: horse.color || "",
      preferredTrackCondition: (horse.preferredTrackCondition ?? "") as "" | "dry" | "wet" | "muddy",
      temperament: (horse.temperament ?? "balanced") as "aggressive" | "balanced" | "conservative",
    });
    setEditHorseImageFiles([]);
    setEditHorseImagePreviews(horse.imageUrls || (horse.primaryImageUrl ? [horse.primaryImageUrl] : []));
    setEditHorseOpen(true);
  };


  // ── Schedule: real API state ──────────────────────────────────────────────
  const [openRaces, setOpenRaces] = useState<Race[]>([]);
  const [myRegistrations, setMyRegistrations] = useState<Registration[]>([]);
  const [loadingSchedule, setLoadingSchedule] = useState(false);
  const [regPage, setRegPage] = useState(1);
  const [scheduleSubTab, setScheduleSubTab] = useState<"registrations" | "open">("registrations");
  const [selectedRaceForReg, setSelectedRaceForReg] = useState<Race | null>(null);
  const [regHorseId, setRegHorseId] = useState("");
  const [submittingReg, setSubmittingReg] = useState(false);
  const [cancellingRegId, setCancellingRegId] = useState<string | null>(null);

  // Race results state
  const [raceResults, setRaceResults] = useState<OwnerRaceResult[]>([]);
  const [loadingResults, setLoadingResults] = useState(false);
  const [resultsPage, setResultsPage] = useState(1);
  const [resultsTotalPages, setResultsTotalPages] = useState(1);
  const [resultsTotal, setResultsTotal] = useState(0);

  // Transactions state
  const [txList, setTxList] = useState<Transaction[]>([]);
  const [loadingTx, setLoadingTx] = useState(false);
  const [txPage, setTxPage] = useState(1);
  const [txTotalPages, setTxTotalPages] = useState(1);

  const loadScheduleData = async () => {
    if (!token) return;
    setLoadingSchedule(true);
    try {
      const [racesRes, regsRes] = await Promise.all([
        raceApi.getRaces(token, { status: "open", limit: 50 }),
        registrationApi.getMyRegistrations(token, { limit: 50 }),
      ]);
      setOpenRaces(racesRes.races ?? []);
      setMyRegistrations(regsRes.registrations ?? []);
    } catch (err: any) {
      toast.error(err.message || "Không thể tải dữ liệu lịch đua");
    } finally {
      setLoadingSchedule(false);
    }
  };

  useEffect(() => {
    if (activeTab === "schedule") loadScheduleData();
  }, [activeTab, token]);

  useEffect(() => {
    if (activeTab !== "results" || !token) return;
    setLoadingResults(true);
    userApi.getMyRaceResults(token, resultsPage, 10)
      .then(r => { setRaceResults(r.results ?? []); setResultsTotalPages(r.totalPages); setResultsTotal(r.total); })
      .catch(() => {})
      .finally(() => setLoadingResults(false));
  }, [activeTab, token, resultsPage]);

  useEffect(() => {
    if (activeTab !== "wallet" || !token) return;
    setLoadingTx(true);
    userApi.getMyTransactions(token, txPage, 10)
      .then(r => { setTxList(r.transactions ?? []); setTxTotalPages(Math.ceil(r.total / 10)); })
      .catch(() => {})
      .finally(() => setLoadingTx(false));
  }, [activeTab, token, txPage]);

  const handleOpenRegisterDialog = (race: Race) => {
    setSelectedRaceForReg(race);
    setRegHorseId(horses[0]?._id || "");
    setRegisterRaceOpen(true);
  };

  const handleSubmitRegistration = async () => {
    if (!selectedRaceForReg || !regHorseId || !token) return;
    setSubmittingReg(true);
    try {
      await registrationApi.register(token, { raceId: selectedRaceForReg._id, horseId: regHorseId });
      toast.success(`Đăng ký thành công! Phí $${selectedRaceForReg.registrationFee} đã được trừ.`);
      setRegisterRaceOpen(false);
      setSelectedRaceForReg(null);
      await loadScheduleData();
    } catch (err: any) {
      toast.error(err.message || "Đăng ký thất bại");
    } finally {
      setSubmittingReg(false);
    }
  };

  const handleCancelRegistration = async (regId: string) => {
    if (!token || !confirm("Hủy đăng ký? Bạn sẽ được hoàn 40% phí.")) return;
    setCancellingRegId(regId);
    try {
      await registrationApi.cancel(token, regId);
      toast.success("Đã hủy đăng ký, 40% phí đã được hoàn trả");
      await loadScheduleData();
    } catch (err: any) {
      toast.error(err.message || "Hủy đăng ký thất bại");
    } finally {
      setCancellingRegId(null);
    }
  };

  const PAGE_SIZE = 10;
  const pagedHorses = useMemo(() => horses.slice((horsePage - 1) * PAGE_SIZE, horsePage * PAGE_SIZE), [horses, horsePage]);
  const horseTotalPages = Math.ceil(horses.length / PAGE_SIZE);
  const pagedJockeys = useMemo(() => jockeys.slice((jockeyPage - 1) * PAGE_SIZE, jockeyPage * PAGE_SIZE), [jockeys, jockeyPage]);
  const jockeyTotalPages = Math.ceil(jockeys.length / PAGE_SIZE);

  const activeRegs = useMemo(() => myRegistrations.filter(r => r.status === "active"), [myRegistrations]);
  const pagedRegs = useMemo(() => activeRegs.slice((regPage - 1) * PAGE_SIZE, regPage * PAGE_SIZE), [activeRegs, regPage]);
  const regTotalPages = Math.ceil(activeRegs.length / PAGE_SIZE);

  // Check if horse is already registered in a race
  const isHorseRegistered = (raceId: string) =>
    myRegistrations.some(r => (r.raceId as any)?._id === raceId && r.status === "active");

  const performanceData = [
    { month: "T1", earnings: 15000, points: 200 },
    { month: "T2", earnings: 25000, points: 350 },
    { month: "T3", earnings: 18000, points: 250 },
    { month: "T4", earnings: 42000, points: 500 },
    { month: "T5", earnings: 55000, points: 800 },
  ];


  const stats = [
    {
      label: "Tổng Số Ngựa",
      value: "3",
      icon: Sparkles,
      color: "from-blue-500 to-blue-700",
    },
    {
      label: "Kỵ Sĩ Hoạt Động",
      value: "1",
      icon: Users,
      color: "from-purple-500 to-purple-700",
    },
    {
      label: "Tổng Chiến Thắng",
      value: "20",
      icon: Trophy,
      color: "from-amber-500 to-amber-700",
    },
    {
      label: "Số Dư Ví",
      value: "$45,800",
      icon: Wallet,
      color: "from-[#C9A227] to-[#8F7318]",
    },
  ];

  return (
    <AppShell roleLabel="HORSE OWNER" nav={OWNER_NAV}>
      <div className="max-w-7xl mx-auto">
        {/* Stats Cards — only on overview */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {stats.map((stat, idx) => (
              <div
                key={idx}
                className="bg-card backdrop-blur-md border border-border rounded-2xl p-5 hover:-translate-y-1 transition-transform"
              >
                <div
                  className={`w-10 h-10 bg-gradient-to-br ${stat.color} rounded-lg flex items-center justify-center mb-3 shadow-lg`}
                >
                  <stat.icon className="w-5 h-5 text-white" />
                </div>
                <div className="font-serif text-2xl font-bold text-foreground mb-1">
                  {stat.value}
                </div>
                <div className="text-sm text-slate-400 font-medium">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Content: Horses */}
        {activeTab === "horses" && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="font-serif text-3xl font-bold text-foreground mb-2">
                  Ngựa Của Tôi
                </h2>
                <p className="text-slate-400">
                  Quản lý đàn ngựa và đăng ký ngựa mới
                </p>
              </div>
              <Button
                variant="contained"
                startIcon={<Plus />}
                onClick={() => setAddHorseOpen(true)}
                sx={{
                  background:
                    "linear-gradient(135deg, #C9A227 0%, #8F7318 100%)",
                  textTransform: "none",
                  fontWeight: 600,
                  boxShadow: "0 4px 6px -1px rgba(255, 222, 66, 0.2)",
                  "&:hover": {
                    background:
                      "linear-gradient(135deg, #C9A227 0%, #4C5C2D 100%)",
                  },
                }}
              >
                Đăng Ký Ngựa
              </Button>
            </div>

            {loadingHorses ? (
              <div className="flex items-center justify-center py-20 text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin mr-3" /> Đang tải...
              </div>
            ) : horses.length === 0 ? (
              <div className="text-center py-20 text-slate-500">
                Chưa có ngựa nào. Nhấn "Đăng Ký Ngựa" để bắt đầu.
              </div>
            ) : (
            <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pagedHorses.map((horse) => {
                const ageYears = horse.birthDate
                  ? Math.floor((Date.now() - new Date(horse.birthDate).getTime()) / (365.25 * 24 * 3600 * 1000))
                  : "?";
                const winRate = horse.raceCount > 0
                  ? Math.round((horse.winCount / horse.raceCount) * 100)
                  : 0;
                return (
                <div
                  key={horse._id}
                  className="group bg-card backdrop-blur-md border border-border rounded-2xl overflow-hidden hover:border-[#C9A227]/30 transition-all"
                >
                  <div className="h-48 overflow-hidden relative bg-slate-900 flex items-center justify-center">
                    {horse.primaryImageUrl ? (
                      <>
                        {/* Blurred Background Layer */}
                        <div 
                          className="absolute inset-0 opacity-50 blur-lg scale-110 group-hover:scale-125 transition-transform duration-700" 
                          style={{ 
                            backgroundImage: `url(${horse.primaryImageUrl})`, 
                            backgroundSize: 'cover', 
                            backgroundPosition: 'center' 
                          }}
                        />
                        {/* Main Image */}
                        <img
                          src={horse.primaryImageUrl}
                          alt={horse.name}
                          className="relative z-10 w-full h-full object-contain group-hover:scale-105 transition-transform duration-700 drop-shadow-lg"
                        />
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center relative z-10">
                        <ImageIcon className="w-16 h-16 text-slate-600" />
                      </div>
                    )}
                  </div>

                  <div className="p-6">
                    <h3 className="font-serif text-xl font-bold text-foreground mb-1">
                      {horse.name}
                    </h3>
                    <p className="text-sm text-slate-400 mb-4">
                      {horse.breed ?? "—"} • {ageYears} tuổi
                      <span
                        className="ml-2 px-1.5 py-0.5 rounded text-xs font-bold text-white"
                        style={{ backgroundColor: GRADE_COLORS[horse.currentGrade] ?? "#C9A227" }}
                      >
                        {horse.currentGrade}
                      </span>
                    </p>

                    <div className="grid grid-cols-2 gap-3 mb-6">
                      <div className="bg-slate-900/50 p-3 rounded-xl border border-border">
                        <div className="text-xs text-slate-400 mb-1">Thành Tích</div>
                        <div className="text-[#C9A227] font-semibold">{horse.winCount} thắng / {horse.raceCount} trận</div>
                      </div>
                      <div className="bg-slate-900/50 p-3 rounded-xl border border-border">
                        <div className="text-xs text-slate-400 mb-1">Tỷ Lệ Thắng</div>
                        <div className="text-[#C9A227] font-semibold">{winRate}%</div>
                      </div>
                      <div className="bg-slate-900/50 p-3 rounded-xl border border-border">
                        <div className="text-xs text-slate-400 mb-1">Điểm Tích Lũy</div>
                        <div className="text-foreground font-semibold">{horse.totalPoints} pts</div>
                      </div>
                      <div className="bg-slate-900/50 p-3 rounded-xl border border-border">
                        <div className="text-xs text-slate-400 mb-1">Tiền Thưởng</div>
                        <div className="text-[#1F3D2B] font-semibold">${horse.totalEarnings.toLocaleString()}</div>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <Button
                        fullWidth
                        variant="outlined"
                        onClick={() => openEditHorse(horse)}
                        sx={{
                          borderColor: "#E3DCCB",
                          color: "#23201A",
                          textTransform: "none",
                          "&:hover": {
                            borderColor: "#C9C2B0",
                            backgroundColor: "rgba(35,32,26,0.04)",
                          },
                        }}
                      >
                        Chỉnh Sửa
                      </Button>
                      <Button
                        fullWidth
                        variant="outlined"
                        onClick={() => openViewHorse(horse)}
                        sx={{
                          borderColor: "#C9A227",
                          color: "#C9A227",
                          textTransform: "none",
                          "&:hover": {
                            borderColor: "#B08D1E",
                            backgroundColor: "rgba(255, 222, 66, 0.1)",
                          },
                        }}
                      >
                        Xem Chi Tiết
                      </Button>
                    </div>
                  </div>
                </div>
              );
              })}
            </div>
            <Pagination page={horsePage} totalPages={horseTotalPages} onPageChange={(p) => { setHorsePage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }} />
            </>
            )}
          </div>
        )}

        {/* Content: Jockeys */}
        {activeTab === "jockeys" && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="font-serif text-3xl font-bold text-foreground mb-2">
                  Quản Lý Kỵ Sĩ
                </h2>
                <p className="text-slate-400">
                  Thuê kỵ sĩ và quản lý danh sách ưa thích
                </p>
              </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-card backdrop-blur-md border border-border rounded-2xl p-6">
                  <h3 className="font-serif text-xl font-bold text-foreground mb-6">
                    Kỵ Sĩ Có Sẵn
                  </h3>
                  <div className="space-y-4">
                    {loadingJockeys ? (
                      <div className="flex items-center justify-center py-8 text-slate-400">
                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                        Đang tải...
                      </div>
                    ) : jockeys.length === 0 ? (
                      <div className="text-center py-8 text-slate-400">
                        Chưa có kỵ sĩ nào trong hệ thống
                      </div>
                    ) : (
                      pagedJockeys.map((jockey) => {
                        const winCount = jockey.jockeyProfile?.winCount ?? 0;
                        const raceCount = jockey.jockeyProfile?.raceCount ?? 0;
                        const winRate = raceCount > 0
                          ? `${Math.round((winCount / raceCount) * 100)}%`
                          : "N/A";
                        const experienceYears = jockey.jockeyProfile?.experienceYears ?? 0;
                        const statusLabel = jockey.isActive ? "Sẵn Sàng" : "Không Hoạt Động";
                        return (
                          <div
                            key={jockey._id}
                            className="flex flex-col md:flex-row items-center justify-between p-4 bg-slate-900/50 rounded-xl border border-border hover:border-border transition-colors"
                          >
                            <div className="flex items-center gap-4 mb-4 md:mb-0 w-full md:w-auto">
                              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center font-serif text-lg font-bold text-white overflow-hidden">
                                {jockey.avatarUrl ? (
                                  <img src={jockey.avatarUrl} alt={jockey.fullName} className="w-full h-full object-cover" />
                                ) : (
                                  jockey.fullName.charAt(0)
                                )}
                              </div>
                              <div>
                                <h4 className="text-foreground font-medium">
                                  {jockey.fullName}
                                </h4>
                                <div className="text-sm text-slate-400 mt-1">
                                  {experienceYears} năm kinh nghiệm • {winCount} thắng ({winRate})
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 w-full md:w-auto">
                              <Chip
                                label={statusLabel}
                                size="small"
                                sx={{
                                  backgroundColor: jockey.isActive
                                    ? "rgba(255, 222, 66, 0.2)"
                                    : "rgba(100, 116, 139, 0.2)",
                                  color: jockey.isActive ? "#C9A227" : "#7A7468",
                                  border: `1px solid ${jockey.isActive ? "#C9A227" : "#475569"}`,
                                }}
                              />
                              <Button
                                variant="outlined"
                                size="small"
                                onClick={() => { setViewingJockey(jockey); setViewJockeyOpen(true); }}
                                sx={{
                                  borderColor: "#C9C2B0",
                                  color: "#7A7468",
                                  textTransform: "none",
                                  "&:hover": { borderColor: "#C9C2B0", color: "#23201A" },
                                }}
                              >
                                Hồ sơ
                              </Button>
                              <Button
                                variant="contained"
                                size="small"
                                disabled={!jockey.isActive}
                                onClick={() => { setInvitingJockey(jockey); setInviteJockeyOpen(true); }}
                                sx={{
                                  background: jockey.isActive ? "#C9A227" : "#334155",
                                  textTransform: "none",
                                  "&:hover": { background: "#B08D1E" },
                                }}
                              >
                                Thuê
                              </Button>
                            </div>
                          </div>
                        );
                      })
                    )}
                    <Pagination page={jockeyPage} totalPages={jockeyTotalPages} onPageChange={setJockeyPage} />
                  </div>
                </div>
              </div>

              {/* <div className="bg-card backdrop-blur-md border border-border rounded-2xl p-6 h-fit">
                <h3 className="font-serif text-xl font-bold text-foreground mb-6">Kỵ Sĩ Ưa Thích</h3>
                <div className="space-y-4">
                  {preferredJockeys.map(jockey => (
                    <div key={jockey.id} className="p-4 bg-slate-900/50 rounded-xl border border-[#C9A227]/20">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                          {jockey.name.charAt(0)}
                        </div>
                        <div>
                          <h4 className="text-foreground font-medium">{jockey.name}</h4>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="bg-background p-2 rounded-lg">
                          <div className="text-slate-400 text-xs">Số Trận Cùng Nhau</div>
                          <div className="text-foreground font-medium">{jockey.racesTogether}</div>
                        </div>
                        <div className="bg-background p-2 rounded-lg">
                          <div className="text-slate-400 text-xs">Tỷ Lệ Thắng</div>
                          <div className="text-[#C9A227] font-medium">{jockey.winRate}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div> */}
            </div>
          </div>
        )}

        {/* Content: Schedule */}
        {activeTab === "schedule" && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-6">
              <h2 className="font-serif text-3xl font-bold text-foreground mb-2">Lịch Đua & Đăng Ký</h2>
              <p className="text-slate-400">Đăng ký ngựa vào cuộc đua và quản lý các đăng ký của bạn</p>
            </div>

            {/* Sub-tabs */}
            <div className="flex gap-2 mb-6 border-b border-border pb-0">
              {([
                { id: "registrations", label: "Đăng Ký Của Tôi", count: activeRegs.length },
                { id: "open", label: "Cuộc Đua Mở", count: openRaces.length },
              ] as const).map(t => (
                <button
                  key={t.id}
                  onClick={() => setScheduleSubTab(t.id)}
                  className={`flex items-center gap-2 px-5 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-all ${
                    scheduleSubTab === t.id
                      ? "border-[#C9A227] text-[#C9A227]"
                      : "border-transparent text-slate-400 hover:text-foreground"
                  }`}
                >
                  {t.label}
                  <span className={`px-1.5 py-0.5 rounded-full text-xs font-bold ${
                    scheduleSubTab === t.id ? "bg-[#C9A227]/20 text-[#C9A227]" : "bg-muted/40 text-slate-400"
                  }`}>{t.count}</span>
                </button>
              ))}
            </div>

            {loadingSchedule ? (
              <div className="flex justify-center py-16">
                <Loader2 className="w-8 h-8 text-[#C9A227] animate-spin" />
              </div>
            ) : (
              <>
                {/* ── Sub-tab: Đăng Ký Của Tôi ── */}
                {scheduleSubTab === "registrations" && (
                  activeRegs.length === 0 ? (
                    <div className="bg-muted/40 border border-border rounded-2xl p-8 text-center">
                      <Calendar className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                      <p className="text-slate-500">Bạn chưa đăng ký cuộc đua nào</p>
                    </div>
                  ) : (
                    <>
                    <div className="space-y-3">
                      {pagedRegs.map(reg => {
                        const race = reg.raceId as any;
                        const horse = reg.horseId as any;
                        const jockey = reg.jockeyId as any;
                        const preStatus = reg.preCheckResult?.status;
                        return (
                          <div key={reg._id} className="bg-card backdrop-blur-md border border-border rounded-2xl p-5 hover:border-[#C9A227]/20 transition-all">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-3 flex-wrap">
                                  <div className="w-9 h-9 bg-slate-800 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <Calendar className="w-4 h-4 text-[#C9A227]" />
                                  </div>
                                  <div>
                                    <h4 className="text-foreground font-bold">{race?.name}</h4>
                                    <div className="text-slate-400 text-xs">{race?.scheduledTime ? new Date(race.scheduledTime).toLocaleString("vi-VN") : ""}</div>
                                  </div>
                                  <Chip label={race?.grade} size="small" sx={{ height: "20px", fontSize: "0.65rem", bgcolor: "rgba(201,162,39,0.2)", color: "#8F7318", border: "1px solid #C9A227", fontWeight: "bold" }} />
                                  <Chip label={race?.status === "open" ? "Mở ĐK" : race?.status === "closed" ? "Đóng ĐK" : race?.status === "pre_check" ? "Kiểm tra" : race?.status} size="small" sx={{ height: "20px", fontSize: "0.65rem", bgcolor: "rgba(99,102,241,0.15)", color: "#a5b4fc", border: "1px solid #6366f1" }} />
                                  {preStatus && preStatus !== "pending" && (
                                    <Chip label={preStatus === "passed" ? "✓ Đã duyệt" : "✗ Bị loại"} size="small" sx={{ height: "20px", fontSize: "0.65rem", bgcolor: preStatus === "passed" ? "rgba(16,185,129,0.15)" : "rgba(180,35,24,0.15)", color: preStatus === "passed" ? "#34d399" : "#B42318", border: `1px solid ${preStatus === "passed" ? "#1F3D2B" : "#B42318"}` }} />
                                  )}
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                  <div>
                                    <div className="text-slate-500 text-xs mb-1">Ngựa</div>
                                    <div className="text-foreground font-medium flex items-center gap-1"><Sparkles className="w-3 h-3 text-[#C9A227]" />{horse?.name}</div>
                                  </div>
                                  <div>
                                    <div className="text-slate-500 text-xs mb-1">Kỵ Sĩ</div>
                                    <div className={`font-medium flex items-center gap-1 ${jockey ? "text-foreground" : "text-slate-500 italic"}`}>
                                      <Users className="w-3 h-3 text-blue-400" />
                                      {jockey ? jockey.fullName : "Chưa gán"}
                                    </div>
                                  </div>
                                  <div>
                                    <div className="text-slate-500 text-xs mb-1">Phí đã nộp</div>
                                    <div className="text-foreground font-medium">${reg.feePaid?.toLocaleString()}</div>
                                  </div>
                                  <div>
                                    <div className="text-slate-500 text-xs mb-1">Đăng ký lúc</div>
                                    <div className="text-slate-300 text-xs">{new Date(reg.registeredAt).toLocaleDateString("vi-VN")}</div>
                                  </div>
                                </div>
                              </div>
                              {race?.status === "open" && (
                                <Button variant="outlined" size="small" disabled={cancellingRegId === reg._id}
                                  onClick={() => handleCancelRegistration(reg._id)}
                                  sx={{ borderColor: "rgba(180,35,24,0.4)", color: "#B42318", textTransform: "none", whiteSpace: "nowrap", "&:hover": { borderColor: "#B42318", bgcolor: "rgba(180,35,24,0.1)" } }}>
                                  {cancellingRegId === reg._id ? <Loader2 className="w-4 h-4 animate-spin" /> : "Hủy (hoàn 40%)"}
                                </Button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <Pagination page={regPage} totalPages={regTotalPages} onPageChange={setRegPage} />
                    </>
                  )
                )}

                {/* ── Sub-tab: Cuộc Đua Mở ── */}
                {scheduleSubTab === "open" && (
                  openRaces.length === 0 ? (
                    <div className="bg-muted/40 border border-border rounded-2xl p-8 text-center">
                      <Trophy className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                      <p className="text-slate-500">Hiện không có cuộc đua nào đang mở đăng ký</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {openRaces.map(race => {
                        const alreadyRegistered = isHorseRegistered(race._id);
                        const cutoffPassed = new Date() > new Date(race.cutoffTime);
                        return (
                          <div key={race._id} className={`bg-card backdrop-blur-md border rounded-2xl p-6 transition-all ${alreadyRegistered ? "border-[#C9A227]/30" : "border-border hover:border-[#C9A227]/20"}`}>
                            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-4 flex-wrap">
                                  <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <Trophy className="w-5 h-5 text-emerald-400" />
                                  </div>
                                  <div>
                                    <h4 className="font-serif text-xl font-bold text-foreground">{race.name}</h4>
                                    <div className="text-slate-400 text-sm">{new Date(race.scheduledTime).toLocaleString("vi-VN")}</div>
                                  </div>
                                  <Chip label={race.grade} size="small" sx={{ height: "20px", fontSize: "0.65rem", bgcolor: "rgba(201,162,39,0.2)", color: "#8F7318", border: "1px solid #C9A227", fontWeight: "bold" }} />
                                  {alreadyRegistered && <Chip label="✓ Đã đăng ký" size="small" sx={{ height: "20px", fontSize: "0.65rem", bgcolor: "rgba(255,222,66,0.15)", color: "#C9A227", border: "1px solid #C9A227" }} />}
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-900/40 rounded-xl p-4 border border-border">
                                  <div>
                                    <div className="text-slate-500 text-xs uppercase mb-1 flex items-center gap-1"><Activity className="w-3 h-3" /> Cự Ly</div>
                                    <div className="text-foreground font-semibold">{race.distance}m</div>
                                  </div>
                                  <div>
                                    <div className="text-slate-500 text-xs uppercase mb-1 flex items-center gap-1"><Trophy className="w-3 h-3" /> Giải Thưởng</div>
                                    <div className="text-[#C9A227] font-semibold">{race.purse?.toLocaleString()} coin</div>
                                  </div>
                                  <div>
                                    <div className="text-slate-500 text-xs uppercase mb-1 flex items-center gap-1"><DollarSign className="w-3 h-3" /> Phí ĐK</div>
                                    <div className="text-foreground font-semibold">{race.registrationFee?.toLocaleString()} coin</div>
                                  </div>
                                  <div>
                                    <div className="text-slate-500 text-xs uppercase mb-1 flex items-center gap-1"><Clock className="w-3 h-3" /> Hạn ĐK</div>
                                    <div className={`font-semibold text-sm ${cutoffPassed ? "text-red-400" : "text-slate-300"}`}>
                                      {new Date(race.cutoffTime).toLocaleDateString("vi-VN")}
                                    </div>
                                  </div>
                                </div>
                                {/* Điều kiện tham gia */}
                                {race.eligibility && (
                                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                                    <span className="text-slate-500 uppercase tracking-wider">Điều kiện:</span>
                                    {(race.eligibility.allowedGrades ?? []).length > 0 && (
                                      <span className="text-slate-400">
                                        Hạng:{" "}
                                        {race.eligibility.allowedGrades.map(g => (
                                          <span key={g} className="mr-1 px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/25 font-bold">{g}</span>
                                        ))}
                                      </span>
                                    )}
                                    {race.eligibility.minPoints > 0 && (
                                      <span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20">
                                        Tối thiểu {race.eligibility.minPoints} điểm
                                      </span>
                                    )}
                                    {(race.eligibility.minAge > 0 || race.eligibility.maxAge > 0) && (
                                      <span className="px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20">
                                        Tuổi {race.eligibility.minAge}–{race.eligibility.maxAge} năm
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                              <div className="md:ml-4 flex-shrink-0">
                                {alreadyRegistered ? (
                                  <Button disabled variant="outlined" sx={{ borderColor: "rgba(255,222,66,0.3)", color: "#C9A227", textTransform: "none", opacity: 0.7, whiteSpace: "nowrap" }}>
                                    Đã đăng ký
                                  </Button>
                                ) : cutoffPassed ? (
                                  <Button disabled variant="outlined" sx={{ borderColor: "#E3DCCB", color: "rgba(35,32,26,0.35)", textTransform: "none", whiteSpace: "nowrap" }}>
                                    Hết hạn ĐK
                                  </Button>
                                ) : horses.length === 0 ? (
                                  <Button disabled variant="outlined" sx={{ borderColor: "#E3DCCB", color: "rgba(35,32,26,0.35)", textTransform: "none", whiteSpace: "nowrap" }}>
                                    Bạn chưa có ngựa
                                  </Button>
                                ) : (
                                  <Button variant="contained" onClick={() => handleOpenRegisterDialog(race)}
                                    sx={{ background: "#C9A227", color: "#23201A", textTransform: "none", fontWeight: 700, whiteSpace: "nowrap", "&:hover": { background: "#B08D1E" } }}>
                                    Đăng Ký Ngay
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )
                )}
              </>
            )}
          </div>
        )}

        {/* Content: Performance & Results */}
        {activeTab === "results" && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-serif text-3xl font-bold text-foreground">Thành Tích</h2>
              <span className="text-slate-500 text-sm">{resultsTotal} kết quả</span>
            </div>

            <div className="bg-card backdrop-blur-md border border-border rounded-2xl p-6">
              <h3 className="font-serif text-xl font-bold text-foreground mb-6">Lịch Sử Kết Quả</h3>

              {loadingResults ? (
                <div className="flex justify-center py-12"><Loader2 className="w-7 h-7 animate-spin text-[#C9A227]" /></div>
              ) : raceResults.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <Trophy className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p>Chưa có kết quả race nào</p>
                </div>
              ) : (
                <>
                  <div className="space-y-3">
                    {raceResults.map(r => {
                      const pos = r.position;
                      const posCls = pos === 1
                        ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
                        : pos === 2
                          ? "bg-slate-400/20 text-slate-300 border-slate-400/30"
                          : pos === 3
                            ? "bg-orange-700/20 text-orange-400 border-orange-700/30"
                            : "bg-card text-slate-400 border-border";
                      return (
                        <div key={r._id} className="flex items-center justify-between p-4 bg-slate-900/50 rounded-xl border border-border hover:border-border transition-all">
                          <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-base border ${posCls}`}>
                              #{pos}
                            </div>
                            <div>
                              <div className="text-foreground font-bold">{r.raceId?.name}</div>
                              <div className="text-xs text-slate-400 mt-0.5">
                                {new Date(r.raceId?.scheduledTime).toLocaleDateString("vi-VN")}
                                {" · "}
                                <span className="text-[#C9A227]">{r.horseId?.name}</span>
                                {r.jockeyId && <span className="text-slate-500"> · {r.jockeyId.fullName}</span>}
                              </div>
                              <div className="flex gap-2 mt-1">
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">{r.raceId?.grade}</span>
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-700/50 text-slate-400">{r.raceId?.distance}m</span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="text-[#C9A227] font-bold">{r.prizeAmount > 0 ? `+${r.prizeAmount.toLocaleString()} coin` : "—"}</div>
                            <div className="text-blue-400 text-sm">+{r.pointsEarned} pts</div>
                            <div className="text-xs text-slate-500 mt-0.5">{(r.finishTime / 1000).toFixed(2)}s</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <Pagination page={resultsPage} totalPages={resultsTotalPages} onPageChange={setResultsPage} />
                </>
              )}
            </div>
          </div>
        )}

        {/* Content: Wallet */}
        {activeTab === "wallet" && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="font-serif text-3xl font-bold text-foreground mb-6">
              Ví & Giao Dịch
            </h2>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="md:col-span-1 space-y-6">
                <div className="bg-gradient-to-br from-[#C9A227] to-[#8F7318] rounded-3xl p-8 relative overflow-hidden shadow-2xl shadow-[#C9A227]/50">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-card rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl"></div>

                  <div className="relative z-10">
                    <div className="text-foreground font-medium mb-2">
                      Tổng Số Dư
                    </div>
                    <div className="font-serif text-4xl font-bold text-foreground mb-8">
                      {walletBalance !== null ? walletBalance.toLocaleString("vi-VN") : "—"} coin
                    </div>

                    <div className="flex gap-3">
                      <Button
                        variant="contained"
                        onClick={() => setTopupOpen(true)}
                        startIcon={<Plus />}
                        sx={{
                          background: "white",
                          color: "#23201A",
                          fontWeight: 600,
                          textTransform: "none",
                          "&:hover": { background: "#f8fafc" },
                        }}
                      >
                        Nạp Tiền
                      </Button>
                      <Button
                        variant="outlined"
                        sx={{
                          borderColor: "#C9C2B0",
                          color: "#23201A",
                          fontWeight: 600,
                          textTransform: "none",
                          "&:hover": {
                            borderColor: "#1F3D2B",
                            background: "rgba(35,32,26,0.06)",
                          },
                        }}
                      >
                        Rút Tiền
                      </Button>
                    </div>
                  </div>
                </div>

                {/* <div className="bg-card backdrop-blur-md border border-border rounded-2xl p-6">
                  <h3 className="font-serif text-lg font-bold text-foreground mb-4">Thống Kê Nhanh</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center pb-4 border-b border-border">
                      <span className="text-slate-400">Tổng Đã Nạp</span>
                      <span className="text-foreground font-medium">$50,000</span>
                    </div>
                    <div className="flex justify-between items-center pb-4 border-b border-border">
                      <span className="text-slate-400">Tổng Thắng</span>
                      <span className="text-[#C9A227] font-medium">$45,000</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Tổng Chi Phí</span>
                      <span className="text-red-400 font-medium">$49,200</span>
                    </div>
                  </div>
                </div> */}
              </div>

              <div className="md:col-span-2 bg-card backdrop-blur-md border border-border rounded-2xl p-6">
                <h3 className="font-serif text-xl font-bold text-foreground mb-6">Lịch Sử Giao Dịch</h3>

                {loadingTx ? (
                  <div className="flex justify-center py-12"><Loader2 className="w-7 h-7 animate-spin text-[#C9A227]" /></div>
                ) : txList.length === 0 ? (
                  <div className="text-center py-12 text-slate-500">
                    <DollarSign className="w-10 h-10 mx-auto mb-3 opacity-20" />
                    <p>Chưa có giao dịch nào</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-3">
                      {txList.map((tx) => {
                        const isCredit = tx.amount > 0;
                        const typeLabel: Record<string, string> = {
                          topup: 'Nạp Tiền', registration_fee: 'Phí Đăng Ký',
                          registration_refund: 'Hoàn Phí ĐK', prize_payout: 'Tiền Thưởng',
                          bet_placed: 'Đặt Cược', bet_payout: 'Thắng Cược', bet_refund: 'Hoàn Cược',
                        };
                        return (
                          <div key={tx._id} className="flex items-center justify-between p-4 bg-slate-900/50 rounded-xl border border-border hover:bg-slate-800/50 transition-colors">
                            <div className="flex items-center gap-4">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isCredit ? "bg-[#C9A227]/20 text-[#C9A227]" : "bg-red-500/20 text-red-400"}`}>
                                {isCredit ? <ArrowDownRight className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                              </div>
                              <div>
                                <div className="text-foreground font-medium">{typeLabel[tx.type] ?? tx.type}</div>
                                <div className="text-xs text-slate-400">{tx.description} · {new Date(tx.createdAt).toLocaleDateString("vi-VN")}</div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className={`font-bold ${isCredit ? "text-[#C9A227]" : "text-red-400"}`}>
                                {isCredit ? "+" : ""}{tx.amount.toLocaleString()} coin
                              </div>
                              <div className="text-xs text-slate-500">Số dư: {tx.balanceAfter.toLocaleString()}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <Pagination page={txPage} totalPages={txTotalPages} onPageChange={setTxPage} />
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add Horse Dialog */}
      <Dialog
        open={addHorseOpen}
        onClose={() => setAddHorseOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          style: {
            backgroundColor: "#FFFFFF",
            border: "1px solid #E3DCCB",
            borderRadius: "16px",
          },
        }}
      >
        <DialogTitle
          sx={{
            color: "#23201A",
            borderBottom: "1px solid #E3DCCB",
            pb: 2,
          }}
        >
          Đăng Ký Ngựa Mới
        </DialogTitle>
        <DialogContent sx={{ paddingTop: "24px !important" }}>
          <div className="space-y-4">
            {/* Image upload */}
            <div className="flex gap-4 mb-6 overflow-x-auto pb-2">
              {horseImagePreviews.map((preview, idx) => (
                <div key={idx} className="relative w-32 h-32 flex-shrink-0 rounded-xl overflow-hidden border border-border group bg-slate-800">
                  <img src={preview} alt={`preview ${idx}`} className="w-full h-full object-cover" />
                  <button
                    onClick={() => {
                      setHorseImagePreviews(prev => prev.filter((_, i) => i !== idx));
                      setHorseImageFiles(prev => prev.filter((_, i) => i !== idx));
                    }}
                    className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-red-500 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <div
                onClick={() => horseImageInputRef.current?.click()}
                className="w-32 h-32 flex-shrink-0 rounded-xl border-2 border-dashed border-slate-600 flex flex-col items-center justify-center text-slate-400 hover:text-foreground hover:border-[#C9A227] cursor-pointer transition-colors"
              >
                <ImageIcon className="w-8 h-8 mb-2" />
                <span className="text-sm font-medium text-center">Tải Ảnh Lên</span>
              </div>
              <input
                ref={horseImageInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleHorseImageSelect}
                style={{ display: "none" }}
              />
            </div>

            <TextField
              fullWidth
              label="Tên Ngựa *"
              value={horseForm.name}
              onChange={(e) => setHorseForm((p) => ({ ...p, name: e.target.value }))}
              sx={{
                "& .MuiInputLabel-root": { color: "#7A7468" },
                "& .MuiOutlinedInput-root": {
                  color: "#23201A",
                  "& fieldset": { borderColor: "#E3DCCB" },
                  "&:hover fieldset": { borderColor: "#C9C2B0" },
                  "&.Mui-focused fieldset": { borderColor: "#C9A227" },
                },
              }}
            />

            <div className="grid grid-cols-2 gap-4">
              <TextField
                fullWidth
                label="Giống"
                value={horseForm.breed}
                onChange={(e) => setHorseForm((p) => ({ ...p, breed: e.target.value }))}
                sx={{
                  "& .MuiInputLabel-root": { color: "#7A7468" },
                  "& .MuiOutlinedInput-root": {
                    color: "#23201A",
                    "& fieldset": { borderColor: "#E3DCCB" },
                    "&:hover fieldset": { borderColor: "#C9C2B0" },
                    "&.Mui-focused fieldset": { borderColor: "#C9A227" },
                  },
                }}
              />
              <TextField
                fullWidth
                label="Màu Sắc"
                value={horseForm.color}
                onChange={(e) => setHorseForm((p) => ({ ...p, color: e.target.value }))}
                sx={{
                  "& .MuiInputLabel-root": { color: "#7A7468" },
                  "& .MuiOutlinedInput-root": {
                    color: "#23201A",
                    "& fieldset": { borderColor: "#E3DCCB" },
                    "&:hover fieldset": { borderColor: "#C9C2B0" },
                    "&.Mui-focused fieldset": { borderColor: "#C9A227" },
                  },
                }}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <TextField
                fullWidth
                label="Ngày Sinh *"
                type="date"
                value={horseForm.birthDate}
                onChange={(e) => setHorseForm((p) => ({ ...p, birthDate: e.target.value }))}
                InputLabelProps={{ shrink: true }}
                sx={{
                  "& .MuiInputLabel-root": { color: "#7A7468" },
                  "& .MuiOutlinedInput-root": {
                    color: "#23201A",
                    "& fieldset": { borderColor: "#E3DCCB" },
                    "&:hover fieldset": { borderColor: "#C9C2B0" },
                    "&.Mui-focused fieldset": { borderColor: "#C9A227" },
                  },
                }}
              />
              <TextField
                fullWidth
                label="Cân Nặng (kg) *"
                type="number"
                value={horseForm.weight}
                onChange={(e) => setHorseForm((p) => ({ ...p, weight: e.target.value }))}
                sx={{
                  "& .MuiInputLabel-root": { color: "#7A7468" },
                  "& .MuiOutlinedInput-root": {
                    color: "#23201A",
                    "& fieldset": { borderColor: "#E3DCCB" },
                    "&:hover fieldset": { borderColor: "#C9C2B0" },
                    "&.Mui-focused fieldset": { borderColor: "#C9A227" },
                  },
                }}
              />
            </div>

            <FormControl
              fullWidth
              sx={{
                "& .MuiInputLabel-root": { color: "#7A7468" },
                "& .MuiOutlinedInput-root": {
                  color: "#23201A",
                  "& fieldset": { borderColor: "#E3DCCB" },
                  "&:hover fieldset": { borderColor: "#C9C2B0" },
                  "&.Mui-focused fieldset": { borderColor: "#C9A227" },
                  "& .MuiSelect-icon": { color: "#7A7468" },
                },
              }}
            >
              <InputLabel>Giới Tính *</InputLabel>
              <Select
                label="Giới Tính *"
                value={horseForm.gender}
                onChange={(e) => setHorseForm((p) => ({ ...p, gender: e.target.value as "male" | "female" }))}
              >
                <MenuItem value="male">Đực</MenuItem>
                <MenuItem value="female">Cái</MenuItem>
              </Select>
            </FormControl>

            <div className="grid grid-cols-2 gap-4">
              <FormControl
                fullWidth
                sx={{
                  "& .MuiInputLabel-root": { color: "#7A7468" },
                  "& .MuiOutlinedInput-root": {
                    color: "#23201A",
                    "& fieldset": { borderColor: "#E3DCCB" },
                    "&:hover fieldset": { borderColor: "#C9C2B0" },
                    "&.Mui-focused fieldset": { borderColor: "#C9A227" },
                    "& .MuiSelect-icon": { color: "#7A7468" },
                  },
                }}
              >
                <InputLabel>Sân Ưa Thích</InputLabel>
                <Select
                  label="Sân Ưa Thích"
                  value={horseForm.preferredTrackCondition}
                  onChange={(e) => setHorseForm((p) => ({ ...p, preferredTrackCondition: e.target.value as "" | "dry" | "wet" | "muddy" }))}
                >
                  <MenuItem value="">Không rõ</MenuItem>
                  <MenuItem value="dry">Khô (Dry)</MenuItem>
                  <MenuItem value="wet">Ướt (Wet)</MenuItem>
                  <MenuItem value="muddy">Lầy (Muddy)</MenuItem>
                </Select>
              </FormControl>

              <FormControl
                fullWidth
                sx={{
                  "& .MuiInputLabel-root": { color: "#7A7468" },
                  "& .MuiOutlinedInput-root": {
                    color: "#23201A",
                    "& fieldset": { borderColor: "#E3DCCB" },
                    "&:hover fieldset": { borderColor: "#C9C2B0" },
                    "&.Mui-focused fieldset": { borderColor: "#C9A227" },
                    "& .MuiSelect-icon": { color: "#7A7468" },
                  },
                }}
              >
                <InputLabel>Khí Chất</InputLabel>
                <Select
                  label="Khí Chất"
                  value={horseForm.temperament}
                  onChange={(e) => setHorseForm((p) => ({ ...p, temperament: e.target.value as "aggressive" | "balanced" | "conservative" }))}
                >
                  <MenuItem value="aggressive">Hung hăng</MenuItem>
                  <MenuItem value="balanced">Cân bằng</MenuItem>
                  <MenuItem value="conservative">Bảo thủ</MenuItem>
                </Select>
              </FormControl>
            </div>

          </div>
        </DialogContent>
        <DialogActions
          sx={{
            borderTop: "1px solid #E3DCCB",
            padding: "16px 24px",
          }}
        >
          <Button
            onClick={() => {
              setAddHorseOpen(false);
              setHorseForm({ name: "", breed: "", gender: "male", birthDate: "", weight: "", color: "", preferredTrackCondition: "", temperament: "balanced" });
              setHorseImageFiles([]);
              setHorseImagePreviews([]);
            }}
            sx={{ color: "#7A7468", textTransform: "none" }}
          >
            Hủy
          </Button>
          <Button
            variant="contained"
            onClick={handleCreateHorse}
            disabled={creatingHorse}
            sx={{
              background: "#C9A227",
              textTransform: "none",
              "&:hover": { background: "#B08D1E" },
              "&.Mui-disabled": { background: "rgba(255,222,66,0.4)" },
            }}
          >
            {creatingHorse ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            {creatingHorse ? "Đang lưu..." : "Đăng Ký"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Horse Dialog */}
      <Dialog
        open={editHorseOpen}
        onClose={() => setEditHorseOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          style: {
            backgroundColor: "#FFFFFF",
            border: "1px solid #E3DCCB",
            borderRadius: "16px",
          },
        }}
      >
        <DialogTitle
          sx={{
            color: "#23201A",
            borderBottom: "1px solid #E3DCCB",
            pb: 2,
          }}
        >
          Chỉnh Sửa Thông Tin Ngựa
        </DialogTitle>
        <DialogContent sx={{ paddingTop: "24px !important" }}>
          <div className="space-y-4">
            <div className="flex gap-4 mb-6 overflow-x-auto pb-2">
              {editHorseImagePreviews.map((preview, idx) => (
                <div key={idx} className="relative w-32 h-32 flex-shrink-0 rounded-xl overflow-hidden border border-border group bg-slate-800">
                  <img src={preview} alt={`preview ${idx}`} className="w-full h-full object-cover" />
                  <button
                    onClick={() => {
                      setEditHorseImagePreviews(prev => prev.filter((_, i) => i !== idx));
                      setEditHorseImageFiles(prev => prev.filter((_, i) => i !== idx));
                    }}
                    className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-red-500 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <div
                onClick={() => editHorseImageInputRef.current?.click()}
                className="w-32 h-32 flex-shrink-0 rounded-xl border-2 border-dashed border-slate-600 flex flex-col items-center justify-center text-slate-400 hover:text-foreground hover:border-[#C9A227] cursor-pointer transition-colors"
              >
                <ImageIcon className="w-8 h-8 mb-2" />
                <span className="text-sm font-medium text-center">Thêm Ảnh</span>
              </div>
              <input
                ref={editHorseImageInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleEditHorseImageSelect}
                style={{ display: "none" }}
              />
            </div>

            <TextField
              fullWidth
              label="Tên Ngựa *"
              value={editHorseForm.name}
              onChange={(e) => setEditHorseForm((p) => ({ ...p, name: e.target.value }))}
              sx={{
                "& .MuiInputLabel-root": { color: "#7A7468" },
                "& .MuiOutlinedInput-root": {
                  color: "#23201A",
                  "& fieldset": { borderColor: "#E3DCCB" },
                  "&:hover fieldset": { borderColor: "#C9C2B0" },
                  "&.Mui-focused fieldset": { borderColor: "#C9A227" },
                },
              }}
            />

            <div className="grid grid-cols-2 gap-4">
              <TextField
                fullWidth
                label="Giống"
                value={editHorseForm.breed}
                onChange={(e) => setEditHorseForm((p) => ({ ...p, breed: e.target.value }))}
                sx={{
                  "& .MuiInputLabel-root": { color: "#7A7468" },
                  "& .MuiOutlinedInput-root": {
                    color: "#23201A",
                    "& fieldset": { borderColor: "#E3DCCB" },
                    "&:hover fieldset": { borderColor: "#C9C2B0" },
                    "&.Mui-focused fieldset": { borderColor: "#C9A227" },
                  },
                }}
              />
              <TextField
                fullWidth
                label="Màu Sắc"
                value={editHorseForm.color}
                onChange={(e) => setEditHorseForm((p) => ({ ...p, color: e.target.value }))}
                sx={{
                  "& .MuiInputLabel-root": { color: "#7A7468" },
                  "& .MuiOutlinedInput-root": {
                    color: "#23201A",
                    "& fieldset": { borderColor: "#E3DCCB" },
                    "&:hover fieldset": { borderColor: "#C9C2B0" },
                    "&.Mui-focused fieldset": { borderColor: "#C9A227" },
                  },
                }}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <TextField
                fullWidth
                label="Ngày Sinh *"
                type="date"
                value={editHorseForm.birthDate}
                onChange={(e) => setEditHorseForm((p) => ({ ...p, birthDate: e.target.value }))}
                InputLabelProps={{ shrink: true }}
                sx={{
                  "& .MuiInputLabel-root": { color: "#7A7468" },
                  "& .MuiOutlinedInput-root": {
                    color: "#23201A",
                    "& fieldset": { borderColor: "#E3DCCB" },
                    "&:hover fieldset": { borderColor: "#C9C2B0" },
                    "&.Mui-focused fieldset": { borderColor: "#C9A227" },
                  },
                }}
              />
              <TextField
                fullWidth
                label="Cân Nặng (kg) *"
                type="number"
                value={editHorseForm.weight}
                onChange={(e) => setEditHorseForm((p) => ({ ...p, weight: e.target.value }))}
                sx={{
                  "& .MuiInputLabel-root": { color: "#7A7468" },
                  "& .MuiOutlinedInput-root": {
                    color: "#23201A",
                    "& fieldset": { borderColor: "#E3DCCB" },
                    "&:hover fieldset": { borderColor: "#C9C2B0" },
                    "&.Mui-focused fieldset": { borderColor: "#C9A227" },
                  },
                }}
              />
            </div>

            <FormControl
              fullWidth
              sx={{
                "& .MuiInputLabel-root": { color: "#7A7468" },
                "& .MuiOutlinedInput-root": {
                  color: "#23201A",
                  "& fieldset": { borderColor: "#E3DCCB" },
                  "&:hover fieldset": { borderColor: "#C9C2B0" },
                  "&.Mui-focused fieldset": { borderColor: "#C9A227" },
                  "& .MuiSelect-icon": { color: "#7A7468" },
                },
              }}
            >
              <InputLabel>Giới Tính *</InputLabel>
              <Select
                label="Giới Tính *"
                value={editHorseForm.gender}
                onChange={(e) => setEditHorseForm((p) => ({ ...p, gender: e.target.value as "male" | "female" }))}
              >
                <MenuItem value="male">Đực</MenuItem>
                <MenuItem value="female">Cái</MenuItem>
              </Select>
            </FormControl>

            <div className="grid grid-cols-2 gap-4">
              <FormControl
                fullWidth
                sx={{
                  "& .MuiInputLabel-root": { color: "#7A7468" },
                  "& .MuiOutlinedInput-root": {
                    color: "#23201A",
                    "& fieldset": { borderColor: "#E3DCCB" },
                    "&:hover fieldset": { borderColor: "#C9C2B0" },
                    "&.Mui-focused fieldset": { borderColor: "#C9A227" },
                    "& .MuiSelect-icon": { color: "#7A7468" },
                  },
                }}
              >
                <InputLabel>Sân Ưa Thích</InputLabel>
                <Select
                  label="Sân Ưa Thích"
                  value={editHorseForm.preferredTrackCondition}
                  onChange={(e) => setEditHorseForm((p) => ({ ...p, preferredTrackCondition: e.target.value as "" | "dry" | "wet" | "muddy" }))}
                >
                  <MenuItem value="">Không rõ</MenuItem>
                  <MenuItem value="dry">Khô (Dry)</MenuItem>
                  <MenuItem value="wet">Ướt (Wet)</MenuItem>
                  <MenuItem value="muddy">Lầy (Muddy)</MenuItem>
                </Select>
              </FormControl>

              <FormControl
                fullWidth
                sx={{
                  "& .MuiInputLabel-root": { color: "#7A7468" },
                  "& .MuiOutlinedInput-root": {
                    color: "#23201A",
                    "& fieldset": { borderColor: "#E3DCCB" },
                    "&:hover fieldset": { borderColor: "#C9C2B0" },
                    "&.Mui-focused fieldset": { borderColor: "#C9A227" },
                    "& .MuiSelect-icon": { color: "#7A7468" },
                  },
                }}
              >
                <InputLabel>Khí Chất</InputLabel>
                <Select
                  label="Khí Chất"
                  value={editHorseForm.temperament}
                  onChange={(e) => setEditHorseForm((p) => ({ ...p, temperament: e.target.value as "aggressive" | "balanced" | "conservative" }))}
                >
                  <MenuItem value="aggressive">Hung hăng</MenuItem>
                  <MenuItem value="balanced">Cân bằng</MenuItem>
                  <MenuItem value="conservative">Bảo thủ</MenuItem>
                </Select>
              </FormControl>
            </div>

          </div>
        </DialogContent>
        <DialogActions
          sx={{
            borderTop: "1px solid #E3DCCB",
            padding: "16px 24px",
          }}
        >
          <Button
            onClick={() => setEditHorseOpen(false)}
            sx={{ color: "#7A7468", textTransform: "none" }}
          >
            Hủy
          </Button>
          <Button
            variant="contained"
            onClick={handleUpdateHorse}
            disabled={updatingHorse}
            sx={{
              background: "#C9A227",
              textTransform: "none",
              "&:hover": { background: "#B08D1E" },
              "&.Mui-disabled": { background: "rgba(255,222,66,0.4)" },
            }}
          >
            {updatingHorse ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            {updatingHorse ? "Đang lưu..." : "Cập Nhật"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Horse Dialog */}
      <Dialog
        open={viewHorseOpen}
        onClose={() => setViewHorseOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          style: {
            backgroundColor: "#FFFFFF",
            border: "1px solid #E3DCCB",
            borderRadius: "16px",
          },
        }}
      >
        <DialogTitle
          sx={{
            color: "#23201A",
            borderBottom: "1px solid #E3DCCB",
            pb: 2,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}
        >
          Thông Tin Chi Tiết Ngựa
          <button onClick={() => setViewHorseOpen(false)} className="text-slate-400 hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </DialogTitle>
        <DialogContent sx={{ paddingTop: "24px !important" }}>
          {viewingHorse && (
            <div className="space-y-6">
              <div className="flex flex-col items-center">
                <div className="w-full max-w-sm aspect-[4/3] rounded-xl border-2 border-slate-700 overflow-hidden mb-4 bg-slate-900 flex items-center justify-center relative shadow-lg">
                  {viewHorseActiveImage ? (
                    <>
                      {/* Blurred Background Layer */}
                      <div 
                        className="absolute inset-0 opacity-40 blur-xl scale-110" 
                        style={{ 
                          backgroundImage: `url(${viewHorseActiveImage})`, 
                          backgroundSize: 'cover', 
                          backgroundPosition: 'center' 
                        }}
                      />
                      {/* Main Image */}
                      <img src={viewHorseActiveImage} alt={viewingHorse.name} className="relative z-10 w-full h-full object-contain drop-shadow-2xl" />
                    </>
                  ) : (
                    <ImageIcon className="relative z-10 w-16 h-16 text-slate-600" />
                  )}
                </div>
                
                {(() => {
                  const images = viewingHorse.imageUrls?.length 
                    ? viewingHorse.imageUrls 
                    : (viewingHorse.primaryImageUrl ? [viewingHorse.primaryImageUrl] : []);
                  
                  if (images.length <= 1) return null;

                  return (
                    <div className="flex gap-3 mb-6 overflow-x-auto max-w-full pb-2 scrollbar-thin scrollbar-thumb-black/10 justify-center">
                      {images.map((imgUrl, idx) => (
                        <button
                          key={idx}
                          onClick={() => setViewHorseActiveImage(imgUrl)}
                          className={`w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all ${
                            viewHorseActiveImage === imgUrl ? "border-[#C9A227] opacity-100 scale-105" : "border-transparent opacity-50 hover:opacity-100 hover:scale-105"
                          }`}
                        >
                          <img src={imgUrl} alt="thumbnail" className="w-full h-full object-cover bg-slate-800" />
                        </button>
                      ))}
                    </div>
                  );
                })()}

                <h3 className="font-serif text-2xl font-bold text-foreground text-center">{viewingHorse.name}</h3>
                <div className="flex items-center gap-2 mt-2">
                  <Chip
                    label={viewingHorse.isActive ? "Hoạt Động" : "Không Hoạt Động"}
                    size="small"
                    sx={{
                      backgroundColor: viewingHorse.isActive ? "#1F3D2B" : "#7A7468",
                      color: "#23201A",
                      fontWeight: 500,
                    }}
                  />
                  <Chip
                    label={viewingHorse.currentGrade}
                    size="small"
                    sx={{
                      backgroundColor: GRADE_COLORS[viewingHorse.currentGrade] ?? "#C9A227",
                      color: "#23201A",
                      fontWeight: 600,
                    }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                  <h4 className="text-sm font-semibold text-slate-400 mb-3 uppercase tracking-wider">Thể Chất</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex justify-between"><span className="text-slate-500">Giới tính:</span> <span className="text-foreground font-medium">{viewingHorse.gender === "male" ? "Đực" : "Cái"}</span></li>
                    <li className="flex justify-between"><span className="text-slate-500">Giống:</span> <span className="text-foreground font-medium">{viewingHorse.breed || "Chưa rõ"}</span></li>
                    <li className="flex justify-between"><span className="text-slate-500">Màu sắc:</span> <span className="text-foreground font-medium">{viewingHorse.color || "Chưa rõ"}</span></li>
                    <li className="flex justify-between"><span className="text-slate-500">Cân nặng:</span> <span className="text-foreground font-medium">{viewingHorse.weight} kg</span></li>
                    <li className="flex justify-between"><span className="text-slate-500">Ngày sinh:</span> <span className="text-foreground font-medium">{new Date(viewingHorse.birthDate).toLocaleDateString("vi-VN")}</span></li>
                  </ul>
                </div>
                
                <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                  <h4 className="text-sm font-semibold text-slate-400 mb-3 uppercase tracking-wider">Sự Nghiệp</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex justify-between"><span className="text-slate-500">Tổng số trận:</span> <span className="text-foreground font-medium">{viewingHorse.raceCount} trận</span></li>
                    <li className="flex justify-between"><span className="text-slate-500">Số trận thắng:</span> <span className="text-[#C9A227] font-bold">{viewingHorse.winCount} trận</span></li>
                    <li className="flex justify-between"><span className="text-slate-500">Tỷ lệ thắng:</span> <span className="text-foreground font-medium">{viewingHorse.raceCount > 0 ? Math.round((viewingHorse.winCount / viewingHorse.raceCount) * 100) : 0}%</span></li>
                    <li className="flex justify-between"><span className="text-slate-500">Tổng điểm:</span> <span className="text-emerald-400 font-bold">{viewingHorse.totalPoints} pts</span></li>
                    <li className="flex justify-between"><span className="text-slate-500">Tiền thưởng:</span> <span className="text-[#1F3D2B] font-bold">${viewingHorse.totalEarnings.toLocaleString()}</span></li>
                  </ul>
                </div>
              </div>

              {viewingHorse.violations && viewingHorse.violations.length > 0 && (
                <div className="bg-red-950/30 p-4 rounded-xl border border-red-900/50">
                  <h4 className="text-sm font-semibold text-red-400 mb-3 uppercase tracking-wider flex items-center"><AlertTriangle className="w-4 h-4 mr-2" /> Lịch Sử Vi Phạm</h4>
                  <div className="space-y-3">
                    {viewingHorse.violations.map((v, i) => (
                      <div key={i} className="text-sm border-l-2 border-red-500/50 pl-3">
                        <div className="text-foreground font-medium">{v.name}</div>
                        <div className="text-slate-400 text-xs mt-1">Xử lý: {v.handling} • Phạt: {new Date(v.penaltyDate).toLocaleDateString("vi-VN")}</div>
                        {v.note && <div className="text-slate-500 text-xs italic mt-1">Ghi chú: {v.note}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Topup Dialog */}
      <Dialog
        open={topupOpen}
        onClose={() => setTopupOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          style: {
            backgroundColor: "#FFFFFF",
            border: "1px solid #E3DCCB",
            borderRadius: "16px",
          },
        }}
      >
        <DialogTitle
          sx={{
            color: "#23201A",
            borderBottom: "1px solid #E3DCCB",
            pb: 2,
          }}
        >
          Nạp Tiền Vào Ví
        </DialogTitle>
        <DialogContent sx={{ paddingTop: "24px !important" }}>
          <TextField
            fullWidth
            label="Số Tiền ($)"
            type="number"
            sx={{
              "& .MuiInputLabel-root": { color: "#7A7468" },
              "& .MuiOutlinedInput-root": {
                color: "#23201A",
                "& fieldset": { borderColor: "#E3DCCB" },
                "&:hover fieldset": { borderColor: "#C9C2B0" },
                "&.Mui-focused fieldset": { borderColor: "#1F3D2B" },
              },
            }}
          />
        </DialogContent>
        <DialogActions
          sx={{
            borderTop: "1px solid #E3DCCB",
            padding: "16px 24px",
          }}
        >
          <Button
            onClick={() => setTopupOpen(false)}
            sx={{ color: "#7A7468", textTransform: "none" }}
          >
            Hủy
          </Button>
          <Button
            variant="contained"
            onClick={() => setTopupOpen(false)}
            sx={{
              background: "#1F3D2B",
              textTransform: "none",
              "&:hover": { background: "#172D20" },
            }}
          >
            Xác Nhận Nạp Tiền
          </Button>
        </DialogActions>
      </Dialog>

      {/* Jockey Profile Dialog */}
      <Dialog
        open={viewJockeyOpen}
        onClose={() => setViewJockeyOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          style: {
            backgroundColor: "#FFFFFF",
            border: "1px solid #E3DCCB",
            borderRadius: "16px",
            overflow: "hidden",
          },
        }}
      >
        {viewingJockey && (() => {
          const wc = viewingJockey.jockeyProfile?.winCount ?? 0;
          const rc = viewingJockey.jockeyProfile?.raceCount ?? 0;
          const wr = rc > 0 ? `${Math.round((wc / rc) * 100)}%` : "N/A";
          const exp = viewingJockey.jockeyProfile?.experienceYears ?? 0;
          const weight = viewingJockey.jockeyProfile?.weight;
          const height = viewingJockey.jockeyProfile?.height;
          const bio = viewingJockey.jockeyProfile?.bio;
          return (
            <>
              {/* Header gradient */}
              <div className="relative bg-gradient-to-br from-indigo-900/80 to-purple-900/80 px-6 pt-8 pb-16">
                <button
                  onClick={() => setViewJockeyOpen(false)}
                  className="absolute top-4 right-4 text-slate-400 hover:text-foreground transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="flex flex-col items-center text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center font-serif text-3xl font-bold text-white overflow-hidden mb-3 ring-4 ring-white/10">
                    {viewingJockey.avatarUrl ? (
                      <img src={viewingJockey.avatarUrl} alt={viewingJockey.fullName} className="w-full h-full object-cover" />
                    ) : (
                      viewingJockey.fullName.charAt(0)
                    )}
                  </div>
                  <h2 className="font-serif text-xl font-bold text-foreground">{viewingJockey.fullName}</h2>
                  <Chip
                    label={viewingJockey.isActive ? "Sẵn Sàng" : "Không Hoạt Động"}
                    size="small"
                    sx={{
                      mt: 1,
                      backgroundColor: viewingJockey.isActive ? "rgba(255,222,66,0.2)" : "rgba(100,116,139,0.2)",
                      color: viewingJockey.isActive ? "#C9A227" : "#7A7468",
                      border: `1px solid ${viewingJockey.isActive ? "#C9A227" : "#475569"}`,
                    }}
                  />
                </div>
              </div>

              {/* Stats cards — overlap header */}
              <div className="px-6 -mt-8">
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "Số trận", value: rc },
                    { label: "Số thắng", value: wc },
                    { label: "Tỷ lệ thắng", value: wr },
                  ].map((stat) => (
                    <div
                      key={stat.label}
                      className="bg-slate-800/90 backdrop-blur rounded-xl p-3 text-center border border-border"
                    >
                      <div className="text-[#C9A227] text-lg font-bold">{stat.value}</div>
                      <div className="text-slate-400 text-xs mt-0.5">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Details */}
              <DialogContent sx={{ px: 3, pt: 3, pb: 0 }}>
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-slate-900/60 rounded-xl p-3 border border-border">
                      <div className="text-slate-400 text-xs mb-1">Kinh nghiệm</div>
                      <div className="text-foreground font-semibold">{exp} năm</div>
                    </div>
                    <div className="bg-slate-900/60 rounded-xl p-3 border border-border">
                      <div className="text-slate-400 text-xs mb-1">Cân nặng</div>
                      <div className="text-foreground font-semibold">{weight ? `${weight} kg` : "—"}</div>
                    </div>
                    <div className="bg-slate-900/60 rounded-xl p-3 border border-border">
                      <div className="text-slate-400 text-xs mb-1">Chiều cao</div>
                      <div className="text-foreground font-semibold">{height ? `${height} cm` : "—"}</div>
                    </div>
                  </div>
                  {bio && (
                    <div className="bg-slate-900/60 rounded-xl p-4 border border-border">
                      <div className="text-slate-400 text-xs mb-2">Giới thiệu</div>
                      <p className="text-slate-300 text-sm leading-relaxed">{bio}</p>
                    </div>
                  )}
                </div>
              </DialogContent>

              <DialogActions sx={{ px: 3, py: 2.5, borderTop: "1px solid #E3DCCB", mt: 3 }}>
                <Button
                  onClick={() => setViewJockeyOpen(false)}
                  sx={{ color: "#7A7468", textTransform: "none" }}
                >
                  Đóng
                </Button>
                <Button
                  variant="contained"
                  disabled={!viewingJockey.isActive}
                  onClick={() => { setViewJockeyOpen(false); setInvitingJockey(viewingJockey); setInviteJockeyOpen(true); }}
                  sx={{
                    background: viewingJockey.isActive ? "#C9A227" : "#EDE7D8",
                    color: viewingJockey.isActive ? "#23201A" : "#7A7468",
                    textTransform: "none",
                    fontWeight: 600,
                    "&:hover": { background: "#B08D1E" },
                  }}
                >
                  Thuê kỵ sĩ này
                </Button>
              </DialogActions>
            </>
          );
        })()}
      </Dialog>

      {/* Invite Jockey Dialog */}
      <Dialog
        open={inviteJockeyOpen}
        onClose={() => !submittingInvite && setInviteJockeyOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          style: {
            backgroundColor: "#FFFFFF",
            border: "1px solid #E3DCCB",
            borderRadius: "16px",
          },
        }}
      >
        {/* Jockey being invited — header info */}
        {invitingJockey && (
          <div className="flex items-center gap-3 px-6 pt-5 pb-4 border-b border-border">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm overflow-hidden shrink-0">
              {invitingJockey.avatarUrl
                ? <img src={invitingJockey.avatarUrl} alt={invitingJockey.fullName} className="w-full h-full object-cover" />
                : invitingJockey.fullName.charAt(0)}
            </div>
            <div>
              <p className="text-xs text-slate-400">Gửi lời mời đến</p>
              <p className="text-foreground font-semibold leading-tight">{invitingJockey.fullName}</p>
            </div>
          </div>
        )}

        <DialogContent sx={{ pt: "20px !important", pb: 1 }}>
          {(() => {
            const darkSelect = {
              "& .MuiInputLabel-root": { color: "#7A7468" },
              "& .MuiInputLabel-root.Mui-focused": { color: "#C9A227" },
              "& .MuiOutlinedInput-root": {
                color: "#23201A",
                "& fieldset": { borderColor: "#E3DCCB" },
                "&:hover fieldset": { borderColor: "#C9C2B0" },
                "&.Mui-focused fieldset": { borderColor: "#C9A227" },
                "& .MuiSelect-icon": { color: "#7A7468" },
              },
              "& .MuiOutlinedInput-root.Mui-disabled": {
                "& fieldset": { borderColor: "#E3DCCB" },
              },
            };
            const menuProps = {
              PaperProps: {
                sx: {
                  bgcolor: "#FFFFFF",
                  border: "1px solid #E3DCCB",
                  "& .MuiMenuItem-root": { color: "#23201A", "&:hover": { bgcolor: "rgba(35,32,26,0.05)" }, "&.Mui-selected": { bgcolor: "rgba(201,162,39,0.15)", color: "#8F7318" } },
                },
              },
            };

            const selectedRace = racesForTournament.find((r) => r._id === inviteForm.raceId);
            const eligibleHorses = selectedRace
              ? horses.filter((h) => {
                  const allowed = selectedRace.eligibility?.allowedGrades ?? [];
                  return allowed.length === 0 || allowed.includes(h.currentGrade);
                })
              : [];

            return (
              <div className="space-y-4">
                {/* 1. Tournament */}
                <FormControl fullWidth sx={darkSelect}>
                  <InputLabel>Giải đấu</InputLabel>
                  <Select
                    label="Giải đấu"
                    value={inviteForm.tournamentId}
                    disabled={loadingTournaments}
                    onChange={(e) => setInviteForm((p) => ({ ...p, tournamentId: e.target.value }))}
                    MenuProps={menuProps}
                  >
                    {loadingTournaments ? (
                      <MenuItem disabled value="">Đang tải...</MenuItem>
                    ) : tournaments.length === 0 ? (
                      <MenuItem disabled value="">Chưa có giải đấu</MenuItem>
                    ) : (
                      tournaments.map((t) => (
                        <MenuItem key={t._id} value={t._id}>{t.name}</MenuItem>
                      ))
                    )}
                  </Select>
                </FormControl>

                {/* 2. Race */}
                <FormControl fullWidth sx={darkSelect}>
                  <InputLabel>Race</InputLabel>
                  <Select
                    label="Race"
                    value={inviteForm.raceId}
                    disabled={!inviteForm.tournamentId || loadingRaces}
                    onChange={(e) => setInviteForm((p) => ({ ...p, raceId: e.target.value, horseId: "" }))}
                    MenuProps={menuProps}
                  >
                    {loadingRaces ? (
                      <MenuItem disabled value="">Đang tải...</MenuItem>
                    ) : !inviteForm.tournamentId ? (
                      <MenuItem disabled value="">Chọn giải đấu trước</MenuItem>
                    ) : racesForTournament.length === 0 ? (
                      <MenuItem disabled value="">Không có race đang mở</MenuItem>
                    ) : (
                      racesForTournament.map((r) => (
                        <MenuItem key={r._id} value={r._id}>
                          <div>
                            <span className="font-medium">{r.name}</span>
                            <span className="text-slate-400 text-xs ml-2">
                              {r.grade} · {new Date(r.scheduledTime).toLocaleDateString("vi-VN")}
                            </span>
                          </div>
                        </MenuItem>
                      ))
                    )}
                  </Select>
                </FormControl>

                {/* Race eligibility hint */}
                {selectedRace && (
                  <div className="flex items-center gap-2 -mt-1">
                    <span className="text-xs text-slate-400">Yêu cầu ngựa:</span>
                    {(selectedRace.eligibility?.allowedGrades ?? []).length > 0
                      ? selectedRace.eligibility.allowedGrades.map((g) => (
                          <span key={g} className="text-xs px-2 py-0.5 rounded-full border border-border text-slate-300">{g}</span>
                        ))
                      : <span className="text-xs text-slate-400">Mọi hạng</span>}
                    <span className="text-xs text-slate-400 ml-1">· Phí: {selectedRace.registrationFee.toLocaleString()} coin</span>
                  </div>
                )}

                {/* 3. Horse */}
                <FormControl fullWidth sx={darkSelect}>
                  <InputLabel>Ngựa tham gia</InputLabel>
                  <Select
                    label="Ngựa tham gia"
                    value={inviteForm.horseId}
                    disabled={!inviteForm.raceId}
                    onChange={(e) => setInviteForm((p) => ({ ...p, horseId: e.target.value }))}
                    MenuProps={menuProps}
                  >
                    {!inviteForm.raceId ? (
                      <MenuItem disabled value="">Chọn race trước</MenuItem>
                    ) : eligibleHorses.length === 0 ? (
                      <MenuItem disabled value="">Không có ngựa đủ điều kiện</MenuItem>
                    ) : (
                      eligibleHorses.map((h) => (
                        <MenuItem key={h._id} value={h._id}>
                          <div>
                            <span className="font-medium">{h.name}</span>
                            <span className="text-slate-400 text-xs ml-2">{h.currentGrade} · {h.totalPoints} pts</span>
                          </div>
                        </MenuItem>
                      ))
                    )}
                  </Select>
                </FormControl>

                {/* 4. Optional message */}
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Lời nhắn (tùy chọn)"
                  value={inviteForm.message}
                  onChange={(e) => setInviteForm((p) => ({ ...p, message: e.target.value }))}
                  inputProps={{ maxLength: 500 }}
                  sx={{
                    "& .MuiInputLabel-root": { color: "#7A7468" },
                    "& .MuiInputLabel-root.Mui-focused": { color: "#C9A227" },
                    "& .MuiOutlinedInput-root": {
                      color: "#23201A",
                      "& fieldset": { borderColor: "#E3DCCB" },
                      "&:hover fieldset": { borderColor: "#C9C2B0" },
                      "&.Mui-focused fieldset": { borderColor: "#C9A227" },
                    },
                  }}
                />
              </div>
            );
          })()}
        </DialogContent>

        <DialogActions sx={{ borderTop: "1px solid #E3DCCB", px: 3, py: 2 }}>
          <Button
            onClick={() => setInviteJockeyOpen(false)}
            disabled={submittingInvite}
            sx={{ color: "#7A7468", textTransform: "none" }}
          >
            Hủy
          </Button>
          <Button
            variant="contained"
            disabled={!inviteForm.raceId || !inviteForm.horseId || submittingInvite}
            onClick={handleSubmitInvite}
            sx={{
              background: "#C9A227",
              color: "#23201A",
              textTransform: "none",
              fontWeight: 600,
              minWidth: 120,
              "&:hover": { background: "#B08D1E" },
              "&.Mui-disabled": { background: "#334155", color: "#7A7468" },
            }}
          >
            {submittingInvite ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Đang gửi...
              </span>
            ) : "Gửi lời mời"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Register Race Dialog */}
      <Dialog
        open={registerRaceOpen}
        onClose={() => { setRegisterRaceOpen(false); setSelectedRaceForReg(null); }}
        maxWidth="sm"
        fullWidth
        PaperProps={{ style: { backgroundColor: "#FFFFFF", border: "1px solid #E3DCCB", borderRadius: "16px" } }}
      >
        <DialogTitle sx={{ color: "#23201A", borderBottom: "1px solid #E3DCCB", pb: 2 }}>
          Đăng Ký Tham Gia Cuộc Đua
        </DialogTitle>
        <DialogContent sx={{ paddingTop: "24px !important" }}>
          <div className="space-y-4">
            {selectedRaceForReg && (
              <div className="bg-slate-800/60 rounded-xl p-4 border border-border">
                <div className="text-foreground font-bold mb-2">{selectedRaceForReg.name}</div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-slate-400">Hạng: </span><span className="text-foreground">{selectedRaceForReg.grade}</span></div>
                  <div><span className="text-slate-400">Cự ly: </span><span className="text-foreground">{selectedRaceForReg.distance}m</span></div>
                  <div><span className="text-slate-400">Giải thưởng: </span><span className="text-[#C9A227] font-bold">${selectedRaceForReg.purse?.toLocaleString()}</span></div>
                  <div><span className="text-slate-400">Phí đăng ký: </span><span className="text-red-400 font-bold">${selectedRaceForReg.registrationFee?.toLocaleString()}</span></div>
                </div>
                <div className="mt-2 text-xs text-amber-400 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  Phí sẽ được trừ ngay từ ví. Hủy đăng ký chỉ hoàn 40%.
                </div>
              </div>
            )}
            <FormControl fullWidth
              sx={{ "& .MuiInputLabel-root": { color: "#7A7468" }, "& .MuiOutlinedInput-root": { color: "#23201A", "& fieldset": { borderColor: "#E3DCCB" }, "&:hover fieldset": { borderColor: "#C9C2B0" }, "&.Mui-focused fieldset": { borderColor: "#C9A227" }, "& .MuiSelect-icon": { color: "#7A7468" } } }}
            >
              <InputLabel>Chọn Ngựa *</InputLabel>
              <Select label="Chọn Ngựa *" value={regHorseId} onChange={e => setRegHorseId(e.target.value)}>
                {horses.map(h => (
                  <MenuItem key={h._id} value={h._id}>
                    {h.name} — {h.currentGrade} ({h.totalPoints} điểm)
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </div>
        </DialogContent>
        <DialogActions sx={{ borderTop: "1px solid #E3DCCB", padding: "16px 24px" }}>
          <Button onClick={() => { setRegisterRaceOpen(false); setSelectedRaceForReg(null); }} sx={{ color: "#7A7468", textTransform: "none" }}>
            Hủy
          </Button>
          <Button variant="contained" onClick={handleSubmitRegistration} disabled={!regHorseId || submittingReg}
            sx={{ background: "#1F3D2B", textTransform: "none", fontWeight: 700, "&:hover": { background: "#172D20" } }}>
            {submittingReg ? <Loader2 className="w-4 h-4 animate-spin" /> : "Xác Nhận Đăng Ký"}
          </Button>
        </DialogActions>
      </Dialog>
    </AppShell>
  );
}
