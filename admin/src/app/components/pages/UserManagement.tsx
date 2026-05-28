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
} from '@mui/material';
import {
  Edit,
  Delete,
  Search,
  Add,
  Block,
  CheckCircle,
} from '@mui/icons-material';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'inactive';
  avatar?: string;
  joinDate: string;
}

const mockUsers: User[] = [
  { id: 1, name: 'Nguyễn Văn A', email: 'nguyenvana@example.com', role: 'Admin', status: 'active', joinDate: '2024-01-15' },
  { id: 2, name: 'Trần Thị B', email: 'tranthib@example.com', role: 'Moderator', status: 'active', joinDate: '2024-02-20' },
  { id: 3, name: 'Lê Văn C', email: 'levanc@example.com', role: 'User', status: 'inactive', joinDate: '2024-03-10' },
  { id: 4, name: 'Phạm Thị D', email: 'phamthid@example.com', role: 'User', status: 'active', joinDate: '2024-04-05' },
];

export default function UserManagement() {
  const [users] = useState<User[]>(mockUsers);
  const [searchQuery, setSearchQuery] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedUser(null);
  };

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          Quản lý người dùng
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setOpenDialog(true)}
          sx={{ borderRadius: '8px' }}
        >
          Thêm người dùng
        </Button>
      </Box>

      <Paper sx={{ p: 3, borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
        <TextField
          fullWidth
          placeholder="Tìm kiếm theo tên hoặc email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{ mb: 3 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
        />

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Người dùng</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Email</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Vai trò</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Trạng thái</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Ngày tham gia</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="right">
                  Hành động
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar sx={{ bgcolor: 'primary.main' }}>
                        {user.name.charAt(0)}
                      </Avatar>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {user.name}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Chip
                      label={user.role}
                      size="small"
                      color={user.role === 'Admin' ? 'error' : user.role === 'Moderator' ? 'warning' : 'default'}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      icon={user.status === 'active' ? <CheckCircle /> : <Block />}
                      label={user.status === 'active' ? 'Hoạt động' : 'Không hoạt động'}
                      size="small"
                      color={user.status === 'active' ? 'success' : 'default'}
                    />
                  </TableCell>
                  <TableCell>{user.joinDate}</TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => handleEdit(user)}>
                      <Edit fontSize="small" />
                    </IconButton>
                    <IconButton size="small" color="error">
                      <Delete fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{selectedUser ? 'Chỉnh sửa người dùng' : 'Thêm người dùng mới'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField label="Họ và tên" fullWidth defaultValue={selectedUser?.name} />
            <TextField label="Email" type="email" fullWidth defaultValue={selectedUser?.email} />
            <FormControl fullWidth>
              <InputLabel>Vai trò</InputLabel>
              <Select defaultValue={selectedUser?.role || 'User'} label="Vai trò">
                <MenuItem value="Admin">Admin</MenuItem>
                <MenuItem value="Moderator">Moderator</MenuItem>
                <MenuItem value="User">User</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Trạng thái</InputLabel>
              <Select defaultValue={selectedUser?.status || 'active'} label="Trạng thái">
                <MenuItem value="active">Hoạt động</MenuItem>
                <MenuItem value="inactive">Không hoạt động</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseDialog}>Hủy</Button>
          <Button variant="contained" onClick={handleCloseDialog}>
            {selectedUser ? 'Cập nhật' : 'Tạo mới'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
