import { useState, useEffect, useCallback } from 'react';
import {
  Box, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, Chip, Button, Tabs, Tab, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, Grid, Card, CardContent, Typography, MenuItem,
  CircularProgress, FormControl, InputLabel, Select,
} from '@mui/material';
import { Edit, Delete, Add, CalendarToday, Schedule, EmojiEvents, Visibility } from '@mui/icons-material';
import { toast } from 'sonner';
import { tournamentApi, type Tournament, type CreateTournamentData } from '../../api/tournament';
import { raceApi, type Race, type CreateRaceData } from '../../api/race';

// ── Helpers ────────────────────────────────────────────────────────────────────

const STATUS_COLOR: Record<string, 'info' | 'warning' | 'success' | 'error' | 'default'> = {
  upcoming: 'info', ongoing: 'warning', finished: 'success', cancelled: 'error',
  open: 'info', closed: 'warning', pre_check: 'warning', running: 'success', default: 'default',
};
const STATUS_LABEL: Record<string, string> = {
  upcoming: 'Sắp diễn ra', ongoing: 'Đang diễn ra', finished: 'Đã kết thúc', cancelled: 'Đã hủy',
  open: 'Mở đăng ký', closed: 'Đóng đăng ký', pre_check: 'Kiểm tra', running: 'Đang đua', default: 'N/A',
};
const GRADES = ['Maiden', 'G3', 'G2', 'G1'];
const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString('vi-VN') : '-';
const fmtDateTime = (d: string) => d ? new Date(d).toLocaleString('vi-VN') : '-';

// ── Tournament Form Dialog ─────────────────────────────────────────────────────

interface TournamentDialogProps {
  open: boolean;
  editing: Tournament | null;
  onClose: () => void;
  onSaved: () => void;
}

function TournamentDialog({ open, editing, onClose, onSaved }: TournamentDialogProps) {
  const empty = { name: '', description: '', location: '', startDate: '', endDate: '' };
  const [form, setForm] = useState<typeof empty>(empty);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editing) {
      setForm({
        name: editing.name,
        description: editing.description || '',
        location: editing.location || '',
        startDate: editing.startDate.slice(0, 10),
        endDate: editing.endDate.slice(0, 10),
      });
    } else {
      setForm(empty);
    }
  }, [editing, open]);

  const f = (k: keyof typeof empty) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }));

  const handleSave = async () => {
    if (!form.name || !form.startDate || !form.endDate) {
      toast.error('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await tournamentApi.update(editing._id, form);
        toast.success('Cập nhật giải đấu thành công');
      } else {
        await tournamentApi.create(form as CreateTournamentData);
        toast.success('Tạo giải đấu thành công');
      }
      onSaved();
      onClose();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{editing ? 'Chỉnh sửa giải đấu' : 'Tạo giải đấu mới'}</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12}>
            <TextField label="Tên giải đấu *" fullWidth value={form.name} onChange={f('name')} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="Ngày bắt đầu *" type="date" fullWidth value={form.startDate} onChange={f('startDate')} InputLabelProps={{ shrink: true }} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="Ngày kết thúc *" type="date" fullWidth value={form.endDate} onChange={f('endDate')} InputLabelProps={{ shrink: true }} />
          </Grid>
          <Grid item xs={12}>
            <TextField label="Địa điểm" fullWidth value={form.location} onChange={f('location')} />
          </Grid>
          <Grid item xs={12}>
            <TextField label="Mô tả" fullWidth multiline rows={3} value={form.description} onChange={f('description')} />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} disabled={saving}>Hủy</Button>
        <Button variant="contained" onClick={handleSave} disabled={saving}>
          {saving ? <CircularProgress size={20} /> : (editing ? 'Lưu thay đổi' : 'Tạo giải đấu')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ── Race Form Dialog ───────────────────────────────────────────────────────────

interface RaceDialogProps {
  open: boolean;
  editing: Race | null;
  tournaments: Tournament[];
  onClose: () => void;
  onSaved: () => void;
}

const emptyRace = {
  tournamentId: '', name: '', grade: 'Maiden',
  maxCapacity: 12, purse: 0, registrationFee: 0,
  scheduledTime: '', cutoffTime: '', distance: 1600,
};

function RaceDialog({ open, editing, tournaments, onClose, onSaved }: RaceDialogProps) {
  const [form, setForm] = useState({ ...emptyRace });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editing) {
      const tid = typeof editing.tournamentId === 'object' ? editing.tournamentId._id : editing.tournamentId;
      setForm({
        tournamentId: tid,
        name: editing.name,
        grade: editing.grade,
        maxCapacity: editing.maxCapacity,
        purse: editing.purse,
        registrationFee: editing.registrationFee,
        scheduledTime: editing.scheduledTime.slice(0, 16),
        cutoffTime: editing.cutoffTime.slice(0, 16),
        distance: editing.distance,
      });
    } else {
      setForm({ ...emptyRace });
    }
  }, [editing, open]);

  const setF = (k: keyof typeof emptyRace, v: any) => setForm(prev => ({ ...prev, [k]: v }));

  const handleSave = async () => {
    if (!form.tournamentId || !form.name || !form.scheduledTime || !form.cutoffTime) {
      toast.error('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }
    setSaving(true);
    try {
      const payload: CreateRaceData = {
        ...form,
        purse: Number(form.purse),
        registrationFee: Number(form.registrationFee),
        maxCapacity: Number(form.maxCapacity),
        distance: Number(form.distance),
      };
      if (editing) {
        await raceApi.update(editing._id, payload);
        toast.success('Cập nhật cuộc đua thành công');
      } else {
        await raceApi.create(payload);
        toast.success('Tạo cuộc đua thành công');
      }
      onSaved();
      onClose();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{editing ? 'Chỉnh sửa cuộc đua' : 'Tạo cuộc đua mới'}</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Giải đấu *</InputLabel>
              <Select value={form.tournamentId} label="Giải đấu *" onChange={e => setF('tournamentId', e.target.value)}>
                {tournaments.map(t => <MenuItem key={t._id} value={t._id}>{t.name}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Hạng *</InputLabel>
              <Select value={form.grade} label="Hạng *" onChange={e => setF('grade', e.target.value)}>
                {GRADES.map(g => <MenuItem key={g} value={g}>{g}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <TextField label="Tên cuộc đua *" fullWidth value={form.name} onChange={e => setF('name', e.target.value)} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="Thời gian đua *" type="datetime-local" fullWidth value={form.scheduledTime} onChange={e => setF('scheduledTime', e.target.value)} InputLabelProps={{ shrink: true }} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="Hạn đăng ký *" type="datetime-local" fullWidth value={form.cutoffTime} onChange={e => setF('cutoffTime', e.target.value)} InputLabelProps={{ shrink: true }} helperText="Ít nhất 48h trước giờ đua" />
          </Grid>
          <Grid item xs={6} sm={3}>
            <TextField label="Cự ly (m)" type="number" fullWidth value={form.distance} onChange={e => setF('distance', e.target.value)} />
          </Grid>
          <Grid item xs={6} sm={3}>
            <TextField label="Sức chứa" type="number" fullWidth value={form.maxCapacity} onChange={e => setF('maxCapacity', e.target.value)} />
          </Grid>
          <Grid item xs={6} sm={3}>
            <TextField label="Tiền thưởng ($)" type="number" fullWidth value={form.purse} onChange={e => setF('purse', e.target.value)} />
          </Grid>
          <Grid item xs={6} sm={3}>
            <TextField label="Phí đăng ký ($)" type="number" fullWidth value={form.registrationFee} onChange={e => setF('registrationFee', e.target.value)} />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} disabled={saving}>Hủy</Button>
        <Button variant="contained" onClick={handleSave} disabled={saving}>
          {saving ? <CircularProgress size={20} /> : (editing ? 'Lưu thay đổi' : 'Tạo cuộc đua')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ── Status Change Dialog ───────────────────────────────────────────────────────

function StatusDialog({ open, race, onClose, onSaved }: { open: boolean; race: Race | null; onClose: () => void; onSaved: () => void }) {
  const [saving, setSaving] = useState(false);

  const nextStatus = race?.status === 'open' ? 'closed' : race?.status === 'closed' ? 'pre_check' : null;

  const handleConfirm = async () => {
    if (!race || !nextStatus) return;
    setSaving(true);
    try {
      await raceApi.updateStatus(race._id, nextStatus as 'closed' | 'pre_check');
      toast.success(`Chuyển trạng thái thành công: ${STATUS_LABEL[nextStatus]}`);
      onSaved();
      onClose();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Chuyển trạng thái cuộc đua</DialogTitle>
      <DialogContent>
        <Typography>
          Chuyển <b>{race?.name}</b> từ <Chip label={STATUS_LABEL[race?.status || 'default']} size="small" color={STATUS_COLOR[race?.status || 'default']} sx={{ mx: 0.5 }} /> sang <Chip label={STATUS_LABEL[nextStatus || 'default']} size="small" color={STATUS_COLOR[nextStatus || 'default']} sx={{ mx: 0.5 }} />?
        </Typography>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} disabled={saving}>Hủy</Button>
        <Button variant="contained" onClick={handleConfirm} disabled={saving || !nextStatus}>
          {saving ? <CircularProgress size={20} /> : 'Xác nhận'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function TournamentManagement() {
  const [tab, setTab] = useState(0);

  // Tournaments
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loadingT, setLoadingT] = useState(true);
  const [tDialog, setTDialog] = useState(false);
  const [editingT, setEditingT] = useState<Tournament | null>(null);

  // Races
  const [races, setRaces] = useState<Race[]>([]);
  const [loadingR, setLoadingR] = useState(false);
  const [rDialog, setRDialog] = useState(false);
  const [editingR, setEditingR] = useState<Race | null>(null);
  const [statusDialog, setStatusDialog] = useState(false);
  const [statusRace, setStatusRace] = useState<Race | null>(null);
  const [filterTournament, setFilterTournament] = useState('');

  const loadTournaments = useCallback(async () => {
    setLoadingT(true);
    try {
      const res = await tournamentApi.list(1, 100);
      setTournaments(res.tournaments);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoadingT(false);
    }
  }, []);

  const loadRaces = useCallback(async () => {
    setLoadingR(true);
    try {
      const res = await raceApi.list({ tournamentId: filterTournament || undefined, limit: 100 });
      setRaces(res.races);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoadingR(false);
    }
  }, [filterTournament]);

  useEffect(() => { loadTournaments(); }, [loadTournaments]);
  useEffect(() => { if (tab === 1) loadRaces(); }, [tab, loadRaces]);

  const handleDeleteTournament = async (t: Tournament) => {
    if (!confirm(`Xóa giải đấu "${t.name}"?`)) return;
    try {
      await tournamentApi.delete(t._id);
      toast.success('Đã xóa giải đấu');
      loadTournaments();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleCancelRace = async (r: Race) => {
    if (!confirm(`Hủy cuộc đua "${r.name}"? Tất cả phí đăng ký sẽ được hoàn trả 100%.`)) return;
    try {
      await raceApi.cancel(r._id);
      toast.success('Đã hủy cuộc đua và hoàn phí');
      loadRaces();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>Quản lý giải đấu</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => { setEditingT(null); setTDialog(true); }} sx={{ borderRadius: '8px' }}>
          Tạo giải đấu mới
        </Button>
      </Box>

      <Paper sx={{ borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}>
          <Tab label="Giải đấu" icon={<EmojiEvents />} iconPosition="start" />
          <Tab label="Lịch thi đấu" icon={<CalendarToday />} iconPosition="start" />
        </Tabs>

        {/* ── Tab 0: Tournaments ── */}
        {tab === 0 && (
          <Box sx={{ p: 3 }}>
            {loadingT ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
            ) : tournaments.length === 0 ? (
              <Typography color="text.secondary" align="center" sx={{ py: 6 }}>Chưa có giải đấu nào</Typography>
            ) : (
              <Grid container spacing={3}>
                {tournaments.map((t) => (
                  <Grid item xs={12} md={6} key={t._id}>
                    <Card sx={{ borderRadius: '12px', border: '1px solid #e0e0e0' }}>
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                          <Box>
                            <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>{t.name}</Typography>
                            <Chip label={STATUS_LABEL[t.status] || t.status} size="small" color={STATUS_COLOR[t.status] || 'default'} />
                            {!t.isActive && <Chip label="Không hoạt động" size="small" color="error" sx={{ ml: 1 }} />}
                          </Box>
                          <Box>
                            <IconButton size="small" onClick={() => { setEditingT(t); setTDialog(true); }}><Edit fontSize="small" /></IconButton>
                            <IconButton size="small" color="error" onClick={() => handleDeleteTournament(t)}><Delete fontSize="small" /></IconButton>
                          </Box>
                        </Box>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.8 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <CalendarToday sx={{ fontSize: 14, color: 'text.secondary' }} />
                            <Typography variant="body2" color="text.secondary">{fmtDate(t.startDate)} — {fmtDate(t.endDate)}</Typography>
                          </Box>
                          {t.location && <Typography variant="body2" color="text.secondary">📍 {t.location}</Typography>}
                          {t.description && <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>{t.description}</Typography>}
                        </Box>
                        <Button fullWidth variant="outlined" startIcon={<Visibility />}
                          sx={{ mt: 2, borderRadius: '8px' }}
                          onClick={() => { setFilterTournament(t._id); setTab(1); }}>
                          Xem cuộc đua
                        </Button>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>
        )}

        {/* ── Tab 1: Races ── */}
        {tab === 1 && (
          <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, gap: 2, flexWrap: 'wrap' }}>
              <FormControl sx={{ minWidth: 220 }} size="small">
                <InputLabel>Lọc theo giải đấu</InputLabel>
                <Select value={filterTournament} label="Lọc theo giải đấu" onChange={e => setFilterTournament(e.target.value)}>
                  <MenuItem value="">Tất cả</MenuItem>
                  {tournaments.map(t => <MenuItem key={t._id} value={t._id}>{t.name}</MenuItem>)}
                </Select>
              </FormControl>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button variant="outlined" onClick={loadRaces} disabled={loadingR}>Làm mới</Button>
                <Button variant="contained" startIcon={<Add />} onClick={() => { setEditingR(null); setRDialog(true); }}>
                  Thêm cuộc đua
                </Button>
              </Box>
            </Box>

            {loadingR ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>Tên cuộc đua</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Giải đấu</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Hạng</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Thời gian</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Cự ly</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Trọng tài</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Trạng thái</TableCell>
                      <TableCell sx={{ fontWeight: 600 }} align="right">Hành động</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {races.length === 0 ? (
                      <TableRow><TableCell colSpan={8} align="center" sx={{ py: 6, color: 'text.secondary' }}>Chưa có cuộc đua nào</TableCell></TableRow>
                    ) : races.map((r) => {
                      const tName = typeof r.tournamentId === 'object' ? r.tournamentId.name : '-';
                      const canChangeStatus = ['open', 'closed'].includes(r.status);
                      const canEdit = !['running', 'finished', 'cancelled'].includes(r.status);
                      const canCancel = !['running', 'finished', 'cancelled'].includes(r.status);
                      return (
                        <TableRow key={r._id} hover>
                          <TableCell><Typography variant="body2" sx={{ fontWeight: 500 }}>{r.name}</Typography></TableCell>
                          <TableCell><Typography variant="body2" color="text.secondary">{tName}</Typography></TableCell>
                          <TableCell><Chip label={r.grade} size="small" variant="outlined" /></TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <Schedule fontSize="small" sx={{ color: 'text.secondary', fontSize: 14 }} />
                              <Typography variant="body2">{fmtDateTime(r.scheduledTime)}</Typography>
                            </Box>
                          </TableCell>
                          <TableCell>{r.distance}m</TableCell>
                          <TableCell>
                            {typeof r.refereeId === 'object' && r.refereeId
                              ? <Typography variant="body2">{r.refereeId.fullName}</Typography>
                              : <Typography variant="body2" color="text.secondary">Chưa phân công</Typography>}
                          </TableCell>
                          <TableCell>
                            <Chip label={STATUS_LABEL[r.status] || r.status} size="small" color={STATUS_COLOR[r.status] || 'default'} />
                          </TableCell>
                          <TableCell align="right">
                            {canChangeStatus && (
                              <Button size="small" variant="outlined" sx={{ mr: 0.5, fontSize: '0.7rem' }}
                                onClick={() => { setStatusRace(r); setStatusDialog(true); }}>
                                Đổi TT
                              </Button>
                            )}
                            {canEdit && (
                              <IconButton size="small" onClick={() => { setEditingR(r); setRDialog(true); }}><Edit fontSize="small" /></IconButton>
                            )}
                            {canCancel && (
                              <IconButton size="small" color="error" onClick={() => handleCancelRace(r)}><Delete fontSize="small" /></IconButton>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
        )}
      </Paper>

      <TournamentDialog open={tDialog} editing={editingT} onClose={() => setTDialog(false)} onSaved={loadTournaments} />
      <RaceDialog open={rDialog} editing={editingR} tournaments={tournaments} onClose={() => setRDialog(false)} onSaved={loadRaces} />
      <StatusDialog open={statusDialog} race={statusRace} onClose={() => setStatusDialog(false)} onSaved={loadRaces} />
    </Box>
  );
}
