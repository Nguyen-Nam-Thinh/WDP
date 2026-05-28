import { useState } from 'react';
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
  Tabs,
  Tab,
} from '@mui/material';
import {
  TrendingUp,
  EmojiEvents,
  AccountBalanceWallet,
  Timeline,
  Star,
  ArrowForward,
  PlayArrow,
  Schedule,
  GroupWork,
  FlashOn,
  Visibility,
  Add,
} from '@mui/icons-material';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export default function SpectatorPrediction() {
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);

  const stats = [
    { label: 'Số dư ví', value: '15,420', icon: <AccountBalanceWallet />, color: '#10b981', unit: 'coins' },
    { label: 'Dự đoán đang chờ', value: '8', icon: <Schedule />, color: '#f59e0b', unit: 'bets' },
    { label: 'Tỷ lệ chính xác', value: '74%', icon: <TrendingUp />, color: '#8b5cf6', unit: '' },
    { label: 'Xếp hạng', value: '#127', icon: <Star />, color: '#ec4899', unit: '' },
  ];

  const featuredTournaments = [
    {
      id: 1,
      name: 'Spring Championship 2026',
      status: 'Đang diễn ra',
      totalRaces: 12,
      completedRaces: 7,
      predictions: 245,
      prize: '50,000 coins',
      endsIn: '3 ngày',
    },
    {
      id: 2,
      name: 'Elite Cup Series',
      status: 'Sắp bắt đầu',
      totalRaces: 8,
      completedRaces: 0,
      predictions: 89,
      prize: '30,000 coins',
      endsIn: '2 giờ',
    },
    {
      id: 3,
      name: 'Summer Grand Prix',
      status: 'Đang mở đăng ký',
      totalRaces: 15,
      completedRaces: 0,
      predictions: 12,
      prize: '75,000 coins',
      endsIn: '7 ngày',
    },
  ];

  const activeRaces = [
    {
      id: 1,
      name: 'Race #8 - Quarter Finals',
      tournament: 'Spring Championship 2026',
      status: 'live',
      startTime: 'Đang diễn ra',
      participants: 8,
      predictions: 156,
      topOdds: { horse: 'Thunder Bolt', odds: 3.2 },
      timeLeft: '12 phút',
    },
    {
      id: 2,
      name: 'Race #3 - Heat 2',
      tournament: 'Elite Cup Series',
      status: 'upcoming',
      startTime: '30 phút nữa',
      participants: 10,
      predictions: 89,
      topOdds: { horse: 'Lightning Strike', odds: 2.8 },
      timeLeft: '30 phút',
    },
    {
      id: 3,
      name: 'Race #9 - Semi Finals',
      tournament: 'Spring Championship 2026',
      status: 'open',
      startTime: '2 giờ nữa',
      participants: 6,
      predictions: 234,
      topOdds: { horse: 'Storm Chaser', odds: 2.5 },
      timeLeft: '1h 45m',
    },
  ];

  const topPredictors = [
    { rank: 1, name: 'DragonMaster', accuracy: 89, wins: 45, avatar: '🐉' },
    { rank: 2, name: 'LuckyStrike', accuracy: 86, wins: 42, avatar: '⚡' },
    { rank: 3, name: 'RacingPro', accuracy: 84, wins: 38, avatar: '🏆' },
    { rank: 4, name: 'ThunderKing', accuracy: 82, wins: 35, avatar: '👑' },
    { rank: 5, name: 'SpeedDemon', accuracy: 80, wins: 33, avatar: '🔥' },
  ];

  const myRecentPredictions = [
    {
      id: 1,
      race: 'Race #7 - Spring Championship',
      prediction: 'Thunder Bolt - Win',
      amount: 500,
      odds: 3.2,
      status: 'won',
      payout: 1600,
    },
    {
      id: 2,
      race: 'Race #6 - Elite Cup',
      prediction: 'Lightning Strike - Top 3',
      amount: 300,
      odds: 1.8,
      status: 'pending',
      payout: 0,
    },
    {
      id: 3,
      race: 'Race #5 - Spring Championship',
      prediction: 'Storm Chaser - Win',
      amount: 400,
      odds: 2.5,
      status: 'lost',
      payout: 0,
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'live':
        return 'error';
      case 'upcoming':
        return 'warning';
      case 'open':
        return 'success';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'live':
        return 'ĐANG LIVE';
      case 'upcoming':
        return 'SẮP BẮT ĐẦU';
      case 'open':
        return 'MỞ DỰ ĐOÁN';
      default:
        return status;
    }
  };

  return (
    <Box>
      {/* Hero Section */}
      <Card
        sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          mb: 3,
        }}
      >
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                🏇 Hệ thống dự đoán đua ngựa
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.95, mb: 3 }}>
                Dự đoán kết quả, tham gia cạnh tranh và giành phần thưởng với AI recommendation
              </Typography>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<Add />}
                  onClick={() => navigate('/predictions/create')}
                  sx={{
                    bgcolor: 'white',
                    color: '#667eea',
                    '&:hover': { bgcolor: '#f3f4f6' },
                  }}
                >
                  Tạo dự đoán mới
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  startIcon={<Visibility />}
                  onClick={() => navigate('/predictions/live')}
                  sx={{
                    borderColor: 'white',
                    color: 'white',
                    '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' },
                  }}
                >
                  Xem live race
                </Button>
              </Box>
            </Box>
            <Box sx={{ display: { xs: 'none', md: 'block' }, fontSize: '120px', opacity: 0.2 }}>
              🏆
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {stats.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {stat.label}
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                      {stat.value}
                      {stat.unit && (
                        <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                          {stat.unit}
                        </Typography>
                      )}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      width: 60,
                      height: 60,
                      borderRadius: '12px',
                      bgcolor: `${stat.color}20`,
                      color: stat.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {stat.icon}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Quick Navigation */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{ cursor: 'pointer', '&:hover': { boxShadow: 3 } }}
            onClick={() => navigate('/predictions/leaderboard')}
          >
            <CardContent sx={{ textAlign: 'center', py: 3 }}>
              <Star sx={{ fontSize: 48, color: '#f59e0b', mb: 1 }} />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Bảng xếp hạng
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{ cursor: 'pointer', '&:hover': { boxShadow: 3 } }}
            onClick={() => navigate('/predictions/analytics')}
          >
            <CardContent sx={{ textAlign: 'center', py: 3 }}>
              <Timeline sx={{ fontSize: 48, color: '#8b5cf6', mb: 1 }} />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Phân tích xu hướng
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{ cursor: 'pointer', '&:hover': { boxShadow: 3 } }}
            onClick={() => navigate('/predictions/my-predictions')}
          >
            <CardContent sx={{ textAlign: 'center', py: 3 }}>
              <GroupWork sx={{ fontSize: 48, color: '#10b981', mb: 1 }} />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Dự đoán của tôi
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{ cursor: 'pointer', '&:hover': { boxShadow: 3 } }}
            onClick={() => navigate('/predictions/admin')}
          >
            <CardContent sx={{ textAlign: 'center', py: 3 }}>
              <FlashOn sx={{ fontSize: 48, color: '#ec4899', mb: 1 }} />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Quản trị Admin
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Main Content Tabs */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
            <Tab label="Giải đấu nổi bật" />
            <Tab label="Chặng đua đang mở" />
            <Tab label="Top Predictors" />
            <Tab label="Dự đoán gần đây" />
          </Tabs>
        </Box>

        {/* Featured Tournaments Tab */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            {featuredTournaments.map((tournament) => (
              <Grid item xs={12} md={4} key={tournament.id}>
                <Card variant="outlined">
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Chip
                        label={tournament.status}
                        size="small"
                        color={tournament.status === 'Đang diễn ra' ? 'success' : 'default'}
                      />
                      <Chip label={`Còn ${tournament.endsIn}`} size="small" variant="outlined" />
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                      {tournament.name}
                    </Typography>
                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          Tiến độ
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {tournament.completedRaces}/{tournament.totalRaces} chặng
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={(tournament.completedRaces / tournament.totalRaces) * 100}
                        sx={{ height: 8, borderRadius: 1 }}
                      />
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Dự đoán
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          {tournament.predictions}
                        </Typography>
                      </Box>
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="body2" color="text.secondary">
                          Phần thưởng
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 600, color: '#10b981' }}>
                          {tournament.prize}
                        </Typography>
                      </Box>
                    </Box>
                    <Button
                      fullWidth
                      variant="outlined"
                      endIcon={<ArrowForward />}
                      onClick={() => navigate('/predictions/create')}
                    >
                      Dự đoán ngay
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </TabPanel>

        {/* Active Races Tab */}
        <TabPanel value={tabValue} index={1}>
          <Grid container spacing={2}>
            {activeRaces.map((race) => (
              <Grid item xs={12} key={race.id}>
                <Card variant="outlined">
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box sx={{ flex: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                          <Chip
                            label={getStatusLabel(race.status)}
                            color={getStatusColor(race.status)}
                            size="small"
                            icon={race.status === 'live' ? <PlayArrow /> : undefined}
                          />
                          <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            {race.name}
                          </Typography>
                        </Box>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          {race.tournament}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 4, mt: 2 }}>
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              Thời gian
                            </Typography>
                            <Typography variant="body1" sx={{ fontWeight: 600 }}>
                              {race.startTime}
                            </Typography>
                          </Box>
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              Ngựa tham gia
                            </Typography>
                            <Typography variant="body1" sx={{ fontWeight: 600 }}>
                              {race.participants} con
                            </Typography>
                          </Box>
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              Dự đoán
                            </Typography>
                            <Typography variant="body1" sx={{ fontWeight: 600 }}>
                              {race.predictions}
                            </Typography>
                          </Box>
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              Tỷ lệ cao nhất
                            </Typography>
                            <Typography variant="body1" sx={{ fontWeight: 600 }}>
                              {race.topOdds.horse} (x{race.topOdds.odds})
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        {race.status === 'live' && (
                          <Button
                            variant="contained"
                            color="error"
                            startIcon={<Visibility />}
                            onClick={() => navigate('/predictions/live')}
                          >
                            Xem live
                          </Button>
                        )}
                        <Button
                          variant={race.status === 'live' ? 'outlined' : 'contained'}
                          endIcon={<ArrowForward />}
                          onClick={() => navigate('/predictions/create')}
                        >
                          Đặt cược
                        </Button>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </TabPanel>

        {/* Top Predictors Tab */}
        <TabPanel value={tabValue} index={2}>
          <Grid container spacing={2}>
            {topPredictors.map((predictor) => (
              <Grid item xs={12} sm={6} md={4} key={predictor.rank}>
                <Card variant="outlined">
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box
                        sx={{
                          width: 48,
                          height: 48,
                          borderRadius: '50%',
                          bgcolor:
                            predictor.rank === 1 ? '#fbbf24' : predictor.rank === 2 ? '#d1d5db' : '#f97316',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: '24px',
                        }}
                      >
                        {predictor.avatar}
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            #{predictor.rank}
                          </Typography>
                          <Typography variant="body1" sx={{ fontWeight: 600 }}>
                            {predictor.name}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 3, mt: 1 }}>
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              Độ chính xác
                            </Typography>
                            <Typography variant="body1" sx={{ fontWeight: 600, color: '#10b981' }}>
                              {predictor.accuracy}%
                            </Typography>
                          </Box>
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              Thắng
                            </Typography>
                            <Typography variant="body1" sx={{ fontWeight: 600 }}>
                              {predictor.wins}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </TabPanel>

        {/* My Recent Predictions Tab */}
        <TabPanel value={tabValue} index={3}>
          <Grid container spacing={2}>
            {myRecentPredictions.map((prediction) => (
              <Grid item xs={12} key={prediction.id}>
                <Card variant="outlined">
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          {prediction.race}
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                          {prediction.prediction}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 3 }}>
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              Đặt cược
                            </Typography>
                            <Typography variant="body1" sx={{ fontWeight: 600 }}>
                              {prediction.amount} coins
                            </Typography>
                          </Box>
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              Tỷ lệ
                            </Typography>
                            <Typography variant="body1" sx={{ fontWeight: 600 }}>
                              x{prediction.odds}
                            </Typography>
                          </Box>
                          {prediction.status === 'won' && (
                            <Box>
                              <Typography variant="body2" color="text.secondary">
                                Thắng
                              </Typography>
                              <Typography variant="body1" sx={{ fontWeight: 600, color: '#10b981' }}>
                                +{prediction.payout} coins
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      </Box>
                      <Chip
                        label={
                          prediction.status === 'won'
                            ? 'Thắng'
                            : prediction.status === 'pending'
                            ? 'Đang chờ'
                            : 'Thua'
                        }
                        color={
                          prediction.status === 'won'
                            ? 'success'
                            : prediction.status === 'pending'
                            ? 'warning'
                            : 'error'
                        }
                      />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Button variant="outlined" onClick={() => navigate('/predictions/my-predictions')}>
              Xem tất cả dự đoán
            </Button>
          </Box>
        </TabPanel>
      </Card>
    </Box>
  );
}
