import { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Medal,
  Calendar,
  Trophy,
  TrendingUp,
  LogOut,
  Menu,
  X,
  CheckCircle,
  XCircle,
  Clock,
  Star,
  Award,
  MapPin,
  Flame,
  Activity,
  ShieldAlert,
  ChevronRight,
  Wallet,
  Target,
  Crosshair
} from 'lucide-react';
import { 
  Button, Chip, Dialog, DialogTitle, DialogContent, DialogActions, 
  Avatar, LinearProgress, Box, Typography 
} from '@mui/material';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  AreaChart, Area, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, RadarChart
} from 'recharts';

export function JockeyDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('invitations');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [horseInfoOpen, setHorseInfoOpen] = useState(false);
  const [selectedHorse, setSelectedHorse] = useState<any>(null);

  // MOCK DATA
  const invitations = [
    { id: 1, horse: 'Thunder Strike', horseGrade: 'G1', owner: 'John Smith', tournament: 'Spring Championship', date: '2026-05-25', time: '14:00', message: "Would love to have you ride Thunder Strike. Excellent form recently.", status: 'Pending', fee: '$500', prizeShare: '10%' },
    { id: 2, horse: 'Lightning Bolt', horseGrade: 'G2', owner: 'Emily Brown', tournament: 'Golden Cup', date: '2026-05-28', time: '15:30', message: "We need a speed specialist for this race.", status: 'Pending', fee: '$300', prizeShare: '8%' },
  ];

  const assignedRaces = [
    { id: 1, date: '2026-05-25', time: '14:00', tournament: 'Spring Championship', horse: 'Thunder Strike', owner: 'John Smith', location: 'Emerald Track', status: 'Confirmed', distance: '2400m', grade: 'G1' },
    { id: 2, date: '2026-05-28', time: '15:30', tournament: 'Golden Cup', horse: 'Storm Runner', owner: 'Michael Lee', location: 'Sapphire Arena', status: 'Confirmed', distance: '1600m', grade: 'G2' },
    { id: 3, date: '2026-06-02', time: '13:00', tournament: 'Summer Derby', horse: 'Wild Fire', owner: 'Sarah Johnson', location: 'Emerald Track', status: 'Pending', distance: '2000m', grade: 'G1' },
  ];

  const recentResults = [
    { race: 'Spring Classic', date: '2026-05-15', horse: 'Thunder Strike', position: 1, prize: '$5,000', points: 100, violations: 0 },
    { race: 'Victory Cup', date: '2026-05-10', horse: 'Storm Runner', position: 2, prize: '$3,000', points: 75, violations: 0 },
    { race: 'Elite Championship', date: '2026-05-05', horse: 'Wild Fire', position: 1, prize: '$5,000', points: 100, violations: 1 },
    { race: 'Grand Prix', date: '2026-04-28', horse: 'Thunder Strike', position: 3, prize: '$2,000', points: 50, violations: 0 },
  ];

  const performanceData = [
    { month: 'Jan', winRate: 35, finishes: 8 },
    { month: 'Feb', winRate: 38, finishes: 10 },
    { month: 'Mar', winRate: 42, finishes: 12 },
    { month: 'Apr', winRate: 45, finishes: 15 },
    { month: 'May', winRate: 48, finishes: 14 },
  ];

  const radarData = [
    { subject: 'Tốc Độ Nước Rút', A: 90, fullMark: 100 },
    { subject: 'Sức Bền', A: 85, fullMark: 100 },
    { subject: 'Điều Khiển Roi', A: 88, fullMark: 100 },
    { subject: 'Qua Cua', A: 92, fullMark: 100 },
    { subject: 'An Toàn', A: 95, fullMark: 100 },
    { subject: 'Chiến Thuật', A: 80, fullMark: 100 },
  ];

  const stats = [
    { label: 'Tổng Số Cuộc Đua', value: '145', icon: Calendar, color: 'from-[#FFDE42] to-[#1B0C0C]' },
    { label: 'Chiến Thắng Sự Nghiệp', value: '58', icon: Trophy, color: 'from-[#FFDE42] to-[#E6C21E]' },
    { label: 'Tỷ Lệ Thắng', value: '40%', icon: TrendingUp, color: 'from-teal-400 to-teal-600' },
    { label: 'Tổng Thu Nhập', value: '$89K', icon: Wallet, color: 'from-[#E6C21E] to-[#1B0C0C]' },
  ];

  const horseData = {
    name: 'Thunder Strike',
    breed: 'Thoroughbred',
    age: 4,
    weight: '520 kg',
    grade: 'G1',
    totalWins: 12,
    points: 1500,
    compatibility: 85,
    recentForm: [1, 2, 1, 1, 3]
  };

  const handleViewHorse = (horseName: string) => {
    setSelectedHorse({ ...horseData, name: horseName });
    setHorseInfoOpen(true);
  };

  function LinearProgressWithLabel(props: any) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Box sx={{ width: '100%', mr: 1 }}>
          <LinearProgress variant="determinate" {...props} />
        </Box>
        <Box sx={{ minWidth: 35 }}>
          <Typography variant="body2" sx={{ color: 'white', fontWeight: 'bold' }}>{`${Math.round(props.value)}%`}</Typography>
        </Box>
      </Box>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-300">
      {/* Top Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-lg border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gradient-to-br from-[#FFDE42] to-[#E6C21E] rounded-lg flex items-center justify-center shadow-lg shadow-[#FFDE42]/20">
              <Crosshair className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="text-white font-semibold flex items-center gap-2">
                Cổng Kỵ Sĩ
                <Chip label="Hạng A" size="small" sx={{ height: '18px', fontSize: '0.65rem', bgcolor: 'rgba(255, 222, 66, 0.2)', color: '#FFDE42', fontWeight: 'bold' }} />
              </div>
              <div className="text-sm text-slate-400">Giấy Phép: JCK-8821 • Top 10%</div>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-6">
            <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-xl border border-white/10 hover:bg-white/10 transition-colors cursor-pointer">
              <div className="relative">
                <Avatar src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop" sx={{ width: 36, height: 36, border: '2px solid #FFDE42' }} />
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-[#FFDE42] rounded-full border-2 border-slate-900"></div>
              </div>
              <div className="text-sm">
                <div className="text-white font-bold">Mike Johnson</div>
                <div className="text-[#FFDE42] text-xs font-medium">Sẵn Sàng Nhận Việc</div>
              </div>
            </div>
            <Button
              variant="outlined"
              startIcon={<LogOut className="w-4 h-4" />}
              onClick={() => navigate('/')}
              sx={{
                borderColor: 'rgba(255,255,255,0.1)',
                color: '#94a3b8',
                textTransform: 'none',
                borderRadius: '8px',
                '&:hover': { borderColor: '#ef4444', color: '#ef4444', backgroundColor: 'rgba(239,68,68,0.05)' }
              }}
            >
              Đăng Xuất
            </Button>
          </div>

          <button className="md:hidden text-white" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </nav>

      <div className="pt-28 max-w-7xl mx-auto px-6 py-8">
        {/* Quick Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-8">
          {stats.map((stat, idx) => (
            <div key={idx} className="bg-slate-900/60 backdrop-blur-md border border-white/10 rounded-2xl p-6 hover:border-[#FFDE42]/30 transition-all hover:shadow-[0_0_20px_rgba(255,222,66,0.1)] group">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-sm text-slate-400 font-medium mb-1">{stat.label}</div>
                  <div className="text-3xl font-extrabold text-white">{stat.value}</div>
                </div>
                <div className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-3 mb-8 overflow-x-auto pb-2 scrollbar-hide">
          {[
            { id: 'invitations', label: 'Lời Mời Đua', icon: Clock, badge: 2 },
            { id: 'schedule', label: 'Lịch Đua', icon: Calendar },
            { id: 'results', label: 'Kết Quả Quá Khứ', icon: Trophy },
            { id: 'stats', label: 'Phân Tích Sự Nghiệp', icon: Target }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all whitespace-nowrap font-semibold text-sm ${
                activeTab === tab.id
                  ? 'bg-[#FFDE42] text-slate-950 shadow-[0_0_15px_rgba(255,222,66,0.4)] border border-[#FFDE42]'
                  : 'bg-slate-900/80 text-slate-400 hover:bg-slate-800 hover:text-white border border-white/5'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              {tab.badge && (
                <span className={`ml-2 text-xs py-0.5 px-2 rounded-full font-bold ${activeTab === tab.id ? 'bg-slate-900 text-[#FFDE42]' : 'bg-[#FFDE42] text-slate-950'}`}>
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content: Ride Offers (Invitations) */}
        {activeTab === 'invitations' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">Lời Mời Đua Đang Chờ</h2>
                <p className="text-slate-400 text-sm">Xem xét điều khoản hợp đồng và chấp nhận lời mời từ Chủ Ngựa</p>
              </div>
            </div>

            {invitations.length > 0 ? (
              <div className="space-y-5">
                {invitations.map(invitation => (
                  <div key={invitation.id} className="bg-slate-900/80 backdrop-blur-md border border-white/10 rounded-2xl p-6 hover:border-[#FFDE42]/50 transition-all group">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-5 border-b border-white/5 pb-5">
                          <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-slate-800 rounded-2xl flex items-center justify-center border border-white/10 group-hover:border-[#FFDE42]/50 transition-colors">
                              <Star className="w-7 h-7 text-[#FFDE42]" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="text-xl font-bold text-white">{invitation.horse}</h3>
                                <Chip label={invitation.horseGrade} size="small" sx={{ height: '22px', fontSize: '0.7rem', bgcolor: '#f59e0b', color: 'white', fontWeight: 'bold' }} />
                              </div>
                              <div className="text-sm text-slate-400">Được mời bởi <span className="text-[#FFDE42] font-medium">{invitation.owner}</span></div>
                            </div>
                          </div>
                          <div className="text-right hidden sm:block bg-[#FFDE42]/10 border border-[#FFDE42]/20 px-4 py-2 rounded-xl">
                            <div className="text-[#FFDE42] font-bold text-lg">{invitation.fee} <span className="text-sm text-[#FFDE42]/70 font-normal">+ {invitation.prizeShare} Giải Thưởng</span></div>
                            <div className="text-[10px] text-[#FFDE42]/70 uppercase font-bold tracking-wider">Giá Trị Hợp Đồng</div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-5">
                          <div className="bg-slate-950/50 p-3 rounded-xl border border-white/5">
                            <div className="text-slate-500 text-xs uppercase font-bold mb-1 flex items-center gap-1"><Trophy className="w-3 h-3"/> Sự Kiện</div>
                            <div className="text-white font-medium truncate">{invitation.tournament}</div>
                          </div>
                          <div className="bg-slate-950/50 p-3 rounded-xl border border-white/5">
                            <div className="text-slate-500 text-xs uppercase font-bold mb-1 flex items-center gap-1"><Calendar className="w-3 h-3"/> Ngày</div>
                            <div className="text-white font-medium">{invitation.date}</div>
                          </div>
                          <div className="bg-slate-950/50 p-3 rounded-xl border border-white/5">
                            <div className="text-slate-500 text-xs uppercase font-bold mb-1 flex items-center gap-1"><Clock className="w-3 h-3"/> Giờ</div>
                            <div className="text-white font-medium">{invitation.time}</div>
                          </div>
                          <div className="flex items-center justify-center">
                            <Button
                              fullWidth
                              variant="outlined"
                              onClick={() => handleViewHorse(invitation.horse)}
                              sx={{
                                borderColor: 'rgba(255,222,66,0.3)', color: '#FFDE42', textTransform: 'none', height: '100%', borderRadius: '12px',
                                '&:hover': { borderColor: '#FFDE42', background: 'rgba(255,222,66,0.05)' }
                              }}
                            >
                              Hồ Sơ Ngựa
                            </Button>
                          </div>
                        </div>

                        <div className="bg-slate-950/80 p-4 rounded-xl border border-white/5 mb-6 relative overflow-hidden">
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#FFDE42]"></div>
                          <div className="text-xs text-slate-500 uppercase font-bold mb-1">Lời Nhắn Từ Chủ Ngựa</div>
                          <p className="text-slate-300 italic text-sm">"{invitation.message}"</p>
                        </div>

                        <div className="flex gap-4">
                          <Button
                            variant="contained"
                            startIcon={<CheckCircle className="w-5 h-5" />}
                            sx={{
                              background: '#FFDE42', color: '#1B0C0C', textTransform: 'none', fontWeight: 700, px: 4, py: 1.5, borderRadius: '10px',
                              boxShadow: '0 4px 14px rgba(16,185,129,0.3)',
                              '&:hover': { background: '#059669', boxShadow: '0 6px 20px rgba(16,185,129,0.4)' }
                            }}
                          >
                            Chấp Nhận
                          </Button>
                          <Button
                            variant="outlined"
                            startIcon={<XCircle className="w-5 h-5" />}
                            sx={{
                              borderColor: 'rgba(244,63,94,0.3)', color: '#f43f5e', textTransform: 'none', fontWeight: 600, px: 4, py: 1.5, borderRadius: '10px',
                              '&:hover': { borderColor: '#f43f5e', backgroundColor: 'rgba(244,63,94,0.1)' }
                            }}
                          >
                            Từ Chối
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-16 text-center backdrop-blur-md">
                <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/5">
                  <Clock className="w-10 h-10 text-slate-500" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Không có lời mời đang chờ</h3>
                <p className="text-slate-400 max-w-md mx-auto">Khi Chủ Ngựa mời bạn cưỡi ngựa của họ, các điều khoản hợp đồng sẽ xuất hiện tại đây.</p>
              </div>
            )}
          </div>
        )}

        {/* Content: Schedule */}
        {activeTab === 'schedule' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">Lịch Đã Xác Nhận</h2>
                <p className="text-slate-400 text-sm">Các cuộc đua sắp tới và địa điểm đường đua của bạn</p>
              </div>
            </div>

            <div className="space-y-4">
              {assignedRaces.map(race => (
                <div key={race.id} className="bg-slate-900/80 backdrop-blur-md border border-white/10 rounded-2xl p-6 hover:border-[#FFDE42]/30 transition-all">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-5 border-b border-white/5 pb-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${race.status === 'Confirmed' ? 'bg-[#FFDE42]/10 border-emerald-500/30 text-[#FFDE42]' : 'bg-amber-500/10 border-amber-500/30 text-amber-400'}`}>
                          <Flame className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-white mb-1">{race.tournament}</h3>
                          <div className="text-slate-400 text-sm flex items-center gap-2">
                            <span className="font-medium text-slate-300">{race.date} • {race.time}</span>
                            <span>|</span>
                            <span className="flex items-center gap-1 text-[#FFDE42]"><MapPin className="w-3 h-3"/> {race.location}</span>
                          </div>
                        </div>
                        <Chip
                          label={race.status === 'Confirmed' ? 'Đã Xác Nhận' : 'Đang Chờ'}
                          size="small"
                          icon={race.status === 'Confirmed' ? <CheckCircle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                          sx={{
                            ml: 'auto', height: '24px', fontWeight: 'bold',
                            backgroundColor: race.status === 'Confirmed' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                            color: race.status === 'Confirmed' ? '#FFDE42' : '#fbbf24',
                            border: `1px solid ${race.status === 'Confirmed' ? '#FFDE42' : '#f59e0b'}`,
                            '& .MuiChip-icon': { color: 'inherit' }
                          }}
                        />
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-950/50 p-4 rounded-xl border border-white/5">
                        <div>
                          <div className="text-slate-500 text-xs uppercase font-bold mb-1">Ngựa Được Chỉ Định</div>
                          <div className="text-white font-medium flex items-center gap-2">
                            {race.horse} <Chip label={race.grade} size="small" sx={{ height: '16px', fontSize: '0.6rem', bgcolor: '#475569', color: 'white', fontWeight: 'bold' }} />
                          </div>
                        </div>
                        <div>
                          <div className="text-slate-500 text-xs uppercase font-bold mb-1">Chủ Ngựa</div>
                          <div className="text-white font-medium">{race.owner}</div>
                        </div>
                        <div>
                          <div className="text-slate-500 text-xs uppercase font-bold mb-1">Quãng Đường</div>
                          <div className="text-white font-medium">{race.distance}</div>
                        </div>
                        <div className="flex items-center justify-end">
                          <Button
                            size="small"
                            variant="text"
                            onClick={() => handleViewHorse(race.horse)}
                            endIcon={<ChevronRight className="w-4 h-4" />}
                            sx={{ color: '#FFDE42', textTransform: 'none', fontWeight: 600, '&:hover': { background: 'rgba(255,222,66,0.1)' } }}
                          >
                            Chi Tiết Ngựa
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Content: Results */}
        {activeTab === 'results' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-2xl font-bold text-white mb-6">Kết Quả Đua Đã Xác Minh</h2>

            <div className="bg-slate-900/80 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-950/80 border-b border-white/10">
                    <tr>
                      <th className="text-left px-6 py-4 text-xs uppercase tracking-wider font-bold text-slate-500">Sự Kiện & Ngày</th>
                      <th className="text-left px-6 py-4 text-xs uppercase tracking-wider font-bold text-slate-500">Ngựa</th>
                      <th className="text-left px-6 py-4 text-xs uppercase tracking-wider font-bold text-slate-500">Vị Trí</th>
                      <th className="text-left px-6 py-4 text-xs uppercase tracking-wider font-bold text-slate-500">Thu Nhập</th>
                      <th className="text-left px-6 py-4 text-xs uppercase tracking-wider font-bold text-slate-500">Điểm Xếp Hạng</th>
                      <th className="text-left px-6 py-4 text-xs uppercase tracking-wider font-bold text-slate-500">Vi Phạm</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {recentResults.map((result, idx) => (
                      <tr key={idx} className="hover:bg-white/5 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="text-white font-bold">{result.race}</div>
                          <div className="text-xs text-slate-400 mt-1">{result.date}</div>
                        </td>
                        <td className="px-6 py-4 text-slate-300 font-medium">{result.horse}</td>
                        <td className="px-6 py-4">
                          <div className={`inline-flex items-center justify-center w-8 h-8 rounded-lg font-bold text-sm border
                            ${result.position === 1 ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : 
                              result.position === 2 ? 'bg-slate-300/10 text-slate-300 border-slate-400/30' : 
                              'bg-orange-700/20 text-orange-400 border-orange-700/30'}`}
                          >
                            {result.position}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-[#FFDE42] font-bold">{result.prize}</td>
                        <td className="px-6 py-4 text-teal-400 font-bold">+{result.points}</td>
                        <td className="px-6 py-4">
                          {result.violations > 0 ? (
                            <span className="flex items-center gap-1 text-red-400 text-xs font-bold bg-red-400/10 px-2 py-1 rounded-md w-fit border border-red-400/20">
                              <ShieldAlert className="w-3 h-3" /> {result.violations}
                            </span>
                          ) : (
                            <span className="text-slate-500 text-sm font-medium">Sạch</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Content: Career Analytics */}
        {activeTab === 'stats' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-2xl font-bold text-white mb-6">Phân Tích Sự Nghiệp & Hiệu Suất</h2>

            <div className="grid lg:grid-cols-3 gap-6 mb-6">
              {/* Win Rate Chart */}
              <div className="lg:col-span-2 bg-slate-900/80 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-xl">
                <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-[#FFDE42]" />
                  Xu Hướng Tỷ Lệ Thắng (2026)
                </h3>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={performanceData}>
                      <defs>
                        <linearGradient id="colorWinRate" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#FFDE42" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#FFDE42" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                      <XAxis dataKey="month" stroke="#64748b" axisLine={false} tickLine={false} tick={{fontSize: 12}} />
                      <YAxis stroke="#64748b" axisLine={false} tickLine={false} tickFormatter={(val) => `${val}%`} tick={{fontSize: 12}} />
                      <RechartsTooltip 
                        contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '12px', color: 'white' }}
                        itemStyle={{ color: '#FFDE42', fontWeight: 'bold' }}
                      />
                      <Area type="monotone" dataKey="winRate" stroke="#FFDE42" strokeWidth={3} fillOpacity={1} fill="url(#colorWinRate)" activeDot={{ r: 6, fill: '#FFDE42', strokeWidth: 2, stroke: '#0f172a' }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Ranking & Attributes */}
              <div className="bg-slate-900/80 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-xl flex flex-col">
                <h3 className="text-lg font-bold text-white mb-4">Thứ Hạng Toàn Cầu</h3>
                <div className="bg-gradient-to-br from-[#1B0C0C]/40 to-slate-900 rounded-xl p-6 border border-[#FFDE42]/20 text-center mb-6 relative overflow-hidden">
                  <div className="absolute -right-4 -top-4 w-24 h-24 bg-[#FFDE42]/10 rounded-full blur-xl"></div>
                  <div className="text-slate-400 text-xs uppercase font-bold tracking-wider mb-2 relative z-10">Hạng Hiện Tại</div>
                  <div className="text-5xl font-extrabold text-white mb-2 relative z-10">
                    <span className="text-[#FFDE42]">#</span>12
                  </div>
                  <div className="inline-flex items-center gap-1 text-teal-400 text-xs font-bold bg-teal-400/10 px-3 py-1 rounded-full border border-teal-400/20 relative z-10">
                    <TrendingUp className="w-3 h-3" /> TĂNG 3 BẬC
                  </div>
                </div>

                <h4 className="text-white font-bold mb-4 text-sm uppercase tracking-wider border-b border-white/5 pb-2">Biểu Đồ Kỹ Năng</h4>
                <div className="flex-1 min-h-[200px] -mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                      <PolarGrid stroke="rgba(255,255,255,0.1)" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                      <Radar name="Skills" dataKey="A" stroke="#FFDE42" strokeWidth={2} fill="#FFDE42" fillOpacity={0.3} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Achievement Showcase */}
            <div className="bg-slate-900/80 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-xl">
              <h3 className="text-lg font-bold text-white mb-6">Phòng Cúp & Huy Hiệu</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { icon: Trophy, label: 'Vô Địch G1', desc: 'Thắng 5 cuộc đua Hạng 1', color: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/20' },
                  { icon: Flame, label: 'Ác Quỷ Tốc Độ', desc: 'Kỷ lục vòng nhanh nhất 2025', color: 'text-rose-400', bg: 'bg-rose-400/10', border: 'border-rose-400/20' },
                  { icon: ShieldAlert, label: 'Phong Độ Hoàn Hảo', desc: '10 cuộc đua không vi phạm', color: 'text-teal-400', bg: 'bg-teal-400/10', border: 'border-teal-400/20' },
                  { icon: Medal, label: 'Kỵ Sĩ Kỳ Cựu', desc: 'Hoàn thành 100+ cuộc đua', color: 'text-[#FFDE42]', bg: 'bg-emerald-400/10', border: 'border-emerald-400/20' },
                ].map((badge, idx) => (
                  <div key={idx} className={`rounded-xl p-5 border ${badge.border} ${badge.bg} text-center flex flex-col items-center justify-center transition-transform hover:-translate-y-1`}>
                    <badge.icon className={`w-8 h-8 ${badge.color} mb-3`} />
                    <div className="text-white font-bold mb-1">{badge.label}</div>
                    <div className="text-xs text-slate-400">{badge.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Horse Info Dialog */}
      <Dialog 
        open={horseInfoOpen} 
        onClose={() => setHorseInfoOpen(false)} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{ style: { backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', backgroundImage: 'linear-gradient(to bottom right, rgba(16,185,129,0.05), transparent)' } }}
      >
        <DialogTitle sx={{ color: 'white', borderBottom: '1px solid rgba(255,255,255,0.1)', pb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="flex items-center gap-2 font-bold">
            <Activity className="w-5 h-5 text-[#FFDE42]" />
            Hồ Sơ Ngựa
          </div>
          <Chip label={selectedHorse?.grade} sx={{ backgroundColor: '#f59e0b', color: 'white', fontWeight: 'bold' }} />
        </DialogTitle>
        <DialogContent sx={{ paddingTop: '24px !important' }}>
          {selectedHorse && (
            <div className="space-y-6">
              <div className="flex items-center gap-6">
                <div className="w-24 h-24 rounded-2xl bg-slate-900 border border-white/10 shadow-inner flex items-center justify-center flex-shrink-0 relative overflow-hidden">
                  <Star className="w-10 h-10 text-[#FFDE42]/50" />
                  <div className="absolute inset-0 bg-gradient-to-tr from-[#FFDE42]/10 to-transparent"></div>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white mb-1">{selectedHorse.name}</h2>
                  <div className="text-slate-400 text-sm font-medium">{selectedHorse.breed} • {selectedHorse.age} Tuổi</div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="bg-slate-900/80 border border-white/5 p-4 rounded-xl text-center shadow-sm">
                  <div className="text-slate-500 text-xs font-bold mb-1 uppercase tracking-wider">Cân Nặng</div>
                  <div className="text-white font-bold text-lg">{selectedHorse.weight}</div>
                </div>
                <div className="bg-slate-900/80 border border-white/5 p-4 rounded-xl text-center shadow-sm">
                  <div className="text-slate-500 text-xs font-bold mb-1 uppercase tracking-wider">Tổng Thắng</div>
                  <div className="text-white font-bold text-lg text-[#FFDE42]">{selectedHorse.totalWins}</div>
                </div>
                <div className="bg-slate-900/80 border border-white/5 p-4 rounded-xl text-center shadow-sm">
                  <div className="text-slate-500 text-xs font-bold mb-1 uppercase tracking-wider">Xếp Hạng</div>
                  <div className="text-white font-bold text-lg">{selectedHorse.points}</div>
                </div>
              </div>

              <div className="bg-emerald-900/10 border border-[#FFDE42]/20 p-5 rounded-xl">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-white font-bold flex items-center gap-2">
                    <Target className="w-4 h-4 text-[#FFDE42]" />
                    Điểm Tương Thích Kỵ Sĩ
                  </h4>
                  <span className="text-[#FFDE42] font-bold">{selectedHorse.compatibility}%</span>
                </div>
                <LinearProgress
                  variant="determinate"
                  value={selectedHorse.compatibility}
                  sx={{ height: 8, borderRadius: 4, bgcolor: 'rgba(255,255,255,0.05)', '& .MuiLinearProgress-bar': { bgcolor: '#FFDE42', borderRadius: 4 } }}
                />
                <p className="text-xs text-slate-400 mt-3 font-medium">Dựa trên phong cách cưỡi ngựa của bạn (Nước Rút) và mô hình nhịp độ lịch sử của ngựa này.</p>
              </div>

              <div>
                <h4 className="text-white font-bold mb-3 uppercase tracking-wider text-sm text-slate-400 border-b border-white/5 pb-2">Phong Độ Gần Đây (5 Cuộc Gần Nhất)</h4>
                <div className="flex gap-3">
                  {selectedHorse.recentForm.map((pos: number, i: number) => (
                    <div key={i} className={`flex-1 py-2 text-center rounded-lg text-sm font-bold border
                      ${pos === 1 ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
                        pos === 2 ? 'bg-slate-300/10 text-slate-300 border-slate-400/30' :
                        pos === 3 ? 'bg-orange-700/10 text-orange-400 border-orange-700/30' :
                        'bg-slate-800 text-slate-400 border-slate-700'}`}
                    >
                      {pos}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
        <DialogActions sx={{ borderTop: '1px solid rgba(255,255,255,0.1)', padding: '16px 24px' }}>
          <Button onClick={() => setHorseInfoOpen(false)} sx={{ color: '#94a3b8', textTransform: 'none', fontWeight: 600 }}>
            Đóng
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}