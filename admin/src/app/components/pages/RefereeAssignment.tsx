import { useState, useEffect, useCallback } from 'react';
import {
  Box, Paper, Grid, Card, CardContent, Typography, Button, Chip, Avatar,
  List, ListItem, ListItemAvatar, ListItemText, IconButton, Dialog,
  DialogTitle, DialogContent, DialogActions, Tabs, Tab, CircularProgress, FormControl,
  InputLabel, Select, MenuItem,
} from '@mui/material';
import { PersonAdd, Assignment, CheckCircle, Refresh } from '@mui/icons-material';
import { toast } from 'sonner';
import { raceApi, type Race } from '../../api/race';
import { refereeAdminApi, type AdminUser } from '../../api/user';

export default function RefereeAssignment() {
  const [tab, setTab] = useState(0);

  // Race list
  const [races, setRaces] = useState<Race[]>([]);
  const [loadingRaces, setLoadingRaces] = useState(true);
  const [selectedRace, setSelectedRace] = useState<Race | null>(null);

  // Referees list
  const [referees, setReferees] = useState<AdminUser[]>([]);
  const [loadingRefs, setLoadingRefs] = useState(true);

  // Assign dialog
  const [assignDialog, setAssignDialog] = useState(false);
  const [selectedRefId, setSelectedRefId] = useState('');
  const [assigning, setAssigning] = useState(false);

  const loadRaces = useCallback(async () => {
    setLoadingRaces(true);
    try {
      const res = await raceApi.list({ limit: 100 });
      const active = res.races.filter(r => !['finished', 'cancelled'].includes(r.status));
      setRaces(active);
      if (!selectedRace && active.length) setSelectedRace(active[0]);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoadingRaces(false);
    }
  }, []);

  const loadReferees = useCallback(async () => {
    setLoadingRefs(true);
    try {
      const res = await refereeAdminApi.listReferees();
      setReferees(res.users);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoadingRefs(false);
    }
  }, []);

  useEffect(() => { loadRaces(); loadReferees(); }, [loadRaces, loadReferees]);

  const handleAssign = async () => {
    if (!selectedRace || !selectedRefId) return;
    setAssigning(true);
    try {
      const updated = await raceApi.assignReferee(selectedRace._id, selectedRefId);
      toast.success('Phân công trọng tài thành công');
      setSelectedRace(updated);
      setAssignDialog(false);
      setSelectedRefId('');
      loadRaces();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setAssigning(false);
    }
  };

  const assignedRef = selectedRace && typeof selectedRace.refereeId === 'object' && selectedRace.refereeId
    ? referees.find(r => r._id === (selectedRace.refereeId as any)?._id) || selectedRace.refereeId
    : null;

  const fmtDateTime = (d: string) => d ? new Date(d).toLocaleString('vi-VN') : '-';

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>Phân công trọng tài</Typography>
        <Button startIcon={<Refresh />} onClick={() => { loadRaces(); loadReferees(); }} variant="outlined">Làm mới</Button>
      </Box>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tab label="Phân công theo cuộc đua" />
        <Tab label="Danh sách trọng tài" />
      </Tabs>

      {/* ── Tab 0: Assign by race ── */}
      {tab === 0 && (
        <Grid container spacing={3}>
          {/* Race list */}
          <Grid item xs={12} md={5}>
            <Paper sx={{ p: 3, borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Danh sách cuộc đua</Typography>
              {loadingRaces ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
              ) : races.length === 0 ? (
                <Typography color="text.secondary" align="center" sx={{ py: 4 }}>Không có cuộc đua nào đang hoạt động</Typography>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {races.map(race => {
                    const hasReferee = !!(typeof race.refereeId === 'object' && race.refereeId);
                    return (
                      <Card
                        key={race._id}
                        sx={{
                          cursor: 'pointer',
                          border: selectedRace?._id === race._id ? '2px solid #2196f3' : '1px solid #e0e0e0',
                          bgcolor: selectedRace?._id === race._id ? '#e3f2fd' : 'white',
                        }}
                        onClick={() => setSelectedRace(race)}
                      >
                        <CardContent sx={{ pb: '12px !important' }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>{race.name}</Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                            {typeof race.tournamentId === 'object' ? race.tournamentId.name : '-'}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            📅 {fmtDateTime(race.scheduledTime)}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            <Chip label={race.grade} size="small" variant="outlined" />
                            <Chip
                              label={hasReferee ? '✓ Đã phân công' : '⚠ Chưa phân công'}
                              size="small"
                              color={hasReferee ? 'success' : 'warning'}
                            />
                          </Box>
                        </CardContent>
                      </Card>
                    );
                  })}
                </Box>
              )}
            </Paper>
          </Grid>

          {/* Detail panel */}
          <Grid item xs={12} md={7}>
            {selectedRace ? (
              <Paper sx={{ p: 3, borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>{selectedRace.name}</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                      {fmtDateTime(selectedRace.scheduledTime)} · {selectedRace.distance}m · {selectedRace.grade}
                    </Typography>
                  </Box>
                  <Button
                    variant="contained" startIcon={<PersonAdd />}
                    onClick={() => { setSelectedRefId(''); setAssignDialog(true); }}
                    sx={{ borderRadius: '8px' }}
                  >
                    {assignedRef ? 'Đổi trọng tài' : 'Gán trọng tài'}
                  </Button>
                </Box>

                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>Trọng tài được phân công</Typography>
                {assignedRef ? (
                  <ListItem sx={{ bgcolor: '#f5f5f5', borderRadius: '8px', mb: 1 }}>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: 'success.main' }}>
                        {(typeof assignedRef === 'object' && 'fullName' in assignedRef ? assignedRef.fullName : '?')[0]}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={typeof assignedRef === 'object' && 'fullName' in assignedRef ? assignedRef.fullName : '-'}
                      secondary={typeof assignedRef === 'object' && 'email' in assignedRef ? assignedRef.email : '-'}
                    />
                    <Chip icon={<CheckCircle />} label="Đã phân công" size="small" color="success" />
                  </ListItem>
                ) : (
                  <Typography color="text.secondary" sx={{ py: 2, px: 2, bgcolor: '#fafafa', borderRadius: 1 }}>
                    Chưa phân công trọng tài cho cuộc đua này
                  </Typography>
                )}

                {/* Available referees */}
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, mt: 3 }}>Trọng tài sẵn sàng</Typography>
                {loadingRefs ? (
                  <CircularProgress size={24} />
                ) : (
                  <List>
                    {referees
                      .filter(r => {
                        const assignedId = typeof selectedRace.refereeId === 'object' && selectedRace.refereeId
                          ? (selectedRace.refereeId as any)._id
                          : selectedRace.refereeId;
                        return r._id !== assignedId;
                      })
                      .map(referee => (
                        <ListItem key={referee._id} sx={{ bgcolor: '#fafafa', borderRadius: '8px', mb: 1 }}
                          secondaryAction={
                            <Button variant="outlined" size="small" startIcon={<Assignment />}
                              onClick={async () => {
                                setAssigning(true);
                                try {
                                  const updated = await raceApi.assignReferee(selectedRace._id, referee._id);
                                  toast.success(`Đã phân công ${referee.fullName}`);
                                  setSelectedRace(updated);
                                  loadRaces();
                                } catch (err: any) {
                                  toast.error(err.message);
                                } finally {
                                  setAssigning(false);
                                }
                              }}
                              disabled={assigning}
                              sx={{ borderRadius: '8px' }}
                            >
                              Phân công
                            </Button>
                          }
                        >
                          <ListItemAvatar>
                            <Avatar sx={{ bgcolor: 'primary.main' }}>{referee.fullName[0]}</Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={referee.fullName}
                            secondary={`${referee.refereeProfile?.yearsOfService ?? 0} năm KN · ${referee.refereeProfile?.licenseNumber || 'N/A'}`}
                          />
                        </ListItem>
                      ))}
                  </List>
                )}
              </Paper>
            ) : (
              <Paper sx={{ p: 6, borderRadius: '12px', textAlign: 'center' }}>
                <Typography color="text.secondary">Chọn một cuộc đua để xem chi tiết</Typography>
              </Paper>
            )}
          </Grid>
        </Grid>
      )}

      {/* ── Tab 1: All Referees ── */}
      {tab === 1 && (
        <Paper sx={{ p: 3, borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>Danh sách toàn bộ trọng tài</Typography>
          {loadingRefs ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
          ) : referees.length === 0 ? (
            <Typography color="text.secondary" align="center" sx={{ py: 4 }}>Không có trọng tài nào</Typography>
          ) : (
            <Grid container spacing={2}>
              {referees.map(referee => (
                <Grid item xs={12} md={6} lg={4} key={referee._id}>
                  <Card variant="outlined" sx={{ borderRadius: '8px' }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                        <Avatar sx={{ bgcolor: 'primary.main', width: 48, height: 48 }}>{referee.fullName[0]}</Avatar>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{referee.fullName}</Typography>
                          <Typography variant="body2" color="text.secondary">{referee.email}</Typography>
                          <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>
                            {referee.refereeProfile?.yearsOfService ?? 0} năm KN
                            {referee.refereeProfile?.licenseNumber ? ` · ${referee.refereeProfile.licenseNumber}` : ''}
                          </Typography>
                        </Box>
                        <Chip label="Trọng tài" size="small" color="info" />
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Paper>
      )}

      {/* Assign Dialog */}
      <Dialog open={assignDialog} onClose={() => setAssignDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Phân công trọng tài cho: {selectedRace?.name}</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Chọn trọng tài</InputLabel>
              <Select value={selectedRefId} label="Chọn trọng tài" onChange={e => setSelectedRefId(e.target.value)}>
                {referees.map(r => (
                  <MenuItem key={r._id} value={r._id}>
                    {r.fullName} — {r.refereeProfile?.yearsOfService ?? 0} năm KN
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setAssignDialog(false)} disabled={assigning}>Hủy</Button>
          <Button variant="contained" onClick={handleAssign} disabled={!selectedRefId || assigning}>
            {assigning ? <CircularProgress size={20} /> : 'Xác nhận phân công'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
