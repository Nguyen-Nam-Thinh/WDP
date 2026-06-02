import { useState, useEffect, useCallback } from 'react';
import {
  Box, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Button, Chip, Dialog, DialogTitle, DialogContent, DialogActions,
  Grid, Typography, Card, CardContent, CircularProgress, Alert,
} from '@mui/material';
import { EmojiEvents, Visibility, AttachMoney, PlayArrow, Bolt } from '@mui/icons-material';
import { toast } from 'sonner';
import { raceApi, type Race, type Registration } from '../../api/race';

// Admin-level bet API (re-use the pattern)
import { apiRequest } from '../../api/client';

interface BetSummary {
  _id: string;
  spectatorId: { _id: string; fullName: string; email: string };
  horseId: { _id: string; name: string };
  betType: 'win' | 'place' | 'show';
  amount: number;
  multiplier: number;
  status: string;
  payoutAmount: number;
  createdAt: string;
}

const BET_TYPE_LABEL: Record<string, string> = { win: 'Thắng', place: 'Hạng 2', show: 'Hạng 3' };
const STATUS_COLOR: Record<string, any> = { pending: 'warning', won: 'success', lost: 'error', cancelled: 'default', refunded: 'info' };
const STATUS_LABEL: Record<string, string> = { pending: 'Chờ', won: 'Thắng', lost: 'Thua', cancelled: 'Hủy', refunded: 'Hoàn' };

const fmtDateTime = (d: string) => d ? new Date(d).toLocaleString('vi-VN') : '-';

const STATUS_BADGE: Record<string, { label: string; color: 'default' | 'warning' | 'info' | 'primary' | 'success' | 'error' }> = {
  open:      { label: 'Mở',       color: 'primary' },
  closed:    { label: 'Đóng',     color: 'warning' },
  pre_check: { label: 'Chuẩn bị', color: 'info' },
  running:   { label: 'Đang chạy',color: 'success' },
};

export default function ResultsPublishing() {
  const [finishedRaces, setFinishedRaces] = useState<Race[]>([]);
  const [loading, setLoading] = useState(true);

  // ── Simulatable races (not finished/cancelled) ──
  const [simRaces, setSimRaces] = useState<Race[]>([]);
  const [loadingSim, setLoadingSim] = useState(true);
  const [simulatingId, setSimulatingId] = useState<string | null>(null);

  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedRace, setSelectedRace] = useState<Race | null>(null);
  const [raceBets, setRaceBets] = useState<BetSummary[]>([]);
  const [raceRegs, setRaceRegs] = useState<Registration[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [settling, setSettling] = useState(false);

  const loadFinishedRaces = useCallback(async () => {
    setLoading(true);
    try {
      const res = await raceApi.list({ status: 'finished', limit: 50 });
      setFinishedRaces(res.races);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadSimRaces = useCallback(async () => {
    setLoadingSim(true);
    try {
      const [openRes, closedRes, preRes, runRes] = await Promise.all([
        raceApi.list({ status: 'open',      limit: 20 }),
        raceApi.list({ status: 'closed',    limit: 20 }),
        raceApi.list({ status: 'pre_check', limit: 20 }),
        raceApi.list({ status: 'running',   limit: 20 }),
      ]);
      setSimRaces([
        ...openRes.races,
        ...closedRes.races,
        ...preRes.races,
        ...runRes.races,
      ]);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoadingSim(false);
    }
  }, []);

  const handleForceSimulate = async (race: Race) => {
    setSimulatingId(race._id);
    try {
      await raceApi.forceSimulate(race._id);
      toast.success(`Mô phỏng cuộc đua "${race.name}" đã bắt đầu`);
      loadSimRaces();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSimulatingId(null);
    }
  };

  useEffect(() => {
    loadFinishedRaces();
    loadSimRaces();
  }, [loadFinishedRaces, loadSimRaces]);

  const handleViewDetails = async (race: Race) => {
    setSelectedRace(race);
    setDetailOpen(true);
    setLoadingDetail(true);
    try {
      const [betsRes, regsRes] = await Promise.all([
        apiRequest<{ bets: BetSummary[]; total: number }>(`/bets/race/${race._id}?limit=100`),
        raceApi.getRegistrations(race._id),
      ]);
      setRaceBets(betsRes.bets ?? []);
      setRaceRegs(regsRes.registrations ?? []);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleSettleBets = async () => {
    if (!selectedRace) return;
    setSettling(true);
    try {
      const result = await apiRequest<{ settled: number; won: number; lost: number }>(
        `/bets/race/${selectedRace._id}/settle`,
        { method: 'POST' },
      );
      toast.success(`Đã quyết toán ${result.settled} cược: ${result.won} thắng, ${result.lost} thua`);
      // Reload bets
      const betsRes = await apiRequest<{ bets: BetSummary[]; total: number }>(`/bets/race/${selectedRace._id}?limit=100`);
      setRaceBets(betsRes.bets ?? []);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSettling(false);
    }
  };

  const pendingBets = raceBets.filter(b => b.status === 'pending').length;
  const totalBetAmount = raceBets.reduce((s, b) => s + b.amount, 0);
  const totalPayout = raceBets.filter(b => b.status === 'won').reduce((s, b) => s + b.payoutAmount, 0);

  return (
    <Box>
      {/* ── Force Simulate Section ── */}
      <Box sx={{ mb: 5 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Bolt sx={{ color: '#f59e0b' }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>Chạy Mô Phỏng</Typography>
            <Chip label={`${simRaces.length} race`} size="small" color="warning" />
          </Box>
          <Button size="small" variant="outlined" onClick={loadSimRaces} disabled={loadingSim}>
            Làm mới
          </Button>
        </Box>

        {loadingSim ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}><CircularProgress size={24} /></Box>
        ) : simRaces.length === 0 ? (
          <Paper sx={{ p: 3, textAlign: 'center', borderRadius: '12px', bgcolor: '#fafafa' }}>
            <Typography color="text.secondary" variant="body2">Không có cuộc đua nào đang chờ mô phỏng</Typography>
          </Paper>
        ) : (
          <Grid container spacing={2}>
            {simRaces.map(race => {
              const badge = STATUS_BADGE[race.status] ?? { label: race.status, color: 'default' as const };
              const isRunning = simulatingId === race._id;
              const tournamentName = typeof race.tournamentId === 'object' ? race.tournamentId.name : '';
              return (
                <Grid item xs={12} sm={6} md={4} key={race._id}>
                  <Card variant="outlined" sx={{ borderRadius: '12px', borderColor: race.status === 'running' ? '#22c55e' : undefined }}>
                    <CardContent sx={{ pb: '12px !important' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600, lineHeight: 1.3 }}>
                          {race.name}
                        </Typography>
                        <Chip label={badge.label} size="small" color={badge.color} />
                      </Box>
                      {tournamentName && (
                        <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                          {tournamentName}
                        </Typography>
                      )}
                      <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                        <Chip label={race.grade} size="small" variant="outlined" />
                        <Chip label={`${race.distance}m`} size="small" variant="outlined" />
                        <Chip label={`$${race.purse.toLocaleString()}`} size="small" variant="outlined" color="success" />
                      </Box>
                      <Button
                        fullWidth
                        variant="contained"
                        size="small"
                        startIcon={isRunning ? <CircularProgress size={14} color="inherit" /> : <PlayArrow />}
                        disabled={isRunning || race.status === 'running'}
                        onClick={() => handleForceSimulate(race)}
                        sx={{
                          bgcolor: race.status === 'running' ? '#22c55e' : '#f59e0b',
                          '&:hover': { bgcolor: race.status === 'running' ? '#16a34a' : '#d97706' },
                          textTransform: 'none',
                          fontWeight: 600,
                        }}
                      >
                        {race.status === 'running'
                          ? 'Đang chạy...'
                          : isRunning
                          ? 'Đang khởi động'
                          : 'Chạy Mô Phỏng'}
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        )}
      </Box>

      {/* ── Results Section ── */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>Kết Quả & Quyết Toán Cược</Typography>
        <Button variant="outlined" onClick={loadFinishedRaces} disabled={loading}>Làm mới</Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
      ) : finishedRaces.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: 'center', borderRadius: '12px' }}>
          <EmojiEvents sx={{ fontSize: 48, color: '#ccc', mb: 2 }} />
          <Typography color="text.secondary">Chưa có cuộc đua nào kết thúc</Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {finishedRaces.map(race => {
            const tName = typeof race.tournamentId === 'object' ? race.tournamentId.name : '-';
            return (
              <Grid size={{ xs: 12, md: 6 }} key={race._id}>
                <Card sx={{ borderRadius: '12px', border: '1px solid #e0e0e0', height: '100%' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>{race.name}</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>{tName}</Typography>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                          <Chip label={race.grade} size="small" variant="outlined" />
                          <Chip label="Đã kết thúc" size="small" color="success" />
                        </Box>
                      </Box>
                      <EmojiEvents sx={{ fontSize: 40, color: '#ffd700' }} />
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                      📅 {fmtDateTime(race.scheduledTime)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      💰 Giải thưởng: ${race.purse?.toLocaleString()}
                    </Typography>
                    <Button fullWidth variant="outlined" startIcon={<Visibility />} onClick={() => handleViewDetails(race)} sx={{ borderRadius: '8px' }}>
                      Xem kết quả & cược
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">{selectedRace?.name}</Typography>
            {pendingBets > 0 && (
              <Button variant="contained" startIcon={settling ? <CircularProgress size={18} /> : <AttachMoney />}
                onClick={handleSettleBets} disabled={settling}
                sx={{ background: '#10b981', '&:hover': { background: '#059669' } }}>
                Quyết Toán {pendingBets} Cược Chờ
              </Button>
            )}
          </Box>
        </DialogTitle>
        <DialogContent>
          {loadingDetail ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
          ) : (
            <>
              {/* Bet Stats */}
              <Grid container spacing={2} sx={{ mb: 3 }}>
                {[
                  { label: 'Tổng Cược', value: raceBets.length, color: 'primary.main' },
                  { label: 'Tổng Tiền Cược', value: `$${totalBetAmount.toLocaleString()}`, color: 'warning.main' },
                  { label: 'Tiền Đã Trả', value: `$${totalPayout.toLocaleString()}`, color: 'success.main' },
                  { label: 'Cược Chờ QT', value: pendingBets, color: pendingBets > 0 ? 'error.main' : 'success.main' },
                ].map((s, i) => (
                  <Grid size={{ xs: 6, sm: 3 }} key={i}>
                    <Paper sx={{ p: 2, textAlign: 'center', borderRadius: '8px', bgcolor: '#f9f9f9' }}>
                      <Typography variant="h5" sx={{ fontWeight: 700, color: s.color }}>{s.value}</Typography>
                      <Typography variant="caption" color="text.secondary">{s.label}</Typography>
                    </Paper>
                  </Grid>
                ))}
              </Grid>

              {pendingBets > 0 && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  Có {pendingBets} cược chưa được quyết toán. Cuộc đua cần có kết quả để hệ thống tự động quyết toán.
                </Alert>
              )}

              {/* Registrations */}
              {raceRegs.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>Ngựa Tham Gia</Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Ngựa</TableCell>
                          <TableCell>Jockey</TableCell>
                          <TableCell>Kết quả kiểm tra</TableCell>
                          <TableCell>Trạng thái</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {raceRegs.map(reg => (
                          <TableRow key={reg._id}>
                            <TableCell><Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {typeof reg.horseId === 'object' ? reg.horseId.name : '-'}
                            </Typography></TableCell>
                            <TableCell>{typeof reg.jockeyId === 'object' && reg.jockeyId ? reg.jockeyId.fullName : 'N/A'}</TableCell>
                            <TableCell>
                              <Chip label={reg.preCheckResult?.status === 'passed' ? 'Đạt' : reg.preCheckResult?.status === 'failed' ? 'Loại' : 'Chờ'} size="small"
                                color={reg.preCheckResult?.status === 'passed' ? 'success' : reg.preCheckResult?.status === 'failed' ? 'error' : 'warning'} />
                            </TableCell>
                            <TableCell>
                              <Chip label={reg.status} size="small" color={reg.status === 'active' ? 'success' : 'error'} />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}

              {/* Bets */}
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>Danh Sách Cược ({raceBets.length})</Typography>
              {raceBets.length === 0 ? (
                <Typography color="text.secondary" sx={{ py: 2 }}>Không có cược nào cho cuộc đua này</Typography>
              ) : (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Người Cược</TableCell>
                        <TableCell>Ngựa</TableCell>
                        <TableCell>Loại</TableCell>
                        <TableCell>Số Tiền</TableCell>
                        <TableCell>Hệ Số</TableCell>
                        <TableCell>Trạng Thái</TableCell>
                        <TableCell>Tiền Nhận</TableCell>
                        <TableCell>Thời Gian</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {raceBets.map(bet => (
                        <TableRow key={bet._id} hover>
                          <TableCell>
                            <Typography variant="body2">{typeof bet.spectatorId === 'object' ? bet.spectatorId.fullName : '-'}</Typography>
                          </TableCell>
                          <TableCell>{typeof bet.horseId === 'object' ? bet.horseId.name : '-'}</TableCell>
                          <TableCell><Chip label={BET_TYPE_LABEL[bet.betType] || bet.betType} size="small" variant="outlined" /></TableCell>
                          <TableCell>${bet.amount.toLocaleString()}</TableCell>
                          <TableCell>{bet.multiplier}x</TableCell>
                          <TableCell><Chip label={STATUS_LABEL[bet.status] || bet.status} size="small" color={STATUS_COLOR[bet.status] || 'default'} /></TableCell>
                          <TableCell>
                            {bet.status === 'won'
                              ? <Typography variant="body2" sx={{ fontWeight: 700, color: 'success.main' }}>${bet.payoutAmount?.toLocaleString()}</Typography>
                              : <Typography variant="body2" color="text.secondary">—</Typography>}
                          </TableCell>
                          <TableCell><Typography variant="caption">{fmtDateTime(bet.createdAt)}</Typography></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDetailOpen(false)}>Đóng</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
