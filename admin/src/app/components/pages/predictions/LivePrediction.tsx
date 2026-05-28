import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Chip,
  LinearProgress,
  Avatar,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  InputAdornment,
  Alert,
  Divider,
} from '@mui/material';
import {
  ArrowBack,
  PlayArrow,
  Pause,
  Refresh,
  Speed,
  Timeline,
  EmojiEvents,
  Send,
  TrendingUp,
  TrendingDown,
  Remove,
  Pets,
  Flag,
} from '@mui/icons-material';
import { motion } from 'motion/react';

interface Horse {
  id: string;
  name: string;
  jockey: string;
  position: number;
  distance: number;
  speed: number;
  color: string;
  odds: number;
  predictions: number;
}

export default function LivePrediction() {
  const navigate = useNavigate();
  const [isLive, setIsLive] = useState(true);
  const [raceTime, setRaceTime] = useState(0);
  const [totalDistance] = useState(2000);
  const [chatMessage, setChatMessage] = useState('');

  const [horses, setHorses] = useState<Horse[]>([
    { id: '1', name: 'Thunder Bolt', jockey: 'John Smith', position: 1, distance: 450, speed: 65, color: '#ef4444', odds: 3.2, predictions: 156 },
    { id: '2', name: 'Lightning Strike', jockey: 'Mike Johnson', position: 2, distance: 430, speed: 63, color: '#3b82f6', odds: 2.8, predictions: 142 },
    { id: '3', name: 'Storm Chaser', jockey: 'David Lee', position: 3, distance: 410, speed: 61, color: '#10b981', odds: 2.5, predictions: 178 },
    { id: '4', name: 'Wild Spirit', jockey: 'Sarah Wilson', position: 4, distance: 380, speed: 58, color: '#f59e0b', odds: 4.5, predictions: 89 },
    { id: '5', name: 'Golden Arrow', jockey: 'Tom Brown', position: 5, distance: 360, speed: 56, color: '#8b5cf6', odds: 3.8, predictions: 124 },
  ]);

  const [liveComments] = useState([
    { id: 1, user: 'DragonMaster', message: 'Thunder Bolt đang dẫn đầu! 🔥', time: '2m ago', avatar: '🐉' },
    { id: 2, user: 'RacingPro', message: 'Lightning Strike có thể comeback!', time: '1m ago', avatar: '⚡' },
    { id: 3, user: 'LuckyBet', message: 'Storm Chaser tăng tốc rồi!', time: '30s ago', avatar: '🍀' },
  ]);

  const [oddsHistory, setOddsHistory] = useState<{ [key: string]: number[] }>({
    '1': [3.2, 3.1, 3.0, 2.9, 3.0],
    '2': [2.8, 2.9, 3.0, 2.8, 2.8],
    '3': [2.5, 2.6, 2.7, 2.5, 2.5],
  });

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isLive) {
      interval = setInterval(() => {
        setRaceTime((prev) => prev + 1);

        setHorses((prevHorses) => {
          return prevHorses.map((horse) => {
            const speedVariation = Math.random() * 10 - 5;
            const newSpeed = Math.max(50, Math.min(75, horse.speed + speedVariation));
            const newDistance = Math.min(totalDistance, horse.distance + newSpeed / 10);

            return {
              ...horse,
              speed: newSpeed,
              distance: newDistance,
            };
          }).sort((a, b) => b.distance - a.distance).map((horse, index) => ({
            ...horse,
            position: index + 1,
          }));
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isLive, totalDistance]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getOddsChange = (horseId: string) => {
    const history = oddsHistory[horseId];
    if (!history || history.length < 2) return 0;
    return history[history.length - 1] - history[history.length - 2];
  };

  const getPositionColor = (position: number) => {
    switch (position) {
      case 1:
        return '#fbbf24';
      case 2:
        return '#d1d5db';
      case 3:
        return '#f97316';
      default:
        return '#9ca3af';
    }
  };

  const leader = horses[0];
  const avgSpeed = horses.reduce((sum, h) => sum + h.speed, 0) / horses.length;

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button startIcon={<ArrowBack />} onClick={() => navigate('/predictions')}>
            Quay lại
          </Button>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              Race #8 - Quarter Finals
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Spring Championship 2026
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <Chip
            label="ĐANG LIVE"
            color="error"
            icon={<PlayArrow />}
            sx={{ animation: 'pulse 2s infinite', fontWeight: 700 }}
          />
          <IconButton onClick={() => setIsLive(!isLive)} color={isLive ? 'error' : 'success'}>
            {isLive ? <Pause /> : <PlayArrow />}
          </IconButton>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Left Column - Race Visualization */}
        <Grid item xs={12} lg={8}>
          {/* Race Stats */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={3}>
              <Card>
                <CardContent>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Thời gian
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    {formatTime(raceTime)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Card>
                <CardContent>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Đang dẫn đầu
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    {leader.name}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Card>
                <CardContent>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Tốc độ TB
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    {avgSpeed.toFixed(1)} km/h
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Card>
                <CardContent>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Hoàn thành
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    {((leader.distance / totalDistance) * 100).toFixed(0)}%
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Race Track Visualization */}
          <Card sx={{ mb: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Đường đua trực tiếp
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Flag sx={{ color: '#10b981' }} />
                  <Typography variant="body2" color="text.secondary">
                    {totalDistance}m
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ position: 'relative', minHeight: 400, bgcolor: '#f9fafb', borderRadius: 2, p: 3 }}>
                {horses.map((horse, index) => (
                  <Box key={horse.id} sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box
                          sx={{
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            bgcolor: getPositionColor(horse.position),
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            color: 'white',
                          }}
                        >
                          {horse.position}
                        </Box>
                        <Typography variant="body1" sx={{ fontWeight: 600, minWidth: 150 }}>
                          {horse.name}
                        </Typography>
                        <Chip
                          label={`${horse.speed.toFixed(1)} km/h`}
                          size="small"
                          icon={<Speed />}
                          sx={{ minWidth: 100 }}
                        />
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        {horse.distance.toFixed(0)}m / {totalDistance}m
                      </Typography>
                    </Box>

                    <Box sx={{ position: 'relative', height: 40, bgcolor: 'white', borderRadius: 1, overflow: 'hidden' }}>
                      <motion.div
                        animate={{ width: `${(horse.distance / totalDistance) * 100}%` }}
                        transition={{ duration: 0.5 }}
                        style={{
                          height: '100%',
                          background: `linear-gradient(90deg, ${horse.color} 0%, ${horse.color}dd 100%)`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'flex-end',
                          paddingRight: '8px',
                        }}
                      >
                        <Box sx={{ fontSize: '24px' }}>🏇</Box>
                      </motion.div>
                    </Box>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>

          {/* Live Leaderboard */}
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Bảng xếp hạng trực tiếp
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Vị trí</TableCell>
                      <TableCell>Ngựa</TableCell>
                      <TableCell>Jockey</TableCell>
                      <TableCell align="right">Khoảng cách</TableCell>
                      <TableCell align="right">Tốc độ</TableCell>
                      <TableCell align="right">Tỷ lệ</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {horses.map((horse) => (
                      <TableRow key={horse.id}>
                        <TableCell>
                          <Box
                            sx={{
                              width: 32,
                              height: 32,
                              borderRadius: '50%',
                              bgcolor: getPositionColor(horse.position),
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 700,
                              color: 'white',
                            }}
                          >
                            {horse.position}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body1" sx={{ fontWeight: 600 }}>
                            {horse.name}
                          </Typography>
                        </TableCell>
                        <TableCell>{horse.jockey}</TableCell>
                        <TableCell align="right">{horse.distance.toFixed(0)}m</TableCell>
                        <TableCell align="right">
                          <Chip label={`${horse.speed.toFixed(1)} km/h`} size="small" />
                        </TableCell>
                        <TableCell align="right">
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1 }}>
                            <Typography variant="body1" sx={{ fontWeight: 600 }}>
                              x{horse.odds}
                            </Typography>
                            {getOddsChange(horse.id) > 0 && <TrendingUp sx={{ color: '#10b981', fontSize: 16 }} />}
                            {getOddsChange(horse.id) < 0 && <TrendingDown sx={{ color: '#ef4444', fontSize: 16 }} />}
                            {getOddsChange(horse.id) === 0 && <Remove sx={{ color: '#9ca3af', fontSize: 16 }} />}
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Right Column - Betting & Chat */}
        <Grid item xs={12} lg={4}>
          {/* Dynamic Betting */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Cược động (Live Betting)
              </Typography>
              <Alert severity="warning" sx={{ mb: 2 }}>
                Tỷ lệ cược thay đổi theo thời gian thực!
              </Alert>
              <Grid container spacing={2}>
                {horses.slice(0, 3).map((horse) => (
                  <Grid item xs={12} key={horse.id}>
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar sx={{ width: 32, height: 32, bgcolor: horse.color }}>
                            <Pets sx={{ fontSize: 16 }} />
                          </Avatar>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {horse.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              #{horse.position}
                            </Typography>
                          </Box>
                        </Box>
                        <Chip
                          label={`x${horse.odds}`}
                          color={horse.position === 1 ? 'primary' : 'default'}
                          sx={{ fontWeight: 700 }}
                        />
                      </Box>
                      <Button
                        fullWidth
                        variant={horse.position === 1 ? 'contained' : 'outlined'}
                        size="small"
                        onClick={() => navigate('/predictions/create')}
                      >
                        Đặt cược
                      </Button>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>

          {/* Prediction Stats */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Thống kê dự đoán
              </Typography>
              {horses.slice(0, 3).map((horse) => (
                <Box key={horse.id} sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">{horse.name}</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {horse.predictions} bets
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={(horse.predictions / 200) * 100}
                    sx={{
                      height: 8,
                      borderRadius: 1,
                      bgcolor: '#e5e7eb',
                      '& .MuiLinearProgress-bar': {
                        bgcolor: horse.color,
                      },
                    }}
                  />
                </Box>
              ))}
            </CardContent>
          </Card>

          {/* Live Chat */}
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Live Chat
              </Typography>
              <Box sx={{ maxHeight: 300, overflowY: 'auto', mb: 2 }}>
                {liveComments.map((comment) => (
                  <Box key={comment.id} sx={{ mb: 2, p: 1.5, bgcolor: '#f9fafb', borderRadius: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Typography sx={{ fontSize: '16px' }}>{comment.avatar}</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {comment.user}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {comment.time}
                      </Typography>
                    </Box>
                    <Typography variant="body2">{comment.message}</Typography>
                  </Box>
                ))}
              </Box>
              <TextField
                fullWidth
                size="small"
                placeholder="Nhập bình luận..."
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton size="small">
                        <Send />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
