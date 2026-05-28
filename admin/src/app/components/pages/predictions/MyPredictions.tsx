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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tab,
  Avatar,
  LinearProgress,
  Paper,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import {
  ArrowBack,
  AccountBalanceWallet,
  TrendingUp,
  TrendingDown,
  Add,
  Remove,
  EmojiEvents,
  LocalFireDepartment,
  Star,
  WorkspacePremium,
  CheckCircle,
  Cancel,
  Schedule,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
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

export default function MyPredictions() {
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [statusFilter, setStatusFilter] = useState('all');
  const [depositDialogOpen, setDepositDialogOpen] = useState(false);
  const [withdrawDialogOpen, setWithdrawDialogOpen] = useState(false);

  const walletBalance = 15420;
  const totalWinnings = 48900;
  const totalBets = 13500;
  const netProfit = totalWinnings - totalBets;

  const balanceHistory = [
    { date: '01/05', balance: 10000 },
    { date: '05/05', balance: 12500 },
    { date: '10/05', balance: 11800 },
    { date: '15/05', balance: 14200 },
    { date: '20/05', balance: 15420 },
  ];

  const predictions = [
    {
      id: 1,
      race: 'Race #8 - Quarter Finals',
      tournament: 'Spring Championship 2026',
      horse: 'Thunder Bolt',
      type: 'Win',
      amount: 500,
      odds: 3.2,
      status: 'won',
      payout: 1600,
      date: '2026-05-20',
      result: '1st Place',
    },
    {
      id: 2,
      race: 'Race #7 - Heat 3',
      tournament: 'Elite Cup Series',
      horse: 'Lightning Strike',
      type: 'Place',
      amount: 800,
      odds: 2.0,
      status: 'won',
      payout: 1600,
      date: '2026-05-19',
      result: '2nd Place',
    },
    {
      id: 3,
      race: 'Race #6 - Semi Finals',
      tournament: 'Spring Championship 2026',
      horse: 'Storm Chaser',
      type: 'Show',
      amount: 300,
      odds: 1.8,
      status: 'pending',
      payout: 0,
      date: '2026-05-21',
      result: '-',
    },
    {
      id: 4,
      race: 'Race #5 - Heat 2',
      tournament: 'Elite Cup Series',
      horse: 'Wild Spirit',
      type: 'Win',
      amount: 1000,
      odds: 4.5,
      status: 'lost',
      payout: 0,
      date: '2026-05-18',
      result: '4th Place',
    },
    {
      id: 5,
      race: 'Race #4 - Quarter Finals',
      tournament: 'Summer Grand Prix',
      horse: 'Golden Arrow',
      type: 'Exacta',
      amount: 200,
      odds: 8.0,
      status: 'won',
      payout: 1600,
      date: '2026-05-17',
      result: 'Exact Top 2',
    },
  ];

  const transactions = [
    { id: 1, type: 'win', description: 'Win payout - Race #8', amount: 1600, date: '2026-05-20' },
    { id: 2, type: 'bet', description: 'Bet placed - Race #8', amount: -500, date: '2026-05-20' },
    { id: 3, type: 'win', description: 'Win payout - Race #7', amount: 1600, date: '2026-05-19' },
    { id: 4, type: 'bet', description: 'Bet placed - Race #7', amount: -800, date: '2026-05-19' },
    { id: 5, type: 'deposit', description: 'Wallet deposit', amount: 5000, date: '2026-05-15' },
    { id: 6, type: 'bet', description: 'Bet placed - Race #5', amount: -1000, date: '2026-05-18' },
    { id: 7, type: 'win', description: 'Win payout - Race #4', amount: 1600, date: '2026-05-17' },
  ];

  const achievements = [
    { id: 1, name: 'First Win', description: 'Thắng lần đầu tiên', icon: '🎯', unlocked: true },
    { id: 2, name: 'Streak Master', description: 'Chuỗi thắng 5 trận', icon: '🔥', unlocked: true },
    { id: 3, name: 'Bronze Predictor', description: 'Đạt 70% accuracy', icon: '🥉', unlocked: true },
    { id: 4, name: 'Silver Predictor', description: 'Đạt 80% accuracy', icon: '🥈', unlocked: false },
    { id: 5, name: 'Gold Predictor', description: 'Đạt 90% accuracy', icon: '🥇', unlocked: false },
    { id: 6, name: 'AI Challenger', description: 'Beat AI 10 lần', icon: '🤖', unlocked: false },
    { id: 7, name: 'Tournament Champion', description: 'Thắng tournament', icon: '🏆', unlocked: false },
    { id: 8, name: 'Legendary', description: 'Top 10 leaderboard', icon: '⭐', unlocked: false },
  ];

  const stats = [
    { label: 'Tổng dự đoán', value: predictions.length.toString() },
    { label: 'Thắng', value: predictions.filter((p) => p.status === 'won').length.toString() },
    { label: 'Thua', value: predictions.filter((p) => p.status === 'lost').length.toString() },
    { label: 'Đang chờ', value: predictions.filter((p) => p.status === 'pending').length.toString() },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'won':
        return <CheckCircle sx={{ color: '#10b981' }} />;
      case 'lost':
        return <Cancel sx={{ color: '#ef4444' }} />;
      case 'pending':
        return <Schedule sx={{ color: '#f59e0b' }} />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'won':
        return 'success';
      case 'lost':
        return 'error';
      case 'pending':
        return 'warning';
      default:
        return 'default';
    }
  };

  const filteredPredictions =
    statusFilter === 'all' ? predictions : predictions.filter((p) => p.status === statusFilter);

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button startIcon={<ArrowBack />} onClick={() => navigate('/predictions')}>
            Quay lại
          </Button>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            Dự đoán của tôi
          </Typography>
        </Box>
      </Box>

      {/* Wallet Overview */}
      <Card
        sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          mb: 3,
        }}
      >
        <CardContent sx={{ p: 4 }}>
          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <AccountBalanceWallet sx={{ fontSize: 48 }} />
                <Box>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Số dư ví
                  </Typography>
                  <Typography variant="h3" sx={{ fontWeight: 700 }}>
                    {walletBalance.toLocaleString()} coins
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => setDepositDialogOpen(true)}
                  sx={{
                    bgcolor: 'white',
                    color: '#667eea',
                    '&:hover': { bgcolor: '#f3f4f6' },
                  }}
                >
                  Nạp tiền
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Remove />}
                  onClick={() => setWithdrawDialogOpen(true)}
                  sx={{
                    borderColor: 'white',
                    color: 'white',
                    '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' },
                  }}
                >
                  Rút tiền
                </Button>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Box>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      Tổng thắng
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 700 }}>
                      {totalWinnings.toLocaleString()}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      Tổng đặt
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 700 }}>
                      {totalBets.toLocaleString()}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12}>
                  <Box>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      Lợi nhuận ròng
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="h5" sx={{ fontWeight: 700 }}>
                        {netProfit >= 0 ? '+' : ''}
                        {netProfit.toLocaleString()} coins
                      </Typography>
                      {netProfit >= 0 ? (
                        <TrendingUp sx={{ color: '#10b981' }} />
                      ) : (
                        <TrendingDown sx={{ color: '#ef4444' }} />
                      )}
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {stats.map((stat, index) => (
          <Grid item xs={6} sm={3} key={index}>
            <Card>
              <CardContent>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {stat.label}
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                  {stat.value}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Main Content Tabs */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
            <Tab label="Lịch sử dự đoán" />
            <Tab label="Giao dịch" />
            <Tab label="Biểu đồ" />
            <Tab label="Thành tựu" />
          </Tabs>
        </Box>

        {/* Predictions History Tab */}
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Trạng thái</InputLabel>
              <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} label="Trạng thái">
                <MenuItem value="all">Tất cả</MenuItem>
                <MenuItem value="won">Thắng</MenuItem>
                <MenuItem value="lost">Thua</MenuItem>
                <MenuItem value="pending">Đang chờ</MenuItem>
              </Select>
            </FormControl>
            <Button variant="contained" onClick={() => navigate('/predictions/create')}>
              Tạo dự đoán mới
            </Button>
          </Box>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Ngày</TableCell>
                  <TableCell>Chặng đua</TableCell>
                  <TableCell>Ngựa</TableCell>
                  <TableCell>Loại</TableCell>
                  <TableCell align="right">Đặt cược</TableCell>
                  <TableCell align="right">Tỷ lệ</TableCell>
                  <TableCell align="right">Thanh toán</TableCell>
                  <TableCell>Trạng thái</TableCell>
                  <TableCell>Kết quả</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredPredictions.map((prediction) => (
                  <TableRow key={prediction.id}>
                    <TableCell>{prediction.date}</TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {prediction.race}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {prediction.tournament}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>{prediction.horse}</TableCell>
                    <TableCell>
                      <Chip label={prediction.type} size="small" />
                    </TableCell>
                    <TableCell align="right">{prediction.amount} coins</TableCell>
                    <TableCell align="right">x{prediction.odds}</TableCell>
                    <TableCell align="right">
                      {prediction.payout > 0 ? (
                        <Typography sx={{ fontWeight: 600, color: '#10b981' }}>
                          +{prediction.payout} coins
                        </Typography>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={prediction.status === 'won' ? 'Thắng' : prediction.status === 'lost' ? 'Thua' : 'Chờ'}
                        color={getStatusColor(prediction.status)}
                        icon={getStatusIcon(prediction.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{prediction.result}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Transactions Tab */}
        <TabPanel value={tabValue} index={1}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Ngày</TableCell>
                  <TableCell>Mô tả</TableCell>
                  <TableCell align="right">Số tiền</TableCell>
                  <TableCell>Loại</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {transactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>{transaction.date}</TableCell>
                    <TableCell>{transaction.description}</TableCell>
                    <TableCell align="right">
                      <Typography
                        sx={{
                          fontWeight: 600,
                          color: transaction.amount >= 0 ? '#10b981' : '#ef4444',
                        }}
                      >
                        {transaction.amount >= 0 ? '+' : ''}
                        {transaction.amount} coins
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={transaction.type}
                        size="small"
                        color={transaction.type === 'win' ? 'success' : transaction.type === 'deposit' ? 'primary' : 'default'}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Balance Chart Tab */}
        <TabPanel value={tabValue} index={2}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
              Biến động số dư ví
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={balanceHistory}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="balance" stroke="#667eea" strokeWidth={2} name="Số dư" />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </TabPanel>

        {/* Achievements Tab */}
        <TabPanel value={tabValue} index={3}>
          <Grid container spacing={2}>
            {achievements.map((achievement) => (
              <Grid item xs={12} sm={6} md={3} key={achievement.id}>
                <Card
                  variant="outlined"
                  sx={{
                    opacity: achievement.unlocked ? 1 : 0.5,
                    border: achievement.unlocked ? 2 : 1,
                    borderColor: achievement.unlocked ? '#667eea' : 'divider',
                  }}
                >
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography sx={{ fontSize: '48px', mb: 1 }}>{achievement.icon}</Typography>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                      {achievement.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {achievement.description}
                    </Typography>
                    {achievement.unlocked && (
                      <Chip label="Unlocked" color="success" size="small" sx={{ mt: 2 }} icon={<CheckCircle />} />
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </TabPanel>
      </Card>

      {/* Deposit Dialog */}
      <Dialog open={depositDialogOpen} onClose={() => setDepositDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Nạp tiền vào ví</DialogTitle>
        <DialogContent>
          <TextField fullWidth label="Số tiền" type="number" sx={{ mt: 2 }} InputProps={{ endAdornment: 'coins' }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDepositDialogOpen(false)}>Hủy</Button>
          <Button variant="contained" onClick={() => setDepositDialogOpen(false)}>
            Xác nhận
          </Button>
        </DialogActions>
      </Dialog>

      {/* Withdraw Dialog */}
      <Dialog open={withdrawDialogOpen} onClose={() => setWithdrawDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Rút tiền từ ví</DialogTitle>
        <DialogContent>
          <TextField fullWidth label="Số tiền" type="number" sx={{ mt: 2 }} InputProps={{ endAdornment: 'coins' }} />
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            Số dư khả dụng: {walletBalance.toLocaleString()} coins
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setWithdrawDialogOpen(false)}>Hủy</Button>
          <Button variant="contained" onClick={() => setWithdrawDialogOpen(false)}>
            Xác nhận
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
