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
  Avatar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tab,
  TextField,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Paper,
  LinearProgress,
} from '@mui/material';
import {
  ArrowBack,
  Search,
  EmojiEvents,
  TrendingUp,
  LocalFireDepartment,
  AccountBalanceWallet,
  Star,
  WorkspacePremium,
  Psychology,
} from '@mui/icons-material';

interface Predictor {
  rank: number;
  previousRank: number;
  userId: string;
  username: string;
  avatar: string;
  totalPredictions: number;
  wins: number;
  accuracy: number;
  totalEarnings: number;
  currentStreak: number;
  longestStreak: number;
  roi: number;
  badges: string[];
  level: number;
  isCurrentUser?: boolean;
}

const mockPredictors: Predictor[] = [
  {
    rank: 1,
    previousRank: 2,
    userId: '1',
    username: 'DragonMaster',
    avatar: '🐉',
    totalPredictions: 234,
    wins: 208,
    accuracy: 89,
    totalEarnings: 125400,
    currentStreak: 12,
    longestStreak: 18,
    roi: 156,
    badges: ['legendary', 'streak_master', 'ai_challenger'],
    level: 25,
  },
  {
    rank: 2,
    previousRank: 1,
    userId: '2',
    username: 'LuckyStrike',
    avatar: '⚡',
    totalPredictions: 198,
    wins: 170,
    accuracy: 86,
    totalEarnings: 98500,
    currentStreak: 8,
    longestStreak: 15,
    roi: 142,
    badges: ['gold', 'prediction_master'],
    level: 22,
  },
  {
    rank: 3,
    previousRank: 4,
    userId: '3',
    username: 'RacingPro',
    avatar: '🏆',
    totalPredictions: 312,
    wins: 262,
    accuracy: 84,
    totalEarnings: 87300,
    currentStreak: 6,
    longestStreak: 12,
    roi: 138,
    badges: ['gold', 'tournament_champion'],
    level: 28,
  },
  {
    rank: 4,
    previousRank: 3,
    userId: '4',
    username: 'ThunderKing',
    avatar: '👑',
    totalPredictions: 156,
    wins: 128,
    accuracy: 82,
    totalEarnings: 76200,
    currentStreak: 4,
    longestStreak: 10,
    roi: 135,
    badges: ['gold', 'first_win'],
    level: 18,
  },
  {
    rank: 5,
    previousRank: 6,
    userId: '5',
    username: 'SpeedDemon',
    avatar: '🔥',
    totalPredictions: 189,
    wins: 151,
    accuracy: 80,
    totalEarnings: 64800,
    currentStreak: 3,
    longestStreak: 9,
    roi: 128,
    badges: ['silver', 'daily_warrior'],
    level: 20,
  },
  {
    rank: 6,
    previousRank: 5,
    userId: '6',
    username: 'GoldenEye',
    avatar: '👁️',
    totalPredictions: 267,
    wins: 208,
    accuracy: 78,
    totalEarnings: 58900,
    currentStreak: 2,
    longestStreak: 8,
    roi: 124,
    badges: ['silver', 'rookie_champion'],
    level: 24,
  },
  {
    rank: 7,
    previousRank: 8,
    userId: '7',
    username: 'SilverArrow',
    avatar: '🏹',
    totalPredictions: 145,
    wins: 112,
    accuracy: 77,
    totalEarnings: 52100,
    currentStreak: 5,
    longestStreak: 7,
    roi: 120,
    badges: ['silver'],
    level: 16,
  },
  {
    rank: 8,
    previousRank: 7,
    userId: '8',
    username: 'StormRider',
    avatar: '🌪️',
    totalPredictions: 201,
    wins: 154,
    accuracy: 76,
    totalEarnings: 48700,
    currentStreak: 1,
    longestStreak: 6,
    roi: 118,
    badges: ['bronze', 'prediction_master'],
    level: 19,
  },
  {
    rank: 127,
    previousRank: 132,
    userId: 'current',
    username: 'You',
    avatar: '😊',
    totalPredictions: 45,
    wins: 33,
    accuracy: 74,
    totalEarnings: 15420,
    currentStreak: 2,
    longestStreak: 4,
    roi: 112,
    badges: ['bronze'],
    level: 8,
    isCurrentUser: true,
  },
];

export default function PredictionLeaderboard() {
  const navigate = useNavigate();
  const [timeFilter, setTimeFilter] = useState('all');
  const [categoryTab, setCategoryTab] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  const getBadgeColor = (badge: string) => {
    switch (badge) {
      case 'legendary':
        return '#a855f7';
      case 'gold':
        return '#fbbf24';
      case 'silver':
        return '#d1d5db';
      case 'bronze':
        return '#f97316';
      default:
        return '#9ca3af';
    }
  };

  const getBadgeIcon = (badge: string) => {
    switch (badge) {
      case 'legendary':
      case 'gold':
      case 'silver':
      case 'bronze':
        return <WorkspacePremium />;
      case 'streak_master':
        return <LocalFireDepartment />;
      case 'ai_challenger':
        return <Psychology />;
      case 'prediction_master':
      case 'tournament_champion':
        return <EmojiEvents />;
      default:
        return <Star />;
    }
  };

  const getRankChange = (current: number, previous: number) => {
    const diff = previous - current;
    if (diff > 0) return { direction: 'up', value: diff, color: '#10b981' };
    if (diff < 0) return { direction: 'down', value: Math.abs(diff), color: '#ef4444' };
    return { direction: 'same', value: 0, color: '#9ca3af' };
  };

  const topPredictors = mockPredictors.filter((p) => !p.isCurrentUser).slice(0, 3);
  const currentUser = mockPredictors.find((p) => p.isCurrentUser);

  const filteredPredictors = mockPredictors.filter((p) =>
    p.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sortedPredictors = [...filteredPredictors].sort((a, b) => {
    switch (categoryTab) {
      case 0:
        return a.rank - b.rank;
      case 1:
        return b.accuracy - a.accuracy;
      case 2:
        return b.totalEarnings - a.totalEarnings;
      case 3:
        return b.currentStreak - a.currentStreak;
      default:
        return a.rank - b.rank;
    }
  });

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button startIcon={<ArrowBack />} onClick={() => navigate('/predictions')}>
            Quay lại
          </Button>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            Bảng xếp hạng dự đoán
          </Typography>
        </Box>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Thời gian</InputLabel>
          <Select value={timeFilter} onChange={(e) => setTimeFilter(e.target.value)} label="Thời gian">
            <MenuItem value="daily">Hôm nay</MenuItem>
            <MenuItem value="weekly">Tuần này</MenuItem>
            <MenuItem value="monthly">Tháng này</MenuItem>
            <MenuItem value="all">Tất cả</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Top 3 Podium */}
      <Card
        sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          mb: 3,
        }}
      >
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, textAlign: 'center' }}>
            🏆 Top 3 Dự đoán viên xuất sắc
          </Typography>
          <Grid container spacing={3} sx={{ alignItems: 'flex-end' }}>
            {/* Rank 2 */}
            <Grid item xs={12} md={4}>
              <Box sx={{ textAlign: 'center' }}>
                <Avatar
                  sx={{
                    width: 80,
                    height: 80,
                    fontSize: '40px',
                    bgcolor: '#d1d5db',
                    mx: 'auto',
                    mb: 2,
                    border: '4px solid white',
                  }}
                >
                  {topPredictors[1]?.avatar}
                </Avatar>
                <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
                  #2
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                  {topPredictors[1]?.username}
                </Typography>
                <Chip
                  label={`${topPredictors[1]?.accuracy}% accuracy`}
                  sx={{ bgcolor: 'white', color: '#667eea', fontWeight: 600 }}
                />
                <Typography variant="body2" sx={{ mt: 2, opacity: 0.9 }}>
                  {topPredictors[1]?.totalEarnings.toLocaleString()} coins
                </Typography>
              </Box>
            </Grid>

            {/* Rank 1 */}
            <Grid item xs={12} md={4}>
              <Box sx={{ textAlign: 'center' }}>
                <Avatar
                  sx={{
                    width: 100,
                    height: 100,
                    fontSize: '50px',
                    bgcolor: '#fbbf24',
                    mx: 'auto',
                    mb: 2,
                    border: '4px solid white',
                  }}
                >
                  {topPredictors[0]?.avatar}
                </Avatar>
                <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                  #1
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
                  {topPredictors[0]?.username}
                </Typography>
                <Chip
                  label={`${topPredictors[0]?.accuracy}% accuracy`}
                  sx={{ bgcolor: '#fbbf24', color: 'white', fontWeight: 700 }}
                  icon={<EmojiEvents sx={{ color: 'white !important' }} />}
                />
                <Typography variant="h6" sx={{ mt: 2, fontWeight: 600 }}>
                  {topPredictors[0]?.totalEarnings.toLocaleString()} coins
                </Typography>
              </Box>
            </Grid>

            {/* Rank 3 */}
            <Grid item xs={12} md={4}>
              <Box sx={{ textAlign: 'center' }}>
                <Avatar
                  sx={{
                    width: 80,
                    height: 80,
                    fontSize: '40px',
                    bgcolor: '#f97316',
                    mx: 'auto',
                    mb: 2,
                    border: '4px solid white',
                  }}
                >
                  {topPredictors[2]?.avatar}
                </Avatar>
                <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
                  #3
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                  {topPredictors[2]?.username}
                </Typography>
                <Chip
                  label={`${topPredictors[2]?.accuracy}% accuracy`}
                  sx={{ bgcolor: 'white', color: '#667eea', fontWeight: 600 }}
                />
                <Typography variant="body2" sx={{ mt: 2, opacity: 0.9 }}>
                  {topPredictors[2]?.totalEarnings.toLocaleString()} coins
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Current User Stats */}
      {currentUser && (
        <Card sx={{ mb: 3, border: '2px solid #667eea' }}>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              Thống kê của bạn
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6} md={3}>
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Xếp hạng
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    #{currentUser.rank}
                  </Typography>
                  {getRankChange(currentUser.rank, currentUser.previousRank).direction !== 'same' && (
                    <Chip
                      label={`${getRankChange(currentUser.rank, currentUser.previousRank).direction === 'up' ? '+' : '-'}${getRankChange(currentUser.rank, currentUser.previousRank).value}`}
                      size="small"
                      sx={{
                        mt: 1,
                        bgcolor: getRankChange(currentUser.rank, currentUser.previousRank).color + '20',
                        color: getRankChange(currentUser.rank, currentUser.previousRank).color,
                      }}
                    />
                  )}
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Độ chính xác
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {currentUser.accuracy}%
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={currentUser.accuracy}
                    sx={{ mt: 1, height: 6, borderRadius: 1 }}
                  />
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Tổng thu nhập
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: '#10b981' }}>
                    {currentUser.totalEarnings.toLocaleString()}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    coins
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Chuỗi thắng
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: '#f59e0b' }}>
                    {currentUser.currentStreak}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    trận liên tiếp
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Leaderboard Table */}
      <Card>
        <CardContent>
          <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
            <TextField
              size="small"
              placeholder="Tìm kiếm người chơi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
              sx={{ flex: 1 }}
            />
          </Box>

          <Tabs value={categoryTab} onChange={(_, newValue) => setCategoryTab(newValue)} sx={{ mb: 2 }}>
            <Tab label="Tổng hợp" />
            <Tab label="Độ chính xác" />
            <Tab label="Thu nhập" />
            <Tab label="Chuỗi thắng" />
          </Tabs>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Hạng</TableCell>
                  <TableCell>Người chơi</TableCell>
                  <TableCell align="right">Level</TableCell>
                  <TableCell align="right">Dự đoán</TableCell>
                  <TableCell align="right">Thắng</TableCell>
                  <TableCell align="right">Độ chính xác</TableCell>
                  <TableCell align="right">Thu nhập</TableCell>
                  <TableCell align="right">Chuỗi</TableCell>
                  <TableCell>Badges</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sortedPredictors.slice(0, 50).map((predictor) => {
                  const rankChange = getRankChange(predictor.rank, predictor.previousRank);
                  return (
                    <TableRow
                      key={predictor.userId}
                      sx={{
                        bgcolor: predictor.isCurrentUser ? '#eff6ff' : 'transparent',
                        '&:hover': { bgcolor: predictor.isCurrentUser ? '#dbeafe' : '#f9fafb' },
                      }}
                    >
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="h6" sx={{ fontWeight: 700, minWidth: 40 }}>
                            #{predictor.rank}
                          </Typography>
                          {rankChange.direction !== 'same' && (
                            <Chip
                              label={rankChange.value}
                              size="small"
                              icon={rankChange.direction === 'up' ? <TrendingUp /> : undefined}
                              sx={{
                                bgcolor: rankChange.color + '20',
                                color: rankChange.color,
                                height: 20,
                                '& .MuiChip-icon': { color: rankChange.color },
                              }}
                            />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar sx={{ bgcolor: predictor.isCurrentUser ? '#667eea' : '#f3f4f6' }}>
                            {predictor.avatar}
                          </Avatar>
                          <Box>
                            <Typography variant="body1" sx={{ fontWeight: 600 }}>
                              {predictor.username}
                            </Typography>
                            {predictor.isCurrentUser && (
                              <Chip label="You" size="small" color="primary" sx={{ height: 18, fontSize: '10px' }} />
                            )}
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        <Chip label={`Lv ${predictor.level}`} size="small" />
                      </TableCell>
                      <TableCell align="right">{predictor.totalPredictions}</TableCell>
                      <TableCell align="right">{predictor.wins}</TableCell>
                      <TableCell align="right">
                        <Chip
                          label={`${predictor.accuracy}%`}
                          size="small"
                          color={predictor.accuracy >= 85 ? 'success' : predictor.accuracy >= 75 ? 'warning' : 'default'}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#10b981' }}>
                          {predictor.totalEarnings.toLocaleString()}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Chip
                          label={predictor.currentStreak}
                          size="small"
                          icon={<LocalFireDepartment />}
                          sx={{ bgcolor: '#fef3c7', color: '#f59e0b' }}
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          {predictor.badges.slice(0, 3).map((badge, index) => (
                            <Chip
                              key={index}
                              size="small"
                              icon={getBadgeIcon(badge)}
                              sx={{
                                bgcolor: getBadgeColor(badge) + '20',
                                color: getBadgeColor(badge),
                                '& .MuiChip-icon': { color: getBadgeColor(badge) },
                                height: 24,
                              }}
                            />
                          ))}
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
}
