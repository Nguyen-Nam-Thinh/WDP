import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
import {
  Shield, Calendar, AlertTriangle, CheckCircle, LogOut, Menu, X,
  FileText, Clock, Flag, Activity, ClipboardCheck, Download,
  Search, User, Award, Scale, Stethoscope, BadgeCheck, Star,
} from 'lucide-react';
import {
  Button, Chip, Dialog, DialogTitle, DialogContent, DialogActions,
  FormControlLabel, Checkbox, FormGroup, Divider, CircularProgress,
  TextField, MenuItem, Select, FormControl, InputLabel,
} from '@mui/material';
import { ProfileDropdown } from '../components/ProfileDropdown';
import { useAuth } from '../hooks/useAuth';
import { refereeApi, type RefereeReport, type Incident } from '../api/referee';
import { registrationApi, type Registration } from '../api/registration';
import { raceApi } from '../api/race';
import { toast } from 'sonner';

// ── Check categories (same as before) ─────────────────────────────────────────
const checkCategories = [
  { key: 'eligibility', title: 'Tư Cách & Giấy Tờ', icon: BadgeCheck, color: 'blue',
    items: [
      { key: 'passport', label: 'Hộ chiếu ngựa hợp lệ & đã xác minh' },
      { key: 'vaccination', label: 'Tiêm phòng đầy đủ (cúm ngựa, uốn ván)' },
      { key: 'grade_eligible', label: 'Đủ điều kiện cấp bậc cho cuộc đua' },
      { key: 'ownership', label: 'Giấy tờ sở hữu khớp với đăng ký' },
    ]
  },
  { key: 'health', title: 'Kiểm Tra Sức Khỏe', icon: Stethoscope, color: 'green',
    items: [
      { key: 'no_lameness', label: 'Không có dấu hiệu khập khễnh hoặc chấn thương' },
      { key: 'vital_signs', label: 'Nhịp tim & nhiệt độ trong giới hạn bình thường' },
      { key: 'coat_condition', label: 'Tình trạng lông bờm bình thường, không có vết thương hở' },
      { key: 'eyes_clear', label: 'Mắt sáng, không chảy dịch bất thường' },
      { key: 'breathing', label: 'Hô hấp đều đặn, không có tiếng bất thường' },
    ]
  },
  { key: 'doping', title: 'Kiểm Tra Doping', icon: Activity, color: 'purple',
    items: [
      { key: 'sample_collected', label: 'Đã lấy mẫu xét nghiệm theo quy định' },
      { key: 'no_prohibited', label: 'Không phát hiện chất bị cấm tại chỗ' },
      { key: 'vet_clearance', label: 'Bác sĩ thú y đã ký giấy thông qua' },
    ]
  },
  { key: 'equipment', title: 'Thiết Bị & Kỵ Sĩ', icon: Scale, color: 'orange',
    items: [
      { key: 'saddle_weight', label: 'Tổng trọng lượng yên cương đúng quy định' },
      { key: 'bit_check', label: 'Hàm thiếc hợp lệ theo quy định chủng loại' },
      { key: 'jockey_license', label: 'Giấy phép kỵ sĩ còn hiệu lực' },
      { key: 'jockey_weight', label: 'Cân nặng kỵ sĩ + thiết bị đạt chuẩn' },
      { key: 'silks', label: 'Màu áo kỵ sĩ khớp với đăng ký chủ ngựa' },
    ]
  },
];

const INCIDENT_TYPES = [
  { value: 'interference', label: 'Cản trở' },
  { value: 'doping', label: 'Doping' },
  { value: 'equipment_violation', label: 'Vi phạm thiết bị' },
  { value: 'jockey_violation', label: 'Vi phạm kỵ sĩ' },
  { value: 'other', label: 'Khác' },
];

export function RefereeDashboard() {
  const navigate = useNavigate();
  const { user, token } = useAuth();

  useEffect(() => { if (!user) navigate('/'); }, [user, navigate]);

  const [activeTab, setActiveTab] = useState('pre-check');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // ── Pre-check state ──
  const [assignedRaces, setAssignedRaces] = useState<any[]>([]);
  const [loadingRaces, setLoadingRaces] = useState(true);
  const [selectedRace, setSelectedRace] = useState<any>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loadingRegs, setLoadingRegs] = useState(false);
  const [selectedRegIdx, setSelectedRegIdx] = useState(0);
  const [checkItems, setCheckItems] = useState<Record<string, Record<string, boolean>>>({});
  const [horseNotes, setHorseNotes] = useState<Record<string, string>>({});
  const [preCheckOpen, setPreCheckOpen] = useState(false);
  const [submittingCheck, setSubmittingCheck] = useState(false);

  // ── Reports state ──
  const [reports, setReports] = useState<RefereeReport[]>([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [reportSearch, setReportSearch] = useState('');
  const [createReportDialog, setCreateReportDialog] = useState(false);
  const [selectedReportRaceId, setSelectedReportRaceId] = useState('');
  const [incidentDialog, setIncidentDialog] = useState(false);
  const [activeReport, setActiveReport] = useState<RefereeReport | null>(null);
  const [newIncident, setNewIncident] = useState({ type: 'interference' as Incident['type'], description: '', action: '' });
  const [downloading, setDownloading] = useState<string | null>(null);

  // ── Stats ──
  const stats = [
    { label: 'Race Được Phân Công', value: String(assignedRaces.length), icon: ClipboardCheck, color: 'from-[#FFDE42] to-[#b8960a]' },
    { label: 'Chờ Kiểm Tra', value: String(assignedRaces.filter(r => r.status === 'pre_check').length), icon: Clock, color: 'from-amber-500 to-amber-700' },
    { label: 'Sự Cố Ghi Nhận', value: String(reports.reduce((s, r) => s + r.incidents.length, 0)), icon: AlertTriangle, color: 'from-red-500 to-red-700' },
    { label: 'Báo Cáo Đã Nộp', value: String(reports.filter(r => r.status === 'submitted').length), icon: CheckCircle, color: 'from-indigo-500 to-indigo-700' },
  ];

  // ── Load data ──
  const loadAssignedRaces = useCallback(async () => {
    if (!token) return;
    setLoadingRaces(true);
    try {
      const res = await refereeApi.getAssignedRaces(token, { limit: 50 });
      setAssignedRaces(res.races);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoadingRaces(false);
    }
  }, [token]);

  const loadReports = useCallback(async () => {
    if (!token) return;
    setLoadingReports(true);
    try {
      const res = await refereeApi.getMyReports(token, { limit: 50 });
      setReports(res.reports);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoadingReports(false);
    }
  }, [token]);

  useEffect(() => { loadAssignedRaces(); }, [loadAssignedRaces]);
  useEffect(() => { if (activeTab === 'reports') loadReports(); }, [activeTab, loadReports]);

  const initChecksFromRegs = (regs: Registration[]) => {
    const checks: Record<string, Record<string, boolean>> = {};
    regs.forEach(reg => {
      const alreadyDone = reg.preCheckResult?.status !== 'pending';
      checks[reg._id] = {};
      checkCategories.forEach(cat =>
        cat.items.forEach(item => {
          // Pre-fill all as checked if horse already passed; leave empty if pending/failed
          checks[reg._id][item.key] = alreadyDone && reg.preCheckResult?.status === 'passed';
        })
      );
    });
    return checks;
  };

  const handleOpenPreCheck = async (race: any) => {
    setSelectedRace(race);
    setSelectedRegIdx(0);
    setLoadingRegs(true);
    setPreCheckOpen(true);
    try {
      const res = await raceApi.getRaceRegistrations(token!, race._id);
      const regs: Registration[] = res.registrations || [];
      setRegistrations(regs);
      setCheckItems(initChecksFromRegs(regs));
      setHorseNotes({});
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoadingRegs(false);
    }
  };

  const toggleCheckItem = (regId: string, key: string) =>
    setCheckItems(prev => ({ ...prev, [regId]: { ...prev[regId], [key]: !prev[regId]?.[key] } }));

  const getCompletionRate = (regId: string) => {
    const checks = checkItems[regId] || {};
    const total = checkCategories.reduce((a, c) => a + c.items.length, 0);
    const done = Object.values(checks).filter(Boolean).length;
    return total > 0 ? Math.round((done / total) * 100) : 0;
  };

  const handleSubmitPreCheck = async (status: 'passed' | 'failed') => {
    const reg = registrations[selectedRegIdx];
    if (!reg || !token) return;
    setSubmittingCheck(true);
    try {
      await registrationApi.updatePreCheck(token, reg._id, {
        status,
        note: horseNotes[reg._id] || '',
      });
      toast.success(`Đã ${status === 'passed' ? 'đánh dấu ĐẠT' : 'đánh dấu KHÔNG ĐẠT'} cho ${(reg.horseId as any)?.name}`);
      // Update only this registration's preCheckResult in local state (no full reset)
      setRegistrations(prev =>
        prev.map(r => r._id === reg._id
          ? { ...r, preCheckResult: { status, note: horseNotes[reg._id] || '', checkedAt: new Date().toISOString() } }
          : r
        )
      );
      // Auto-advance to next pending horse
      const nextPending = registrations.findIndex(
        (r, i) => i > selectedRegIdx && r.preCheckResult?.status === 'pending'
      );
      if (nextPending !== -1) setSelectedRegIdx(nextPending);
      if (status === 'passed' && selectedRegIdx < registrations.length - 1) setSelectedRegIdx(i => i + 1);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmittingCheck(false);
    }
  };

  // ── Report actions ──
  const handleCreateReport = async () => {
    if (!token || !selectedReportRaceId) return;
    try {
      await refereeApi.createReport(token, selectedReportRaceId);
      toast.success('Đã tạo báo cáo');
      setCreateReportDialog(false);
      setSelectedReportRaceId('');
      loadReports();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleSubmitReport = async (reportId: string) => {
    if (!token) return;
    try {
      await refereeApi.submitReport(token, reportId);
      toast.success('Báo cáo đã được nộp');
      loadReports();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleAddIncident = async () => {
    if (!token || !activeReport || !newIncident.description) return;
    try {
      await refereeApi.addIncident(token, activeReport._id, newIncident);
      toast.success('Đã ghi nhận sự cố');
      setIncidentDialog(false);
      setNewIncident({ type: 'interference', description: '', action: '' });
      loadReports();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleDownloadPdf = async (reportId: string) => {
    if (!token) return;
    setDownloading(reportId);
    try {
      await refereeApi.downloadPdf(token, reportId);
      toast.success('Đang tải PDF...');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setDownloading(null);
    }
  };

  const currentReg = registrations[selectedRegIdx];
  const currentChecks = currentReg ? checkItems[currentReg._id] || {} : {};

  const filteredReports = reports.filter(r =>
    (r.raceId as any)?.name?.toLowerCase().includes(reportSearch.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-950 font-sans">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-lg border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="cursor-pointer" onClick={() => navigate('/')}>
              <img src="/images/logo.png" alt="Logo" className="w-11 h-11 object-contain drop-shadow-md" />
            </div>
            <div>
              <div className="text-white font-semibold flex items-center gap-2">
                Cổng Trọng Tài
                {user?.refereeProfile && (
                  <Chip label={`${user.refereeProfile.yearsOfService ?? 0} năm KN`} size="small" sx={{ height: '18px', fontSize: '0.65rem', bgcolor: 'rgba(255,222,66,0.2)', color: '#FFDE42', fontWeight: 'bold' }} />
                )}
              </div>
              <div className="text-xs text-slate-400">{user?.fullName}</div>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-3">
            <div className="flex items-center gap-2 bg-emerald-500/10 text-emerald-400 px-3 py-1.5 rounded-lg border border-emerald-500/20 text-sm font-medium">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Hệ Thống Hoạt Động
            </div>
            <ProfileDropdown />
          </div>
          <button className="md:hidden text-white" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </nav>

      <div className="pt-20 max-w-7xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {stats.map((s, i) => (
            <div key={i} className="bg-white/5 backdrop-blur-md border border-white/5 rounded-2xl p-5 hover:-translate-y-1 transition-transform">
              <div className={`w-10 h-10 bg-gradient-to-br ${s.color} rounded-lg flex items-center justify-center mb-3 shadow-lg`}>
                <s.icon className="w-5 h-5 text-white" />
              </div>
              <div className="text-2xl font-bold text-white mb-1">{s.value}</div>
              <div className="text-sm text-slate-400 font-medium">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {[
            { id: 'pre-check', label: 'Kiểm Tra Trước Đua', icon: ClipboardCheck },
            { id: 'reports', label: 'Báo Cáo Chính Thức', icon: FileText },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
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

        {/* ── Tab: Pre-check ── */}
        {activeTab === 'pre-check' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-6">
              <h2 className="text-3xl font-bold text-white mb-2">Kiểm Tra Trước Đua</h2>
              <p className="text-slate-400">Race được phân công cho bạn</p>
            </div>
            {loadingRaces ? (
              <div className="flex justify-center py-12"><CircularProgress sx={{ color: '#FFDE42' }} /></div>
            ) : assignedRaces.length === 0 ? (
              <div className="bg-white/5 rounded-2xl border border-white/5 p-12 text-center">
                <ClipboardCheck className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400">Bạn chưa được phân công cuộc đua nào</p>
              </div>
            ) : (
              <div className="space-y-4">
                {assignedRaces.map(race => {
                  const isPrecheckable = race.status === 'pre_check';
                  return (
                    <div key={race._id} className="bg-white/5 backdrop-blur-md border border-white/5 rounded-2xl p-6 hover:border-[#FFDE42]/30 transition-all">
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3 flex-wrap">
                            <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center flex-shrink-0">
                              <ClipboardCheck className="w-5 h-5 text-[#FFDE42]" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="text-xl font-bold text-white">{race.name}</h3>
                                <Chip label={race.grade} size="small" sx={{ bgcolor: '#f59e0b', color: 'white', fontWeight: 'bold', fontSize: '0.7rem' }} />
                                <Chip label={race.status === 'pre_check' ? 'Cần Kiểm Tra' : race.status} size="small"
                                  sx={{ bgcolor: isPrecheckable ? 'rgba(245,158,11,0.2)' : 'rgba(100,116,139,0.2)', color: isPrecheckable ? '#fbbf24' : '#94a3b8', border: `1px solid ${isPrecheckable ? '#f59e0b' : '#475569'}`, fontWeight: 'bold' }} />
                              </div>
                              <div className="text-slate-400 text-sm mt-0.5">
                                {new Date(race.scheduledTime).toLocaleString('vi-VN')}
                              </div>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-900/50 p-3 rounded-xl border border-white/5">
                            <div><div className="text-slate-500 text-xs mb-1">Cự Ly</div><div className="text-white font-medium text-sm">{race.distance}m</div></div>
                            <div><div className="text-slate-500 text-xs mb-1">Giải Thưởng</div><div className="text-[#FFDE42] font-semibold text-sm">${race.purse?.toLocaleString()}</div></div>
                            <div><div className="text-slate-500 text-xs mb-1">Phí ĐK</div><div className="text-white font-medium text-sm">${race.registrationFee?.toLocaleString()}</div></div>
                            <div className="flex items-end justify-end">
                              <Button variant="contained" disabled={!isPrecheckable}
                                onClick={() => handleOpenPreCheck(race)}
                                sx={{ background: isPrecheckable ? '#FFDE42' : '#334155', color: isPrecheckable ? '#1B0C0C' : 'white', textTransform: 'none', fontWeight: 700, fontSize: '0.8rem', '&:hover': { background: '#f0d000' } }}>
                                {isPrecheckable ? 'Bắt Đầu Kiểm Tra' : 'Chưa Đến Lượt'}
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Tab: Reports ── */}
        {activeTab === 'reports' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
              <h2 className="text-3xl font-bold text-white">Báo Cáo Chính Thức</h2>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input type="text" placeholder="Tìm theo tên cuộc đua..."
                    value={reportSearch} onChange={e => setReportSearch(e.target.value)}
                    className="bg-slate-900 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-[#FFDE42] text-sm w-56" />
                </div>
                <Button variant="contained" onClick={() => setCreateReportDialog(true)}
                  sx={{ background: '#FFDE42', color: '#1B0C0C', textTransform: 'none', fontWeight: 700, '&:hover': { background: '#f0d000' } }}>
                  + Tạo Báo Cáo
                </Button>
              </div>
            </div>

            {loadingReports ? (
              <div className="flex justify-center py-12"><CircularProgress sx={{ color: '#FFDE42' }} /></div>
            ) : filteredReports.length === 0 ? (
              <div className="bg-white/5 rounded-2xl border border-white/5 p-12 text-center">
                <FileText className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400">Chưa có báo cáo nào</p>
              </div>
            ) : (
              <div className="bg-white/5 backdrop-blur-md border border-white/5 rounded-2xl overflow-hidden">
                <table className="w-full">
                  <thead className="bg-slate-900/80 border-b border-white/10">
                    <tr>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-slate-400">Cuộc Đua</th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-slate-400">Ngày Tạo</th>
                      <th className="text-center px-4 py-4 text-sm font-semibold text-slate-400">Sự Cố</th>
                      <th className="text-left px-4 py-4 text-sm font-semibold text-slate-400">Trạng Thái</th>
                      <th className="text-right px-6 py-4 text-sm font-semibold text-slate-400">Hành Động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredReports.map(report => {
                      const isDraft = report.status === 'draft';
                      return (
                        <tr key={report._id} className="hover:bg-white/5 transition-colors">
                          <td className="px-6 py-4">
                            <div className="text-white font-medium">{(report.raceId as any)?.name}</div>
                            <div className="text-slate-500 text-xs mt-0.5">{(report.raceId as any)?.grade}</div>
                          </td>
                          <td className="px-6 py-4 text-slate-300 text-sm">{new Date(report.createdAt).toLocaleDateString('vi-VN')}</td>
                          <td className="px-4 py-4 text-center">
                            <span className={`font-bold ${report.incidents.length > 0 ? 'text-amber-400' : 'text-slate-500'}`}>{report.incidents.length}</span>
                          </td>
                          <td className="px-4 py-4">
                            <Chip label={isDraft ? 'Nháp' : 'Đã nộp'} size="small"
                              sx={{ bgcolor: isDraft ? 'rgba(245,158,11,0.15)' : 'rgba(16,185,129,0.15)', color: isDraft ? '#fbbf24' : '#34d399', border: `1px solid ${isDraft ? '#f59e0b' : '#10b981'}`, fontWeight: 'bold' }} />
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-end gap-2">
                              {isDraft && (
                                <>
                                  <Button size="small" variant="outlined" onClick={() => { setActiveReport(report); setIncidentDialog(true); }}
                                    sx={{ borderColor: 'rgba(255,255,255,0.2)', color: 'white', textTransform: 'none', fontSize: '0.75rem', '&:hover': { borderColor: '#FFDE42', color: '#FFDE42' } }}>
                                    + Sự Cố
                                  </Button>
                                  <Button size="small" variant="outlined" onClick={() => handleSubmitReport(report._id)}
                                    sx={{ borderColor: '#10b981', color: '#34d399', textTransform: 'none', fontSize: '0.75rem', '&:hover': { bgcolor: 'rgba(16,185,129,0.1)' } }}>
                                    Nộp
                                  </Button>
                                </>
                              )}
                              <Button size="small" variant="outlined" startIcon={downloading === report._id ? <CircularProgress size={12} sx={{ color: 'white' }} /> : <Download className="w-3 h-3" />}
                                onClick={() => handleDownloadPdf(report._id)} disabled={downloading === report._id}
                                sx={{ borderColor: 'rgba(255,255,255,0.2)', color: 'white', textTransform: 'none', fontSize: '0.75rem', '&:hover': { borderColor: '#FFDE42', color: '#FFDE42' } }}>
                                PDF
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Pre-Check Dialog ── */}
      <Dialog open={preCheckOpen} onClose={() => setPreCheckOpen(false)} maxWidth="lg" fullWidth
        PaperProps={{ style: { backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', maxHeight: '92vh' } }}>
        <DialogTitle sx={{ color: 'white', borderBottom: '1px solid rgba(255,255,255,0.08)', pb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
          <ClipboardCheck className="w-5 h-5 text-[#FFDE42]" />
          Kiểm Tra Chính Thức — {selectedRace?.name}
        </DialogTitle>
        <DialogContent sx={{ paddingTop: '20px !important', overflowY: 'auto' }}>
          {loadingRegs ? (
            <div className="flex justify-center py-12"><CircularProgress sx={{ color: '#FFDE42' }} /></div>
          ) : registrations.length === 0 ? (
            <div className="text-slate-400 text-center py-8">Không có ngựa đăng ký</div>
          ) : (
            <div className="flex gap-5" style={{ minHeight: '520px' }}>
              {/* Sidebar */}
              <div className="w-52 flex-shrink-0 border-r border-white/8 pr-4 space-y-2 overflow-y-auto">
                <div className="text-xs text-slate-500 uppercase font-bold mb-3 tracking-wider">Danh Sách Ngựa</div>
                {registrations.map((reg, idx) => {
                  const horse = reg.horseId as any;
                  const rate = getCompletionRate(reg._id);
                  const preStatus = reg.preCheckResult?.status;
                  return (
                    <div key={reg._id} onClick={() => setSelectedRegIdx(idx)}
                      className={`p-3 rounded-xl cursor-pointer border transition-all ${selectedRegIdx === idx ? 'bg-[#FFDE42]/15 border-[#FFDE42]/40' : 'bg-white/4 border-transparent hover:bg-white/8'}`}>
                      <div className="text-white font-semibold text-sm">{horse?.name || '-'}</div>
                      <div className="text-slate-400 text-xs mt-0.5">{(reg.jockeyId as any)?.fullName || 'Chưa có jockey'}</div>
                      <div className="mt-2 flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-[#FFDE42] rounded-full transition-all" style={{ width: `${rate}%` }} />
                        </div>
                        <span className="text-xs text-slate-400 font-mono w-8 text-right">{rate}%</span>
                      </div>
                      {preStatus === 'passed' && <div className="flex items-center gap-1 mt-1.5 text-emerald-400 text-xs font-medium"><CheckCircle className="w-3 h-3" /> ĐẠT</div>}
                      {preStatus === 'failed' && <div className="flex items-center gap-1 mt-1.5 text-red-400 text-xs font-medium"><X className="w-3 h-3" /> KHÔNG ĐẠT</div>}
                    </div>
                  );
                })}
              </div>

              {/* Main */}
              <div className="flex-1 overflow-y-auto pl-1">
                {currentReg && (() => {
                  const horse = currentReg.horseId as any;
                  const jockey = currentReg.jockeyId as any;
                  return (
                    <>
                      <div className="bg-slate-900/70 rounded-2xl border border-white/8 p-5 mb-5">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="text-xl font-bold text-white">{horse?.name}</h3>
                            <div className="text-slate-400 text-sm">{horse?.breed} · {horse?.gender} · {horse?.currentGrade}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-[#FFDE42] font-bold text-lg">{getCompletionRate(currentReg._id)}%</div>
                            <div className="text-slate-500 text-xs">hoàn thành</div>
                          </div>
                        </div>
                        {jockey && (
                          <div className="bg-blue-500/8 border border-blue-500/20 rounded-xl p-3 text-sm">
                            <div className="text-blue-400 font-bold uppercase text-xs mb-2">Kỵ Sĩ</div>
                            <div className="text-white font-medium">{jockey.fullName}</div>
                            {jockey.jockeyProfile && (
                              <div className="text-slate-400 text-xs mt-1">{jockey.jockeyProfile.experienceYears} năm KN · {jockey.jockeyProfile.weight} kg</div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Checklist */}
                      <div className="space-y-4">
                        {checkCategories.map(cat => {
                          const done = cat.items.filter(i => currentChecks[i.key]).length;
                          const colorMap: Record<string, string> = { blue: 'text-blue-400 bg-blue-500/10 border-blue-500/20', green: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', purple: 'text-purple-400 bg-purple-500/10 border-purple-500/20', orange: 'text-orange-400 bg-orange-500/10 border-orange-500/20' };
                          return (
                            <div key={cat.key} className="bg-slate-900/50 rounded-xl border border-white/5 overflow-hidden">
                              <div className={`flex items-center justify-between px-4 py-3 border-b border-white/5 ${colorMap[cat.color]}`}>
                                <div className="flex items-center gap-2"><cat.icon className="w-4 h-4" /><span className="font-semibold text-sm">{cat.title}</span></div>
                                <span className="text-xs font-mono">{done}/{cat.items.length}</span>
                              </div>
                              <div className="p-3 space-y-1">
                                {cat.items.map(item => (
                                  <label key={item.key} className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-colors ${currentChecks[item.key] ? 'bg-emerald-500/8' : 'hover:bg-white/4'}`}>
                                    <input type="checkbox" checked={!!currentChecks[item.key]} onChange={() => toggleCheckItem(currentReg._id, item.key)} className="w-4 h-4 accent-[#FFDE42] cursor-pointer flex-shrink-0" />
                                    <span className={`text-sm ${currentChecks[item.key] ? 'text-emerald-300 line-through decoration-emerald-500/50' : 'text-slate-300'}`}>{item.label}</span>
                                  </label>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div className="mt-4">
                        <label className="text-slate-400 text-sm font-medium mb-2 block">Ghi Chú (tùy chọn)</label>
                        <textarea value={horseNotes[currentReg._id] || ''} onChange={e => setHorseNotes(prev => ({ ...prev, [currentReg._id]: e.target.value }))}
                          placeholder="Nhập ghi chú kiểm tra..."
                          rows={3} className="w-full bg-slate-900/70 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-[#FFDE42]/50 resize-none" />
                      </div>

                      {currentReg.preCheckResult?.status === 'passed' ? (
                        <div className="mt-4 flex items-center justify-center gap-2 bg-emerald-500/10 border border-emerald-500/30 rounded-xl py-4">
                          <CheckCircle className="w-5 h-5 text-emerald-400" />
                          <span className="text-emerald-400 font-bold text-lg">ĐÃ ĐẠT — Kiểm tra hoàn thành</span>
                        </div>
                      ) : currentReg.preCheckResult?.status === 'failed' ? (
                        <div className="mt-4 flex items-center justify-center gap-2 bg-red-500/10 border border-red-500/30 rounded-xl py-4">
                          <AlertTriangle className="w-5 h-5 text-red-400" />
                          <span className="text-red-400 font-bold text-lg">KHÔNG ĐẠT — Ngựa bị loại</span>
                        </div>
                      ) : (
                        <div className="flex gap-3 mt-4">
                          <Button variant="contained" fullWidth startIcon={<CheckCircle />} disabled={submittingCheck}
                            sx={{ background: '#10b981', textTransform: 'none', fontWeight: 700, '&:hover': { background: '#059669' } }}
                            onClick={() => handleSubmitPreCheck('passed')}>
                            {submittingCheck ? <CircularProgress size={20} sx={{ color: 'white' }} /> : 'Đánh Dấu ĐẠT'}
                          </Button>
                          <Button variant="outlined" fullWidth startIcon={<AlertTriangle />} disabled={submittingCheck}
                            sx={{ borderColor: '#ef4444', color: '#ef4444', textTransform: 'none', fontWeight: 700, '&:hover': { backgroundColor: 'rgba(239,68,68,0.1)', borderColor: '#dc2626' } }}
                            onClick={() => handleSubmitPreCheck('failed')}>
                            {submittingCheck ? <CircularProgress size={20} sx={{ color: '#ef4444' }} /> : 'Đánh Dấu KHÔNG ĐẠT'}
                          </Button>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>
          )}
        </DialogContent>
        <DialogActions sx={{ borderTop: '1px solid rgba(255,255,255,0.08)', padding: '16px 24px', gap: 1 }}>
          {registrations.length > 0 && registrations.every(r => r.preCheckResult?.status !== 'pending') && (
            <div className="flex-1 flex items-center gap-2 text-sm">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span className="text-emerald-400 font-medium">
                Đã kiểm tra {registrations.filter(r => r.preCheckResult?.status === 'passed').length}/{registrations.length} ngựa đạt tiêu chuẩn
              </span>
            </div>
          )}
          <Button onClick={() => setPreCheckOpen(false)} sx={{ color: '#94a3b8', textTransform: 'none' }}>Đóng</Button>
        </DialogActions>
      </Dialog>

      {/* ── Create Report Dialog ── */}
      <Dialog open={createReportDialog} onClose={() => setCreateReportDialog(false)} maxWidth="sm" fullWidth
        PaperProps={{ style: { backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px' } }}>
        <DialogTitle sx={{ color: 'white' }}>Tạo Báo Cáo Mới</DialogTitle>
        <DialogContent>
          <div className="mt-4">
            <FormControl fullWidth>
              <InputLabel sx={{ color: '#94a3b8' }}>Chọn cuộc đua</InputLabel>
              <Select value={selectedReportRaceId} label="Chọn cuộc đua"
                onChange={e => setSelectedReportRaceId(e.target.value)}
                sx={{ color: 'white', '& fieldset': { borderColor: 'rgba(255,255,255,0.15)' }, '& .MuiSelect-icon': { color: '#94a3b8' } }}>
                {assignedRaces.map(r => (
                  <MenuItem key={r._id} value={r._id}>{r.name} ({r.grade})</MenuItem>
                ))}
              </Select>
            </FormControl>
          </div>
        </DialogContent>
        <DialogActions sx={{ padding: '16px 24px' }}>
          <Button onClick={() => setCreateReportDialog(false)} sx={{ color: '#94a3b8', textTransform: 'none' }}>Hủy</Button>
          <Button variant="contained" onClick={handleCreateReport} disabled={!selectedReportRaceId}
            sx={{ background: '#FFDE42', color: '#1B0C0C', textTransform: 'none', fontWeight: 700, '&:hover': { background: '#f0d000' } }}>
            Tạo Báo Cáo
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Add Incident Dialog ── */}
      <Dialog open={incidentDialog} onClose={() => setIncidentDialog(false)} maxWidth="sm" fullWidth
        PaperProps={{ style: { backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px' } }}>
        <DialogTitle sx={{ color: 'white' }}>Ghi Nhận Sự Cố — {(activeReport?.raceId as any)?.name}</DialogTitle>
        <DialogContent>
          <div className="space-y-4 mt-4">
            <FormControl fullWidth>
              <InputLabel sx={{ color: '#94a3b8' }}>Loại sự cố</InputLabel>
              <Select value={newIncident.type} label="Loại sự cố"
                onChange={e => setNewIncident(p => ({ ...p, type: e.target.value as Incident['type'] }))}
                sx={{ color: 'white', '& fieldset': { borderColor: 'rgba(255,255,255,0.15)' }, '& .MuiSelect-icon': { color: '#94a3b8' } }}>
                {INCIDENT_TYPES.map(t => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField fullWidth multiline rows={3} label="Mô tả sự cố *" value={newIncident.description}
              onChange={e => setNewIncident(p => ({ ...p, description: e.target.value }))}
              sx={{ '& .MuiInputLabel-root': { color: '#94a3b8' }, '& .MuiOutlinedInput-root': { color: 'white', '& fieldset': { borderColor: 'rgba(255,255,255,0.15)' } } }} />
            <TextField fullWidth label="Hành động xử lý" value={newIncident.action}
              onChange={e => setNewIncident(p => ({ ...p, action: e.target.value }))}
              sx={{ '& .MuiInputLabel-root': { color: '#94a3b8' }, '& .MuiOutlinedInput-root': { color: 'white', '& fieldset': { borderColor: 'rgba(255,255,255,0.15)' } } }} />
          </div>
        </DialogContent>
        <DialogActions sx={{ padding: '16px 24px' }}>
          <Button onClick={() => setIncidentDialog(false)} sx={{ color: '#94a3b8', textTransform: 'none' }}>Hủy</Button>
          <Button variant="contained" onClick={handleAddIncident} disabled={!newIncident.description}
            sx={{ background: '#ef4444', color: 'white', textTransform: 'none', fontWeight: 700, '&:hover': { background: '#dc2626' } }}>
            Ghi Nhận
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
