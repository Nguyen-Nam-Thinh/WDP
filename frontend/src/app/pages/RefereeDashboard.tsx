import { useState, useEffect, useCallback, useMemo } from 'react';
import { Pagination } from '../components/Pagination';
import { useNavigate, useLocation } from 'react-router';
import {
  Shield, Calendar, AlertTriangle, CheckCircle, LogOut, Menu, X,
  FileText, Clock, Flag, ClipboardCheck, Download,
  Search, User, Award,
} from 'lucide-react';
import {
  Button, Chip, Dialog, DialogTitle, DialogContent, DialogActions,
  CircularProgress,
  TextField, MenuItem, Select, FormControl, InputLabel,
} from '@mui/material';
import { AppShell, type NavItem } from '../components/layout/AppShell';
import { Home, Trophy as TrophyIcon, Medal as MedalIcon } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import {
  refereeApi, type RefereeReport, type Incident, type TrackCondition,
  type UpdateRefereeReportPayload, type IncidentVerdict,
  type PerformanceExplanation, type VetOrder,
  type PostRaceVetOrderType,
} from '../api/referee';
import { registrationApi, type Registration, type PreCheckFailCategory } from '../api/registration';
import { raceApi } from '../api/race';
import { toast } from 'sonner';
import { LiveFlagPanel } from './referee/LiveFlagPanel';
import { ResultsConfirmPanel } from './referee/ResultsConfirmPanel';

const INCIDENT_TYPES = [
  { value: 'interference', label: 'Cản trở' },
  { value: 'doping', label: 'Doping' },
  { value: 'equipment_violation', label: 'Vi phạm thiết bị' },
  { value: 'jockey_violation', label: 'Vi phạm kỵ sĩ' },
  { value: 'other', label: 'Khác' },
];

const FAIL_CATEGORIES: { value: PreCheckFailCategory; label: string }[] = [
  { value: 'veterinary', label: 'Thú y' },
  { value: 'jockey', label: 'Nài ngựa' },
  { value: 'gear', label: 'Trang bị' },
  { value: 'administrative', label: 'Hành chính' },
];

const VERDICT_OPTIONS: { value: IncidentVerdict; label: string }[] = [
  { value: 'none', label: 'Không xử lý' },
  { value: 'warning', label: 'Cảnh cáo' },
  { value: 'fine', label: 'Phạt tiền' },
  { value: 'disqualified', label: 'Loại' },
];

const VET_ORDER_TYPES: { value: PostRaceVetOrderType; label: string }[] = [
  { value: 'blood', label: 'Máu' },
  { value: 'urine', label: 'Nước tiểu' },
  { value: 'endoscopy', label: 'Nội soi' },
  { value: 'clinical', label: 'Khám lâm sàng' },
];

const REPORT_STATUS_META: Record<string, { label: string; color: string; bg: string; border: string }> = {
  draft: { label: 'Nháp', color: '#8F7318', bg: 'rgba(201,162,39,0.15)', border: '#C9A227' },
  pending_approval: { label: 'Chờ duyệt', color: '#2563eb', bg: 'rgba(37,99,235,0.12)', border: '#2563eb' },
  submitted: { label: 'Chờ duyệt', color: '#2563eb', bg: 'rgba(37,99,235,0.12)', border: '#2563eb' },
  rejected: { label: 'Từ chối', color: '#B42318', bg: 'rgba(180,35,24,0.12)', border: '#B42318' },
  approved: { label: 'Đã duyệt', color: '#1F3D2B', bg: 'rgba(31,61,43,0.12)', border: '#1F3D2B' },
};

const isReportEditableStatus = (status?: string) => status === 'draft' || status === 'rejected';
const isPreRaceEditableStatus = (status?: string) => status === 'draft' || status === 'rejected' || !status;

const TRACK_OPTIONS: { value: TrackCondition; label: string }[] = [
  { value: 'Firm', label: 'Cứng' },
  { value: 'Good', label: 'Tốt' },
  { value: 'Soft', label: 'Mềm' },
  { value: 'Heavy', label: 'Nặng' },
  { value: 'Synthetic', label: 'Nhân tạo' },
];

const RACE_STATUS_VN: Record<string, string> = {
  open: 'Đang mở',
  closed: 'Đã đóng',
  pre_check: 'Kiểm tra trước đua',
  running: 'Đang chạy',
  finished: 'Đã kết thúc',
  cancelled: 'Đã hủy',
};

const EMPTY_NOTE = 'Chưa có';
const NO_PENALTY = 'Không có';

function incidentHorseName(inc: Incident, regs: Registration[] = []): string {
  if (inc.horseId && typeof inc.horseId === 'object' && 'name' in inc.horseId) {
    return (inc.horseId as { name: string }).name;
  }
  const hid = typeof inc.horseId === 'string' ? inc.horseId : (inc.horseId as any)?._id;
  if (hid) {
    const reg = regs.find((r) => {
      const rh = r.horseId as any;
      return rh?._id === hid || String(rh) === String(hid) || String(r.horseId) === String(hid);
    });
    if ((reg?.horseId as any)?.name) return (reg.horseId as any).name;
  }
  if (inc.registrationId) {
    const rid = typeof inc.registrationId === 'string' ? inc.registrationId : (inc.registrationId as any)?._id;
    const reg = regs.find((r) => r._id === rid);
    if ((reg?.horseId as any)?.name) return (reg.horseId as any).name;
  }
  return 'Ngựa';
}

const REFEREE_NAV: NavItem[] = [
  { to: '/referee', label: 'Tổng Quan', icon: <Home /> },
  { to: '/referee/pre-check', label: 'Kiểm Tra Trước Đua', icon: <ClipboardCheck /> },
  { to: '/referee/live', label: 'Theo dõi trận đấu', icon: <Flag /> },
  { to: '/referee/results', label: 'Kết Quả', icon: <Award /> },
  { to: '/referee/reports', label: 'Báo Cáo Chính Thức', icon: <FileText /> },
];

export function RefereeDashboard() {
  const navigate = useNavigate();
  const { user, token } = useAuth();

  useEffect(() => { if (!user) navigate('/'); }, [user, navigate]);

  const { pathname, search } = useLocation();
  const activeTab = pathname === '/referee/reports' ? 'reports'
    : pathname === '/referee/pre-check' ? 'pre-check'
    : pathname === '/referee/live' ? 'live'
    : pathname === '/referee/results' ? 'results'
    : 'overview';
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // ── Pre-check state ──
  const [assignedRaces, setAssignedRaces] = useState<any[]>([]);
  const [loadingRaces, setLoadingRaces] = useState(true);
  const [racePage, setRacePage] = useState(1);
  const [selectedRace, setSelectedRace] = useState<any>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loadingRegs, setLoadingRegs] = useState(false);
  const [selectedRegIdx, setSelectedRegIdx] = useState(0);
  const [preCheckOpen, setPreCheckOpen] = useState(false);
  const [submittingCheck, setSubmittingCheck] = useState(false);
  const [failDialogOpen, setFailDialogOpen] = useState(false);
  const [failCategory, setFailCategory] = useState<PreCheckFailCategory | ''>('');
  const [failNote, setFailNote] = useState('');

  // ── Reports state ──
  const [reports, setReports] = useState<RefereeReport[]>([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [reportSearch, setReportSearch] = useState('');
  const [preCheckSearch, setPreCheckSearch] = useState('');
  const [reportPage, setReportPage] = useState(1);
  const [reportsPhase, setReportsPhase] = useState<'prerace' | 'postrace'>('prerace');
  const [editDialogPhase, setEditDialogPhase] = useState<'prerace' | 'postrace'>('prerace');
  const [incidentDialog, setIncidentDialog] = useState(false);
  const [activeReport, setActiveReport] = useState<RefereeReport | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [editReportDialog, setEditReportDialog] = useState(false);
  const [editReport, setEditReport] = useState<RefereeReport | null>(null);
  const [editTrack, setEditTrack] = useState<TrackCondition | ''>('');
  const [editTrackNote, setEditTrackNote] = useState('');
  const [editRiderChanges, setEditRiderChanges] = useState<string[]>([]);
  const [editGearChanges, setEditGearChanges] = useState<string[]>([]);
  const [editVetChecks, setEditVetChecks] = useState<string[]>([]);
  const [editOverallNotes, setEditOverallNotes] = useState('');
  const [editLineDraft, setEditLineDraft] = useState({ rider: '', gear: '', vet: '' });
  const [editPerfExplanations, setEditPerfExplanations] = useState<PerformanceExplanation[]>([]);
  const [editVetOrders, setEditVetOrders] = useState<VetOrder[]>([]);
  const [editRaceRegs, setEditRaceRegs] = useState<Registration[]>([]);
  const [perfDraft, setPerfDraft] = useState({ registrationId: '', summonedJockey: true, summonedOwner: false, explanation: '' });
  const [vetDraft, setVetDraft] = useState<{ registrationId: string; orderType: PostRaceVetOrderType; note: string }>({
    registrationId: '',
    orderType: 'blood',
    note: '',
  });
  const [savingReport, setSavingReport] = useState(false);
  const [resolveDialog, setResolveDialog] = useState(false);
  const [resolveIncident, setResolveIncident] = useState<Incident | null>(null);
  const [resolveForm, setResolveForm] = useState({
    type: 'other' as Incident['type'],
    action: '',
    verdict: 'none' as IncidentVerdict,
    fineAmount: '',
    fineTargetRole: 'owner' as 'owner' | 'jockey',
    note: '',
  });
  const [resolving, setResolving] = useState(false);

  // ── Stats ──
  const stats = [
    { label: 'Cuộc Đua Được Phân Công', value: String(assignedRaces.length), icon: ClipboardCheck, color: 'from-[#C9A227] to-[#b8960a]' },
    { label: 'Chờ Kiểm Tra', value: String(assignedRaces.filter(r => r.status === 'pre_check').length), icon: Clock, color: 'from-amber-500 to-amber-700' },
    { label: 'Sự Cố Ghi Nhận', value: String(reports.reduce((s, r) => s + r.incidents.length, 0)), icon: AlertTriangle, color: 'from-red-500 to-red-700' },
    { label: 'Báo Cáo Chờ Duyệt', value: String(reports.filter(r => r.status === 'pending_approval' || r.status === 'submitted').length), icon: CheckCircle, color: 'from-indigo-500 to-indigo-700' },
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

  useEffect(() => { loadAssignedRaces(); loadReports(); }, [loadAssignedRaces, loadReports]);
  useEffect(() => { if (activeTab === 'reports') loadReports(); }, [activeTab, loadReports]);
  useEffect(() => {
    if (activeTab === 'live' || activeTab === 'results') loadAssignedRaces();
  }, [activeTab, loadAssignedRaces]);

  const handleOpenPreCheck = async (race: any) => {
    setSelectedRace(race);
    setSelectedRegIdx(0);
    setLoadingRegs(true);
    setPreCheckOpen(true);
    try {
      const res = await raceApi.getRaceRegistrations(token!, race._id);
      const regs: Registration[] = res.registrations || [];
      setRegistrations(regs);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoadingRegs(false);
    }
  };

  const handleSubmitPreCheck = async (
    status: 'passed' | 'failed',
    opts?: { category?: PreCheckFailCategory; note?: string },
  ) => {
    const reg = registrations[selectedRegIdx];
    if (!reg || !token) return;
    setSubmittingCheck(true);
    try {
      const payload: { status: 'passed' | 'failed'; note?: string; category?: PreCheckFailCategory } = {
        status,
        note: opts?.note ?? '',
      };
      if (status === 'failed' && opts?.category) payload.category = opts.category;

      const updated = await registrationApi.updatePreCheck(token, reg._id, payload);
      toast.success(`Đã ${status === 'passed' ? 'đánh dấu ĐẠT' : 'đánh dấu KHÔNG ĐẠT'} cho ${(reg.horseId as any)?.name}`);
      setRegistrations(prev =>
        prev.map(r => r._id === reg._id
          ? {
              ...r,
              status: updated.status,
              preCheckResult: updated.preCheckResult,
              refundAmount: updated.refundAmount,
            }
          : r
        )
      );
      setFailDialogOpen(false);
      setFailCategory('');
      setFailNote('');
      const updatedRegs = registrations.map(r => r._id === reg._id
        ? {
            ...r,
            status: updated.status,
            preCheckResult: updated.preCheckResult,
            refundAmount: updated.refundAmount,
          }
        : r
      );
      const allDone = updatedRegs.every(r => r.preCheckResult?.status === 'passed' || r.preCheckResult?.status === 'failed');
      if (allDone) {
        toast.success('Kiểm tra xong — báo cáo trước trận nháp đã sẵn sàng');
      }
      const nextPending = updatedRegs.findIndex(
        (r, i) => i > selectedRegIdx && r.preCheckResult?.status === 'pending'
      );
      if (nextPending !== -1) setSelectedRegIdx(nextPending);
      else if (status === 'passed' && selectedRegIdx < updatedRegs.length - 1) setSelectedRegIdx(i => i + 1);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmittingCheck(false);
    }
  };

  const openFailDialog = () => {
    setFailCategory('');
    setFailNote('');
    setFailDialogOpen(true);
  };

  const confirmFailPreCheck = async () => {
    if (!failCategory) {
      toast.error('Vui lòng chọn phân loại lỗi');
      return;
    }
    await handleSubmitPreCheck('failed', { category: failCategory, note: failNote });
  };

  // ── Report actions ──
  const handleSubmitPreRace = async (reportId: string) => {
    if (!token) return;
    try {
      const full = await refereeApi.getReportById(token, reportId);
      if (!full.preRaceReport?.trackCondition) {
        toast.error('Vui lòng chọn điều kiện mặt đường trước khi nộp báo cáo trước trận');
        return;
      }
      await refereeApi.submitPreRace(token, reportId);
      toast.success('Đã nộp báo cáo trước trận — chờ Admin duyệt');
      loadReports();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleSubmitReport = async (reportId: string) => {
    if (!token) return;
    try {
      const full = await refereeApi.getReportById(token, reportId);
      const drafts = (full.incidents || []).filter((i) => i.status === 'draft');
      if (drafts.length > 0) {
        toast.error(`Còn ${drafts.length} sự cố chưa xử lý — không thể nộp`);
        return;
      }
      await refereeApi.submitReport(token, reportId);
      toast.success('Đã nộp báo cáo sau trận — chờ Admin duyệt');
      loadReports();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const openEditReport = async (report: RefereeReport, phase: 'prerace' | 'postrace' = reportsPhase) => {
    if (!token) return;
    try {
      const full = await refereeApi.getReportById(token, report._id);
      const preRaceReport = full.preRaceReport || {
        trackCondition: '',
        trackConditionNote: '',
        lateScratchings: [],
        riderChanges: [],
        gearChanges: [],
        vetChecks: [],
      };
      const postRace = full.postRaceReport || { performanceExplanations: [], vetOrders: [] };
      const raceId = typeof full.raceId === 'object' ? full.raceId._id : full.raceId;
      const regsRes = await raceApi.getRaceRegistrations(token, raceId, { limit: 50 }).catch(() => ({ registrations: [] }));

      setEditDialogPhase(phase);
      setEditReport(full);
      setEditTrack(preRaceReport.trackCondition || '');
      setEditTrackNote(preRaceReport.trackConditionNote || '');
      setEditRiderChanges([...(preRaceReport.riderChanges || [])]);
      setEditGearChanges([...(preRaceReport.gearChanges || [])]);
      setEditVetChecks([...(preRaceReport.vetChecks || [])]);
      setEditPerfExplanations([...(postRace.performanceExplanations || [])]);
      setEditVetOrders([...(postRace.vetOrders || [])]);
      setEditRaceRegs((regsRes.registrations || []) as Registration[]);
      setPerfDraft({ registrationId: '', summonedJockey: true, summonedOwner: false, explanation: '' });
      setVetDraft({ registrationId: '', orderType: 'blood', note: '' });
      setEditOverallNotes(full.overallNotes || '');
      setEditLineDraft({ rider: '', gear: '', vet: '' });
      setEditReportDialog(true);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  // Deep-link: /referee/reports?reportId=xxx → mở đúng biên bản của race đó
  useEffect(() => {
    if (activeTab !== 'reports' || !token) return;
    const reportId = new URLSearchParams(search).get('reportId');
    if (!reportId) return;

    let cancelled = false;
    (async () => {
      try {
        await openEditReport({ _id: reportId } as RefereeReport, 'prerace');
        if (!cancelled) navigate('/referee/reports', { replace: true });
      } catch (err: any) {
        if (!cancelled) toast.error(err.message || 'Không mở được biên bản');
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, token, search]);

  const handleSaveReport = async () => {
    if (!token || !editReport) return;
    const payload: UpdateRefereeReportPayload =
      editDialogPhase === 'prerace'
        ? {
            preRaceReport: {
              trackCondition: editTrack,
              trackConditionNote: editTrackNote,
              riderChanges: editRiderChanges,
              gearChanges: editGearChanges,
              vetChecks: editVetChecks,
            },
          }
        : {
            overallNotes: editOverallNotes,
            postRaceReport: {
              performanceExplanations: editPerfExplanations.map(({ registrationId, horseId, label, summonedRoles, explanation, recordedAt }) => ({
                registrationId,
                horseId,
                label,
                summonedRoles,
                explanation,
                recordedAt,
              })),
              vetOrders: editVetOrders.map(({ registrationId, horseId, label, orderType, note, orderedAt }) => ({
                registrationId,
                horseId,
                label,
                orderType,
                note,
                orderedAt,
              })),
            },
          };

    setSavingReport(true);
    try {
      await refereeApi.updateReport(token, editReport._id, payload);
      toast.success(editDialogPhase === 'prerace' ? 'Đã lưu báo cáo trước trận' : 'Đã lưu báo cáo sau trận');
      setEditReportDialog(false);
      loadReports();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSavingReport(false);
    }
  };

  const openResolveIncident = (incident: Incident) => {
    setResolveIncident(incident);
    setResolveForm({
      type: incident.type || 'other',
      action: incident.action || '',
      verdict: (incident.resolution?.verdict as IncidentVerdict) || 'none',
      fineAmount: incident.resolution?.fineAmount != null ? String(incident.resolution.fineAmount) : '',
      fineTargetRole: (incident.resolution?.fineTargetRole as 'owner' | 'jockey') || 'owner',
      note: incident.resolution?.note || '',
    });
    setResolveDialog(true);
  };

  const handleResolveIncident = async () => {
    const reportCtx = editReport || activeReport;
    if (!token || !reportCtx || !resolveIncident) return;
    if (resolveForm.verdict === 'fine') {
      const amount = Number(resolveForm.fineAmount);
      if (!Number.isFinite(amount) || amount <= 0) {
        toast.error('Số tiền phạt phải lớn hơn 0');
        return;
      }
      if (!resolveForm.fineTargetRole) {
        toast.error('Chọn Chủ ngựa hoặc Nài chịu phạt');
        return;
      }
    }
    setResolving(true);
    try {
      const updated = await refereeApi.resolveIncident(token, reportCtx._id, resolveIncident._id, {
        type: resolveForm.type,
        action: resolveForm.action,
        resolution: {
          verdict: resolveForm.verdict,
          fineAmount: resolveForm.verdict === 'fine' ? Number(resolveForm.fineAmount) : undefined,
          fineTargetRole: resolveForm.verdict === 'fine' ? resolveForm.fineTargetRole : undefined,
          reasonCode: null,
          suspensionDays: null,
          note: resolveForm.note || undefined,
        },
      });
      const wasEdit = resolveIncident.status === 'resolved';
      setActiveReport(updated);
      setResolveDialog(false);
      setResolveIncident(null);
      toast.success(
        wasEdit
          ? 'Đã cập nhật xử phạt trong báo cáo sau trận'
          : resolveForm.verdict === 'disqualified'
            ? 'Đã loại — thứ hạng đã dồn lại (chưa phát tiền)'
            : resolveForm.verdict === 'fine'
              ? 'Đã ghi xử phạt — phiếu phạt/treo giò gửi khi Admin duyệt Official'
              : 'Đã xử lý sự cố — đã lưu vào báo cáo sau trận',
      );
      loadReports();
      await openEditReport(updated, 'postrace');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setResolving(false);
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

  const filteredReports = reports.filter((r) => {
    const nameOk = (r.raceId as any)?.name?.toLowerCase().includes(reportSearch.toLowerCase());
    if (!nameOk) return false;
    const raceStatus = (r.raceId as any)?.status;
    if (reportsPhase === 'postrace') {
      return raceStatus === 'finished' || raceStatus === 'running';
    }
    return true;
  });

  const REF_PAGE_SIZE = 10;
  const filteredPreCheckRaces = useMemo(() => {
    const q = preCheckSearch.trim().toLowerCase();
    if (!q) return assignedRaces;
    return assignedRaces.filter((r) =>
      String(r.name || '').toLowerCase().includes(q)
      || String(r.grade || '').toLowerCase().includes(q)
      || String(r.status || '').toLowerCase().includes(q),
    );
  }, [assignedRaces, preCheckSearch]);
  const pagedRaces = useMemo(
    () => filteredPreCheckRaces.slice((racePage - 1) * REF_PAGE_SIZE, racePage * REF_PAGE_SIZE),
    [filteredPreCheckRaces, racePage],
  );
  const raceTotalPages = Math.ceil(filteredPreCheckRaces.length / REF_PAGE_SIZE) || 1;
  const pagedReports = useMemo(() => filteredReports.slice((reportPage - 1) * REF_PAGE_SIZE, reportPage * REF_PAGE_SIZE), [filteredReports, reportPage]);

  return (
    <AppShell roleLabel="REFEREE" nav={REFEREE_NAV}>
      <div className="max-w-7xl mx-auto">
        {/* Overview */}
        {activeTab === 'overview' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Stat cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {stats.map((s, i) => (
                <div key={i} className="bg-card border border-border p-5 hover:-translate-y-0.5 transition-transform">
                  <div className={`w-10 h-10 bg-gradient-to-br ${s.color} flex items-center justify-center mb-3 shadow-sm`}>
                    <s.icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="font-serif text-2xl font-bold text-foreground mb-1">{s.value}</div>
                  <div className="text-sm text-muted-foreground font-medium">{s.label}</div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Races needing inspection */}
              <div className="bg-card border border-border p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-serif text-base font-bold text-foreground">Cuộc Đua Cần Kiểm Tra</h3>
                  <span className="text-xs text-muted-foreground">{assignedRaces.filter(r => r.status === 'pre_check').length} chờ kiểm tra</span>
                </div>
                {loadingRaces ? (
                  <div className="flex items-center justify-center h-[140px] text-muted-foreground text-sm">
                    <div className="w-5 h-5 border-2 border-[#C9A227]/30 border-t-[#C9A227] rounded-full animate-spin mr-2" />
                    Đang tải...
                  </div>
                ) : assignedRaces.filter(r => r.status === 'pre_check').length > 0 ? (
                  <div className="space-y-2">
                    {assignedRaces.filter(r => r.status === 'pre_check').slice(0, 4).map((race, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 border border-[#C9A227]/30 bg-[#C9A227]/5 hover:bg-[#C9A227]/10 transition-colors">
                        <div className="w-8 h-8 bg-[#C9A227]/20 border border-[#C9A227]/40 flex items-center justify-center flex-shrink-0">
                          <ClipboardCheck className="w-4 h-4 text-[#C9A227]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-foreground truncate">{race.name}</div>
                          <div className="text-xs text-muted-foreground">{race.grade} · {new Date(race.scheduledTime).toLocaleDateString('vi-VN')}</div>
                        </div>
                        <span className="text-xs font-bold text-[#8F7318] px-2 py-0.5 bg-[#C9A227]/10 border border-[#C9A227]/30 flex-shrink-0">Chờ KT</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-[140px] text-muted-foreground text-sm gap-2">
                    <CheckCircle className="w-8 h-8 opacity-30" />
                    Không có cuộc đua nào cần kiểm tra
                  </div>
                )}
              </div>

              {/* Recent reports */}
              <div className="bg-card border border-border p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-serif text-base font-bold text-foreground">Báo Cáo Gần Đây</h3>
                  <span className="text-xs text-muted-foreground">{reports.length} báo cáo</span>
                </div>
                {loadingReports ? (
                  <div className="flex items-center justify-center h-[140px] text-muted-foreground text-sm">
                    <div className="w-5 h-5 border-2 border-[#C9A227]/30 border-t-[#C9A227] rounded-full animate-spin mr-2" />
                    Đang tải...
                  </div>
                ) : reports.length > 0 ? (
                  <div className="space-y-2">
                    {reports.slice(0, 4).map((report, i) => {
                      const meta = REPORT_STATUS_META[report.status] || REPORT_STATUS_META.draft;
                      const editable = isReportEditableStatus(report.status);
                      return (
                        <div key={i} className="flex items-center gap-3 p-3 border border-border hover:bg-muted/40 transition-colors">
                          <div className={`w-8 h-8 flex items-center justify-center flex-shrink-0 ${editable ? 'bg-[#C9A227]/10 border border-[#C9A227]/30' : 'bg-[#1F3D2B]/10 border border-[#1F3D2B]/30'}`}>
                            <FileText className={`w-4 h-4 ${editable ? 'text-[#C9A227]' : 'text-[#1F3D2B]'}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-foreground truncate">{(report.raceId as any)?.name ?? '—'}</div>
                            <div className="text-xs text-muted-foreground">{report.incidents.length} sự cố · {new Date(report.createdAt).toLocaleDateString('vi-VN')}</div>
                            {report.status === 'rejected' && report.rejectReason && (
                              <div className="text-xs text-red-400 truncate">Lý do: {report.rejectReason}</div>
                            )}
                          </div>
                          <span className="text-xs font-bold px-2 py-0.5 flex-shrink-0" style={{ color: meta.color, background: meta.bg, border: `1px solid ${meta.border}` }}>
                            {meta.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-[140px] text-muted-foreground text-sm gap-2">
                    <FileText className="w-8 h-8 opacity-30" />
                    Chưa có báo cáo nào
                  </div>
                )}
              </div>
            </div>

            {/* Quick actions + upcoming races */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-card border border-border p-5">
                <h3 className="font-serif text-base font-bold text-foreground mb-4">Lịch Race Sắp Tới</h3>
                {assignedRaces.filter(r => ['open', 'closed', 'pre_check'].includes(r.status)).length > 0 ? (
                  <div className="space-y-2">
                    {assignedRaces.filter(r => ['open', 'closed', 'pre_check'].includes(r.status)).slice(0, 3).map((race, i) => (
                      <div key={i} className="flex items-start gap-3 p-2.5 border border-border hover:bg-muted/40 transition-colors">
                        <div className="w-7 h-7 bg-[#1F3D2B]/10 border border-[#1F3D2B]/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Calendar className="w-3.5 h-3.5 text-[#1F3D2B]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-foreground truncate">{race.name}</div>
                          <div className="text-xs text-muted-foreground">{new Date(race.scheduledTime).toLocaleDateString('vi-VN')}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-[100px] text-muted-foreground text-sm gap-2">
                    <Calendar className="w-7 h-7 opacity-30" />
                    Không có lịch sắp tới
                  </div>
                )}
              </div>

              <div className="lg:col-span-2 bg-card border border-border p-5">
                <h3 className="font-serif text-base font-bold text-foreground mb-4">Thao Tác Nhanh</h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Kiểm Tra Ngựa', icon: ClipboardCheck, to: '/referee/pre-check', badge: (assignedRaces.filter(r => r.status === 'pre_check').length || null) as number | null },
                    { label: 'Xem Báo Cáo', icon: FileText, to: '/referee/reports', badge: null as number | null },
                    { label: 'Theo dõi trận đấu', icon: Flag, to: '/referee/live', badge: (assignedRaces.filter(r => r.status === 'running').length || null) as number | null },
                    { label: 'Xác nhận kết quả', icon: Award, to: '/referee/results', badge: (assignedRaces.filter(r => r.status === 'finished' && !r.resultsConfirmedAt).length || null) as number | null },
                    { label: 'Cuộc Đua Được Phân Công', icon: ClipboardCheck, to: '/referee/pre-check', badge: null as number | null },
                    { label: 'Ghi Nhận Sự Cố', icon: AlertTriangle, to: '/referee/reports', badge: (reports.filter(r => r.status === 'draft').length || null) as number | null },
                  ].map((action, i) => (
                    <button key={i} onClick={() => navigate(action.to)}
                      className="flex items-center gap-3 p-4 border border-border hover:border-[#C9A227]/40 hover:bg-muted/40 transition-all text-left group">
                      <div className="w-9 h-9 bg-[#1F3D2B]/10 border border-[#1F3D2B]/20 flex items-center justify-center group-hover:bg-[#1F3D2B]/20 transition-colors flex-shrink-0">
                        <action.icon className="w-4 h-4 text-[#1F3D2B]" />
                      </div>
                      <span className="text-sm font-medium text-foreground flex-1">{action.label}</span>
                      {action.badge ? (
                        <span className="text-xs font-bold text-white bg-[#8C2F1B] px-1.5 py-0.5">{action.badge}</span>
                      ) : null}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Tab: Live Flag ── */}
        {activeTab === 'live' && (
          <LiveFlagPanel token={token!} races={assignedRaces} loading={loadingRaces} />
        )}

        {/* ── Tab: Confirm results ── */}
        {activeTab === 'results' && (
          <ResultsConfirmPanel
            token={token!}
            races={assignedRaces}
            loading={loadingRaces}
            onConfirmed={loadAssignedRaces}
          />
        )}

        {/* ── Tab: Pre-check ── */}
        {activeTab === 'pre-check' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
              <div>
                <h2 className="font-serif text-3xl font-bold text-foreground mb-2">Kiểm Tra Trước Đua</h2>
                <p className="text-slate-400">Race được phân công cho bạn</p>
              </div>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Tìm theo tên cuộc đua..."
                  value={preCheckSearch}
                  onChange={(e) => { setPreCheckSearch(e.target.value); setRacePage(1); }}
                  className="bg-slate-900 border border-border rounded-lg pl-9 pr-4 py-2 text-foreground placeholder-slate-500 focus:outline-none focus:border-[#C9A227] text-sm w-56"
                />
              </div>
            </div>
            {loadingRaces ? (
              <div className="flex justify-center py-12"><CircularProgress sx={{ color: '#C9A227' }} /></div>
            ) : assignedRaces.length === 0 ? (
              <div className="bg-card rounded-2xl border border-border p-12 text-center">
                <ClipboardCheck className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400">Bạn chưa được phân công cuộc đua nào</p>
              </div>
            ) : filteredPreCheckRaces.length === 0 ? (
              <div className="bg-card rounded-2xl border border-border p-12 text-center">
                <Search className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400">Không tìm thấy cuộc đua phù hợp</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pagedRaces.map(race => {
                  const isPrecheckable = race.status === 'pre_check';
                  return (
                    <div key={race._id} className="bg-card backdrop-blur-md border border-border rounded-2xl p-6 hover:border-[#C9A227]/30 transition-all">
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3 flex-wrap">
                            <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center flex-shrink-0">
                              <ClipboardCheck className="w-5 h-5 text-[#C9A227]" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="font-serif text-xl font-bold text-foreground">{race.name}</h3>
                                <Chip label={race.grade} size="small" sx={{ bgcolor: '#C9A227', color: '#23201A', fontWeight: 'bold', fontSize: '0.7rem' }} />
                                <Chip label={race.status === 'pre_check' ? 'Cần Kiểm Tra' : (RACE_STATUS_VN[race.status] || race.status)} size="small"
                                  sx={{ bgcolor: isPrecheckable ? 'rgba(201,162,39,0.2)' : 'rgba(100,116,139,0.2)', color: isPrecheckable ? '#8F7318' : '#7A7468', border: `1px solid ${isPrecheckable ? '#C9A227' : '#475569'}`, fontWeight: 'bold' }} />
                              </div>
                              <div className="text-slate-400 text-sm mt-0.5">
                                {new Date(race.scheduledTime).toLocaleString('vi-VN')}
                              </div>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-900/50 p-3 rounded-xl border border-border">
                            <div><div className="text-slate-500 text-xs mb-1">Cự Ly</div><div className="text-foreground font-medium text-sm">{race.distance}m</div></div>
                            <div><div className="text-slate-500 text-xs mb-1">Giải Thưởng</div><div className="text-[#C9A227] font-semibold text-sm">{race.purse?.toLocaleString('vi-VN')} coins</div></div>
                            <div><div className="text-slate-500 text-xs mb-1">Phí ĐK</div><div className="text-foreground font-medium text-sm">{race.registrationFee?.toLocaleString('vi-VN')} coins</div></div>
                            <div className="flex items-end justify-end">
                              <Button variant="contained" disabled={!isPrecheckable}
                                onClick={() => handleOpenPreCheck(race)}
                                sx={{ background: isPrecheckable ? '#C9A227' : '#EDE7D8', color: isPrecheckable ? '#23201A' : 'white', textTransform: 'none', fontWeight: 700, fontSize: '0.8rem', '&:hover': { background: '#f0d000' } }}>
                                {isPrecheckable ? 'Bắt Đầu Kiểm Tra' : 'Chưa Đến Lượt'}
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <Pagination page={racePage} totalPages={raceTotalPages} onPageChange={setRacePage} />
              </div>
            )}
          </div>
        )}

        {/* ── Tab: Reports ── */}
        {activeTab === 'reports' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <h2 className="font-serif text-3xl font-bold text-foreground">Báo Cáo Chính Thức</h2>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input type="text" placeholder="Tìm theo tên cuộc đua..."
                  value={reportSearch} onChange={e => { setReportSearch(e.target.value); setReportPage(1); }}
                  className="bg-slate-900 border border-border rounded-lg pl-9 pr-4 py-2 text-foreground placeholder-slate-500 focus:outline-none focus:border-[#C9A227] text-sm w-56" />
              </div>
            </div>

            <div className="flex gap-2 mb-6">
              <Button
                size="small"
                variant={reportsPhase === 'prerace' ? 'contained' : 'outlined'}
                onClick={() => { setReportsPhase('prerace'); setReportPage(1); }}
                sx={{
                  textTransform: 'none',
                  fontWeight: 700,
                  ...(reportsPhase === 'prerace'
                    ? { background: '#C9A227', color: '#23201A', '&:hover': { background: '#f0d000' } }
                    : { borderColor: '#C9C2B0', color: '#23201A' }),
                }}
              >
                Báo cáo trước trận
              </Button>
              <Button
                size="small"
                variant={reportsPhase === 'postrace' ? 'contained' : 'outlined'}
                onClick={() => { setReportsPhase('postrace'); setReportPage(1); }}
                sx={{
                  textTransform: 'none',
                  fontWeight: 700,
                  ...(reportsPhase === 'postrace'
                    ? { background: '#C9A227', color: '#23201A', '&:hover': { background: '#f0d000' } }
                    : { borderColor: '#C9C2B0', color: '#23201A' }),
                }}
              >
                Báo cáo sau trận
              </Button>
            </div>

            {loadingReports ? (
              <div className="flex justify-center py-12"><CircularProgress sx={{ color: '#C9A227' }} /></div>
            ) : filteredReports.length === 0 ? (
              <div className="bg-card rounded-2xl border border-border p-12 text-center">
                <FileText className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400">
                  {reportsPhase === 'prerace' ? 'Chưa có báo cáo trước trận' : 'Chưa có báo cáo sau trận (cần cuộc đua đã kết thúc)'}
                </p>
              </div>
            ) : (
              <>
              <div className="bg-card backdrop-blur-md border border-border rounded-2xl overflow-hidden">
                <table className="w-full">
                  <thead className="bg-slate-900/80 border-b border-border">
                    <tr>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-slate-400">Cuộc Đua</th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-slate-400">Ngày Tạo</th>
                      {reportsPhase === 'postrace' && (
                        <th className="text-center px-4 py-4 text-sm font-semibold text-slate-400">Sự Cố</th>
                      )}
                      <th className="text-left px-4 py-4 text-sm font-semibold text-slate-400">Trạng Thái</th>
                      <th className="text-right px-6 py-4 text-sm font-semibold text-slate-400">Hành Động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {pagedReports.map(report => {
                      const raceStatus = (report.raceId as any)?.status as string;
                      const raceStarted = ['running', 'finished', 'cancelled'].includes(raceStatus);
                      const preStatus = report.preRaceStatus || 'draft';
                      const postStatus = report.status;
                      const phaseStatus = reportsPhase === 'prerace' ? preStatus : postStatus;
                      const editable = reportsPhase === 'prerace'
                        ? isPreRaceEditableStatus(preStatus) && !raceStarted
                        : isReportEditableStatus(postStatus) && raceStatus === 'finished';
                      const meta = REPORT_STATUS_META[phaseStatus] || REPORT_STATUS_META.draft;
                      const draftFlags = (report.incidents || []).filter((i) => i.status === 'draft').length;
                      return (
                        <tr key={report._id} className="hover:bg-muted transition-colors">
                          <td className="px-6 py-4">
                            <div className="text-foreground font-medium">{(report.raceId as any)?.name}</div>
                            <div className="text-slate-500 text-xs mt-0.5">
                              {(report.raceId as any)?.grade} · {RACE_STATUS_VN[raceStatus] || raceStatus}
                            </div>
                            {reportsPhase === 'prerace' && preStatus === 'rejected' && report.preRaceRejectReason && (
                              <div className="text-red-400 text-xs mt-1">Từ chối: {report.preRaceRejectReason}</div>
                            )}
                            {reportsPhase === 'postrace' && postStatus === 'rejected' && report.rejectReason && (
                              <div className="text-red-400 text-xs mt-1">Từ chối: {report.rejectReason}</div>
                            )}
                          </td>
                          <td className="px-6 py-4 text-slate-300 text-sm">{new Date(report.createdAt).toLocaleDateString('vi-VN')}</td>
                          {reportsPhase === 'postrace' && (
                            <td className="px-4 py-4 text-center">
                              <span className={`font-bold ${draftFlags > 0 ? 'text-amber-400' : 'text-slate-500'}`}>
                                {report.incidents.length}
                              </span>
                            </td>
                          )}
                          <td className="px-4 py-4">
                            <Chip label={meta.label} size="small"
                              sx={{ bgcolor: meta.bg, color: meta.color, border: `1px solid ${meta.border}`, fontWeight: 'bold' }} />
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-end gap-2">
                              {editable && (
                                <>
                                  <Button size="small" variant="outlined" onClick={() => openEditReport(report, reportsPhase)}
                                    sx={{ borderColor: '#C9C2B0', color: '#23201A', textTransform: 'none', fontSize: '0.75rem', '&:hover': { borderColor: '#C9A227', color: '#C9A227' } }}>
                                    Sửa
                                  </Button>
                                  {reportsPhase === 'postrace' && draftFlags > 0 && (
                                    <Button
                                      size="small"
                                      variant="outlined"
                                      onClick={async () => {
                                        try {
                                          const full = await refereeApi.getReportById(token!, report._id);
                                          setActiveReport(full);
                                          setResolveIncident(null);
                                          setIncidentDialog(true);
                                        } catch (err: any) {
                                          toast.error(err.message);
                                        }
                                      }}
                                      sx={{ borderColor: '#8C2F1B', color: '#c45c45', textTransform: 'none', fontSize: '0.75rem', '&:hover': { bgcolor: 'rgba(140,47,27,0.08)' } }}
                                    >
                                      Xử lý Flag
                                    </Button>
                                  )}
                                  <Button
                                    size="small"
                                    variant="outlined"
                                    onClick={() => reportsPhase === 'prerace'
                                      ? handleSubmitPreRace(report._id)
                                      : handleSubmitReport(report._id)}
                                    sx={{ borderColor: '#1F3D2B', color: '#34d399', textTransform: 'none', fontSize: '0.75rem', '&:hover': { bgcolor: 'rgba(16,185,129,0.1)' } }}
                                  >
                                    Nộp
                                  </Button>
                                </>
                              )}
                              {!editable && (
                                <Button size="small" variant="outlined" onClick={() => openEditReport(report, reportsPhase)}
                                  sx={{ borderColor: '#C9C2B0', color: '#23201A', textTransform: 'none', fontSize: '0.75rem', '&:hover': { borderColor: '#C9A227', color: '#C9A227' } }}>
                                  Xem
                                </Button>
                              )}
                              <Button size="small" variant="outlined" startIcon={downloading === report._id ? <CircularProgress size={12} sx={{ color: '#23201A' }} /> : <Download className="w-3 h-3" />}
                                onClick={() => handleDownloadPdf(report._id)} disabled={downloading === report._id}
                                sx={{ borderColor: '#C9C2B0', color: '#23201A', textTransform: 'none', fontSize: '0.75rem', '&:hover': { borderColor: '#C9A227', color: '#C9A227' } }}>
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
              <Pagination page={reportPage} totalPages={Math.ceil(filteredReports.length / REF_PAGE_SIZE)} onPageChange={setReportPage} />
              </>
            )}
          </div>
        )}
      </div>

      {/* ── Pre-Check Dialog ── */}
      <Dialog open={preCheckOpen} onClose={() => setPreCheckOpen(false)} maxWidth="md" fullWidth
        PaperProps={{ style: { backgroundColor: '#FFFFFF', border: '1px solid #E3DCCB', borderRadius: '20px', maxHeight: '92vh' } }}>
        <DialogTitle sx={{ color: '#23201A', borderBottom: '1px solid #E3DCCB', pb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
          <ClipboardCheck className="w-5 h-5 text-[#C9A227]" />
          Kiểm Tra Trước Đua — {selectedRace?.name}
        </DialogTitle>
        <DialogContent sx={{ paddingTop: '20px !important', overflowY: 'auto' }}>
          {loadingRegs ? (
            <div className="flex justify-center py-12"><CircularProgress sx={{ color: '#C9A227' }} /></div>
          ) : registrations.length === 0 ? (
            <div className="text-slate-400 text-center py-8">Không có ngựa đăng ký</div>
          ) : (
            <div className="flex gap-5" style={{ minHeight: '360px' }}>
              {/* Sidebar */}
              <div className="w-52 flex-shrink-0 border-r border-border pr-4 space-y-2 overflow-y-auto">
                <div className="text-xs text-slate-500 uppercase font-bold mb-3 tracking-wider">Danh Sách Ngựa</div>
                {registrations.map((reg, idx) => {
                  const horse = reg.horseId as any;
                  const preStatus = reg.preCheckResult?.status;
                  return (
                    <div key={reg._id} onClick={() => setSelectedRegIdx(idx)}
                      className={`p-3 rounded-xl cursor-pointer border transition-all ${selectedRegIdx === idx ? 'bg-[#C9A227]/15 border-[#C9A227]/40' : 'bg-muted/40 border-transparent hover:bg-muted/40'}`}>
                      <div className="text-foreground font-semibold text-sm">{horse?.name || '-'}</div>
                      <div className="text-slate-400 text-xs mt-0.5">{(reg.jockeyId as any)?.fullName || 'Chưa có nài'}</div>
                      {preStatus === 'passed' && <div className="flex items-center gap-1 mt-1.5 text-emerald-400 text-xs font-medium"><CheckCircle className="w-3 h-3" /> ĐẠT</div>}
                      {preStatus === 'failed' && <div className="flex items-center gap-1 mt-1.5 text-red-400 text-xs font-medium"><X className="w-3 h-3" /> KHÔNG ĐẠT</div>}
                      {preStatus === 'pending' && <div className="mt-1.5 text-xs text-slate-500">Chờ kiểm tra</div>}
                    </div>
                  );
                })}
              </div>

              {/* Main — Pass / Fail only (no checklist) */}
              <div className="flex-1 overflow-y-auto pl-1">
                {currentReg && (() => {
                  const horse = currentReg.horseId as any;
                  const jockey = currentReg.jockeyId as any;
                  const pending = currentReg.preCheckResult?.status === 'pending';
                  return (
                    <>
                      <div className="bg-slate-900/70 rounded-2xl border border-border p-5 mb-5">
                        <h3 className="font-serif text-xl font-bold text-foreground">{horse?.name}</h3>
                        <div className="text-slate-400 text-sm mb-3">
                          {horse?.breed} · {horse?.gender} · {horse?.currentGrade}
                        </div>
                        {jockey && (
                          <div className="bg-blue-500/8 border border-blue-500/20 rounded-xl p-3 text-sm">
                            <div className="text-blue-400 font-bold uppercase text-xs mb-2">Kỵ Sĩ</div>
                            <div className="text-foreground font-medium">{jockey.fullName}</div>
                            {jockey.jockeyProfile && (
                              <div className="text-slate-400 text-xs mt-1">{jockey.jockeyProfile.experienceYears} năm KN · {jockey.jockeyProfile.weight} kg</div>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="rounded-xl border border-[#E3DCCB] bg-[#FBF8F1] px-4 py-3 text-sm text-[#5C564A] mb-5">
                        Kiểm tra thực tế ngoài sân. Tại đây ghi <strong>Đạt</strong> hoặc <strong>Không Đạt</strong>.
                        Có thể sửa lại kết quả khi cuộc đua còn ở trạng thái kiểm tra trước đua.
                        Đổi nài / trang bị nhỏ → ghi ở <strong>Báo cáo trước trận</strong> (Đổi nài / Đổi trang bị).
                      </div>

                      {currentReg.preCheckResult?.status === 'passed' && (
                        <div className="flex items-center justify-center gap-2 bg-emerald-500/10 border border-emerald-500/30 rounded-xl py-4 mb-3">
                          <CheckCircle className="w-5 h-5 text-emerald-400" />
                          <span className="text-emerald-400 font-bold text-lg">ĐÃ ĐẠT</span>
                        </div>
                      )}
                      {currentReg.preCheckResult?.status === 'failed' && (
                        <div className="flex flex-col items-center justify-center gap-1 bg-red-500/10 border border-red-500/30 rounded-xl py-4 mb-3">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-red-400" />
                            <span className="text-red-400 font-bold text-lg">KHÔNG ĐẠT — Ngựa bị loại</span>
                          </div>
                          {currentReg.preCheckResult?.category && (
                            <span className="text-xs text-red-300 uppercase tracking-wide">
                              {FAIL_CATEGORIES.find((c) => c.value === currentReg.preCheckResult?.category)?.label
                                || currentReg.preCheckResult.category}
                              {currentReg.preCheckResult.note ? ` — ${currentReg.preCheckResult.note}` : ''}
                            </span>
                          )}
                        </div>
                      )}

                      {(pending
                        || currentReg.preCheckResult?.status === 'passed'
                        || currentReg.preCheckResult?.status === 'failed') && (
                        <div className="flex gap-3">
                          <Button
                            variant="contained"
                            fullWidth
                            startIcon={<CheckCircle />}
                            disabled={submittingCheck || currentReg.preCheckResult?.status === 'passed'}
                            sx={{ background: '#1F3D2B', textTransform: 'none', fontWeight: 700, py: 1.5, '&:hover': { background: '#172D20' } }}
                            onClick={() => handleSubmitPreCheck('passed')}
                          >
                            {submittingCheck ? <CircularProgress size={20} sx={{ color: 'white' }} /> : pending ? 'Đạt' : 'Đổi thành Đạt'}
                          </Button>
                          <Button
                            variant="outlined"
                            fullWidth
                            startIcon={<AlertTriangle />}
                            disabled={submittingCheck || currentReg.preCheckResult?.status === 'failed'}
                            sx={{ borderColor: '#B42318', color: '#B42318', textTransform: 'none', fontWeight: 700, py: 1.5, '&:hover': { backgroundColor: 'rgba(180,35,24,0.1)', borderColor: '#dc2626' } }}
                            onClick={openFailDialog}
                          >
                            {pending ? 'Không Đạt' : 'Đổi thành Không Đạt'}
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
        <DialogActions sx={{ borderTop: '1px solid #E3DCCB', padding: '16px 24px', gap: 1 }}>
          {registrations.length > 0 && registrations.every(r => r.preCheckResult?.status !== 'pending') && (
            <div className="flex-1 flex flex-wrap items-center gap-2 text-sm">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span className="text-emerald-400 font-medium">
                Đã kiểm tra xong — {registrations.filter(r => r.preCheckResult?.status === 'passed').length} đạt / {registrations.filter(r => r.preCheckResult?.status === 'failed').length} loại
              </span>
              <Button
                size="small"
                variant="outlined"
                onClick={async () => {
                  if (!token || !selectedRace?._id) {
                    toast.error('Không xác định được cuộc đua');
                    return;
                  }
                  try {
                    const report = await refereeApi.ensureReport(token, selectedRace._id);
                    setPreCheckOpen(false);
                    navigate(`/referee/reports?reportId=${report._id}`);
                  } catch (err: any) {
                    toast.error(err.message || 'Không mở được báo cáo trước trận');
                  }
                }}
                sx={{ borderColor: '#C9A227', color: '#8F7318', textTransform: 'none', ml: 1 }}
              >
                Mở báo cáo trước trận
              </Button>
            </div>
          )}
          <Button onClick={() => setPreCheckOpen(false)} sx={{ color: '#7A7468', textTransform: 'none' }}>Đóng</Button>
        </DialogActions>
      </Dialog>

      {/* ── Fail Pre-check Dialog ── */}
      <Dialog open={failDialogOpen} onClose={() => !submittingCheck && setFailDialogOpen(false)} maxWidth="sm" fullWidth
        PaperProps={{ style: { backgroundColor: '#FFFFFF', border: '1px solid #E3DCCB', borderRadius: '16px' } }}>
        <DialogTitle sx={{ color: '#23201A' }}>
          Không Đạt — {(registrations[selectedRegIdx]?.horseId as any)?.name || 'Ngựa'}
        </DialogTitle>
        <DialogContent>
          <div className="mt-2 space-y-4">
            <FormControl fullWidth required>
              <InputLabel sx={{ color: '#7A7468' }}>Phân loại lỗi (Category)</InputLabel>
              <Select
                value={failCategory}
                label="Phân loại lỗi (Category)"
                onChange={e => setFailCategory(e.target.value as PreCheckFailCategory)}
                sx={{ color: '#23201A', '& fieldset': { borderColor: '#C9C2B0' }, '& .MuiSelect-icon': { color: '#7A7468' } }}
              >
                {FAIL_CATEGORIES.map(c => (
                  <MenuItem key={c.value} value={c.value}>{c.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              fullWidth
              multiline
              minRows={2}
              label="Chi tiết lỗi (tùy chọn)"
              value={failNote}
              onChange={e => setFailNote(e.target.value)}
              placeholder='Ví dụ: "Ngựa đi khập khiễng chân trước bên phải"'
              InputLabelProps={{ sx: { color: '#7A7468' } }}
              sx={{ '& fieldset': { borderColor: '#C9C2B0' } }}
            />
          </div>
        </DialogContent>
        <DialogActions sx={{ padding: '16px 24px' }}>
          <Button onClick={() => setFailDialogOpen(false)} disabled={submittingCheck} sx={{ color: '#7A7468', textTransform: 'none' }}>Hủy</Button>
          <Button
            variant="contained"
            onClick={confirmFailPreCheck}
            disabled={submittingCheck || !failCategory}
            sx={{ background: '#B42318', textTransform: 'none', fontWeight: 700, '&:hover': { background: '#912018' } }}
          >
            {submittingCheck ? <CircularProgress size={20} sx={{ color: 'white' }} /> : 'Xác nhận Không Đạt'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Edit Report Dialog ── */}
      <Dialog open={editReportDialog} onClose={() => setEditReportDialog(false)} maxWidth="md" fullWidth
        PaperProps={{ style: { backgroundColor: '#FFFFFF', border: '1px solid #E3DCCB', borderRadius: '16px', maxHeight: '92vh' } }}>
        <DialogTitle sx={{ color: '#23201A', borderBottom: '1px solid #E3DCCB', pb: 2 }}>
          {editDialogPhase === 'prerace'
            ? ((editReport?.preRaceStatus || 'draft') === 'rejected'
              ? 'Sửa báo cáo trước trận (bị từ chối)'
              : isPreRaceEditableStatus(editReport?.preRaceStatus)
                ? 'Chỉnh sửa báo cáo trước trận'
                : 'Xem báo cáo trước trận')
            : (editReport?.status === 'rejected'
              ? 'Sửa báo cáo sau trận (bị từ chối)'
              : isReportEditableStatus(editReport?.status)
                ? 'Chỉnh sửa báo cáo sau trận'
                : 'Xem báo cáo sau trận')}
          {' — '}{(editReport?.raceId as any)?.name}
        </DialogTitle>
        <DialogContent sx={{ paddingTop: '20px !important', overflowY: 'auto' }}>
          {editReport && (() => {
            const raceStatus = (editReport.raceId as any)?.status as string;
            const raceStarted = ['running', 'finished', 'cancelled'].includes(raceStatus);
            const readOnly = editDialogPhase === 'prerace'
              ? !isPreRaceEditableStatus(editReport.preRaceStatus) || raceStarted
              : !isReportEditableStatus(editReport.status) || raceStatus !== 'finished';
            const lateScratchings = editReport.preRaceReport?.lateScratchings || [];
            const lineSections = [
              { title: '3. Đổi nài', lines: editRiderChanges, draftKey: 'rider' as const, setLines: setEditRiderChanges },
              { title: '4. Đổi trang bị', lines: editGearChanges, draftKey: 'gear' as const, setLines: setEditGearChanges },
              { title: '5. Kiểm tra thú y', lines: editVetChecks, draftKey: 'vet' as const, setLines: setEditVetChecks },
            ];

            return (
              <div className="space-y-5">
                {editDialogPhase === 'prerace' && editReport.preRaceStatus === 'rejected' && editReport.preRaceRejectReason && (
                  <div className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
                    <strong>Admin từ chối báo cáo trước trận:</strong> {editReport.preRaceRejectReason}
                  </div>
                )}
                {editDialogPhase === 'postrace' && editReport.status === 'rejected' && editReport.rejectReason && (
                  <div className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
                    <strong>Admin từ chối báo cáo sau trận:</strong> {editReport.rejectReason}
                  </div>
                )}

                {editDialogPhase === 'prerace' && (
                  <>
                <section>
                  <h3 className="font-semibold text-[#23201A] mb-3">1. Điều kiện mặt đường</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormControl fullWidth disabled={readOnly}>
                      <InputLabel sx={{ color: '#7A7468' }}>Điều kiện mặt đường *</InputLabel>
                      <Select value={editTrack} displayEmpty label="Điều kiện mặt đường *"
                        onChange={e => setEditTrack(e.target.value as TrackCondition | '')}
                        renderValue={selected => selected
                          ? (TRACK_OPTIONS.find((t) => t.value === selected)?.label || selected)
                          : <span className="text-sm italic text-[#7A7468]">{EMPTY_NOTE}</span>}
                        sx={{ color: '#23201A', '& fieldset': { borderColor: '#C9C2B0' }, '& .MuiSelect-icon': { color: '#7A7468' } }}>
                        {TRACK_OPTIONS.map(option => <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>)}
                      </Select>
                    </FormControl>
                    <TextField fullWidth label="Ghi chú mặt đường" value={editTrackNote} disabled={readOnly}
                      onChange={e => setEditTrackNote(e.target.value)}
                      sx={{ '& .MuiInputLabel-root': { color: '#7A7468' }, '& .MuiOutlinedInput-root': { color: '#23201A', '& fieldset': { borderColor: '#C9C2B0' } } }} />
                  </div>
                </section>

                <section>
                  <h3 className="font-semibold text-[#23201A] mb-2">2. Rút muộn (Late Scratchings)</h3>
                  {lateScratchings.length ? (
                    <ul className="list-disc pl-5 space-y-1 text-sm text-[#23201A]">
                      {lateScratchings.map(scratching => <li key={scratching._id}>{scratching.label}</li>)}
                    </ul>
                  ) : <p className="text-sm italic text-[#7A7468]">{EMPTY_NOTE}</p>}
                </section>

                {lineSections.map(({ title, lines, draftKey, setLines }) => (
                  <section key={draftKey}>
                    <h3 className="font-semibold text-[#23201A] mb-2">{title}</h3>
                    {lines.length ? (
                      <div className="space-y-2 mb-3">
                        {lines.map((line, index) => (
                          <div key={`${draftKey}-${index}`} className="flex items-center gap-2 text-sm text-[#23201A]">
                            <span className="flex-1">{line}</span>
                            {!readOnly && (
                              <Button size="small" color="error" onClick={() => setLines(lines.filter((_, lineIndex) => lineIndex !== index))}
                                sx={{ minWidth: 0, textTransform: 'none' }}>
                                Xóa
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : <p className="text-sm italic text-[#7A7468] mb-3">{EMPTY_NOTE}</p>}
                    {!readOnly && (
                      <div className="flex gap-2">
                        <TextField fullWidth size="small" label="Thêm mục" value={editLineDraft[draftKey]}
                          onChange={e => setEditLineDraft(current => ({ ...current, [draftKey]: e.target.value }))}
                          onKeyDown={e => {
                            if (e.key === 'Enter' && editLineDraft[draftKey].trim()) {
                              e.preventDefault();
                              setLines([...lines, editLineDraft[draftKey].trim()]);
                              setEditLineDraft(current => ({ ...current, [draftKey]: '' }));
                            }
                          }}
                          sx={{ '& .MuiInputLabel-root': { color: '#7A7468' }, '& .MuiOutlinedInput-root': { color: '#23201A', '& fieldset': { borderColor: '#C9C2B0' } } }} />
                        <Button variant="outlined" onClick={() => {
                          if (!editLineDraft[draftKey].trim()) return;
                          setLines([...lines, editLineDraft[draftKey].trim()]);
                          setEditLineDraft(current => ({ ...current, [draftKey]: '' }));
                        }}
                          sx={{ borderColor: '#C9A227', color: '#8F7318', textTransform: 'none' }}>
                          Thêm
                        </Button>
                      </div>
                    )}
                  </section>
                ))}
                  </>
                )}

                {editDialogPhase === 'postrace' && (
                  <>
                <section className="border-t border-[#E3DCCB] pt-4">
                  <h3 className="font-semibold text-[#23201A] mb-3">Giải trình phong độ</h3>
                  {editPerfExplanations.length ? (
                    <ul className="space-y-2 mb-3">
                      {editPerfExplanations.map((p, idx) => (
                        <li key={p._id || `${p.registrationId}-${idx}`} className="flex items-start justify-between gap-2 rounded-lg border border-[#E3DCCB] px-3 py-2 text-sm">
                          <div>
                            <div className="font-medium text-[#23201A]">{p.label}</div>
                            <div className="text-xs text-[#7A7468]">
                              Triệu tập: {(p.summonedRoles || []).map((r) => r === 'jockey' ? 'Nài' : 'Chủ ngựa').join(', ') || '—'}
                            </div>
                            <div className="text-[#5C564A] mt-1">{p.explanation || EMPTY_NOTE}</div>
                          </div>
                          {!readOnly && (
                            <Button size="small" color="error" sx={{ textTransform: 'none', minWidth: 0 }}
                              onClick={() => setEditPerfExplanations((rows) => rows.filter((_, i) => i !== idx))}>
                              Xóa
                            </Button>
                          )}
                        </li>
                      ))}
                    </ul>
                  ) : <p className="text-sm italic text-[#7A7468] mb-3">{EMPTY_NOTE}</p>}
                  {!readOnly && (
                    <div className="space-y-2 rounded-lg bg-[#F7F4EC] p-3">
                      <FormControl fullWidth size="small">
                        <InputLabel sx={{ color: '#7A7468' }}>Ngựa</InputLabel>
                        <Select
                          label="Ngựa"
                          value={perfDraft.registrationId}
                          onChange={(e) => setPerfDraft((d) => ({ ...d, registrationId: e.target.value }))}
                          sx={{ color: '#23201A', '& fieldset': { borderColor: '#C9C2B0' } }}
                        >
                          {editRaceRegs.filter((r) => r.status !== 'cancelled').map((r) => (
                            <MenuItem key={r._id} value={r._id}>{(r.horseId as any)?.name || r._id}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      <div className="flex gap-3 text-sm text-[#23201A]">
                        <label className="flex items-center gap-1.5">
                          <input type="checkbox" checked={perfDraft.summonedJockey}
                            onChange={(e) => setPerfDraft((d) => ({ ...d, summonedJockey: e.target.checked }))} />
                          Nài
                        </label>
                        <label className="flex items-center gap-1.5">
                          <input type="checkbox" checked={perfDraft.summonedOwner}
                            onChange={(e) => setPerfDraft((d) => ({ ...d, summonedOwner: e.target.checked }))} />
                          Chủ ngựa
                        </label>
                      </div>
                      <TextField fullWidth size="small" multiline minRows={2} label="Giải trình"
                        value={perfDraft.explanation}
                        onChange={(e) => setPerfDraft((d) => ({ ...d, explanation: e.target.value }))}
                        sx={{ '& .MuiInputLabel-root': { color: '#7A7468' }, '& .MuiOutlinedInput-root': { color: '#23201A', '& fieldset': { borderColor: '#C9C2B0' } } }}
                      />
                      <Button
                        variant="outlined"
                        size="small"
                        sx={{ borderColor: '#C9A227', color: '#8F7318', textTransform: 'none' }}
                        onClick={() => {
                          const reg = editRaceRegs.find((r) => r._id === perfDraft.registrationId);
                          if (!reg) { toast.error('Chọn ngựa'); return; }
                          const roles: Array<'jockey' | 'owner'> = [];
                          if (perfDraft.summonedJockey) roles.push('jockey');
                          if (perfDraft.summonedOwner) roles.push('owner');
                          setEditPerfExplanations((rows) => [...rows, {
                            registrationId: reg._id,
                            horseId: (reg.horseId as any)?._id || String(reg.horseId),
                            label: (reg.horseId as any)?.name || 'Ngựa',
                            summonedRoles: roles,
                            explanation: perfDraft.explanation.trim(),
                            recordedAt: new Date().toISOString(),
                          }]);
                          setPerfDraft({ registrationId: '', summonedJockey: true, summonedOwner: false, explanation: '' });
                        }}
                      >
                        Thêm giải trình
                      </Button>
                    </div>
                  )}
                </section>

                <section>
                  <h3 className="font-semibold text-[#23201A] mb-3">Lệnh thú y</h3>
                  {editVetOrders.length ? (
                    <ul className="space-y-2 mb-3">
                      {editVetOrders.map((v, idx) => (
                        <li key={v._id || `${v.registrationId}-${idx}`} className="flex items-start justify-between gap-2 rounded-lg border border-[#E3DCCB] px-3 py-2 text-sm">
                          <div>
                            <div className="font-medium text-[#23201A]">
                              {v.label} — {VET_ORDER_TYPES.find((t) => t.value === v.orderType)?.label || v.orderType}
                            </div>
                            <div className="text-[#5C564A]">{v.note || EMPTY_NOTE}</div>
                          </div>
                          {!readOnly && (
                            <Button size="small" color="error" sx={{ textTransform: 'none', minWidth: 0 }}
                              onClick={() => setEditVetOrders((rows) => rows.filter((_, i) => i !== idx))}>
                              Xóa
                            </Button>
                          )}
                        </li>
                      ))}
                    </ul>
                  ) : <p className="text-sm italic text-[#7A7468] mb-3">{EMPTY_NOTE}</p>}
                  {!readOnly && (
                    <div className="space-y-2 rounded-lg bg-[#F7F4EC] p-3">
                      <FormControl fullWidth size="small">
                        <InputLabel sx={{ color: '#7A7468' }}>Ngựa</InputLabel>
                        <Select
                          label="Ngựa"
                          value={vetDraft.registrationId}
                          onChange={(e) => setVetDraft((d) => ({ ...d, registrationId: e.target.value }))}
                          sx={{ color: '#23201A', '& fieldset': { borderColor: '#C9C2B0' } }}
                        >
                          {editRaceRegs.filter((r) => r.status !== 'cancelled').map((r) => (
                            <MenuItem key={r._id} value={r._id}>{(r.horseId as any)?.name || r._id}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      <FormControl fullWidth size="small">
                        <InputLabel sx={{ color: '#7A7468' }}>Loại lệnh</InputLabel>
                        <Select
                          label="Loại lệnh"
                          value={vetDraft.orderType}
                          onChange={(e) => setVetDraft((d) => ({ ...d, orderType: e.target.value as PostRaceVetOrderType }))}
                          sx={{ color: '#23201A', '& fieldset': { borderColor: '#C9C2B0' } }}
                        >
                          {VET_ORDER_TYPES.map((t) => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
                        </Select>
                      </FormControl>
                      <TextField fullWidth size="small" label="Ghi chú"
                        value={vetDraft.note}
                        onChange={(e) => setVetDraft((d) => ({ ...d, note: e.target.value }))}
                        sx={{ '& .MuiInputLabel-root': { color: '#7A7468' }, '& .MuiOutlinedInput-root': { color: '#23201A', '& fieldset': { borderColor: '#C9C2B0' } } }}
                      />
                      <Button
                        variant="outlined"
                        size="small"
                        sx={{ borderColor: '#C9A227', color: '#8F7318', textTransform: 'none' }}
                        onClick={() => {
                          const reg = editRaceRegs.find((r) => r._id === vetDraft.registrationId);
                          if (!reg) { toast.error('Chọn ngựa'); return; }
                          setEditVetOrders((rows) => [...rows, {
                            registrationId: reg._id,
                            horseId: (reg.horseId as any)?._id || String(reg.horseId),
                            label: (reg.horseId as any)?.name || 'Ngựa',
                            orderType: vetDraft.orderType,
                            note: vetDraft.note.trim(),
                            orderedAt: new Date().toISOString(),
                          }]);
                          setVetDraft({ registrationId: '', orderType: 'blood', note: '' });
                        }}
                      >
                        Thêm lệnh thú y
                      </Button>
                    </div>
                  )}
                </section>

                <section>
                  <h3 className="font-semibold text-[#23201A] mb-2">Xử phạt</h3>
                  {(() => {
                    const resolvedIncs = (editReport.incidents || []).filter((i) => i.status === 'resolved');
                    if (resolvedIncs.length === 0) {
                      return <p className="text-sm italic text-[#7A7468]">{NO_PENALTY}</p>;
                    }
                    return (
                      <ul className="space-y-2">
                        {resolvedIncs.map((inc) => {
                          const horse = incidentHorseName(inc, editRaceRegs);
                          const typeLabel = INCIDENT_TYPES.find((t) => t.value === inc.type)?.label || inc.type;
                          const verdictLabel = VERDICT_OPTIONS.find((v) => v.value === inc.resolution?.verdict)?.label || '—';
                          return (
                            <li
                              key={inc._id}
                              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[#E3DCCB] bg-white px-3 py-2.5 text-sm"
                            >
                              <div className="min-w-0">
                                <div className="font-medium text-[#23201A]">
                                  {horse} · {inc.source === 'live_flag' ? 'Cờ' : typeLabel} · {verdictLabel}
                                </div>
                                <div className="text-xs text-[#7A7468] mt-0.5">
                                  {inc.resolution?.verdict === 'fine' && inc.resolution.fineAmount != null
                                    ? `Phạt ${inc.resolution.fineAmount.toLocaleString('vi-VN')} coins`
                                      + (inc.resolution.fineTargetRole === 'jockey' ? ' (nài)' : ' (chủ ngựa)')
                                    : (inc.resolution?.note || typeLabel)}
                                </div>
                              </div>
                              {!readOnly && (
                                <Button
                                  size="small"
                                  variant="outlined"
                                  onClick={() => openResolveIncident(inc)}
                                  sx={{ borderColor: '#C9C2B0', color: '#23201A', textTransform: 'none', fontSize: '0.75rem' }}
                                >
                                  Sửa
                                </Button>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    );
                  })()}
                </section>

                <section>
                  <h3 className="font-semibold text-[#23201A] mb-2">Ghi Chú Chung</h3>
                  <TextField fullWidth multiline rows={4} value={editOverallNotes} disabled={readOnly}
                    onChange={e => setEditOverallNotes(e.target.value)} placeholder="Nhập ghi chú chung..."
                    sx={{ '& .MuiInputLabel-root': { color: '#7A7468' }, '& .MuiOutlinedInput-root': { color: '#23201A', '& fieldset': { borderColor: '#C9C2B0' } } }} />
                </section>
                  </>
                )}
              </div>
            );
          })()}
        </DialogContent>
        <DialogActions sx={{ borderTop: '1px solid #E3DCCB', padding: '16px 24px' }}>
          <Button onClick={() => setEditReportDialog(false)} sx={{ color: '#7A7468', textTransform: 'none' }}>Đóng</Button>
          {((editDialogPhase === 'prerace' && isPreRaceEditableStatus(editReport?.preRaceStatus)
            && !['running', 'finished', 'cancelled'].includes((editReport?.raceId as any)?.status))
            || (editDialogPhase === 'postrace' && isReportEditableStatus(editReport?.status)
            && (editReport?.raceId as any)?.status === 'finished')) && (
            <Button variant="contained" onClick={handleSaveReport} disabled={savingReport}
              sx={{ background: '#C9A227', color: '#23201A', textTransform: 'none', fontWeight: 700, '&:hover': { background: '#f0d000' } }}>
              {savingReport ? <CircularProgress size={20} sx={{ color: '#23201A' }} /> : 'Lưu'}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* ── Resolve Incident Dialog ── */}
      <Dialog open={resolveDialog} onClose={() => setResolveDialog(false)} maxWidth="sm" fullWidth
        PaperProps={{ style: { backgroundColor: '#FFFFFF', border: '1px solid #E3DCCB', borderRadius: '16px' } }}>
        <DialogTitle sx={{ color: '#23201A' }}>
          {resolveIncident?.status === 'resolved' ? 'Sửa xử phạt Flag' : 'Xử lý sự cố Flag'}
        </DialogTitle>
        <DialogContent>
          <div className="space-y-4 mt-4">
            {resolveIncident && (
              <div className="rounded-lg border border-[#E3DCCB] bg-[#F7F4EC] px-3 py-2 text-sm text-[#23201A]">
                <div className="font-semibold">
                  {incidentHorseName(resolveIncident, editRaceRegs)}
                  {resolveIncident.source === 'live_flag' ? ' · Cờ trực tiếp' : ''}
                </div>
                <div className="text-xs text-[#7A7468] mt-0.5">
                  {resolveIncident.flaggedAt
                    ? `Gắn cờ lúc ${new Date(resolveIncident.flaggedAt).toLocaleString('vi-VN')}`
                    : 'Gắn cờ trong cuộc đua'}
                  {resolveIncident.raceTimeMs != null ? ` · ${Math.round(resolveIncident.raceTimeMs / 1000)}s` : ''}
                </div>
              </div>
            )}
            <FormControl fullWidth>
              <InputLabel sx={{ color: '#7A7468' }}>Loại vi phạm *</InputLabel>
              <Select
                value={resolveForm.type}
                label="Loại vi phạm *"
                onChange={e => setResolveForm(p => ({ ...p, type: e.target.value as Incident['type'] }))}
                sx={{ color: '#23201A', '& fieldset': { borderColor: '#C9C2B0' }, '& .MuiSelect-icon': { color: '#7A7468' } }}
              >
                {INCIDENT_TYPES.map(t => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel sx={{ color: '#7A7468' }}>Loại xử lý *</InputLabel>
              <Select
                value={resolveForm.verdict}
                label="Loại xử lý *"
                onChange={e => setResolveForm(p => ({ ...p, verdict: e.target.value as IncidentVerdict }))}
                sx={{ color: '#23201A', '& fieldset': { borderColor: '#C9C2B0' }, '& .MuiSelect-icon': { color: '#7A7468' } }}
              >
                {VERDICT_OPTIONS.map(v => <MenuItem key={v.value} value={v.value}>{v.label}</MenuItem>)}
              </Select>
            </FormControl>
            {resolveForm.verdict === 'fine' && (
              <>
                <TextField fullWidth type="number" label="Số tiền phạt *" value={resolveForm.fineAmount}
                  onChange={e => setResolveForm(p => ({ ...p, fineAmount: e.target.value }))}
                  sx={{ '& .MuiInputLabel-root': { color: '#7A7468' }, '& .MuiOutlinedInput-root': { color: '#23201A', '& fieldset': { borderColor: '#C9C2B0' } } }} />
                <FormControl fullWidth required>
                  <InputLabel sx={{ color: '#7A7468' }}>Người nộp phạt *</InputLabel>
                  <Select
                    value={resolveForm.fineTargetRole}
                    label="Người nộp phạt *"
                    onChange={e => setResolveForm(p => ({ ...p, fineTargetRole: e.target.value as 'owner' | 'jockey' }))}
                    sx={{ color: '#23201A', '& fieldset': { borderColor: '#C9C2B0' }, '& .MuiSelect-icon': { color: '#7A7468' } }}
                  >
                    <MenuItem value="owner">Chủ ngựa</MenuItem>
                    <MenuItem value="jockey">Nài</MenuItem>
                  </Select>
                </FormControl>
              </>
            )}
            <TextField fullWidth multiline rows={2} label="Ghi chú xử lý" value={resolveForm.note}
              onChange={e => setResolveForm(p => ({ ...p, note: e.target.value }))}
              sx={{ '& .MuiInputLabel-root': { color: '#7A7468' }, '& .MuiOutlinedInput-root': { color: '#23201A', '& fieldset': { borderColor: '#C9C2B0' } } }} />
          </div>
        </DialogContent>
        <DialogActions sx={{ padding: '16px 24px' }}>
          <Button onClick={() => setResolveDialog(false)} sx={{ color: '#7A7468', textTransform: 'none' }}>Hủy</Button>
          <Button variant="contained" onClick={handleResolveIncident} disabled={resolving}
            sx={{ background: '#1F3D2B', color: 'white', textTransform: 'none', fontWeight: 700, '&:hover': { background: '#2d5640' } }}>
            {resolving ? <CircularProgress size={20} sx={{ color: 'white' }} /> : 'Lưu'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Sự cố: chọn Flag (giống form báo cáo sau trận) ── */}
      <Dialog open={incidentDialog} onClose={() => setIncidentDialog(false)} maxWidth="sm" fullWidth
        PaperProps={{ style: { backgroundColor: '#FFFFFF', border: '1px solid #E3DCCB', borderRadius: '16px' } }}>
        <DialogTitle sx={{ color: '#23201A' }}>Xử lý sự cố Flag — {(activeReport?.raceId as any)?.name}</DialogTitle>
        <DialogContent>
          <div className="space-y-3 mt-4">
            <p className="text-sm text-[#7A7468]">Chọn cờ cần xử lý — sau khi lưu sẽ ghi vào báo cáo sau trận.</p>
            {(activeReport?.incidents || []).filter((i) => i.status === 'draft' || !i.status).length === 0 ? (
              <p className="text-sm italic text-[#7A7468]">{EMPTY_NOTE}</p>
            ) : (
              <ul className="space-y-2">
                {(activeReport?.incidents || []).filter((i) => i.status === 'draft' || !i.status).map((inc) => {
                  const horse = incidentHorseName(inc, editRaceRegs);
                  return (
                    <li
                      key={inc._id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[#E3DCCB] bg-white px-3 py-2.5 text-sm"
                    >
                      <div className="min-w-0">
                        <div className="font-medium text-[#23201A]">
                          {horse} · Cờ · Chưa xử lý
                        </div>
                        <div className="text-xs text-[#7A7468] mt-0.5">
                          Gắn cờ trong cuộc đua
                          {inc.flaggedAt ? ` · ${new Date(inc.flaggedAt).toLocaleTimeString('vi-VN')}` : ''}
                        </div>
                      </div>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => {
                          setIncidentDialog(false);
                          openResolveIncident(inc);
                          if (activeReport) {
                            setEditReport(activeReport);
                            setEditDialogPhase('postrace');
                          }
                        }}
                        sx={{ borderColor: '#C9A227', color: '#8F7318', textTransform: 'none', fontSize: '0.75rem' }}
                      >
                        Xử lý
                      </Button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </DialogContent>
        <DialogActions sx={{ padding: '16px 24px' }}>
          <Button onClick={() => setIncidentDialog(false)} sx={{ color: '#7A7468', textTransform: 'none' }}>Đóng</Button>
        </DialogActions>
      </Dialog>
    </AppShell>
  );
}
