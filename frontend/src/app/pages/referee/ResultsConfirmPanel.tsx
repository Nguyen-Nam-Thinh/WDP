import { useCallback, useEffect, useMemo, useState } from 'react';
import { CheckCircle, Search, Trophy, AlertTriangle } from 'lucide-react';
import { Button, Chip, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions, TextField } from '@mui/material';
import { toast } from 'sonner';
import { refereeApi } from '../../api/referee';
import { raceApi, type RaceResultEntry } from '../../api/race';

interface Props {
  token: string;
  races: any[];
  loading: boolean;
  onConfirmed?: () => void;
  readOnly?: boolean;
}

function formatFinishTime(ms: number): string {
  if (!Number.isFinite(ms)) return '—';
  const s = ms / 1000;
  return `${s.toFixed(2)}s`;
}

export function ResultsConfirmPanel({ token, races, loading, onConfirmed, readOnly }: Props) {
  const finished = races.filter((r) => r.status === 'finished');
  const [selected, setSelected] = useState<any | null>(null);
  const [results, setResults] = useState<RaceResultEntry[]>([]);
  const [loadingResults, setLoadingResults] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [search, setSearch] = useState('');

  // Complaint state
  const [complaintModalOpen, setComplaintModalOpen] = useState(false);
  const [complaintTarget, setComplaintTarget] = useState<RaceResultEntry | null>(null);
  const [complaintReason, setComplaintReason] = useState("");
  const [submittingComplaint, setSubmittingComplaint] = useState(false);

  const handleSubmitComplaint = async () => {
    if (!selected || !complaintTarget) return;
    if (!complaintReason.trim()) { toast.error("Vui lòng nhập lý do"); return; }
    setSubmittingComplaint(true);
    try {
      await raceApi.submitComplaint(token, selected._id, { targetHorseId: complaintTarget.horseId._id, reason: complaintReason });
      toast.success("Đã gửi khiếu nại thành công");
      setComplaintModalOpen(false);
      setComplaintReason("");
      setComplaintTarget(null);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmittingComplaint(false);
    }
  };

  const filteredFinished = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return finished;
    return finished.filter((r) =>
      String(r.name || '').toLowerCase().includes(q)
      || String(r.grade || '').toLowerCase().includes(q),
    );
  }, [finished, search]);

  const openRace = useCallback(async (race: any) => {
    setSelected(race);
    setLoadingResults(true);
    setResults([]);
    try {
      const data = await raceApi.getRaceResults(token, race._id);
      setResults(data.results || []);
      if (data.race) {
        setSelected({ ...race, ...data.race });
      }
    } catch (err: any) {
      toast.error(err.message);
      setSelected(null);
    } finally {
      setLoadingResults(false);
    }
  }, [token]);

  useEffect(() => {
    if (!selected) return;
    const updated = races.find((r) => r._id === selected._id);
    if (updated) {
      setSelected((prev: any) => (prev ? { ...prev, ...updated } : prev));
    }
  }, [races, selected?._id]);

  const handleConfirm = async () => {
    if (!selected || !token) return;
    setConfirming(true);
    try {
      const race = await refereeApi.confirmResults(token, selected._id);
      setSelected({ ...selected, ...race });
      toast.success('Đã xác nhận kết quả (chưa Official — chờ duyệt báo cáo)');
      onConfirmed?.();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setConfirming(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <CircularProgress sx={{ color: '#C9A227' }} />
      </div>
    );
  }

  if (!selected) {
    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h2 className="font-serif text-3xl font-bold text-foreground mb-2">
              {readOnly ? 'Kết quả cuộc đua' : 'Xác nhận kết quả'}
            </h2>
            
          </div>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm theo tên cuộc đua..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-slate-900 border border-border rounded-lg pl-9 pr-4 py-2 text-foreground placeholder-slate-500 focus:outline-none focus:border-[#C9A227] text-sm w-56"
            />
          </div>
        </div>
        {finished.length === 0 ? (
          <div className="bg-card rounded-2xl border border-border p-12 text-center">
            <Trophy className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">Chưa có cuộc đua finished nào</p>
          </div>
        ) : filteredFinished.length === 0 ? (
          <div className="bg-card rounded-2xl border border-border p-12 text-center">
            <Search className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">Không tìm thấy cuộc đua phù hợp</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredFinished.map((race) => {
              const confirmed = !!race.resultsConfirmedAt;
              return (
                <div
                  key={race._id}
                  className="bg-card border border-border rounded-2xl p-6 hover:border-[#C9A227]/30 transition-all"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="font-serif text-xl font-bold text-foreground">{race.name}</h3>
                        <Chip
                          label={race.grade}
                          size="small"
                          sx={{ bgcolor: '#C9A227', color: '#23201A', fontWeight: 'bold', fontSize: '0.7rem' }}
                        />
                        {!race.isOfficial && (
                          <Chip
                            label="Tạm thời"
                            size="small"
                            sx={{
                              bgcolor: 'rgba(245,158,11,0.15)',
                              color: '#d97706',
                              border: '1px solid #f59e0b',
                              fontWeight: 'bold',
                            }}
                          />
                        )}
                        {confirmed && (
                          <Chip
                            label="Đã xác nhận"
                            size="small"
                            sx={{
                              bgcolor: 'rgba(34,197,94,0.15)',
                              color: '#16a34a',
                              border: '1px solid #22c55e',
                              fontWeight: 'bold',
                            }}
                          />
                        )}
                        {race.isOfficial && (
                          <Chip
                            label="Official"
                            size="small"
                            sx={{ bgcolor: 'rgba(37,99,235,0.12)', color: '#2563eb', fontWeight: 'bold' }}
                          />
                        )}
                      </div>
                      <p className="text-slate-400 text-sm">
                        {new Date(race.scheduledTime).toLocaleString('vi-VN')} · {race.distance}m
                      </p>
                    </div>
                    <Button
                      variant="contained"
                      onClick={() => openRace(race)}
                      sx={{
                        background: '#C9A227',
                        color: '#23201A',
                        textTransform: 'none',
                        fontWeight: 700,
                        '&:hover': { background: '#f0d000' },
                      }}
                    >
                      Xem kết quả
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  const confirmed = !!selected.resultsConfirmedAt;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <button
        type="button"
        onClick={() => { setSelected(null); setResults([]); }}
        className="text-sm text-slate-400 hover:text-[#C9A227] mb-2"
      >
        ← Danh sách 
      </button>
      <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
        <div>
          <h2 className="font-serif text-3xl font-bold text-foreground mb-1">Tên cuộc đua: {selected.name}</h2>
          
        </div>
        {!readOnly && (
          <Button
            variant="contained"
            disabled={confirmed || confirming}
            onClick={handleConfirm}
            startIcon={<CheckCircle className="w-4 h-4" />}
            sx={{
              background: confirmed ? '#EDE7D8' : '#1F3D2B',
              color: confirmed ? '#9ca3af' : '#fff',
              textTransform: 'none',
              fontWeight: 700,
              '&:hover': { background: '#2d5640' },
              '&.Mui-disabled': { background: '#EDE7D8', color: '#9ca3af' },
            }}
          >
            {confirmed ? 'Đã xác nhận' : confirming ? 'Đang lưu…' : 'Xác nhận kết quả'}
          </Button>
        )}
      </div>

      {loadingResults ? (
        <div className="flex justify-center py-12">
          <CircularProgress sx={{ color: '#C9A227' }} />
        </div>
      ) : (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-900/80 border-b border-border">
              <tr>
                <th className="text-left px-4 py-3 text-sm text-slate-400">#</th>
                <th className="text-left px-4 py-3 text-sm text-slate-400">Ngựa</th>
                <th className="text-left px-4 py-3 text-sm text-slate-400">Nài</th>
                <th className="text-right px-4 py-3 text-sm text-slate-400">Thời gian</th>
                <th className="text-right px-4 py-3 text-sm text-slate-400">Điểm</th>
                <th className="text-right px-4 py-3 text-sm text-slate-400">Thưởng</th>
                {readOnly && !selected.isOfficial && (
                  <th className="text-center px-4 py-3 text-sm text-slate-400">Khiếu nại</th>
                )}
              </tr>
            </thead>
            <tbody>
              {[...results]
                .sort((a, b) => {
                  if (a.disqualified && !b.disqualified) return 1;
                  if (!a.disqualified && b.disqualified) return -1;
                  return (a.position ?? 999) - (b.position ?? 999);
                })
                .map((row) => (
                <tr key={row._id} className="border-b border-border/60">
                  <td className="px-4 py-3 font-bold text-[#C9A227]">
                    {row.disqualified ? 'DQ' : (row.position ?? '—')}
                  </td>
                  <td className="px-4 py-3 text-foreground font-medium">
                    {row.horseId?.name || '—'}
                    {row.disqualified && (
                      <span className="ml-2 text-xs text-red-400">Bị loại</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-sm">
                    {row.jockeyId?.fullName || '—'}
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-foreground">
                    {formatFinishTime(row.finishTime)}
                  </td>
                  <td className="px-4 py-3 text-right text-sm">{row.pointsEarned}</td>
                  <td className="px-4 py-3 text-right text-sm text-[#C9A227]">
                    {row.prizeAmount?.toLocaleString('vi-VN')}
                  </td>
                  {readOnly && !selected.isOfficial && (
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => { setComplaintTarget(row); setComplaintModalOpen(true); }}
                        className="text-slate-400 hover:text-red-400 transition-colors p-1"
                        title="Khiếu nại ngựa này"
                      >
                        <AlertTriangle className="w-4 h-4 mx-auto" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
              {results.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-slate-500">
                    Chưa có kết quả trong DB
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}


      {/* Complaint Modal */}
      <Dialog
        open={complaintModalOpen}
        onClose={() => !submittingComplaint && setComplaintModalOpen(false)}
        PaperProps={{ sx: { background: '#1e293b', color: '#f8fafc', borderRadius: '16px', minWidth: '400px' } }}
      >
        <DialogTitle sx={{ fontFamily: 'serif', fontSize: '1.5rem', fontWeight: 700, borderBottom: '1px solid #334155' }}>
          Gửi khiếu nại
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <div className="mb-4 text-sm text-slate-300">
            Khiếu nại ngựa: <strong className="text-[#C9A227]">{complaintTarget?.horseId?.name}</strong>
          </div>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Lý do khiếu nại"
            value={complaintReason}
            onChange={(e) => setComplaintReason(e.target.value)}
            disabled={submittingComplaint}
            sx={{
              '& .MuiInputBase-root': { color: '#f8fafc' },
              '& .MuiInputLabel-root': { color: '#94a3b8' },
              '& .MuiOutlinedInput-notchedOutline': { borderColor: '#334155' },
              '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#475569' },
              '& .Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#C9A227' },
              '& .Mui-focused.MuiInputLabel-root': { color: '#C9A227' },
            }}
          />
        </DialogContent>
        <DialogActions sx={{ borderTop: '1px solid #334155', px: 3, py: 2 }}>
          <Button
            onClick={() => setComplaintModalOpen(false)}
            sx={{ color: '#94a3b8', textTransform: 'none' }}
            disabled={submittingComplaint}
          >
            Hủy
          </Button>
          <Button
            onClick={handleSubmitComplaint}
            variant="contained"
            disabled={submittingComplaint}
            sx={{
              background: '#C9A227',
              color: '#23201A',
              fontWeight: 700,
              textTransform: 'none',
              '&:hover': { background: '#b38f22' },
              '&.Mui-disabled': { background: '#475569', color: '#94a3b8' }
            }}
          >
            {submittingComplaint ? 'Đang gửi...' : 'Gửi khiếu nại'}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
