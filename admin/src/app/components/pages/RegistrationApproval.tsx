import { useState } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Grid,
  TextField,
  Tabs,
  Tab,
} from '@mui/material';
import { CheckCircle, Cancel, Visibility, HourglassEmpty } from '@mui/icons-material';

interface Registration {
  id: number;
  horseName: string;
  jockeyName: string;
  ownerName: string;
  tournament: string;
  race: string;
  submittedDate: string;
  status: 'pending' | 'approved' | 'rejected';
  documents: string[];
}

const mockRegistrations: Registration[] = [
  {
    id: 1,
    horseName: 'Thunder Bolt',
    jockeyName: 'Nguyễn Văn An',
    ownerName: 'Công ty TNHH ABC',
    tournament: 'Giải Vô Địch Quốc Gia 2026',
    race: 'Vòng 1 - Sprint Championship',
    submittedDate: '2026-05-15',
    status: 'pending',
    documents: ['Giấy chứng nhận sức khỏe ngựa', 'Bằng cấp jockey', 'Hợp đồng sở hữu'],
  },
  {
    id: 2,
    horseName: 'Lightning Star',
    jockeyName: 'Trần Thị Mai',
    ownerName: 'Trại ngựa Hoàng Gia',
    tournament: 'Giải Vô Địch Quốc Gia 2026',
    race: 'Vòng 2 - Classic Race',
    submittedDate: '2026-05-16',
    status: 'pending',
    documents: ['Giấy chứng nhận sức khỏe ngựa', 'Bằng cấp jockey'],
  },
  {
    id: 3,
    horseName: 'Golden Wind',
    jockeyName: 'Lê Văn Hùng',
    ownerName: 'Nguyễn Văn B',
    tournament: 'Cúp Mùa Xuân',
    race: 'Vòng Final',
    submittedDate: '2026-05-10',
    status: 'approved',
    documents: ['Giấy chứng nhận sức khỏe ngựa', 'Bằng cấp jockey', 'Hợp đồng sở hữu'],
  },
];

export default function RegistrationApproval() {
  const [currentTab, setCurrentTab] = useState(0);
  const [registrations] = useState<Registration[]>(mockRegistrations);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedRegistration, setSelectedRegistration] = useState<Registration | null>(null);

  const handleViewDetails = (registration: Registration) => {
    setSelectedRegistration(registration);
    setOpenDialog(true);
  };

  const filteredRegistrations = registrations.filter((reg) => {
    if (currentTab === 0) return reg.status === 'pending';
    if (currentTab === 1) return reg.status === 'approved';
    if (currentTab === 2) return reg.status === 'rejected';
    return true;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'approved':
        return 'success';
      case 'rejected':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Chờ duyệt';
      case 'approved':
        return 'Đã duyệt';
      case 'rejected':
        return 'Từ chối';
      default:
        return status;
    }
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
        Duyệt đăng ký tham gia
      </Typography>

      <Paper sx={{ borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
        <Tabs
          value={currentTab}
          onChange={(_, newValue) => setCurrentTab(newValue)}
          sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}
        >
          <Tab
            label={`Chờ duyệt (${registrations.filter((r) => r.status === 'pending').length})`}
            icon={<HourglassEmpty />}
            iconPosition="start"
          />
          <Tab
            label={`Đã duyệt (${registrations.filter((r) => r.status === 'approved').length})`}
            icon={<CheckCircle />}
            iconPosition="start"
          />
          <Tab
            label={`Từ chối (${registrations.filter((r) => r.status === 'rejected').length})`}
            icon={<Cancel />}
            iconPosition="start"
          />
        </Tabs>

        <Box sx={{ p: 3 }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Ngựa đua</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Jockey</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Chủ sở hữu</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Giải đấu</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Vòng đua</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Ngày nộp</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Trạng thái</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">
                    Hành động
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredRegistrations.map((registration) => (
                  <TableRow key={registration.id} hover>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        🐴 {registration.horseName}
                      </Typography>
                    </TableCell>
                    <TableCell>{registration.jockeyName}</TableCell>
                    <TableCell>{registration.ownerName}</TableCell>
                    <TableCell>{registration.tournament}</TableCell>
                    <TableCell>{registration.race}</TableCell>
                    <TableCell>{registration.submittedDate}</TableCell>
                    <TableCell>
                      <Chip
                        label={getStatusLabel(registration.status)}
                        size="small"
                        color={getStatusColor(registration.status)}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Button
                        size="small"
                        startIcon={<Visibility />}
                        onClick={() => handleViewDetails(registration)}
                      >
                        Chi tiết
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </Paper>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Chi tiết đăng ký</DialogTitle>
        <DialogContent>
          {selectedRegistration && (
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">
                    Ngựa đua
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {selectedRegistration.horseName}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">
                    Jockey
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {selectedRegistration.jockeyName}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">
                    Chủ sở hữu
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {selectedRegistration.ownerName}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">
                    Ngày nộp
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {selectedRegistration.submittedDate}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary">
                    Giải đấu
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {selectedRegistration.tournament}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary">
                    Vòng đua
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {selectedRegistration.race}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                    Tài liệu đính kèm
                  </Typography>
                  {selectedRegistration.documents.map((doc, index) => (
                    <Chip key={index} label={doc} sx={{ mr: 1, mb: 1 }} />
                  ))}
                </Grid>
                {selectedRegistration.status === 'pending' && (
                  <Grid item xs={12}>
                    <TextField label="Ghi chú" fullWidth multiline rows={3} placeholder="Nhập ghi chú..." />
                  </Grid>
                )}
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          {selectedRegistration?.status === 'pending' && (
            <>
              <Button
                variant="outlined"
                color="error"
                startIcon={<Cancel />}
                onClick={() => setOpenDialog(false)}
              >
                Từ chối
              </Button>
              <Button
                variant="contained"
                color="success"
                startIcon={<CheckCircle />}
                onClick={() => setOpenDialog(false)}
              >
                Phê duyệt
              </Button>
            </>
          )}
          {selectedRegistration?.status !== 'pending' && (
            <Button onClick={() => setOpenDialog(false)}>Đóng</Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
}
