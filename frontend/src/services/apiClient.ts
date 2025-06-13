import axios from 'axios';
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
console.log('API BASE URL:', API_BASE_URL);

// Flag to prevent multiple redirects to login
let isRedirectingToLogin = false;

class ApiClient {
  private client: AxiosInstance;  private refreshTokenPromise: Promise<any> | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      // Important: credentials must be included for cookies to work with JWT
      withCredentials: true,
      // Timeout settings
      timeout: 10000,
    });

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('access_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        console.error('Request interceptor error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor to handle token refresh
    this.client.interceptors.response.use(
      (response) => {
        return response;
      },
      async (error: AxiosError) => {
        const originalRequest: any = error.config;
        
        // If there's no config, we can't retry
        if (!originalRequest) {
          console.error('No config in error object, cannot retry request');
          return Promise.reject(error);
        }
        
        // Handle 401 Unauthorized errors for token refresh
        if (error.response?.status === 401 && !originalRequest._retry) {
          console.log('401 Unauthorized, attempting token refresh');
          originalRequest._retry = true;
          
          try {
            const accessToken = localStorage.getItem('access_token');
            const refreshToken = localStorage.getItem('refresh_token');
            
            console.log('Current tokens:', { 
              hasAccessToken: !!accessToken,
              hasRefreshToken: !!refreshToken,
              originalPath: originalRequest.url
            });
            
            // Check if we have a refresh token
            if (!refreshToken) {
              console.error('No refresh token available, redirecting to login');
              this.redirectToLogin();
              return Promise.reject(new Error('No refresh token available'));
            }
            
            // Use a singleton promise for token refresh to prevent multiple calls
            if (!this.refreshTokenPromise) {
              console.log('Creating new refresh token promise');
              this.refreshTokenPromise = this.refreshAccessToken(refreshToken);
            } else {
              console.log('Using existing refresh token promise');
            }
            
            const result = await this.refreshTokenPromise;
            this.refreshTokenPromise = null;
            
            if (result && result.access) {
              console.log('Token refresh successful, retrying original request');
              // Update auth header with new token
              originalRequest.headers.Authorization = `Bearer ${result.access}`;
              return this.client(originalRequest);
            } else {
              console.error('Token refresh failed - invalid response');
              this.redirectToLogin();
              return Promise.reject(new Error('Token refresh failed'));
            }
          } catch (refreshError) {
            console.error('Token refresh error:', refreshError);
            this.refreshTokenPromise = null;
            this.redirectToLogin();
            return Promise.reject(refreshError);
          }
        }
        
        return Promise.reject(error);
      }
    );
  }
  private async refreshAccessToken(refreshToken: string) {
    try {
      console.log('Making token refresh request');
      
      // Log token length to debug (not showing full token for security)
      console.log(`Refresh token length: ${refreshToken?.length}`);
      
      // Make explicit axios request to avoid interceptor loop
      const response = await axios.post(
        `${API_BASE_URL}/api/auth/token/refresh/`, 
        { refresh: refreshToken },
        { 
          headers: { 'Content-Type': 'application/json' },
          withCredentials: true,
          // Add timeout specifically for token refresh
          timeout: 5000
        }
      );
      
      console.log('Token refresh response status:', response.status);
      
      if (response.data && response.data.access) {
        console.log('Received new access token');
        localStorage.setItem('access_token', response.data.access);
        
        // Verify that token is stored correctly
        const storedToken = localStorage.getItem('access_token');
        if (storedToken !== response.data.access) {
          console.error('Token storage verification failed');
        } else {
          console.log('Token stored successfully');
        }
        
        return response.data;
      } else {
        console.error('Invalid response from refresh endpoint:', response.data);
        throw new Error('Invalid response from token refresh endpoint');
      }
    } catch (error) {
      console.error('Failed to refresh token:', error);
      // Clear tokens on failure
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      throw error;
    }
  }

  private redirectToLogin() {
    if (isRedirectingToLogin) return;
    
    isRedirectingToLogin = true;
    console.log('Redirecting to login page');
    
    // Clear tokens
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    
    // Redirect to login after a small delay to complete current operations
    setTimeout(() => {
      window.location.href = '/login';
      isRedirectingToLogin = false;
    }, 100);
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response: AxiosResponse<T> = await this.client.get(url, config);
      return response.data;
    } catch (error) {
      console.error(`GET request failed: ${url}`, error);
      throw error;
    }
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response: AxiosResponse<T> = await this.client.post(url, data, config);
      return response.data;
    } catch (error) {
      console.error(`POST request failed: ${url}`, error);
      throw error;
    }
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response: AxiosResponse<T> = await this.client.put(url, data, config);
      return response.data;
    } catch (error) {
      console.error(`PUT request failed: ${url}`, error);
      throw error;
    }
  }

  async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response: AxiosResponse<T> = await this.client.patch(url, data, config);
      return response.data;
    } catch (error) {
      console.error(`PATCH request failed: ${url}`, error);
      throw error;
    }
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response: AxiosResponse<T> = await this.client.delete(url, config);
      return response.data;
    } catch (error) {
      console.error(`DELETE request failed: ${url}`, error);
      throw error;
    }
  }
}

export const apiClient = new ApiClient();
