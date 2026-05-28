import { useState } from 'react';
import {
  Box,
  Paper,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
} from '@mui/material';
import { PersonAdd, Delete, Assignment, CheckCircle } from '@mui/icons-material';

interface Referee {
  id: number;
  name: string;
  experience: number;
  certificationLevel: string;
  assignedRaces: number;
  status: 'available' | 'assigned' | 'unavailable';
}

interface Race {
  id: number;
  name: string;
  date: string;
  time: string;
  tournament: string;
  assignedReferees: number[];
  requiredReferees: number;
}

const mockReferees: Referee[] = [
  {
    id: 1,
    name: 'Phạm Văn A',
    experience: 15,
    certificationLevel: 'Quốc tế',
    assignedRaces: 2,
    status: 'available',
  },
  {
    id: 2,
    name: 'Nguyễn Thị B',
    experience: 10,
    certificationLevel: 'Quốc gia',
    assignedRaces: 3,
    status: 'assigned',
  },
  {
    id: 3,
    name: 'Trần Văn C',
    experience: 8,
    certificationLevel: 'Quốc gia',
    assignedRaces: 1,
    status: 'available',
  },
  {
    id: 4,
    name: 'Lê Thị D',
    experience: 12,
    certificationLevel: 'Quốc tế',
    assignedRaces: 0,
    status: 'available',
  },
];

const mockRaces: Race[] = [
  {
    id: 1,
    name: 'Vòng 1 - Sprint Championship',
    date: '2026-06-15',
    time: '09:00',
    tournament: 'Giải Vô Địch Quốc Gia 2026',
    assignedReferees: [1, 2],
    requiredReferees: 3,
  },
  {
    id: 2,
    name: 'Vòng 2 - Classic Race',
    date: '2026-06-16',
    time: '14:00',
    tournament: 'Giải Vô Địch Quốc Gia 2026',
    assignedReferees: [2],
    requiredReferees: 3,
  },
];

export default function RefereeAssignment() {
  const [referees] = useState<Referee[]>(mockReferees);
  const [races] = useState<Race[]>(mockRaces);
  const [selectedRace, setSelectedRace] = useState<Race | null>(races[0]);
  const [openDialog, setOpenDialog] = useState(false);

  const getRefereeStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'success';
      case 'assigned':
        return 'warning';
      case 'unavailable':
        return 'error';
      default:
        return 'default';
    }
  };

  const getRefereeStatusLabel = (status: string) => {
    switch (status) {
      case 'available':
        return 'Sẵn sàng';
      case 'assigned':
        return 'Đã phân công';
      case 'unavailable':
        return 'Không khả dụng';
      default:
        return status;
    }
  };

  const getAssignedReferees = (raceId: number) => {
    const race = races.find((r) => r.id === raceId);
    if (!race) return [];
    return referees.filter((ref) => race.assignedReferees.includes(ref.id));
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
        Phân công trọng tài
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={5}>
          <Paper sx={{ p: 3, borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              Danh sách cuộc đua
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {races.map((race) => (
                <Card
                  key={race.id}
                  sx={{
                    cursor: 'pointer',
                    border: selectedRace?.id === race.id ? '2px solid #2196f3' : '1px solid #e0e0e0',
                    bgcolor: selectedRace?.id === race.id ? '#e3f2fd' : 'white',
                  }}
                  onClick={() => setSelectedRace(race)}
                >
                  <CardContent>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                      {race.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {race.tournament}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      📅 {race.date} - {race.time}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Chip
                        label={`${race.assignedReferees.length}/${race.requiredReferees} trọng tài`}
                        size="small"
                        color={
                          race.assignedReferees.length >= race.requiredReferees ? 'success' : 'warning'
                        }
                      />
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={7}>
          {selectedRace && (
            <Paper sx={{ p: 3, borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                    {selectedRace.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Trọng tài đã phân công: {selectedRace.assignedReferees.length}/
                    {selectedRace.requiredReferees}
                  </Typography>
                </Box>
                <Button
                  variant="contained"
                  startIcon={<PersonAdd />}
                  onClick={() => setOpenDialog(true)}
                  sx={{ borderRadius: '8px' }}
                >
                  Thêm trọng tài
                </Button>
              </Box>

              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                Trọng tài đã phân công
              </Typography>
              <List sx={{ mb: 3 }}>
                {getAssignedReferees(selectedRace.id).map((referee) => (
                  <ListItem
                    key={referee.id}
                    sx={{
                      bgcolor: '#f5f5f5',
                      borderRadius: '8px',
                      mb: 1,
                    }}
                    secondaryAction={
                      <IconButton edge="end" color="error">
                        <Delete />
                      </IconButton>
                    }
                  >
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: 'primary.main' }}>{referee.name.charAt(0)}</Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={referee.name}
                      secondary={`${referee.experience} năm kinh nghiệm - ${referee.certificationLevel}`}
                    />
                    <Chip
                      icon={<CheckCircle />}
                      label="Đã phân công"
                      size="small"
                      color="success"
                      sx={{ mr: 2 }}
                    />
                  </ListItem>
                ))}
              </List>

              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                Trọng tài khả dụng
              </Typography>
              <List>
                {referees
                  .filter((ref) => !selectedRace.assignedReferees.includes(ref.id))
                  .map((referee) => (
                    <ListItem
                      key={referee.id}
                      sx={{
                        bgcolor: '#fafafa',
                        borderRadius: '8px',
                        mb: 1,
                      }}
                      secondaryAction={
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<Assignment />}
                          sx={{ borderRadius: '8px' }}
                        >
                          Phân công
                        </Button>
                      }
                    >
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'secondary.main' }}>{referee.name.charAt(0)}</Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={referee.name}
                        secondary={`${referee.experience} năm kinh nghiệm - ${referee.certificationLevel}`}
                      />
                      <Chip
                        label={getRefereeStatusLabel(referee.status)}
                        size="small"
                        color={getRefereeStatusColor(referee.status)}
                        sx={{ mr: 2 }}
                      />
                    </ListItem>
                  ))}
              </List>
            </Paper>
          )}
        </Grid>
      </Grid>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Phân công trọng tài</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Chọn cuộc đua</InputLabel>
              <Select defaultValue={selectedRace?.id} label="Chọn cuộc đua">
                {races.map((race) => (
                  <MenuItem key={race.id} value={race.id}>
                    {race.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
              Chọn trọng tài
            </Typography>
            {referees.map((referee) => (
              <FormControlLabel
                key={referee.id}
                control={<Checkbox />}
                label={
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {referee.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {referee.experience} năm kinh nghiệm - {referee.certificationLevel}
                    </Typography>
                  </Box>
                }
                sx={{ width: '100%', mb: 1 }}
              />
            ))}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenDialog(false)}>Hủy</Button>
          <Button variant="contained" onClick={() => setOpenDialog(false)}>
            Xác nhận
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
