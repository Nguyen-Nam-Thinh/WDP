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

const TRACK_LABEL: Record<string, string> = {
  Firm: 'Cứng (Firm)',
  Good: 'Tốt (Good)',
  Soft: 'Mềm (Soft)',
  Heavy: 'Nặng (Heavy)',
  Synthetic: 'Nhân tạo (Synthetic)',
};

const FAIL_CATEGORY_LABEL: Record<string, string> = {
  veterinary: 'Thú y',
  jockey: 'Kỵ sĩ',
  gear: 'Trang bị',
  administrative: 'Hành chính',
};

const INCIDENT_TYPE_LABEL: Record<string, string> = {
  interference: 'Cản trở',
  doping: 'Doping',
  equipment_violation: 'Vi phạm trang bị',
  jockey_violation: 'Vi phạm kỵ sĩ',
  other: 'Khác',
};

const VERDICT_LABEL: Record<string, string> = {
  none: 'Không xử phạt',
  warning: 'Cảnh cáo',
  fine: 'Phạt tiền',
  disqualified: 'Loại (DQ)',
};

const REASON_CODE_LABEL: Record<string, string> = {
  interference: 'Cản trở',
  whip: 'Roi',
  careless: 'Bất cẩn',
  late: 'Muộn',
  other: 'Khác',
};

const VET_ORDER_LABEL: Record<string, string> = {
  blood: 'Máu',
  urine: 'Nước tiểu',
  endoscopy: 'Nội soi',
  clinical: 'Lâm sàng',
};

const ROLE_LABEL: Record<string, string> = {
  owner: 'Chủ ngựa',
  jockey: 'Kỵ sĩ',
};

function emptyText(value?: string | null) {
  const v = (value || '').trim();
  return v ? v : 'Chưa có';
}

function formatDt(value?: string | null) {
  if (!value) return '—';
  return new Date(value).toLocaleString('vi-VN');
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h4 className="font-semibold text-slate-800 border-b border-slate-100 pb-1">{title}</h4>
      {children}
    </section>
  );
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[140px_1fr] gap-2 text-sm py-0.5">
      <span className="text-slate-500">{label}</span>
      <span className="text-slate-900 whitespace-pre-wrap break-words">{value}</span>
    </div>
  );
}

function StringList({ items }: { items?: string[] }) {
  if (!items?.length) {
    return <p className="text-sm italic text-slate-400">Chưa có</p>;
  }
  return (
    <ul className="text-sm space-y-1 list-disc pl-5 text-slate-800">
      {items.map((item, i) => (
        <li key={`${item}-${i}`}>{item}</li>
      ))}
    </ul>
  );
}

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
      <div className="w-full max-w-4xl rounded-xl bg-white shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
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
        toast.success('Đã duyệt trước trận - có thể chạy mô phỏng');
      } else {
        await refereeReportAdminApi.approve(selected._id);
        toast.success('Đã duyệt sau trận — Official, chia tiền và gửi xử phạt');
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
          Biên bản trước trận đấu
        </button>
        <button
          type="button"
          onClick={() => { setPhase('postrace'); setPage(1); setSelected(null); }}
          className={`rounded-lg px-3 py-2 text-sm font-bold ${
            phase === 'postrace' ? 'bg-amber-500 text-white' : 'bg-white border border-slate-200 text-slate-700'
          }`}
        >
          Biên bản sau trận đấu
        </button>
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm cuộc đua / trọng tài..."
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
                      <div className="flex items-center gap-2 mt-1">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-100 text-blue-700">
                          {(r.raceId as any)?.grade || '—'}
                        </span>
                        <span className="text-xs text-slate-500">
                          {(() => {
                            const st = (r.raceId as any)?.status;
                            if (st === 'open') return 'Mở đăng ký';
                            if (st === 'closed') return 'Đóng đăng ký';
                            if (st === 'pre_check') return 'Kiểm tra';
                            if (st === 'running') return 'Đang đua';
                            if (st === 'finished') return 'Đã xong';
                            if (st === 'cancelled') return 'Đã huỷ';
                            return st || '—';
                          })()}
                        </span>
                        {(r.raceId as any)?.preRaceApproved && (
                          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 flex items-center gap-1">
                            <CheckCircle size={10} /> Đã duyệt Trước trận
                          </span>
                        )}
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
        title={`Biên bản ${phase === 'prerace' ? 'trước trận' : 'sau trận'} — ${(selected?.raceId as any)?.name || ''}`}
      >
        {selected && (
          <div className="space-y-5">
            <Section title="Thông tin chung">
              <DetailRow label="Cuộc đua" value={(selected.raceId as any)?.name || '—'} />
              <DetailRow
                label="Hạng"
                value={`${(selected.raceId as any)?.grade || '—'}`}
              />
              <DetailRow label="Trọng tài" value={(selected.refereeId as any)?.fullName || '—'} />
              <DetailRow
                label="Email trọng tài"
                value={(selected.refereeId as any)?.email || '—'}
              />
              {phase === 'prerace' ? (
                <>
                  <DetailRow
                    label="Trước trận"
                    value={STATUS_LABEL[selected.preRaceStatus || 'draft'] || selected.preRaceStatus}
                  />
                  <DetailRow label="Nộp lúc" value={formatDt(selected.preRaceSubmittedAt)} />
                  <DetailRow label="Duyệt lúc" value={formatDt(selected.preRaceReviewedAt)} />
                  {selected.preRaceRejectReason ? (
                    <DetailRow label="Lý do từ chối" value={selected.preRaceRejectReason} />
                  ) : null}
                </>
              ) : (
                <>
                  <DetailRow label="Nộp lúc" value={formatDt(selected.submittedAt)} />
                  <DetailRow label="Duyệt lúc" value={formatDt(selected.reviewedAt)} />
                  {selected.rejectReason ? (
                    <DetailRow label="Lý do từ chối" value={selected.rejectReason} />
                  ) : null}
                </>
              )}
            </Section>

            {phase === 'prerace' && (
              <>
                <Section title="Điều kiện đường đua">
                  <DetailRow
                    label="Track"
                    value={
                      pr?.trackCondition
                        ? TRACK_LABEL[pr.trackCondition] || pr.trackCondition
                        : 'Chưa có'
                    }
                  />
                  <DetailRow label="Ghi chú track" value={emptyText(pr?.trackConditionNote)} />
                </Section>

                <Section title={`Rút muộn (${lateCount})`}>
                  {lateCount === 0 ? (
                    <p className="text-sm italic text-slate-400">Không có</p>
                  ) : (
                    <ul className="space-y-2">
                      {pr!.lateScratchings!.map((s, i) => (
                        <li key={s._id || i} className="rounded-lg border border-slate-200 p-3 text-sm">
                          <div className="font-medium text-slate-900">{s.label}</div>
                          <div className="text-slate-600 mt-1">
                            Loại:{' '}
                            {FAIL_CATEGORY_LABEL[s.category || ''] || s.category || '—'}
                          </div>
                          <div className="text-slate-600">Ghi chú: {emptyText(s.note)}</div>
                          <div className="text-xs text-slate-400 mt-1">
                            {formatDt(s.scratchedAt)}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </Section>

                <Section title="Đổi kỵ sĩ">
                  <StringList items={pr?.riderChanges} />
                </Section>
                <Section title="Đổi trang bị">
                  <StringList items={pr?.gearChanges} />
                </Section>
                <Section title="Kiểm tra thú y">
                  <StringList items={pr?.vetChecks} />
                </Section>
              </>
            )}

            {phase === 'postrace' && (
              <>
                <Section title="Ghi chú chung">
                  <p className="text-sm text-slate-800 whitespace-pre-wrap">
                    {emptyText(selected.overallNotes)}
                  </p>
                </Section>

                <Section title={`Khiếu nại từ người tham gia (${selected.complaints?.length || 0})`}>
                  {!selected.complaints?.length ? (
                    <p className="text-sm italic text-slate-400">Không có khiếu nại</p>
                  ) : (
                    <ul className="space-y-2">
                      {selected.complaints.map((c, i) => (
                        <li key={c._id || i} className="rounded-lg border border-slate-200 p-3 text-sm">
                          <div className="flex justify-between items-start">
                            <div className="font-medium text-slate-900">
                              Từ: {c.submittedBy?.fullName || c.submittedBy} ({c.role === 'owner' ? 'Chủ ngựa' : 'Nài ngựa'})
                            </div>
                            <span
                              className={`px-2 py-0.5 rounded text-xs font-medium ${
                                c.status === 'approved' ? 'bg-green-100 text-green-700' :
                                c.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                'bg-yellow-100 text-yellow-700'
                              }`}
                            >
                              {c.status === 'approved' ? 'Đã duyệt' : c.status === 'rejected' ? 'Từ chối' : 'Chờ duyệt'}
                            </span>
                          </div>
                          <div className="text-slate-600 mt-1">Ngựa bị khiếu nại: {c.targetHorseId?.name || c.targetHorseId}</div>
                          <div className="text-slate-700 mt-1 whitespace-pre-wrap">
                            Lý do: {c.reason}
                          </div>
                          {c.refereeNote && (
                            <div className="text-slate-700 mt-1">
                              <strong>Ghi chú TT:</strong> {c.refereeNote}
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </Section>

                <Section title={`Giải thích thành tích (${selected.postRaceReport?.performanceExplanations?.length || 0})`}>
                  {!selected.postRaceReport?.performanceExplanations?.length ? (
                    <p className="text-sm italic text-slate-400">Không có</p>
                  ) : (
                    <ul className="space-y-2">
                      {selected.postRaceReport.performanceExplanations.map((p, i) => (
                        <li key={p._id || i} className="rounded-lg border border-slate-200 p-3 text-sm">
                          <div className="font-medium text-slate-900">{p.label}</div>
                          <div className="text-slate-600 mt-1">
                            Triệu tập:{' '}
                            {(p.summonedRoles || [])
                              .map((r) => ROLE_LABEL[r] || r)
                              .join(', ') || '—'}
                          </div>
                          <div className="text-slate-700 mt-1 whitespace-pre-wrap">
                            {emptyText(p.explanation)}
                          </div>
                          <div className="text-xs text-slate-400 mt-1">{formatDt(p.recordedAt)}</div>
                        </li>
                      ))}
                    </ul>
                  )}
                </Section>

                <Section title={`Lệnh thú y (${selected.postRaceReport?.vetOrders?.length || 0})`}>
                  {!selected.postRaceReport?.vetOrders?.length ? (
                    <p className="text-sm italic text-slate-400">Không có</p>
                  ) : (
                    <ul className="space-y-2">
                      {selected.postRaceReport.vetOrders.map((v, i) => (
                        <li key={v._id || i} className="rounded-lg border border-slate-200 p-3 text-sm">
                          <div className="font-medium text-slate-900">{v.label}</div>
                          <div className="text-slate-600 mt-1">
                            Loại: {VET_ORDER_LABEL[v.orderType] || v.orderType}
                          </div>
                          <div className="text-slate-700">Ghi chú: {emptyText(v.note)}</div>
                          <div className="text-xs text-slate-400 mt-1">{formatDt(v.orderedAt)}</div>
                        </li>
                      ))}
                    </ul>
                  )}
                </Section>

                <Section title={`Xử phạt / sự cố (${incidentCount})`}>
                  {incidentCount === 0 ? (
                    <p className="text-sm italic text-slate-400">Không có</p>
                  ) : (
                    <ul className="space-y-3">
                      {selected.incidents.map((inc) => {
                        const res = inc.resolution;
                        const horseName =
                          typeof inc.horseId === 'object' && inc.horseId
                            ? inc.horseId.name
                            : null;
                        const typeLabel = INCIDENT_TYPE_LABEL[inc.type] || inc.type;
                        return (
                          <li key={inc._id} className="rounded-lg border border-slate-200 p-3 text-sm space-y-1.5">
                            <div className="font-semibold text-slate-900">
                              Lỗi vi phạm: {typeLabel} - Tên ngựa: {horseName || '—'}
                            </div>
                            <DetailRow label="Trạng thái" value={inc.status === 'resolved' ? 'Đã xử lý' : 'Nháp'} />
                            {inc.action ? <DetailRow label="Hành động" value={inc.action} /> : null}
                            <DetailRow label="Ghi nhận" value={formatDt(inc.recordedAt)} />

                            <div className="mt-2 rounded-md bg-amber-50/60 border border-amber-100 p-2 space-y-1">
                              <div className="text-xs font-semibold text-amber-800 uppercase">Xử lý</div>
                              <DetailRow
                                label="Kết luận"
                                value={
                                  res?.verdict
                                    ? VERDICT_LABEL[res.verdict] || res.verdict
                                    : 'Chưa có'
                                }
                              />
                              {res?.verdict === 'fine' && (
                                <>
                                  <DetailRow
                                    label="Số tiền"
                                    value={
                                      res.fineAmount != null
                                        ? `${Number(res.fineAmount).toLocaleString('vi-VN')} coins`
                                        : '—'
                                    }
                                  />
                                  <DetailRow
                                    label="Đối tượng"
                                    value={
                                      res.fineTargetRole
                                        ? ROLE_LABEL[res.fineTargetRole] || res.fineTargetRole
                                        : '—'
                                    }
                                  />
                                </>
                              )}
                              {res?.reasonCode ? (
                                <DetailRow
                                  label="Mã lý do"
                                  value={REASON_CODE_LABEL[res.reasonCode] || res.reasonCode}
                                />
                              ) : null}
                              {res?.suspensionDays != null && res.suspensionDays > 0 ? (
                                <DetailRow label="Treo giò" value={`${res.suspensionDays} ngày`} />
                              ) : null}
                              <DetailRow label="Ghi chú" value={emptyText(res?.note)} />
                              <DetailRow label="Xử lý lúc" value={formatDt(res?.resolvedAt)} />
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </Section>
              </>
            )}

            {canAct(selected) && (
              <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-200">
                <button
                  disabled={acting}
                  onClick={handleApprove}
                  className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  <CheckCircle size={16} /> Duyệt {phase === 'prerace' ? 'trước trận' : 'sau trận'}
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
