import { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  MenuItem,
  Tabs,
  Tab,
  Card,
  CardContent,
  Avatar,
  Divider,
  Alert,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Visibility as VisibilityIcon,
  Close as CloseIcon,
  Pets,
  Person,
  Gavel,
  Flag,
  Delete,
  Schedule,
  EmojiEvents,
} from '@mui/icons-material';

type RaceStatus = 'draft' | 'open' | 'ready' | 'running' | 'finished' | 'cancelled';

interface Horse {
  id: string;
  name: string;
  age: number;
  breed: string;
  owner: string;
  rating: number;
  wins: number;
  avgSpeed: number;
}

interface Jockey {
  id: string;
  name: string;
  experience: number;
  wins: number;
  rating: number;
  weight: number;
}

interface Referee {
  id: string;
  name: string;
  role: string;
  experience: number;
}

interface RaceParticipant {
  id: string;
  horseId: string;
  horse: Horse;
  jockeyId: string;
  jockey: Jockey;
  gateNumber: number;
  handicapWeight: number;
}

interface Race {
  id: string;
  code: string;
  name: string;
  tournament: string;
  category: string;
  grade: string;
  distance: string;
  trackType: string;
  status: RaceStatus;
  startTime: string;
  capacity: number;
  purse: string;
  participants: RaceParticipant[];
  referees: Referee[];
}

const mockHorses: Horse[] = [
  { id: 'h1', name: 'Thunder Bolt', age: 4, breed: 'Thoroughbred', owner: 'Green Valley Stables', rating: 95, wins: 12, avgSpeed: 65 },
  { id: 'h2', name: 'Lightning Strike', age: 3, breed: 'Arabian', owner: 'Desert Wind Farm', rating: 92, wins: 10, avgSpeed: 63 },
  { id: 'h3', name: 'Storm Chaser', age: 5, breed: 'Thoroughbred', owner: 'Blue Ridge Ranch', rating: 90, wins: 15, avgSpeed: 62 },
  { id: 'h4', name: 'Wild Spirit', age: 4, breed: 'Quarter Horse', owner: 'Mountain View Stables', rating: 88, wins: 8, avgSpeed: 60 },
  { id: 'h5', name: 'Golden Arrow', age: 3, breed: 'Thoroughbred', owner: 'Sunset Stables', rating: 87, wins: 9, avgSpeed: 61 },
];

const mockJockeys: Jockey[] = [
  { id: 'j1', name: 'John Smith', experience: 15, wins: 245, rating: 95, weight: 52 },
  { id: 'j2', name: 'Mike Johnson', experience: 12, wins: 198, rating: 92, weight: 51 },
  { id: 'j3', name: 'David Lee', experience: 18, wins: 312, rating: 96, weight: 53 },
  { id: 'j4', name: 'Sarah Wilson', experience: 10, wins: 156, rating: 89, weight: 50 },
  { id: 'j5', name: 'Tom Brown', experience: 8, wins: 134, rating: 87, weight: 52 },
];

const mockReferees: Referee[] = [
  { id: 'r1', name: 'Robert Chen', role: 'Chief Steward', experience: 20 },
  { id: 'r2', name: 'Maria Garcia', role: 'Starting Judge', experience: 15 },
  { id: 'r3', name: 'James Miller', role: 'Finish Judge', experience: 18 },
  { id: 'r4', name: 'Linda Taylor', role: 'Patrol Judge', experience: 12 },
  { id: 'r5', name: 'Michael Davis', role: 'Steward', experience: 10 },
];

const mockRaces: Race[] = [
  {
    id: '1',
    code: 'RACE-001',
    name: 'Derby Championship',
    tournament: 'Spring Cup 2026',
    category: 'Flat Racing',
    grade: 'G1',
    distance: '2400m',
    trackType: 'Turf',
    status: 'open',
    startTime: '2026-05-25T14:00',
    capacity: 12,
    purse: '$500,000',
    participants: [
      {
        id: 'p1',
        horseId: 'h1',
        horse: mockHorses[0],
        jockeyId: 'j1',
        jockey: mockJockeys[0],
        gateNumber: 1,
        handicapWeight: 58,
      },
      {
        id: 'p2',
        horseId: 'h2',
        horse: mockHorses[1],
        jockeyId: 'j2',
        jockey: mockJockeys[1],
        gateNumber: 2,
        handicapWeight: 57,
      },
      {
        id: 'p3',
        horseId: 'h3',
        horse: mockHorses[2],
        jockeyId: 'j3',
        jockey: mockJockeys[2],
        gateNumber: 3,
        handicapWeight: 59,
      },
    ],
    referees: [mockReferees[0], mockReferees[1], mockReferees[2]],
  },
  {
    id: '2',
    code: 'RACE-002',
    name: 'Sprint Classic',
    tournament: 'Summer Sprint Series',
    category: 'Sprint',
    grade: 'G2',
    distance: '1200m',
    trackType: 'Dirt',
    status: 'ready',
    startTime: '2026-05-26T15:30',
    capacity: 10,
    purse: '$200,000',
    participants: [],
    referees: [],
  },
  {
    id: '3',
    code: 'RACE-003',
    name: 'Endurance Test',
    tournament: 'Winter Classic',
    category: 'Endurance',
    grade: 'G3',
    distance: '3200m',
    trackType: 'Synthetic',
    status: 'running',
    startTime: '2026-05-21T16:00',
    capacity: 14,
    purse: '$150,000',
    participants: [],
    referees: [],
  },
];

export default function RaceManagement() {
  const [races, setRaces] = useState<Race[]>(mockRaces);
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [openDetailDialog, setOpenDetailDialog] = useState(false);
  const [selectedRace, setSelectedRace] = useState<Race | null>(null);
  const [detailTab, setDetailTab] = useState(0);

  // Add Participant Dialog
  const [openAddParticipant, setOpenAddParticipant] = useState(false);
  const [selectedHorse, setSelectedHorse] = useState('');
  const [selectedJockey, setSelectedJockey] = useState('');
  const [gateNumber, setGateNumber] = useState('');
  const [handicapWeight, setHandicapWeight] = useState('');

  // Add Referee Dialog
  const [openAddReferee, setOpenAddReferee] = useState(false);
  const [selectedReferee, setSelectedReferee] = useState('');

  const getStatusColor = (status: RaceStatus) => {
    switch (status) {
      case 'open':
      case 'ready':
        return 'success';
      case 'draft':
        return 'default';
      case 'running':
        return 'primary';
      case 'finished':
        return 'info';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const handleViewDetail = (race: Race) => {
    setSelectedRace(race);
    setDetailTab(0);
    setOpenDetailDialog(true);
  };

  const handleAddParticipant = () => {
    if (!selectedRace || !selectedHorse || !selectedJockey || !gateNumber || !handicapWeight) return;

    const horse = mockHorses.find((h) => h.id === selectedHorse);
    const jockey = mockJockeys.find((j) => j.id === selectedJockey);

    if (!horse || !jockey) return;

    const newParticipant: RaceParticipant = {
      id: `p${Date.now()}`,
      horseId: horse.id,
      horse,
      jockeyId: jockey.id,
      jockey,
      gateNumber: parseInt(gateNumber),
      handicapWeight: parseFloat(handicapWeight),
    };

    const updatedRace = {
      ...selectedRace,
      participants: [...selectedRace.participants, newParticipant],
    };

    setRaces(races.map((r) => (r.id === selectedRace.id ? updatedRace : r)));
    setSelectedRace(updatedRace);
    setOpenAddParticipant(false);
    setSelectedHorse('');
    setSelectedJockey('');
    setGateNumber('');
    setHandicapWeight('');
  };

  const handleRemoveParticipant = (participantId: string) => {
    if (!selectedRace) return;

    const updatedRace = {
      ...selectedRace,
      participants: selectedRace.participants.filter((p) => p.id !== participantId),
    };

    setRaces(races.map((r) => (r.id === selectedRace.id ? updatedRace : r)));
    setSelectedRace(updatedRace);
  };

  const handleAddReferee = () => {
    if (!selectedRace || !selectedReferee) return;

    const referee = mockReferees.find((r) => r.id === selectedReferee);
    if (!referee) return;

    const updatedRace = {
      ...selectedRace,
      referees: [...selectedRace.referees, referee],
    };

    setRaces(races.map((r) => (r.id === selectedRace.id ? updatedRace : r)));
    setSelectedRace(updatedRace);
    setOpenAddReferee(false);
    setSelectedReferee('');
  };

  const handleRemoveReferee = (refereeId: string) => {
    if (!selectedRace) return;

    const updatedRace = {
      ...selectedRace,
      referees: selectedRace.referees.filter((r) => r.id !== refereeId),
    };

    setRaces(races.map((r) => (r.id === selectedRace.id ? updatedRace : r)));
    setSelectedRace(updatedRace);
  };

  const availableHorses = mockHorses.filter(
    (h) => !selectedRace?.participants.some((p) => p.horseId === h.id)
  );

  const availableReferees = mockReferees.filter(
    (r) => !selectedRace?.referees.some((ref) => ref.id === r.id)
  );

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Quản lý chặng đua
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpenCreateDialog(true)}>
          Tạo chặng đua mới
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Mã</TableCell>
              <TableCell>Tên chặng đua</TableCell>
              <TableCell>Giải đấu</TableCell>
              <TableCell>Cự ly</TableCell>
              <TableCell>Thời gian</TableCell>
              <TableCell>Ngựa/Sức chứa</TableCell>
              <TableCell>Trọng tài</TableCell>
              <TableCell>Trạng thái</TableCell>
              <TableCell align="right">Hành động</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {races.map((race) => (
              <TableRow key={race.id}>
                <TableCell>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {race.code}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {race.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {race.category} - {race.grade}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>{race.tournament}</TableCell>
                <TableCell>
                  <Chip label={race.distance} size="small" icon={<Flag />} />
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Schedule fontSize="small" color="action" />
                    <Typography variant="body2">
                      {new Date(race.startTime).toLocaleDateString('vi-VN', {
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip
                    label={`${race.participants.length}/${race.capacity}`}
                    size="small"
                    color={race.participants.length === race.capacity ? 'success' : 'default'}
                  />
                </TableCell>
                <TableCell>
                  <Chip label={race.referees.length} size="small" icon={<Gavel />} />
                </TableCell>
                <TableCell>
                  <Chip label={race.status} color={getStatusColor(race.status)} size="small" />
                </TableCell>
                <TableCell align="right">
                  <IconButton size="small" onClick={() => handleViewDetail(race)}>
                    <VisibilityIcon />
                  </IconButton>
                  <IconButton size="small">
                    <EditIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Race Detail Dialog */}
      <Dialog open={openDetailDialog} onClose={() => setOpenDetailDialog(false)} maxWidth="lg" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {selectedRace?.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {selectedRace?.code} - {selectedRace?.tournament}
              </Typography>
            </Box>
            <IconButton onClick={() => setOpenDetailDialog(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {/* Race Info Cards */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Cự ly
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {selectedRace?.distance}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Loại đường đua
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {selectedRace?.trackType}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Giải thưởng
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#10b981' }}>
                    {selectedRace?.purse}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Trạng thái
                  </Typography>
                  <Chip label={selectedRace?.status} color={getStatusColor(selectedRace?.status || 'draft')} />
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Tabs value={detailTab} onChange={(_, newValue) => setDetailTab(newValue)} sx={{ mb: 2 }}>
            <Tab label={`Ngựa đua (${selectedRace?.participants.length || 0})`} />
            <Tab label={`Trọng tài (${selectedRace?.referees.length || 0})`} />
          </Tabs>

          {/* Participants Tab */}
          {detailTab === 0 && (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Alert severity="info" sx={{ flex: 1, mr: 2 }}>
                  Đã đăng ký: {selectedRace?.participants.length}/{selectedRace?.capacity}
                </Alert>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setOpenAddParticipant(true)}
                  disabled={selectedRace?.participants.length === selectedRace?.capacity}
                >
                  Thêm ngựa
                </Button>
              </Box>

              {selectedRace?.participants.length === 0 ? (
                <Alert severity="warning">Chưa có ngựa đua nào đăng ký</Alert>
              ) : (
                <Grid container spacing={2}>
                  {selectedRace?.participants.map((participant) => (
                    <Grid item xs={12} key={participant.id}>
                      <Card variant="outlined">
                        <CardContent>
                          <Grid container spacing={3}>
                            {/* Horse Info */}
                            <Grid item xs={12} md={5}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Avatar sx={{ width: 56, height: 56, bgcolor: '#667eea' }}>
                                  <Pets />
                                </Avatar>
                                <Box sx={{ flex: 1 }}>
                                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                    {participant.horse.name}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    {participant.horse.breed} - {participant.horse.age} tuổi
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    Chủ sở hữu: {participant.horse.owner}
                                  </Typography>
                                </Box>
                                <Chip
                                  label={`Cổng #${participant.gateNumber}`}
                                  color="primary"
                                  sx={{ fontWeight: 600 }}
                                />
                              </Box>
                              <Grid container spacing={2} sx={{ mt: 1 }}>
                                <Grid item xs={4}>
                                  <Typography variant="caption" color="text.secondary">
                                    Rating
                                  </Typography>
                                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                    {participant.horse.rating}
                                  </Typography>
                                </Grid>
                                <Grid item xs={4}>
                                  <Typography variant="caption" color="text.secondary">
                                    Thắng
                                  </Typography>
                                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                    {participant.horse.wins}
                                  </Typography>
                                </Grid>
                                <Grid item xs={4}>
                                  <Typography variant="caption" color="text.secondary">
                                    Tốc độ TB
                                  </Typography>
                                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                    {participant.horse.avgSpeed} km/h
                                  </Typography>
                                </Grid>
                              </Grid>
                            </Grid>

                            <Divider orientation="vertical" flexItem />

                            {/* Jockey Info */}
                            <Grid item xs={12} md={5}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Avatar sx={{ width: 56, height: 56, bgcolor: '#10b981' }}>
                                  <Person />
                                </Avatar>
                                <Box sx={{ flex: 1 }}>
                                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                    {participant.jockey.name}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    Jockey - {participant.jockey.experience} năm kinh nghiệm
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    Trọng lượng: {participant.jockey.weight} kg
                                  </Typography>
                                </Box>
                              </Box>
                              <Grid container spacing={2} sx={{ mt: 1 }}>
                                <Grid item xs={4}>
                                  <Typography variant="caption" color="text.secondary">
                                    Rating
                                  </Typography>
                                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                    {participant.jockey.rating}
                                  </Typography>
                                </Grid>
                                <Grid item xs={4}>
                                  <Typography variant="caption" color="text.secondary">
                                    Thắng
                                  </Typography>
                                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                    {participant.jockey.wins}
                                  </Typography>
                                </Grid>
                                <Grid item xs={4}>
                                  <Typography variant="caption" color="text.secondary">
                                    Handicap
                                  </Typography>
                                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                    {participant.handicapWeight} kg
                                  </Typography>
                                </Grid>
                              </Grid>
                            </Grid>

                            <Grid item xs={12} md={1} sx={{ display: 'flex', alignItems: 'center' }}>
                              <IconButton color="error" onClick={() => handleRemoveParticipant(participant.id)}>
                                <Delete />
                              </IconButton>
                            </Grid>
                          </Grid>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}
            </Box>
          )}

          {/* Referees Tab */}
          {detailTab === 1 && (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpenAddReferee(true)}>
                  Thêm trọng tài
                </Button>
              </Box>

              {selectedRace?.referees.length === 0 ? (
                <Alert severity="warning">Chưa có trọng tài nào được phân công</Alert>
              ) : (
                <List>
                  {selectedRace?.referees.map((referee) => (
                    <ListItem key={referee.id} divider>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: '#f59e0b' }}>
                          <Gavel />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Typography variant="body1" sx={{ fontWeight: 600 }}>
                            {referee.name}
                          </Typography>
                        }
                        secondary={
                          <Box>
                            <Chip label={referee.role} size="small" sx={{ mr: 1 }} />
                            <Typography component="span" variant="caption" color="text.secondary">
                              {referee.experience} năm kinh nghiệm
                            </Typography>
                          </Box>
                        }
                      />
                      <ListItemSecondaryAction>
                        <IconButton edge="end" color="error" onClick={() => handleRemoveReferee(referee.id)}>
                          <Delete />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDetailDialog(false)}>Đóng</Button>
        </DialogActions>
      </Dialog>

      {/* Add Participant Dialog */}
      <Dialog open={openAddParticipant} onClose={() => setOpenAddParticipant(false)} maxWidth="md" fullWidth>
        <DialogTitle>Thêm ngựa đua vào chặng</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                select
                fullWidth
                label="Chọn ngựa đua"
                value={selectedHorse}
                onChange={(e) => setSelectedHorse(e.target.value)}
              >
                {availableHorses.map((horse) => (
                  <MenuItem key={horse.id} value={horse.id}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                      <Typography>{horse.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Rating: {horse.rating} | Wins: {horse.wins}
                      </Typography>
                    </Box>
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                select
                fullWidth
                label="Chọn jockey"
                value={selectedJockey}
                onChange={(e) => setSelectedJockey(e.target.value)}
              >
                {mockJockeys.map((jockey) => (
                  <MenuItem key={jockey.id} value={jockey.id}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                      <Typography>{jockey.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Rating: {jockey.rating} | Wins: {jockey.wins} | Weight: {jockey.weight}kg
                      </Typography>
                    </Box>
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                type="number"
                label="Số cổng xuất phát"
                value={gateNumber}
                onChange={(e) => setGateNumber(e.target.value)}
                inputProps={{ min: 1, max: selectedRace?.capacity }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                type="number"
                label="Handicap Weight (kg)"
                value={handicapWeight}
                onChange={(e) => setHandicapWeight(e.target.value)}
                inputProps={{ min: 50, max: 70, step: 0.5 }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAddParticipant(false)}>Hủy</Button>
          <Button variant="contained" onClick={handleAddParticipant}>
            Thêm
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Referee Dialog */}
      <Dialog open={openAddReferee} onClose={() => setOpenAddReferee(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Phân công trọng tài</DialogTitle>
        <DialogContent>
          <TextField
            select
            fullWidth
            label="Chọn trọng tài"
            value={selectedReferee}
            onChange={(e) => setSelectedReferee(e.target.value)}
            sx={{ mt: 2 }}
          >
            {availableReferees.map((referee) => (
              <MenuItem key={referee.id} value={referee.id}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                  <Typography>{referee.name}</Typography>
                  <Chip label={referee.role} size="small" />
                </Box>
              </MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAddReferee(false)}>Hủy</Button>
          <Button variant="contained" onClick={handleAddReferee}>
            Phân công
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
