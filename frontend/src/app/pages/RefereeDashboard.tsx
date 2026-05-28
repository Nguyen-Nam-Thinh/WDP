import { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Shield,
  Calendar,
  AlertTriangle,
  CheckCircle,
  LogOut,
  Menu,
  X,
  FileText,
  Clock,
  Play,
  Flag,
  Video,
  Activity,
  ClipboardCheck,
  Eye,
  Camera,
  Download,
  AlertCircle,
  Search,
  Zap,
  Timer
} from 'lucide-react';
import { 
  Button, Chip, Dialog, DialogTitle, DialogContent, DialogActions, 
  TextField, Select, MenuItem, FormControl, InputLabel, 
  FormControlLabel, Checkbox, FormGroup, IconButton, Divider
} from '@mui/material';

export function RefereeDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('pre-check');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Dialog States
  const [preCheckOpen, setPreCheckOpen] = useState(false);
  const [incidentOpen, setIncidentOpen] = useState(false);
  const [verifyOpen, setVerifyOpen] = useState(false);
  
  const [selectedRace, setSelectedRace] = useState<any>(null);
  const [selectedHorseIndex, setSelectedHorseIndex] = useState(0);

  // MOCK DATA
  const upcomingRaces = [
    { 
      id: 1, date: '2026-05-25', time: '14:00', tournament: 'Spring Championship', location: 'Emerald Track', 
      status: 'Pre-Check Pending', grade: 'G1', 
      horses: [
        { id: 101, name: 'Thunder Strike', jockey: 'Mike Johnson', passed: null, failReason: '' },
        { id: 102, name: 'Storm Runner', jockey: 'Sarah Williams', passed: null, failReason: '' },
        { id: 103, name: 'Golden Arrow', jockey: 'Tom Wilson', passed: null, failReason: '' },
      ]
    },
    { 
      id: 2, date: '2026-05-25', time: '16:00', tournament: 'Golden Cup Qualifier', location: 'Sapphire Arena', 
      status: 'Scheduled', grade: 'G2', horses: [] 
    },
  ];

  const activeRaces = [
    { 
      id: 3, tournament: 'Elite Classic', location: 'Emerald Track', elapsed: '2:45', status: 'Running', distance: '2400m', grade: 'G1',
      runners: [
        { pos: 1, horse: 'Wild Fire', jockey: 'David Chen', speed: '64.2 km/h', gap: 'Leader' },
        { pos: 2, horse: 'Lightning', jockey: 'Emma Davis', speed: '63.8 km/h', gap: '+0.5s' },
        { pos: 3, horse: 'Night Hawk', jockey: 'James Lee', speed: '63.5 km/h', gap: '+1.2s' },
      ],
      incidents: [
        { time: '0:45', type: 'Warning', desc: 'Slight bumping at Turn 1 (Lightning & Night Hawk)' }
      ]
    },
  ];

  const pendingVerification = [
    { id: 4, date: '2026-05-25', time: '10:00', tournament: 'Morning Sprint', location: 'Ruby Course', status: 'Pending Verification', 
      provisionalResults: [
        { pos: 1, horse: 'Desert Wind', jockey: 'A. Smith', time: '1:12.45', penalty: 'None' },
        { pos: 2, horse: 'Ocean Breeze', jockey: 'B. Jones', time: '1:12.80', penalty: 'None' },
        { pos: 3, horse: 'Mountain Echo', jockey: 'C. Davis', time: '1:13.15', penalty: '+2s (Interference)' },
      ]
    }
  ];

  const historicalReports = [
    { id: 5, date: '2026-05-20', tournament: 'Spring Classic', winner: 'Thunder Strike', status: 'Finalized', incidents: 2 },
    { id: 6, date: '2026-05-18', tournament: 'Victory Cup', winner: 'Golden Arrow', status: 'Finalized', incidents: 0 },
  ];

  const stats = [
    { label: 'Cuộc Đua Đã Kiểm Tra', value: '42', icon: ClipboardCheck, color: 'from-[#FFDE42] to-[#1B0C0C]' },
    { label: 'Đang Diễn Ra', value: '1', icon: Play, color: 'from-blue-500 to-blue-700' },
    { label: 'Sự Cố Ghi Nhận', value: '18', icon: AlertTriangle, color: 'from-amber-500 to-amber-700' },
    { label: 'Kết Quả Đã Xác Minh', value: '156', icon: CheckCircle, color: 'from-indigo-500 to-indigo-700' },
  ];

  const handleOpenPreCheck = (race: any) => {
    setSelectedRace(race);
    setSelectedHorseIndex(0);
    setPreCheckOpen(true);
  };

  const handleOpenVerify = (race: any) => {
    setSelectedRace(race);
    setVerifyOpen(true);
  };

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
              <div className="text-white font-semibold flex items-center gap-2">
                Cổng Trọng Tài
                <Chip label="Cấp: Cao Cấp" size="small" sx={{ height: '18px', fontSize: '0.65rem', bgcolor: 'rgba(255, 222, 66, 0.2)', color: '#FFDE42', fontWeight: 'bold' }} />
              </div>
              <div className="text-sm text-slate-400">Giấy Phép: REF-2026-X89 • 12 Năm Kinh Nghiệm</div>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-4">
            <div className="flex items-center gap-2 bg-[#FFDE42]/10 text-[#FFDE42] px-3 py-1.5 rounded-lg border border-[#FFDE42]/20 text-sm font-medium">
              <div className="w-2 h-2 rounded-full bg-[#FFDE42] animate-pulse"></div>
              Hệ Thống Hoạt Động
            </div>
            <Button
              variant="outlined"
              startIcon={<LogOut />}
              onClick={() => navigate('/')}
              sx={{
                borderColor: 'rgba(255,255,255,0.1)',
                color: '#94a3b8',
                textTransform: 'none',
                '&:hover': { borderColor: 'rgba(255,255,255,0.2)', backgroundColor: 'rgba(255,255,255,0.05)' }
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
            { id: 'pre-check', label: 'Kiểm Tra Trước Đua', icon: ClipboardCheck, badge: 1 },
            { id: 'live', label: 'Giám Sát Trực Tiếp', icon: Video, badge: 1 },
            { id: 'verification', label: 'Xác Minh Kết Quả', icon: CheckCircle, badge: 1 },
            { id: 'reports', label: 'Báo Cáo Chính Thức', icon: FileText }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all whitespace-nowrap font-medium ${
                activeTab === tab.id
                  ? 'bg-[#FFDE42] text-[#1B0C0C] shadow-lg shadow-[#FFDE42]/25 border-[#FFDE42]'
                  : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white border border-white/5'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              {tab.badge && (
                <span className={`ml-1 text-white text-xs py-0.5 px-2 rounded-full font-bold ${activeTab === tab.id ? 'bg-black/20' : 'bg-[#FFDE42]'}`}>
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content: Pre-Race Check */}
        {activeTab === 'pre-check' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-3xl font-bold text-white mb-2">Kiểm Tra Trước Đua</h2>
                <p className="text-slate-400">Xác minh tư cách tham gia, sức khỏe và thiết bị của ngựa trước khi cho phép bắt đầu cuộc đua</p>
              </div>
            </div>

            <div className="space-y-4">
              {upcomingRaces.map(race => (
                <div key={race.id} className="bg-white/5 backdrop-blur-md border border-white/5 rounded-2xl p-6 hover:border-[#FFDE42]/30 transition-all">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center">
                          <ClipboardCheck className="w-5 h-5 text-[#FFDE42]" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-xl font-bold text-white">{race.tournament}</h3>
                            <Chip label={race.grade} size="small" sx={{ height: '20px', fontSize: '0.7rem', bgcolor: '#f59e0b', color: 'white', fontWeight: 'bold' }} />
                          </div>
                          <div className="text-slate-400 text-sm">{race.date} at {race.time}</div>
                        </div>
                        <Chip
                          label={race.status}
                          size="small"
                          sx={{ 
                            ml: 'auto', 
                            backgroundColor: race.status === 'Pre-Check Pending' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(100, 116, 139, 0.2)', 
                            color: race.status === 'Pre-Check Pending' ? '#fbbf24' : '#94a3b8', 
                            border: `1px solid ${race.status === 'Pre-Check Pending' ? '#f59e0b' : '#475569'}`,
                            fontWeight: 'bold'
                          }}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-900/50 p-4 rounded-xl border border-white/5">
                        <div>
                          <div className="text-slate-400 text-xs uppercase mb-1 flex items-center gap-1"><Flag className="w-3 h-3"/> Địa Điểm</div>
                          <div className="text-white font-medium">{race.location}</div>
                        </div>
                        <div>
                          <div className="text-slate-400 text-xs uppercase mb-1 flex items-center gap-1"><Activity className="w-3 h-3"/> Tham Gia</div>
                          <div className="text-white font-medium">{race.horses ? race.horses.length : 0} ngựa đã đăng ký</div>
                        </div>
                        <div className="flex items-end justify-end">
                          <Button
                            variant="contained"
                            disabled={race.status !== 'Pre-Check Pending'}
                            onClick={() => handleOpenPreCheck(race)}
                            sx={{
                              background: race.status === 'Pre-Check Pending' ? '#FFDE42' : '#334155',
                              color: race.status === 'Pre-Check Pending' ? '#1B0C0C' : 'white',
                              color: 'white',
                              textTransform: 'none',
                              fontWeight: 600,
                              '&:hover': { background: '#059669' }
                            }}
                          >
                            Bắt Đầu Kiểm Tra
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

        {/* Content: Live Monitoring */}
        {activeTab === 'live' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-[#FFDE42] animate-pulse shadow-[0_0_10px_rgba(255,222,66,0.8)]"></div>
                  Dữ Liệu Trực Tiếp
                </h2>
                <p className="text-slate-400">Giám sát theo thời gian thực, nguồn camera đa kênh và ghi nhận sự cố</p>
              </div>
            </div>

            {activeRaces.map(race => (
              <div key={race.id} className="bg-slate-900 border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
                {/* Header */}
                <div className="p-6 bg-white/5 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <Chip label={race.grade} size="small" sx={{ bgcolor: '#f59e0b', color: 'white', fontWeight: 'bold' }} />
                      <h3 className="text-xl font-bold text-white">{race.tournament}</h3>
                    </div>
                    <div className="text-sm text-slate-400 flex items-center gap-4">
                      <span className="flex items-center gap-1"><Flag className="w-4 h-4 text-[#FFDE42]"/> {race.location}</span>
                      <span className="flex items-center gap-1"><Timer className="w-4 h-4 text-[#FFDE42]"/> {race.elapsed}</span>
                      <span className="flex items-center gap-1"><Activity className="w-4 h-4 text-[#FFDE42]"/> {race.distance}</span>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Button
                      variant="outlined"
                      onClick={() => setIncidentOpen(true)}
                      startIcon={<AlertTriangle />}
                      sx={{
                        borderColor: 'rgba(239,68,68,0.5)',
                        color: '#ef4444',
                        textTransform: 'none',
                        fontWeight: 600,
                        backgroundColor: 'rgba(239,68,68,0.1)',
                        '&:hover': { borderColor: '#ef4444', backgroundColor: 'rgba(239,68,68,0.2)' }
                      }}
                    >
                      Ghi Nhận Sự Cố
                    </Button>
                  </div>
                </div>

                <div className="grid lg:grid-cols-3 p-6 gap-6">
                  {/* Camera Feeds */}
                  <div className="lg:col-span-2 space-y-4">
                    <div className="aspect-video bg-black rounded-xl relative border border-white/10 overflow-hidden group">
                      <img src="https://images.unsplash.com/photo-1598974357801-cbca100e65d3?w=1200" alt="Main Cam" className="w-full h-full object-cover opacity-80" />
                      <div className="absolute top-4 left-4 bg-black/80 backdrop-blur-md px-3 py-1.5 rounded text-white text-xs font-bold flex items-center gap-2 border border-white/10">
                        <Camera className="w-3 h-3 text-red-500 animate-pulse" /> TRACK CAM 1 (LEAD)
                      </div>
                      <div className="absolute bottom-4 right-4 bg-black/80 backdrop-blur-md px-3 py-1.5 rounded text-[#FFDE42] text-sm font-mono font-bold border border-white/10">
                        {race.elapsed}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="aspect-video bg-black rounded-xl relative border border-white/10 overflow-hidden">
                        <img src="https://images.unsplash.com/photo-1551076805-e1869033e561?w=600" alt="Cam 2" className="w-full h-full object-cover opacity-60" />
                        <div className="absolute top-2 left-2 bg-black/80 backdrop-blur-md px-2 py-0.5 rounded text-white text-[10px] font-bold border border-white/10">CAM 2 - TRÊN KHÔNG</div>
                      </div>
                      <div className="aspect-video bg-slate-950 rounded-xl relative border border-white/10 overflow-hidden flex items-center justify-center border-dashed">
                        <span className="text-slate-500 text-sm font-medium flex items-center gap-2"><Video className="w-4 h-4"/> CAM ĐÍCH (CHỜ)</span>
                      </div>
                    </div>
                  </div>

                  {/* Telemetry */}
                  <div className="space-y-6 flex flex-col">
                    {/* Leaderboard */}
                    <div className="bg-slate-900/80 rounded-xl border border-white/5 p-4 flex-1">
                      <h4 className="text-white font-bold mb-4 flex items-center gap-2">
                        <Zap className="w-4 h-4 text-[#FFDE42]" />
                        Dữ Liệu Trực Tiếp
                      </h4>
                      <div className="space-y-2">
                        {race.runners.map(runner => (
                          <div key={runner.pos} className="flex flex-col p-3 bg-white/5 rounded-lg border border-white/5">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-3">
                                <div className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold
                                  ${runner.pos === 1 ? 'bg-[#FFDE42] text-white shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 
                                    runner.pos === 2 ? 'bg-slate-300 text-slate-900' : 'bg-orange-700 text-white'}`}
                                >
                                  {runner.pos}
                                </div>
                                <span className="text-white font-medium text-sm">{runner.horse}</span>
                              </div>
                              <span className="text-[#FFDE42] font-mono text-xs font-bold">{runner.gap}</span>
                            </div>
                            <div className="flex justify-between text-xs text-slate-400 pl-9">
                              <span>{runner.jockey}</span>
                              <span className="text-blue-400 font-mono">{runner.speed}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Incident Log */}
                    <div className="bg-slate-900/80 rounded-xl border border-white/5 p-4 h-48">
                      <h4 className="text-white font-bold mb-3 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-amber-500" />
                        Nhật Ký Cuộc Đua
                      </h4>
                      <div className="space-y-2 overflow-y-auto max-h-32 pr-2">
                        <div className="text-xs p-2 rounded bg-[#FFDE42]/10 border border-[#FFDE42]/20 text-emerald-300">
                          [0:00] Cuộc đua bắt đầu (Xuất phát tốt)
                        </div>
                        {race.incidents.map((inc, i) => (
                          <div key={i} className="text-xs p-2 rounded bg-amber-500/10 border border-amber-500/20 text-amber-300">
                            [{inc.time}] {inc.type}: {inc.desc}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Content: Verification */}
        {activeTab === 'verification' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-3xl font-bold text-white mb-6">Xác Minh Kết Quả</h2>
            
            <div className="space-y-4">
              {pendingVerification.map(race => (
                <div key={race.id} className="bg-white/5 backdrop-blur-md border border-white/5 rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        {race.tournament}
                        <Chip label="Chờ Trọng Tài" size="small" sx={{ bgcolor: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24', border: '1px solid #f59e0b', fontWeight: 'bold' }} />
                      </h3>
                      <div className="text-slate-400 text-sm mt-1">{race.date} • {race.location}</div>
                    </div>
                    <Button
                      variant="contained"
                      onClick={() => handleOpenVerify(race)}
                      sx={{
                        background: '#FFDE42',
                        color: '#1B0C0C',
                        color: 'white',
                        textTransform: 'none',
                        fontWeight: 600,
                        '&:hover': { background: '#059669' }
                      }}
                    >
                      Xem Xét & Xác Minh Kết Quả
                    </Button>
                  </div>

                  <div className="bg-slate-900 rounded-xl border border-white/5 overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-950/50">
                        <tr>
                          <th className="text-left py-3 px-4 text-slate-400 font-semibold">Hạng</th>
                          <th className="text-left py-3 px-4 text-slate-400 font-semibold">Ngựa</th>
                          <th className="text-left py-3 px-4 text-slate-400 font-semibold">Kỵ Sĩ</th>
                          <th className="text-left py-3 px-4 text-slate-400 font-semibold">Thời Gian</th>
                          <th className="text-left py-3 px-4 text-slate-400 font-semibold">Phạt Hệ Thống</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {race.provisionalResults.map(res => (
                          <tr key={res.pos} className="hover:bg-white/5">
                            <td className="py-3 px-4 font-bold text-white">{res.pos}</td>
                            <td className="py-3 px-4 text-[#FFDE42] font-medium">{res.horse}</td>
                            <td className="py-3 px-4 text-slate-300">{res.jockey}</td>
                            <td className="py-3 px-4 font-mono text-white">{res.time}</td>
                            <td className="py-3 px-4">
                              {res.penalty === 'None' ?
                                <span className="text-slate-500">Không</span> :
                                <span className="text-red-400 font-medium">{res.penalty}</span>
                              }
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Content: Official Reports */}
        {activeTab === 'reports' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-bold text-white">Báo Cáo Chính Thức</h2>
              <div className="relative">
                <Search className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Tìm kiếm báo cáo..."
                  className="bg-slate-900 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-[#FFDE42] w-64"
                />
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-md border border-white/5 rounded-2xl overflow-hidden">
              <table className="w-full">
                <thead className="bg-slate-900/80 border-b border-white/10">
                  <tr>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-slate-400">Ngày</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-slate-400">Giải Đấu</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-slate-400">Người Thắng Chính Thức</th>
                    <th className="text-center px-6 py-4 text-sm font-semibold text-slate-400">Sự Cố Ghi Nhận</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-slate-400">Trạng Thái</th>
                    <th className="text-right px-6 py-4 text-sm font-semibold text-slate-400">Xuất</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {historicalReports.map((report) => (
                    <tr key={report.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 text-slate-300">{report.date}</td>
                      <td className="px-6 py-4 text-white font-medium">{report.tournament}</td>
                      <td className="px-6 py-4 text-[#FFDE42] font-medium">{report.winner}</td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-slate-300">{report.incidents}</span>
                      </td>
                      <td className="px-6 py-4">
                        <Chip
                          label={report.status}
                          size="small"
                          sx={{
                            backgroundColor: 'rgba(16, 185, 129, 0.2)',
                            color: '#FFDE42',
                            border: `1px solid #FFDE42`,
                            fontWeight: 'bold'
                          }}
                        />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<Download />}
                          sx={{
                            borderColor: 'rgba(255,255,255,0.2)',
                            color: 'white',
                            textTransform: 'none',
                            '&:hover': { borderColor: '#FFDE42', color: '#FFDE42', background: 'rgba(255,222,66,0.05)' }
                          }}
                        >
                          PDF
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* DIALOGS */}

      {/* 1. Pre-Check Dialog */}
      <Dialog 
        open={preCheckOpen} 
        onClose={() => setPreCheckOpen(false)} 
        maxWidth="md" 
        fullWidth
        PaperProps={{ style: { backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px' } }}
      >
        <DialogTitle sx={{ color: 'white', borderBottom: '1px solid rgba(255,255,255,0.1)', pb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
          <ClipboardCheck className="w-5 h-5 text-[#FFDE42]" />
          Kiểm Tra Chính Thức Trước Đua
        </DialogTitle>
        <DialogContent sx={{ paddingTop: '24px !important' }}>
          {selectedRace && selectedRace.horses && selectedRace.horses.length > 0 && (
            <div className="flex gap-6 h-[400px]">
              {/* Horse List Sidebar */}
              <div className="w-1/3 border-r border-white/10 pr-4 space-y-2 overflow-y-auto">
                <div className="text-xs text-slate-500 uppercase font-bold mb-3">Danh Sách</div>
                {selectedRace.horses.map((horse: any, idx: number) => (
                  <div 
                    key={horse.id}
                    onClick={() => setSelectedHorseIndex(idx)}
                    className={`p-3 rounded-xl cursor-pointer border transition-colors ${
                      selectedHorseIndex === idx 
                        ? 'bg-[#FFDE42]/20 border-emerald-500/50' 
                        : 'bg-white/5 border-transparent hover:bg-white/10'
                    }`}
                  >
                    <div className="text-white font-semibold text-sm mb-1">{horse.name}</div>
                    <div className="text-slate-400 text-xs">{horse.jockey}</div>
                    {horse.passed === true && <CheckCircle className="w-4 h-4 text-[#FFDE42] mt-2" />}
                    {horse.passed === false && <X className="w-4 h-4 text-red-500 mt-2" />}
                  </div>
                ))}
              </div>

              {/* Checklist Area */}
              <div className="w-2/3 pl-2 overflow-y-auto">
                <h3 className="text-xl font-bold text-white mb-4">{selectedRace.horses[selectedHorseIndex].name}</h3>
                
                <FormGroup sx={{ gap: 2 }}>
                  <div className="bg-slate-900/50 p-4 rounded-xl border border-white/5">
                    <FormControlLabel
                      control={<Checkbox sx={{ color: '#64748b', '&.Mui-checked': { color: '#FFDE42' } }} />}
                      label={<span className="text-slate-200">Đã Xác Minh Tư Cách & Giấy Tờ</span>}
                    />
                    <div className="text-xs text-slate-500 ml-8">Hộ chiếu, hồ sơ tiêm chủng, tư cách cấp hiện tại.</div>
                  </div>
                  <div className="bg-slate-900/50 p-4 rounded-xl border border-white/5">
                    <FormControlLabel
                      control={<Checkbox sx={{ color: '#64748b', '&.Mui-checked': { color: '#FFDE42' } }} />}
                      label={<span className="text-slate-200">Đã Kiểm Tra Sức Khỏe & Sinh Hiệu</span>}
                    />
                    <div className="text-xs text-slate-500 ml-8">Không có dấu hiệu khập khễnh, bệnh tật hoặc chất cấm.</div>
                  </div>
                  <div className="bg-slate-900/50 p-4 rounded-xl border border-white/5">
                    <FormControlLabel
                      control={<Checkbox sx={{ color: '#64748b', '&.Mui-checked': { color: '#FFDE42' } }} />}
                      label={<span className="text-slate-200">Tuân Thủ Thiết Bị</span>}
                    />
                    <div className="text-xs text-slate-500 ml-8">Trọng lượng yên, hàm thiếc và bịt mắt đáp ứng quy định chính thức.</div>
                  </div>
                </FormGroup>

                <div className="mt-6 flex gap-3">
                  <Button
                    variant="contained"
                    fullWidth
                    sx={{ background: '#10b981', '&:hover': { background: '#059669' } }}
                    onClick={() => {
                      const updated = [...selectedRace.horses];
                      updated[selectedHorseIndex].passed = true;
                      setSelectedRace({...selectedRace, horses: updated});
                      if (selectedHorseIndex < selectedRace.horses.length - 1) setSelectedHorseIndex(selectedHorseIndex + 1);
                    }}
                  >
                    Đánh Dấu ĐẠT
                  </Button>
                  <Button
                    variant="outlined"
                    fullWidth
                    sx={{ borderColor: '#ef4444', color: '#ef4444', '&:hover': { backgroundColor: 'rgba(239,68,68,0.1)', borderColor: '#dc2626' } }}
                  >
                    Đánh Dấu KHÔNG ĐẠT
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
        <DialogActions sx={{ borderTop: '1px solid rgba(255,255,255,0.1)', padding: '16px 24px' }}>
          <Button onClick={() => setPreCheckOpen(false)} sx={{ color: '#94a3b8', textTransform: 'none' }}>Đóng</Button>
          <Button variant="contained" sx={{ background: '#3b82f6', textTransform: 'none', '&:hover': { background: '#2563eb' } }}>Gửi Báo Cáo Kiểm Tra</Button>
        </DialogActions>
      </Dialog>

      {/* 2. Incident Dialog */}
      <Dialog 
        open={incidentOpen} 
        onClose={() => setIncidentOpen(false)} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{ style: { backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px' } }}
      >
        <DialogTitle sx={{ color: 'white', borderBottom: '1px solid rgba(255,255,255,0.1)', pb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
          <AlertTriangle className="w-5 h-5 text-amber-500" />
          Ghi Nhận Sự Cố Chính Thức
        </DialogTitle>
        <DialogContent sx={{ paddingTop: '24px !important' }}>
          <div className="space-y-5">
            <FormControl fullWidth sx={{
                '& .MuiInputLabel-root': { color: '#94a3b8' },
                '& .MuiOutlinedInput-root': { color: 'white', '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' }, '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.2)' }, '&.Mui-focused fieldset': { borderColor: '#f59e0b' }, '& .MuiSelect-icon': { color: '#94a3b8' } }
              }}>
              <InputLabel>Ngựa / Kỵ Sĩ Vi Phạm</InputLabel>
              <Select defaultValue="">
                <MenuItem value="1">Wild Fire (David Chen)</MenuItem>
                <MenuItem value="2">Lightning (Emma Davis)</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth sx={{
                '& .MuiInputLabel-root': { color: '#94a3b8' },
                '& .MuiOutlinedInput-root': { color: 'white', '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' }, '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.2)' }, '&.Mui-focused fieldset': { borderColor: '#f59e0b' }, '& .MuiSelect-icon': { color: '#94a3b8' } }
              }}>
              <InputLabel>Loại Sự Cố</InputLabel>
              <Select defaultValue="">
                <MenuItem value="false-start">Xuất Phát Sai</MenuItem>
                <MenuItem value="collision">Va Chạm Cố Ý</MenuItem>
                <MenuItem value="interference">Can Thiệp Bất Hợp Pháp</MenuItem>
                <MenuItem value="dangerous">Cưỡi Nguy Hiểm</MenuItem>
                <MenuItem value="doping">Nghi Ngờ Doping</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth sx={{
                '& .MuiInputLabel-root': { color: '#94a3b8' },
                '& .MuiOutlinedInput-root': { color: 'white', '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' }, '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.2)' }, '&.Mui-focused fieldset': { borderColor: '#f59e0b' }, '& .MuiSelect-icon': { color: '#94a3b8' } }
              }}>
              <InputLabel>Hành Động Thực Hiện</InputLabel>
              <Select defaultValue="">
                <MenuItem value="warning">Cảnh Cáo (Chỉ Ghi Nhận)</MenuItem>
                <MenuItem value="penalty">Phạt Thời Gian/Điểm</MenuItem>
                <MenuItem value="disqualification">Loại Ngay Lập Tức</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Mô Tả Chi Tiết"
              multiline
              rows={3}
              sx={{
                '& .MuiInputLabel-root': { color: '#94a3b8' },
                '& .MuiOutlinedInput-root': { color: 'white', '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' }, '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.2)' }, '&.Mui-focused fieldset': { borderColor: '#f59e0b' } }
              }}
            />
          </div>
        </DialogContent>
        <DialogActions sx={{ borderTop: '1px solid rgba(255,255,255,0.1)', padding: '16px 24px' }}>
          <Button onClick={() => setIncidentOpen(false)} sx={{ color: '#94a3b8', textTransform: 'none' }}>Hủy</Button>
          <Button variant="contained" sx={{ background: '#f59e0b', textTransform: 'none', '&:hover': { background: '#d97706' } }}>Thêm Vào Nhật Ký</Button>
        </DialogActions>
      </Dialog>

      {/* 3. Verify Dialog */}
      <Dialog 
        open={verifyOpen} 
        onClose={() => setVerifyOpen(false)} 
        maxWidth="md" 
        fullWidth
        PaperProps={{ style: { backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px' } }}
      >
        <DialogTitle sx={{ color: 'white', borderBottom: '1px solid rgba(255,255,255,0.1)', pb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
          <CheckCircle className="w-5 h-5 text-[#FFDE42]" />
          Xác Nhận Kết Quả Chính Thức
        </DialogTitle>
        <DialogContent sx={{ paddingTop: '24px !important' }}>
          {selectedRace && (
            <div className="space-y-6">
              <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl text-amber-200 text-sm">
                <strong>Chú ý:</strong> Xác nhận kết quả này sẽ tự động kích hoạt thanh toán giải thưởng, cập nhật xếp hạng và thanh toán cược. Hành động này không thể hoàn tác.
              </div>

              <table className="w-full text-sm">
                <thead className="bg-slate-900 border-b border-white/10">
                  <tr>
                    <th className="text-left py-3 px-4 text-slate-400 font-semibold">Hạng Chính Thức</th>
                    <th className="text-left py-3 px-4 text-slate-400 font-semibold">Ngựa</th>
                    <th className="text-left py-3 px-4 text-slate-400 font-semibold">Thời Gian Cơ Bản</th>
                    <th className="text-left py-3 px-4 text-slate-400 font-semibold">Hình Phạt</th>
                    <th className="text-left py-3 px-4 text-slate-400 font-semibold">Trạng Thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {selectedRace.provisionalResults && selectedRace.provisionalResults.map((res: any) => (
                    <tr key={res.pos}>
                      <td className="py-3 px-4 text-white font-bold text-lg">{res.pos}</td>
                      <td className="py-3 px-4 text-[#FFDE42]">{res.horse}</td>
                      <td className="py-3 px-4 text-slate-300 font-mono">{res.time}</td>
                      <td className="py-3 px-4 text-red-400">{res.penalty !== 'None' ? res.penalty : '-'}</td>
                      <td className="py-3 px-4">
                        <Select
                          size="small"
                          defaultValue="verified"
                          sx={{
                            color: 'white', height: '32px', fontSize: '0.8rem',
                            '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                            '& .MuiSelect-icon': { color: '#94a3b8' }
                          }}
                        >
                          <MenuItem value="verified">Đã Xác Minh</MenuItem>
                          <MenuItem value="dq">Bị Loại</MenuItem>
                        </Select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <TextField
                fullWidth
                label="Ghi Chú Cuối Cùng Của Trọng Tài (Tùy Chọn)"
                multiline
                rows={2}
                sx={{
                  '& .MuiInputLabel-root': { color: '#94a3b8' },
                  '& .MuiOutlinedInput-root': { color: 'white', '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' }, '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.2)' }, '&.Mui-focused fieldset': { borderColor: '#10b981' } }
                }}
              />
            </div>
          )}
        </DialogContent>
        <DialogActions sx={{ borderTop: '1px solid rgba(255,255,255,0.1)', padding: '16px 24px' }}>
          <Button onClick={() => setVerifyOpen(false)} sx={{ color: '#94a3b8', textTransform: 'none' }}>Hủy</Button>
          <Button variant="contained" sx={{ background: '#10b981', textTransform: 'none', fontWeight: 600, '&:hover': { background: '#059669' } }}>Phê Duyệt Kết Quả & Tạo Báo Cáo</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}