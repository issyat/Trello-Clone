import React from 'react';
import { Box, IconButton, useMediaQuery, useTheme } from '@mui/material';
import { Menu as MenuIcon } from '@mui/icons-material';
import Header from './Header';
import Sidebar from './Sidebar';

interface LayoutProps {
  children: React.ReactNode;
  onCreateProject?: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, onCreateProject }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  const handleSidebarOpen = () => {
    setSidebarOpen(true);
  };

  const handleSidebarClose = () => {
    setSidebarOpen(false);
  };

  const handleCreateProject = () => {
    if (onCreateProject) {
      onCreateProject();
    }
    setSidebarOpen(false);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <Header />
      
      <Box sx={{ display: 'flex', flexGrow: 1, overflow: 'hidden' }}>
        {/* Mobile menu button */}
        {isMobile && (
          <Box
            sx={{
              position: 'fixed',
              top: 70,
              left: 8,
              zIndex: theme.zIndex.speedDial,
            }}
          >
            <IconButton
              onClick={handleSidebarOpen}
              sx={{
                backgroundColor: 'background.paper',
                boxShadow: 1,
                '&:hover': {
                  backgroundColor: 'background.paper',
                  boxShadow: 2,
                },
              }}
            >
              <MenuIcon />
            </IconButton>
          </Box>
        )}

        <Sidebar
          open={sidebarOpen}
          onClose={handleSidebarClose}
          onCreateProject={handleCreateProject}
        />        <Box
          component="main"
          sx={{
            flexGrow: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            backgroundColor: '#fafbfc',
            width: '100%',
            minWidth: 0,
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
};

export default Layout;
