import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Box,
  CssBaseline,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  useTheme,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Science as ScienceIcon,
  Assignment as AssignmentIcon,
  Experiment as ExperimentIcon,
  Logout as LogoutIcon,
} from '@mui/icons-material';
import { makeStyles } from '@mui/styles';
import { useAuth } from '../contexts/AuthContext';

const drawerWidth = 240;

const useStyles = makeStyles((theme) => ({
  root: {
    display: 'flex',
    background: 'linear-gradient(135deg, #F5F9FD 0%, #E1F1FF 100%)',
    minHeight: '100vh',
  },
  drawer: {
    [theme.breakpoints.up('sm')]: {
      width: drawerWidth,
      flexShrink: 0,
    },
  },
  appBar: {
    background: '#0B3861',
    [theme.breakpoints.up('sm')]: {
      width: `calc(100% - ${drawerWidth}px)`,
      marginLeft: drawerWidth,
    },
  },
  menuButton: {
    marginRight: theme.spacing(2),
    [theme.breakpoints.up('sm')]: {
      display: 'none',
    },
    color: '#BCE0FD',
  },
  drawerPaper: {
    width: drawerWidth,
    background: '#F5F9FD',
    borderRight: '1px solid #BCE0FD',
  },
  content: {
    flexGrow: 1,
    padding: theme.spacing(3),
  },
  toolbar: theme.mixins.toolbar,
  listItem: {
    '&.Mui-selected': {
      backgroundColor: '#BCE0FD',
      color: '#0B3861',
      '&:hover': {
        backgroundColor: '#64B5F6',
      },
    },
    '&:hover': {
      backgroundColor: '#E1F1FF',
      color: '#1E88E5',
    },
  },
  listItemIcon: {
    color: '#0B3861',
  },
  logoutButton: {
    color: '#0B3861',
    '&:hover': {
      backgroundColor: '#BCE0FD',
    },
  },
}));

const Layout = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const theme = useTheme();
  const classes = useStyles();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
    { text: 'Chemicals', icon: <ScienceIcon />, path: '/chemicals' },
    { text: 'Requests', icon: <AssignmentIcon />, path: '/requests' },
    { text: 'Experiments', icon: <ExperimentIcon />, path: '/experiments' },
  ];

  const drawer = (
    <div>
      <Toolbar className={classes.toolbar}>
        <Typography variant="h6" noWrap component="div">
          Lab Inventory
        </Typography>
      </Toolbar>
      <List>
        {menuItems.map((item) => (
          <ListItem
            button
            key={item.text}
            onClick={() => {
              navigate(item.path);
              setMobileOpen(false);
            }}
            selected={location.pathname === item.path}
            className={classes.listItem}
          >
            <ListItemIcon className={classes.listItemIcon}>{item.icon}</ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItem>
        ))}
        <ListItem
          button
          onClick={() => {
            logout();
            navigate('/login');
          }}
          className={classes.logoutButton}
        >
          <ListItemIcon className={classes.listItemIcon}>
            <LogoutIcon />
          </ListItemIcon>
          <ListItemText primary="Logout" />
        </ListItem>
      </List>
    </div>
  );

  return (
    <Box className={classes.root}>
      <CssBaseline />
      <AppBar position="fixed" className={classes.appBar}>
        <Toolbar>
          <IconButton
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            className={classes.menuButton}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div">
            {user?.name} ({user?.role})
          </Typography>
        </Toolbar>
      </AppBar>
      <Box component="nav" className={classes.drawer}>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          classes={{
            paper: classes.drawerPaper,
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          classes={{
            paper: classes.drawerPaper,
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box component="main" className={classes.content}>
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
};

export default Layout;