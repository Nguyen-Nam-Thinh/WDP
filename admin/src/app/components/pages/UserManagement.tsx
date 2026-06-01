import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Button,
  TextField,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Avatar,
  Typography,
  TablePagination,
  Skeleton,
  Tooltip,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Edit,
  Search,
  Block,
  CheckCircle,
  Refresh,
  FilterList,
} from '@mui/icons-material';
import { toast } from 'sonner';
import { userApi, AdminUser } from '../../api/user';

const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin',
  owner: 'Chủ ngựa',
  jockey: 'Kỵ thủ',
  referee: 'Trọng tài',
  spectator: 'Khán giả',
};

const ROLE_COLORS: Record<string, 'error' | 'warning' | 'info' | 'success' | 'default' | 'primary' | 'secondary'> = {
  admin: 'error',
  owner: 'warning',
  jockey: 'primary',
  referee: 'info',
  spectator: 'default',
};

export default function UserManagement() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters & pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(0); // MUI is 0-indexed
  const [rowsPerPage, setRowsPerPage] = useState(20);

  // Edit dialog
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [editFullName, setEditFullName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editRole, setEditRole] = useState('');
  const [saving, setSaving] = useState(false);

  // Toggle active loading set
  const [togglingIds, setTogglingIds] = useState<Set<string>>(new Set());

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await userApi.getUsers({
        role: roleFilter || undefined,
        page: page + 1,
        limit: rowsPerPage,
      });
      setUsers(res.users);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể tải danh sách người dùng';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [roleFilter, page, rowsPerPage]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Client-side search filter (search trong kết quả đã fetch)
  const filteredUsers = users.filter(
    (u) =>
      u.role !== 'admin' &&
      (u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase())),
  );

  const handleEdit = (user: AdminUser) => {
    setSelectedUser(user);
    setEditFullName(user.fullName);
    setEditPhone(user.phone ?? '');
    setEditRole(user.role);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedUser(null);
  };

  const handleSaveUser = async () => {
    if (!selectedUser) return;
    setSaving(true);
    try {
      await userApi.updateUser(selectedUser._id, {
        fullName: editFullName,
        phone: editPhone,
        role: editRole as AdminUser['role'],
      });
      toast.success('Cập nhật người dùng thành công');
      handleCloseDialog();
      fetchUsers();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Cập nhật thất bại');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (user: AdminUser) => {
    setTogglingIds((prev) => new Set(prev).add(user._id));
    try {
      await userApi.toggleActive(user._id);
      toast.success(
        user.isActive
          ? `Đã vô hiệu hóa tài khoản ${user.fullName}`
          : `Đã kích hoạt tài khoản ${user.fullName}`,
      );
      fetchUsers();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Thao tác thất bại');
    } finally {
      setTogglingIds((prev) => {
        const s = new Set(prev);
        s.delete(user._id);
        return s;
      });
    }
  };

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(e.target.value, 10));
    setPage(0);
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          Quản lý người dùng
          {!loading && (
            <Typography component="span" variant="body2" sx={{ ml: 1, color: 'text.secondary' }}>
              ({total} người dùng)
            </Typography>
          )}
        </Typography>
        <Tooltip title="Làm mới">
          <IconButton onClick={fetchUsers} disabled={loading}>
            <Refresh />
          </IconButton>
        </Tooltip>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 3, borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
        {/* Filters */}
        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
          <TextField
            placeholder="Tìm kiếm theo tên hoặc email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{ flex: 1, minWidth: 220 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
          />
          <FormControl sx={{ minWidth: 160 }}>
            <InputLabel>
              <FilterList sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
              Vai trò
            </InputLabel>
            <Select
              value={roleFilter}
              label="Vai trò"
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setPage(0);
              }}
            >
              <MenuItem value="">Tất cả</MenuItem>
              <MenuItem value="owner">Chủ ngựa</MenuItem>
              <MenuItem value="jockey">Kỵ thủ</MenuItem>
              <MenuItem value="referee">Trọng tài</MenuItem>
              <MenuItem value="spectator">Khán giả</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {/* Table */}
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Người dùng</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Email</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Vai trò</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Trạng thái</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Ngày tạo</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="right">
                  Hành động
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading
                ? Array.from({ length: rowsPerPage }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 6 }).map((__, j) => (
                        <TableCell key={j}>
                          <Skeleton variant="text" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                : filteredUsers.map((user) => (
                    <TableRow key={user._id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar src={user.avatarUrl} sx={{ bgcolor: 'primary.main', width: 36, height: 36 }}>
                            {user.fullName.charAt(0).toUpperCase()}
                          </Avatar>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {user.fullName}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>
                        {user.email}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={ROLE_LABELS[user.role] ?? user.role}
                          size="small"
                          color={ROLE_COLORS[user.role] ?? 'default'}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={user.isActive ? <CheckCircle /> : <Block />}
                          label={user.isActive ? 'Hoạt động' : 'Vô hiệu hóa'}
                          size="small"
                          color={user.isActive ? 'success' : 'default'}
                        />
                      </TableCell>
                      <TableCell sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>
                        {new Date(user.createdAt).toLocaleDateString('vi-VN')}
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="Chỉnh sửa">
                          <IconButton size="small" onClick={() => handleEdit(user)}>
                            <Edit fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={user.isActive ? 'Vô hiệu hóa tài khoản' : 'Kích hoạt tài khoản'}>
                          <span>
                            <IconButton
                              size="small"
                              color={user.isActive ? 'error' : 'success'}
                              onClick={() => handleToggleActive(user)}
                              disabled={togglingIds.has(user._id)}
                            >
                              {togglingIds.has(user._id) ? (
                                <CircularProgress size={16} />
                              ) : user.isActive ? (
                                <Block fontSize="small" />
                              ) : (
                                <CheckCircle fontSize="small" />
                              )}
                            </IconButton>
                          </span>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}

              {!loading && filteredUsers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                    Không tìm thấy người dùng nào
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination */}
        <TablePagination
          component="div"
          count={total}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[10, 20, 50]}
          labelRowsPerPage="Số hàng mỗi trang:"
          labelDisplayedRows={({ from, to, count }) => `${from}–${to} / ${count}`}
        />
      </Paper>

      {/* Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Chỉnh sửa người dùng</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              label="Họ và tên"
              fullWidth
              value={editFullName}
              onChange={(e) => setEditFullName(e.target.value)}
            />
            <TextField
              label="Email"
              type="email"
              fullWidth
              value={selectedUser?.email ?? ''}
              disabled
              helperText="Email không thể thay đổi"
            />
            <TextField
              label="Số điện thoại"
              fullWidth
              value={editPhone}
              onChange={(e) => setEditPhone(e.target.value)}
            />
            <FormControl fullWidth>
              <InputLabel>Vai trò</InputLabel>
              <Select value={editRole} label="Vai trò" onChange={(e) => setEditRole(e.target.value)}>
                <MenuItem value="owner">Chủ ngựa</MenuItem>
                <MenuItem value="jockey">Kỵ thủ</MenuItem>
                <MenuItem value="referee">Trọng tài</MenuItem>
                <MenuItem value="spectator">Khán giả</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseDialog} disabled={saving}>
            Hủy
          </Button>
          <Button variant="contained" onClick={handleSaveUser} disabled={saving}>
            {saving ? <CircularProgress size={20} sx={{ mr: 1 }} /> : null}
            Cập nhật
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
