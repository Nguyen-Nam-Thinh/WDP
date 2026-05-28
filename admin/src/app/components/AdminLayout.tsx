import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  Avatar,
  Menu,
  MenuItem,
  Divider,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard,
  People,
  EmojiEvents,
  HowToReg,
  Gavel,
  EmojiEventsOutlined,
  QueryStats,
  Logout,
  Settings,
  Person,
  Flag,
} from '@mui/icons-material';

const drawerWidth = 280;

const menuItems = [
  { path: '/dashboard', label: 'Tổng quan', icon: <Dashboard /> },
  { path: '/users', label: 'Quản lý người dùng', icon: <People /> },
  { path: '/tournaments', label: 'Quản lý giải đấu', icon: <EmojiEvents /> },
  { path: '/races', label: 'Quản lý chặng đua', icon: <Flag /> },
  { path: '/registrations', label: 'Duyệt đăng ký', icon: <HowToReg /> },
  { path: '/referees', label: 'Phân công trọng tài', icon: <Gavel /> },
  { path: '/results', label: 'Công bố kết quả', icon: <EmojiEventsOutlined /> },
  { path: '/predictions', label: 'Hệ thống dự đoán', icon: <QueryStats /> },
];

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const isActive = (path: string) => {
    if (path === '/predictions') {
      return location.pathname.startsWith('/predictions');
    }
    return location.pathname === path;
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const currentMenuItem = menuItems.find((item) => isActive(item.path));

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: '8px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '20px',
          }}
        >
          🏇
        </Box>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
            Horse Racing
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Admin Panel
          </Typography>
        </Box>
      </Box>
      <Divider />
      <List sx={{ flex: 1, px: 2, py: 1 }}>
        {menuItems.map((item) => {
          const active = isActive(item.path);
          return (
            <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                selected={active}
                onClick={() => {
                  navigate(item.path);
                  setMobileOpen(false);
                }}
                sx={{
                  borderRadius: '8px',
                  '&.Mui-selected': {
                    bgcolor: 'primary.main',
                    color: 'white',
                    '&:hover': {
                      bgcolor: 'primary.dark',
                    },
                    '& .MuiListItemIcon-root': {
                      color: 'white',
                    },
                  },
                  '&:hover': {
                    bgcolor: 'action.hover',
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 40,
                    color: active ? 'white' : 'text.secondary',
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{
                    fontSize: '14px',
                    fontWeight: active ? 600 : 500,
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', height: '100vh', bgcolor: '#f5f6fa' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          bgcolor: 'white',
          color: 'text.primary',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1, fontWeight: 600 }}>
            {currentMenuItem?.label || 'Tổng quan'}
          </Typography>
          <IconButton onClick={handleMenuClick}>
            <Avatar sx={{ width: 36, height: 36, bgcolor: 'primary.main' }}>A</Avatar>
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            <MenuItem onClick={handleMenuClose}>
              <ListItemIcon>
                <Person fontSize="small" />
              </ListItemIcon>
              Hồ sơ
            </MenuItem>
            <MenuItem onClick={handleMenuClose}>
              <ListItemIcon>
                <Settings fontSize="small" />
              </ListItemIcon>
              Cài đặt
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleMenuClose}>
              <ListItemIcon>
                <Logout fontSize="small" />
              </ListItemIcon>
              Đăng xuất
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          mt: '64px',
          overflow: 'auto',
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
