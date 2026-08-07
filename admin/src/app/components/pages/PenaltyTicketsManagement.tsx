import { useState, useEffect, useCallback } from 'react';
import { Search, RefreshCw, Filter, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { penaltyApi, type PenaltyTicket } from '../../api/penalty';
import { raceApi, type Race } from '../../api/race';

const fmtDateTime = (d: string) => d ? new Date(d).toLocaleString('vi-VN') : '-';

const STATUS_PILL: Record<string, string> = {
  open:   'bg-red-50 text-red-700 border border-red-200',
  paid:   'bg-emerald-50 text-emerald-700 border border-emerald-200',
  waived: 'bg-slate-50 text-slate-700 border border-slate-200',
};

const STATUS_LABEL: Record<string, string> = {
  open: 'Chưa nộp',
  paid: 'Đã nộp',
  waived: 'Đã hủy',
};

export default function PenaltyTicketsManagement() {
  const [tickets, setTickets] = useState<PenaltyTicket[]>([]);
  const [total, setTotal] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterRaceId, setFilterRaceId] = useState('');
  const [search, setSearch] = useState('');
  const [races, setRaces] = useState<Race[]>([]);

  const loadTickets = useCallback(async () => {
    setLoading(true);
    try {
      const res = await penaltyApi.getAll({
        page, limit: 20,
        status: filterStatus || undefined,
        raceId: filterRaceId || undefined,
      });
      setTickets(res.tickets ?? []);
      setTotal(res.total);
      setTotalAmount(res.totalAmount);
      setTotalPages(res.totalPages);
    } catch (err: any) { toast.error(err.message); }
    finally { setLoading(false); }
  }, [page, filterStatus, filterRaceId]);

  const loadRaces = useCallback(async () => {
    try {
      const res = await raceApi.list({ limit: 100 });
      setRaces(res.races ?? []);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { loadTickets(); }, [loadTickets]);
  useEffect(() => { loadRaces(); }, [loadRaces]);
  useEffect(() => { setPage(1); }, [filterStatus, filterRaceId]);

  const filteredTickets = search
    ? tickets.filter(t => {
        const race = t.raceId as any;
        const horse = t.horseId as any;
        const user = t.userId as any;
        return (
          (race?.name || '').toLowerCase().includes(search.toLowerCase()) ||
          (horse?.name || '').toLowerCase().includes(search.toLowerCase()) ||
          (user?.fullName || '').toLowerCase().includes(search.toLowerCase()) ||
          (user?.email || '').toLowerCase().includes(search.toLowerCase())
        );
      })
    : tickets;

  return (
    <>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Quản lý Vé Phạt</h2>
          <p className="mt-1 text-sm text-slate-500">
            Theo dõi danh sách vé phạt của người chơi.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={loadTickets}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white py-2 px-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition shadow-sm disabled:opacity-50"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Làm mới
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm flex flex-col min-h-[500px]">
        <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 bg-slate-50/50 px-5 py-4">
          <div className="relative flex-1 min-w-[250px] max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm người dùng, ngựa, cuộc đua..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full rounded-md border border-slate-200 bg-white py-2 pl-9 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter size={16} className="text-slate-400 shrink-0 ml-2" />
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="rounded-md border border-slate-200 bg-white py-2 px-3 text-sm outline-none focus:border-blue-500 shadow-sm"
            >
              <option value="">Trạng thái: Tất cả</option>
              {['open', 'paid', 'waived'].map(s => (
                <option key={s} value={s}>{STATUS_LABEL[s]}</option>
              ))}
            </select>

            <select
              value={filterRaceId}
              onChange={e => setFilterRaceId(e.target.value)}
              className="rounded-md border border-slate-200 bg-white py-2 px-3 text-sm outline-none focus:border-blue-500 shadow-sm max-w-[250px]"
            >
              <option value="">Cuộc đua: Tất cả</option>
              {races.map(r => <option key={r._id} value={r._id}>{r.name}</option>)}
            </select>
          </div>

          <div className="ml-auto flex items-center gap-4">
            <div className="flex flex-col items-end">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tổng tiền phạt</span>
              <span className="text-sm font-bold text-red-600">{totalAmount.toLocaleString('vi-VN')} $</span>
            </div>
            <div className="h-8 w-px bg-slate-200"></div>
            <div className="flex flex-col items-end">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tổng số vé</span>
              <span className="text-sm font-bold text-slate-900">{total.toLocaleString('vi-VN')}</span>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center py-20 gap-3">
            <RefreshCw className="animate-spin text-slate-300" size={32} />
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-20 gap-4">
            <div className="h-16 w-16 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center">
              <AlertTriangle size={32} className="text-slate-300" />
            </div>
            <div className="text-center">
              <p className="text-slate-600 font-semibold mb-1">Không có dữ liệu vé phạt</p>
              <p className="text-sm text-slate-400 font-medium">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="sticky top-0 bg-slate-50 shadow-sm z-10 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-5 text-xs font-bold uppercase tracking-wider text-slate-400">Người nộp phạt</th>
                  <th className="py-3 px-5 text-xs font-bold uppercase tracking-wider text-slate-400">Cuộc đua</th>
                  <th className="py-3 px-5 text-xs font-bold uppercase tracking-wider text-slate-400">Ngựa</th>
                  <th className="py-3 px-5 text-xs font-bold uppercase tracking-wider text-slate-400 text-right">Mức phạt</th>
                  <th className="py-3 px-5 text-xs font-bold uppercase tracking-wider text-slate-400 text-center">Trạng thái</th>
                  <th className="py-3 px-5 text-xs font-bold uppercase tracking-wider text-slate-400 text-right">Ngày phạt / Đã nộp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTickets.map((ticket) => {
                  const user = ticket.userId as any;
                  const race = ticket.raceId as any;
                  const horse = ticket.horseId as any;
                  return (
                    <tr key={ticket._id} className="hover:bg-slate-50/50 bg-white transition-colors">
                      <td className="py-3 px-5">
                        <p className="font-semibold text-slate-900 text-[13px]">{user?.fullName || '-'}</p>
                        <p className="text-[11px] font-medium text-slate-500 mt-0.5">{user?.email || ''}</p>
                      </td>
                      <td className="py-3 px-5">
                        <p className="font-semibold text-slate-900 text-[13px]">{race?.name || '-'}</p>
                        {race?.grade && (
                          <span className="inline-block mt-1 rounded bg-slate-100 border border-slate-200 px-1.5 py-0.5 text-[10px] font-bold text-slate-600 shadow-sm">
                            {race.grade}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-5">
                        <p className="font-semibold text-slate-900 text-[13px]">{horse?.name || '-'}</p>
                      </td>
                      <td className="py-3 px-5 text-right">
                        <p className="font-bold text-slate-900 text-[13px]">{ticket.amount.toLocaleString('vi-VN')} $</p>
                      </td>
                      <td className="py-3 px-5 text-center">
                        <span className={`inline-block rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider shadow-sm ${STATUS_PILL[ticket.status] || 'bg-slate-50 border border-slate-200 text-slate-500'}`}>
                          {STATUS_LABEL[ticket.status] || ticket.status}
                        </span>
                      </td>
                      <td className="py-3 px-5 text-right">
                        <p className="text-[11px] font-medium text-slate-500">Phạt: {fmtDateTime(ticket.createdAt)}</p>
                        {ticket.paidAt && (
                          <p className="text-[11px] font-bold text-emerald-600 mt-0.5">Đã nộp: {fmtDateTime(ticket.paidAt)}</p>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-200 bg-white px-5 py-3">
            <p className="text-xs font-medium text-slate-500">
              Trang <span className="font-bold text-slate-900">{page}</span> / {totalPages}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(p => p - 1)}
                disabled={page === 1}
                className="flex h-7 w-7 items-center justify-center rounded border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition shadow-sm"
              >
                <ChevronLeft size={14} />
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let p = i + 1;
                if (totalPages > 5) {
                  if (page <= 3) p = i + 1;
                  else if (page >= totalPages - 2) p = totalPages - 4 + i;
                  else p = page - 2 + i;
                }
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`flex h-7 w-7 items-center justify-center rounded text-xs font-bold transition shadow-sm ${
                      page === p
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={page >= totalPages}
                className="flex h-7 w-7 items-center justify-center rounded border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition shadow-sm"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
