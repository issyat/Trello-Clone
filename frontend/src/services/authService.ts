import { apiClient } from './apiClient';
import type {
  AuthResponse,
  LoginCredentials,
  RegisterCredentials,
  User,
} from '../types';

// Added interface to match actual backend response
interface BackendAuthResponse {
  message: string;
  user: User;
  tokens: {
    access: string;
    refresh: string;
  };
}

export const authService = {
  // Authentication
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      console.log('Login request with:', { email: credentials.email });
      
      // Make request to login endpoint
      const response = await apiClient.post<BackendAuthResponse>('/api/auth/login/', credentials);
      console.log('Login response received:', response);
      
      // Extract tokens and user from the response
      const { tokens, user } = response;
      
      if (tokens && tokens.access) {
        console.log('Storing access token');
        localStorage.setItem('access_token', tokens.access);
      } else {
        console.error('No access token received in login response');
        throw new Error('No access token received');
      }
      
      if (tokens && tokens.refresh) {
        console.log('Storing refresh token');
        localStorage.setItem('refresh_token', tokens.refresh);
      } else {
        console.error('No refresh token received in login response');
        throw new Error('No refresh token received');
      }
      
      // Make a call to verify the token works correctly
      try {
        await apiClient.get('/api/auth/me/');
        console.log('Successfully verified token with /me endpoint');
      } catch (verifyErr) {
        console.error('Token verification failed:', verifyErr);
        // Continue anyway since we have valid tokens
      }
      
      // Return in the format expected by the app
      return {
        access: tokens.access,
        refresh: tokens.refresh,
        user
      };
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    try {
      // Use the actual backend response structure
      const backendResponse = await apiClient.post<BackendAuthResponse>('/api/auth/register/', credentials);
      console.log('Register response received:', backendResponse);
      
      // Extract tokens and user from the response
      const { tokens, user } = backendResponse;
      
      if (tokens && tokens.access) {
        localStorage.setItem('access_token', tokens.access);
      } else {
        console.error('No access token received in register response');
      }
      
      if (tokens && tokens.refresh) {
        localStorage.setItem('refresh_token', tokens.refresh);
      } else {
        console.error('No refresh token received in register response');
      }
      
      // Return in the format expected by the app
      return {
        access: tokens.access,
        refresh: tokens.refresh,
        user
      };
    } catch (error) {
      console.error('Register error:', error);
      throw error;
    }
  },

  async logout(): Promise<void> {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        await apiClient.post('/api/auth/logout/', {
          refresh: refreshToken,
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Always clear tokens
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    }
  },

  async getCurrentUser(): Promise<User> {
    try {
      console.log('Fetching current user data');
      return apiClient.get<User>('/api/auth/me/');
    } catch (error) {
      console.error('Error getting current user:', error);
      throw error;
    }
  },

  async refreshToken(): Promise<{ access: string }> {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) {
      console.error('No refresh token found in localStorage');
      throw new Error('No refresh token available');
    }

    try {
      console.log('Attempting to refresh token with refresh token');
      
      // Use direct fetch to avoid potential interceptor issues
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/auth/token/refresh/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh: refreshToken }),
        credentials: 'include', // Include cookies
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Token refresh failed: ${response.status}`, errorText);
        throw new Error(`Token refresh failed: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Token refresh successful:', data);
      
      if (data.access) {
        localStorage.setItem('access_token', data.access);
        return data;
      } else {
        console.error('No access token in refresh response');
        throw new Error('No access token in refresh response');
      }
    } catch (error) {
      console.error('Error refreshing token:', error);
      throw error;
    }
  },

  // Token management
  getAccessToken(): string | null {
    return localStorage.getItem('access_token');
  },

  getRefreshToken(): string | null {
    return localStorage.getItem('refresh_token');
  },

  isAuthenticated(): boolean {
    const token = this.getAccessToken();
    console.log('Checking if authenticated:', { hasToken: !!token });
    return !!token;
  },

  clearTokens(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  },
};
