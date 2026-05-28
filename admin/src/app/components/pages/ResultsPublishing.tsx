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
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Typography,
  Card,
  CardContent,
  IconButton,
  InputAdornment,
} from '@mui/material';
import {
  Publish,
  Edit,
  EmojiEvents,
  Timer,
  Speed,
  Visibility,
} from '@mui/icons-material';

interface RaceResult {
  id: number;
  raceName: string;
  date: string;
  tournament: string;
  status: 'pending' | 'published';
  participants: number;
}

interface Participant {
  position: number;
  horseName: string;
  jockeyName: string;
  time: string;
  speed: string;
  prize?: string;
}

const mockResults: RaceResult[] = [
  {
    id: 1,
    raceName: 'Vòng 1 - Sprint Championship',
    date: '2026-06-15',
    tournament: 'Giải Vô Địch Quốc Gia 2026',
    status: 'pending',
    participants: 12,
  },
  {
    id: 2,
    raceName: 'Vòng Final - Cúp Mùa Xuân',
    date: '2026-03-15',
    tournament: 'Cúp Mùa Xuân',
    status: 'published',
    participants: 10,
  },
];

const mockParticipants: Participant[] = [
  {
    position: 1,
    horseName: 'Thunder Bolt',
    jockeyName: 'Nguyễn Văn An',
    time: '1:12.45',
    speed: '65.2 km/h',
    prize: '500,000,000 VNĐ',
  },
  {
    position: 2,
    horseName: 'Lightning Star',
    jockeyName: 'Trần Thị Mai',
    time: '1:12.89',
    speed: '64.8 km/h',
    prize: '300,000,000 VNĐ',
  },
  {
    position: 3,
    horseName: 'Golden Wind',
    jockeyName: 'Lê Văn Hùng',
    time: '1:13.23',
    speed: '64.3 km/h',
    prize: '200,000,000 VNĐ',
  },
];

export default function ResultsPublishing() {
  const [results] = useState<RaceResult[]>(mockResults);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedResult, setSelectedResult] = useState<RaceResult | null>(null);

  const handleViewDetails = (result: RaceResult) => {
    setSelectedResult(result);
    setOpenDialog(true);
  };

  const getMedalEmoji = (position: number) => {
    switch (position) {
      case 1:
        return '🥇';
      case 2:
        return '🥈';
      case 3:
        return '🥉';
      default:
        return `${position}`;
    }
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
        Công bố kết quả thi đấu
      </Typography>

      <Grid container spacing={3}>
        {results.map((result) => (
          <Grid item xs={12} md={6} key={result.id}>
            <Card sx={{ borderRadius: '12px', border: '1px solid #e0e0e0' }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                      {result.raceName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {result.tournament}
                    </Typography>
                    <Chip
                      label={result.status === 'published' ? 'Đã công bố' : 'Chờ công bố'}
                      size="small"
                      color={result.status === 'published' ? 'success' : 'warning'}
                    />
                  </Box>
                  <EmojiEvents sx={{ fontSize: 40, color: result.status === 'published' ? '#ffd700' : '#ccc' }} />
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  📅 {result.date}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  👥 {result.participants} ngựa tham gia
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<Visibility />}
                    onClick={() => handleViewDetails(result)}
                    sx={{ borderRadius: '8px' }}
                  >
                    Xem chi tiết
                  </Button>
                  {result.status === 'pending' && (
                    <Button
                      fullWidth
                      variant="contained"
                      startIcon={<Publish />}
                      sx={{ borderRadius: '8px' }}
                    >
                      Công bố
                    </Button>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">{selectedResult?.raceName}</Typography>
            {selectedResult?.status === 'pending' && (
              <Button variant="outlined" startIcon={<Edit />} size="small">
                Chỉnh sửa
              </Button>
            )}
          </Box>
        </DialogTitle>
        <DialogContent>
          <Paper sx={{ p: 2, mb: 3, bgcolor: '#f5f5f5', borderRadius: '8px' }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">
                  Giải đấu
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {selectedResult?.tournament}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">
                  Ngày thi đấu
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {selectedResult?.date}
                </Typography>
              </Grid>
            </Grid>
          </Paper>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Hạng</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Ngựa đua</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Jockey</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Thời gian</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Tốc độ</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Giải thưởng</TableCell>
                  {selectedResult?.status === 'pending' && (
                    <TableCell sx={{ fontWeight: 600 }}>Hành động</TableCell>
                  )}
                </TableRow>
              </TableHead>
              <TableBody>
                {mockParticipants.map((participant) => (
                  <TableRow key={participant.position}>
                    <TableCell>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {getMedalEmoji(participant.position)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {participant.horseName}
                      </Typography>
                    </TableCell>
                    <TableCell>{participant.jockeyName}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Timer fontSize="small" color="action" />
                        {selectedResult?.status === 'pending' ? (
                          <TextField
                            defaultValue={participant.time}
                            size="small"
                            sx={{ width: '100px' }}
                            InputProps={{
                              endAdornment: <InputAdornment position="end">s</InputAdornment>,
                            }}
                          />
                        ) : (
                          participant.time
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Speed fontSize="small" color="action" />
                        {participant.speed}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip label={participant.prize} size="small" color="primary" />
                    </TableCell>
                    {selectedResult?.status === 'pending' && (
                      <TableCell>
                        <IconButton size="small">
                          <Edit fontSize="small" />
                        </IconButton>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          {selectedResult?.status === 'pending' ? (
            <>
              <Button onClick={() => setOpenDialog(false)}>Hủy</Button>
              <Button variant="contained" startIcon={<Publish />} onClick={() => setOpenDialog(false)}>
                Công bố kết quả
              </Button>
            </>
          ) : (
            <Button onClick={() => setOpenDialog(false)}>Đóng</Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
}
