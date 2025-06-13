import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Box, CircularProgress, Typography } from '@mui/material';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, isLoading, isAuthenticated, refreshUser } = useAuth();
  const location = useLocation();
  // Try to refresh user data if we have a token but no user
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      const accessToken = localStorage.getItem('access_token');
      const refreshToken = localStorage.getItem('refresh_token');

      if (accessToken || refreshToken) {
        console.log('Protected route: Has tokens but no authenticated user, refreshing...', { 
          hasAccessToken: !!accessToken, 
          hasRefreshToken: !!refreshToken,
          path: location.pathname 
        });
        
        // Try to refresh user data with the tokens we have
        refreshUser()
          .then(() => {
            console.log('Successfully refreshed user data in protected route');
          })
          .catch((err) => {
            console.error('Failed to refresh user in protected route:', err);
            // Clear invalid tokens if we failed to use them
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
          });
      }
    }
  }, [isLoading, isAuthenticated, refreshUser, location]);

  // Show loading indicator while checking authentication
  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
        }}
      >
        <CircularProgress size={40} />
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          Loading...
        </Typography>
      </Box>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    console.log('Protected route: Not authenticated, redirecting to login');
    // Redirect to login page with return url
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // User is authenticated, render the protected content
  return <>{children}</>;
};

export default ProtectedRoute;
