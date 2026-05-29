import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import {
  ArrowLeft,
  User,
  Shield,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Edit2,
  CheckCircle,
  Trophy,
  TrendingUp,
  Coins,
  Activity,
  Star,
  Lock,
  Bell,
  ChevronRight,
  Camera,
  Award,
  Target,
  Flame,
  Clock,
  Gift,
  Medal,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { userApi } from "../api/user";
import { authApi } from "../api/auth";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";

const ROLE_LABELS: Record<string, string> = {
  owner: "Chủ Ngựa",
  jockey: "Kỵ Sĩ",
  referee: "Trọng Tài",
  spectator: "Khán Giả",
  admin: "Quản Trị Viên",
};

function getInitials(fullName: string): string {
  return fullName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatJoinDate(iso: string): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("vi-VN", {
    month: "long",
    year: "numeric",
  });
}

const recentActivity = [
  {
    type: "won",
    title: "Thắng cược – Thunder Strike",
    amount: "+$300",
    time: "5 phút trước",
    color: "text-[#FFDE42]",
    dot: "bg-[#FFDE42]",
  },
  {
    type: "bet",
    title: "Đặt cược – Golden Arrow",
    amount: "-$50",
    time: "2 giờ trước",
    color: "text-blue-400",
    dot: "bg-blue-400",
  },
  {
    type: "deposit",
    title: "Nạp tiền thành công",
    amount: "+$500",
    time: "1 ngày trước",
    color: "text-emerald-400",
    dot: "bg-emerald-400",
  },
  {
    type: "lost",
    title: "Thua cược – Storm Chaser",
    amount: "-$200",
    time: "2 ngày trước",
    color: "text-red-400",
    dot: "bg-red-400",
  },
  {
    type: "deposit",
    title: "Nạp tiền thành công",
    amount: "+$200",
    time: "3 ngày trước",
    color: "text-emerald-400",
    dot: "bg-emerald-400",
  },
];

export function ProfilePage() {
  const navigate = useNavigate();
  const { token, updateUser } = useAuth();

  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [activeSection, setActiveSection] = useState("overview");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Change password dialog
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [notifBet, setNotifBet] = useState(true);
  const [notifDeposit, setNotifDeposit] = useState(true);
  const [notifPromo, setNotifPromo] = useState(false);
  const [notifResult, setNotifResult] = useState(true);

  const [user, setUser] = useState({
    name: "",
    username: "",
    email: "",
    phone: "",
    location: "",
    joinDate: "",
    dob: "",
    level: "",
    avatar: "",
    avatarUrl: "",
    verified: false,
    bio: "",
    balance: 0,
    totalDeposited: 0,
    totalWon: 0,
    totalBets: 1,
    wonBets: 0,
    rank: 0,
    streak: 0,
    membershipExpiry: "",
    role: "",
  });

  // Controlled state for editable fields
  const [formState, setFormState] = useState({
    name: "",
    phone: "",
    dob: "",
    location: "",
    bio: "",
  });

  useEffect(() => {
    if (!token) return;
    userApi
      .getMe(token)
      .then((data) => {
        const mapped = {
          name: data.fullName,
          username: "@" + data.email.split("@")[0],
          email: data.email,
          phone: data.phone ?? "",
          location: "",
          joinDate: formatJoinDate(data.createdAt),
          dob: "",
          level: ROLE_LABELS[data.role] ?? data.role,
          avatar: getInitials(data.fullName),
          avatarUrl: data.avatarUrl ?? "",
          verified: data.isActive,
          bio: data.jockeyProfile?.bio ?? "",
          balance: data.walletId?.balance ?? 0,
          totalDeposited: 0,
          totalWon: 0,
          totalBets: 1,
          wonBets: 0,
          rank: 0,
          streak: 0,
          membershipExpiry: "",
          role: data.role,
        };
        setUser(mapped);
        setFormState({
          name: mapped.name,
          phone: mapped.phone,
          dob: mapped.dob,
          location: mapped.location,
          bio: mapped.bio,
        });
      })
      .catch((err) => {
        console.error(err);
        toast.error("Không thể tải thông tin hồ sơ");
      });
  }, [token]);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Vui lòng chọn file ảnh");
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Kích thước file không được vượt quá 5MB");
      return;
    }

    setUploadingAvatar(true);
    try {
      const updatedUser = await userApi.uploadAvatar(token!, file);
      const newAvatarUrl = updatedUser.avatarUrl ?? "";
      setUser((prev) => ({
        ...prev,
        avatar: getInitials(updatedUser.fullName),
        avatarUrl: newAvatarUrl,
      }));
      updateUser({ avatarUrl: newAvatarUrl });
      toast.success("Cập nhật ảnh đại diện thành công");
    } catch (err: any) {
      toast.error(err.message || "Cập nhật ảnh đại diện thất bại");
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleChangePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("Mật khẩu xác nhận không khớp");
      return;
    }
    setChangingPassword(true);
    try {
      await authApi.changePassword(
        token!,
        passwordForm.currentPassword,
        passwordForm.newPassword,
      );
      toast.success("Đổi mật khẩu thành công");
      setShowPasswordDialog(false);
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (err: any) {
      toast.error(err.message || "Đổi mật khẩu thất bại");
    } finally {
      setChangingPassword(false);
    }
  };

  const handleEditToggle = async () => {
    if (editMode) {
      setSaving(true);
      try {
        const payload: Parameters<typeof userApi.updateMe>[1] = {
          fullName: formState.name,
          phone: formState.phone || undefined,
        };
        if (user.role === "jockey") {
          payload.jockeyProfile = { bio: formState.bio };
        }
        await userApi.updateMe(token!, payload);
        setUser((prev) => ({
          ...prev,
          name: formState.name,
          avatar: getInitials(formState.name),
          phone: formState.phone,
          bio: formState.bio,
        }));
        toast.success("Cập nhật hồ sơ thành công");
      } catch (err: any) {
        toast.error(err.message || "Cập nhật thất bại");
        return;
      } finally {
        setSaving(false);
      }
    } else {
      setFormState({
        name: user.name,
        phone: user.phone,
        dob: user.dob,
        location: user.location,
        bio: user.bio,
      });
    }
    setEditMode(!editMode);
  };

  const winRate = Math.round((user.wonBets / user.totalBets) * 100);

  const infoFields = [
    {
      label: "Họ Và Tên",
      value: user.name,
      formKey: "name" as const,
      icon: User,
      editable: true,
    },
    {
      label: "Tên Đăng Nhập",
      value: user.username,
      formKey: null,
      icon: User,
      editable: false,
    },
    {
      label: "Email",
      value: user.email,
      formKey: null,
      icon: Mail,
      editable: false,
    },
    {
      label: "Số Điện Thoại",
      value: user.phone,
      formKey: "phone" as const,
      icon: Phone,
      editable: true,
    },
    // {
    //   label: "Ngày Sinh",
    //   value: user.dob,
    //   formKey: "dob" as const,
    //   icon: Calendar,
    //   editable: true,
    // },
    // {
    //   label: "Địa Chỉ",
    //   value: user.location,
    //   formKey: "location" as const,
    //   icon: MapPin,
    //   editable: true,
    // },
  ];

  return (
    <div className="min-h-screen bg-slate-950 font-sans">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-950/90 backdrop-blur-lg border-b border-white/5">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate("/spectator")}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors group"
          >
            <div className="w-8 h-8 rounded-lg bg-white/5 group-hover:bg-white/10 flex items-center justify-center transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </div>
            <span className="text-sm font-medium">Quay Lại</span>
          </button>
          <div className="w-px h-5 bg-white/10" />
          {/* <div>
            <div className="text-white font-bold leading-none">
              Hồ Sơ Cá Nhân
            </div>
          </div> */}
        </div>
      </nav>

      <div className="pt-20 max-w-6xl mx-auto px-6 pb-12">
        {/* Hero Banner */}
        <div className="relative mt-6 mb-6">
          {/* Background clip riêng để avatar không bị cắt */}
          <div className="h-40 rounded-2xl overflow-hidden bg-gradient-to-r from-[#FFDE42]/30 via-amber-900/20 to-blue-900/30 relative">
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1568572933382-74d440642117?w=1200')] bg-cover bg-center opacity-10" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent" />
          </div>

          {/* Avatar floating — nằm ngoài overflow-hidden */}
          <div className="absolute left-8 bottom-0 translate-y-1/2">
            <div className="relative">
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-[#FFDE42] to-amber-600 flex items-center justify-center text-3xl font-bold text-slate-900 shadow-2xl border-4 border-slate-950 overflow-hidden">
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  user.avatar || (
                    <User className="w-10 h-10 text-slate-900/50" />
                  )
                )}
              </div>
              <button
                onClick={handleAvatarClick}
                disabled={uploadingAvatar}
                className="absolute -bottom-1 -right-1 w-8 h-8 bg-slate-800 border-2 border-slate-950 rounded-full flex items-center justify-center hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Camera className="w-3.5 h-3.5 text-slate-300" />
              </button>
              {!!user.verified && (
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center border-2 border-slate-950">
                  <Shield className="w-3 h-3 text-white" />
                </div>
              )}
            </div>
          </div>

          {/* Edit Button */}
          <div className="absolute right-6 bottom-4">
            <button
              onClick={handleEditToggle}
              disabled={saving}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-60 ${
                editMode
                  ? "bg-[#FFDE42] text-slate-900"
                  : "bg-white/10 hover:bg-white/20 text-white border border-white/10"
              }`}
            >
              <Edit2 className="w-4 h-4" />
              {saving ? "Đang Lưu..." : editMode ? "Lưu Thay Đổi" : "Chỉnh Sửa"}
            </button>
          </div>
        </div>

        {/* Profile Identity */}
        <div className="ml-36 mb-8">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-white">{user.name}</h1>
            <span className="text-slate-400 text-sm">{user.username}</span>
            <span className="text-xs bg-[#FFDE42]/20 text-[#FFDE42] px-2.5 py-1 rounded-full font-semibold border border-[#FFDE42]/30">
              {user.level}
            </span>
            {user.verified && (
              <span className="text-xs bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded-full font-semibold border border-emerald-500/20 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" /> Đã Xác Minh
              </span>
            )}
          </div>
          <p className="text-slate-400 text-sm mt-1.5 max-w-xl">{user.bio}</p>
          <div className="flex flex-wrap gap-4 mt-3 text-xs text-slate-500">
            {user.location && (
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" />
                {user.location}
              </span>
            )}
            {user.joinDate && (
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                Tham gia {user.joinDate}
              </span>
            )}
            {user.membershipExpiry && (
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                Hội viên đến {user.membershipExpiry}
              </span>
            )}
          </div>
        </div>

        {/* Section Tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-1">
          {[
            { id: "overview", label: "Tổng Quan" },
            { id: "info", label: "Thông Tin" },
            { id: "notifications", label: "Thông Báo" },
            { id: "security", label: "Bảo Mật" },
          ].map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              className={`px-5 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                activeSection === s.id
                  ? "bg-[#FFDE42] text-slate-900 shadow-lg shadow-[#FFDE42]/20"
                  : "bg-white/5 text-slate-400 hover:bg-white/10 border border-white/5"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* ===== OVERVIEW ===== */}
        {activeSection === "overview" && (
          <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                {
                  label: "Số Dư Ví",
                  value: `${user.balance.toLocaleString()} xu`,
                  icon: Coins,
                  color: "from-[#FFDE42] to-amber-600",
                  sub: `≈ ${(user.balance * 1000).toLocaleString()} VND`,
                },
                {
                  label: "Tỷ Lệ Thắng",
                  value: `${winRate}%`,
                  icon: TrendingUp,
                  color: "from-emerald-500 to-emerald-700",
                  sub: `${user.wonBets}/${user.totalBets} cược`,
                },
                {
                  label: "Tổng Đã Thắng",
                  value: `${user.totalWon.toLocaleString()} xu`,
                  icon: Trophy,
                  color: "from-amber-500 to-amber-700",
                  sub: "tổng phần thưởng",
                },
                {
                  label: "Hạng Bảng XH",
                  value: user.rank ? `#${user.rank}` : "—",
                  icon: Award,
                  color: "from-blue-500 to-blue-700",
                  sub: "top 5 khán giả",
                },
              ].map((s, i) => (
                <div
                  key={i}
                  className="bg-white/5 border border-white/5 rounded-2xl p-5 hover:-translate-y-1 transition-all duration-200"
                >
                  <div
                    className={`w-10 h-10 bg-gradient-to-br ${s.color} rounded-xl flex items-center justify-center mb-3 shadow-lg`}
                  >
                    <s.icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-xl font-bold text-white mb-0.5">
                    {s.value}
                  </div>
                  <div className="text-sm text-slate-400 font-medium">
                    {s.label}
                  </div>
                  <div className="text-xs text-slate-600 mt-0.5">{s.sub}</div>
                </div>
              ))}
            </div>

            {/* Win Rate Bar */}
            <div className="bg-white/5 border border-white/5 rounded-2xl p-6">
              <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-[#FFDE42]" /> Thống Kê Cược
              </h3>
              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-400">Tỷ Lệ Thắng</span>
                    <span className="text-white font-semibold">{winRate}%</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2.5">
                    <div
                      className="bg-gradient-to-r from-[#FFDE42] to-emerald-500 h-2.5 rounded-full transition-all"
                      style={{ width: `${winRate}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-slate-600 mt-1">
                    <span>0%</span>
                    <span>100%</span>
                  </div>
                </div>
                <div className="space-y-3">
                  {[
                    {
                      label: "Cược Thắng",
                      value: user.wonBets,
                      color: "bg-[#FFDE42]",
                    },
                    {
                      label: "Cược Thua",
                      value: user.totalBets - user.wonBets - 1,
                      color: "bg-red-500",
                    },
                    { label: "Đang Chờ", value: 0, color: "bg-slate-500" },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-2.5 h-2.5 rounded-full ${item.color}`}
                        />
                        <span className="text-slate-400 text-sm">
                          {item.label}
                        </span>
                      </div>
                      <span className="text-white font-semibold text-sm">
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="bg-slate-900/60 rounded-xl p-4 text-center">
                  <div className="text-3xl font-bold text-[#FFDE42] mb-1">
                    {user.streak}
                  </div>
                  <div className="text-white font-semibold flex items-center justify-center gap-1">
                    <Flame className="w-4 h-4 text-orange-400" /> Chuỗi Thắng
                  </div>
                  <div className="text-slate-500 text-xs mt-1">
                    liên tiếp hiện tại
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white/5 border border-white/5 rounded-2xl p-6">
              <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-400" /> Hoạt Động Gần Đây
              </h3>
              <div className="space-y-3">
                {recentActivity.map((act, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 transition-colors"
                  >
                    <div
                      className={`w-2 h-2 rounded-full flex-shrink-0 ${act.dot}`}
                    />
                    <div className="flex-1">
                      <div className="text-white text-sm font-medium">
                        {act.title}
                      </div>
                      <div className="text-slate-500 text-xs mt-0.5">
                        {act.time}
                      </div>
                    </div>
                    <span className={`font-bold text-sm ${act.color}`}>
                      {act.amount}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ===== THÔNG TIN ===== */}
        {activeSection === "info" && (
          <div className="space-y-6">
            <div className="bg-white/5 border border-white/5 rounded-2xl p-6">
              <h3 className="text-white font-bold mb-6 flex items-center gap-2">
                <User className="w-5 h-5 text-blue-400" /> Thông Tin Cá Nhân
              </h3>
              <div className="grid md:grid-cols-2 gap-6">
                {infoFields.map((field, i) => (
                  <div key={i}>
                    <label className="text-xs text-slate-500 uppercase tracking-wide font-semibold mb-2 flex items-center gap-1.5">
                      <field.icon className="w-3.5 h-3.5" /> {field.label}
                    </label>
                    {editMode && field.editable ? (
                      <input
                        value={
                          field.formKey ? formState[field.formKey] : field.value
                        }
                        onChange={
                          field.formKey
                            ? (e) =>
                                setFormState((prev) => ({
                                  ...prev,
                                  [field.formKey!]: e.target.value,
                                }))
                            : undefined
                        }
                        className="w-full bg-slate-800/60 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#FFDE42]/60 focus:ring-1 focus:ring-[#FFDE42]/20 transition-all"
                      />
                    ) : (
                      <div className="flex items-center justify-between bg-slate-900/40 rounded-xl px-4 py-3 border border-white/5">
                        <span className="text-white text-sm">
                          {field.value || "—"}
                        </span>
                        {!field.editable && (
                          <span className="text-xs text-slate-600 border border-slate-700 px-2 py-0.5 rounded">
                            Cố định
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {user.role === "jockey" && (
                <div className="mt-6">
                  <label className="text-xs text-slate-500 uppercase tracking-wide font-semibold mb-2 block">
                    Giới Thiệu Bản Thân
                  </label>
                  {editMode ? (
                    <textarea
                      value={formState.bio}
                      onChange={(e) =>
                        setFormState((prev) => ({
                          ...prev,
                          bio: e.target.value,
                        }))
                      }
                      rows={3}
                      className="w-full bg-slate-800/60 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#FFDE42]/60 resize-none transition-all"
                    />
                  ) : (
                    <div className="bg-slate-900/40 rounded-xl px-4 py-3 border border-white/5 text-white text-sm min-h-[72px]">
                      {user.bio || (
                        <span className="text-slate-500">
                          Chưa có giới thiệu
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Membership Info */}
            {/* <div className="bg-gradient-to-br from-[#FFDE42]/10 via-amber-900/5 to-transparent border border-[#FFDE42]/20 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-bold flex items-center gap-2">
                  <Award className="w-5 h-5 text-[#FFDE42]" /> Hội Viên
                </h3>
                <span className="text-xs bg-[#FFDE42]/20 text-[#FFDE42] px-3 py-1 rounded-full font-bold border border-[#FFDE42]/30">
                  {user.level}
                </span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                {[
                  { label: 'Ngày Tham Gia',  value: user.joinDate || '—' },
                  { label: 'Hạn Hội Viên',   value: user.membershipExpiry || '—' },
                  { label: 'Tổng Nạp',       value: user.totalDeposited ? `$${user.totalDeposited.toLocaleString()}` : '—' },
                  { label: 'Điểm Uy Tín',    value: '4.8 / 5.0 ⭐' },
                ].map((item, i) => (
                  <div key={i} className="bg-slate-900/40 rounded-xl p-3">
                    <div className="text-slate-400 text-xs mb-1">{item.label}</div>
                    <div className="text-white font-semibold">{item.value}</div>
                  </div>
                ))}
              </div>
              <div className="mt-4">
                <div className="flex justify-between text-xs text-slate-400 mb-1.5">
                  <span>Tiến Trình Lên Hạng Bạch Kim</span>
                  <span>$2,000 / $5,000</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2">
                  <div className="bg-gradient-to-r from-[#FFDE42] to-amber-500 h-2 rounded-full" style={{ width: '40%' }} />
                </div>
                <p className="text-xs text-slate-500 mt-1.5">Nạp thêm $3,000 để lên hạng Bạch Kim và nhận ưu đãi độc quyền.</p>
              </div>
            </div> */}
          </div>
        )}

        {/* ===== THÔNG BÁO ===== */}
        {activeSection === "notifications" && (
          <div className="bg-white/5 border border-white/5 rounded-2xl p-6 space-y-4">
            <h3 className="text-white font-bold mb-2 flex items-center gap-2">
              <Bell className="w-5 h-5 text-blue-400" /> Cài Đặt Thông Báo
            </h3>
            {[
              {
                label: "Kết Quả Cược",
                sub: "Nhận thông báo khi cược thắng hoặc thua",
                val: notifBet,
                set: setNotifBet,
              },
              {
                label: "Nạp Tiền",
                sub: "Xác nhận giao dịch nạp tiền thành công",
                val: notifDeposit,
                set: setNotifDeposit,
              },
              {
                label: "Khuyến Mãi",
                sub: "Ưu đãi, sự kiện và phần thưởng đặc biệt",
                val: notifPromo,
                set: setNotifPromo,
              },
              {
                label: "Kết Quả Cuộc Đua",
                sub: "Thông báo ngay khi kết quả cuộc đua được công bố",
                val: notifResult,
                set: setNotifResult,
              },
            ].map((item, i) => (
              <div
                key={i}
                className="flex items-center justify-between py-4 border-b border-white/5 last:border-0"
              >
                <div>
                  <div className="text-white font-medium text-sm">
                    {item.label}
                  </div>
                  <div className="text-slate-500 text-xs mt-0.5">
                    {item.sub}
                  </div>
                </div>
                <button
                  onClick={() => item.set(!item.val)}
                  className={`relative w-12 h-6 rounded-full transition-all duration-300 ${item.val ? "bg-[#FFDE42]" : "bg-slate-700"}`}
                >
                  <div
                    className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-300 ${item.val ? "left-7" : "left-1"}`}
                  />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* ===== BẢO MẬT ===== */}
        {activeSection === "security" && (
          <div className="space-y-4">
            <div className="bg-white/5 border border-white/5 rounded-2xl p-6">
              <h3 className="text-white font-bold mb-5 flex items-center gap-2">
                <Shield className="w-5 h-5 text-emerald-400" /> Bảo Mật Tài
                Khoản
              </h3>
              <div className="space-y-3">
                {[
                  {
                    label: "Đổi Mật Khẩu",
                    icon: Lock,
                    desc: "Cập nhật mật khẩu định kỳ để bảo mật",
                    badge: "",
                    onClick: () => setShowPasswordDialog(true),
                  },
                ].map((item, i) => (
                  <div
                    key={i}
                    onClick={item.onClick}
                    className="flex items-center justify-between p-4 bg-slate-900/40 rounded-xl border border-white/5 hover:border-white/10 transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                        <item.icon className="w-5 h-5 text-slate-400" />
                      </div>
                      <div>
                        <div className="text-white font-medium text-sm">
                          {item.label}
                        </div>
                        <div className="text-slate-500 text-xs mt-0.5">
                          {item.desc}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {item.badge && (
                        <span
                          className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                            item.badge === "Đã xác minh"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : "bg-red-500/10 text-red-400 border border-red-500/20"
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                      <ChevronRight className="w-4 h-4 text-slate-600" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-6">
              <h3 className="text-red-400 font-bold mb-4 flex items-center gap-2">
                <Lock className="w-5 h-5" /> Vùng Nguy Hiểm
              </h3>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-white font-medium text-sm">Xoá Tài Khoản</div>
                  <div className="text-slate-500 text-xs mt-0.5">Hành động này không thể hoàn tác. Toàn bộ dữ liệu sẽ bị xoá vĩnh viễn.</div>
                </div>
                <button className="px-4 py-2 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 text-sm font-semibold hover:bg-red-500/20 transition-colors">
                  Xoá Tài Khoản
                </button>
              </div>
            </div> */}
          </div>
        )}
      </div>

      {/* Change Password Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent className="bg-slate-900 border border-white/10 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Lock className="w-5 h-5 text-[#FFDE42]" /> Đổi Mật Khẩu
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            {[
              {
                label: "Mật khẩu hiện tại",
                key: "currentPassword" as const,
                placeholder: "Nhập mật khẩu hiện tại",
              },
              {
                label: "Mật khẩu mới",
                key: "newPassword" as const,
                placeholder: "Tối thiểu 8 ký tự",
              },
              {
                label: "Xác nhận mật khẩu",
                key: "confirmPassword" as const,
                placeholder: "Nhập lại mật khẩu mới",
              },
            ].map((field) => (
              <div key={field.key}>
                <label className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-1.5 block">
                  {field.label}
                </label>
                <input
                  type="password"
                  placeholder={field.placeholder}
                  value={passwordForm[field.key]}
                  onChange={(e) =>
                    setPasswordForm((prev) => ({
                      ...prev,
                      [field.key]: e.target.value,
                    }))
                  }
                  className="w-full bg-slate-800/60 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-[#FFDE42]/60 focus:ring-1 focus:ring-[#FFDE42]/20 transition-all"
                />
              </div>
            ))}

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => {
                  setShowPasswordDialog(false);
                  setPasswordForm({
                    currentPassword: "",
                    newPassword: "",
                    confirmPassword: "",
                  });
                }}
                className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 text-slate-300 text-sm font-semibold hover:bg-white/10 border border-white/10 transition-all"
              >
                Hủy
              </button>
              <button
                onClick={handleChangePassword}
                disabled={
                  changingPassword ||
                  !passwordForm.currentPassword ||
                  !passwordForm.newPassword
                }
                className="flex-1 px-4 py-2.5 rounded-xl bg-[#FFDE42] text-slate-900 text-sm font-bold hover:bg-[#FFE862] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {changingPassword ? "Đang lưu..." : "Xác nhận"}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Hidden file input for avatar upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleAvatarFileChange}
        style={{ display: "none" }}
      />
    </div>
  );
}
