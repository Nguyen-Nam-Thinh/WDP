import { useState, useEffect, useCallback } from 'react';
import {
  Box, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, Button, Typography, CircularProgress, FormControl, InputLabel, Select,
  MenuItem, Dialog, DialogTitle, DialogContent, DialogActions, Grid, TextField, InputAdornment,
} from '@mui/material';
import { Search, Refresh, AttachMoney } from '@mui/icons-material';
import { toast } from 'sonner';
import { betAdminApi, type Bet, BET_TYPE_LABEL, BET_STATUS_LABEL, BET_STATUS_COLOR, type BetStatus } from '../../api/bet';
import { raceApi, type Race } from '../../api/race';

const fmtDateTime = (d: string) => d ? new Date(d).toLocaleString('vi-VN') : '-';

export default function BetManagement() {
  const [bets, setBets] = useState<Bet[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterRaceId, setFilterRaceId] = useState('');
  const [search, setSearch] = useState('');

  // Races for filter dropdown
  const [races, setRaces] = useState<Race[]>([]);

  // Settle dialog
  const [settleDialog, setSettleDialog] = useState(false);
  const [settlingRaceId, setSettlingRaceId] = useState('');
  const [settling, setSettling] = useState(false);

  // Stats
  const pending = bets.filter(b => b.status === 'pending').length;
  const totalAmount = bets.reduce((s, b) => s + b.amount, 0);
  const totalPayout = bets.filter(b => b.status === 'won').reduce((s, b) => s + b.payoutAmount, 0);

  const loadBets = useCallback(async () => {
    setLoading(true);
    try {
      const res = await betAdminApi.getAllBets({
        page,
        limit: 20,
        status: filterStatus as BetStatus || undefined,
        raceId: filterRaceId || undefined,
      });
      setBets(res.bets ?? []);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [page, filterStatus, filterRaceId]);

  const loadRaces = useCallback(async () => {
    try {
      const res = await raceApi.list({ limit: 100 });
      setRaces(res.races ?? []);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { loadBets(); }, [loadBets]);
  useEffect(() => { loadRaces(); }, [loadRaces]);
  useEffect(() => { setPage(1); }, [filterStatus, filterRaceId]);

  const handleSettle = async () => {
    if (!settlingRaceId) return;
    setSettling(true);
    try {
      const result = await betAdminApi.settleBets(settlingRaceId);
      toast.success(`Quyết toán ${result.settled} cược: ${result.won} thắng, ${result.lost} thua`);
      setSettleDialog(false);
      setSettlingRaceId('');
      loadBets();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSettling(false);
    }
  };

  const filteredBets = search
    ? bets.filter(b => {
        const race = b.raceId as any;
        const horse = b.horseId as any;
        const spectator = b.spectatorId as any;
        return (
          (race?.name || '').toLowerCase().includes(search.toLowerCase()) ||
          (horse?.name || '').toLowerCase().includes(search.toLowerCase()) ||
          (spectator?.fullName || '').toLowerCase().includes(search.toLowerCase()) ||
          (spectator?.email || '').toLowerCase().includes(search.toLowerCase())
        );
      })
    : bets;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>Quản lý cược</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" startIcon={<AttachMoney />} onClick={() => setSettleDialog(true)}>
            Quyết toán cược
          </Button>
          <Button variant="outlined" startIcon={<Refresh />} onClick={loadBets} disabled={loading}>
            Làm mới
          </Button>
        </Box>
      </Box>

      {/* Stats */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: 'Tổng số cược (trang này)', value: total, color: 'primary.main' },
          { label: 'Tổng tiền đặt', value: `$${totalAmount.toLocaleString()}`, color: 'warning.main' },
          { label: 'Tổng tiền đã trả', value: `$${totalPayout.toLocaleString()}`, color: 'success.main' },
          { label: 'Cược đang chờ', value: pending, color: pending > 0 ? 'error.main' : 'text.secondary' },
        ].map((s, i) => (
          <Grid key={i} size={{ xs: 6, sm: 3 }}>
            <Paper sx={{ p: 2, textAlign: 'center', borderRadius: '10px', bgcolor: '#f9f9f9' }}>
              <Typography variant="h5" sx={{ fontWeight: 700, color: s.color }}>{s.value}</Typography>
              <Typography variant="caption" color="text.secondary">{s.label}</Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Filters */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
        <TextField size="small" placeholder="Tìm cuộc đua, ngựa, người dùng..." value={search}
          onChange={e => setSearch(e.target.value)} sx={{ minWidth: 260 }}
          InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> }} />
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Trạng thái</InputLabel>
          <Select value={filterStatus} label="Trạng thái" onChange={e => setFilterStatus(e.target.value)}>
            <MenuItem value="">Tất cả</MenuItem>
            {['pending', 'won', 'lost', 'cancelled', 'refunded'].map(s => (
              <MenuItem key={s} value={s}>{BET_STATUS_LABEL[s]}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 220 }}>
          <InputLabel>Cuộc đua</InputLabel>
          <Select value={filterRaceId} label="Cuộc đua" onChange={e => setFilterRaceId(e.target.value)}>
            <MenuItem value="">Tất cả</MenuItem>
            {races.map(r => <MenuItem key={r._id} value={r._id}>{r.name} ({r.grade})</MenuItem>)}
          </Select>
        </FormControl>
      </Box>

      <Paper sx={{ borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Người cược</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Cuộc đua</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Ngựa</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Loại cược</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Tiền cược</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Hệ số</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Trạng thái</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Tiền thắng</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Thời gian</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredBets.length === 0 ? (
                  <TableRow><TableCell colSpan={9} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                    Không có dữ liệu
                  </TableCell></TableRow>
                ) : filteredBets.map(bet => {
                  const spectator = bet.spectatorId as any;
                  const race = bet.raceId as any;
                  const horse = bet.horseId as any;
                  return (
                    <TableRow key={bet._id} hover>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>{spectator?.fullName || '-'}</Typography>
                        <Typography variant="caption" color="text.secondary">{spectator?.email}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{race?.name || '-'}</Typography>
                        {race?.grade && <Chip label={race.grade} size="small" variant="outlined" sx={{ mt: 0.3 }} />}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>{horse?.name || '-'}</Typography>
                        <Typography variant="caption" color="text.secondary">{horse?.currentGrade}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={BET_TYPE_LABEL[bet.betType] || bet.betType} size="small" variant="outlined" color="primary" />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>${bet.amount.toLocaleString()}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ color: 'warning.main', fontWeight: 600 }}>{bet.multiplier}x</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={BET_STATUS_LABEL[bet.status] || bet.status} size="small"
                          color={BET_STATUS_COLOR[bet.status] || 'default'} />
                      </TableCell>
                      <TableCell>
                        {bet.status === 'won'
                          ? <Typography variant="body2" sx={{ fontWeight: 700, color: 'success.main' }}>+${bet.payoutAmount?.toLocaleString()}</Typography>
                          : <Typography variant="body2" color="text.secondary">—</Typography>}
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" color="text.secondary">{fmtDateTime(bet.createdAt)}</Typography>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2, p: 2, borderTop: '1px solid #eee' }}>
            <Button size="small" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Trước</Button>
            <Typography variant="body2">{page} / {totalPages} (tổng {total})</Typography>
            <Button size="small" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Sau →</Button>
          </Box>
        )}
      </Paper>

      {/* Settle Dialog */}
      <Dialog open={settleDialog} onClose={() => setSettleDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Quyết Toán Cược Theo Cuộc Đua</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Chọn cuộc đua đã kết thúc để quyết toán cược. Hệ thống tự động tính toán dựa trên kết quả cuộc đua.
            </Typography>
            <FormControl fullWidth>
              <InputLabel>Chọn cuộc đua đã kết thúc</InputLabel>
              <Select value={settlingRaceId} label="Chọn cuộc đua đã kết thúc" onChange={e => setSettlingRaceId(e.target.value)}>
                {races.filter(r => r.status === 'finished').map(r => (
                  <MenuItem key={r._id} value={r._id}>{r.name} ({r.grade})</MenuItem>
                ))}
              </Select>
            </FormControl>
            {races.filter(r => r.status === 'finished').length === 0 && (
              <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
                Chưa có cuộc đua nào kết thúc
              </Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setSettleDialog(false)} disabled={settling}>Hủy</Button>
          <Button variant="contained" onClick={handleSettle} disabled={!settlingRaceId || settling}
            sx={{ background: '#10b981', '&:hover': { background: '#059669' } }}>
            {settling ? <CircularProgress size={20} /> : 'Quyết Toán'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
