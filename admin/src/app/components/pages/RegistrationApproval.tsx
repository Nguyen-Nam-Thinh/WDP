import { useState, useEffect, useCallback, useRef } from 'react';
import { Eye, Activity, XCircle, AlertTriangle, RefreshCw, X, ChevronLeft, ChevronRight, FileCheck, Search, TrendingUp, TrendingDown, ClipboardList, CheckCircle, Ban, MoreHorizontal } from 'lucide-react';
import { toast } from 'sonner';
import { registrationApi, type RegistrationListResponse } from '../../api/registration';
import type { Registration } from '../../api/race';

const STATUS_COLOR: Record<string, string> = {
  active: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  cancelled: 'bg-slate-50 text-slate-700 border border-slate-200',
  disqualified: 'bg-red-50 text-red-700 border border-red-200',
};
const STATUS_LABEL: Record<string, string> = {
  active: 'Đang tham gia', cancelled: 'Đã hủy', disqualified: 'Bị loại',
};

const PRECHECK_COLOR: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700 border border-amber-200',
  passed: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  failed: 'bg-red-50 text-red-700 border border-red-200',
};
const PRECHECK_LABEL: Record<string, string> = {
  pending: 'Chờ kiểm tra', passed: 'Đã qua', failed: 'Không qua',
};

const fmtDate = (d?: string) => d ? new Date(d).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' }) : '-';

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

export default function RegistrationApproval() {
  const [tab, setTab] = useState(0);
  const [data, setData] = useState<RegistrationListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Registration | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const [regStats, setRegStats] = useState({ active: 0, cancelled: 0, disqualified: 0 });
  const [loadingStats, setLoadingStats] = useState(true);

  const statusFilter = ['active', 'cancelled', 'disqualified'][tab] as Registration['status'];

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await registrationApi.list({ status: statusFilter, page, limit: 15 });
      setData(res);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, page]);

  useEffect(() => {
    setLoadingStats(true);
    Promise.all([
      registrationApi.list({ status: 'active', page: 1, limit: 1 }),
      registrationApi.list({ status: 'cancelled', page: 1, limit: 1 }),
      registrationApi.list({ status: 'disqualified', page: 1, limit: 1 }),
    ]).then(([a, c, d]) => {
      setRegStats({ active: a.total, cancelled: c.total, disqualified: d.total });
    }).catch(() => {}).finally(() => setLoadingStats(false));
  }, []);

  useEffect(() => { setPage(1); setSearch(''); }, [tab]);
  useEffect(() => { load(); }, [load]);

  const filteredRegs = search && data?.registrations
    ? data.registrations.filter(r => {
        const race = r.raceId as any;
        const horse = r.horseId as any;
        const owner = r.ownerId as any;
        const jockey = r.jockeyId as any;
        const q = search.toLowerCase();
        return (
          (race?.name || '').toLowerCase().includes(q) ||
          (horse?.name || '').toLowerCase().includes(q) ||
          (owner?.fullName || '').toLowerCase().includes(q) ||
          (owner?.email || '').toLowerCase().includes(q) ||
          (jockey?.fullName || '').toLowerCase().includes(q)
        );
      })
    : data?.registrations ?? [];

  const handleView = async (reg: Registration) => {
    try {
      const full = await registrationApi.getById(reg._id);
      setSelected(full);
      setDialogOpen(true);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Xét duyệt Đăng ký</h2>
          <p className="text-sm text-slate-500 mt-1">Kiểm tra thông tin ngựa tham gia và duyệt yêu cầu</p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white py-2 px-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition shadow-sm disabled:opacity-50"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Làm mới
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 xl:gap-6 mb-6">
        {/* Card 1 */}
        <div className="group overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-start justify-between mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 shadow-sm">
              <ClipboardList size={24} />
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-600 border border-blue-100">
              <TrendingUp size={12} /> Tổng
            </span>
          </div>
          <p className="text-3xl font-bold text-slate-800 mb-1">
            {loadingStats ? <span className="text-slate-300">...</span> : (regStats.active + regStats.cancelled + regStats.disqualified).toLocaleString('vi-VN')}
          </p>
          <p className="text-sm font-semibold text-slate-600">Tổng đăng ký</p>
        </div>

        {/* Card 2 */}
        <div className="group overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-start justify-between mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 shadow-sm">
              <CheckCircle size={24} />
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-600 border border-emerald-100">
              <TrendingUp size={12} /> Hợp lệ
            </span>
          </div>
          <p className="text-3xl font-bold text-slate-800 mb-1">
            {loadingStats ? <span className="text-slate-300">...</span> : regStats.active.toLocaleString('vi-VN')}
          </p>
          <p className="text-sm font-semibold text-slate-600">Đang hoạt động</p>
        </div>

        {/* Card 3 */}
        <div className="group overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-start justify-between mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-600 shadow-sm">
              <XCircle size={24} />
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600 border border-slate-200">
              <TrendingDown size={12} /> Rút lui
            </span>
          </div>
          <p className="text-3xl font-bold text-slate-800 mb-1">
            {loadingStats ? <span className="text-slate-300">...</span> : regStats.cancelled.toLocaleString('vi-VN')}
          </p>
          <p className="text-sm font-semibold text-slate-600">Đã hủy</p>
        </div>

        {/* Card 4 */}
        <div className="group overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-start justify-between mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-red-600 shadow-sm">
              <Ban size={24} />
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600 border border-red-100">
              <TrendingDown size={12} /> Rủi ro
            </span>
          </div>
          <p className="text-3xl font-bold text-slate-800 mb-1">
            {loadingStats ? <span className="text-slate-300">...</span> : regStats.disqualified.toLocaleString('vi-VN')}
          </p>
          <p className="text-sm font-semibold text-slate-600">Bị loại (DQ)</p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col h-[calc(100vh-280px)] min-h-[500px]">
        {/* Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50/50 px-2">
          <button
            onClick={() => setTab(0)}
            className={`flex items-center gap-2 py-3 px-5 text-sm font-semibold transition-colors border-b-2 ${tab === 0 ? 'border-blue-600 text-blue-700 bg-white' : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100'}`}
          >
            <Activity size={16} /> Đang hoạt động
          </button>
          <button
            onClick={() => setTab(1)}
            className={`flex items-center gap-2 py-3 px-5 text-sm font-semibold transition-colors border-b-2 ${tab === 1 ? 'border-blue-600 text-blue-700 bg-white' : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100'}`}
          >
            <XCircle size={16} /> Đã hủy
          </button>
          <button
            onClick={() => setTab(2)}
            className={`flex items-center gap-2 py-3 px-5 text-sm font-semibold transition-colors border-b-2 ${tab === 2 ? 'border-blue-600 text-blue-700 bg-white' : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100'}`}
          >
            <AlertTriangle size={16} /> Bị loại (DQ)
          </button>
        </div>

        {/* Toolbar */}
        <div className="px-5 py-3 border-b border-slate-200 bg-white flex items-center justify-between">
          <div className="relative w-full max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm kiếm đăng ký..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full rounded-md border border-slate-200 bg-white py-1.5 pl-9 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm"
            />
          </div>
        </div>

        {/* Table Content */}
        <div className="flex-1 overflow-auto custom-scrollbar bg-slate-50/20">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="sticky top-0 bg-slate-50 shadow-sm z-10">
              <tr>
                <th className="py-3 px-5 font-semibold text-slate-600 border-b border-slate-200">Ngựa / Hạng</th>
                <th className="py-3 px-5 font-semibold text-slate-600 border-b border-slate-200">Chủ sở hữu / Jockey</th>
                <th className="py-3 px-5 font-semibold text-slate-600 border-b border-slate-200">Cuộc đua</th>
                <th className="py-3 px-5 font-semibold text-slate-600 border-b border-slate-200">Phí đã nộp</th>
                <th className="py-3 px-5 font-semibold text-slate-600 border-b border-slate-200 text-center">Kiểm tra</th>
                <th className="py-3 px-5 font-semibold text-slate-600 border-b border-slate-200 text-center">Trạng thái</th>
                <th className="py-3 px-5 font-semibold text-slate-600 border-b border-slate-200 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={7} className="text-center py-10"><RefreshCw className="animate-spin text-slate-400 mx-auto" size={24} /></td></tr>
              ) : filteredRegs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-500">
                    <div className="flex flex-col items-center justify-center">
                      <FileCheck size={40} className="mb-3 text-slate-300" />
                      {!data?.registrations?.length ? 'Không có dữ liệu đăng ký' : 'Không tìm thấy kết quả phù hợp'}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRegs.map(reg => (
                  <tr key={reg._id} className="hover:bg-slate-50/50 bg-white transition-colors group">
                    <td className="py-4 px-5">
                      <p className="font-semibold text-slate-900 flex items-center gap-1.5 text-[13px]">
                        <span className="text-lg">🐴</span> {typeof reg.horseId === 'object' ? reg.horseId.name : reg.horseId}
                      </p>
                      <p className="text-[11px] font-medium text-slate-500 mt-1">
                        Hạng: {typeof reg.horseId === 'object' ? `${reg.horseId.currentGrade}` : ''}
                      </p>
                    </td>
                    <td className="py-4 px-5">
                      <p className="text-[13px] font-semibold text-slate-800">
                        {typeof reg.ownerId === 'object' ? reg.ownerId.fullName : '-'}
                      </p>
                      <div className="mt-1">
                        {typeof reg.jockeyId === 'object' && reg.jockeyId ? (
                          <span className="text-[11px] text-slate-500">Jockey: {reg.jockeyId.fullName}</span>
                        ) : (
                          <span className="text-[10px] font-bold text-amber-500 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">Chưa gán</span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-5">
                      <p className="text-[13px] font-semibold text-slate-800 truncate max-w-[150px]">{typeof reg.raceId === 'object' ? reg.raceId.name : '-'}</p>
                      {typeof reg.raceId === 'object' && (
                        <span className="inline-block mt-1 rounded border border-slate-200 bg-white shadow-sm px-1.5 py-0.5 text-[10px] font-bold text-slate-600">
                          {reg.raceId.grade}
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-5">
                      <p className="text-[13px] font-bold text-slate-700">
                        {reg.feePaid?.toLocaleString('vi-VN')} $
                      </p>
                    </td>
                    <td className="py-4 px-5 text-center">
                      <span className={`inline-flex items-center rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${PRECHECK_COLOR[reg.preCheckResult?.status || 'pending'] || PRECHECK_COLOR.pending}`}>
                        {PRECHECK_LABEL[reg.preCheckResult?.status || 'pending']}
                      </span>
                    </td>
                    <td className="py-4 px-5 text-center">
                      <span className={`inline-flex items-center rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${STATUS_COLOR[reg.status] || ''}`}>
                        {STATUS_LABEL[reg.status]}
                      </span>
                      {reg.refundAmount > 0 && (
                        <p className="text-[11px] font-semibold text-emerald-600 mt-1">
                          Hoàn: {reg.refundAmount.toLocaleString('vi-VN')} $
                        </p>
                      )}
                    </td>
                    <td className="py-4 px-5">
                      <div className="flex items-center justify-end">
                        <button onClick={() => handleView(reg)} className="flex items-center gap-1 px-2 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-600 hover:text-blue-700 hover:bg-blue-50 border border-slate-200 rounded transition shadow-sm bg-white">
                          <Eye size={12} /> Chi tiết
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-200 bg-white px-5 py-3 mt-auto">
            <p className="text-xs font-medium text-slate-500">
              Trang <span className="font-bold text-slate-900">{page}</span> / {data.totalPages}
            </p>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => p - 1)} disabled={page === 1} className="flex h-7 w-7 items-center justify-center rounded border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition shadow-sm"><ChevronLeft size={14} /></button>
              {Array.from({ length: Math.min(5, data.totalPages) }, (_, i) => {
                let p = i + 1;
                if (data.totalPages > 5) {
                  if (page <= 3) p = i + 1;
                  else if (page >= data.totalPages - 2) p = data.totalPages - 4 + i;
                  else p = page - 2 + i;
                }
                return (
                  <button key={p} onClick={() => setPage(p)} className={`flex h-7 w-7 items-center justify-center rounded text-xs font-bold transition shadow-sm ${page === p ? 'bg-blue-600 text-white border-blue-600' : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}>{p}</button>
                );
              })}
              <button onClick={() => setPage(p => p + 1)} disabled={page >= data.totalPages} className="flex h-7 w-7 items-center justify-center rounded border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition shadow-sm"><ChevronRight size={14} /></button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Dialog Modal */}
      <Modal open={dialogOpen} onClose={() => setDialogOpen(false)} title="Chi tiết Đăng ký" maxWidth="max-w-3xl">
        {selected && (
          <div className="flex flex-col gap-6">
            <div className="mb-2">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Thông tin Tổng quan</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <div>
                  <p className="text-[11px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Ngựa</p>
                  <p className="font-semibold text-slate-900 text-[15px]">
                    {typeof selected.horseId === 'object' ? `${selected.horseId.name} (${selected.horseId.currentGrade})` : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Chủ sở hữu</p>
                  <p className="font-semibold text-slate-900 text-[15px]">
                    {typeof selected.ownerId === 'object' ? selected.ownerId.fullName : '-'}
                  </p>
                  <p className="text-xs font-medium text-slate-500 mt-0.5">{typeof selected.ownerId === 'object' ? selected.ownerId.email : ''}</p>
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Jockey</p>
                  {typeof selected.jockeyId === 'object' && selected.jockeyId ? (
                    <p className="font-semibold text-slate-900 text-[15px]">{selected.jockeyId.fullName}</p>
                  ) : (
                    <span className="inline-flex items-center rounded border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-600">Chưa gán</span>
                  )}
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Cuộc đua</p>
                  <p className="font-semibold text-slate-900 text-[15px]">
                    {typeof selected.raceId === 'object' ? selected.raceId.name : '-'}
                  </p>
                </div>
              </div>
            </div>

            <div className="mb-2">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Tài chính & Trạng thái</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="rounded-lg border border-slate-200 p-4 bg-white shadow-sm">
                  <p className="text-[11px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Phí đã nộp</p>
                  <p className="text-lg font-bold text-slate-800">{selected.feePaid?.toLocaleString('vi-VN')} $</p>
                </div>
                <div className="rounded-lg border border-slate-200 p-4 bg-white shadow-sm">
                  <p className="text-[11px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Hoàn phí</p>
                  <p className={`text-lg font-bold ${selected.refundAmount > 0 ? 'text-emerald-600' : 'text-slate-800'}`}>
                    {(selected.refundAmount || 0).toLocaleString('vi-VN')} $
                  </p>
                </div>
                <div className="rounded-lg border border-slate-200 p-4 bg-white shadow-sm">
                  <p className="text-[11px] font-bold text-slate-400 mb-2 uppercase tracking-wider">Trạng thái</p>
                  <span className={`inline-flex items-center rounded px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider ${STATUS_COLOR[selected.status] || ''}`}>
                    {STATUS_LABEL[selected.status]}
                  </span>
                </div>
                <div className="rounded-lg border border-slate-200 p-4 bg-white shadow-sm">
                  <p className="text-[11px] font-bold text-slate-400 mb-2 uppercase tracking-wider">Kiểm tra ngựa</p>
                  <span className={`inline-flex items-center rounded px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider ${PRECHECK_COLOR[selected.preCheckResult?.status || 'pending'] || PRECHECK_COLOR.pending}`}>
                    {PRECHECK_LABEL[selected.preCheckResult?.status || 'pending']}
                  </span>
                </div>
              </div>
            </div>

            {selected.preCheckResult?.note && (
              <div className="mb-2">
                <p className="text-[11px] font-bold text-slate-400 mb-2 uppercase tracking-wider flex items-center gap-1.5">
                  <Activity size={14} /> Ghi chú thú y
                </p>
                <div className="rounded-lg bg-amber-50 p-4 text-[13px] font-medium text-amber-900 border border-amber-200 italic shadow-sm">
                  "{selected.preCheckResult.note}"
                </div>
              </div>
            )}
          </div>
        )}
        <div className="flex items-center justify-between gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4 -mx-6 mt-6 rounded-b-xl">
          <div className="flex gap-4">
            {selected && (
              <>
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Ngày đăng ký</p>
                  <p className="text-xs font-semibold text-slate-700">{fmtDate(selected.registeredAt)}</p>
                </div>
                {selected.cancelledAt && (
                  <div>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Ngày hủy</p>
                    <p className="text-xs font-semibold text-red-600">{fmtDate(selected.cancelledAt)}</p>
                  </div>
                )}
              </>
            )}
          </div>
          <button onClick={() => setDialogOpen(false)} className="rounded-md border border-slate-300 bg-white py-2 px-5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition shadow-sm">
            Đóng
          </button>
        </div>
      </Modal>
    </>
  );
}
