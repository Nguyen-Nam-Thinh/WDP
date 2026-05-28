import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
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
  Send
} from 'lucide-react';
import { Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions, Chip, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar
} from 'recharts';
import { ProfileDropdown } from '../components/ProfileDropdown';
import { useAuth } from '../hooks/useAuth';

export function HorseOwnerDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      navigate('/');
    }
  }, [user, navigate]);
  const [activeTab, setActiveTab] = useState('horses');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Dialogs
  const [addHorseOpen, setAddHorseOpen] = useState(false);
  const [registerRaceOpen, setRegisterRaceOpen] = useState(false);
  const [inviteJockeyOpen, setInviteJockeyOpen] = useState(false);
  const [topupOpen, setTopupOpen] = useState(false);

  // MOCK DATA
  const horses = [
    { id: 1, name: 'Tia Chớp', age: 4, breed: 'Thuần Chủng', grade: 'G1', status: 'Hoạt Động', wins: 12, totalRaces: 15, earnings: '$125,000', points: 1500, image: 'https://images.unsplash.com/photo-1598974357801-cbca100e65d3?w=800' },
    { id: 2, name: 'Mũi Tên Vàng', age: 3, breed: 'Ả Rập', grade: 'G2', status: 'Nghỉ Ngơi', wins: 8, totalRaces: 10, earnings: '$89,500', points: 950, image: 'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?w=800' },
    { id: 3, name: 'Thần Gió', age: 5, breed: 'Quarter Horse', grade: 'Mới', status: 'Sẵn Sàng', wins: 0, totalRaces: 2, earnings: '$1,300', points: 50, image: 'https://images.unsplash.com/photo-1598974357801-cbca100e65d3?w=800' },
  ];

  const jockeys = [
    { id: 1, name: 'Nguyễn Văn A', experience: '12 năm', wins: 156, winRate: '25%', status: 'Sẵn Sàng', ranking: 'A' },
    { id: 2, name: 'Trần Thị B', experience: '8 năm', wins: 98, winRate: '18%', status: 'Đang Thi Đấu', ranking: 'B' },
    { id: 3, name: 'Lê Văn C', experience: '15 năm', wins: 203, winRate: '28%', status: 'Sẵn Sàng', ranking: 'S' },
  ];

  const preferredJockeys = [
    { id: 1, name: 'Nguyễn Văn A', racesTogether: 10, winsTogether: 5, winRate: '50%' }
  ];

  const upcomingRaces = [
    { id: 1, date: '2026-05-25', time: '14:00', tournament: 'Giải Vô Địch Mùa Xuân', horse: 'Tia Chớp', jockey: 'Nguyễn Văn A', status: 'Đã Xác Nhận', fee: '$500' },
    { id: 2, date: '2026-05-28', time: '15:30', tournament: 'Cúp Vàng', horse: 'Mũi Tên Vàng', jockey: 'Đang Chờ', status: 'Đang Mở Đăng Ký', fee: '$300' },
    { id: 3, date: '2026-06-02', time: '13:00', tournament: 'Giải Derby Mùa Hè', horse: 'Thần Gió', jockey: 'Trần Thị B', status: 'Chờ Xác Nhận', fee: '$200' },
  ];

  const performanceData = [
    { month: 'T1', earnings: 15000, points: 200 },
    { month: 'T2', earnings: 25000, points: 350 },
    { month: 'T3', earnings: 18000, points: 250 },
    { month: 'T4', earnings: 42000, points: 500 },
    { month: 'T5', earnings: 55000, points: 800 },
  ];

  const transactions = [
    { id: 1, date: '2026-05-20', type: 'Giải Thưởng', description: 'Hạng 1 - Giải Mùa Xuân', amount: 25000, status: 'completed' },
    { id: 2, date: '2026-05-18', type: 'Phí Đăng Ký', description: 'Giải Vô Địch Mùa Xuân', amount: -500, status: 'completed' },
    { id: 3, date: '2026-05-15', type: 'Nạp Tiền', description: 'Chuyển Khoản Ngân Hàng', amount: 5000, status: 'completed' },
    { id: 4, date: '2026-05-10', type: 'Hoàn Tiền', description: 'Giải Bị Hủy - Đường C', amount: 300, status: 'completed' },
  ];

  const stats = [
    { label: 'Tổng Số Ngựa', value: '3', icon: Sparkles, color: 'from-blue-500 to-blue-700' },
    { label: 'Kỵ Sĩ Hoạt Động', value: '1', icon: Users, color: 'from-purple-500 to-purple-700' },
    { label: 'Tổng Chiến Thắng', value: '20', icon: Trophy, color: 'from-amber-500 to-amber-700' },
    { label: 'Số Dư Ví', value: '$45,800', icon: Wallet, color: 'from-[#FFDE42] to-[#1B0C0C]' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 font-sans">
      {/* Top Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-lg border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="cursor-pointer" onClick={() => navigate('/')}>
              <img src="/images/logo.png" alt="RaceTrack Logo" className="w-12 h-12 object-contain drop-shadow-md" />
            </div>
            <div>
              <div className="text-white font-semibold">Cổng Chủ Ngựa</div>
              <div className="text-sm text-slate-400">Xin chào, Nguyễn Văn A</div>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-4">
            <ProfileDropdown />
          </div>

          <button className="md:hidden text-white" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </nav>

      <div className="pt-24 max-w-7xl mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, idx) => (
            <div key={idx} className="bg-white/5 backdrop-blur-md border border-white/5 rounded-2xl p-5 hover:-translate-y-1 transition-transform">
              <div className={`w-10 h-10 bg-gradient-to-br ${stat.color} rounded-lg flex items-center justify-center mb-3 shadow-lg`}>
                <stat.icon className="w-5 h-5 text-white" />
              </div>
              <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
              <div className="text-sm text-slate-400 font-medium">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {[
            { id: 'horses', label: 'Ngựa Của Tôi', icon: Sparkles },
            { id: 'jockeys', label: 'Kỵ Sĩ', icon: Users },
            { id: 'schedule', label: 'Lịch Đua', icon: Calendar },
            { id: 'results', label: 'Thành Tích', icon: TrendingUp },
            { id: 'wallet', label: 'Ví Tiền', icon: Wallet }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all whitespace-nowrap font-medium ${
                activeTab === tab.id
                  ? 'bg-[#FFDE42] text-[#1B0C0C] shadow-lg shadow-[#FFDE42]/25'
                  : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white border border-white/5'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content: Horses */}
        {activeTab === 'horses' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-3xl font-bold text-white mb-2">Ngựa Của Tôi</h2>
                <p className="text-slate-400">Quản lý đàn ngựa và đăng ký ngựa mới</p>
              </div>
              <Button
                variant="contained"
                startIcon={<Plus />}
                onClick={() => setAddHorseOpen(true)}
                sx={{
                  background: 'linear-gradient(135deg, #FFDE42 0%, #1B0C0C 100%)',
                  textTransform: 'none',
                  fontWeight: 600,
                  boxShadow: '0 4px 6px -1px rgba(255, 222, 66, 0.2)',
                  '&:hover': { background: 'linear-gradient(135deg, #FFDE42 0%, #4C5C2D 100%)' }
                }}
              >
                Đăng Ký Ngựa
              </Button>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {horses.map(horse => (
                <div key={horse.id} className="group bg-white/5 backdrop-blur-md border border-white/5 rounded-2xl overflow-hidden hover:border-[#FFDE42]/30 transition-all">
                  <div className="h-48 overflow-hidden relative">
                    <img src={horse.image} alt={horse.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                    <div className="absolute top-4 right-4">
                      <Chip
                        label={horse.status}
                        size="small"
                        sx={{
                          backgroundColor: horse.status === 'Active' ? '#10b981' : horse.status === 'Ready' ? '#3b82f6' : '#64748b',
                          color: 'white',
                          fontWeight: 500,
                          backdropFilter: 'blur(4px)'
                        }}
                      />
                    </div>
                    <div className="absolute top-4 left-4">
                      <Chip
                        label={horse.grade}
                        size="small"
                        sx={{ backgroundColor: '#f59e0b', color: 'white', fontWeight: 600 }}
                      />
                    </div>
                  </div>

                  <div className="p-6">
                    <h3 className="text-xl font-bold text-white mb-1">{horse.name}</h3>
                    <p className="text-sm text-slate-400 mb-4">{horse.breed} • {horse.age} tuổi</p>

                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="bg-slate-900/50 p-3 rounded-xl border border-white/5">
                        <div className="text-xs text-slate-400 mb-1">Tỷ Lệ Thắng</div>
                        <div className="text-[#FFDE42] font-semibold">{Math.round((horse.wins / horse.totalRaces) * 100) || 0}%</div>
                      </div>
                      <div className="bg-slate-900/50 p-3 rounded-xl border border-white/5">
                        <div className="text-xs text-slate-400 mb-1">Thu Nhập</div>
                        <div className="text-white font-semibold">{horse.earnings}</div>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <Button
                        fullWidth
                        variant="outlined"
                        sx={{
                          borderColor: 'rgba(255,255,255,0.1)',
                          color: 'white',
                          textTransform: 'none',
                          '&:hover': { borderColor: 'rgba(255,255,255,0.2)', backgroundColor: 'rgba(255,255,255,0.05)' }
                        }}
                      >
                        Chỉnh Sửa
                      </Button>
                      <Button
                        fullWidth
                        variant="outlined"
                        onClick={() => setActiveTab('results')}
                        sx={{
                          borderColor: '#FFDE42',
                          color: '#FFDE42',
                          textTransform: 'none',
                          '&:hover': { borderColor: '#E6C21E', backgroundColor: 'rgba(255, 222, 66, 0.1)' }
                        }}
                      >
                        Thống Kê
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Content: Jockeys */}
        {activeTab === 'jockeys' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-3xl font-bold text-white mb-2">Quản Lý Kỵ Sĩ</h2>
                <p className="text-slate-400">Thuê kỵ sĩ và quản lý danh sách ưa thích</p>
              </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white/5 backdrop-blur-md border border-white/5 rounded-2xl p-6">
                  <h3 className="text-xl font-bold text-white mb-6">Kỵ Sĩ Có Sẵn</h3>
                  <div className="space-y-4">
                    {jockeys.map(jockey => (
                      <div key={jockey.id} className="flex flex-col md:flex-row items-center justify-between p-4 bg-slate-900/50 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                        <div className="flex items-center gap-4 mb-4 md:mb-0 w-full md:w-auto">
                          <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-lg font-bold text-white">
                            {jockey.name.charAt(0)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-white font-medium">{jockey.name}</h4>
                              <Chip label={`Hạng ${jockey.ranking}`} size="small" sx={{ height: '20px', fontSize: '0.7rem', backgroundColor: '#f59e0b', color: 'white' }} />
                            </div>
                            <div className="text-sm text-slate-400 mt-1">{jockey.experience} kinh nghiệm • {jockey.wins} thắng ({jockey.winRate})</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 w-full md:w-auto">
                          <Chip
                            label={jockey.status}
                            size="small"
                            sx={{
                              backgroundColor: jockey.status === 'Sẵn Sàng' ? 'rgba(255, 222, 66, 0.2)' : 'rgba(100, 116, 139, 0.2)',
                              color: jockey.status === 'Sẵn Sàng' ? '#FFDE42' : '#94a3b8',
                              border: `1px solid ${jockey.status === 'Sẵn Sàng' ? '#FFDE42' : '#475569'}`
                            }}
                          />
                          <Button
                            variant="contained"
                            size="small"
                            disabled={jockey.status !== 'Sẵn Sàng'}
                            onClick={() => setInviteJockeyOpen(true)}
                            sx={{
                              background: jockey.status === 'Sẵn Sàng' ? '#FFDE42' : '#334155',
                              textTransform: 'none',
                              '&:hover': { background: '#E6C21E' }
                            }}
                          >
                            Thuê
                          </Button>
                        </div>
                      </div>
                    ))}
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
        {activeTab === 'schedule' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-3xl font-bold text-white mb-2">Lịch Đua</h2>
                <p className="text-slate-400">Quản lý đăng ký và xác nhận tham gia</p>
              </div>
              <Button
                variant="contained"
                onClick={() => setRegisterRaceOpen(true)}
                sx={{
                  background: 'linear-gradient(135deg, #FFDE42 0%, #1B0C0C 100%)',
                  textTransform: 'none',
                  fontWeight: 600,
                  boxShadow: '0 4px 6px -1px rgba(255, 222, 66, 0.2)',
                  '&:hover': { background: 'linear-gradient(135deg, #FFDE42 0%, #4C5C2D 100%)' }
                }}
              >
                Đăng Ký Tham Gia
              </Button>
            </div>

            <div className="space-y-4">
              {upcomingRaces.map(race => (
                <div key={race.id} className="bg-white/5 backdrop-blur-md border border-white/5 rounded-2xl p-6 hover:border-[#FFDE42]/30 transition-all">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center">
                          <Calendar className="w-5 h-5 text-[#FFDE42]" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-white">{race.tournament}</h3>
                          <div className="text-slate-400 text-sm">{race.date} at {race.time}</div>
                        </div>
                        <Chip
                          label={race.status}
                          size="small"
                          icon={race.status === 'Đã Xác Nhận' ? <CheckCircle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                          sx={{
                            ml: 'auto',
                            backgroundColor: race.status === 'Đã Xác Nhận' ? 'rgba(255, 222, 66, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                            color: race.status === 'Đã Xác Nhận' ? '#FFDE42' : '#fbbf24',
                            border: `1px solid ${race.status === 'Đã Xác Nhận' ? '#FFDE42' : '#f59e0b'}`,
                            '& .MuiChip-icon': { color: 'inherit' }
                          }}
                        />
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                        <div>
                          <div className="text-slate-400 text-sm mb-1">Ngựa Đã Chọn</div>
                          <div className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-[#FFDE42]" />
                            <span className="text-white font-medium">{race.horse}</span>
                          </div>
                        </div>
                        <div>
                          <div className="text-slate-400 text-sm mb-1">Kỵ Sĩ</div>
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-blue-400" />
                            <span className="text-white font-medium">{race.jockey}</span>
                          </div>
                        </div>
                        <div>
                          <div className="text-slate-400 text-sm mb-1">Phí Tham Gia</div>
                          <div className="text-white font-medium">{race.fee}</div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 min-w-[140px]">
                      {race.status === 'Chờ Xác Nhận' && (
                        <Button
                          variant="contained"
                          fullWidth
                          sx={{ background: '#FFDE42', color: '#1B0C0C', textTransform: 'none', '&:hover': { background: '#E6C21E' } }}
                        >
                          Xác Nhận
                        </Button>
                      )}
                      <Button
                        variant="outlined"
                        fullWidth
                        sx={{ borderColor: 'rgba(255,255,255,0.1)', color: 'white', textTransform: 'none', '&:hover': { borderColor: 'rgba(255,255,255,0.3)' } }}
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
        {activeTab === 'results' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-3xl font-bold text-white mb-6">Thành Tích & Phân Tích</h2>

            <div className="grid lg:grid-cols-2 gap-6 mb-8">
              <div className="bg-white/5 backdrop-blur-md border border-white/5 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-white mb-6">Lịch Sử Thu Nhập</h3>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={performanceData}>
                      <defs>
                        <linearGradient id="colorEarnings" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis dataKey="month" stroke="#94a3b8" />
                      <YAxis stroke="#94a3b8" />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} />
                      <Area type="monotone" dataKey="earnings" stroke="#10b981" fillOpacity={1} fill="url(#colorEarnings)" />
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
              <h3 className="text-xl font-bold text-white mb-6">Kết Quả Gần Đây</h3>
              <div className="space-y-4">
                {[
                  { race: 'Giải Kinh Điển Mùa Xuân', date: '2026-05-15', horse: 'Tia Chớp', position: 1, prize: '$25,000', points: '+150' },
                  { race: 'Cúp Chiến Thắng', date: '2026-05-10', horse: 'Mũi Tên Vàng', position: 3, prize: '$8,000', points: '+45' },
                ].map((result, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 bg-slate-900/50 rounded-xl border border-white/5">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg
                        ${result.position === 1 ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30' : 
                          result.position === 2 ? 'bg-slate-300/20 text-slate-300 border border-slate-300/30' : 
                          'bg-orange-700/20 text-orange-500 border border-orange-700/30'}`}
                      >
                        #{result.position}
                      </div>
                      <div>
                        <div className="text-white font-bold text-lg">{result.race}</div>
                        <div className="text-sm text-slate-400">{result.date} • <span className="text-[#FFDE42]">{result.horse}</span></div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[#FFDE42] font-bold text-lg">{result.prize}</div>
                      <div className="text-blue-400 text-sm font-medium">{result.points} pts</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Content: Wallet */}
        {activeTab === 'wallet' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-3xl font-bold text-white mb-6">Ví & Giao Dịch</h2>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="md:col-span-1 space-y-6">
                <div className="bg-gradient-to-br from-[#FFDE42] to-[#1B0C0C] rounded-3xl p-8 relative overflow-hidden shadow-2xl shadow-[#FFDE42]/50">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl"></div>
                  
                  <div className="relative z-10">
                    <div className="text-white font-medium mb-2">Tổng Số Dư</div>
                    <div className="text-5xl font-bold text-white mb-8">$45,800.00</div>

                    <div className="flex gap-3">
                      <Button
                        variant="contained"
                        onClick={() => setTopupOpen(true)}
                        startIcon={<Plus />}
                        sx={{ background: 'white', color: '#1B0C0C', fontWeight: 600, textTransform: 'none', '&:hover': { background: '#f8fafc' } }}
                      >
                        Nạp Tiền
                      </Button>
                      <Button
                        variant="outlined"
                        sx={{ borderColor: 'rgba(255,255,255,0.3)', color: 'white', fontWeight: 600, textTransform: 'none', '&:hover': { borderColor: 'white', background: 'rgba(255,255,255,0.1)' } }}
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
                  <h3 className="text-xl font-bold text-white">Lịch Sử Giao Dịch</h3>
                  <Button sx={{ color: '#FFDE42', textTransform: 'none' }}>Xem Tất Cả</Button>
                </div>

                <div className="space-y-4">
                  {transactions.map(tx => (
                    <div key={tx.id} className="flex items-center justify-between p-4 bg-slate-900/50 rounded-xl border border-white/5 hover:bg-slate-800/50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center
                          ${tx.amount > 0 ? 'bg-[#FFDE42]/20 text-[#FFDE42]' : 'bg-red-500/20 text-red-500'}`}
                        >
                          {tx.amount > 0 ? <ArrowDownRight className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                        </div>
                        <div>
                          <div className="text-white font-medium">{tx.type}</div>
                          <div className="text-sm text-slate-400">{tx.description} • {tx.date}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`font-bold ${tx.amount > 0 ? 'text-[#FFDE42]' : 'text-red-400'}`}>
                          {tx.amount > 0 ? '+' : ''}{tx.amount}
                        </div>
                        <div className="text-xs text-slate-500 uppercase">{tx.status === 'completed' ? 'hoàn thành' : tx.status}</div>
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
        PaperProps={{ style: { backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px' } }}
      >
        <DialogTitle sx={{ color: 'white', borderBottom: '1px solid rgba(255,255,255,0.1)', pb: 2 }}>
          Đăng Ký Ngựa Mới
        </DialogTitle>
        <DialogContent sx={{ paddingTop: '24px !important' }}>
          <div className="space-y-4">
            <div className="flex justify-center mb-6">
              <div className="w-32 h-32 rounded-xl border-2 border-dashed border-slate-600 flex flex-col items-center justify-center text-slate-400 hover:text-white hover:border-[#FFDE42] cursor-pointer transition-colors">
                <ImageIcon className="w-8 h-8 mb-2" />
                <span className="text-sm font-medium">Tải Ảnh Lên</span>
              </div>
            </div>
            <TextField
              fullWidth
              label="Tên Ngựa"
              sx={{
                '& .MuiInputLabel-root': { color: '#94a3b8' },
                '& .MuiOutlinedInput-root': {
                  color: 'white',
                  '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' },
                  '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                  '&.Mui-focused fieldset': { borderColor: '#FFDE42' }
                }
              }}
            />
            <div className="grid grid-cols-2 gap-4">
              <TextField
                fullWidth
                label="Giống"
                sx={{
                  '& .MuiInputLabel-root': { color: '#94a3b8' },
                  '& .MuiOutlinedInput-root': {
                    color: 'white',
                    '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' },
                    '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                    '&.Mui-focused fieldset': { borderColor: '#FFDE42' }
                  }
                }}
              />
              <TextField
                fullWidth
                label="Ngày Sinh"
                type="date"
                InputLabelProps={{ shrink: true }}
                sx={{
                  '& .MuiInputLabel-root': { color: '#94a3b8' },
                  '& .MuiOutlinedInput-root': {
                    color: 'white',
                    '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' },
                    '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                    '&.Mui-focused fieldset': { borderColor: '#FFDE42' }
                  }
                }}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <TextField
                fullWidth
                label="Giới Tính"
                sx={{
                  '& .MuiInputLabel-root': { color: '#94a3b8' },
                  '& .MuiOutlinedInput-root': {
                    color: 'white',
                    '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' },
                    '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                    '&.Mui-focused fieldset': { borderColor: '#FFDE42' }
                  }
                }}
              />
              <TextField
                fullWidth
                label="Cân Nặng (kg)"
                type="number"
                sx={{
                  '& .MuiInputLabel-root': { color: '#94a3b8' },
                  '& .MuiOutlinedInput-root': {
                    color: 'white',
                    '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' },
                    '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                    '&.Mui-focused fieldset': { borderColor: '#FFDE42' }
                  }
                }}
              />
            </div>
          </div>
        </DialogContent>
        <DialogActions sx={{ borderTop: '1px solid rgba(255,255,255,0.1)', padding: '16px 24px' }}>
          <Button onClick={() => setAddHorseOpen(false)} sx={{ color: '#94a3b8', textTransform: 'none' }}>
            Hủy
          </Button>
          <Button
            variant="contained"
            onClick={() => setAddHorseOpen(false)}
            sx={{
              background: '#FFDE42',
              textTransform: 'none',
              '&:hover': { background: '#E6C21E' }
            }}
          >
            Gửi Phê Duyệt
          </Button>
        </DialogActions>
      </Dialog>

      {/* Topup Dialog */}
      <Dialog 
        open={topupOpen} 
        onClose={() => setTopupOpen(false)} 
        maxWidth="xs" 
        fullWidth
        PaperProps={{ style: { backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px' } }}
      >
        <DialogTitle sx={{ color: 'white', borderBottom: '1px solid rgba(255,255,255,0.1)', pb: 2 }}>
          Nạp Tiền Vào Ví
        </DialogTitle>
        <DialogContent sx={{ paddingTop: '24px !important' }}>
          <TextField
            fullWidth
            label="Số Tiền ($)"
            type="number"
            sx={{
              '& .MuiInputLabel-root': { color: '#94a3b8' },
              '& .MuiOutlinedInput-root': {
                color: 'white',
                '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' },
                '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                '&.Mui-focused fieldset': { borderColor: '#10b981' }
              }
            }}
          />
        </DialogContent>
        <DialogActions sx={{ borderTop: '1px solid rgba(255,255,255,0.1)', padding: '16px 24px' }}>
          <Button onClick={() => setTopupOpen(false)} sx={{ color: '#94a3b8', textTransform: 'none' }}>
            Hủy
          </Button>
          <Button
            variant="contained"
            onClick={() => setTopupOpen(false)}
            sx={{ background: '#10b981', textTransform: 'none', '&:hover': { background: '#059669' } }}
          >
            Xác Nhận Nạp Tiền
          </Button>
        </DialogActions>
      </Dialog>

      {/* Invite Jockey Dialog */}
      <Dialog 
        open={inviteJockeyOpen} 
        onClose={() => setInviteJockeyOpen(false)} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{ style: { backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px' } }}
      >
        <DialogTitle sx={{ color: 'white', borderBottom: '1px solid rgba(255,255,255,0.1)', pb: 2 }}>
          Thuê Kỵ Sĩ
        </DialogTitle>
        <DialogContent sx={{ paddingTop: '24px !important' }}>
          <div className="space-y-4">
            <FormControl fullWidth sx={{
                '& .MuiInputLabel-root': { color: '#94a3b8' },
                '& .MuiOutlinedInput-root': {
                  color: 'white',
                  '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' },
                  '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                  '&.Mui-focused fieldset': { borderColor: '#FFDE42' },
                  '& .MuiSelect-icon': { color: '#94a3b8' }
                }
              }}>
              <InputLabel>Chọn Ngựa</InputLabel>
              <Select label="Chọn Ngựa" defaultValue="">
                {horses.map(h => <MenuItem key={h.id} value={h.id}>{h.name}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl fullWidth sx={{
                '& .MuiInputLabel-root': { color: '#94a3b8' },
                '& .MuiOutlinedInput-root': {
                  color: 'white',
                  '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' },
                  '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                  '&.Mui-focused fieldset': { borderColor: '#FFDE42' },
                  '& .MuiSelect-icon': { color: '#94a3b8' }
                }
              }}>
              <InputLabel>Chọn Giải Đấu</InputLabel>
              <Select label="Chọn Giải Đấu" defaultValue="">
                <MenuItem value="1">Giải Vô Địch Mùa Xuân</MenuItem>
                <MenuItem value="2">Cúp Vàng</MenuItem>
              </Select>
            </FormControl>
          </div>
        </DialogContent>
        <DialogActions sx={{ borderTop: '1px solid rgba(255,255,255,0.1)', padding: '16px 24px' }}>
          <Button onClick={() => setInviteJockeyOpen(false)} sx={{ color: '#94a3b8', textTransform: 'none' }}>
            Hủy
          </Button>
          <Button
            variant="contained"
            onClick={() => setInviteJockeyOpen(false)}
            sx={{ background: '#10b981', textTransform: 'none', '&:hover': { background: '#059669' } }}
          >
            Gửi Lời Mời
          </Button>
        </DialogActions>
      </Dialog>

      {/* Register Race Dialog */}
      <Dialog 
        open={registerRaceOpen} 
        onClose={() => setRegisterRaceOpen(false)} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{ style: { backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px' } }}
      >
        <DialogTitle sx={{ color: 'white', borderBottom: '1px solid rgba(255,255,255,0.1)', pb: 2 }}>
          Đăng Ký Tham Gia Giải Đấu
        </DialogTitle>
        <DialogContent sx={{ paddingTop: '24px !important' }}>
          <div className="space-y-4">
            <FormControl fullWidth sx={{
                '& .MuiInputLabel-root': { color: '#94a3b8' },
                '& .MuiOutlinedInput-root': {
                  color: 'white',
                  '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' },
                  '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                  '&.Mui-focused fieldset': { borderColor: '#FFDE42' },
                  '& .MuiSelect-icon': { color: '#94a3b8' }
                }
              }}>
              <InputLabel>Chọn Giải Đấu</InputLabel>
              <Select label="Chọn Giải Đấu" defaultValue="">
                <MenuItem value="1">Giải Vô Địch Cao Cấp 2026</MenuItem>
                <MenuItem value="2">Giải Derby Mùa Hè</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth sx={{
                '& .MuiInputLabel-root': { color: '#94a3b8' },
                '& .MuiOutlinedInput-root': {
                  color: 'white',
                  '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' },
                  '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                  '&.Mui-focused fieldset': { borderColor: '#FFDE42' },
                  '& .MuiSelect-icon': { color: '#94a3b8' }
                }
              }}>
              <InputLabel>Chọn Ngựa</InputLabel>
              <Select label="Chọn Ngựa" defaultValue="">
                {horses.map(h => <MenuItem key={h.id} value={h.id}>{h.name}</MenuItem>)}
              </Select>
            </FormControl>
          </div>
        </DialogContent>
        <DialogActions sx={{ borderTop: '1px solid rgba(255,255,255,0.1)', padding: '16px 24px' }}>
          <Button onClick={() => setRegisterRaceOpen(false)} sx={{ color: '#94a3b8', textTransform: 'none' }}>
            Hủy
          </Button>
          <Button
            variant="contained"
            onClick={() => setRegisterRaceOpen(false)}
            sx={{ background: '#10b981', textTransform: 'none', '&:hover': { background: '#059669' } }}
          >
            Xác Nhận Đăng Ký
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}