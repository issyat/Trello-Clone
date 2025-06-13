import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { User, RegisterCredentials } from '../types';
import { authService } from '../services';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterCredentials) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authInitialized, setAuthInitialized] = useState(false);

  const isAuthenticated = Boolean(user && authService.getAccessToken());

  // Initialize auth state on app start
  useEffect(() => {
    const initializeAuth = async () => {
      console.log('Initializing authentication...');
      try {
        const hasToken = authService.getAccessToken();
        if (hasToken) {
          console.log('Token found, attempting to get user data');
          try {
            const userData = await authService.getCurrentUser();
            console.log('User data retrieved successfully');
            setUser(userData);
          } catch (userError) {
            console.error('Failed to get user data:', userError);
            // If getting user data fails, try to refresh the token
            try {
              console.log('Attempting token refresh...');
              await authService.refreshToken();
              const userData = await authService.getCurrentUser();
              console.log('User data retrieved after token refresh');
              setUser(userData);
            } catch (refreshError) {
              console.error('Token refresh failed:', refreshError);
              authService.clearTokens();
            }
          }
        } else {
          console.log('No authentication token found');
        }
      } catch (error) {
        console.error('Failed to initialize auth:', error);
        authService.clearTokens();
      } finally {
        setIsLoading(false);
        setAuthInitialized(true);
      }
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      console.log('Attempting login...');
      const response = await authService.login({ email, password });
      console.log('Login successful, setting user data');
      setUser(response.user);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };
  const register = async (userData: RegisterCredentials) => {
    setIsLoading(true);
    try {
      console.log('Attempting registration...');
      const response = await authService.register(userData);
      console.log('Registration successful, setting user data');
      setUser(response.user);
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      console.log('Logging out...');
      await authService.logout();
      console.log('Logout successful, clearing user data');
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
      // Even if logout API fails, clear local data
      setUser(null);
      authService.clearTokens();
    } finally {
      setIsLoading(false);
    }
  };
  const refreshUser = useCallback(async () => {
    const accessToken = authService.getAccessToken();
    const refreshToken = authService.getRefreshToken();
    
    if (!accessToken && !refreshToken) {
      console.log('No tokens available for refresh user');
      return;
    }
    
    console.log('Refreshing user data with tokens:', { 
      hasAccessToken: !!accessToken, 
      hasRefreshToken: !!refreshToken 
    });
    
    try {
      // First try with current access token
      if (accessToken) {
        try {
          console.log('Trying to get user data with current access token');
          const userData = await authService.getCurrentUser();
          console.log('User data refreshed successfully with existing token');
          setUser(userData);
          return;
        } catch (accessError) {
          console.log('Failed with access token, will try refresh token next:', accessError);
          // Continue to refresh token attempt
        }
      }
      
      // If that failed or no access token, try refresh token
      if (refreshToken) {
        console.log('Refreshing token...');
        await authService.refreshToken();
        console.log('Token refreshed, getting user data');
        const userData = await authService.getCurrentUser();
        console.log('User data retrieved after token refresh');
        setUser(userData);
      } else {
        console.error('No refresh token available');
        throw new Error('No refresh token available');
      }
    } catch (error) {
      console.error('Failed to refresh user data:', error);
      // Clear any invalid tokens and user data
      setUser(null);
      authService.clearTokens();
      throw error;
    }
  }, []);

  const value: AuthContextType = {
    user,
    isLoading: isLoading || !authInitialized,
    isAuthenticated,
    login,
    register,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
