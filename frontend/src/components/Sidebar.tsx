import React from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Box,
  Divider,
  Button,
  IconButton,
} from '@mui/material';
import {
  Dashboard,
  Folder,
  Add,
  Settings,
  ChevronLeft,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useProjects } from '../hooks/useProjects';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  onCreateProject: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ open, onClose, onCreateProject }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { data: projects, isLoading } = useProjects();

  const menuItems = [
    { text: 'Dashboard', icon: <Dashboard />, path: '/dashboard' },
    { text: 'Settings', icon: <Settings />, path: '/settings' },
  ];

  const handleNavigation = (path: string) => {
    navigate(path);
    onClose();
  };

  const handleProjectClick = (projectId: number) => {
    navigate(`/project/${projectId}`);
    onClose();
  };

  return (
    <Drawer
      variant="temporary"
      anchor="left"
      open={open}
      onClose={onClose}
      sx={{
        width: 280,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: 280,
          boxSizing: 'border-box',
        },
      }}
    >
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
          Menu
        </Typography>
        <IconButton onClick={onClose}>
          <ChevronLeft />
        </IconButton>
      </Box>
      
      <Divider />
      
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => handleNavigation(item.path)}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      
      <Divider />
      
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
            Projects
          </Typography>
          <Button
            startIcon={<Add />}
            size="small"
            onClick={onCreateProject}
            variant="outlined"
          >
            New
          </Button>
        </Box>
        
        <List dense>
          {isLoading ? (
            <ListItem>
              <ListItemText primary="Loading projects..." />
            </ListItem>
          ) : (
            projects?.map((project) => (
              <ListItem key={project.id} disablePadding>
                <ListItemButton
                  selected={location.pathname === `/project/${project.id}`}
                  onClick={() => handleProjectClick(Number(project.id))}
                >
                  <ListItemIcon>
                    <Folder />
                  </ListItemIcon>
                  <ListItemText 
                    primary={project.name}
                    primaryTypographyProps={{
                      noWrap: true,
                      title: project.name
                    }}
                  />
                </ListItemButton>
              </ListItem>
            ))
          )}
          
          {projects?.length === 0 && (
            <ListItem>
              <ListItemText 
                primary="No projects yet"
                secondary="Create your first project to get started"
                secondaryTypographyProps={{ variant: 'caption' }}
              />
            </ListItem>
          )}
        </List>
      </Box>
    </Drawer>
  );
};

export default Sidebar;
