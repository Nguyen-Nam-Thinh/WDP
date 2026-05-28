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
  IconButton,
  Chip,
  Button,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Card,
  CardContent,
  Typography,
  InputAdornment,
} from '@mui/material';
import {
  Edit,
  Delete,
  Add,
  CalendarToday,
  Schedule,
  EmojiEvents,
  Visibility,
} from '@mui/icons-material';

interface Tournament {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  location: string;
  status: 'upcoming' | 'ongoing' | 'completed';
  races: number;
  prize: string;
}

interface Race {
  id: number;
  tournamentId: number;
  name: string;
  date: string;
  time: string;
  distance: string;
  participants: number;
  status: 'scheduled' | 'ongoing' | 'completed';
}

const mockTournaments: Tournament[] = [
  {
    id: 1,
    name: 'Giải Vô Địch Quốc Gia 2026',
    startDate: '2026-06-15',
    endDate: '2026-06-20',
    location: 'Sài Gòn',
    status: 'upcoming',
    races: 12,
    prize: '5,000,000,000 VNĐ',
  },
  {
    id: 2,
    name: 'Cúp Mùa Xuân',
    startDate: '2026-03-10',
    endDate: '2026-03-15',
    location: 'Hà Nội',
    status: 'completed',
    races: 8,
    prize: '2,000,000,000 VNĐ',
  },
];

const mockRaces: Race[] = [
  {
    id: 1,
    tournamentId: 1,
    name: 'Vòng 1 - Sprint Championship',
    date: '2026-06-15',
    time: '09:00',
    distance: '1200m',
    participants: 12,
    status: 'scheduled',
  },
  {
    id: 2,
    tournamentId: 1,
    name: 'Vòng 2 - Classic Race',
    date: '2026-06-16',
    time: '14:00',
    distance: '1800m',
    participants: 10,
    status: 'scheduled',
  },
];

export default function TournamentManagement() {
  const [currentTab, setCurrentTab] = useState(0);
  const [tournaments] = useState<Tournament[]>(mockTournaments);
  const [races] = useState<Race[]>(mockRaces);
  const [openTournamentDialog, setOpenTournamentDialog] = useState(false);
  const [openRaceDialog, setOpenRaceDialog] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming':
      case 'scheduled':
        return 'info';
      case 'ongoing':
        return 'warning';
      case 'completed':
        return 'success';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'upcoming':
      case 'scheduled':
        return 'Sắp diễn ra';
      case 'ongoing':
        return 'Đang diễn ra';
      case 'completed':
        return 'Đã kết thúc';
      default:
        return status;
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          Quản lý giải đấu
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setOpenTournamentDialog(true)}
          sx={{ borderRadius: '8px' }}
        >
          Tạo giải đấu mới
        </Button>
      </Box>

      <Paper sx={{ borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
        <Tabs
          value={currentTab}
          onChange={(_, newValue) => setCurrentTab(newValue)}
          sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}
        >
          <Tab label="Giải đấu" icon={<EmojiEvents />} iconPosition="start" />
          <Tab label="Lịch thi đấu" icon={<CalendarToday />} iconPosition="start" />
        </Tabs>

        {currentTab === 0 && (
          <Box sx={{ p: 3 }}>
            <Grid container spacing={3}>
              {tournaments.map((tournament) => (
                <Grid item xs={12} md={6} key={tournament.id}>
                  <Card sx={{ borderRadius: '12px', border: '1px solid #e0e0e0' }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                        <Box>
                          <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                            {tournament.name}
                          </Typography>
                          <Chip
                            label={getStatusLabel(tournament.status)}
                            size="small"
                            color={getStatusColor(tournament.status)}
                          />
                        </Box>
                        <Box>
                          <IconButton size="small">
                            <Edit fontSize="small" />
                          </IconButton>
                          <IconButton size="small" color="error">
                            <Delete fontSize="small" />
                          </IconButton>
                        </Box>
                      </Box>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <CalendarToday sx={{ fontSize: 16, color: 'text.secondary' }} />
                          <Typography variant="body2" color="text.secondary">
                            {tournament.startDate} - {tournament.endDate}
                          </Typography>
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                          📍 {tournament.location}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          🏆 Giải thưởng: {tournament.prize}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          🏁 Số vòng đua: {tournament.races}
                        </Typography>
                      </Box>
                      <Button
                        fullWidth
                        variant="outlined"
                        startIcon={<Visibility />}
                        sx={{ mt: 2, borderRadius: '8px' }}
                      >
                        Xem chi tiết
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {currentTab === 1 && (
          <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => setOpenRaceDialog(true)}
                sx={{ borderRadius: '8px' }}
              >
                Thêm vòng đua
              </Button>
            </Box>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Tên vòng đua</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Ngày</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Giờ</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Cự ly</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Số ngựa</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Trạng thái</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="right">
                      Hành động
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {races.map((race) => (
                    <TableRow key={race.id} hover>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {race.name}
                        </Typography>
                      </TableCell>
                      <TableCell>{race.date}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Schedule fontSize="small" />
                          {race.time}
                        </Box>
                      </TableCell>
                      <TableCell>{race.distance}</TableCell>
                      <TableCell>{race.participants}</TableCell>
                      <TableCell>
                        <Chip
                          label={getStatusLabel(race.status)}
                          size="small"
                          color={getStatusColor(race.status)}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <IconButton size="small">
                          <Edit fontSize="small" />
                        </IconButton>
                        <IconButton size="small" color="error">
                          <Delete fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}
      </Paper>

      <Dialog open={openTournamentDialog} onClose={() => setOpenTournamentDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Tạo giải đấu mới</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField label="Tên giải đấu" fullWidth />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Ngày bắt đầu" type="date" fullWidth InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Ngày kết thúc" type="date" fullWidth InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={12}>
              <TextField label="Địa điểm" fullWidth />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Giải thưởng"
                fullWidth
                InputProps={{
                  endAdornment: <InputAdornment position="end">VNĐ</InputAdornment>,
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField label="Mô tả" fullWidth multiline rows={3} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenTournamentDialog(false)}>Hủy</Button>
          <Button variant="contained" onClick={() => setOpenTournamentDialog(false)}>
            Tạo giải đấu
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openRaceDialog} onClose={() => setOpenRaceDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Thêm vòng đua</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField label="Tên vòng đua" fullWidth />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Ngày thi đấu" type="date" fullWidth InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Giờ thi đấu" type="time" fullWidth InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Cự ly"
                fullWidth
                InputProps={{
                  endAdornment: <InputAdornment position="end">m</InputAdornment>,
                }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenRaceDialog(false)}>Hủy</Button>
          <Button variant="contained" onClick={() => setOpenRaceDialog(false)}>
            Thêm vòng đua
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
