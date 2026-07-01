import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router';
import { Edit, Trash2, Plus, Calendar, Clock, Trophy, Eye, RefreshCw, X, AlertCircle, ChevronLeft, ChevronRight, Search, TrendingUp, Flag, MoreHorizontal } from 'lucide-react';
import { toast } from 'sonner';
import { tournamentApi, type Tournament, type CreateTournamentData } from '../../api/tournament';
import { raceApi, type Race, type CreateRaceData } from '../../api/race';

// ── Helpers ────────────────────────────────────────────────────────────────────

const STATUS_COLOR: Record<string, string> = {
  upcoming: 'bg-blue-50 text-blue-700 border border-blue-200', 
  ongoing: 'bg-amber-50 text-amber-700 border border-amber-200',
  finished: 'bg-emerald-50 text-emerald-700 border border-emerald-200', 
  cancelled: 'bg-red-50 text-red-700 border border-red-200',
  open: 'bg-blue-50 text-blue-700 border border-blue-200', 
  closed: 'bg-amber-50 text-amber-700 border border-amber-200',
  pre_check: 'bg-amber-50 text-amber-700 border border-amber-200', 
  running: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  default: 'bg-slate-50 text-slate-700 border border-slate-200',
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
      <div className={`w-full ${maxWidth} rounded-xl bg-white shadow-2xl flex flex-col max-h-[90vh] overflow-hidden`}>
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-50">
          <h3 className="text-lg font-bold text-slate-900">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition rounded-md hover:bg-slate-200 p-1">
            <X size={20} />
          </button>
        </div>
        <div className="overflow-y-auto custom-scrollbar flex-1 p-6 pb-2">
          {children}
        </div>
      </div>
    </div>
  );
}

// ── Dropdown Menu (Custom minimal) ───────────────────────────────────────────
function ActionMenu({ items }: { items: { label: string; icon: any; onClick: () => void; disabled?: boolean; danger?: boolean; hidden?: boolean }[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const visibleItems = items.filter(i => !i.hidden);
  if (visibleItems.length === 0) return null;

  return (
    <div className="relative inline-block text-left" ref={ref}>
      <button 
        onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
        className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
      >
        <MoreHorizontal size={18} />
      </button>
      {open && (
        <div className="absolute right-0 mt-1 w-44 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-10 border border-slate-100 py-1">
          {visibleItems.map((item, idx) => {
            const Icon = item.icon;
            return (
              <button
                key={idx}
                onClick={(e) => { e.stopPropagation(); setOpen(false); item.onClick(); }}
                disabled={item.disabled}
                className={`group flex w-full items-center px-4 py-2 text-sm ${item.danger ? 'text-red-600 hover:bg-red-50' : 'text-slate-700 hover:bg-slate-50 hover:text-blue-600'} disabled:opacity-50`}
              >
                <Icon className={`mr-2 h-4 w-4 ${item.danger ? 'text-red-500' : 'text-slate-400 group-hover:text-blue-600'}`} />
                {item.label}
              </button>
            );
          })}
        </div>
      )}
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
      <div className="mb-6">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Thông tin chung</h4>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="col-span-1 sm:col-span-2">
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">Tên giải đấu <span className="text-red-500">*</span></label>
            <input type="text" value={form.name} onChange={f('name')} placeholder="Ví dụ: Cúp Mùa Xuân 2026" className="w-full rounded-md border border-slate-300 bg-white py-2 px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">Ngày bắt đầu <span className="text-red-500">*</span></label>
            <input type="date" value={form.startDate} onChange={f('startDate')} className="w-full rounded-md border border-slate-300 bg-white py-2 px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">Ngày kết thúc <span className="text-red-500">*</span></label>
            <input type="date" value={form.endDate} onChange={f('endDate')} className="w-full rounded-md border border-slate-300 bg-white py-2 px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm" />
          </div>
          <div className="col-span-1 sm:col-span-2">
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">Địa điểm</label>
            <input type="text" value={form.location} onChange={f('location')} placeholder="Nhập địa điểm tổ chức" className="w-full rounded-md border border-slate-300 bg-white py-2 px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm" />
          </div>
          <div className="col-span-1 sm:col-span-2">
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">Mô tả chi tiết</label>
            <textarea rows={3} value={form.description} onChange={f('description')} placeholder="Mô tả ngắn gọn về giải đấu" className="w-full rounded-md border border-slate-300 bg-white py-2 px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm"></textarea>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4 -mx-6 mt-6 rounded-b-xl">
        <button onClick={onClose} disabled={saving} className="rounded-md border border-slate-300 bg-white py-2 px-4 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50 transition">Hủy bỏ</button>
        <button onClick={handleSave} disabled={saving} className="rounded-md bg-blue-600 py-2 px-5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 transition flex items-center justify-center min-w-[120px]">
          {saving ? <RefreshCw className="animate-spin mr-2" size={16} /> : (editing ? 'Lưu thay đổi' : 'Tạo giải đấu')}
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
      <div className="mb-6">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Thông tin cơ bản</h4>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">Thuộc Giải đấu <span className="text-red-500">*</span></label>
            <select value={form.tournamentId} onChange={e => setF('tournamentId', e.target.value)} className="w-full appearance-none rounded-md border border-slate-300 bg-white py-2 px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm">
              <option value="">-- Chọn giải đấu --</option>
              {tournaments.map((t: any) => <option key={t._id} value={t._id}>{t.name}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">Hạng đua <span className="text-red-500">*</span></label>
            <select value={form.grade} onChange={e => setF('grade', e.target.value)} className="w-full appearance-none rounded-md border border-slate-300 bg-white py-2 px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm">
              {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div className="col-span-1 sm:col-span-2">
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">Tên chặng đua <span className="text-red-500">*</span></label>
            <input type="text" value={form.name} onChange={e => setF('name', e.target.value)} placeholder="Ví dụ: Chặng 1 - Khởi Động" className="w-full rounded-md border border-slate-300 bg-white py-2 px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm" />
          </div>
        </div>
      </div>

      <div className="mb-6">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Lịch trình & Kỹ thuật</h4>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">Thời gian bắt đầu đua <span className="text-red-500">*</span></label>
            <input type="datetime-local" value={form.scheduledTime} onChange={e => setF('scheduledTime', e.target.value)} className="w-full rounded-md border border-slate-300 bg-white py-2 px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">Hạn chót đăng ký <span className="text-red-500">*</span></label>
            <input type="datetime-local" value={form.cutoffTime} onChange={e => setF('cutoffTime', e.target.value)} className="w-full rounded-md border border-slate-300 bg-white py-2 px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm" />
            <p className="mt-1 text-[10px] text-slate-500">Nên thiết lập trước ít nhất 48h</p>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Thông số & Tài chính</h4>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">Cự ly (m)</label>
            <input type="number" value={form.distance} onChange={e => setF('distance', e.target.value)} className="w-full rounded-md border border-slate-300 bg-white py-2 px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">Số lượng</label>
            <input type="number" value={form.maxCapacity} onChange={e => setF('maxCapacity', e.target.value)} className="w-full rounded-md border border-slate-300 bg-white py-2 px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">Thưởng ($)</label>
            <input type="number" value={form.purse} onChange={e => setF('purse', e.target.value)} className="w-full rounded-md border border-slate-300 bg-white py-2 px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">Phí ĐK ($)</label>
            <input type="number" value={form.registrationFee} onChange={e => setF('registrationFee', e.target.value)} className="w-full rounded-md border border-slate-300 bg-white py-2 px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm" />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4 -mx-6 mt-6 rounded-b-xl">
        <button onClick={onClose} disabled={saving} className="rounded-md border border-slate-300 bg-white py-2 px-4 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50 transition">Hủy bỏ</button>
        <button onClick={handleSave} disabled={saving} className="rounded-md bg-blue-600 py-2 px-5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 transition flex items-center justify-center min-w-[120px]">
          {saving ? <RefreshCw className="animate-spin mr-2" size={16} /> : (editing ? 'Lưu thay đổi' : 'Tạo cuộc đua')}
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
    <Modal open={open} onClose={onClose} title="Cập nhật trạng thái chặng đua" maxWidth="max-w-md">
      <div className="mb-6 mt-2">
        <p className="text-slate-600 text-sm leading-relaxed text-center bg-slate-50 p-4 rounded-lg border border-slate-100">
          Bạn đang chuyển trạng thái của <b>{race?.name}</b> từ <br className="mb-2"/>
          <span className={`inline-block rounded px-2.5 py-0.5 text-xs font-bold mt-2 mx-1 ${STATUS_COLOR[race?.status || 'default']}`}>
            {STATUS_LABEL[race?.status || 'default']}
          </span> 
          sang 
          <span className={`inline-block rounded px-2.5 py-0.5 text-xs font-bold mt-2 mx-1 ${STATUS_COLOR[nextStatus || 'default']}`}>
            {STATUS_LABEL[nextStatus || 'default']}
          </span>
        </p>
      </div>
      <div className="flex justify-between gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4 -mx-6 mt-6 rounded-b-xl">
        <button onClick={onClose} disabled={saving} className="rounded-md border border-slate-300 bg-white py-2 px-4 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50 transition">Hủy bỏ</button>
        <button onClick={handleConfirm} disabled={saving || !nextStatus} className="rounded-md bg-amber-500 py-2 px-5 text-sm font-semibold text-white hover:bg-amber-600 shadow-sm disabled:opacity-50 transition flex items-center justify-center min-w-[120px]">
          {saving ? <RefreshCw className="animate-spin mr-2" size={16} /> : 'Xác nhận chuyển'}
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
  const T_PER_PAGE = 8;
  const R_PER_PAGE = 15;

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
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Quản lý Giải đấu & Cuộc đua</h2>
          <p className="text-sm text-slate-500 mt-1">Điều hành lịch trình các giải đấu và chặng đua</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => tab === 0 ? loadTournaments() : loadRaces()}
            className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white py-2 px-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition shadow-sm"
          >
            <RefreshCw size={16} /> Làm mới
          </button>
          <button
            onClick={() => tab === 0 ? (setEditingT(null), setTDialog(true)) : (setEditingR(null), setRDialog(true))}
            className="inline-flex items-center gap-2 rounded-md bg-blue-600 py-2 px-4 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition"
          >
            <Plus size={16} />
            {tab === 0 ? 'Tạo Giải Đấu' : 'Thêm Chặng Đua'}
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col min-h-[600px] h-[calc(100vh-140px)]">
        {/* Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50/50">
          <button
            onClick={() => setTab(0)}
            className={`flex items-center gap-2 py-3 px-5 text-sm font-semibold transition-colors border-b-2 ${tab === 0 ? 'border-blue-600 text-blue-700 bg-white' : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100'}`}
          >
            <Trophy size={16} /> Danh sách Giải Đấu
          </button>
          <button
            onClick={() => setTab(1)}
            className={`flex items-center gap-2 py-3 px-5 text-sm font-semibold transition-colors border-b-2 ${tab === 1 ? 'border-blue-600 text-blue-700 bg-white' : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100'}`}
          >
            <Flag size={16} /> Danh sách Chặng Đua
          </button>
        </div>

        <div className="flex-1 flex flex-col min-h-0 relative">
          {tab === 0 ? (
            <>
              {/* Tournaments Toolbar */}
              <div className="border-b border-slate-200 px-5 py-3 flex flex-wrap items-center justify-between gap-4 bg-white">
                <div className="relative w-full sm:w-72">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Tìm giải đấu, địa điểm..."
                    value={tSearch}
                    onChange={e => { setTSearch(e.target.value); setTPage(1); }}
                    className="w-full rounded-md border border-slate-200 bg-white py-1.5 pl-9 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-500">Sắp xếp:</span>
                  <select
                    value={tSort}
                    onChange={e => { setTSort(e.target.value as typeof tSort); setTPage(1); }}
                    className="rounded-md border border-slate-200 bg-white py-1.5 px-3 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm font-medium text-slate-700"
                  >
                    <option value="newest">Mới nhất</option>
                    <option value="oldest">Cũ nhất</option>
                    <option value="status">Trạng thái</option>
                  </select>
                </div>
              </div>

              {/* Tournaments Table */}
              <div className="flex-1 overflow-auto custom-scrollbar bg-slate-50/20">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="sticky top-0 bg-slate-50 shadow-sm z-10">
                    <tr>
                      <th className="px-5 py-3 font-semibold text-slate-600 border-b border-slate-200">Tên Giải Đấu</th>
                      <th className="px-5 py-3 font-semibold text-slate-600 border-b border-slate-200">Lịch trình</th>
                      <th className="px-5 py-3 font-semibold text-slate-600 border-b border-slate-200">Địa điểm</th>
                      <th className="px-5 py-3 font-semibold text-slate-600 border-b border-slate-200">Trạng thái</th>
                      <th className="px-5 py-3 font-semibold text-slate-600 border-b border-slate-200 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {loadingT ? (
                       <tr><td colSpan={5} className="text-center py-10"><RefreshCw className="animate-spin text-slate-400 mx-auto" size={24} /></td></tr>
                    ) : pagedTournaments.length === 0 ? (
                       <tr><td colSpan={5} className="text-center py-12 text-slate-500">Không tìm thấy giải đấu phù hợp.</td></tr>
                    ) : pagedTournaments.map(t => (
                      <tr key={t._id} className="hover:bg-slate-50/50 hover:-translate-y-0.5 hover:shadow-sm transition-all duration-300 group bg-white cursor-pointer">
                        <td className="px-5 py-4">
                          <p className="font-semibold text-slate-900 text-[13px]">{t.name}</p>
                          {t.description && <p className="text-[11px] text-slate-500 mt-1 truncate max-w-[200px]">{t.description}</p>}
                        </td>
                        <td className="px-5 py-4 text-slate-600 text-[13px]">
                           {fmtDate(t.startDate)} → {fmtDate(t.endDate)}
                        </td>
                        <td className="px-5 py-4 text-slate-600 text-[13px]">
                           {t.location || '-'}
                        </td>
                        <td className="px-5 py-4">
                           <span className={`inline-flex items-center gap-1 rounded px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider ${STATUS_COLOR[t.status] || STATUS_COLOR.default}`}>
                             {STATUS_LABEL[t.status] || t.status}
                           </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button onClick={() => { setEditingT(t); setTDialog(true); }} className="flex items-center gap-1 px-2 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-600 hover:text-blue-700 hover:bg-blue-50 border border-slate-200 rounded transition shadow-sm bg-white">
                              <Edit size={12} /> Sửa
                            </button>
                            <button onClick={() => { setFilterTournament(t._id); setTab(1); }} className="flex items-center gap-1 px-2 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-600 hover:text-blue-700 hover:bg-blue-50 border border-slate-200 rounded transition shadow-sm bg-white">
                              <Eye size={12} /> Chặng đua
                            </button>
                            <button onClick={() => handleDeleteTournament(t)} className="flex items-center gap-1 px-2 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-600 hover:text-red-700 hover:bg-red-50 border border-slate-200 rounded transition shadow-sm bg-white">
                              <Trash2 size={12} /> Xóa
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Tournament Pagination */}
              {tTotalPages > 0 && (
                <div className="flex items-center justify-between border-t border-slate-200 bg-white px-5 py-3 mt-auto">
                  <p className="text-xs font-medium text-slate-500">
                    Hiển thị {(tPage-1)*T_PER_PAGE + 1} - {Math.min(tPage*T_PER_PAGE, sortedTournaments.length)} trong <span className="font-bold text-slate-900">{sortedTournaments.length}</span>
                  </p>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setTPage(p => p - 1)} disabled={tPage === 1} className="flex h-7 w-7 items-center justify-center rounded border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition shadow-sm"><ChevronLeft size={14} /></button>
                    {Array.from({ length: Math.min(5, tTotalPages) }, (_, i) => {
                      let p = i + 1;
                      if (tTotalPages > 5) {
                        if (tPage <= 3) p = i + 1;
                        else if (tPage >= tTotalPages - 2) p = tTotalPages - 4 + i;
                        else p = tPage - 2 + i;
                      }
                      return (
                        <button key={p} onClick={() => setTPage(p)} className={`flex h-7 w-7 items-center justify-center rounded text-xs font-bold transition shadow-sm ${tPage === p ? 'bg-blue-600 text-white border-blue-600' : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}>{p}</button>
                      );
                    })}
                    <button onClick={() => setTPage(p => p + 1)} disabled={tPage >= tTotalPages} className="flex h-7 w-7 items-center justify-center rounded border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition shadow-sm"><ChevronRight size={14} /></button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              {/* Races Toolbar */}
              <div className="border-b border-slate-200 px-5 py-3 flex flex-wrap items-center justify-between gap-4 bg-white">
                <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                  <div className="relative w-full sm:w-64">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Tìm kiếm chặng đua..."
                      value={rSearch}
                      onChange={e => { setRSearch(e.target.value); setRPage(1); }}
                      className="w-full rounded-md border border-slate-200 bg-white py-1.5 pl-9 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm"
                    />
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                     <span className="text-sm text-slate-500">Giải đấu:</span>
                     <select 
                       value={filterTournament} 
                       onChange={e => { setFilterTournament(e.target.value); setRPage(1); }} 
                       className="appearance-none rounded-md border border-slate-200 bg-white py-1.5 px-3 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm font-medium text-slate-700 min-w-[150px]"
                     >
                       <option value="">-- Tất cả giải đấu --</option>
                       {tournaments.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
                     </select>
                  </div>
                </div>
              </div>

              {/* Races Table */}
              <div className="flex-1 overflow-auto custom-scrollbar bg-slate-50/20">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="sticky top-0 bg-slate-50 shadow-sm z-10">
                    <tr>
                      <th className="px-5 py-3 font-semibold text-slate-600 border-b border-slate-200">Tên Chặng</th>
                      <th className="px-5 py-3 font-semibold text-slate-600 border-b border-slate-200">Thuộc Giải</th>
                      <th className="px-5 py-3 font-semibold text-slate-600 border-b border-slate-200">Hạng / Cự ly</th>
                      <th className="px-5 py-3 font-semibold text-slate-600 border-b border-slate-200">Lịch trình</th>
                      <th className="px-5 py-3 font-semibold text-slate-600 border-b border-slate-200 text-center">Trạng thái</th>
                      <th className="px-5 py-3 font-semibold text-slate-600 border-b border-slate-200 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {loadingR ? (
                       <tr><td colSpan={6} className="text-center py-10"><RefreshCw className="animate-spin text-slate-400 mx-auto" size={24} /></td></tr>
                    ) : pagedRaces.length === 0 ? (
                       <tr><td colSpan={6} className="text-center py-12 text-slate-500">Không tìm thấy chặng đua phù hợp.</td></tr>
                    ) : pagedRaces.map(r => {
                      const tName = typeof r.tournamentId === 'object' ? r.tournamentId.name : '-';
                      const canChangeStatus = ['open', 'closed'].includes(r.status);
                      const canEdit = !['running', 'finished', 'cancelled'].includes(r.status);
                      const canCancel = !['running', 'finished', 'cancelled'].includes(r.status);
                      
                      return (
                        <tr key={r._id} className="hover:bg-slate-50/50 hover:-translate-y-0.5 hover:shadow-sm transition-all duration-300 group bg-white cursor-pointer">
                          <td className="px-5 py-4 font-semibold text-slate-900 text-[13px]">{r.name}</td>
                          <td className="px-5 py-4 text-slate-600 text-[13px]">{tName}</td>
                          <td className="px-5 py-4 text-slate-600 text-[13px]">
                             <span className="font-bold">{r.grade}</span> <span className="text-slate-400 mx-1">|</span> {r.distance}m
                          </td>
                          <td className="px-5 py-4 text-slate-600 text-[13px]">{fmtDateTime(r.scheduledTime)}</td>
                          <td className="px-5 py-4 text-center">
                             <span className={`inline-flex items-center gap-1 rounded px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider ${STATUS_COLOR[r.status] || STATUS_COLOR.default}`}>
                               {STATUS_LABEL[r.status] || r.status}
                             </span>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center justify-end gap-2">
                              <button onClick={() => navigate('/results', { state: { openRaceId: r._id } })} className="flex items-center gap-1 px-2 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-600 hover:text-blue-700 hover:bg-blue-50 border border-slate-200 rounded transition shadow-sm bg-white">
                                <Eye size={12} /> Kết quả
                              </button>
                              {canChangeStatus && (
                                <button onClick={() => { setStatusRace(r); setStatusDialog(true); }} className="flex items-center gap-1 px-2 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-600 hover:text-amber-700 hover:bg-amber-50 border border-slate-200 rounded transition shadow-sm bg-white">
                                  <RefreshCw size={12} /> Trạng thái
                                </button>
                              )}
                              {canEdit && (
                                <button onClick={() => { setEditingR(r); setRDialog(true); }} className="flex items-center gap-1 px-2 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-600 hover:text-blue-700 hover:bg-blue-50 border border-slate-200 rounded transition shadow-sm bg-white">
                                  <Edit size={12} /> Sửa
                                </button>
                              )}
                              {canCancel && (
                                <button onClick={() => handleCancelRace(r)} className="flex items-center gap-1 px-2 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-600 hover:text-red-700 hover:bg-red-50 border border-slate-200 rounded transition shadow-sm bg-white">
                                  <Trash2 size={12} /> Hủy
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

              {/* Races Pagination */}
              {rTotalPages > 0 && (
                <div className="flex items-center justify-between border-t border-slate-200 bg-white px-5 py-3 mt-auto">
                  <p className="text-xs font-medium text-slate-500">
                    Hiển thị {(rPage-1)*R_PER_PAGE + 1} - {Math.min(rPage*R_PER_PAGE, filteredRaces.length)} trong <span className="font-bold text-slate-900">{filteredRaces.length}</span>
                  </p>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setRPage(p => p - 1)} disabled={rPage === 1} className="flex h-7 w-7 items-center justify-center rounded border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition shadow-sm"><ChevronLeft size={14} /></button>
                    {Array.from({ length: Math.min(5, rTotalPages) }, (_, i) => {
                      let p = i + 1;
                      if (rTotalPages > 5) {
                        if (rPage <= 3) p = i + 1;
                        else if (rPage >= rTotalPages - 2) p = rTotalPages - 4 + i;
                        else p = rPage - 2 + i;
                      }
                      return (
                        <button key={p} onClick={() => setRPage(p)} className={`flex h-7 w-7 items-center justify-center rounded text-xs font-bold transition shadow-sm ${rPage === p ? 'bg-blue-600 text-white border-blue-600' : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}>{p}</button>
                      );
                    })}
                    <button onClick={() => setRPage(p => p + 1)} disabled={rPage >= rTotalPages} className="flex h-7 w-7 items-center justify-center rounded border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition shadow-sm"><ChevronRight size={14} /></button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <TournamentDialog open={tDialog} editing={editingT} onClose={() => setTDialog(false)} onSaved={loadTournaments} />
      <RaceDialog open={rDialog} editing={editingR} tournaments={tournaments} onClose={() => setRDialog(false)} onSaved={loadRaces} />
      <StatusDialog open={statusDialog} race={statusRace} onClose={() => setStatusDialog(false)} onSaved={loadRaces} />
    </>
  );
}
