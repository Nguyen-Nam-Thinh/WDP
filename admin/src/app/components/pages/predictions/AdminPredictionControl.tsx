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
  Alert,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Avatar,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  ArrowBack,
  Warning,
  Block,
  CheckCircle,
  Cancel,
  Refresh,
  Security,
  Settings,
  Report,
  Visibility,
  Edit,
  Delete,
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

export default function AdminPredictionControl() {
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  const stats = [
    { label: 'Dự đoán hôm nay', value: '2,456', color: '#667eea', status: 'normal' },
    { label: 'Cảnh báo gian lận', value: '12', color: '#ef4444', status: 'alert' },
    { label: 'Pending refunds', value: '8', color: '#f59e0b', status: 'warning' },
    { label: 'Người dùng bị chặn', value: '34', color: '#9ca3af', status: 'normal' },
  ];

  const fraudAlerts = [
    {
      id: 1,
      type: 'multi_account',
      severity: 'high',
      user: 'SuspiciousUser123',
      userId: 'u123',
      description: 'Phát hiện nhiều tài khoản cùng IP đặt cược giống nhau',
      timestamp: '2026-05-21 14:30',
      status: 'pending',
    },
    {
      id: 2,
      type: 'abnormal_betting',
      severity: 'medium',
      user: 'BetMaster99',
      userId: 'u456',
      description: 'Tăng đột ngột số lượng cược 500% so với trung bình',
      timestamp: '2026-05-21 13:15',
      status: 'pending',
    },
    {
      id: 3,
      type: 'pattern_abuse',
      severity: 'high',
      user: 'QuickWinner',
      userId: 'u789',
      description: 'Mẫu cược giống hệt 3 tài khoản khác',
      timestamp: '2026-05-21 12:00',
      status: 'investigating',
    },
    {
      id: 4,
      type: 'suspicious_timing',
      severity: 'low',
      user: 'LateGambler',
      userId: 'u234',
      description: 'Đặt cược ngay trước cutoff time liên tục',
      timestamp: '2026-05-21 11:45',
      status: 'pending',
    },
  ];

  const pendingPredictions = [
    {
      id: 1,
      user: 'User123',
      race: 'Race #8',
      horse: 'Thunder Bolt',
      type: 'Win',
      amount: 5000,
      odds: 3.2,
      timestamp: '2026-05-21 14:00',
      flagReason: 'Số tiền cao bất thường',
    },
    {
      id: 2,
      user: 'User456',
      race: 'Race #9',
      horse: 'Lightning Strike',
      type: 'Exacta',
      amount: 2000,
      odds: 8.0,
      timestamp: '2026-05-21 13:30',
      flagReason: 'Người dùng mới',
    },
  ];

  const bannedUsers = [
    {
      id: 1,
      username: 'Cheater001',
      userId: 'u111',
      reason: 'Multi-account abuse',
      bannedDate: '2026-05-20',
      bannedBy: 'Admin01',
      permanent: true,
    },
    {
      id: 2,
      username: 'FraudUser22',
      userId: 'u222',
      reason: 'Betting pattern manipulation',
      bannedDate: '2026-05-19',
      bannedBy: 'Admin02',
      permanent: false,
      unbanDate: '2026-06-19',
    },
  ];

  const systemSettings = [
    { id: 1, name: 'Win Multiplier', value: '3.0', editable: true },
    { id: 2, name: 'Place Multiplier', value: '2.0', editable: true },
    { id: 3, name: 'Show Multiplier', value: '1.5', editable: true },
    { id: 4, name: 'Exacta Multiplier', value: '8.0', editable: true },
    { id: 5, name: 'Trifecta Multiplier', value: '15.0', editable: true },
    { id: 6, name: 'Max Bet Amount', value: '10000', editable: true },
    { id: 7, name: 'Min Bet Amount', value: '100', editable: true },
    { id: 8, name: 'Prediction Cutoff (minutes)', value: '5', editable: true },
  ];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'info';
      default:
        return 'default';
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'multi_account':
        return '👥';
      case 'abnormal_betting':
        return '📊';
      case 'pattern_abuse':
        return '🔄';
      case 'suspicious_timing':
        return '⏰';
      default:
        return '⚠️';
    }
  };

  const handleAction = (item: any, action: string) => {
    setSelectedItem({ ...item, action });
    setActionDialogOpen(true);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button startIcon={<ArrowBack />} onClick={() => navigate('/predictions')}>
            Quay lại
          </Button>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            Quản trị hệ thống dự đoán
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<Refresh />}>
          Làm mới
        </Button>
      </Box>

      {/* Alert Banner */}
      {fraudAlerts.filter((a) => a.severity === 'high').length > 0 && (
        <Alert severity="error" sx={{ mb: 3 }} icon={<Warning />}>
          <Typography variant="body1" sx={{ fontWeight: 600 }}>
            Phát hiện {fraudAlerts.filter((a) => a.severity === 'high').length} cảnh báo gian lận mức cao! Vui lòng kiểm tra
            ngay.
          </Typography>
        </Alert>
      )}

      {/* Stats Overview */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {stats.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card
              sx={{
                border: stat.status === 'alert' ? 2 : 0,
                borderColor: stat.status === 'alert' ? '#ef4444' : 'transparent',
              }}
            >
              <CardContent>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {stat.label}
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 700, color: stat.color }}>
                  {stat.value}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Main Control Panel */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
            <Tab label="Cảnh báo gian lận" icon={<Warning />} iconPosition="start" />
            <Tab label="Dự đoán chờ duyệt" icon={<Report />} iconPosition="start" />
            <Tab label="Người dùng bị chặn" icon={<Block />} iconPosition="start" />
            <Tab label="Cài đặt hệ thống" icon={<Settings />} iconPosition="start" />
          </Tabs>
        </Box>

        {/* Fraud Alerts Tab */}
        <TabPanel value={tabValue} index={0}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Loại</TableCell>
                  <TableCell>Mức độ</TableCell>
                  <TableCell>Người dùng</TableCell>
                  <TableCell>Mô tả</TableCell>
                  <TableCell>Thời gian</TableCell>
                  <TableCell>Trạng thái</TableCell>
                  <TableCell align="right">Hành động</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {fraudAlerts.map((alert) => (
                  <TableRow key={alert.id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography sx={{ fontSize: '20px' }}>{getAlertIcon(alert.type)}</Typography>
                        <Typography variant="body2">{alert.type.replace('_', ' ')}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip label={alert.severity} color={getSeverityColor(alert.severity)} size="small" />
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {alert.user}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          ID: {alert.userId}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{alert.description}</Typography>
                    </TableCell>
                    <TableCell>{alert.timestamp}</TableCell>
                    <TableCell>
                      <Chip
                        label={alert.status}
                        size="small"
                        color={alert.status === 'investigating' ? 'warning' : 'default'}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton size="small" onClick={() => handleAction(alert, 'investigate')}>
                        <Visibility />
                      </IconButton>
                      <IconButton size="small" color="error" onClick={() => handleAction(alert, 'ban')}>
                        <Block />
                      </IconButton>
                      <IconButton size="small" color="success" onClick={() => handleAction(alert, 'dismiss')}>
                        <CheckCircle />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Pending Predictions Tab */}
        <TabPanel value={tabValue} index={1}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Người dùng</TableCell>
                  <TableCell>Chặng đua</TableCell>
                  <TableCell>Ngựa</TableCell>
                  <TableCell>Loại</TableCell>
                  <TableCell align="right">Số tiền</TableCell>
                  <TableCell align="right">Tỷ lệ</TableCell>
                  <TableCell>Lý do flag</TableCell>
                  <TableCell align="right">Hành động</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {pendingPredictions.map((prediction) => (
                  <TableRow key={prediction.id}>
                    <TableCell>{prediction.user}</TableCell>
                    <TableCell>{prediction.race}</TableCell>
                    <TableCell>{prediction.horse}</TableCell>
                    <TableCell>
                      <Chip label={prediction.type} size="small" />
                    </TableCell>
                    <TableCell align="right">{prediction.amount.toLocaleString()} coins</TableCell>
                    <TableCell align="right">x{prediction.odds}</TableCell>
                    <TableCell>
                      <Chip label={prediction.flagReason} size="small" color="warning" icon={<Warning />} />
                    </TableCell>
                    <TableCell align="right">
                      <Button
                        size="small"
                        variant="outlined"
                        color="success"
                        sx={{ mr: 1 }}
                        onClick={() => handleAction(prediction, 'approve')}
                      >
                        Duyệt
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        onClick={() => handleAction(prediction, 'reject')}
                      >
                        Từ chối
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Banned Users Tab */}
        <TabPanel value={tabValue} index={2}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Người dùng</TableCell>
                  <TableCell>Lý do</TableCell>
                  <TableCell>Ngày chặn</TableCell>
                  <TableCell>Chặn bởi</TableCell>
                  <TableCell>Loại</TableCell>
                  <TableCell>Ngày mở chặn</TableCell>
                  <TableCell align="right">Hành động</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {bannedUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ bgcolor: '#ef4444' }}>
                          <Block />
                        </Avatar>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {user.username}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            ID: {user.userId}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>{user.reason}</TableCell>
                    <TableCell>{user.bannedDate}</TableCell>
                    <TableCell>{user.bannedBy}</TableCell>
                    <TableCell>
                      <Chip label={user.permanent ? 'Vĩnh viễn' : 'Tạm thời'} size="small" color={user.permanent ? 'error' : 'warning'} />
                    </TableCell>
                    <TableCell>{user.unbanDate || '-'}</TableCell>
                    <TableCell align="right">
                      <Button size="small" variant="outlined" onClick={() => handleAction(user, 'unban')}>
                        Mở chặn
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* System Settings Tab */}
        <TabPanel value={tabValue} index={3}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Alert severity="info" icon={<Security />}>
                Thay đổi cài đặt hệ thống sẽ ảnh hưởng đến tất cả dự đoán mới. Vui lòng cân nhắc kỹ trước khi thay đổi.
              </Alert>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                    Hệ số thắng cược
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {systemSettings.slice(0, 5).map((setting) => (
                      <Box key={setting.id} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Typography variant="body1">{setting.name}</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <TextField size="small" value={setting.value} sx={{ width: 100 }} />
                          <IconButton size="small" color="primary">
                            <Edit />
                          </IconButton>
                        </Box>
                      </Box>
                    ))}
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                    Giới hạn & Quy tắc
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {systemSettings.slice(5).map((setting) => (
                      <Box key={setting.id} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Typography variant="body1">{setting.name}</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <TextField size="small" value={setting.value} sx={{ width: 100 }} />
                          <IconButton size="small" color="primary">
                            <Edit />
                          </IconButton>
                        </Box>
                      </Box>
                    ))}
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                    Tính năng hệ thống
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <FormControlLabel
                        control={<Switch defaultChecked />}
                        label="Cho phép AI Recommendation"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FormControlLabel control={<Switch defaultChecked />} label="Cho phép Live Betting" />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FormControlLabel control={<Switch defaultChecked />} label="Auto Settlement Engine" />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FormControlLabel control={<Switch defaultChecked />} label="Fraud Detection Active" />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FormControlLabel control={<Switch />} label="Manual Approval Mode" />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FormControlLabel control={<Switch defaultChecked />} label="Leaderboard Public" />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>
      </Card>

      {/* Action Dialog */}
      <Dialog open={actionDialogOpen} onClose={() => setActionDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Xác nhận hành động</DialogTitle>
        <DialogContent>
          <Typography>
            Bạn có chắc chắn muốn {selectedItem?.action} {selectedItem?.user || selectedItem?.username}?
          </Typography>
          {selectedItem?.action === 'ban' && (
            <TextField fullWidth multiline rows={3} label="Lý do chặn" sx={{ mt: 2 }} />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setActionDialogOpen(false)}>Hủy</Button>
          <Button variant="contained" color="primary" onClick={() => setActionDialogOpen(false)}>
            Xác nhận
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
