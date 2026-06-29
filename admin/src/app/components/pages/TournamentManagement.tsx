import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { Edit, Trash2, Plus, Calendar, Clock, Trophy, Eye, RefreshCw, X, AlertCircle, ChevronLeft, ChevronRight, Search, TrendingUp, Flag } from 'lucide-react';
import { toast } from 'sonner';
import { tournamentApi, type Tournament, type CreateTournamentData } from '../../api/tournament';
import { raceApi, type Race, type CreateRaceData } from '../../api/race';

// ── Helpers ────────────────────────────────────────────────────────────────────

const STATUS_COLOR: Record<string, string> = {
  upcoming: 'bg-blue-100 text-blue-600', ongoing: 'bg-amber-100 text-amber-600',
  finished: 'bg-emerald-100 text-emerald-600', cancelled: 'bg-red-100 text-red-600',
  open: 'bg-blue-100 text-blue-600', closed: 'bg-amber-100 text-amber-600',
  pre_check: 'bg-amber-100 text-amber-600', running: 'bg-emerald-100 text-emerald-600',
  default: 'bg-slate-100 text-slate-600',
};
const STATUS_LABEL: Record<string, string> = {
  upcoming: 'Sắp diễn ra', ongoing: 'Đang diễn ra', finished: 'Đã kết thúc', cancelled: 'Đã hủy',
  open: 'Mở đăng ký', closed: 'Đóng đăng ký', pre_check: 'Kiểm tra', running: 'Đang đua', default: 'N/A',
};
const GRADES = ['Maiden', 'G3', 'G2', 'G1'];
const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString('vi-VN') : '-';
const fmtDateTime = (d: string) => d ? new Date(d).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' }) : '-';

// ── Shared Modal Wrapper ───────────────────────────────────────────────────────

function Modal({ open, onClose, title, children, maxWidth = 'max-w-2xl' }: any) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm transition-all duration-300">
      <div className={`w-full ${maxWidth} rounded-2xl bg-white shadow-2xl dark:bg-[#1c2434] border border-slate-200 dark:border-slate-700 flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200`}>
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/50 px-6 py-5">
          <h3 className="text-xl font-bold text-slate-800 dark:text-white">{title}</h3>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>
        <div className="overflow-y-auto p-6 custom-scrollbar flex-1">
          {children}
        </div>
      </div>
    </div>
  );
}

// ── Tournament Form Dialog ─────────────────────────────────────────────────────

function TournamentDialog({ open, editing, onClose, onSaved }: any) {
  const empty = { name: '', description: '', location: '', startDate: '', endDate: '' };
  const [form, setForm] = useState<typeof empty>(empty);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editing) {
      setForm({
        name: editing.name,
        description: editing.description || '',
        location: editing.location || '',
        startDate: editing.startDate.slice(0, 10),
        endDate: editing.endDate.slice(0, 10),
      });
    } else {
      setForm(empty);
    }
  }, [editing, open]);

  const f = (k: keyof typeof empty) => (e: any) => setForm(prev => ({ ...prev, [k]: e.target.value }));

  const handleSave = async () => {
    if (!form.name || !form.startDate || !form.endDate) {
      toast.error('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await tournamentApi.update(editing._id, form);
        toast.success('Cập nhật giải đấu thành công');
      } else {
        await tournamentApi.create(form as CreateTournamentData);
        toast.success('Tạo giải đấu thành công');
      }
      onSaved();
      onClose();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={editing ? 'Chỉnh sửa giải đấu' : 'Tạo giải đấu mới'} maxWidth="max-w-2xl">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="col-span-1 sm:col-span-2">
          <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">Tên giải đấu <span className="text-red-500">*</span></label>
          <input type="text" value={form.name} onChange={f('name')} className="w-full rounded-xl border border-slate-300 bg-white py-2.5 px-4 text-sm outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-white" />
        </div>
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">Ngày bắt đầu <span className="text-red-500">*</span></label>
          <input type="date" value={form.startDate} onChange={f('startDate')} className="w-full rounded-xl border border-slate-300 bg-white py-2.5 px-4 text-sm outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-white" />
        </div>
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">Ngày kết thúc <span className="text-red-500">*</span></label>
          <input type="date" value={form.endDate} onChange={f('endDate')} className="w-full rounded-xl border border-slate-300 bg-white py-2.5 px-4 text-sm outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-white" />
        </div>
        <div className="col-span-1 sm:col-span-2">
          <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">Địa điểm</label>
          <input type="text" value={form.location} onChange={f('location')} className="w-full rounded-xl border border-slate-300 bg-white py-2.5 px-4 text-sm outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-white" />
        </div>
        <div className="col-span-1 sm:col-span-2">
          <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">Mô tả</label>
          <textarea rows={3} value={form.description} onChange={f('description')} className="w-full rounded-xl border border-slate-300 bg-white py-2.5 px-4 text-sm outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-white"></textarea>
        </div>
      </div>
      <div className="mt-8 flex justify-end gap-3 pt-5 border-t border-slate-100 dark:border-slate-700/50">
        <button onClick={onClose} disabled={saving} className="rounded-xl border border-slate-300 bg-white py-2.5 px-6 font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 disabled:opacity-50 transition-all">Hủy</button>
        <button onClick={handleSave} disabled={saving} className="rounded-xl bg-blue-600 py-2.5 px-6 font-semibold text-white shadow-sm shadow-blue-600/20 hover:bg-blue-700 hover:shadow-blue-600/40 disabled:opacity-50 transition-all flex items-center justify-center min-w-[140px]">
          {saving ? <RefreshCw className="animate-spin" size={18} /> : (editing ? 'Lưu thay đổi' : 'Tạo giải đấu')}
        </button>
      </div>
    </Modal>
  );
}

// ── Race Form Dialog ───────────────────────────────────────────────────────────

const emptyRace = {
  tournamentId: '', name: '', grade: 'Maiden',
  maxCapacity: 12, purse: 0, registrationFee: 0,
  scheduledTime: '', cutoffTime: '', distance: 1600,
};

function RaceDialog({ open, editing, tournaments, onClose, onSaved }: any) {
  const [form, setForm] = useState({ ...emptyRace });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editing) {
      const tid = typeof editing.tournamentId === 'object' ? editing.tournamentId._id : editing.tournamentId;
      setForm({
        tournamentId: tid,
        name: editing.name,
        grade: editing.grade,
        maxCapacity: editing.maxCapacity,
        purse: editing.purse,
        registrationFee: editing.registrationFee,
        scheduledTime: editing.scheduledTime.slice(0, 16),
        cutoffTime: editing.cutoffTime.slice(0, 16),
        distance: editing.distance,
      });
    } else {
      setForm({ ...emptyRace });
    }
  }, [editing, open]);

  const setF = (k: string, v: any) => setForm(prev => ({ ...prev, [k]: v }));

  const handleSave = async () => {
    if (!form.tournamentId || !form.name || !form.scheduledTime || !form.cutoffTime) {
      toast.error('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }
    setSaving(true);
    try {
      const payload: CreateRaceData = {
        ...form,
        purse: Number(form.purse),
        registrationFee: Number(form.registrationFee),
        maxCapacity: Number(form.maxCapacity),
        distance: Number(form.distance),
      };
      if (editing) {
        await raceApi.update(editing._id, payload);
        toast.success('Cập nhật cuộc đua thành công');
      } else {
        await raceApi.create(payload);
        toast.success('Tạo cuộc đua thành công');
      }
      onSaved();
      onClose();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={editing ? 'Chỉnh sửa cuộc đua' : 'Tạo cuộc đua mới'} maxWidth="max-w-3xl">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">Giải đấu <span className="text-red-500">*</span></label>
          <div className="relative z-20 bg-transparent">
            <select value={form.tournamentId} onChange={e => setF('tournamentId', e.target.value)} className="relative z-20 w-full appearance-none rounded-xl border border-slate-300 bg-white py-2.5 px-4 text-sm outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-white">
              <option value="">-- Chọn giải đấu --</option>
              {tournaments.map((t: any) => <option key={t._id} value={t._id}>{t.name}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">Hạng <span className="text-red-500">*</span></label>
          <div className="relative z-20 bg-transparent">
            <select value={form.grade} onChange={e => setF('grade', e.target.value)} className="relative z-20 w-full appearance-none rounded-xl border border-slate-300 bg-white py-2.5 px-4 text-sm outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-white">
              {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
        </div>
        <div className="col-span-1 sm:col-span-2">
          <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">Tên cuộc đua <span className="text-red-500">*</span></label>
          <input type="text" value={form.name} onChange={e => setF('name', e.target.value)} className="w-full rounded-xl border border-slate-300 bg-white py-2.5 px-4 text-sm outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-white" />
        </div>
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">Thời gian đua <span className="text-red-500">*</span></label>
          <input type="datetime-local" value={form.scheduledTime} onChange={e => setF('scheduledTime', e.target.value)} className="w-full rounded-xl border border-slate-300 bg-white py-2.5 px-4 text-sm outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-white" />
        </div>
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">Hạn đăng ký <span className="text-red-500">*</span></label>
          <input type="datetime-local" value={form.cutoffTime} onChange={e => setF('cutoffTime', e.target.value)} className="w-full rounded-xl border border-slate-300 bg-white py-2.5 px-4 text-sm outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-white" />
          <p className="mt-1 text-xs text-slate-500">Ít nhất 48h trước giờ đua</p>
        </div>
        
        <div className="grid grid-cols-2 gap-5 sm:col-span-2 sm:grid-cols-4">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">Cự ly (m)</label>
            <input type="number" value={form.distance} onChange={e => setF('distance', e.target.value)} className="w-full rounded-xl border border-slate-300 bg-white py-2.5 px-4 text-sm outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-white" />
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">Sức chứa</label>
            <input type="number" value={form.maxCapacity} onChange={e => setF('maxCapacity', e.target.value)} className="w-full rounded-xl border border-slate-300 bg-white py-2.5 px-4 text-sm outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-white" />
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">Thưởng ($)</label>
            <input type="number" value={form.purse} onChange={e => setF('purse', e.target.value)} className="w-full rounded-xl border border-slate-300 bg-white py-2.5 px-4 text-sm outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-white" />
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">Phí ĐK ($)</label>
            <input type="number" value={form.registrationFee} onChange={e => setF('registrationFee', e.target.value)} className="w-full rounded-xl border border-slate-300 bg-white py-2.5 px-4 text-sm outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-white" />
          </div>
        </div>
      </div>
      <div className="mt-8 flex justify-end gap-3 pt-5 border-t border-slate-100 dark:border-slate-700/50">
        <button onClick={onClose} disabled={saving} className="rounded-xl border border-slate-300 bg-white py-2.5 px-6 font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 disabled:opacity-50 transition-all">Hủy</button>
        <button onClick={handleSave} disabled={saving} className="rounded-xl bg-blue-600 py-2.5 px-6 font-semibold text-white shadow-sm shadow-blue-600/20 hover:bg-blue-700 hover:shadow-blue-600/40 disabled:opacity-50 transition-all flex items-center justify-center min-w-[140px]">
          {saving ? <RefreshCw className="animate-spin" size={18} /> : (editing ? 'Lưu thay đổi' : 'Tạo cuộc đua')}
        </button>
      </div>
    </Modal>
  );
}

// ── Status Change Dialog ───────────────────────────────────────────────────────

function StatusDialog({ open, race, onClose, onSaved }: any) {
  const [saving, setSaving] = useState(false);

  const nextStatus = race?.status === 'open' ? 'closed' : race?.status === 'closed' ? 'pre_check' : null;

  const handleConfirm = async () => {
    if (!race || !nextStatus) return;
    setSaving(true);
    try {
      await raceApi.updateStatus(race._id, nextStatus as 'closed' | 'pre_check');
      toast.success(`Chuyển trạng thái thành công: ${STATUS_LABEL[nextStatus]}`);
      onSaved();
      onClose();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Chuyển trạng thái cuộc đua" maxWidth="max-w-sm">
      <div className="mb-6">
        <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-center">
          Bạn có chắc muốn chuyển <b>{race?.name}</b> từ <br className="mb-2"/>
          <span className={`inline-block rounded px-2.5 py-0.5 text-xs font-medium mt-2 mx-1 ${STATUS_COLOR[race?.status || 'default']}`}>
            {STATUS_LABEL[race?.status || 'default']}
          </span> 
          sang 
          <span className={`inline-block rounded px-2.5 py-0.5 text-xs font-medium mt-2 mx-1 ${STATUS_COLOR[nextStatus || 'default']}`}>
            {STATUS_LABEL[nextStatus || 'default']}
          </span>?
        </p>
      </div>
      <div className="flex justify-center gap-3">
        <button onClick={onClose} disabled={saving} className="rounded border border-slate-300 py-2 px-6 font-medium text-black hover:bg-slate-50 dark:border-slate-600 dark:text-white dark:hover:bg-slate-800 disabled:opacity-50 transition">Hủy</button>
        <button onClick={handleConfirm} disabled={saving || !nextStatus} className="rounded bg-amber-500 py-2 px-6 font-medium text-white hover:bg-amber-600 disabled:opacity-50 transition flex items-center justify-center min-w-[120px]">
          {saving ? <RefreshCw className="animate-spin" size={20} /> : 'Xác nhận'}
        </button>
      </div>
    </Modal>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function TournamentManagement() {
  const navigate = useNavigate();
  const [tab, setTab] = useState(0);

  // Tournaments
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loadingT, setLoadingT] = useState(true);
  const [tDialog, setTDialog] = useState(false);
  const [editingT, setEditingT] = useState<Tournament | null>(null);
  const [tSearch, setTSearch] = useState('');
  const [tSort, setTSort] = useState<'newest' | 'oldest' | 'status'>('newest');

  // Races
  const [races, setRaces] = useState<Race[]>([]);
  const [loadingR, setLoadingR] = useState(false);
  const [rDialog, setRDialog] = useState(false);
  const [editingR, setEditingR] = useState<Race | null>(null);
  const [statusDialog, setStatusDialog] = useState(false);
  const [statusRace, setStatusRace] = useState<Race | null>(null);
  const [filterTournament, setFilterTournament] = useState('');
  const [rSearch, setRSearch] = useState('');

  // Pagination
  const [tPage, setTPage] = useState(1);
  const [rPage, setRPage] = useState(1);
  const T_PER_PAGE = 6;
  const R_PER_PAGE = 10;

  const STATUS_SORT_ORDER: Record<string, number> = { ongoing: 0, upcoming: 1, finished: 2, cancelled: 3 };

  const filteredTournaments = tSearch
    ? tournaments.filter(t =>
        t.name.toLowerCase().includes(tSearch.toLowerCase()) ||
        (t.location || '').toLowerCase().includes(tSearch.toLowerCase())
      )
    : tournaments;

  const sortedTournaments = [...filteredTournaments].sort((a, b) => {
    if (tSort === 'status') {
      const diff = (STATUS_SORT_ORDER[a.status] ?? 99) - (STATUS_SORT_ORDER[b.status] ?? 99);
      if (diff !== 0) return diff;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    if (tSort === 'oldest') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const pagedTournaments = sortedTournaments.slice((tPage - 1) * T_PER_PAGE, tPage * T_PER_PAGE);
  const tTotalPages = Math.ceil(sortedTournaments.length / T_PER_PAGE);

  const filteredRaces = rSearch
    ? races.filter(r =>
        r.name.toLowerCase().includes(rSearch.toLowerCase()) ||
        r.grade.toLowerCase().includes(rSearch.toLowerCase()) ||
        (typeof r.tournamentId === 'object' && r.tournamentId.name.toLowerCase().includes(rSearch.toLowerCase()))
      )
    : races;
  const pagedRaces = filteredRaces.slice((rPage - 1) * R_PER_PAGE, rPage * R_PER_PAGE);
  const rTotalPages = Math.ceil(filteredRaces.length / R_PER_PAGE);

  const loadTournaments = useCallback(async () => {
    setLoadingT(true);
    try {
      const res = await tournamentApi.list(1, 100);
      setTournaments(res.tournaments);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoadingT(false);
    }
  }, []);

  const loadRaces = useCallback(async () => {
    setLoadingR(true);
    try {
      const res = await raceApi.list({ tournamentId: filterTournament || undefined, limit: 100 });
      setRaces(res.races);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoadingR(false);
    }
  }, [filterTournament]);

  useEffect(() => { loadTournaments(); }, [loadTournaments]);
  useEffect(() => { if (tab === 1) loadRaces(); }, [tab, loadRaces]);

  const handleDeleteTournament = async (t: Tournament) => {
    if (!confirm(`Xóa giải đấu "${t.name}"?`)) return;
    try {
      await tournamentApi.delete(t._id);
      toast.success('Đã xóa giải đấu');
      loadTournaments();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleCancelRace = async (r: Race) => {
    if (!confirm(`Hủy cuộc đua "${r.name}"? Tất cả phí đăng ký sẽ được hoàn trả 100%.`)) return;
    try {
      await raceApi.cancel(r._id);
      toast.success('Đã hủy cuộc đua và hoàn phí');
      loadRaces();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const ongoingCount = tournaments.filter(t => t.status === 'ongoing').length;
  const upcomingCount = tournaments.filter(t => t.status === 'upcoming').length;
  const raceCount = loadingR && races.length === 0 ? null : races.length;

  return (
    <>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-title-md2 font-semibold text-black dark:text-white">Quản lý giải đấu</h2>
        <button
          onClick={() => { setEditingT(null); setTDialog(true); }}
          className="inline-flex items-center justify-center gap-2.5 rounded-md bg-blue-600 py-2 px-4 text-center font-medium text-white hover:bg-blue-700 transition"
        >
          <Plus size={20} />
          Tạo giải đấu mới
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 xl:gap-6 mb-8">
        {/* Card 1 — Tổng giải đấu */}
        <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md dark:border-slate-700 dark:bg-gradient-to-b dark:from-[#1c2434] dark:to-[#111827]">
          <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-amber-500/10 blur-2xl transition-all group-hover:bg-amber-500/20"></div>
          <div className="flex items-start justify-between mb-4 relative z-10">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-100 to-amber-50 text-amber-500 shadow-sm dark:from-amber-900/40 dark:to-amber-800/20">
              <Trophy size={24} className="drop-shadow-sm" />
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-600 border border-amber-100/50 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800/30">
              <TrendingUp size={12} />
              Hệ thống
            </span>
          </div>
          <p className="text-3xl font-bold text-slate-800 dark:text-white mb-1 relative z-10">
            {loadingT ? <span className="text-slate-400 text-xl animate-pulse">...</span> : tournaments.length}
          </p>
          <p className="text-sm font-semibold text-slate-600 dark:text-slate-300 relative z-10">Tổng giải đấu</p>
          <p className="text-xs text-slate-400 mt-1 relative z-10">tất cả giải đấu trong hệ thống</p>
        </div>

        {/* Card 2 — Đang diễn ra */}
        <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md dark:border-slate-700 dark:bg-gradient-to-b dark:from-[#1c2434] dark:to-[#111827]">
          <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-emerald-500/10 blur-2xl transition-all group-hover:bg-emerald-500/20"></div>
          <div className="flex items-start justify-between mb-4 relative z-10">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-100 to-emerald-50 text-emerald-500 shadow-sm dark:from-emerald-900/40 dark:to-emerald-800/20">
              <Flag size={24} className="drop-shadow-sm" />
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-600 border border-emerald-100/50 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800/30">
              <TrendingUp size={12} />
              Đang hoạt động
            </span>
          </div>
          <p className="text-3xl font-bold text-slate-800 dark:text-white mb-1 relative z-10">
            {loadingT ? <span className="text-slate-400 text-xl animate-pulse">...</span> : ongoingCount}
          </p>
          <p className="text-sm font-semibold text-slate-600 dark:text-slate-300 relative z-10">Giải đang diễn ra</p>
          <p className="text-xs text-slate-400 mt-1 relative z-10">đang trong giai đoạn thi đấu</p>
        </div>

        {/* Card 3 — Sắp diễn ra */}
        <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md dark:border-slate-700 dark:bg-gradient-to-b dark:from-[#1c2434] dark:to-[#111827]">
          <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-blue-500/10 blur-2xl transition-all group-hover:bg-blue-500/20"></div>
          <div className="flex items-start justify-between mb-4 relative z-10">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-100 to-blue-50 text-blue-500 shadow-sm dark:from-blue-900/40 dark:to-blue-800/20">
              <Calendar size={24} className="drop-shadow-sm" />
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-600 border border-blue-100/50 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800/30">
              <TrendingUp size={12} />
              Sắp diễn ra
            </span>
          </div>
          <p className="text-3xl font-bold text-slate-800 dark:text-white mb-1 relative z-10">
            {loadingT ? <span className="text-slate-400 text-xl animate-pulse">...</span> : upcomingCount}
          </p>
          <p className="text-sm font-semibold text-slate-600 dark:text-slate-300 relative z-10">Giải sắp diễn ra</p>
          <p className="text-xs text-slate-400 mt-1 relative z-10">chưa bắt đầu thi đấu</p>
        </div>

        {/* Card 4 — Tổng cuộc đua */}
        <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md dark:border-slate-700 dark:bg-gradient-to-b dark:from-[#1c2434] dark:to-[#111827]">
          <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-purple-500/10 blur-2xl transition-all group-hover:bg-purple-500/20"></div>
          <div className="flex items-start justify-between mb-4 relative z-10">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-100 to-purple-50 text-purple-500 shadow-sm dark:from-purple-900/40 dark:to-purple-800/20">
              <Clock size={24} className="drop-shadow-sm" />
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2.5 py-1 text-xs font-medium text-purple-600 border border-purple-100/50 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800/30">
              <TrendingUp size={12} />
              Lịch thi đấu
            </span>
          </div>
          <p className="text-3xl font-bold text-slate-800 dark:text-white mb-1 relative z-10">
            {raceCount === null ? <span className="text-slate-400 text-xl animate-pulse">...</span> : raceCount}
          </p>
          <p className="text-sm font-semibold text-slate-600 dark:text-slate-300 relative z-10">Tổng cuộc đua</p>
          <p className="text-xs text-slate-400 mt-1 relative z-10">tổng số race trong hệ thống</p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-[#1c2434] mb-6 overflow-hidden">
        <div className="flex border-b border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setTab(0)}
            className={`flex items-center gap-2 py-4 px-6 text-sm font-medium transition-colors ${tab === 0 ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-500 bg-blue-50/50 dark:bg-blue-900/10' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'}`}
          >
            <Trophy size={18} />
            Giải đấu
          </button>
          <button
            onClick={() => setTab(1)}
            className={`flex items-center gap-2 py-4 px-6 text-sm font-medium transition-colors ${tab === 1 ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-500 bg-blue-50/50 dark:bg-blue-900/10' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'}`}
          >
            <Calendar size={18} />
            Lịch thi đấu (Cuộc đua)
          </button>
        </div>

        <div className="p-4 sm:p-6 lg:p-8">
          {/* ── Tab 0: Tournaments ── */}
          {tab === 0 && (
            <div>
              {/* Search & Sort */}
              <div className="mb-5 flex flex-col sm:flex-row gap-3">
                <div className="relative w-full max-w-sm">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Tìm giải đấu, địa điểm..."
                    value={tSearch}
                    onChange={e => { setTSearch(e.target.value); setTPage(1); }}
                    className="w-full rounded border border-slate-300 bg-transparent py-2 pl-9 pr-4 text-sm outline-none focus:border-blue-500 dark:border-slate-600 dark:bg-slate-800/50 dark:text-white"
                  />
                </div>
                <select
                  value={tSort}
                  onChange={e => { setTSort(e.target.value as typeof tSort); setTPage(1); }}
                  className="rounded border border-slate-300 bg-transparent py-2 px-3 text-sm outline-none focus:border-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                >
                  <option value="newest">Mới nhất</option>
                  <option value="oldest">Cũ nhất</option>
                  <option value="status">Theo trạng thái</option>
                </select>
              </div>
              {loadingT ? (
                <div className="flex justify-center py-12"><RefreshCw className="animate-spin text-blue-500" size={32} /></div>
              ) : tournaments.length === 0 ? (
                <div className="text-center py-12">
                  <div className="mx-auto h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 dark:bg-slate-800"><Trophy className="text-slate-400" size={32} /></div>
                  <h4 className="text-lg font-medium text-slate-700 dark:text-slate-300">Chưa có giải đấu nào</h4>
                  <p className="mt-1 text-sm text-slate-500">Tạo giải đấu đầu tiên của bạn để bắt đầu.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  {pagedTournaments.map((t) => (
                    <div key={t._id} className="group relative rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-lg hover:border-blue-300 dark:border-slate-700 dark:bg-gradient-to-b dark:from-[#243045] dark:to-[#1c2434] dark:hover:border-blue-500/50">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/5 to-purple-500/5 rounded-bl-full -z-10 group-hover:from-blue-500/10 group-hover:to-purple-500/10 transition-all"></div>
                      <div className="flex justify-between items-start mb-5">
                        <div className="pr-20">
                          <h4 className="text-xl font-bold text-slate-800 dark:text-white mb-2.5 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{t.name}</h4>
                          <div className="flex flex-wrap gap-2">
                            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider ${STATUS_COLOR[t.status] || STATUS_COLOR.default} bg-opacity-10`}>
                              <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                              {STATUS_LABEL[t.status] || t.status}
                            </span>
                            {!t.isActive && <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold bg-red-50 text-red-600 border border-red-100 dark:bg-red-900/20 dark:border-red-800/30 uppercase tracking-wider">Không HĐ</span>}
                          </div>
                        </div>
                        <div className="absolute top-6 right-6 flex items-center gap-2 opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                          <button onClick={() => { setEditingT(t); setTDialog(true); }} className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-slate-400 shadow-sm border border-slate-200 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50 dark:bg-slate-800 dark:border-slate-600 dark:hover:bg-slate-700 transition-colors" title="Chỉnh sửa">
                            <Edit size={14} />
                          </button>
                          <button onClick={() => handleDeleteTournament(t)} className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-slate-400 shadow-sm border border-slate-200 hover:text-red-600 hover:border-red-300 hover:bg-red-50 dark:bg-slate-800 dark:border-slate-600 dark:hover:bg-slate-700 transition-colors" title="Xóa">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                      
                      <div className="flex flex-col gap-3 mt-4">
                        <div className="flex items-center gap-3 text-sm font-medium text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-lg border border-slate-100 dark:border-slate-700/50">
                          <Calendar size={18} className="text-blue-500" />
                          <span>{fmtDate(t.startDate)} <span className="text-slate-400 mx-1">→</span> {fmtDate(t.endDate)}</span>
                        </div>
                        {t.location && (
                          <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-lg border border-slate-100 dark:border-slate-700/50">
                            <svg className="w-[18px] h-[18px] text-amber-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                            <span className="font-medium truncate">{t.location}</span>
                          </div>
                        )}
                        {t.description && (
                          <div className="mt-2 text-sm text-slate-500 leading-relaxed italic border-l-2 border-blue-200 pl-3 dark:border-blue-900/50 line-clamp-2">
                            "{t.description}"
                          </div>
                        )}
                      </div>
                      
                      <button 
                        onClick={() => { setFilterTournament(t._id); setTab(1); }}
                        className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-50 py-3 text-sm font-semibold text-slate-700 transition-all hover:bg-blue-600 hover:text-white dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-blue-600"
                      >
                        <Eye size={16} /> Quản lý các cuộc đua
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {/* Tournament list pagination */}
              {tTotalPages > 1 && (
                <div className="flex items-center justify-between pt-5 mt-5 border-t border-slate-200 dark:border-slate-700">
                  <button
                    onClick={() => setTPage(p => Math.max(1, p - 1))}
                    disabled={tPage === 1}
                    className="flex items-center gap-1.5 rounded bg-slate-100 py-1.5 px-3 text-sm font-medium text-slate-600 hover:bg-slate-200 disabled:opacity-40 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition"
                  >
                    <ChevronLeft size={15} /> Trước
                  </button>
                  <span className="text-sm text-slate-500">Trang {tPage} / {tTotalPages} <span className="text-xs text-slate-400">(tổng {sortedTournaments.length})</span></span>
                  <button
                    onClick={() => setTPage(p => Math.min(tTotalPages, p + 1))}
                    disabled={tPage >= tTotalPages}
                    className="flex items-center gap-1.5 rounded bg-slate-100 py-1.5 px-3 text-sm font-medium text-slate-600 hover:bg-slate-200 disabled:opacity-40 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition"
                  >
                    Sau <ChevronRight size={15} />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── Tab 1: Races ── */}
          {tab === 1 && (
            <div>
              <div className="mb-6 flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center flex-1">
                    <div className="relative min-w-[240px]">
                      <select value={filterTournament} onChange={e => { setFilterTournament(e.target.value); setRPage(1); }} className="w-full appearance-none rounded-xl border border-slate-300 bg-white py-2.5 px-4 outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-white">
                        <option value="">-- Tất cả giải đấu --</option>
                        {tournaments.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
                      </select>
                    </div>
                    <div className="relative w-full sm:w-auto sm:min-w-[280px]">
                      <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Tìm tên cuộc đua, hạng..."
                        value={rSearch}
                        onChange={e => { setRSearch(e.target.value); setRPage(1); }}
                        className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                      />
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={loadRaces} disabled={loadingR} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white py-2.5 px-4 text-center font-medium text-slate-700 shadow-sm hover:bg-slate-50 hover:text-blue-600 transition-all dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700">
                      <RefreshCw size={18} className={loadingR ? 'animate-spin' : ''} /> <span className="hidden sm:inline">Làm mới</span>
                    </button>
                    <button onClick={() => { setEditingR(null); setRDialog(true); }} className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 px-5 text-center font-semibold text-white shadow-sm shadow-blue-600/20 hover:bg-blue-700 hover:shadow-blue-600/40 transition-all">
                      <Plus size={18} /> Thêm cuộc đua
                    </button>
                  </div>
                </div>
              </div>

              {loadingR ? (
                <div className="flex justify-center py-12"><RefreshCw className="animate-spin text-blue-500" size={32} /></div>
              ) : (
                <div className="max-w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-[#1c2434]">
                  <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full table-auto">
                      <thead>
                        <tr className="bg-slate-50/80 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:bg-slate-800/80 dark:text-slate-400">
                          <th className="py-4 px-4 border-b border-slate-200 dark:border-slate-700 xl:pl-6">Tên cuộc đua</th>
                          <th className="py-4 px-4 border-b border-slate-200 dark:border-slate-700">Giải đấu</th>
                          <th className="py-4 px-4 border-b border-slate-200 dark:border-slate-700">Hạng</th>
                          <th className="py-4 px-4 border-b border-slate-200 dark:border-slate-700">Thời gian</th>
                          <th className="py-4 px-4 border-b border-slate-200 dark:border-slate-700">Cự ly</th>
                          <th className="py-4 px-4 border-b border-slate-200 dark:border-slate-700">Trọng tài</th>
                          <th className="py-4 px-4 border-b border-slate-200 dark:border-slate-700 text-center">Trạng thái</th>
                          <th className="py-4 px-4 border-b border-slate-200 dark:border-slate-700 text-right xl:pr-6">Hành động</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredRaces.length === 0 ? (
                          <tr><td colSpan={8} className="text-center py-12 text-slate-500">{races.length === 0 ? 'Chưa có cuộc đua nào' : 'Không tìm thấy cuộc đua phù hợp'}</td></tr>
                        ) : pagedRaces.map((r) => {
                          const tName = typeof r.tournamentId === 'object' ? r.tournamentId.name : '-';
                          const canChangeStatus = ['open', 'closed'].includes(r.status);
                          const canEdit = !['running', 'finished', 'cancelled'].includes(r.status);
                          const canCancel = !['running', 'finished', 'cancelled'].includes(r.status);
                          return (
                            <tr key={r._id} className="group border-b border-slate-200/60 dark:border-slate-700/60 hover:bg-blue-50/30 dark:hover:bg-slate-800/50 transition-colors last:border-0">
                              <td className="py-4 px-4 xl:pl-6"><p className="font-semibold text-slate-800 dark:text-white">{r.name}</p></td>
                              <td className="py-4 px-4"><p className="text-sm font-medium text-slate-600 dark:text-slate-300">{tName}</p></td>
                              <td className="py-4 px-4"><span className="inline-flex items-center rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-600 shadow-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300">{r.grade}</span></td>
                              <td className="py-4 px-4">
                                <div className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300">
                                  <Clock size={14} className="text-slate-400" /> {fmtDateTime(r.scheduledTime)}
                                </div>
                              </td>
                              <td className="py-4 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">{r.distance}m</td>
                              <td className="py-4 px-4">
                                {typeof r.refereeId === 'object' && r.refereeId
                                  ? <div className="flex items-center gap-2"><div className="h-6 w-6 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-500">{r.refereeId.fullName.charAt(0)}</div><p className="text-sm font-medium text-slate-700 dark:text-white">{r.refereeId.fullName}</p></div>
                                  : <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold bg-amber-50 text-amber-600 border border-amber-200/60 dark:bg-amber-900/30 dark:text-amber-400">Chưa PT</span>}
                              </td>
                              <td className="py-4 px-4 text-center">
                                <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${STATUS_COLOR[r.status] || STATUS_COLOR.default} bg-opacity-10 border border-current border-opacity-20`}>
                                  <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                                  {STATUS_LABEL[r.status] || r.status}
                                </span>
                              </td>
                              <td className="py-4 px-4 text-right xl:pr-6">
                                <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button onClick={() => navigate('/results', { state: { openRaceId: r._id } })} className="flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-600 shadow-sm hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-blue-900/30 dark:hover:text-blue-400 transition-all">
                                    <Eye size={14} /> Xem
                                  </button>
                                  {canChangeStatus && (
                                    <button onClick={() => { setStatusRace(r); setStatusDialog(true); }} className="flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-600 shadow-sm hover:border-amber-300 hover:bg-amber-50 hover:text-amber-600 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-amber-900/30 dark:hover:text-amber-400 transition-all" title="Đổi trạng thái">
                                      <RefreshCw size={14} /> TT
                                    </button>
                                  )}
                                  {canEdit && (
                                    <button onClick={() => { setEditingR(r); setRDialog(true); }} className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 shadow-sm hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 dark:border-slate-600 dark:bg-slate-800 dark:hover:bg-slate-700 transition-all" title="Sửa">
                                      <Edit size={14} />
                                    </button>
                                  )}
                                  {canCancel && (
                                    <button onClick={() => handleCancelRace(r)} className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 shadow-sm hover:border-red-300 hover:bg-red-50 hover:text-red-600 dark:border-slate-600 dark:bg-slate-800 dark:hover:bg-slate-700 transition-all" title="Hủy">
                                      <Trash2 size={14} />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              {/* Race list pagination */}
              {rTotalPages > 1 && (
                <div className="flex items-center justify-between pt-4 mt-1 border-t border-slate-200 dark:border-slate-700">
                  <button
                    onClick={() => setRPage(p => Math.max(1, p - 1))}
                    disabled={rPage === 1}
                    className="flex items-center gap-1.5 rounded bg-slate-100 py-1.5 px-3 text-sm font-medium text-slate-600 hover:bg-slate-200 disabled:opacity-40 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition"
                  >
                    <ChevronLeft size={15} /> Trước
                  </button>
                  <span className="text-sm text-slate-500">Trang {rPage} / {rTotalPages} <span className="text-xs text-slate-400">(tổng {races.length} cuộc đua)</span></span>
                  <button
                    onClick={() => setRPage(p => Math.min(rTotalPages, p + 1))}
                    disabled={rPage >= rTotalPages}
                    className="flex items-center gap-1.5 rounded bg-slate-100 py-1.5 px-3 text-sm font-medium text-slate-600 hover:bg-slate-200 disabled:opacity-40 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition"
                  >
                    Sau <ChevronRight size={15} />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <TournamentDialog open={tDialog} editing={editingT} onClose={() => setTDialog(false)} onSaved={loadTournaments} />
      <RaceDialog open={rDialog} editing={editingR} tournaments={tournaments} onClose={() => setRDialog(false)} onSaved={loadRaces} />
      <StatusDialog open={statusDialog} race={statusRace} onClose={() => setStatusDialog(false)} onSaved={loadRaces} />
    </>
  );
}
