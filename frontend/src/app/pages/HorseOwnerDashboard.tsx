import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
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
import { ProfileDropdown } from "../components/ProfileDropdown";
import { useAuth } from "../hooks/useAuth";
import { horseApi, Horse } from "../api/horse";
import { userApi, JockeyListItem } from "../api/user";
import { tournamentApi, Tournament } from "../api/tournament";
import { raceApi, Race } from "../api/race";
import { invitationApi } from "../api/invitation";

const GRADE_COLORS: Record<string, string> = {
  Maiden: "#64748b",
  G3: "#3b82f6",
  G2: "#8b5cf6",
  G1: "#f59e0b",
};

export function HorseOwnerDashboard() {
  const navigate = useNavigate();
  const { user, token } = useAuth();

  useEffect(() => {
    if (!user) navigate("/");
  }, [user, navigate]);

  const [activeTab, setActiveTab] = useState("horses");
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
      });

      if (horseImageFiles.length > 0) {
        await horseApi.uploadImages(token, newHorse._id, horseImageFiles);
      }

      toast.success("Đăng ký ngựa thành công!");
      setAddHorseOpen(false);
      setHorseForm({ name: "", breed: "", gender: "male", birthDate: "", weight: "", color: "" });
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
    });
    setEditHorseImageFiles([]);
    setEditHorseImagePreviews(horse.imageUrls || (horse.primaryImageUrl ? [horse.primaryImageUrl] : []));
    setEditHorseOpen(true);
  };


  const upcomingRaces = [
    {
      id: 1,
      date: "2026-05-25",
      time: "14:00",
      tournament: "Giải Vô Địch Mùa Xuân",
      horse: "Tia Chớp",
      jockey: "Nguyễn Văn A",
      status: "Đã Xác Nhận",
      fee: "$500",
    },
    {
      id: 2,
      date: "2026-05-28",
      time: "15:30",
      tournament: "Cúp Vàng",
      horse: "Mũi Tên Vàng",
      jockey: "Đang Chờ",
      status: "Đang Mở Đăng Ký",
      fee: "$300",
    },
    {
      id: 3,
      date: "2026-06-02",
      time: "13:00",
      tournament: "Giải Derby Mùa Hè",
      horse: "Thần Gió",
      jockey: "Trần Thị B",
      status: "Chờ Xác Nhận",
      fee: "$200",
    },
  ];

  const performanceData = [
    { month: "T1", earnings: 15000, points: 200 },
    { month: "T2", earnings: 25000, points: 350 },
    { month: "T3", earnings: 18000, points: 250 },
    { month: "T4", earnings: 42000, points: 500 },
    { month: "T5", earnings: 55000, points: 800 },
  ];

  const transactions = [
    {
      id: 1,
      date: "2026-05-20",
      type: "Giải Thưởng",
      description: "Hạng 1 - Giải Mùa Xuân",
      amount: 25000,
      status: "completed",
    },
    {
      id: 2,
      date: "2026-05-18",
      type: "Phí Đăng Ký",
      description: "Giải Vô Địch Mùa Xuân",
      amount: -500,
      status: "completed",
    },
    {
      id: 3,
      date: "2026-05-15",
      type: "Nạp Tiền",
      description: "Chuyển Khoản Ngân Hàng",
      amount: 5000,
      status: "completed",
    },
    {
      id: 4,
      date: "2026-05-10",
      type: "Hoàn Tiền",
      description: "Giải Bị Hủy - Đường C",
      amount: 300,
      status: "completed",
    },
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
      color: "from-[#FFDE42] to-[#1B0C0C]",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 font-sans">
      {/* Top Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-lg border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="cursor-pointer" onClick={() => navigate("/")}>
              <img
                src="/images/logo.png"
                alt="RaceTrack Logo"
                className="w-12 h-12 object-contain drop-shadow-md"
              />
            </div>
            <div>
              <div className="text-white font-semibold">Cổng Chủ Ngựa</div>
              <div className="text-sm text-slate-400">
                Xin chào, Nguyễn Văn A
              </div>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-4">
            <ProfileDropdown />
          </div>

          <button
            className="md:hidden text-white"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </nav>

      <div className="pt-24 max-w-7xl mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, idx) => (
            <div
              key={idx}
              className="bg-white/5 backdrop-blur-md border border-white/5 rounded-2xl p-5 hover:-translate-y-1 transition-transform"
            >
              <div
                className={`w-10 h-10 bg-gradient-to-br ${stat.color} rounded-lg flex items-center justify-center mb-3 shadow-lg`}
              >
                <stat.icon className="w-5 h-5 text-white" />
              </div>
              <div className="text-2xl font-bold text-white mb-1">
                {stat.value}
              </div>
              <div className="text-sm text-slate-400 font-medium">
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {[
            { id: "horses", label: "Ngựa Của Tôi", icon: Sparkles },
            { id: "jockeys", label: "Kỵ Sĩ", icon: Users },
            { id: "schedule", label: "Lịch Đua", icon: Calendar },
            { id: "results", label: "Thành Tích", icon: TrendingUp },
            { id: "wallet", label: "Ví Tiền", icon: Wallet },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all whitespace-nowrap font-medium ${
                activeTab === tab.id
                  ? "bg-[#FFDE42] text-[#1B0C0C] shadow-lg shadow-[#FFDE42]/25"
                  : "bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white border border-white/5"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content: Horses */}
        {activeTab === "horses" && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-3xl font-bold text-white mb-2">
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
                    "linear-gradient(135deg, #FFDE42 0%, #1B0C0C 100%)",
                  textTransform: "none",
                  fontWeight: 600,
                  boxShadow: "0 4px 6px -1px rgba(255, 222, 66, 0.2)",
                  "&:hover": {
                    background:
                      "linear-gradient(135deg, #FFDE42 0%, #4C5C2D 100%)",
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
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {horses.map((horse) => {
                const ageYears = horse.birthDate
                  ? Math.floor((Date.now() - new Date(horse.birthDate).getTime()) / (365.25 * 24 * 3600 * 1000))
                  : "?";
                const winRate = horse.raceCount > 0
                  ? Math.round((horse.winCount / horse.raceCount) * 100)
                  : 0;
                return (
                <div
                  key={horse._id}
                  className="group bg-white/5 backdrop-blur-md border border-white/5 rounded-2xl overflow-hidden hover:border-[#FFDE42]/30 transition-all"
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
                    <div className="absolute top-4 right-4">
                      <Chip
                        label={horse.isActive ? "Hoạt Động" : "Không Hoạt Động"}
                        size="small"
                        sx={{
                          backgroundColor: horse.isActive ? "#10b981" : "#64748b",
                          color: "white",
                          fontWeight: 500,
                          backdropFilter: "blur(4px)",
                        }}
                      />
                    </div>
                    <div className="absolute top-4 left-4">
                      <Chip
                        label={horse.currentGrade}
                        size="small"
                        sx={{
                          backgroundColor: GRADE_COLORS[horse.currentGrade] ?? "#f59e0b",
                          color: "white",
                          fontWeight: 600,
                        }}
                      />
                    </div>
                  </div>

                  <div className="p-6">
                    <h3 className="text-xl font-bold text-white mb-1">
                      {horse.name}
                    </h3>
                    <p className="text-sm text-slate-400 mb-4">
                      {horse.breed ?? "—"} • {ageYears} tuổi
                    </p>

                    <div className="grid grid-cols-2 gap-3 mb-6">
                      <div className="bg-slate-900/50 p-3 rounded-xl border border-white/5">
                        <div className="text-xs text-slate-400 mb-1">Thành Tích</div>
                        <div className="text-[#FFDE42] font-semibold">{horse.winCount} thắng / {horse.raceCount} trận</div>
                      </div>
                      <div className="bg-slate-900/50 p-3 rounded-xl border border-white/5">
                        <div className="text-xs text-slate-400 mb-1">Tỷ Lệ Thắng</div>
                        <div className="text-[#FFDE42] font-semibold">{winRate}%</div>
                      </div>
                      <div className="bg-slate-900/50 p-3 rounded-xl border border-white/5">
                        <div className="text-xs text-slate-400 mb-1">Điểm Tích Lũy</div>
                        <div className="text-white font-semibold">{horse.totalPoints} pts</div>
                      </div>
                      <div className="bg-slate-900/50 p-3 rounded-xl border border-white/5">
                        <div className="text-xs text-slate-400 mb-1">Tiền Thưởng</div>
                        <div className="text-[#10b981] font-semibold">${horse.totalEarnings.toLocaleString()}</div>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <Button
                        fullWidth
                        variant="outlined"
                        onClick={() => openEditHorse(horse)}
                        sx={{
                          borderColor: "rgba(255,255,255,0.1)",
                          color: "white",
                          textTransform: "none",
                          "&:hover": {
                            borderColor: "rgba(255,255,255,0.2)",
                            backgroundColor: "rgba(255,255,255,0.05)",
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
                          borderColor: "#FFDE42",
                          color: "#FFDE42",
                          textTransform: "none",
                          "&:hover": {
                            borderColor: "#E6C21E",
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
            )}
          </div>
        )}

        {/* Content: Jockeys */}
        {activeTab === "jockeys" && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-3xl font-bold text-white mb-2">
                  Quản Lý Kỵ Sĩ
                </h2>
                <p className="text-slate-400">
                  Thuê kỵ sĩ và quản lý danh sách ưa thích
                </p>
              </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white/5 backdrop-blur-md border border-white/5 rounded-2xl p-6">
                  <h3 className="text-xl font-bold text-white mb-6">
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
                      jockeys.map((jockey) => {
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
                            className="flex flex-col md:flex-row items-center justify-between p-4 bg-slate-900/50 rounded-xl border border-white/5 hover:border-white/10 transition-colors"
                          >
                            <div className="flex items-center gap-4 mb-4 md:mb-0 w-full md:w-auto">
                              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-lg font-bold text-white overflow-hidden">
                                {jockey.avatarUrl ? (
                                  <img src={jockey.avatarUrl} alt={jockey.fullName} className="w-full h-full object-cover" />
                                ) : (
                                  jockey.fullName.charAt(0)
                                )}
                              </div>
                              <div>
                                <h4 className="text-white font-medium">
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
                                  color: jockey.isActive ? "#FFDE42" : "#94a3b8",
                                  border: `1px solid ${jockey.isActive ? "#FFDE42" : "#475569"}`,
                                }}
                              />
                              <Button
                                variant="outlined"
                                size="small"
                                onClick={() => { setViewingJockey(jockey); setViewJockeyOpen(true); }}
                                sx={{
                                  borderColor: "rgba(255,255,255,0.15)",
                                  color: "#94a3b8",
                                  textTransform: "none",
                                  "&:hover": { borderColor: "rgba(255,255,255,0.3)", color: "white" },
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
                                  background: jockey.isActive ? "#FFDE42" : "#334155",
                                  textTransform: "none",
                                  "&:hover": { background: "#E6C21E" },
                                }}
                              >
                                Thuê
                              </Button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>

              {/* <div className="bg-white/5 backdrop-blur-md border border-white/5 rounded-2xl p-6 h-fit">
                <h3 className="text-xl font-bold text-white mb-6">Kỵ Sĩ Ưa Thích</h3>
                <div className="space-y-4">
                  {preferredJockeys.map(jockey => (
                    <div key={jockey.id} className="p-4 bg-slate-900/50 rounded-xl border border-[#FFDE42]/20">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                          {jockey.name.charAt(0)}
                        </div>
                        <div>
                          <h4 className="text-white font-medium">{jockey.name}</h4>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="bg-slate-950 p-2 rounded-lg">
                          <div className="text-slate-400 text-xs">Số Trận Cùng Nhau</div>
                          <div className="text-white font-medium">{jockey.racesTogether}</div>
                        </div>
                        <div className="bg-slate-950 p-2 rounded-lg">
                          <div className="text-slate-400 text-xs">Tỷ Lệ Thắng</div>
                          <div className="text-[#FFDE42] font-medium">{jockey.winRate}</div>
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
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-3xl font-bold text-white mb-2">Lịch Đua</h2>
                <p className="text-slate-400">
                  Quản lý đăng ký và xác nhận tham gia
                </p>
              </div>
              <Button
                variant="contained"
                onClick={() => setRegisterRaceOpen(true)}
                sx={{
                  background:
                    "linear-gradient(135deg, #FFDE42 0%, #1B0C0C 100%)",
                  textTransform: "none",
                  fontWeight: 600,
                  boxShadow: "0 4px 6px -1px rgba(255, 222, 66, 0.2)",
                  "&:hover": {
                    background:
                      "linear-gradient(135deg, #FFDE42 0%, #4C5C2D 100%)",
                  },
                }}
              >
                Đăng Ký Tham Gia
              </Button>
            </div>

            <div className="space-y-4">
              {upcomingRaces.map((race) => (
                <div
                  key={race.id}
                  className="bg-white/5 backdrop-blur-md border border-white/5 rounded-2xl p-6 hover:border-[#FFDE42]/30 transition-all"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center">
                          <Calendar className="w-5 h-5 text-[#FFDE42]" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-white">
                            {race.tournament}
                          </h3>
                          <div className="text-slate-400 text-sm">
                            {race.date} at {race.time}
                          </div>
                        </div>
                        <Chip
                          label={race.status}
                          size="small"
                          icon={
                            race.status === "Đã Xác Nhận" ? (
                              <CheckCircle className="w-4 h-4" />
                            ) : (
                              <Clock className="w-4 h-4" />
                            )
                          }
                          sx={{
                            ml: "auto",
                            backgroundColor:
                              race.status === "Đã Xác Nhận"
                                ? "rgba(255, 222, 66, 0.2)"
                                : "rgba(245, 158, 11, 0.2)",
                            color:
                              race.status === "Đã Xác Nhận"
                                ? "#FFDE42"
                                : "#fbbf24",
                            border: `1px solid ${race.status === "Đã Xác Nhận" ? "#FFDE42" : "#f59e0b"}`,
                            "& .MuiChip-icon": { color: "inherit" },
                          }}
                        />
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                        <div>
                          <div className="text-slate-400 text-sm mb-1">
                            Ngựa Đã Chọn
                          </div>
                          <div className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-[#FFDE42]" />
                            <span className="text-white font-medium">
                              {race.horse}
                            </span>
                          </div>
                        </div>
                        <div>
                          <div className="text-slate-400 text-sm mb-1">
                            Kỵ Sĩ
                          </div>
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-blue-400" />
                            <span className="text-white font-medium">
                              {race.jockey}
                            </span>
                          </div>
                        </div>
                        <div>
                          <div className="text-slate-400 text-sm mb-1">
                            Phí Tham Gia
                          </div>
                          <div className="text-white font-medium">
                            {race.fee}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 min-w-[140px]">
                      {race.status === "Chờ Xác Nhận" && (
                        <Button
                          variant="contained"
                          fullWidth
                          sx={{
                            background: "#FFDE42",
                            color: "#1B0C0C",
                            textTransform: "none",
                            "&:hover": { background: "#E6C21E" },
                          }}
                        >
                          Xác Nhận
                        </Button>
                      )}
                      <Button
                        variant="outlined"
                        fullWidth
                        sx={{
                          borderColor: "rgba(255,255,255,0.1)",
                          color: "white",
                          textTransform: "none",
                          "&:hover": { borderColor: "rgba(255,255,255,0.3)" },
                        }}
                      >
                        Chi Tiết
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Content: Performance & Results */}
        {activeTab === "results" && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-3xl font-bold text-white mb-6">
              Thành Tích & Phân Tích
            </h2>

            <div className="grid lg:grid-cols-2 gap-6 mb-8">
              <div className="bg-white/5 backdrop-blur-md border border-white/5 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-white mb-6">
                  Lịch Sử Thu Nhập
                </h3>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={performanceData}>
                      <defs>
                        <linearGradient
                          id="colorEarnings"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#10b981"
                            stopOpacity={0.3}
                          />
                          <stop
                            offset="95%"
                            stopColor="#10b981"
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="rgba(255,255,255,0.1)"
                      />
                      <XAxis dataKey="month" stroke="#94a3b8" />
                      <YAxis stroke="#94a3b8" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#0f172a",
                          border: "1px solid rgba(255,255,255,0.1)",
                          borderRadius: "8px",
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="earnings"
                        stroke="#10b981"
                        fillOpacity={1}
                        fill="url(#colorEarnings)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* <div className="bg-white/5 backdrop-blur-md border border-white/5 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-white mb-6">Tiến Độ Điểm</h3>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={performanceData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis dataKey="month" stroke="#94a3b8" />
                      <YAxis stroke="#94a3b8" />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} />
                      <Bar dataKey="points" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div> */}
            </div>

            <div className="bg-white/5 backdrop-blur-md border border-white/5 rounded-2xl p-6">
              <h3 className="text-xl font-bold text-white mb-6">
                Kết Quả Gần Đây
              </h3>
              <div className="space-y-4">
                {[
                  {
                    race: "Giải Kinh Điển Mùa Xuân",
                    date: "2026-05-15",
                    horse: "Tia Chớp",
                    position: 1,
                    prize: "$25,000",
                    points: "+150",
                  },
                  {
                    race: "Cúp Chiến Thắng",
                    date: "2026-05-10",
                    horse: "Mũi Tên Vàng",
                    position: 3,
                    prize: "$8,000",
                    points: "+45",
                  },
                ].map((result, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-4 bg-slate-900/50 rounded-xl border border-white/5"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg
                        ${
                          result.position === 1
                            ? "bg-amber-500/20 text-amber-500 border border-amber-500/30"
                            : result.position === 2
                              ? "bg-slate-300/20 text-slate-300 border border-slate-300/30"
                              : "bg-orange-700/20 text-orange-500 border border-orange-700/30"
                        }`}
                      >
                        #{result.position}
                      </div>
                      <div>
                        <div className="text-white font-bold text-lg">
                          {result.race}
                        </div>
                        <div className="text-sm text-slate-400">
                          {result.date} •{" "}
                          <span className="text-[#FFDE42]">{result.horse}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[#FFDE42] font-bold text-lg">
                        {result.prize}
                      </div>
                      <div className="text-blue-400 text-sm font-medium">
                        {result.points} pts
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Content: Wallet */}
        {activeTab === "wallet" && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-3xl font-bold text-white mb-6">
              Ví & Giao Dịch
            </h2>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="md:col-span-1 space-y-6">
                <div className="bg-gradient-to-br from-[#FFDE42] to-[#1B0C0C] rounded-3xl p-8 relative overflow-hidden shadow-2xl shadow-[#FFDE42]/50">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl"></div>

                  <div className="relative z-10">
                    <div className="text-white font-medium mb-2">
                      Tổng Số Dư
                    </div>
                    <div className="text-5xl font-bold text-white mb-8">
                      $45,800.00
                    </div>

                    <div className="flex gap-3">
                      <Button
                        variant="contained"
                        onClick={() => setTopupOpen(true)}
                        startIcon={<Plus />}
                        sx={{
                          background: "white",
                          color: "#1B0C0C",
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
                          borderColor: "rgba(255,255,255,0.3)",
                          color: "white",
                          fontWeight: 600,
                          textTransform: "none",
                          "&:hover": {
                            borderColor: "white",
                            background: "rgba(255,255,255,0.1)",
                          },
                        }}
                      >
                        Rút Tiền
                      </Button>
                    </div>
                  </div>
                </div>

                {/* <div className="bg-white/5 backdrop-blur-md border border-white/5 rounded-2xl p-6">
                  <h3 className="text-lg font-bold text-white mb-4">Thống Kê Nhanh</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center pb-4 border-b border-white/5">
                      <span className="text-slate-400">Tổng Đã Nạp</span>
                      <span className="text-white font-medium">$50,000</span>
                    </div>
                    <div className="flex justify-between items-center pb-4 border-b border-white/5">
                      <span className="text-slate-400">Tổng Thắng</span>
                      <span className="text-[#FFDE42] font-medium">$45,000</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Tổng Chi Phí</span>
                      <span className="text-red-400 font-medium">$49,200</span>
                    </div>
                  </div>
                </div> */}
              </div>

              <div className="md:col-span-2 bg-white/5 backdrop-blur-md border border-white/5 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-white">
                    Lịch Sử Giao Dịch
                  </h3>
                  <Button sx={{ color: "#FFDE42", textTransform: "none" }}>
                    Xem Tất Cả
                  </Button>
                </div>

                <div className="space-y-4">
                  {transactions.map((tx) => (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between p-4 bg-slate-900/50 rounded-xl border border-white/5 hover:bg-slate-800/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center
                          ${tx.amount > 0 ? "bg-[#FFDE42]/20 text-[#FFDE42]" : "bg-red-500/20 text-red-500"}`}
                        >
                          {tx.amount > 0 ? (
                            <ArrowDownRight className="w-5 h-5" />
                          ) : (
                            <ArrowUpRight className="w-5 h-5" />
                          )}
                        </div>
                        <div>
                          <div className="text-white font-medium">
                            {tx.type}
                          </div>
                          <div className="text-sm text-slate-400">
                            {tx.description} • {tx.date}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div
                          className={`font-bold ${tx.amount > 0 ? "text-[#FFDE42]" : "text-red-400"}`}
                        >
                          {tx.amount > 0 ? "+" : ""}
                          {tx.amount}
                        </div>
                        <div className="text-xs text-slate-500 uppercase">
                          {tx.status === "completed" ? "hoàn thành" : tx.status}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
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
            backgroundColor: "#0f172a",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "16px",
          },
        }}
      >
        <DialogTitle
          sx={{
            color: "white",
            borderBottom: "1px solid rgba(255,255,255,0.1)",
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
                <div key={idx} className="relative w-32 h-32 flex-shrink-0 rounded-xl overflow-hidden border border-white/10 group bg-slate-800">
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
                className="w-32 h-32 flex-shrink-0 rounded-xl border-2 border-dashed border-slate-600 flex flex-col items-center justify-center text-slate-400 hover:text-white hover:border-[#FFDE42] cursor-pointer transition-colors"
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
                "& .MuiInputLabel-root": { color: "#94a3b8" },
                "& .MuiOutlinedInput-root": {
                  color: "white",
                  "& fieldset": { borderColor: "rgba(255,255,255,0.1)" },
                  "&:hover fieldset": { borderColor: "rgba(255,255,255,0.2)" },
                  "&.Mui-focused fieldset": { borderColor: "#FFDE42" },
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
                  "& .MuiInputLabel-root": { color: "#94a3b8" },
                  "& .MuiOutlinedInput-root": {
                    color: "white",
                    "& fieldset": { borderColor: "rgba(255,255,255,0.1)" },
                    "&:hover fieldset": { borderColor: "rgba(255,255,255,0.2)" },
                    "&.Mui-focused fieldset": { borderColor: "#FFDE42" },
                  },
                }}
              />
              <TextField
                fullWidth
                label="Màu Sắc"
                value={horseForm.color}
                onChange={(e) => setHorseForm((p) => ({ ...p, color: e.target.value }))}
                sx={{
                  "& .MuiInputLabel-root": { color: "#94a3b8" },
                  "& .MuiOutlinedInput-root": {
                    color: "white",
                    "& fieldset": { borderColor: "rgba(255,255,255,0.1)" },
                    "&:hover fieldset": { borderColor: "rgba(255,255,255,0.2)" },
                    "&.Mui-focused fieldset": { borderColor: "#FFDE42" },
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
                  "& .MuiInputLabel-root": { color: "#94a3b8" },
                  "& .MuiOutlinedInput-root": {
                    color: "white",
                    "& fieldset": { borderColor: "rgba(255,255,255,0.1)" },
                    "&:hover fieldset": { borderColor: "rgba(255,255,255,0.2)" },
                    "&.Mui-focused fieldset": { borderColor: "#FFDE42" },
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
                  "& .MuiInputLabel-root": { color: "#94a3b8" },
                  "& .MuiOutlinedInput-root": {
                    color: "white",
                    "& fieldset": { borderColor: "rgba(255,255,255,0.1)" },
                    "&:hover fieldset": { borderColor: "rgba(255,255,255,0.2)" },
                    "&.Mui-focused fieldset": { borderColor: "#FFDE42" },
                  },
                }}
              />
            </div>

            <FormControl
              fullWidth
              sx={{
                "& .MuiInputLabel-root": { color: "#94a3b8" },
                "& .MuiOutlinedInput-root": {
                  color: "white",
                  "& fieldset": { borderColor: "rgba(255,255,255,0.1)" },
                  "&:hover fieldset": { borderColor: "rgba(255,255,255,0.2)" },
                  "&.Mui-focused fieldset": { borderColor: "#FFDE42" },
                  "& .MuiSelect-icon": { color: "#94a3b8" },
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

          </div>
        </DialogContent>
        <DialogActions
          sx={{
            borderTop: "1px solid rgba(255,255,255,0.1)",
            padding: "16px 24px",
          }}
        >
          <Button
            onClick={() => {
              setAddHorseOpen(false);
              setHorseForm({ name: "", breed: "", gender: "male", birthDate: "", weight: "", color: "" });
              setHorseImageFile(null);
              setHorseImagePreview("");
            }}
            sx={{ color: "#94a3b8", textTransform: "none" }}
          >
            Hủy
          </Button>
          <Button
            variant="contained"
            onClick={handleCreateHorse}
            disabled={creatingHorse}
            sx={{
              background: "#FFDE42",
              textTransform: "none",
              "&:hover": { background: "#E6C21E" },
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
            backgroundColor: "#0f172a",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "16px",
          },
        }}
      >
        <DialogTitle
          sx={{
            color: "white",
            borderBottom: "1px solid rgba(255,255,255,0.1)",
            pb: 2,
          }}
        >
          Chỉnh Sửa Thông Tin Ngựa
        </DialogTitle>
        <DialogContent sx={{ paddingTop: "24px !important" }}>
          <div className="space-y-4">
            <div className="flex gap-4 mb-6 overflow-x-auto pb-2">
              {editHorseImagePreviews.map((preview, idx) => (
                <div key={idx} className="relative w-32 h-32 flex-shrink-0 rounded-xl overflow-hidden border border-white/10 group bg-slate-800">
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
                className="w-32 h-32 flex-shrink-0 rounded-xl border-2 border-dashed border-slate-600 flex flex-col items-center justify-center text-slate-400 hover:text-white hover:border-[#FFDE42] cursor-pointer transition-colors"
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
                "& .MuiInputLabel-root": { color: "#94a3b8" },
                "& .MuiOutlinedInput-root": {
                  color: "white",
                  "& fieldset": { borderColor: "rgba(255,255,255,0.1)" },
                  "&:hover fieldset": { borderColor: "rgba(255,255,255,0.2)" },
                  "&.Mui-focused fieldset": { borderColor: "#FFDE42" },
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
                  "& .MuiInputLabel-root": { color: "#94a3b8" },
                  "& .MuiOutlinedInput-root": {
                    color: "white",
                    "& fieldset": { borderColor: "rgba(255,255,255,0.1)" },
                    "&:hover fieldset": { borderColor: "rgba(255,255,255,0.2)" },
                    "&.Mui-focused fieldset": { borderColor: "#FFDE42" },
                  },
                }}
              />
              <TextField
                fullWidth
                label="Màu Sắc"
                value={editHorseForm.color}
                onChange={(e) => setEditHorseForm((p) => ({ ...p, color: e.target.value }))}
                sx={{
                  "& .MuiInputLabel-root": { color: "#94a3b8" },
                  "& .MuiOutlinedInput-root": {
                    color: "white",
                    "& fieldset": { borderColor: "rgba(255,255,255,0.1)" },
                    "&:hover fieldset": { borderColor: "rgba(255,255,255,0.2)" },
                    "&.Mui-focused fieldset": { borderColor: "#FFDE42" },
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
                  "& .MuiInputLabel-root": { color: "#94a3b8" },
                  "& .MuiOutlinedInput-root": {
                    color: "white",
                    "& fieldset": { borderColor: "rgba(255,255,255,0.1)" },
                    "&:hover fieldset": { borderColor: "rgba(255,255,255,0.2)" },
                    "&.Mui-focused fieldset": { borderColor: "#FFDE42" },
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
                  "& .MuiInputLabel-root": { color: "#94a3b8" },
                  "& .MuiOutlinedInput-root": {
                    color: "white",
                    "& fieldset": { borderColor: "rgba(255,255,255,0.1)" },
                    "&:hover fieldset": { borderColor: "rgba(255,255,255,0.2)" },
                    "&.Mui-focused fieldset": { borderColor: "#FFDE42" },
                  },
                }}
              />
            </div>

            <FormControl
              fullWidth
              sx={{
                "& .MuiInputLabel-root": { color: "#94a3b8" },
                "& .MuiOutlinedInput-root": {
                  color: "white",
                  "& fieldset": { borderColor: "rgba(255,255,255,0.1)" },
                  "&:hover fieldset": { borderColor: "rgba(255,255,255,0.2)" },
                  "&.Mui-focused fieldset": { borderColor: "#FFDE42" },
                  "& .MuiSelect-icon": { color: "#94a3b8" },
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

          </div>
        </DialogContent>
        <DialogActions
          sx={{
            borderTop: "1px solid rgba(255,255,255,0.1)",
            padding: "16px 24px",
          }}
        >
          <Button
            onClick={() => setEditHorseOpen(false)}
            sx={{ color: "#94a3b8", textTransform: "none" }}
          >
            Hủy
          </Button>
          <Button
            variant="contained"
            onClick={handleUpdateHorse}
            disabled={updatingHorse}
            sx={{
              background: "#FFDE42",
              textTransform: "none",
              "&:hover": { background: "#E6C21E" },
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
            backgroundColor: "#0f172a",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "16px",
          },
        }}
      >
        <DialogTitle
          sx={{
            color: "white",
            borderBottom: "1px solid rgba(255,255,255,0.1)",
            pb: 2,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}
        >
          Thông Tin Chi Tiết Ngựa
          <button onClick={() => setViewHorseOpen(false)} className="text-slate-400 hover:text-white transition-colors">
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
                    <div className="flex gap-3 mb-6 overflow-x-auto max-w-full pb-2 scrollbar-thin scrollbar-thumb-white/10 justify-center">
                      {images.map((imgUrl, idx) => (
                        <button
                          key={idx}
                          onClick={() => setViewHorseActiveImage(imgUrl)}
                          className={`w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all ${
                            viewHorseActiveImage === imgUrl ? "border-[#FFDE42] opacity-100 scale-105" : "border-transparent opacity-50 hover:opacity-100 hover:scale-105"
                          }`}
                        >
                          <img src={imgUrl} alt="thumbnail" className="w-full h-full object-cover bg-slate-800" />
                        </button>
                      ))}
                    </div>
                  );
                })()}

                <h3 className="text-2xl font-bold text-white text-center">{viewingHorse.name}</h3>
                <div className="flex items-center gap-2 mt-2">
                  <Chip
                    label={viewingHorse.isActive ? "Hoạt Động" : "Không Hoạt Động"}
                    size="small"
                    sx={{
                      backgroundColor: viewingHorse.isActive ? "#10b981" : "#64748b",
                      color: "white",
                      fontWeight: 500,
                    }}
                  />
                  <Chip
                    label={viewingHorse.currentGrade}
                    size="small"
                    sx={{
                      backgroundColor: GRADE_COLORS[viewingHorse.currentGrade] ?? "#f59e0b",
                      color: "white",
                      fontWeight: 600,
                    }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                  <h4 className="text-sm font-semibold text-slate-400 mb-3 uppercase tracking-wider">Thể Chất</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex justify-between"><span className="text-slate-500">Giới tính:</span> <span className="text-white font-medium">{viewingHorse.gender === "male" ? "Đực" : "Cái"}</span></li>
                    <li className="flex justify-between"><span className="text-slate-500">Giống:</span> <span className="text-white font-medium">{viewingHorse.breed || "Chưa rõ"}</span></li>
                    <li className="flex justify-between"><span className="text-slate-500">Màu sắc:</span> <span className="text-white font-medium">{viewingHorse.color || "Chưa rõ"}</span></li>
                    <li className="flex justify-between"><span className="text-slate-500">Cân nặng:</span> <span className="text-white font-medium">{viewingHorse.weight} kg</span></li>
                    <li className="flex justify-between"><span className="text-slate-500">Ngày sinh:</span> <span className="text-white font-medium">{new Date(viewingHorse.birthDate).toLocaleDateString("vi-VN")}</span></li>
                  </ul>
                </div>
                
                <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                  <h4 className="text-sm font-semibold text-slate-400 mb-3 uppercase tracking-wider">Sự Nghiệp</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex justify-between"><span className="text-slate-500">Tổng số trận:</span> <span className="text-white font-medium">{viewingHorse.raceCount} trận</span></li>
                    <li className="flex justify-between"><span className="text-slate-500">Số trận thắng:</span> <span className="text-[#FFDE42] font-bold">{viewingHorse.winCount} trận</span></li>
                    <li className="flex justify-between"><span className="text-slate-500">Tỷ lệ thắng:</span> <span className="text-white font-medium">{viewingHorse.raceCount > 0 ? Math.round((viewingHorse.winCount / viewingHorse.raceCount) * 100) : 0}%</span></li>
                    <li className="flex justify-between"><span className="text-slate-500">Tổng điểm:</span> <span className="text-emerald-400 font-bold">{viewingHorse.totalPoints} pts</span></li>
                    <li className="flex justify-between"><span className="text-slate-500">Tiền thưởng:</span> <span className="text-[#10b981] font-bold">${viewingHorse.totalEarnings.toLocaleString()}</span></li>
                  </ul>
                </div>
              </div>

              {viewingHorse.violations && viewingHorse.violations.length > 0 && (
                <div className="bg-red-950/30 p-4 rounded-xl border border-red-900/50">
                  <h4 className="text-sm font-semibold text-red-400 mb-3 uppercase tracking-wider flex items-center"><AlertTriangle className="w-4 h-4 mr-2" /> Lịch Sử Vi Phạm</h4>
                  <div className="space-y-3">
                    {viewingHorse.violations.map((v, i) => (
                      <div key={i} className="text-sm border-l-2 border-red-500/50 pl-3">
                        <div className="text-white font-medium">{v.name}</div>
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
            backgroundColor: "#0f172a",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "16px",
          },
        }}
      >
        <DialogTitle
          sx={{
            color: "white",
            borderBottom: "1px solid rgba(255,255,255,0.1)",
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
              "& .MuiInputLabel-root": { color: "#94a3b8" },
              "& .MuiOutlinedInput-root": {
                color: "white",
                "& fieldset": { borderColor: "rgba(255,255,255,0.1)" },
                "&:hover fieldset": { borderColor: "rgba(255,255,255,0.2)" },
                "&.Mui-focused fieldset": { borderColor: "#10b981" },
              },
            }}
          />
        </DialogContent>
        <DialogActions
          sx={{
            borderTop: "1px solid rgba(255,255,255,0.1)",
            padding: "16px 24px",
          }}
        >
          <Button
            onClick={() => setTopupOpen(false)}
            sx={{ color: "#94a3b8", textTransform: "none" }}
          >
            Hủy
          </Button>
          <Button
            variant="contained"
            onClick={() => setTopupOpen(false)}
            sx={{
              background: "#10b981",
              textTransform: "none",
              "&:hover": { background: "#059669" },
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
            backgroundColor: "#0f172a",
            border: "1px solid rgba(255,255,255,0.1)",
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
                  className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="flex flex-col items-center text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-3xl font-bold text-white overflow-hidden mb-3 ring-4 ring-white/10">
                    {viewingJockey.avatarUrl ? (
                      <img src={viewingJockey.avatarUrl} alt={viewingJockey.fullName} className="w-full h-full object-cover" />
                    ) : (
                      viewingJockey.fullName.charAt(0)
                    )}
                  </div>
                  <h2 className="text-xl font-bold text-white">{viewingJockey.fullName}</h2>
                  <Chip
                    label={viewingJockey.isActive ? "Sẵn Sàng" : "Không Hoạt Động"}
                    size="small"
                    sx={{
                      mt: 1,
                      backgroundColor: viewingJockey.isActive ? "rgba(255,222,66,0.2)" : "rgba(100,116,139,0.2)",
                      color: viewingJockey.isActive ? "#FFDE42" : "#94a3b8",
                      border: `1px solid ${viewingJockey.isActive ? "#FFDE42" : "#475569"}`,
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
                      className="bg-slate-800/90 backdrop-blur rounded-xl p-3 text-center border border-white/5"
                    >
                      <div className="text-[#FFDE42] text-lg font-bold">{stat.value}</div>
                      <div className="text-slate-400 text-xs mt-0.5">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Details */}
              <DialogContent sx={{ px: 3, pt: 3, pb: 0 }}>
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-slate-900/60 rounded-xl p-3 border border-white/5">
                      <div className="text-slate-400 text-xs mb-1">Kinh nghiệm</div>
                      <div className="text-white font-semibold">{exp} năm</div>
                    </div>
                    <div className="bg-slate-900/60 rounded-xl p-3 border border-white/5">
                      <div className="text-slate-400 text-xs mb-1">Cân nặng</div>
                      <div className="text-white font-semibold">{weight ? `${weight} kg` : "—"}</div>
                    </div>
                    <div className="bg-slate-900/60 rounded-xl p-3 border border-white/5">
                      <div className="text-slate-400 text-xs mb-1">Chiều cao</div>
                      <div className="text-white font-semibold">{height ? `${height} cm` : "—"}</div>
                    </div>
                  </div>
                  {bio && (
                    <div className="bg-slate-900/60 rounded-xl p-4 border border-white/5">
                      <div className="text-slate-400 text-xs mb-2">Giới thiệu</div>
                      <p className="text-slate-300 text-sm leading-relaxed">{bio}</p>
                    </div>
                  )}
                </div>
              </DialogContent>

              <DialogActions sx={{ px: 3, py: 2.5, borderTop: "1px solid rgba(255,255,255,0.08)", mt: 3 }}>
                <Button
                  onClick={() => setViewJockeyOpen(false)}
                  sx={{ color: "#94a3b8", textTransform: "none" }}
                >
                  Đóng
                </Button>
                <Button
                  variant="contained"
                  disabled={!viewingJockey.isActive}
                  onClick={() => { setViewJockeyOpen(false); setInvitingJockey(viewingJockey); setInviteJockeyOpen(true); }}
                  sx={{
                    background: viewingJockey.isActive ? "#FFDE42" : "#334155",
                    color: viewingJockey.isActive ? "#0f172a" : "#64748b",
                    textTransform: "none",
                    fontWeight: 600,
                    "&:hover": { background: "#E6C21E" },
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
            backgroundColor: "#0f172a",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "16px",
          },
        }}
      >
        {/* Jockey being invited — header info */}
        {invitingJockey && (
          <div className="flex items-center gap-3 px-6 pt-5 pb-4 border-b border-white/10">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm overflow-hidden shrink-0">
              {invitingJockey.avatarUrl
                ? <img src={invitingJockey.avatarUrl} alt={invitingJockey.fullName} className="w-full h-full object-cover" />
                : invitingJockey.fullName.charAt(0)}
            </div>
            <div>
              <p className="text-xs text-slate-400">Gửi lời mời đến</p>
              <p className="text-white font-semibold leading-tight">{invitingJockey.fullName}</p>
            </div>
          </div>
        )}

        <DialogContent sx={{ pt: "20px !important", pb: 1 }}>
          {(() => {
            const darkSelect = {
              "& .MuiInputLabel-root": { color: "#94a3b8" },
              "& .MuiInputLabel-root.Mui-focused": { color: "#FFDE42" },
              "& .MuiOutlinedInput-root": {
                color: "white",
                "& fieldset": { borderColor: "rgba(255,255,255,0.1)" },
                "&:hover fieldset": { borderColor: "rgba(255,255,255,0.25)" },
                "&.Mui-focused fieldset": { borderColor: "#FFDE42" },
                "& .MuiSelect-icon": { color: "#94a3b8" },
              },
              "& .MuiOutlinedInput-root.Mui-disabled": {
                "& fieldset": { borderColor: "rgba(255,255,255,0.05)" },
              },
            };
            const menuProps = {
              PaperProps: {
                sx: {
                  bgcolor: "#1e293b",
                  border: "1px solid rgba(255,255,255,0.1)",
                  "& .MuiMenuItem-root": { color: "white", "&:hover": { bgcolor: "rgba(255,255,255,0.05)" }, "&.Mui-selected": { bgcolor: "rgba(255,222,66,0.15)", color: "#FFDE42" } },
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
                          <span key={g} className="text-xs px-2 py-0.5 rounded-full border border-white/10 text-slate-300">{g}</span>
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
                    "& .MuiInputLabel-root": { color: "#94a3b8" },
                    "& .MuiInputLabel-root.Mui-focused": { color: "#FFDE42" },
                    "& .MuiOutlinedInput-root": {
                      color: "white",
                      "& fieldset": { borderColor: "rgba(255,255,255,0.1)" },
                      "&:hover fieldset": { borderColor: "rgba(255,255,255,0.25)" },
                      "&.Mui-focused fieldset": { borderColor: "#FFDE42" },
                    },
                  }}
                />
              </div>
            );
          })()}
        </DialogContent>

        <DialogActions sx={{ borderTop: "1px solid rgba(255,255,255,0.08)", px: 3, py: 2 }}>
          <Button
            onClick={() => setInviteJockeyOpen(false)}
            disabled={submittingInvite}
            sx={{ color: "#94a3b8", textTransform: "none" }}
          >
            Hủy
          </Button>
          <Button
            variant="contained"
            disabled={!inviteForm.raceId || !inviteForm.horseId || submittingInvite}
            onClick={handleSubmitInvite}
            sx={{
              background: "#FFDE42",
              color: "#0f172a",
              textTransform: "none",
              fontWeight: 600,
              minWidth: 120,
              "&:hover": { background: "#E6C21E" },
              "&.Mui-disabled": { background: "#334155", color: "#64748b" },
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
        onClose={() => setRegisterRaceOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          style: {
            backgroundColor: "#0f172a",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "16px",
          },
        }}
      >
        <DialogTitle
          sx={{
            color: "white",
            borderBottom: "1px solid rgba(255,255,255,0.1)",
            pb: 2,
          }}
        >
          Đăng Ký Tham Gia Giải Đấu
        </DialogTitle>
        <DialogContent sx={{ paddingTop: "24px !important" }}>
          <div className="space-y-4">
            <FormControl
              fullWidth
              sx={{
                "& .MuiInputLabel-root": { color: "#94a3b8" },
                "& .MuiOutlinedInput-root": {
                  color: "white",
                  "& fieldset": { borderColor: "rgba(255,255,255,0.1)" },
                  "&:hover fieldset": { borderColor: "rgba(255,255,255,0.2)" },
                  "&.Mui-focused fieldset": { borderColor: "#FFDE42" },
                  "& .MuiSelect-icon": { color: "#94a3b8" },
                },
              }}
            >
              <InputLabel>Chọn Giải Đấu</InputLabel>
              <Select label="Chọn Giải Đấu" defaultValue="">
                <MenuItem value="1">Giải Vô Địch Cao Cấp 2026</MenuItem>
                <MenuItem value="2">Giải Derby Mùa Hè</MenuItem>
              </Select>
            </FormControl>
            <FormControl
              fullWidth
              sx={{
                "& .MuiInputLabel-root": { color: "#94a3b8" },
                "& .MuiOutlinedInput-root": {
                  color: "white",
                  "& fieldset": { borderColor: "rgba(255,255,255,0.1)" },
                  "&:hover fieldset": { borderColor: "rgba(255,255,255,0.2)" },
                  "&.Mui-focused fieldset": { borderColor: "#FFDE42" },
                  "& .MuiSelect-icon": { color: "#94a3b8" },
                },
              }}
            >
              <InputLabel>Chọn Ngựa</InputLabel>
              <Select label="Chọn Ngựa" defaultValue="">
                {horses.map((h) => (
                  <MenuItem key={h.id} value={h.id}>
                    {h.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </div>
        </DialogContent>
        <DialogActions
          sx={{
            borderTop: "1px solid rgba(255,255,255,0.1)",
            padding: "16px 24px",
          }}
        >
          <Button
            onClick={() => setRegisterRaceOpen(false)}
            sx={{ color: "#94a3b8", textTransform: "none" }}
          >
            Hủy
          </Button>
          <Button
            variant="contained"
            onClick={() => setRegisterRaceOpen(false)}
            sx={{
              background: "#10b981",
              textTransform: "none",
              "&:hover": { background: "#059669" },
            }}
          >
            Xác Nhận Đăng Ký
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
