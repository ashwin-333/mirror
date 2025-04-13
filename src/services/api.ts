import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// API configuration
// const API_URL = 'http://10.0.2.2:5002/api'; // For Android emulator
const API_URL = 'http://localhost:5002/api'; // For iOS simulator
// const API_URL = 'https://your-production-api.com/api'; // For production

// Token storage key
const TOKEN_KEY = '@auth_token';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor for authentication
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Authentication Service
export const authService = {
  // Register a new user
  async register(name: string, email: string, password: string) {
    try {
      console.log('API Service: Registering user...');
      const response = await api.post('/auth/register', {
        name,
        email,
        password,
      });
      
      console.log('API Service: Registration successful');
      if (response.data.token) {
        await AsyncStorage.setItem(TOKEN_KEY, response.data.token);
      }
      
      return response.data;
    } catch (error: any) {
      console.error('API Service: Registration error:', error.response?.data || error.message);
      throw error.response?.data || { message: error.message };
    }
  },
  
  // Login user
  async login(email: string, password: string) {
    try {
      console.log('API Service: Logging in user...');
      const response = await api.post('/auth/login', {
        email,
        password,
      });
      
      console.log('API Service: Login successful');
      if (response.data.token) {
        await AsyncStorage.setItem(TOKEN_KEY, response.data.token);
      }
      
      return response.data;
    } catch (error: any) {
      console.error('API Service: Login error:', error.response?.data || error.message);
      throw error.response?.data || { message: error.message };
    }
  },
  
  // Logout user
  async logout() {
    try {
      await AsyncStorage.removeItem(TOKEN_KEY);
      return true;
    } catch (error) {
      console.error('API Service: Logout error:', error);
      return false;
    }
  },
  
  // Get current user
  async getCurrentUser() {
    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      
      if (!token) {
        return null;
      }
      
      const response = await api.get('/auth/me');
      return response.data;
    } catch (error: any) {
      console.error('API Service: Get current user error:', error.response?.data || error.message);
      return null;
    }
  },
  
  // Check if user is authenticated
  async isAuthenticated() {
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    return !!token;
  }
};

export default api; 