import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  LinearProgress,
} from '@mui/material';
import {
  People,
  EmojiEvents,
  Pets,
  TrendingUp,
  HourglassEmpty,
  CheckCircle,
} from '@mui/icons-material';

export default function Dashboard() {
  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
        Tổng quan hệ thống
      </Typography>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: '12px', bgcolor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Tổng người dùng
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 600 }}>
                    1,245
                  </Typography>
                  <Typography variant="caption" color="success.main" sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    <TrendingUp fontSize="small" sx={{ mr: 0.5 }} />
                    +12% so với tháng trước
                  </Typography>
                </Box>
                <People sx={{ fontSize: 48, color: 'primary.main', opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: '12px' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Giải đấu đang diễn ra
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 600 }}>
                    5
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    8 giải sắp tới
                  </Typography>
                </Box>
                <EmojiEvents sx={{ fontSize: 48, color: 'warning.main', opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: '12px' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Ngựa đang thi đấu
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 600 }}>
                    87
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    15 ngựa mới đăng ký
                  </Typography>
                </Box>
                <Pets sx={{ fontSize: 48, color: 'success.main', opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: '12px' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Đơn chờ duyệt
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 600, color: 'error.main' }}>
                    23
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    Cần xử lý ngay
                  </Typography>
                </Box>
                <HourglassEmpty sx={{ fontSize: 48, color: 'error.main', opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
              Giải đấu sắp tới
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Tên giải đấu</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Ngày bắt đầu</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Địa điểm</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Trạng thái</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow hover>
                    <TableCell sx={{ fontWeight: 500 }}>Giải Vô Địch Quốc Gia 2026</TableCell>
                    <TableCell>2026-06-15</TableCell>
                    <TableCell>Sài Gòn</TableCell>
                    <TableCell>
                      <Chip label="Sắp diễn ra" size="small" color="info" />
                    </TableCell>
                  </TableRow>
                  <TableRow hover>
                    <TableCell sx={{ fontWeight: 500 }}>Cúp Mùa Hè</TableCell>
                    <TableCell>2026-07-20</TableCell>
                    <TableCell>Hà Nội</TableCell>
                    <TableCell>
                      <Chip label="Đang chuẩn bị" size="small" color="warning" />
                    </TableCell>
                  </TableRow>
                  <TableRow hover>
                    <TableCell sx={{ fontWeight: 500 }}>Giải Thiếu Niên</TableCell>
                    <TableCell>2026-08-10</TableCell>
                    <TableCell>Đà Nẵng</TableCell>
                    <TableCell>
                      <Chip label="Đang chuẩn bị" size="small" color="warning" />
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
              Công việc cần làm
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    Duyệt đăng ký
                  </Typography>
                  <Typography variant="body2" color="error.main" sx={{ fontWeight: 600 }}>
                    23/30
                  </Typography>
                </Box>
                <LinearProgress variant="determinate" value={76} sx={{ height: 8, borderRadius: '4px' }} color="error" />
              </Box>
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    Phân công trọng tài
                  </Typography>
                  <Typography variant="body2" color="warning.main" sx={{ fontWeight: 600 }}>
                    8/12
                  </Typography>
                </Box>
                <LinearProgress variant="determinate" value={67} sx={{ height: 8, borderRadius: '4px' }} color="warning" />
              </Box>
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    Công bố kết quả
                  </Typography>
                  <Typography variant="body2" color="success.main" sx={{ fontWeight: 600 }}>
                    12/12
                  </Typography>
                </Box>
                <LinearProgress variant="determinate" value={100} sx={{ height: 8, borderRadius: '4px' }} color="success" />
              </Box>
            </Box>
          </Paper>

          <Paper sx={{ p: 3, borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
              Hoạt động gần đây
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <CheckCircle sx={{ color: 'success.main', fontSize: 20 }} />
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    Đã duyệt đăng ký
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Thunder Bolt - 5 phút trước
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <CheckCircle sx={{ color: 'success.main', fontSize: 20 }} />
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    Công bố kết quả
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Vòng Final - Cúp Mùa Xuân - 1 giờ trước
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <EmojiEvents sx={{ color: 'warning.main', fontSize: 20 }} />
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    Tạo giải đấu mới
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Cúp Mùa Hè - 2 giờ trước
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
