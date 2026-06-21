import { useState, useEffect, useCallback } from 'react';
import { Eye, Activity, XCircle, AlertTriangle, RefreshCw, X, ChevronLeft, ChevronRight, FileCheck } from 'lucide-react';
import { toast } from 'sonner';
import { registrationApi, type RegistrationListResponse } from '../../api/registration';
import type { Registration } from '../../api/race';

const STATUS_COLOR: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
  cancelled: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  disqualified: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
};
const STATUS_LABEL: Record<string, string> = {
  active: 'Đang hoạt động', cancelled: 'Đã hủy', disqualified: 'Bị loại',
};

const PRECHECK_COLOR: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
  passed: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
  failed: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
};
const PRECHECK_LABEL: Record<string, string> = {
  pending: 'Chờ kiểm tra', passed: 'Đã qua', failed: 'Không qua',
};

const fmtDate = (d?: string) => d ? new Date(d).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' }) : '-';

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

export default function RegistrationApproval() {
  const [tab, setTab] = useState(0);
  const [data, setData] = useState<RegistrationListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Registration | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const statusFilter = ['active', 'cancelled', 'disqualified'][tab] as Registration['status'];

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await registrationApi.list({ status: statusFilter, page, limit: 20 });
      setData(res);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, page]);

  useEffect(() => { setPage(1); }, [tab]);
  useEffect(() => { load(); }, [load]);

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
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-title-md2 font-semibold text-black dark:text-white">
          Quản lý đăng ký tham gia
        </h2>
        <button
          onClick={load}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2.5 rounded-md border border-slate-300 bg-white py-2 px-4 text-center font-medium text-black hover:bg-slate-50 transition dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700 disabled:opacity-50"
        >
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          Làm mới
        </button>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-[#1c2434] mb-6 overflow-hidden">
        <div className="flex border-b border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setTab(0)}
            className={`flex items-center gap-2 py-4 px-6 text-sm font-medium transition-colors ${tab === 0 ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-500 bg-blue-50/50 dark:bg-blue-900/10' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'}`}
          >
            <Activity size={18} />
            Đang hoạt động
          </button>
          <button
            onClick={() => setTab(1)}
            className={`flex items-center gap-2 py-4 px-6 text-sm font-medium transition-colors ${tab === 1 ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-500 bg-blue-50/50 dark:bg-blue-900/10' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'}`}
          >
            <XCircle size={18} />
            Đã hủy
          </button>
          <button
            onClick={() => setTab(2)}
            className={`flex items-center gap-2 py-4 px-6 text-sm font-medium transition-colors ${tab === 2 ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-500 bg-blue-50/50 dark:bg-blue-900/10' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'}`}
          >
            <AlertTriangle size={18} />
            Bị loại (DQ)
          </button>
        </div>

        <div className="max-w-full overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="bg-slate-50 text-left dark:bg-slate-800">
                <th className="py-4 px-4 font-semibold text-black dark:text-white border-b border-slate-200 dark:border-slate-700 xl:pl-6">Ngựa</th>
                <th className="py-4 px-4 font-semibold text-black dark:text-white border-b border-slate-200 dark:border-slate-700">Chủ sở hữu</th>
                <th className="py-4 px-4 font-semibold text-black dark:text-white border-b border-slate-200 dark:border-slate-700">Jockey</th>
                <th className="py-4 px-4 font-semibold text-black dark:text-white border-b border-slate-200 dark:border-slate-700">Cuộc đua</th>
                <th className="py-4 px-4 font-semibold text-black dark:text-white border-b border-slate-200 dark:border-slate-700">Phí đã nộp</th>
                <th className="py-4 px-4 font-semibold text-black dark:text-white border-b border-slate-200 dark:border-slate-700 text-center">Kiểm tra ngựa</th>
                <th className="py-4 px-4 font-semibold text-black dark:text-white border-b border-slate-200 dark:border-slate-700 text-center">Trạng thái</th>
                <th className="py-4 px-4 font-semibold text-black dark:text-white border-b border-slate-200 dark:border-slate-700 text-right xl:pr-6">Chi tiết</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-slate-200 dark:border-slate-700">
                    {Array.from({ length: 8 }).map((__, j) => (
                      <td key={j} className="py-4 px-4 sm:px-6"><div className="h-5 w-full animate-pulse rounded bg-slate-200 dark:bg-slate-700"></div></td>
                    ))}
                  </tr>
                ))
              ) : !data?.registrations?.length ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-slate-500">
                    <div className="flex flex-col items-center justify-center">
                      <FileCheck size={40} className="mb-3 text-slate-300 dark:text-slate-600" />
                      Không có dữ liệu đăng ký
                    </div>
                  </td>
                </tr>
              ) : (
                data.registrations.map(reg => (
                  <tr key={reg._id} className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-3 px-4 xl:pl-6">
                      <p className="font-semibold text-black dark:text-white flex items-center gap-1.5">
                        <span className="text-lg">🐴</span> {typeof reg.horseId === 'object' ? reg.horseId.name : reg.horseId}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        {typeof reg.horseId === 'object' ? `${reg.horseId.currentGrade} · ${reg.horseId.breed}` : ''}
                      </p>
                    </td>
                    <td className="py-3 px-4 text-sm text-black dark:text-white">
                      {typeof reg.ownerId === 'object' ? reg.ownerId.fullName : '-'}
                    </td>
                    <td className="py-3 px-4">
                      {typeof reg.jockeyId === 'object' && reg.jockeyId ? (
                        <span className="text-sm text-black dark:text-white">{reg.jockeyId.fullName}</span>
                      ) : (
                        <span className="text-xs font-medium text-amber-500 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 dark:bg-amber-900/30 dark:border-amber-800">Chưa gán</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-sm font-medium text-black dark:text-white">{typeof reg.raceId === 'object' ? reg.raceId.name : '-'}</p>
                      {typeof reg.raceId === 'object' && (
                        <span className="inline-block mt-1 rounded border border-slate-300 bg-slate-50 px-1.5 py-0.5 text-[10px] font-medium text-slate-600 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300">
                          {reg.raceId.grade}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-sm font-bold text-slate-700 dark:text-slate-300">
                      {reg.feePaid?.toLocaleString('vi-VN')} coins
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${PRECHECK_COLOR[reg.preCheckResult?.status || 'pending'] || PRECHECK_COLOR.pending}`}>
                        {PRECHECK_LABEL[reg.preCheckResult?.status || 'pending']}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_COLOR[reg.status] || ''}`}>
                        {STATUS_LABEL[reg.status]}
                      </span>
                      {reg.refundAmount > 0 && (
                        <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-1">
                          Hoàn: {reg.refundAmount.toLocaleString('vi-VN')} coins
                        </p>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right xl:pr-6">
                      <button
                        onClick={() => handleView(reg)}
                        className="inline-flex items-center gap-1.5 rounded-md bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50 transition"
                      >
                        <Eye size={14} /> Chi tiết
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-200 px-5 py-4 dark:border-slate-700 sm:px-7.5">
            <p className="text-sm text-slate-500 hidden sm:block">
              Đang hiển thị trang {page} trên {data.totalPages}
            </p>
            <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
              <button 
                onClick={() => setPage(p => p - 1)} 
                disabled={page === 1}
                className="flex items-center gap-1 rounded bg-slate-100 py-1.5 px-3 text-sm font-medium text-slate-600 hover:bg-slate-200 disabled:opacity-50 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition"
              >
                <ChevronLeft size={16} /> Trước
              </button>
              <p className="text-sm text-slate-500 sm:hidden">
                {page} / {data.totalPages}
              </p>
              <button 
                onClick={() => setPage(p => p + 1)} 
                disabled={page >= data.totalPages}
                className="flex items-center gap-1 rounded bg-slate-100 py-1.5 px-3 text-sm font-medium text-slate-600 hover:bg-slate-200 disabled:opacity-50 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition"
              >
                Sau <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Dialog Modal */}
      <Modal open={dialogOpen} onClose={() => setDialogOpen(false)} title="Chi tiết đăng ký" maxWidth="max-w-3xl">
        {selected && (
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5 rounded-lg border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-[#243045]">
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">Ngựa</p>
                <p className="font-semibold text-black dark:text-white">
                  {typeof selected.horseId === 'object' ? `${selected.horseId.name} (${selected.horseId.currentGrade})` : '-'}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">Chủ sở hữu</p>
                <p className="font-semibold text-black dark:text-white">
                  {typeof selected.ownerId === 'object' ? selected.ownerId.fullName : '-'}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">{typeof selected.ownerId === 'object' ? selected.ownerId.email : ''}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">Jockey</p>
                {typeof selected.jockeyId === 'object' && selected.jockeyId ? (
                  <p className="font-semibold text-black dark:text-white">{selected.jockeyId.fullName}</p>
                ) : (
                  <span className="inline-block rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">Chưa gán</span>
                )}
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">Cuộc đua</p>
                <p className="font-semibold text-black dark:text-white">
                  {typeof selected.raceId === 'object' ? selected.raceId.name : '-'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-700">
                <p className="text-xs text-slate-500 mb-1">Phí đã nộp</p>
                <p className="text-lg font-bold text-black dark:text-white">{selected.feePaid?.toLocaleString('vi-VN')} coins</p>
              </div>
              <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-700">
                <p className="text-xs text-slate-500 mb-1">Hoàn phí</p>
                <p className={`text-lg font-bold ${selected.refundAmount > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-black dark:text-white'}`}>
                  {(selected.refundAmount || 0).toLocaleString('vi-VN')} coins
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-700">
                <p className="text-xs text-slate-500 mb-2">Trạng thái</p>
                <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_COLOR[selected.status] || ''}`}>
                  {STATUS_LABEL[selected.status]}
                </span>
              </div>
              <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-700">
                <p className="text-xs text-slate-500 mb-2">Kiểm tra ngựa</p>
                <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${PRECHECK_COLOR[selected.preCheckResult?.status || 'pending'] || PRECHECK_COLOR.pending}`}>
                  {PRECHECK_LABEL[selected.preCheckResult?.status || 'pending']}
                </span>
              </div>
            </div>

            {selected.preCheckResult?.note && (
              <div>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                  <Activity size={16} /> Ghi chú kiểm tra thú y
                </p>
                <div className="rounded-lg bg-amber-50 p-4 text-sm text-amber-900 border border-amber-200 dark:bg-amber-900/20 dark:border-amber-800/50 dark:text-amber-200 italic">
                  "{selected.preCheckResult.note}"
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-6 mt-2 border-t border-slate-200 pt-5 dark:border-slate-700">
              <div>
                <p className="text-xs text-slate-500 mb-1">Ngày đăng ký</p>
                <p className="text-sm font-medium text-black dark:text-white">{fmtDate(selected.registeredAt)}</p>
              </div>
              {selected.cancelledAt && (
                <div>
                  <p className="text-xs text-slate-500 mb-1">Ngày hủy</p>
                  <p className="text-sm font-medium text-red-600 dark:text-red-400">{fmtDate(selected.cancelledAt)}</p>
                </div>
              )}
            </div>
          </div>
        )}
        <div className="mt-8 flex justify-end gap-3">
          <button onClick={() => setDialogOpen(false)} className="rounded border border-slate-300 py-2 px-6 font-medium text-black hover:bg-slate-50 dark:border-slate-600 dark:text-white dark:hover:bg-slate-800 transition">
            Đóng
          </button>
        </div>
      </Modal>
    </>
  );
}
