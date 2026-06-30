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
  Eye,
  EyeOff,
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
    title: "Thắng dự đoán – Thunder Strike",
    amount: "+$300",
    time: "5 phút trước",
    color: "text-[#C9A227]",
    dot: "bg-[#C9A227]",
  },
  {
    type: "bet",
    title: "Dự đoán – Golden Arrow",
    amount: "-$50",
    time: "2 giờ trước",
    color: "text-primary",
    dot: "bg-primary",
  },
  {
    type: "deposit",
    title: "Nạp tiền thành công",
    amount: "+$500",
    time: "1 ngày trước",
    color: "text-primary",
    dot: "bg-primary",
  },
  {
    type: "lost",
    title: "Thua dự đoán – Storm Chaser",
    amount: "-$200",
    time: "2 ngày trước",
    color: "text-[#B42318]",
    dot: "bg-[#B42318]",
  },
  {
    type: "deposit",
    title: "Nạp tiền thành công",
    amount: "+$200",
    time: "3 ngày trước",
    color: "text-primary",
    dot: "bg-primary",
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
  const [showPasswordFields, setShowPasswordFields] = useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
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
    jockeyStyle: "balanced" as "aggressive" | "balanced" | "conservative",
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
          jockeyStyle: (data.jockeyProfile?.style ?? 'balanced') as "aggressive" | "balanced" | "conservative",
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
          payload.jockeyProfile = { bio: formState.bio, style: formState.jockeyStyle };
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
        jockeyStyle: formState.jockeyStyle,
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
    <div className="min-h-screen bg-background font-sans">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-lg border-b border-border">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate("/spectator")}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors group"
          >
            <div className="w-8 h-8 rounded-lg bg-card group-hover:bg-muted flex items-center justify-center transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </div>
            <span className="text-sm font-medium">Quay Lại</span>
          </button>
          <div className="w-px h-5 bg-muted" />
          {/* <div>
            <div className="text-foreground font-bold leading-none">
              Hồ Sơ Cá Nhân
            </div>
          </div> */}
        </div>
      </nav>

      <div className="pt-20 max-w-6xl mx-auto px-6 pb-12">
        {/* Hero Banner */}
        <div className="relative mt-6 mb-6">
          {/* Background clip riêng để avatar không bị cắt */}
          <div className="h-40 rounded-2xl overflow-hidden bg-gradient-to-r from-gold/25 via-gold/10 to-secondary/20 relative">
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1568572933382-74d440642117?w=1200')] bg-cover bg-center opacity-10" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#23201A]/50 to-transparent" />
          </div>

          {/* Avatar floating — nằm ngoài overflow-hidden */}
          <div className="absolute left-8 bottom-0 translate-y-1/2">
            <div className="relative">
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-[#C9A227] to-[#8F7318] flex items-center justify-center text-3xl font-bold text-[#23201A] shadow-2xl border-4 border-border overflow-hidden">
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  user.avatar || (
                    <User className="w-10 h-10 text-[#23201A]/50" />
                  )
                )}
              </div>
              <button
                onClick={handleAvatarClick}
                disabled={uploadingAvatar}
                className="absolute -bottom-1 -right-1 w-8 h-8 bg-muted border-2 border-border rounded-full flex items-center justify-center hover:bg-muted/70 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Camera className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
              {!!user.verified && (
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-primary rounded-full flex items-center justify-center border-2 border-border">
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
                  ? "bg-[#C9A227] text-[#23201A]"
                  : "bg-muted hover:bg-muted text-foreground border border-border"
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
            <h1 className="font-serif text-2xl font-bold text-foreground">{user.name}</h1>
            <span className="text-muted-foreground text-sm">{user.username}</span>
            <span className="text-xs bg-[#C9A227]/20 text-[#C9A227] px-2.5 py-1 rounded-full font-semibold border border-[#C9A227]/30">
              {user.level}
            </span>
          </div>
          <p className="text-muted-foreground text-sm mt-1.5 max-w-xl">{user.bio}</p>
          <div className="flex flex-wrap gap-4 mt-3 text-xs text-muted-foreground">
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
                  ? "bg-[#C9A227] text-[#23201A] shadow-lg shadow-[#C9A227]/20"
                  : "bg-card text-muted-foreground hover:bg-muted border border-border"
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
                  value: `${user.balance.toLocaleString('vi-VN')} coins`,
                  icon: Coins,
                  color: "from-[#C9A227] to-[#8F7318]",
                  sub: "số dư hiện tại",
                },
                {
                  label: "Tỷ Lệ Thắng",
                  value: `${winRate}%`,
                  icon: TrendingUp,
                  color: "from-[#1F3D2B] to-[#172D20]",
                  sub: `${user.wonBets}/${user.totalBets} dự đoán`,
                },
                {
                  label: "Tổng Đã Thắng",
                  value: `${user.totalWon.toLocaleString('vi-VN')} coins`,
                  icon: Trophy,
                  color: "from-[#C9A227] to-[#8F7318]",
                  sub: "tổng phần thưởng",
                },
                {
                  label: "Hạng Bảng XH",
                  value: user.rank ? `#${user.rank}` : "—",
                  icon: Award,
                  color: "from-[#8C2F1B] to-[#6B2415]",
                  sub: "top 5 khán giả",
                },
              ].map((s, i) => (
                <div
                  key={i}
                  className="bg-card border border-border rounded-2xl p-5 hover:-translate-y-1 transition-all duration-200"
                >
                  <div
                    className={`w-10 h-10 bg-gradient-to-br ${s.color} rounded-xl flex items-center justify-center mb-3 shadow-lg`}
                  >
                    <s.icon className="w-5 h-5 text-foreground" />
                  </div>
                  <div className="font-serif text-xl font-bold text-foreground mb-0.5">
                    {s.value}
                  </div>
                  <div className="text-sm text-muted-foreground font-medium">
                    {s.label}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">{s.sub}</div>
                </div>
              ))}
            </div>

            {/* Win Rate Bar */}
            <div className="bg-card border border-border rounded-2xl p-6">
              <h3 className="text-foreground font-bold mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-[#C9A227]" /> Thống Kê Dự Đoán
              </h3>
              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Tỷ Lệ Thắng</span>
                    <span className="text-foreground font-semibold">{winRate}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2.5">
                    <div
                      className="bg-gradient-to-r from-[#C9A227] to-[#1F3D2B] h-2.5 rounded-full transition-all"
                      style={{ width: `${winRate}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>0%</span>
                    <span>100%</span>
                  </div>
                </div>
                <div className="space-y-3">
                  {[
                    {
                      label: "Dự Đoán Thắng",
                      value: user.wonBets,
                      color: "bg-[#C9A227]",
                    },
                    {
                      label: "Dự Đoán Thua",
                      value: user.totalBets - user.wonBets - 1,
                      color: "bg-[#B42318]",
                    },
                    { label: "Đang Chờ", value: 0, color: "bg-[#7A7468]" },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-2.5 h-2.5 rounded-full ${item.color}`}
                        />
                        <span className="text-muted-foreground text-sm">
                          {item.label}
                        </span>
                      </div>
                      <span className="text-foreground font-semibold text-sm">
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="bg-muted/50 rounded-xl p-4 text-center">
                  <div className="text-3xl font-bold text-[#C9A227] mb-1">
                    {user.streak}
                  </div>
                  <div className="text-foreground font-semibold flex items-center justify-center gap-1">
                    <Flame className="w-4 h-4 text-orange-400" /> Chuỗi Thắng
                  </div>
                  <div className="text-muted-foreground text-xs mt-1">
                    liên tiếp hiện tại
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-card border border-border rounded-2xl p-6">
              <h3 className="text-foreground font-bold mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" /> Hoạt Động Gần Đây
              </h3>
              <div className="space-y-3">
                {recentActivity.map((act, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-4 p-3 rounded-xl hover:bg-muted transition-colors"
                  >
                    <div
                      className={`w-2 h-2 rounded-full flex-shrink-0 ${act.dot}`}
                    />
                    <div className="flex-1">
                      <div className="text-foreground text-sm font-medium">
                        {act.title}
                      </div>
                      <div className="text-muted-foreground text-xs mt-0.5">
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
            <div className="bg-card border border-border rounded-2xl p-6">
              <h3 className="text-foreground font-bold mb-6 flex items-center gap-2">
                <User className="w-5 h-5 text-primary" /> Thông Tin Cá Nhân
              </h3>
              <div className="grid md:grid-cols-2 gap-6">
                {infoFields.map((field, i) => (
                  <div key={i}>
                    <label className="text-xs text-muted-foreground uppercase tracking-wide font-semibold mb-2 flex items-center gap-1.5">
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
                        className="w-full bg-muted/60 border border-border rounded-xl px-4 py-3 text-foreground text-sm focus:outline-none focus:border-[#C9A227]/60 focus:ring-1 focus:ring-[#C9A227]/20 transition-all"
                      />
                    ) : (
                      <div className="flex items-center justify-between bg-card/40 rounded-xl px-4 py-3 border border-border">
                        <span className="text-foreground text-sm">
                          {field.value || "—"}
                        </span>
                        {!field.editable && (
                          <span className="text-xs text-muted-foreground border border-border px-2 py-0.5 rounded">
                            Cố định
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {user.role === "jockey" && (
                <div className="mt-6 space-y-5">
                  <div>
                    <label className="text-xs text-muted-foreground uppercase tracking-wide font-semibold mb-2 block">
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
                        className="w-full bg-muted/60 border border-border rounded-xl px-4 py-3 text-foreground text-sm focus:outline-none focus:border-[#C9A227]/60 resize-none transition-all"
                      />
                    ) : (
                      <div className="bg-card/40 rounded-xl px-4 py-3 border border-border text-foreground text-sm min-h-[72px]">
                        {user.bio || (
                          <span className="text-muted-foreground">
                            Chưa có giới thiệu
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Riding style selector */}
                  <div>
                    <label className="text-xs text-muted-foreground uppercase tracking-wide font-semibold mb-2 block">
                      Phong Cách Cưỡi
                    </label>
                    {editMode ? (
                      <div className="grid grid-cols-3 gap-2">
                        {([
                          { value: "aggressive", label: "Aggressive", desc: "Dẫn đầu sớm", icon: "⚡" },
                          { value: "balanced",   label: "Balanced",   desc: "Ổn định đều",  icon: "⚖️" },
                          { value: "conservative", label: "Conservative", desc: "Bứt phá cuối", icon: "🎯" },
                        ] as const).map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => setFormState(prev => ({ ...prev, jockeyStyle: opt.value }))}
                            className={`flex flex-col items-center gap-1 p-3 rounded-xl border text-sm font-medium transition-all ${
                              formState.jockeyStyle === opt.value
                                ? "border-[#C9A227] bg-[#C9A227]/10 text-[#C9A227]"
                                : "border-border bg-muted/40 text-muted-foreground hover:border-primary"
                            }`}
                          >
                            <span className="text-lg">{opt.icon}</span>
                            <span>{opt.label}</span>
                            <span className="text-[10px] opacity-70">{opt.desc}</span>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-card/40 rounded-xl px-4 py-3 border border-border text-foreground text-sm flex items-center gap-2">
                        {formState.jockeyStyle === "aggressive" && <><span>⚡</span><span>Aggressive — Dẫn đầu sớm</span></>}
                        {formState.jockeyStyle === "balanced"   && <><span>⚖️</span><span>Balanced — Ổn định đều</span></>}
                        {formState.jockeyStyle === "conservative" && <><span>🎯</span><span>Conservative — Bứt phá cuối</span></>}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Membership Info */}
            {/* <div className="bg-gradient-to-br from-[#C9A227]/10 via-amber-900/5 to-transparent border border-[#C9A227]/20 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-foreground font-bold flex items-center gap-2">
                  <Award className="w-5 h-5 text-[#C9A227]" /> Hội Viên
                </h3>
                <span className="text-xs bg-[#C9A227]/20 text-[#C9A227] px-3 py-1 rounded-full font-bold border border-[#C9A227]/30">
                  {user.level}
                </span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                {[
                  { label: 'Ngày Tham Gia',  value: user.joinDate || '—' },
                  { label: 'Hạn Hội Viên',   value: user.membershipExpiry || '—' },
                  { label: 'Tổng Nạp',       value: user.totalDeposited ? `${user.totalDeposited.toLocaleString('vi-VN')} coins` : '—' },
                  { label: 'Điểm Uy Tín',    value: '4.8 / 5.0 ⭐' },
                ].map((item, i) => (
                  <div key={i} className="bg-card/40 rounded-xl p-3">
                    <div className="text-muted-foreground text-xs mb-1">{item.label}</div>
                    <div className="text-foreground font-semibold">{item.value}</div>
                  </div>
                ))}
              </div>
              <div className="mt-4">
                <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                  <span>Tiến Trình Lên Hạng Bạch Kim</span>
                  <span>$2,000 / $5,000</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="bg-gradient-to-r from-[#C9A227] to-[#B08D1E] h-2 rounded-full" style={{ width: '40%' }} />
                </div>
                <p className="text-xs text-muted-foreground mt-1.5">Nạp thêm $3,000 để lên hạng Bạch Kim và nhận ưu đãi độc quyền.</p>
              </div>
            </div> */}
          </div>
        )}

        {/* ===== THÔNG BÁO ===== */}
        {activeSection === "notifications" && (
          <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
            <h3 className="text-foreground font-bold mb-2 flex items-center gap-2">
              <Bell className="w-5 h-5 text-primary" /> Cài Đặt Thông Báo
            </h3>
            {[
              {
                label: "Kết Quả Dự Đoán",
                sub: "Nhận thông báo khi dự đoán thắng hoặc thua",
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
                className="flex items-center justify-between py-4 border-b border-border last:border-0"
              >
                <div>
                  <div className="text-foreground font-medium text-sm">
                    {item.label}
                  </div>
                  <div className="text-muted-foreground text-xs mt-0.5">
                    {item.sub}
                  </div>
                </div>
                <button
                  onClick={() => item.set(!item.val)}
                  className={`relative w-12 h-6 rounded-full transition-all duration-300 ${item.val ? "bg-[#C9A227]" : "bg-muted"}`}
                >
                  <div
                    className={`absolute top-1 w-4 h-4 bg-[#FFFFFF] rounded-full shadow transition-all duration-300 ${item.val ? "left-7" : "left-1"}`}
                  />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* ===== BẢO MẬT ===== */}
        {activeSection === "security" && (
          <div className="space-y-4">
            <div className="bg-card border border-border rounded-2xl p-6">
              <h3 className="text-foreground font-bold mb-5 flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" /> Bảo Mật Tài
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
                    className="flex items-center justify-between p-4 bg-card/40 rounded-xl border border-border hover:border-border transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-card flex items-center justify-center">
                        <item.icon className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div>
                        <div className="text-foreground font-medium text-sm">
                          {item.label}
                        </div>
                        <div className="text-muted-foreground text-xs mt-0.5">
                          {item.desc}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {item.badge && (
                        <span
                          className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                            item.badge === "Đã xác minh"
                              ? "bg-primary/10 text-primary border border-primary/20"
                              : "bg-[#B42318]/10 text-[#B42318] border border-[#B42318]/20"
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* <div className="bg-[#B42318]/5 border border-[#B42318]/20 rounded-2xl p-6">
              <h3 className="text-[#B42318] font-bold mb-4 flex items-center gap-2">
                <Lock className="w-5 h-5" /> Vùng Nguy Hiểm
              </h3>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-foreground font-medium text-sm">Xoá Tài Khoản</div>
                  <div className="text-muted-foreground text-xs mt-0.5">Hành động này không thể hoàn tác. Toàn bộ dữ liệu sẽ bị xoá vĩnh viễn.</div>
                </div>
                <button className="px-4 py-2 rounded-xl bg-[#B42318]/10 text-[#B42318] border border-[#B42318]/20 text-sm font-semibold hover:bg-red-500/20 transition-colors">
                  Xoá Tài Khoản
                </button>
              </div>
            </div> */}
          </div>
        )}
      </div>

      {/* Change Password Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent className="bg-card border border-border text-foreground max-w-md">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-2">
              <Lock className="w-5 h-5 text-[#C9A227]" /> Đổi Mật Khẩu
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
                <label className="text-xs text-muted-foreground font-semibold uppercase tracking-wide mb-1.5 block">
                  {field.label}
                </label>
                <div className="relative">
                  <input
                    type={showPasswordFields[field.key] ? "text" : "password"}
                    placeholder={field.placeholder}
                    value={passwordForm[field.key]}
                    onChange={(e) =>
                      setPasswordForm((prev) => ({
                        ...prev,
                        [field.key]: e.target.value,
                      }))
                    }
                    className="w-full bg-muted/60 border border-border rounded-xl px-4 py-3 pr-11 text-foreground text-sm placeholder-muted-foreground focus:outline-none focus:border-[#C9A227]/60 focus:ring-1 focus:ring-[#C9A227]/20 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setShowPasswordFields((prev) => ({
                        ...prev,
                        [field.key]: !prev[field.key],
                      }))
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPasswordFields[field.key] ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
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
                className="flex-1 px-4 py-2.5 rounded-xl bg-card text-muted-foreground text-sm font-semibold hover:bg-muted border border-border transition-all"
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
                className="flex-1 px-4 py-2.5 rounded-xl bg-[#C9A227] text-[#23201A] text-sm font-bold hover:bg-[#D9B53C] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
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
