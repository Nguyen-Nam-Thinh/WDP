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
  FormControl,
  Select,
  MenuItem,
  InputLabel,
  Paper,
  LinearProgress,
  Avatar,
  Tabs,
  Tab,
} from '@mui/material';
import {
  ArrowBack,
  TrendingUp,
  Psychology,
  EmojiEvents,
  Pets,
  Timeline,
  LocalFireDepartment,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

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

const COLORS = ['#667eea', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function PredictionAnalytics() {
  const navigate = useNavigate();
  const [timeFilter, setTimeFilter] = useState('week');
  const [tabValue, setTabValue] = useState(0);

  const bettingTrendData = [
    { date: 'Mon', bets: 1240, payout: 2100, revenue: 860 },
    { date: 'Tue', bets: 1580, payout: 2450, revenue: 870 },
    { date: 'Wed', bets: 1890, payout: 3200, revenue: 1310 },
    { date: 'Thu', bets: 2100, payout: 3800, revenue: 1700 },
    { date: 'Fri', bets: 2450, payout: 4100, revenue: 1650 },
    { date: 'Sat', bets: 3200, payout: 5600, revenue: 2400 },
    { date: 'Sun', bets: 2890, payout: 4900, revenue: 2010 },
  ];

  const predictionTypeDistribution = [
    { name: 'Win', value: 42, color: '#667eea' },
    { name: 'Place', value: 28, color: '#10b981' },
    { name: 'Show', value: 18, color: '#f59e0b' },
    { name: 'Exacta', value: 8, color: '#ef4444' },
    { name: 'Trifecta', value: 4, color: '#8b5cf6' },
  ];

  const aiAccuracyData = [
    { week: 'W1', aiAccuracy: 87, userAccuracy: 72 },
    { week: 'W2', aiAccuracy: 89, userAccuracy: 74 },
    { week: 'W3', aiAccuracy: 91, userAccuracy: 76 },
    { week: 'W4', aiAccuracy: 88, userAccuracy: 75 },
  ];

  const topHorses = [
    { name: 'Thunder Bolt', predictions: 1245, wins: 892, accuracy: 72, avgOdds: 3.2 },
    { name: 'Lightning Strike', predictions: 1089, wins: 756, accuracy: 69, avgOdds: 2.8 },
    { name: 'Storm Chaser', predictions: 967, wins: 648, accuracy: 67, avgOdds: 2.5 },
    { name: 'Wild Spirit', predictions: 823, wins: 526, accuracy: 64, avgOdds: 4.5 },
    { name: 'Golden Arrow', predictions: 756, wins: 483, accuracy: 64, avgOdds: 3.8 },
  ];

  const popularBettingPatterns = [
    { pattern: 'Favorite Horses', percentage: 68, trend: 'up' },
    { pattern: 'AI Recommendations', percentage: 54, trend: 'up' },
    { pattern: 'Underdogs', percentage: 23, trend: 'down' },
    { pattern: 'Combo Bets', percentage: 15, trend: 'up' },
  ];

  const tournamentStats = [
    { tournament: 'Spring Championship', totalBets: 5240, totalPayout: 8900, avgAccuracy: 74 },
    { tournament: 'Elite Cup Series', totalBets: 3450, totalPayout: 5670, avgAccuracy: 71 },
    { tournament: 'Summer Grand Prix', totalBets: 2890, totalPayout: 4320, avgAccuracy: 69 },
  ];

  const stats = [
    { label: 'Tổng dự đoán (tuần)', value: '15,650', change: '+12%', color: '#667eea' },
    { label: 'Tổng thanh toán', value: '26.4M', change: '+8%', color: '#10b981', unit: 'coins' },
    { label: 'Độ chính xác TB', value: '73.5%', change: '+2.1%', color: '#f59e0b' },
    { label: 'AI Confidence', value: '89%', change: '+1.5%', color: '#8b5cf6' },
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button startIcon={<ArrowBack />} onClick={() => navigate('/predictions')}>
            Quay lại
          </Button>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            Phân tích xu hướng dự đoán
          </Typography>
        </Box>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Thời gian</InputLabel>
          <Select value={timeFilter} onChange={(e) => setTimeFilter(e.target.value)} label="Thời gian">
            <MenuItem value="today">Hôm nay</MenuItem>
            <MenuItem value="week">Tuần này</MenuItem>
            <MenuItem value="month">Tháng này</MenuItem>
            <MenuItem value="year">Năm nay</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Stats Overview */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {stats.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card>
              <CardContent>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {stat.label}
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                  {stat.value}
                  {stat.unit && (
                    <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                      {stat.unit}
                    </Typography>
                  )}
                </Typography>
                <Chip
                  label={stat.change}
                  size="small"
                  icon={<TrendingUp />}
                  sx={{ bgcolor: `${stat.color}20`, color: stat.color }}
                />
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Main Analytics Tabs */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
            <Tab label="Xu hướng cược" />
            <Tab label="Phân tích AI" />
            <Tab label="Top ngựa đua" />
            <Tab label="Giải đấu" />
          </Tabs>
        </Box>

        {/* Betting Trends Tab */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12} lg={8}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                  Biểu đồ xu hướng cược
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={bettingTrendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="bets" stroke="#667eea" strokeWidth={2} name="Số lượng cược" />
                    <Line type="monotone" dataKey="payout" stroke="#10b981" strokeWidth={2} name="Thanh toán" />
                    <Line type="monotone" dataKey="revenue" stroke="#f59e0b" strokeWidth={2} name="Doanh thu" />
                  </LineChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>

            <Grid item xs={12} lg={4}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                  Phân bổ loại dự đoán
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={predictionTypeDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.name}: ${entry.value}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {predictionTypeDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>

            <Grid item xs={12}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                  Mô hình cược phổ biến
                </Typography>
                <Grid container spacing={2}>
                  {popularBettingPatterns.map((pattern, index) => (
                    <Grid item xs={12} sm={6} md={3} key={index}>
                      <Box sx={{ p: 2, bgcolor: '#f9fafb', borderRadius: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {pattern.pattern}
                          </Typography>
                          <Chip
                            label={pattern.trend === 'up' ? '↑' : '↓'}
                            size="small"
                            color={pattern.trend === 'up' ? 'success' : 'error'}
                          />
                        </Box>
                        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                          {pattern.percentage}%
                        </Typography>
                        <LinearProgress variant="determinate" value={pattern.percentage} sx={{ height: 6, borderRadius: 1 }} />
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </Paper>
            </Grid>
          </Grid>
        </TabPanel>

        {/* AI Analysis Tab */}
        <TabPanel value={tabValue} index={1}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                  So sánh độ chính xác AI vs Người dùng
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={aiAccuracyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="week" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="aiAccuracy" fill="#8b5cf6" name="AI Accuracy" />
                    <Bar dataKey="userAccuracy" fill="#667eea" name="User Accuracy" />
                  </BarChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                    <Avatar sx={{ bgcolor: '#8b5cf6', width: 56, height: 56 }}>
                      <Psychology />
                    </Avatar>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        AI Performance
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Hiệu suất dự đoán AI
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">Tổng dự đoán AI</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        8,456
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">Dự đoán đúng</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        7,526
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">Độ chính xác TB</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#10b981' }}>
                        89%
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2">Confidence TB</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        87.5%
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                    <Avatar sx={{ bgcolor: '#667eea', width: 56, height: 56 }}>
                      <TrendingUp />
                    </Avatar>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        AI Recommendation Impact
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Tác động của khuyến nghị AI
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">User follow AI</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        54%
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">Win rate khi follow</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#10b981' }}>
                        82%
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">Win rate khi không follow</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#f59e0b' }}>
                        68%
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2">ROI improvement</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#10b981' }}>
                        +24%
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Top Horses Tab */}
        <TabPanel value={tabValue} index={2}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
              Top 5 ngựa được dự đoán nhiều nhất
            </Typography>
            <Grid container spacing={2}>
              {topHorses.map((horse, index) => (
                <Grid item xs={12} key={index}>
                  <Card variant="outlined">
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                        <Box
                          sx={{
                            width: 48,
                            height: 48,
                            borderRadius: '50%',
                            bgcolor: index === 0 ? '#fbbf24' : index === 1 ? '#d1d5db' : index === 2 ? '#f97316' : '#e5e7eb',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: '20px',
                          }}
                        >
                          {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                        </Box>
                        <Avatar sx={{ width: 56, height: 56, bgcolor: '#667eea' }}>
                          <Pets />
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            {horse.name}
                          </Typography>
                          <Grid container spacing={3} sx={{ mt: 1 }}>
                            <Grid item xs={6} sm={3}>
                              <Typography variant="body2" color="text.secondary">
                                Predictions
                              </Typography>
                              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                {horse.predictions.toLocaleString()}
                              </Typography>
                            </Grid>
                            <Grid item xs={6} sm={3}>
                              <Typography variant="body2" color="text.secondary">
                                Wins
                              </Typography>
                              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                {horse.wins}
                              </Typography>
                            </Grid>
                            <Grid item xs={6} sm={3}>
                              <Typography variant="body2" color="text.secondary">
                                Accuracy
                              </Typography>
                              <Typography variant="h6" sx={{ fontWeight: 600, color: '#10b981' }}>
                                {horse.accuracy}%
                              </Typography>
                            </Grid>
                            <Grid item xs={6} sm={3}>
                              <Typography variant="body2" color="text.secondary">
                                Avg Odds
                              </Typography>
                              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                x{horse.avgOdds}
                              </Typography>
                            </Grid>
                          </Grid>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </TabPanel>

        {/* Tournament Tab */}
        <TabPanel value={tabValue} index={3}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
              Thống kê theo giải đấu
            </Typography>
            <Grid container spacing={3}>
              {tournamentStats.map((tournament, index) => (
                <Grid item xs={12} md={4} key={index}>
                  <Card variant="outlined">
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                        <Avatar sx={{ bgcolor: '#667eea', width: 48, height: 48 }}>
                          <EmojiEvents />
                        </Avatar>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          {tournament.tournament}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          Tổng cược
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 600 }}>
                          {tournament.totalBets.toLocaleString()}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          Thanh toán
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 600, color: '#10b981' }}>
                          {tournament.totalPayout.toLocaleString()}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">
                          Độ chính xác TB
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 600 }}>
                          {tournament.avgAccuracy}%
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </TabPanel>
      </Card>
    </Box>
  );
}
