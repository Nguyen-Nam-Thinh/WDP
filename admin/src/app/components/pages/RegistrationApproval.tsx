import { useState, useEffect, useCallback } from 'react';
import {
  Box, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  Typography, Grid, Tabs, Tab, CircularProgress, FormControl, InputLabel, Select, MenuItem,
} from '@mui/material';
import { Visibility, HourglassEmpty, CheckCircle, Cancel, DirectionsRun } from '@mui/icons-material';
import { toast } from 'sonner';
import { registrationApi, type RegistrationListResponse } from '../../api/registration';
import type { Registration } from '../../api/race';

const STATUS_COLOR: Record<string, 'warning' | 'success' | 'error' | 'default'> = {
  active: 'success', cancelled: 'error', disqualified: 'error',
};
const STATUS_LABEL: Record<string, string> = {
  active: 'Đang hoạt động', cancelled: 'Đã hủy', disqualified: 'Bị loại',
};
const PRECHECK_COLOR: Record<string, 'default' | 'warning' | 'success' | 'error'> = {
  pending: 'warning', passed: 'success', failed: 'error',
};
const PRECHECK_LABEL: Record<string, string> = {
  pending: 'Chờ kiểm tra', passed: 'Đã qua', failed: 'Không qua',
};
const fmtDate = (d?: string) => d ? new Date(d).toLocaleString('vi-VN') : '-';

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

  const TabIcon = [HourglassEmpty, CheckCircle, Cancel][tab];

  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>Quản lý đăng ký tham gia</Typography>

      <Paper sx={{ borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}>
          <Tab label="Đang hoạt động" icon={<DirectionsRun />} iconPosition="start" />
          <Tab label="Đã hủy" icon={<Cancel />} iconPosition="start" />
          <Tab label="Bị loại (DQ)" icon={<Cancel />} iconPosition="start" />
        </Tabs>

        <Box sx={{ p: 3 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Ngựa</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Chủ sở hữu</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Jockey</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Cuộc đua</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Phí đã nộp</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Kiểm tra ngựa</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Trạng thái</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Đăng ký</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>Chi tiết</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {!data?.registrations?.length ? (
                    <TableRow><TableCell colSpan={9} align="center" sx={{ py: 6, color: 'text.secondary' }}>Không có dữ liệu</TableCell></TableRow>
                  ) : data.registrations.map(reg => (
                    <TableRow key={reg._id} hover>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          🐴 {typeof reg.horseId === 'object' ? reg.horseId.name : reg.horseId}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {typeof reg.horseId === 'object' ? `${reg.horseId.currentGrade} · ${reg.horseId.breed}` : ''}
                        </Typography>
                      </TableCell>
                      <TableCell>{typeof reg.ownerId === 'object' ? reg.ownerId.fullName : '-'}</TableCell>
                      <TableCell>{typeof reg.jockeyId === 'object' && reg.jockeyId ? reg.jockeyId.fullName : <Typography variant="caption" color="text.secondary">Chưa gán</Typography>}</TableCell>
                      <TableCell>
                        <Typography variant="body2">{typeof reg.raceId === 'object' ? reg.raceId.name : '-'}</Typography>
                        {typeof reg.raceId === 'object' && <Chip label={reg.raceId.grade} size="small" variant="outlined" sx={{ mt: 0.3 }} />}
                      </TableCell>
                      <TableCell>${reg.feePaid?.toLocaleString()}</TableCell>
                      <TableCell>
                        <Chip label={PRECHECK_LABEL[reg.preCheckResult?.status] || 'N/A'} size="small" color={PRECHECK_COLOR[reg.preCheckResult?.status] || 'default'} />
                      </TableCell>
                      <TableCell>
                        <Chip label={STATUS_LABEL[reg.status]} size="small" color={STATUS_COLOR[reg.status] || 'default'} />
                        {reg.refundAmount > 0 && (
                          <Typography variant="caption" color="success.main" sx={{ display: 'block', mt: 0.3 }}>
                            Hoàn: ${reg.refundAmount.toLocaleString()}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" color="text.secondary">{fmtDate(reg.registeredAt)}</Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Button size="small" startIcon={<Visibility />} onClick={() => handleView(reg)}>Chi tiết</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {data && data.totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mt: 2 }}>
              <Button disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Trước</Button>
              <Typography sx={{ px: 2, py: 0.8 }}>{page} / {data.totalPages}</Typography>
              <Button disabled={page >= data.totalPages} onClick={() => setPage(p => p + 1)}>Sau →</Button>
            </Box>
          )}
        </Box>
      </Paper>

      {/* Detail Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Chi tiết đăng ký</DialogTitle>
        <DialogContent>
          {selected && (
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">Ngựa</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {typeof selected.horseId === 'object' ? `${selected.horseId.name} (${selected.horseId.currentGrade})` : '-'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">Chủ sở hữu</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {typeof selected.ownerId === 'object' ? `${selected.ownerId.fullName} — ${selected.ownerId.email}` : '-'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">Jockey</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {typeof selected.jockeyId === 'object' && selected.jockeyId ? selected.jockeyId.fullName : 'Chưa gán'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">Cuộc đua</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {typeof selected.raceId === 'object' ? selected.raceId.name : '-'}
                  </Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" color="text.secondary">Phí đã nộp</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>${selected.feePaid?.toLocaleString()}</Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" color="text.secondary">Hoàn phí</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600, color: selected.refundAmount > 0 ? 'success.main' : 'inherit' }}>
                    ${selected.refundAmount?.toLocaleString() || 0}
                  </Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" color="text.secondary">Trạng thái</Typography>
                  <Box sx={{ mt: 0.5 }}><Chip label={STATUS_LABEL[selected.status]} size="small" color={STATUS_COLOR[selected.status] || 'default'} /></Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" color="text.secondary">Kiểm tra ngựa</Typography>
                  <Box sx={{ mt: 0.5 }}>
                    <Chip label={PRECHECK_LABEL[selected.preCheckResult?.status]} size="small" color={PRECHECK_COLOR[selected.preCheckResult?.status] || 'default'} />
                  </Box>
                </Grid>
                {selected.preCheckResult?.note && (
                  <Grid item xs={12}>
                    <Typography variant="caption" color="text.secondary">Ghi chú kiểm tra</Typography>
                    <Typography variant="body2" sx={{ mt: 0.5, p: 1.5, bgcolor: 'grey.50', borderRadius: 1 }}>{selected.preCheckResult.note}</Typography>
                  </Grid>
                )}
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">Ngày đăng ký</Typography>
                  <Typography variant="body2">{fmtDate(selected.registeredAt)}</Typography>
                </Grid>
                {selected.cancelledAt && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary">Ngày hủy</Typography>
                    <Typography variant="body2">{fmtDate(selected.cancelledAt)}</Typography>
                  </Grid>
                )}
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDialogOpen(false)}>Đóng</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
