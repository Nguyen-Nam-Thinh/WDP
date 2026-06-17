import { useState, useEffect, useCallback } from 'react';
import { Edit, Trash2, Plus, Calendar, Clock, Trophy, Eye, RefreshCw, X, AlertCircle } from 'lucide-react';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className={`w-full ${maxWidth} rounded-xl bg-white shadow-2xl dark:bg-[#1c2434] border border-slate-200 dark:border-slate-700 flex flex-col max-h-[90vh]`}>
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 px-6 py-4">
          <h3 className="text-xl font-semibold text-black dark:text-white">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-black dark:hover:text-white transition">
            <X size={24} />
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
          <label className="mb-2.5 block text-sm font-medium text-black dark:text-white">Tên giải đấu <span className="text-red-500">*</span></label>
          <input type="text" value={form.name} onChange={f('name')} className="w-full rounded border-[1.5px] border-slate-300 bg-transparent py-2 px-4 text-black outline-none transition focus:border-blue-500 active:border-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white" />
        </div>
        <div>
          <label className="mb-2.5 block text-sm font-medium text-black dark:text-white">Ngày bắt đầu <span className="text-red-500">*</span></label>
          <input type="date" value={form.startDate} onChange={f('startDate')} className="w-full rounded border-[1.5px] border-slate-300 bg-transparent py-2 px-4 text-black outline-none transition focus:border-blue-500 active:border-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white" />
        </div>
        <div>
          <label className="mb-2.5 block text-sm font-medium text-black dark:text-white">Ngày kết thúc <span className="text-red-500">*</span></label>
          <input type="date" value={form.endDate} onChange={f('endDate')} className="w-full rounded border-[1.5px] border-slate-300 bg-transparent py-2 px-4 text-black outline-none transition focus:border-blue-500 active:border-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white" />
        </div>
        <div className="col-span-1 sm:col-span-2">
          <label className="mb-2.5 block text-sm font-medium text-black dark:text-white">Địa điểm</label>
          <input type="text" value={form.location} onChange={f('location')} className="w-full rounded border-[1.5px] border-slate-300 bg-transparent py-2 px-4 text-black outline-none transition focus:border-blue-500 active:border-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white" />
        </div>
        <div className="col-span-1 sm:col-span-2">
          <label className="mb-2.5 block text-sm font-medium text-black dark:text-white">Mô tả</label>
          <textarea rows={3} value={form.description} onChange={f('description')} className="w-full rounded border-[1.5px] border-slate-300 bg-transparent py-2 px-4 text-black outline-none transition focus:border-blue-500 active:border-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"></textarea>
        </div>
      </div>
      <div className="mt-8 flex justify-end gap-3">
        <button onClick={onClose} disabled={saving} className="rounded border border-slate-300 py-2 px-6 font-medium text-black hover:bg-slate-50 dark:border-slate-600 dark:text-white dark:hover:bg-slate-800 disabled:opacity-50 transition">Hủy</button>
        <button onClick={handleSave} disabled={saving} className="rounded bg-blue-600 py-2 px-6 font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition flex items-center justify-center min-w-[120px]">
          {saving ? <RefreshCw className="animate-spin" size={20} /> : (editing ? 'Lưu thay đổi' : 'Tạo giải đấu')}
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
          <label className="mb-2.5 block text-sm font-medium text-black dark:text-white">Giải đấu <span className="text-red-500">*</span></label>
          <div className="relative z-20 bg-transparent dark:bg-form-input">
            <select value={form.tournamentId} onChange={e => setF('tournamentId', e.target.value)} className="relative z-20 w-full appearance-none rounded border border-slate-300 bg-transparent py-2 px-4 outline-none transition focus:border-blue-500 active:border-blue-500 dark:border-slate-600 dark:bg-slate-800">
              <option value="">-- Chọn giải đấu --</option>
              {tournaments.map((t: any) => <option key={t._id} value={t._id}>{t.name}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="mb-2.5 block text-sm font-medium text-black dark:text-white">Hạng <span className="text-red-500">*</span></label>
          <div className="relative z-20 bg-transparent dark:bg-form-input">
            <select value={form.grade} onChange={e => setF('grade', e.target.value)} className="relative z-20 w-full appearance-none rounded border border-slate-300 bg-transparent py-2 px-4 outline-none transition focus:border-blue-500 active:border-blue-500 dark:border-slate-600 dark:bg-slate-800">
              {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
        </div>
        <div className="col-span-1 sm:col-span-2">
          <label className="mb-2.5 block text-sm font-medium text-black dark:text-white">Tên cuộc đua <span className="text-red-500">*</span></label>
          <input type="text" value={form.name} onChange={e => setF('name', e.target.value)} className="w-full rounded border-[1.5px] border-slate-300 bg-transparent py-2 px-4 text-black outline-none transition focus:border-blue-500 active:border-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white" />
        </div>
        <div>
          <label className="mb-2.5 block text-sm font-medium text-black dark:text-white">Thời gian đua <span className="text-red-500">*</span></label>
          <input type="datetime-local" value={form.scheduledTime} onChange={e => setF('scheduledTime', e.target.value)} className="w-full rounded border-[1.5px] border-slate-300 bg-transparent py-2 px-4 text-black outline-none transition focus:border-blue-500 active:border-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white" />
        </div>
        <div>
          <label className="mb-2.5 block text-sm font-medium text-black dark:text-white">Hạn đăng ký <span className="text-red-500">*</span></label>
          <input type="datetime-local" value={form.cutoffTime} onChange={e => setF('cutoffTime', e.target.value)} className="w-full rounded border-[1.5px] border-slate-300 bg-transparent py-2 px-4 text-black outline-none transition focus:border-blue-500 active:border-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white" />
          <p className="mt-1 text-xs text-slate-500">Ít nhất 48h trước giờ đua</p>
        </div>
        
        <div className="grid grid-cols-2 gap-5 sm:col-span-2 sm:grid-cols-4">
          <div>
            <label className="mb-2.5 block text-sm font-medium text-black dark:text-white">Cự ly (m)</label>
            <input type="number" value={form.distance} onChange={e => setF('distance', e.target.value)} className="w-full rounded border-[1.5px] border-slate-300 bg-transparent py-2 px-4 text-black outline-none transition focus:border-blue-500 active:border-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white" />
          </div>
          <div>
            <label className="mb-2.5 block text-sm font-medium text-black dark:text-white">Sức chứa</label>
            <input type="number" value={form.maxCapacity} onChange={e => setF('maxCapacity', e.target.value)} className="w-full rounded border-[1.5px] border-slate-300 bg-transparent py-2 px-4 text-black outline-none transition focus:border-blue-500 active:border-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white" />
          </div>
          <div>
            <label className="mb-2.5 block text-sm font-medium text-black dark:text-white">Thưởng ($)</label>
            <input type="number" value={form.purse} onChange={e => setF('purse', e.target.value)} className="w-full rounded border-[1.5px] border-slate-300 bg-transparent py-2 px-4 text-black outline-none transition focus:border-blue-500 active:border-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white" />
          </div>
          <div>
            <label className="mb-2.5 block text-sm font-medium text-black dark:text-white">Phí ĐK ($)</label>
            <input type="number" value={form.registrationFee} onChange={e => setF('registrationFee', e.target.value)} className="w-full rounded border-[1.5px] border-slate-300 bg-transparent py-2 px-4 text-black outline-none transition focus:border-blue-500 active:border-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white" />
          </div>
        </div>
      </div>
      <div className="mt-8 flex justify-end gap-3">
        <button onClick={onClose} disabled={saving} className="rounded border border-slate-300 py-2 px-6 font-medium text-black hover:bg-slate-50 dark:border-slate-600 dark:text-white dark:hover:bg-slate-800 disabled:opacity-50 transition">Hủy</button>
        <button onClick={handleSave} disabled={saving} className="rounded bg-blue-600 py-2 px-6 font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition flex items-center justify-center min-w-[120px]">
          {saving ? <RefreshCw className="animate-spin" size={20} /> : (editing ? 'Lưu thay đổi' : 'Tạo cuộc đua')}
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
  const [tab, setTab] = useState(0);

  // Tournaments
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loadingT, setLoadingT] = useState(true);
  const [tDialog, setTDialog] = useState(false);
  const [editingT, setEditingT] = useState<Tournament | null>(null);

  // Races
  const [races, setRaces] = useState<Race[]>([]);
  const [loadingR, setLoadingR] = useState(false);
  const [rDialog, setRDialog] = useState(false);
  const [editingR, setEditingR] = useState<Race | null>(null);
  const [statusDialog, setStatusDialog] = useState(false);
  const [statusRace, setStatusRace] = useState<Race | null>(null);
  const [filterTournament, setFilterTournament] = useState('');

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
              {loadingT ? (
                <div className="flex justify-center py-12"><RefreshCw className="animate-spin text-blue-500" size={32} /></div>
              ) : tournaments.length === 0 ? (
                <div className="text-center py-12">
                  <div className="mx-auto h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 dark:bg-slate-800"><Trophy className="text-slate-400" size={32} /></div>
                  <h4 className="text-lg font-medium text-slate-700 dark:text-slate-300">Chưa có giải đấu nào</h4>
                  <p className="mt-1 text-sm text-slate-500">Tạo giải đấu đầu tiên của bạn để bắt đầu.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {tournaments.map((t) => (
                    <div key={t._id} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md dark:border-slate-700 dark:bg-[#243045] relative group">
                      <div className="flex justify-between items-start mb-4">
                        <div className="pr-16">
                          <h4 className="text-lg font-bold text-black dark:text-white mb-2">{t.name}</h4>
                          <div className="flex flex-wrap gap-2">
                            <span className={`inline-block rounded px-2.5 py-0.5 text-xs font-medium ${STATUS_COLOR[t.status] || STATUS_COLOR.default}`}>{STATUS_LABEL[t.status] || t.status}</span>
                            {!t.isActive && <span className="inline-block rounded px-2.5 py-0.5 text-xs font-medium bg-red-100 text-red-600">Không hoạt động</span>}
                          </div>
                        </div>
                        <div className="absolute top-6 right-6 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => { setEditingT(t); setTDialog(true); }} className="p-1.5 text-slate-400 hover:text-blue-500 bg-slate-50 hover:bg-blue-50 rounded-md dark:bg-slate-800 dark:hover:bg-slate-700">
                            <Edit size={16} />
                          </button>
                          <button onClick={() => handleDeleteTournament(t)} className="p-1.5 text-slate-400 hover:text-red-500 bg-slate-50 hover:bg-red-50 rounded-md dark:bg-slate-800 dark:hover:bg-slate-700">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                      
                      <div className="flex flex-col gap-2.5 mt-5">
                        <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                          <Calendar size={16} className="text-slate-400" />
                          <span>{fmtDate(t.startDate)} — {fmtDate(t.endDate)}</span>
                        </div>
                        {t.location && (
                          <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                            <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                            <span>{t.location}</span>
                          </div>
                        )}
                        {t.description && (
                          <div className="mt-2 text-sm text-slate-500 italic border-l-2 border-slate-200 pl-3 dark:border-slate-600 line-clamp-2">
                            {t.description}
                          </div>
                        )}
                      </div>
                      
                      <button 
                        onClick={() => { setFilterTournament(t._id); setTab(1); }}
                        className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-slate-50 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-white hover:text-blue-600 hover:border-blue-300 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                      >
                        <Eye size={16} /> Xem các cuộc đua
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Tab 1: Races ── */}
          {tab === 1 && (
            <div>
              <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative z-20 bg-transparent min-w-[240px]">
                  <select value={filterTournament} onChange={e => setFilterTournament(e.target.value)} className="relative z-20 w-full appearance-none rounded border border-slate-300 bg-transparent py-2 px-4 outline-none transition focus:border-blue-500 active:border-blue-500 dark:border-slate-600 dark:bg-slate-800">
                    <option value="">-- Lọc theo giải đấu --</option>
                    {tournaments.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
                  </select>
                </div>
                <div className="flex gap-3">
                  <button onClick={loadRaces} disabled={loadingR} className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 bg-white py-2 px-4 text-center font-medium text-black hover:bg-slate-50 transition dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700">
                    <RefreshCw size={18} className={loadingR ? 'animate-spin' : ''} /> <span className="hidden sm:inline">Làm mới</span>
                  </button>
                  <button onClick={() => { setEditingR(null); setRDialog(true); }} className="inline-flex items-center justify-center gap-2 rounded-md bg-blue-600 py-2 px-4 text-center font-medium text-white hover:bg-blue-700 transition">
                    <Plus size={18} /> Thêm cuộc đua
                  </button>
                </div>
              </div>

              {loadingR ? (
                <div className="flex justify-center py-12"><RefreshCw className="animate-spin text-blue-500" size={32} /></div>
              ) : (
                <div className="max-w-full overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
                  <table className="w-full table-auto">
                    <thead>
                      <tr className="bg-slate-50 text-left dark:bg-slate-800">
                        <th className="py-4 px-4 font-semibold text-black dark:text-white border-b border-slate-200 dark:border-slate-700 xl:pl-6">Tên cuộc đua</th>
                        <th className="py-4 px-4 font-semibold text-black dark:text-white border-b border-slate-200 dark:border-slate-700">Giải đấu</th>
                        <th className="py-4 px-4 font-semibold text-black dark:text-white border-b border-slate-200 dark:border-slate-700">Hạng</th>
                        <th className="py-4 px-4 font-semibold text-black dark:text-white border-b border-slate-200 dark:border-slate-700">Thời gian</th>
                        <th className="py-4 px-4 font-semibold text-black dark:text-white border-b border-slate-200 dark:border-slate-700">Cự ly</th>
                        <th className="py-4 px-4 font-semibold text-black dark:text-white border-b border-slate-200 dark:border-slate-700">Trọng tài</th>
                        <th className="py-4 px-4 font-semibold text-black dark:text-white border-b border-slate-200 dark:border-slate-700 text-center">Trạng thái</th>
                        <th className="py-4 px-4 font-semibold text-black dark:text-white border-b border-slate-200 dark:border-slate-700 text-right xl:pr-6">Hành động</th>
                      </tr>
                    </thead>
                    <tbody>
                      {races.length === 0 ? (
                        <tr><td colSpan={8} className="text-center py-8 text-slate-500">Chưa có cuộc đua nào</td></tr>
                      ) : races.map((r) => {
                        const tName = typeof r.tournamentId === 'object' ? r.tournamentId.name : '-';
                        const canChangeStatus = ['open', 'closed'].includes(r.status);
                        const canEdit = !['running', 'finished', 'cancelled'].includes(r.status);
                        const canCancel = !['running', 'finished', 'cancelled'].includes(r.status);
                        return (
                          <tr key={r._id} className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                            <td className="py-3 px-4 xl:pl-6"><p className="font-medium text-black dark:text-white">{r.name}</p></td>
                            <td className="py-3 px-4"><p className="text-sm text-slate-600 dark:text-slate-300">{tName}</p></td>
                            <td className="py-3 px-4"><span className="inline-block rounded border border-slate-300 bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-600 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300">{r.grade}</span></td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-300">
                                <Clock size={14} className="text-slate-400" /> {fmtDateTime(r.scheduledTime)}
                              </div>
                            </td>
                            <td className="py-3 px-4 text-sm font-medium">{r.distance}m</td>
                            <td className="py-3 px-4">
                              {typeof r.refereeId === 'object' && r.refereeId
                                ? <p className="text-sm text-black dark:text-white">{r.refereeId.fullName}</p>
                                : <span className="inline-block rounded-full px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">Chưa PT</span>}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_COLOR[r.status] || STATUS_COLOR.default}`}>{STATUS_LABEL[r.status] || r.status}</span>
                            </td>
                            <td className="py-3 px-4 text-right xl:pr-6">
                              <div className="flex items-center justify-end gap-2">
                                {canChangeStatus && (
                                  <button onClick={() => { setStatusRace(r); setStatusDialog(true); }} className="rounded-md border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700 transition">
                                    Đổi TT
                                  </button>
                                )}
                                {canEdit && (
                                  <button onClick={() => { setEditingR(r); setRDialog(true); }} className="p-1.5 text-slate-500 hover:text-blue-600 bg-slate-100 hover:bg-blue-100 rounded-md dark:bg-slate-800 dark:hover:bg-slate-700 transition">
                                    <Edit size={16} />
                                  </button>
                                )}
                                {canCancel && (
                                  <button onClick={() => handleCancelRace(r)} className="p-1.5 text-slate-500 hover:text-red-600 bg-slate-100 hover:bg-red-100 rounded-md dark:bg-slate-800 dark:hover:bg-slate-700 transition">
                                    <Trash2 size={16} />
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
