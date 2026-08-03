import { useCallback, useEffect, useMemo, useState } from 'react';
import { Flag, Radio, History } from 'lucide-react';
import { Button, Chip, CircularProgress } from '@mui/material';
import { toast } from 'sonner';
import { refereeApi, type RefereeReport, type Incident } from '../../api/referee';
import { raceApi } from '../../api/race';
import { type Registration } from '../../api/registration';
import { useRaceSocket } from '../../hooks/useRaceSocket';

function horseName(reg: Registration): string {
  return (reg.horseId as { name?: string })?.name || '—';
}

function horseIdOf(reg: Registration): string {
  return typeof reg.horseId === 'object' && reg.horseId?._id
    ? reg.horseId._id
    : String(reg.horseId);
}

function incidentHorseLabel(inc: Incident): string {
  if (inc.horseId && typeof inc.horseId === 'object' && 'name' in inc.horseId) {
    return (inc.horseId as { name: string }).name;
  }
  return 'Ngựa';
}

function formatRaceTime(ms: number | null | undefined): string {
  if (ms == null || Number.isNaN(ms)) return '—';
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return `${m}:${String(rem).padStart(2, '0')}`;
}

/** Số yên = thứ tự đăng ký (cùng convention getRaceHorses.gateNumber) */
function assignGateNumbers(regs: Registration[]): Array<Registration & { gateNumber: number }> {
  const sorted = [...regs].sort((a, b) => {
    const ta = a.registeredAt ? new Date(a.registeredAt).getTime() : 0;
    const tb = b.registeredAt ? new Date(b.registeredAt).getTime() : 0;
    return ta - tb;
  });
  return sorted.map((reg, index) => ({ ...reg, gateNumber: index + 1 }));
}

const RACE_STATUS_LABEL: Record<string, string> = {
  open: 'Đang mở',
  closed: 'Đã đóng',
  pre_check: 'Kiểm tra trước đua',
  running: 'Đang chạy',
  finished: 'Đã kết thúc',
  cancelled: 'Đã hủy',
};

const INCIDENT_TYPE_LABEL: Record<string, string> = {
  interference: 'Cản trở',
  doping: 'Doping',
  equipment_violation: 'Vi phạm thiết bị',
  jockey_violation: 'Vi phạm nài ngựa',
  other: 'Khác',
};

const VERDICT_LABEL: Record<string, string> = {
  none: 'Không xử lý',
  warning: 'Cảnh cáo',
  fine: 'Phạt tiền',
  disqualified: 'Loại',
};

function raceIdOf(raceOrId: any): string {
  if (!raceOrId) return '';
  if (typeof raceOrId === 'string') return raceOrId;
  return raceOrId._id || '';
}

interface Props {
  token: string;
  races: any[];
  loading: boolean;
}

export function LiveFlagPanel({ token, races, loading }: Props) {
  const running = races.filter((r) => r.status === 'running');
  const history = useMemo(
    () =>
      [...races]
        .filter((r) => ['finished', 'cancelled'].includes(r.status))
        .sort(
          (a, b) =>
            new Date(b.scheduledTime).getTime() - new Date(a.scheduledTime).getTime(),
        ),
    [races],
  );
  const [listTab, setListTab] = useState<'xem' | 'lichsu'>('xem');
  const [selectedRace, setSelectedRace] = useState<any | null>(null);
  const [historyView, setHistoryView] = useState(false);
  const [regs, setRegs] = useState<Registration[]>([]);
  const [report, setReport] = useState<RefereeReport | null>(null);
  const [loadingSession, setLoadingSession] = useState(false);
  const [flaggingId, setFlaggingId] = useState<string | null>(null);

  const raceId = selectedRace?._id || '';
  const { phase, elapsed, total } = useRaceSocket(historyView ? '' : raceId, token);

  const gatedRegs = useMemo(() => assignGateNumbers(regs), [regs]);

  const gateByHorseId = useMemo(() => {
    const map = new Map<string, number>();
    gatedRegs.forEach((r) => map.set(horseIdOf(r), r.gateNumber));
    return map;
  }, [gatedRegs]);

  const clearSelection = () => {
    setSelectedRace(null);
    setReport(null);
    setRegs([]);
    setHistoryView(false);
  };

  const openRace = useCallback(async (race: any) => {
    setSelectedRace(race);
    setHistoryView(false);
    setLoadingSession(true);
    setRegs([]);
    setReport(null);
    try {
      const [ensured, regRes] = await Promise.all([
        refereeApi.ensureReport(token, race._id),
        raceApi.getRaceRegistrations(token, race._id, { limit: 50 }),
      ]);
      setReport(ensured);
      const list = (regRes.registrations || []).filter(
        (r: Registration) => r.status === 'active' || r.preCheckResult?.status === 'passed',
      );
      setRegs(list.length ? list : regRes.registrations || []);
    } catch (err: any) {
      toast.error(err.message);
      setSelectedRace(null);
    } finally {
      setLoadingSession(false);
    }
  }, [token]);

  const openHistoryDetail = useCallback(async (race: any) => {
    setSelectedRace(race);
    setHistoryView(true);
    setLoadingSession(true);
    setRegs([]);
    setReport(null);
    try {
      const [reportsRes, regRes] = await Promise.all([
        refereeApi.getMyReports(token, { limit: 100 }),
        raceApi.getRaceRegistrations(token, race._id, { limit: 50 }),
      ]);
      const match = (reportsRes.reports || []).find(
        (r) => raceIdOf(r.raceId) === String(race._id),
      );
      if (match) {
        const full = await refereeApi.getReportById(token, match._id);
        setReport(full);
      } else {
        setReport(null);
      }
      setRegs(regRes.registrations || []);
    } catch (err: any) {
      toast.error(err.message || 'Không tải được chi tiết flag');
      setSelectedRace(null);
      setHistoryView(false);
    } finally {
      setLoadingSession(false);
    }
  }, [token]);

  useEffect(() => {
    if (!selectedRace || historyView) return;
    const stillRunning = races.find((r) => r._id === selectedRace._id && r.status === 'running');
    if (!stillRunning && phase === 'finished') {
      // keep session until user leaves; race may finish mid-flag
    }
  }, [races, selectedRace, phase, historyView]);

  const handleFlag = async (reg: Registration & { gateNumber?: number }) => {
    if (!report || !token || historyView) return;
    setFlaggingId(reg._id);
    try {
      const raceTimeMs = Math.round(elapsed * 1000);
      const updated = await refereeApi.flagIncident(token, report._id, {
        registrationId: reg._id,
        raceTimeMs,
      });
      setReport(updated);
      const name = horseName(reg);
      const gate = reg.gateNumber ?? gateByHorseId.get(horseIdOf(reg));
      toast.success(`Đã gắn cờ: Yên ${gate ?? '?'} — ${name} @ ${formatRaceTime(raceTimeMs)}`);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setFlaggingId(null);
    }
  };

  const draftFlags = (report?.incidents || []).filter(
    (i) => i.source === 'live_flag' && (i.status === 'draft' || !i.status),
  );
  const allFlags = (report?.incidents || []).filter(
    (i) => i.source === 'live_flag' || i.source === 'manual' || !i.source,
  );

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <CircularProgress sx={{ color: '#C9A227' }} />
      </div>
    );
  }

  if (!selectedRace) {
    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="mb-4">
          <h2 className="font-serif text-3xl font-bold text-foreground mb-2">Theo dõi trận đấu</h2>
          <p className="text-slate-400">Theo dõi cuộc đua đang chạy và xem lịch sử đã làm trọng tài</p>
        </div>

        <div className="flex gap-2 mb-6">
          <Button
            size="small"
            variant={listTab === 'xem' ? 'contained' : 'outlined'}
            onClick={() => setListTab('xem')}
            sx={{
              textTransform: 'none',
              fontWeight: 700,
              ...(listTab === 'xem'
                ? { background: '#C9A227', color: '#23201A', '&:hover': { background: '#f0d000' } }
                : { borderColor: '#C9C2B0', color: '#23201A' }),
            }}
          >
            Xem
          </Button>
          <Button
            size="small"
            variant={listTab === 'lichsu' ? 'contained' : 'outlined'}
            onClick={() => setListTab('lichsu')}
            startIcon={<History className="w-4 h-4" />}
            sx={{
              textTransform: 'none',
              fontWeight: 700,
              ...(listTab === 'lichsu'
                ? { background: '#C9A227', color: '#23201A', '&:hover': { background: '#f0d000' } }
                : { borderColor: '#C9C2B0', color: '#23201A' }),
            }}
          >
            Lịch sử
          </Button>
        </div>

        {listTab === 'xem' && (
          running.length === 0 ? (
            <div className="bg-card rounded-2xl border border-border p-12 text-center">
              <Radio className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">Không có cuộc đua nào đang chạy</p>
            </div>
          ) : (
            <div className="space-y-4">
              {running.map((race) => (
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
                        <Chip
                          label="TRỰC TIẾP"
                          size="small"
                          sx={{
                            bgcolor: 'rgba(220,38,38,0.2)',
                            color: '#f87171',
                            border: '1px solid #dc2626',
                            fontWeight: 'bold',
                          }}
                        />
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
                      Vào theo dõi
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {listTab === 'lichsu' && (
          history.length === 0 ? (
            <div className="bg-card rounded-2xl border border-border p-10 text-center">
              <History className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">Chưa có cuộc đua nào đã kết thúc trong lịch sử của bạn</p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((race) => (
                <button
                  type="button"
                  key={race._id}
                  onClick={() => openHistoryDetail(race)}
                  className="w-full text-left bg-card border border-border rounded-xl px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-[#C9A227]/50 hover:bg-[#C9A227]/5 transition-all cursor-pointer"
                >
                  <div>
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-semibold text-foreground">{race.name}</span>
                      <Chip
                        label={race.grade}
                        size="small"
                        sx={{ bgcolor: 'rgba(201,162,39,0.15)', color: '#C9A227', fontWeight: 700, fontSize: '0.65rem' }}
                      />
                      <Chip
                        label={RACE_STATUS_LABEL[race.status] || race.status}
                        size="small"
                        sx={{
                          bgcolor: race.status === 'cancelled' ? 'rgba(244,63,94,0.12)' : 'rgba(100,116,139,0.15)',
                          color: race.status === 'cancelled' ? '#f43f5e' : '#94a3b8',
                          fontWeight: 600,
                          fontSize: '0.65rem',
                        }}
                      />
                    </div>
                    <p className="text-slate-400 text-sm">
                      {new Date(race.scheduledTime).toLocaleString('vi-VN')}
                      {race.distance ? ` · ${race.distance}m` : ''}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-[#C9A227] whitespace-nowrap">
                    Xem chi tiết flag →
                  </span>
                </button>
              ))}
            </div>
          )
        )}
      </div>
    );
  }

  // ── History detail: read-only flag list ──
  if (historyView) {
    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="mb-6">
          <button
            type="button"
            onClick={clearSelection}
            className="text-sm text-slate-400 hover:text-[#C9A227] mb-2"
          >
            ← Quay lại lịch sử
          </button>
          <h2 className="font-serif text-3xl font-bold text-foreground mb-1">{selectedRace.name}</h2>
          <div className="flex items-center gap-2 flex-wrap text-sm text-slate-400">
            <Chip
              label={RACE_STATUS_LABEL[selectedRace.status] || selectedRace.status}
              size="small"
              sx={{ bgcolor: 'rgba(100,116,139,0.2)', color: '#94a3b8', fontWeight: 700 }}
            />
            <span>{new Date(selectedRace.scheduledTime).toLocaleString('vi-VN')}</span>
            {selectedRace.distance ? <span>· {selectedRace.distance}m</span> : null}
          </div>
        </div>

        {loadingSession ? (
          <div className="flex justify-center py-12">
            <CircularProgress sx={{ color: '#C9A227' }} />
          </div>
        ) : (
          <div className="bg-card border border-border rounded-2xl p-5 max-w-2xl">
            <h3 className="font-serif text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <Flag className="w-4 h-4 text-[#8C2F1B]" />
              Chi tiết flag ({allFlags.length})
            </h3>
            {allFlags.length === 0 ? (
              <p className="text-sm text-slate-500 py-6 text-center">
                Không có flag nào được ghi nhận trong cuộc đua này
              </p>
            ) : (
              <ul className="space-y-3">
                {[...allFlags]
                  .sort((a, b) => {
                    const ta = a.flaggedAt || a.recordedAt || '';
                    const tb = b.flaggedAt || b.recordedAt || '';
                    return new Date(ta).getTime() - new Date(tb).getTime();
                  })
                  .map((inc) => {
                    const hid =
                      inc.horseId && typeof inc.horseId === 'object' && '_id' in inc.horseId
                        ? (inc.horseId as { _id: string })._id
                        : typeof inc.horseId === 'string'
                          ? inc.horseId
                          : '';
                    const gate = hid ? gateByHorseId.get(hid) : undefined;
                    const isDraft = inc.status === 'draft' || !inc.status;
                    const verdict = inc.resolution?.verdict;
                    return (
                      <li
                        key={inc._id}
                        className="border border-border rounded-xl px-4 py-3 text-sm"
                      >
                        <div className="flex items-start justify-between gap-3 flex-wrap">
                          <div className="min-w-0">
                            <div className="font-semibold text-foreground">
                              {gate != null ? `Yên ${gate} · ` : ''}
                              {incidentHorseLabel(inc)}
                              {' · '}
                              {inc.source === 'live_flag' ? 'Cờ' : (INCIDENT_TYPE_LABEL[inc.type] || inc.type)}
                            </div>
                            <div className="text-xs text-slate-500 mt-1">
                              Gắn cờ trong cuộc đua
                              {inc.raceTimeMs != null ? ` · ${formatRaceTime(inc.raceTimeMs)}` : ''}
                              {inc.flaggedAt
                                ? ` · ${new Date(inc.flaggedAt).toLocaleString('vi-VN')}`
                                : ''}
                            </div>
                            {!isDraft && verdict && (
                              <div className="text-xs text-[#C9A227] mt-1.5 font-medium">
                                Xử lý: {VERDICT_LABEL[verdict] || verdict}
                                {verdict === 'fine' && inc.resolution?.fineAmount != null
                                  ? ` — ${inc.resolution.fineAmount.toLocaleString('vi-VN')} coins`
                                  : ''}
                                {inc.resolution?.note ? ` · ${inc.resolution.note}` : ''}
                              </div>
                            )}
                          </div>
                          <Chip
                            label={isDraft ? 'Chưa xử lý' : 'Đã xử lý'}
                            size="small"
                            sx={{
                              fontWeight: 700,
                              fontSize: '0.65rem',
                              bgcolor: isDraft ? 'rgba(245,158,11,0.15)' : 'rgba(31,61,43,0.12)',
                              color: isDraft ? '#f59e0b' : '#1F3D2B',
                            }}
                          />
                        </div>
                      </li>
                    );
                  })}
              </ul>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <button
            type="button"
            onClick={clearSelection}
            className="text-sm text-slate-400 hover:text-[#C9A227] mb-2"
          >
            ← Danh sách theo dõi
          </button>
          <h2 className="font-serif text-3xl font-bold text-foreground mb-1">{selectedRace.name}</h2>
          <div className="flex items-center gap-2 flex-wrap text-sm text-slate-400">
            <Chip
              label={phase === 'finished' ? 'Đã kết thúc' : phase === 'racing' || phase === 'started' ? 'Đang đua' : 'Chờ'}
              size="small"
              sx={{
                bgcolor: phase === 'finished' ? 'rgba(100,116,139,0.2)' : 'rgba(220,38,38,0.15)',
                color: phase === 'finished' ? '#94a3b8' : '#f87171',
                fontWeight: 700,
              }}
            />
            <span>
              {Math.floor(elapsed)}s / {total}s
            </span>
          </div>
        </div>
      </div>

      {loadingSession ? (
        <div className="flex justify-center py-12">
          <CircularProgress sx={{ color: '#C9A227' }} />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-3">
            <p className="text-sm text-slate-400 mb-2">Nhấn Gắn cờ khi thấy sự cố — số bên trái là số yên</p>
            {gatedRegs.map((reg) => {
              const canFlag = phase !== 'finished' && report != null;
              return (
                <div
                  key={reg._id}
                  className="flex items-center gap-4 bg-card border border-border rounded-xl px-4 py-3"
                >
                  <div
                    className="w-10 h-10 rounded-lg bg-slate-800 flex flex-col items-center justify-center text-[#C9A227] leading-none"
                    title="Số yên"
                  >
                    <span className="text-[9px] uppercase text-slate-500 font-semibold">Yên</span>
                    <span className="text-sm font-bold">{reg.gateNumber}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-foreground truncate">{horseName(reg)}</div>
                    <div className="text-xs text-slate-500 truncate">
                      {(reg.jockeyId as { fullName?: string })?.fullName || 'Chưa có nài'}
                    </div>
                  </div>
                  <Button
                    variant="contained"
                    disabled={!canFlag || flaggingId === reg._id}
                    onClick={() => handleFlag(reg)}
                    startIcon={<Flag className="w-4 h-4" />}
                    sx={{
                      background: '#8C2F1B',
                      color: '#fff',
                      textTransform: 'none',
                      fontWeight: 700,
                      minWidth: 110,
                      '&:hover': { background: '#a33a22' },
                      '&.Mui-disabled': { background: '#EDE7D8', color: '#9ca3af' },
                    }}
                  >
                    {flaggingId === reg._id ? '…' : 'Gắn cờ'}
                  </Button>
                </div>
              );
            })}
            {gatedRegs.length === 0 && (
              <p className="text-slate-400 text-center py-8">Không có ngựa trong cuộc đua</p>
            )}
          </div>

          <div className="bg-card border border-border rounded-2xl p-5 h-fit">
            <h3 className="font-serif text-lg font-bold text-foreground mb-3 flex items-center gap-2">
              <Flag className="w-4 h-4 text-[#8C2F1B]" />
              Cờ nháp ({draftFlags.length})
            </h3>
            {draftFlags.length === 0 ? (
              <p className="text-sm text-slate-500">Chưa có cờ — xử lý sau khi cuộc đua kết thúc</p>
            ) : (
              <ul className="space-y-3">
                {draftFlags
                  .slice()
                  .reverse()
                  .map((inc) => {
                    const hid =
                      inc.horseId && typeof inc.horseId === 'object' && '_id' in inc.horseId
                        ? (inc.horseId as { _id: string })._id
                        : typeof inc.horseId === 'string'
                          ? inc.horseId
                          : '';
                    const gate = hid ? gateByHorseId.get(hid) : undefined;
                    return (
                      <li
                        key={inc._id}
                        className="border border-border rounded-lg px-3 py-2 text-sm"
                      >
                        <div className="font-medium text-foreground">
                          {gate != null ? `Yên ${gate} · ` : ''}
                          {incidentHorseLabel(inc)}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {formatRaceTime(inc.raceTimeMs)}
                          {inc.flaggedAt
                            ? ` · ${new Date(inc.flaggedAt).toLocaleTimeString('vi-VN')}`
                            : ''}
                        </div>
                      </li>
                    );
                  })}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
