import { useCallback, useEffect, useState } from 'react';
import { CheckCircle, XCircle, RefreshCw, Eye, FileText, Search } from 'lucide-react';
import { toast } from 'sonner';
import {
  refereeReportAdminApi,
  type AdminRefereeReport,
  type AdminRefereeReportList,
} from '../../api/refereeReport';

const STATUS_LABEL: Record<string, string> = {
  draft: 'Nháp',
  pending_approval: 'Chờ duyệt',
  submitted: 'Chờ duyệt',
  rejected: 'Từ chối',
  approved: 'Đã duyệt',
};

const STATUS_COLOR: Record<string, string> = {
  draft: 'bg-amber-50 text-amber-700 border border-amber-200',
  pending_approval: 'bg-blue-50 text-blue-700 border border-blue-200',
  submitted: 'bg-blue-50 text-blue-700 border border-blue-200',
  rejected: 'bg-red-50 text-red-700 border border-red-200',
  approved: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
};

function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-3xl rounded-xl bg-white shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-50">
          <h3 className="text-lg font-bold text-slate-900">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1 rounded-md hover:bg-slate-200">
            ✕
          </button>
        </div>
        <div className="overflow-y-auto flex-1 p-6">{children}</div>
      </div>
    </div>
  );
}

export default function RefereeReportReview() {
  const [data, setData] = useState<AdminRefereeReportList | null>(null);
  const [loading, setLoading] = useState(true);
  const [phase, setPhase] = useState<'prerace' | 'postrace'>('prerace');
  const [statusFilter, setStatusFilter] = useState('pending_approval');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<AdminRefereeReport | null>(null);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [acting, setActing] = useState(false);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await refereeReportAdminApi.list({
        page,
        limit: 20,
        status: statusFilter || undefined,
        phase,
      });
      setData(res);
    } catch (err: any) {
      toast.error(err.message || 'Không tải được danh sách biên bản');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, phase]);

  useEffect(() => {
    load();
  }, [load]);

  const openDetail = async (report: AdminRefereeReport) => {
    try {
      const full = await refereeReportAdminApi.getById(report._id);
      setSelected(full);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleApprove = async () => {
    if (!selected) return;
    setActing(true);
    try {
      if (phase === 'prerace') {
        await refereeReportAdminApi.approvePreRace(selected._id);
        toast.success('Đã duyệt Pre-race — có thể chạy mô phỏng');
      } else {
        await refereeReportAdminApi.approve(selected._id);
        toast.success('Đã duyệt Post-race — Official + payout');
      }
      setSelected(null);
      load();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setActing(false);
    }
  };

  const handleReject = async () => {
    if (!selected) return;
    if (!rejectReason.trim()) {
      toast.error('Nhập lý do từ chối');
      return;
    }
    setActing(true);
    try {
      if (phase === 'prerace') {
        await refereeReportAdminApi.rejectPreRace(selected._id, rejectReason.trim());
      } else {
        await refereeReportAdminApi.reject(selected._id, rejectReason.trim());
      }
      toast.success('Đã từ chối biên bản');
      setRejectOpen(false);
      setRejectReason('');
      setSelected(null);
      load();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setActing(false);
    }
  };

  const reports = (data?.reports || []).filter((r) => {
    if (!search.trim()) return true;
    const name = (r.raceId as any)?.name?.toLowerCase() || '';
    const ref = (r.refereeId as any)?.fullName?.toLowerCase() || '';
    const q = search.toLowerCase();
    return name.includes(q) || ref.includes(q);
  });

  const pr = selected?.preRaceReport;
  const lateCount = pr?.lateScratchings?.length || 0;
  const incidentCount = selected?.incidents?.length || 0;

  const rowStatus = (r: AdminRefereeReport) =>
    phase === 'prerace' ? (r.preRaceStatus || 'draft') : r.status;

  const canAct = (r: AdminRefereeReport | null) => {
    if (!r) return false;
    const s = phase === 'prerace' ? (r.preRaceStatus || 'draft') : r.status;
    return s === 'pending_approval' || s === 'submitted';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Duyệt biên bản trọng tài</h1>
          <p className="text-sm text-slate-500 mt-1">
            {phase === 'prerace'
              ? 'Duyệt Pre-race để mở khóa nút chạy mô phỏng.'
              : 'Duyệt Post-race sẽ phát purse + settle cược và set Official.'}
          </p>
        </div>
        <button
          onClick={load}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <RefreshCw size={16} /> Làm mới
        </button>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => { setPhase('prerace'); setPage(1); setSelected(null); }}
          className={`rounded-lg px-3 py-2 text-sm font-bold ${
            phase === 'prerace' ? 'bg-amber-500 text-white' : 'bg-white border border-slate-200 text-slate-700'
          }`}
        >
          Pre-race chờ duyệt
        </button>
        <button
          type="button"
          onClick={() => { setPhase('postrace'); setPage(1); setSelected(null); }}
          className={`rounded-lg px-3 py-2 text-sm font-bold ${
            phase === 'postrace' ? 'bg-amber-500 text-white' : 'bg-white border border-slate-200 text-slate-700'
          }`}
        >
          Post-race chờ duyệt
        </button>
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm race / trọng tài..."
            className="pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-sm w-64"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
        >
          <option value="pending_approval">Chờ duyệt</option>
          <option value="approved">Đã duyệt</option>
          <option value="rejected">Từ chối</option>
          <option value="draft">Nháp</option>
          <option value="">Tất cả</option>
        </select>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
            <tr>
              <th className="text-left px-4 py-3 font-semibold">Cuộc đua</th>
              <th className="text-left px-4 py-3 font-semibold">Trọng tài</th>
              <th className="text-left px-4 py-3 font-semibold">Nộp lúc</th>
              <th className="text-left px-4 py-3 font-semibold">Trạng thái</th>
              <th className="text-right px-4 py-3 font-semibold">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-slate-400">
                  Đang tải...
                </td>
              </tr>
            ) : reports.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-slate-400">
                  <FileText className="mx-auto mb-2 opacity-40" />
                  Không có biên bản
                </td>
              </tr>
            ) : (
              reports.map((r) => {
                const s = rowStatus(r);
                return (
                  <tr key={r._id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">{(r.raceId as any)?.name}</div>
                      <div className="text-xs text-slate-500">
                        {(r.raceId as any)?.grade} · {(r.raceId as any)?.status}
                        {(r.raceId as any)?.preRaceApproved ? ' · Pre OK' : ''}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{(r.refereeId as any)?.fullName || '—'}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {phase === 'prerace'
                        ? (r.preRaceSubmittedAt ? new Date(r.preRaceSubmittedAt).toLocaleString('vi-VN') : '—')
                        : (r.submittedAt ? new Date(r.submittedAt).toLocaleString('vi-VN') : '—')}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2 py-1 rounded-md ${STATUS_COLOR[s] || STATUS_COLOR.draft}`}>
                        {STATUS_LABEL[s] || s}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => openDetail(r)}
                        className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-800"
                      >
                        <Eye size={14} /> Xem
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-slate-100">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-3 py-1 text-sm border rounded disabled:opacity-40"
            >
              Trước
            </button>
            <span className="text-sm text-slate-500">
              {page}/{data.totalPages}
            </span>
            <button
              disabled={page >= data.totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1 text-sm border rounded disabled:opacity-40"
            >
              Sau
            </button>
          </div>
        )}
      </div>

      <Modal
        open={!!selected}
        onClose={() => {
          setSelected(null);
          setRejectOpen(false);
        }}
        title={`${phase === 'prerace' ? 'Pre-race' : 'Post-race'} — ${(selected?.raceId as any)?.name || ''}`}
      >
        {selected && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg bg-slate-50 border border-slate-200 p-3">
                <div className="text-slate-500 text-xs">Late Scratchings</div>
                <div className="text-lg font-bold text-slate-900">{lateCount}</div>
              </div>
              <div className="rounded-lg bg-slate-50 border border-slate-200 p-3">
                <div className="text-slate-500 text-xs">Incidents</div>
                <div className="text-lg font-bold text-slate-900">{incidentCount}</div>
              </div>
            </div>

            <div className="text-sm space-y-1">
              <div>
                <span className="text-slate-500">Track Condition:</span>{' '}
                <strong>{pr?.trackCondition || 'Nil'}</strong>
                {pr?.trackConditionNote ? ` — ${pr.trackConditionNote}` : ''}
              </div>
              <div>
                <span className="text-slate-500">Trọng tài:</span> {(selected.refereeId as any)?.fullName}
              </div>
              <div>
                <span className="text-slate-500">Pre-race status:</span>{' '}
                {STATUS_LABEL[selected.preRaceStatus || 'draft'] || selected.preRaceStatus}
              </div>
              <div>
                <span className="text-slate-500">Post-race status:</span>{' '}
                {STATUS_LABEL[selected.status] || selected.status}
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-slate-800 mb-2">Late Scratchings</h4>
              {lateCount === 0 ? (
                <p className="text-sm italic text-slate-400">Nil</p>
              ) : (
                <ul className="text-sm space-y-1 list-disc pl-5">
                  {pr!.lateScratchings!.map((s, i) => (
                    <li key={i}>{s.label}</li>
                  ))}
                </ul>
              )}
            </div>

            {phase === 'postrace' && (
              <div>
                <h4 className="font-semibold text-slate-800 mb-2">Incidents</h4>
                {incidentCount === 0 ? (
                  <p className="text-sm italic text-slate-400">Nil</p>
                ) : (
                  <ul className="text-sm space-y-2">
                    {selected.incidents.map((inc) => (
                      <li key={inc._id} className="rounded border border-slate-200 p-2">
                        <div className="font-medium">{inc.type} · {inc.resolution?.verdict || inc.status || '—'}</div>
                        <div className="text-slate-600">{inc.description}</div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {canAct(selected) && (
              <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-200">
                <button
                  disabled={acting}
                  onClick={handleApprove}
                  className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  <CheckCircle size={16} /> Duyệt {phase === 'prerace' ? 'Pre-race' : 'Post-race'}
                </button>
                <button
                  disabled={acting}
                  onClick={() => setRejectOpen(true)}
                  className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                >
                  <XCircle size={16} /> Từ chối
                </button>
              </div>
            )}

            {rejectOpen && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 space-y-2">
                <label className="text-sm font-medium text-red-800">Lý do từ chối</label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={3}
                  className="w-full rounded-md border border-red-200 px-3 py-2 text-sm"
                  placeholder="Nhập lý do..."
                />
                <button
                  disabled={acting}
                  onClick={handleReject}
                  className="rounded-lg bg-red-700 px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-50"
                >
                  Xác nhận từ chối
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
