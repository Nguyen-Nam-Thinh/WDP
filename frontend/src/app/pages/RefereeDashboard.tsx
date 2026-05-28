import { useState, useEffect } from 'react';
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
  Flag,
  Activity,
  ClipboardCheck,
  Download,
  AlertCircle,
  Search,
  User,
  Award,
  Heart,
  Scale,
  Stethoscope,
  BadgeCheck,
  ChevronRight,
  Star
} from 'lucide-react';
import {
  Button, Chip, Dialog, DialogTitle, DialogContent, DialogActions,
  FormControlLabel, Checkbox, FormGroup, Divider
} from '@mui/material';
import { ProfileDropdown } from '../components/ProfileDropdown';
import { useAuth } from '../hooks/useAuth';

const refereeProfile = {
  name: 'Nguyễn Văn Hoàng',
  licenseNumber: 'REF-2026-X89',
  level: 'Cao Cấp',
  yearsOfService: 12,
  totalRacesOfficiated: 284,
  avatar: null,
  certifications: ['FEI Level 3', 'Doping Control Officer', 'Starter License'],
  currentAssignments: 2,
};

export function RefereeDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      navigate('/');
    }
  }, [user, navigate]);
  const [activeTab, setActiveTab] = useState('pre-check');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  // Dialog States
  const [preCheckOpen, setPreCheckOpen] = useState(false);
  const [verifyOpen, setVerifyOpen] = useState(false);

  const [selectedRace, setSelectedRace] = useState<any>(null);
  const [selectedHorseIndex, setSelectedHorseIndex] = useState(0);
  const [checkItems, setCheckItems] = useState<Record<string, Record<string, boolean>>>({});
  const [horseNotes, setHorseNotes] = useState<Record<string, string>>({});

  // MOCK DATA
  const upcomingRaces = [
    {
      id: 1, date: '2026-05-25', time: '14:00', tournament: 'Spring Championship', location: 'Emerald Track',
      distance: '2000m', grade: 'G1', purse: '$120,000',
      status: 'Pre-Check Pending',
      horses: [
        {
          id: 101, name: 'Thunder Strike', jockey: 'Mike Johnson', passed: null, failReason: '',
          breed: 'Thoroughbred', gender: 'Đực', age: 5, weight: 490, color: 'Nâu Sẫm',
          totalPoints: 215, currentGrade: 'G1', winCount: 8, raceCount: 14,
          lastRace: '2026-05-10', vetClearance: '2026-05-24',
          jockeyWeight: 55.2, jockeyLicense: 'JOC-2021-087', jockeyExperience: 7,
          equipmentWeight: 56.0,
        },
        {
          id: 102, name: 'Storm Runner', jockey: 'Sarah Williams', passed: null, failReason: '',
          breed: 'Thoroughbred', gender: 'Cái', age: 4, weight: 455, color: 'Xám Dapple',
          totalPoints: 180, currentGrade: 'G1', winCount: 6, raceCount: 11,
          lastRace: '2026-05-08', vetClearance: '2026-05-24',
          jockeyWeight: 53.8, jockeyLicense: 'JOC-2019-042', jockeyExperience: 9,
          equipmentWeight: 56.0,
        },
        {
          id: 103, name: 'Golden Arrow', jockey: 'Tom Wilson', passed: null, failReason: '',
          breed: 'Quarter Horse', gender: 'Đực', age: 6, weight: 512, color: 'Vàng Hạt Dẻ',
          totalPoints: 310, currentGrade: 'G1', winCount: 12, raceCount: 20,
          lastRace: '2026-05-05', vetClearance: '2026-05-23',
          jockeyWeight: 56.5, jockeyLicense: 'JOC-2018-015', jockeyExperience: 11,
          equipmentWeight: 56.0,
        },
      ]
    },
    {
      id: 2, date: '2026-05-25', time: '16:00', tournament: 'Golden Cup Qualifier', location: 'Sapphire Arena',
      distance: '1600m', grade: 'G2', purse: '$60,000',
      status: 'Scheduled', horses: []
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
    { label: 'Cuộc Đua Đã Kiểm Tra', value: '42', icon: ClipboardCheck, color: 'from-[#FFDE42] to-[#b8960a]' },
    { label: 'Chờ Kiểm Tra', value: '1', icon: Clock, color: 'from-amber-500 to-amber-700' },
    { label: 'Sự Cố Ghi Nhận', value: '18', icon: AlertTriangle, color: 'from-red-500 to-red-700' },
    { label: 'Kết Quả Đã Xác Minh', value: '156', icon: CheckCircle, color: 'from-indigo-500 to-indigo-700' },
  ];

  const checkCategories = [
    {
      key: 'eligibility',
      title: 'Tư Cách & Giấy Tờ',
      icon: BadgeCheck,
      color: 'blue',
      items: [
        { key: 'passport', label: 'Hộ chiếu ngựa hợp lệ & đã xác minh' },
        { key: 'vaccination', label: 'Tiêm phòng đầy đủ (cúm ngựa, uốn ván)' },
        { key: 'grade_eligible', label: 'Đủ điều kiện cấp bậc cho cuộc đua' },
        { key: 'ownership', label: 'Giấy tờ sở hữu khớp với đăng ký' },
      ]
    },
    {
      key: 'health',
      title: 'Kiểm Tra Sức Khỏe',
      icon: Stethoscope,
      color: 'green',
      items: [
        { key: 'no_lameness', label: 'Không có dấu hiệu khập khễnh hoặc chấn thương' },
        { key: 'vital_signs', label: 'Nhịp tim & nhiệt độ trong giới hạn bình thường' },
        { key: 'coat_condition', label: 'Tình trạng lông bờm bình thường, không có vết thương hở' },
        { key: 'eyes_clear', label: 'Mắt sáng, không chảy dịch bất thường' },
        { key: 'breathing', label: 'Hô hấp đều đặn, không có tiếng bất thường' },
      ]
    },
    {
      key: 'doping',
      title: 'Kiểm Tra Doping',
      icon: Activity,
      color: 'purple',
      items: [
        { key: 'sample_collected', label: 'Đã lấy mẫu xét nghiệm theo quy định' },
        { key: 'no_prohibited', label: 'Không phát hiện chất bị cấm tại chỗ' },
        { key: 'vet_clearance', label: 'Bác sĩ thú y đã ký giấy thông qua' },
      ]
    },
    {
      key: 'equipment',
      title: 'Thiết Bị & Kỵ Sĩ',
      icon: Scale,
      color: 'orange',
      items: [
        { key: 'saddle_weight', label: 'Tổng trọng lượng yên cương đúng quy định' },
        { key: 'bit_check', label: 'Hàm thiếc hợp lệ theo quy định chủng loại' },
        { key: 'blinkers', label: 'Bịt mắt (nếu có) đã được phê duyệt trước' },
        { key: 'jockey_license', label: 'Giấy phép kỵ sĩ còn hiệu lực' },
        { key: 'jockey_weight', label: 'Cân nặng kỵ sĩ + thiết bị đạt chuẩn' },
        { key: 'silks', label: 'Màu áo kỵ sĩ khớp với đăng ký chủ ngựa' },
      ]
    },
  ];

  const handleOpenPreCheck = (race: any) => {
    setSelectedRace(race);
    setSelectedHorseIndex(0);
    const initChecks: Record<string, Record<string, boolean>> = {};
    race.horses.forEach((h: any) => {
      initChecks[h.id] = {};
      checkCategories.forEach(cat => cat.items.forEach(item => { initChecks[h.id][item.key] = false; }));
    });
    setCheckItems(initChecks);
    setHorseNotes({});
    setPreCheckOpen(true);
  };

  const handleOpenVerify = (race: any) => {
    setSelectedRace(race);
    setVerifyOpen(true);
  };

  const toggleCheckItem = (horseId: number, itemKey: string) => {
    setCheckItems(prev => ({
      ...prev,
      [horseId]: { ...prev[horseId], [itemKey]: !prev[horseId]?.[itemKey] }
    }));
  };

  const getHorseCompletionRate = (horseId: number) => {
    const checks = checkItems[horseId] || {};
    const total = checkCategories.reduce((acc, cat) => acc + cat.items.length, 0);
    const done = Object.values(checks).filter(Boolean).length;
    return total > 0 ? Math.round((done / total) * 100) : 0;
  };

  const currentHorse = selectedRace?.horses?.[selectedHorseIndex];
  const currentHorseChecks = currentHorse ? checkItems[currentHorse.id] || {} : {};

  return (
    <div className="min-h-screen bg-slate-950 font-sans">
      {/* Top Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-lg border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="cursor-pointer" onClick={() => navigate('/')}>
              <img src="/images/logo.png" alt="RaceTrack Logo" className="w-11 h-11 object-contain drop-shadow-md" />
            </div>
            <div>
              <div className="text-white font-semibold flex items-center gap-2">
                Cổng Trọng Tài
                <Chip label={`Cấp: ${refereeProfile.level}`} size="small" sx={{ height: '18px', fontSize: '0.65rem', bgcolor: 'rgba(255, 222, 66, 0.2)', color: '#FFDE42', fontWeight: 'bold' }} />
              </div>
              <div className="text-xs text-slate-400">{refereeProfile.licenseNumber} • {refereeProfile.yearsOfService} Năm Kinh Nghiệm</div>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <div className="flex items-center gap-2 bg-emerald-500/10 text-emerald-400 px-3 py-1.5 rounded-lg border border-emerald-500/20 text-sm font-medium">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
              Hệ Thống Hoạt Động
            </div>

            {/* Profile Dropdown */}
            <ProfileDropdown />
          </div>

          <button className="md:hidden text-white" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </nav>

      <div className="pt-20 max-w-7xl mx-auto px-6 py-8">
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
            { id: 'verification', label: 'Xác Minh Kết Quả', icon: CheckCircle, badge: 1 },
            { id: 'reports', label: 'Báo Cáo Chính Thức', icon: FileText }
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
              {tab.badge && (
                <span className={`ml-1 text-white text-xs py-0.5 px-2 rounded-full font-bold ${activeTab === tab.id ? 'bg-black/20' : 'bg-[#FFDE42] text-slate-900'}`}>
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content: Pre-Race Check */}
        {activeTab === 'pre-check' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-6">
              <h2 className="text-3xl font-bold text-white mb-2">Kiểm Tra Trước Đua</h2>
              <p className="text-slate-400">Xác minh tư cách tham gia, sức khỏe, doping và thiết bị của ngựa trước khi cho phép bắt đầu cuộc đua</p>
            </div>

            <div className="space-y-4">
              {upcomingRaces.map(race => (
                <div key={race.id} className="bg-white/5 backdrop-blur-md border border-white/5 rounded-2xl p-6 hover:border-[#FFDE42]/30 transition-all">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center">
                          <ClipboardCheck className="w-5 h-5 text-[#FFDE42]" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-xl font-bold text-white">{race.tournament}</h3>
                            <Chip label={race.grade} size="small" sx={{ height: '20px', fontSize: '0.7rem', bgcolor: '#f59e0b', color: 'white', fontWeight: 'bold' }} />
                            <Chip
                              label={race.status}
                              size="small"
                              sx={{
                                backgroundColor: race.status === 'Pre-Check Pending' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(100, 116, 139, 0.2)',
                                color: race.status === 'Pre-Check Pending' ? '#fbbf24' : '#94a3b8',
                                border: `1px solid ${race.status === 'Pre-Check Pending' ? '#f59e0b' : '#475569'}`,
                                fontWeight: 'bold'
                              }}
                            />
                          </div>
                          <div className="text-slate-400 text-sm mt-0.5">{race.date} lúc {race.time}</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 bg-slate-900/50 p-4 rounded-xl border border-white/5 mb-4">
                        <div>
                          <div className="text-slate-500 text-xs uppercase mb-1 flex items-center gap-1"><Flag className="w-3 h-3"/> Địa Điểm</div>
                          <div className="text-white font-medium text-sm">{race.location}</div>
                        </div>
                        <div>
                          <div className="text-slate-500 text-xs uppercase mb-1 flex items-center gap-1"><Activity className="w-3 h-3"/> Cự Ly</div>
                          <div className="text-white font-medium text-sm">{race.distance}</div>
                        </div>
                        <div>
                          <div className="text-slate-500 text-xs uppercase mb-1 flex items-center gap-1"><Award className="w-3 h-3"/> Giải Thưởng</div>
                          <div className="text-[#FFDE42] font-semibold text-sm">{race.purse}</div>
                        </div>
                        <div>
                          <div className="text-slate-500 text-xs uppercase mb-1">Tham Gia</div>
                          <div className="text-white font-medium text-sm">{race.horses?.length || 0} ngựa</div>
                        </div>
                        <div className="flex items-end justify-end">
                          <Button
                            variant="contained"
                            disabled={race.status !== 'Pre-Check Pending'}
                            onClick={() => handleOpenPreCheck(race)}
                            sx={{
                              background: race.status === 'Pre-Check Pending' ? '#FFDE42' : '#334155',
                              color: race.status === 'Pre-Check Pending' ? '#1B0C0C' : 'white',
                              textTransform: 'none',
                              fontWeight: 700,
                              fontSize: '0.8rem',
                              '&:hover': { background: '#f0d000' }
                            }}
                          >
                            Bắt Đầu Kiểm Tra
                          </Button>
                        </div>
                      </div>

                      {/* Horse quick list */}
                      {race.horses && race.horses.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {race.horses.map((horse: any) => (
                            <div key={horse.id} className="flex items-center gap-2 bg-slate-900/60 border border-white/5 rounded-lg px-3 py-1.5 text-sm">
                              <div className="w-1.5 h-1.5 rounded-full bg-amber-400"></div>
                              <span className="text-slate-300">{horse.name}</span>
                              <span className="text-slate-500">—</span>
                              <span className="text-slate-400 text-xs">{horse.jockey}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
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
                        textTransform: 'none',
                        fontWeight: 600,
                        '&:hover': { background: '#f0d000' }
                      }}
                    >
                      Xem Xét & Xác Minh
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
                          <th className="text-left py-3 px-4 text-slate-400 font-semibold">Phạt</th>
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
                              {res.penalty === 'None'
                                ? <span className="text-slate-500">Không</span>
                                : <span className="text-red-400 font-medium">{res.penalty}</span>
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
                    <th className="text-left px-6 py-4 text-sm font-semibold text-slate-400">Người Thắng</th>
                    <th className="text-center px-6 py-4 text-sm font-semibold text-slate-400">Sự Cố</th>
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
                      <td className="px-6 py-4 text-center text-slate-300">{report.incidents}</td>
                      <td className="px-6 py-4">
                        <Chip
                          label={report.status}
                          size="small"
                          sx={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: '1px solid #10b981', fontWeight: 'bold' }}
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

      {/* ===== DIALOGS ===== */}

      {/* Referee Profile Dialog */}
      <Dialog
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ style: { backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px' } }}
      >
        <DialogTitle sx={{ color: 'white', borderBottom: '1px solid rgba(255,255,255,0.08)', pb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-[#FFDE42]" />
            Hồ Sơ Trọng Tài
          </div>
          <button onClick={() => setProfileOpen(false)} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </DialogTitle>
        <DialogContent sx={{ paddingTop: '24px !important' }}>
          <div className="space-y-6">
            {/* Avatar & Name */}
            <div className="flex items-center gap-5">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#FFDE42] to-amber-600 flex items-center justify-center shadow-xl flex-shrink-0">
                <User className="w-10 h-10 text-slate-900" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white">{refereeProfile.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <Chip label={`Cấp ${refereeProfile.level}`} size="small" sx={{ bgcolor: 'rgba(255,222,66,0.2)', color: '#FFDE42', fontWeight: 'bold', fontSize: '0.7rem' }} />
                  <span className="text-slate-400 text-sm">Trọng Tài Chuyên Nghiệp</span>
                </div>
                <div className="text-slate-500 text-sm mt-1 font-mono">{refereeProfile.licenseNumber}</div>
              </div>
            </div>

            <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)' }} />

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Năm Kinh Nghiệm', value: refereeProfile.yearsOfService, unit: 'năm', icon: Calendar, color: 'text-blue-400' },
                { label: 'Cuộc Đua Giám Sát', value: refereeProfile.totalRacesOfficiated, unit: 'lần', icon: Flag, color: 'text-[#FFDE42]' },
                { label: 'Phân Công Hiện Tại', value: refereeProfile.currentAssignments, unit: 'cuộc đua', icon: ClipboardCheck, color: 'text-emerald-400' },
              ].map((item, i) => (
                <div key={i} className="bg-slate-900/70 rounded-xl p-4 border border-white/5 text-center">
                  <item.icon className={`w-5 h-5 ${item.color} mx-auto mb-2`} />
                  <div className={`text-2xl font-bold ${item.color}`}>{item.value}</div>
                  <div className="text-slate-500 text-xs mt-1">{item.unit}</div>
                  <div className="text-slate-400 text-xs">{item.label}</div>
                </div>
              ))}
            </div>

            <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)' }} />

            {/* Certifications */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Star className="w-4 h-4 text-[#FFDE42]" />
                <span className="text-white font-semibold text-sm uppercase tracking-wide">Chứng Chỉ & Bằng Cấp</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {refereeProfile.certifications.map((cert, i) => (
                  <div key={i} className="flex items-center gap-1.5 bg-slate-900/60 border border-white/10 rounded-lg px-3 py-1.5">
                    <BadgeCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-slate-300 text-sm">{cert}</span>
                  </div>
                ))}
              </div>
            </div>

            <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)' }} />

            {/* Current Assignments */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <ClipboardCheck className="w-4 h-4 text-[#FFDE42]" />
                <span className="text-white font-semibold text-sm uppercase tracking-wide">Phân Công Hiện Tại</span>
              </div>
              <div className="space-y-2">
                {upcomingRaces.map(race => (
                  <div key={race.id} className="flex items-center justify-between bg-slate-900/60 border border-white/5 rounded-xl px-4 py-3">
                    <div>
                      <div className="text-white text-sm font-medium">{race.tournament}</div>
                      <div className="text-slate-500 text-xs mt-0.5">{race.date} • {race.time} • {race.location}</div>
                    </div>
                    <Chip label={race.grade} size="small" sx={{ bgcolor: '#f59e0b', color: 'white', fontWeight: 'bold', fontSize: '0.65rem' }} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
        <DialogActions sx={{ borderTop: '1px solid rgba(255,255,255,0.08)', padding: '16px 24px' }}>
          <Button onClick={() => setProfileOpen(false)} sx={{ color: '#94a3b8', textTransform: 'none' }}>Đóng</Button>
          <Button variant="outlined" sx={{ borderColor: 'rgba(255,222,66,0.4)', color: '#FFDE42', textTransform: 'none', '&:hover': { borderColor: '#FFDE42', bgcolor: 'rgba(255,222,66,0.05)' } }}>
            Chỉnh Sửa Hồ Sơ
          </Button>
        </DialogActions>
      </Dialog>

      {/* Pre-Check Dialog */}
      <Dialog
        open={preCheckOpen}
        onClose={() => setPreCheckOpen(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{ style: { backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', maxHeight: '92vh' } }}
      >
        <DialogTitle sx={{ color: 'white', borderBottom: '1px solid rgba(255,255,255,0.08)', pb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
          <ClipboardCheck className="w-5 h-5 text-[#FFDE42]" />
          Kiểm Tra Chính Thức Trước Đua
          {selectedRace && (
            <span className="text-slate-400 font-normal text-base ml-1">— {selectedRace.tournament}</span>
          )}
        </DialogTitle>

        <DialogContent sx={{ paddingTop: '20px !important', overflowY: 'auto' }}>
          {selectedRace && selectedRace.horses && selectedRace.horses.length > 0 && currentHorse && (
            <div className="flex gap-5" style={{ minHeight: '520px' }}>
              {/* Horse Sidebar */}
              <div className="w-56 flex-shrink-0 border-r border-white/8 pr-4 space-y-2 overflow-y-auto">
                <div className="text-xs text-slate-500 uppercase font-bold mb-3 tracking-wider">Danh Sách Ngựa</div>
                {selectedRace.horses.map((horse: any, idx: number) => {
                  const rate = getHorseCompletionRate(horse.id);
                  return (
                    <div
                      key={horse.id}
                      onClick={() => setSelectedHorseIndex(idx)}
                      className={`p-3 rounded-xl cursor-pointer border transition-all ${
                        selectedHorseIndex === idx
                          ? 'bg-[#FFDE42]/15 border-[#FFDE42]/40'
                          : 'bg-white/4 border-transparent hover:bg-white/8'
                      }`}
                    >
                      <div className="text-white font-semibold text-sm">{horse.name}</div>
                      <div className="text-slate-400 text-xs mt-0.5">{horse.jockey}</div>
                      <div className="mt-2 flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#FFDE42] rounded-full transition-all"
                            style={{ width: `${rate}%` }}
                          />
                        </div>
                        <span className="text-xs text-slate-400 font-mono w-8 text-right">{rate}%</span>
                      </div>
                      {horse.passed === true && (
                        <div className="flex items-center gap-1 mt-1.5 text-emerald-400 text-xs font-medium">
                          <CheckCircle className="w-3 h-3" /> ĐẠT
                        </div>
                      )}
                      {horse.passed === false && (
                        <div className="flex items-center gap-1 mt-1.5 text-red-400 text-xs font-medium">
                          <X className="w-3 h-3" /> KHÔNG ĐẠT
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Main Check Area */}
              <div className="flex-1 overflow-y-auto pl-1">
                {/* Horse Info Header */}
                <div className="bg-slate-900/70 rounded-2xl border border-white/8 p-5 mb-5">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-white">{currentHorse.name}</h3>
                      <div className="text-slate-400 text-sm mt-0.5">Kỵ sĩ: <span className="text-white font-medium">{currentHorse.jockey}</span></div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Chip label={currentHorse.currentGrade} size="small" sx={{ bgcolor: '#f59e0b', color: 'white', fontWeight: 'bold' }} />
                      <div className="text-right">
                        <div className="text-[#FFDE42] font-bold text-lg">{getHorseCompletionRate(currentHorse.id)}%</div>
                        <div className="text-slate-500 text-xs">hoàn thành</div>
                      </div>
                    </div>
                  </div>

                  {/* Horse Detail Grid */}
                  <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                    {[
                      { label: 'Giống', value: currentHorse.breed },
                      { label: 'Giới Tính', value: currentHorse.gender },
                      { label: 'Tuổi', value: `${currentHorse.age} tuổi` },
                      { label: 'Cân Nặng', value: `${currentHorse.weight} kg` },
                      { label: 'Màu Lông', value: currentHorse.color },
                      { label: 'Tổng Điểm', value: currentHorse.totalPoints },
                    ].map((field, i) => (
                      <div key={i} className="bg-slate-950/60 rounded-lg p-2.5 text-center">
                        <div className="text-slate-500 text-xs mb-1">{field.label}</div>
                        <div className="text-white text-sm font-semibold">{field.value}</div>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                    {[
                      { label: 'Tỉ Lệ Thắng', value: `${currentHorse.winCount}/${currentHorse.raceCount} (${Math.round(currentHorse.winCount/currentHorse.raceCount*100)}%)` },
                      { label: 'Race Cuối', value: currentHorse.lastRace },
                      { label: 'Giấy Thú Y', value: currentHorse.vetClearance },
                      { label: 'TL Thiết Bị Chuẩn', value: `${currentHorse.equipmentWeight} kg` },
                    ].map((field, i) => (
                      <div key={i} className="bg-slate-950/60 rounded-lg p-2.5">
                        <div className="text-slate-500 text-xs mb-1">{field.label}</div>
                        <div className="text-white text-sm font-semibold">{field.value}</div>
                      </div>
                    ))}
                  </div>

                  {/* Jockey Info */}
                  <div className="mt-3 bg-blue-500/8 border border-blue-500/20 rounded-xl p-3">
                    <div className="text-blue-400 text-xs font-bold uppercase mb-2 flex items-center gap-1.5">
                      <User className="w-3 h-3" /> Thông Tin Kỵ Sĩ
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <div className="text-slate-500 text-xs">Giấy Phép</div>
                        <div className="text-white text-sm font-mono font-medium mt-0.5">{currentHorse.jockeyLicense}</div>
                      </div>
                      <div>
                        <div className="text-slate-500 text-xs">Cân Nặng Thực</div>
                        <div className={`text-sm font-bold mt-0.5 ${currentHorse.jockeyWeight <= currentHorse.equipmentWeight ? 'text-emerald-400' : 'text-red-400'}`}>
                          {currentHorse.jockeyWeight} kg
                          {currentHorse.jockeyWeight > currentHorse.equipmentWeight && ' ⚠ Vượt'}
                        </div>
                      </div>
                      <div>
                        <div className="text-slate-500 text-xs">Kinh Nghiệm</div>
                        <div className="text-white text-sm font-medium mt-0.5">{currentHorse.jockeyExperience} năm</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Checklist Categories */}
                <div className="space-y-4">
                  {checkCategories.map(cat => {
                    const catDone = cat.items.filter(item => currentHorseChecks[item.key]).length;
                    const colorMap: Record<string, string> = {
                      blue: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
                      green: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
                      purple: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
                      orange: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
                    };
                    return (
                      <div key={cat.key} className="bg-slate-900/50 rounded-xl border border-white/5 overflow-hidden">
                        <div className={`flex items-center justify-between px-4 py-3 border-b border-white/5 ${colorMap[cat.color]}`}>
                          <div className="flex items-center gap-2">
                            <cat.icon className="w-4 h-4" />
                            <span className="font-semibold text-sm">{cat.title}</span>
                          </div>
                          <span className="text-xs font-mono">{catDone}/{cat.items.length}</span>
                        </div>
                        <div className="p-3 space-y-1">
                          {cat.items.map(item => (
                            <label
                              key={item.key}
                              className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-colors ${
                                currentHorseChecks[item.key] ? 'bg-emerald-500/8' : 'hover:bg-white/4'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={!!currentHorseChecks[item.key]}
                                onChange={() => toggleCheckItem(currentHorse.id, item.key)}
                                className="w-4 h-4 accent-[#FFDE42] cursor-pointer flex-shrink-0"
                              />
                              <span className={`text-sm ${currentHorseChecks[item.key] ? 'text-emerald-300 line-through decoration-emerald-500/50' : 'text-slate-300'}`}>
                                {item.label}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Notes */}
                <div className="mt-4">
                  <label className="text-slate-400 text-sm font-medium mb-2 block">Ghi Chú Kiểm Tra (tùy chọn)</label>
                  <textarea
                    value={horseNotes[currentHorse.id] || ''}
                    onChange={e => setHorseNotes(prev => ({ ...prev, [currentHorse.id]: e.target.value }))}
                    placeholder="Nhập ghi chú hoặc quan sát đặc biệt cho ngựa này..."
                    rows={3}
                    className="w-full bg-slate-900/70 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-[#FFDE42]/50 resize-none"
                  />
                </div>

                {/* Pass / Fail Buttons */}
                <div className="flex gap-3 mt-4">
                  <Button
                    variant="contained"
                    fullWidth
                    startIcon={<CheckCircle />}
                    sx={{ background: '#10b981', textTransform: 'none', fontWeight: 700, '&:hover': { background: '#059669' } }}
                    onClick={() => {
                      const updated = [...selectedRace.horses];
                      updated[selectedHorseIndex].passed = true;
                      setSelectedRace({ ...selectedRace, horses: updated });
                      if (selectedHorseIndex < selectedRace.horses.length - 1) setSelectedHorseIndex(selectedHorseIndex + 1);
                    }}
                  >
                    Đánh Dấu ĐẠT
                  </Button>
                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<AlertTriangle />}
                    sx={{ borderColor: '#ef4444', color: '#ef4444', textTransform: 'none', fontWeight: 700, '&:hover': { backgroundColor: 'rgba(239,68,68,0.1)', borderColor: '#dc2626' } }}
                    onClick={() => {
                      const updated = [...selectedRace.horses];
                      updated[selectedHorseIndex].passed = false;
                      setSelectedRace({ ...selectedRace, horses: updated });
                    }}
                  >
                    Đánh Dấu KHÔNG ĐẠT
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>

        <DialogActions sx={{ borderTop: '1px solid rgba(255,255,255,0.08)', padding: '16px 24px', gap: 1 }}>
          <Button onClick={() => setPreCheckOpen(false)} sx={{ color: '#94a3b8', textTransform: 'none' }}>Đóng</Button>
          <Button
            variant="contained"
            sx={{ background: '#3b82f6', textTransform: 'none', fontWeight: 600, '&:hover': { background: '#2563eb' } }}
          >
            Gửi Báo Cáo Kiểm Tra
          </Button>
        </DialogActions>
      </Dialog>

      {/* Verify Dialog */}
      <Dialog
        open={verifyOpen}
        onClose={() => setVerifyOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ style: { backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px' } }}
      >
        <DialogTitle sx={{ color: 'white', borderBottom: '1px solid rgba(255,255,255,0.08)', pb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
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
                    <th className="text-left py-3 px-4 text-slate-400 font-semibold">Hạng</th>
                    <th className="text-left py-3 px-4 text-slate-400 font-semibold">Ngựa</th>
                    <th className="text-left py-3 px-4 text-slate-400 font-semibold">Thời Gian</th>
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
        <DialogActions sx={{ borderTop: '1px solid rgba(255,255,255,0.08)', padding: '16px 24px' }}>
          <Button onClick={() => setVerifyOpen(false)} sx={{ color: '#94a3b8', textTransform: 'none' }}>Hủy</Button>
          <Button variant="contained" sx={{ background: '#10b981', textTransform: 'none', fontWeight: 600, '&:hover': { background: '#059669' } }}>
            Phê Duyệt & Tạo Báo Cáo
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
