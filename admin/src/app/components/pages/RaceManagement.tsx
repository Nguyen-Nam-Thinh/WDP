import { useState, useEffect, useCallback } from 'react';
import {
  Box, Paper, Grid, Card, CardContent, Typography, Chip, CircularProgress,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Avatar,
  FormControl, InputLabel, Select, MenuItem, Button, TextField, InputAdornment,
} from '@mui/material';
import { Search, Refresh, Pets, Person } from '@mui/icons-material';
import { toast } from 'sonner';
import { raceApi, type Race, type Registration } from '../../api/race';
import { tournamentApi, type Tournament } from '../../api/tournament';

const STATUS_COLOR: Record<string, any> = {
  open: 'info', closed: 'warning', pre_check: 'warning',
  running: 'success', finished: 'success', cancelled: 'error',
};
const STATUS_LABEL: Record<string, string> = {
  open: 'Mở ĐK', closed: 'Đóng ĐK', pre_check: 'Kiểm tra',
  running: 'Đang đua', finished: 'Kết thúc', cancelled: 'Đã hủy',
};
const REG_STATUS_COLOR: Record<string, any> = { active: 'success', cancelled: 'error', disqualified: 'error' };
const REG_STATUS_LABEL: Record<string, string> = { active: 'Đang hoạt động', cancelled: 'Đã hủy', disqualified: 'Bị loại' };
const PRECHECK_COLOR: Record<string, any> = { pending: 'default', passed: 'success', failed: 'error' };
const PRECHECK_LABEL: Record<string, string> = { pending: 'Chờ', passed: 'Đạt', failed: 'Không đạt' };

export default function RaceManagement() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [races, setRaces] = useState<Race[]>([]);
  const [selectedRace, setSelectedRace] = useState<Race | null>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [filterTournament, setFilterTournament] = useState('');
  const [search, setSearch] = useState('');
  const [loadingRaces, setLoadingRaces] = useState(true);
  const [loadingRegs, setLoadingRegs] = useState(false);

  const loadTournaments = useCallback(async () => {
    try {
      const res = await tournamentApi.list(1, 100);
      setTournaments(res.tournaments);
    } catch (err: any) {
      toast.error(err.message);
    }
  }, []);

  const loadRaces = useCallback(async () => {
    setLoadingRaces(true);
    try {
      const res = await raceApi.list({ tournamentId: filterTournament || undefined, limit: 100 });
      setRaces(res.races);
      if (!selectedRace && res.races.length) setSelectedRace(res.races[0]);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoadingRaces(false);
    }
  }, [filterTournament]);

  const loadRegistrations = useCallback(async (raceId: string) => {
    setLoadingRegs(true);
    try {
      const res = await raceApi.getRegistrations(raceId);
      setRegistrations(res.registrations);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoadingRegs(false);
    }
  }, []);

  useEffect(() => { loadTournaments(); }, [loadTournaments]);
  useEffect(() => { loadRaces(); }, [loadRaces]);
  useEffect(() => { if (selectedRace) loadRegistrations(selectedRace._id); }, [selectedRace, loadRegistrations]);

  const filteredRaces = races.filter(r =>
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    (typeof r.tournamentId === 'object' && r.tournamentId.name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>Chi tiết cuộc đua & Đăng ký</Typography>
        <Button startIcon={<Refresh />} onClick={loadRaces} variant="outlined">Làm mới</Button>
      </Box>

      <Grid container spacing={3}>
        {/* ── Left: Race list ── */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            <Box sx={{ mb: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <TextField
                size="small" placeholder="Tìm cuộc đua..." value={search}
                onChange={e => setSearch(e.target.value)} fullWidth
                InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> }}
              />
              <FormControl size="small" fullWidth>
                <InputLabel>Lọc giải đấu</InputLabel>
                <Select value={filterTournament} label="Lọc giải đấu" onChange={e => setFilterTournament(e.target.value)}>
                  <MenuItem value="">Tất cả</MenuItem>
                  {tournaments.map(t => <MenuItem key={t._id} value={t._id}>{t.name}</MenuItem>)}
                </Select>
              </FormControl>
            </Box>

            {loadingRaces ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, maxHeight: 600, overflowY: 'auto' }}>
                {filteredRaces.length === 0 ? (
                  <Typography color="text.secondary" align="center" sx={{ py: 3 }}>Không có cuộc đua</Typography>
                ) : filteredRaces.map(race => (
                  <Card key={race._id}
                    sx={{
                      cursor: 'pointer', transition: 'all 0.15s',
                      border: selectedRace?._id === race._id ? '2px solid #1976d2' : '1px solid #e0e0e0',
                      bgcolor: selectedRace?._id === race._id ? '#e3f2fd' : 'white',
                      '&:hover': { boxShadow: '0 2px 8px rgba(0,0,0,0.12)' },
                    }}
                    onClick={() => setSelectedRace(race)}
                  >
                    <CardContent sx={{ pb: '10px !important', pt: 1.5, px: 2 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>{race.name}</Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                        {typeof race.tournamentId === 'object' ? race.tournamentId.name : '-'}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 0.7, flexWrap: 'wrap' }}>
                        <Chip label={race.grade} size="small" variant="outlined" sx={{ fontSize: '0.65rem' }} />
                        <Chip label={STATUS_LABEL[race.status]} size="small" color={STATUS_COLOR[race.status]} sx={{ fontSize: '0.65rem' }} />
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            )}
          </Paper>
        </Grid>

        {/* ── Right: Registrations ── */}
        <Grid item xs={12} md={8}>
          {selectedRace ? (
            <Paper sx={{ p: 3, borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, flexWrap: 'wrap' }}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>{selectedRace.name}</Typography>
                  <Chip label={selectedRace.grade} size="small" variant="outlined" />
                  <Chip label={STATUS_LABEL[selectedRace.status]} size="small" color={STATUS_COLOR[selectedRace.status]} />
                </Box>
                <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                  <Typography variant="body2" color="text.secondary">🏁 {selectedRace.distance}m</Typography>
                  <Typography variant="body2" color="text.secondary">💰 ${selectedRace.purse?.toLocaleString()}</Typography>
                  <Typography variant="body2" color="text.secondary">📋 Phí: ${selectedRace.registrationFee?.toLocaleString()}</Typography>
                  {typeof selectedRace.refereeId === 'object' && selectedRace.refereeId && (
                    <Typography variant="body2" color="text.secondary">👤 TT: {selectedRace.refereeId.fullName}</Typography>
                  )}
                </Box>
              </Box>

              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                Danh sách đăng ký ({registrations.length} / {selectedRace.maxCapacity} ngựa)
              </Typography>

              {loadingRegs ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
              ) : (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600 }}>Ngựa</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Chủ sở hữu</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Jockey</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Phí</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>KT ngựa</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Trạng thái</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {registrations.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>Chưa có đăng ký</TableCell>
                        </TableRow>
                      ) : registrations.map(reg => (
                        <TableRow key={reg._id} hover>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Avatar sx={{ width: 32, height: 32, bgcolor: '#f59e0b', fontSize: '0.85rem' }}>
                                <Pets fontSize="small" />
                              </Avatar>
                              <Box>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                  {typeof reg.horseId === 'object' ? reg.horseId.name : '-'}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {typeof reg.horseId === 'object' ? reg.horseId.currentGrade : ''}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {typeof reg.ownerId === 'object' ? reg.ownerId.fullName : '-'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            {typeof reg.jockeyId === 'object' && reg.jockeyId ? (
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <Person fontSize="small" sx={{ color: 'text.secondary', fontSize: 14 }} />
                                <Typography variant="body2">{reg.jockeyId.fullName}</Typography>
                              </Box>
                            ) : (
                              <Typography variant="caption" color="warning.main">Chưa gán</Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">${reg.feePaid?.toLocaleString()}</Typography>
                          </TableCell>
                          <TableCell>
                            <Chip label={PRECHECK_LABEL[reg.preCheckResult?.status] || '-'} size="small" color={PRECHECK_COLOR[reg.preCheckResult?.status] || 'default'} />
                          </TableCell>
                          <TableCell>
                            <Chip label={REG_STATUS_LABEL[reg.status]} size="small" color={REG_STATUS_COLOR[reg.status] || 'default'} />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Paper>
          ) : (
            <Paper sx={{ p: 6, borderRadius: '12px', textAlign: 'center' }}>
              <Typography color="text.secondary">Chọn một cuộc đua từ danh sách bên trái để xem đăng ký</Typography>
            </Paper>
          )}
        </Grid>
      </Grid>
    </Box>
  );
}
