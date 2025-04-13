import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { Platform, NativeModules } from 'react-native';
import Constants from 'expo-constants';

// Server port from environment variables or default to 5002
const SERVER_PORT = Constants.expoConfig?.extra?.serverPort || '5002';

// API endpoint path
const API_PATH = '/api';

// Developer's IP address from environment variables
const DEVELOPER_IP = Constants.expoConfig?.extra?.developerIp || '10.0.0.174';

// Function to check if running on iOS simulator
const isIOSSimulator = (): boolean => {
  if (Platform.OS !== 'ios') return false;
  
  // Check for simulator-specific properties
  return Platform.constants.systemName === 'iOS' && 
         (NativeModules.PlatformConstants?.interfaceIdiom === 'iPhone' || 
          NativeModules.PlatformConstants?.interfaceIdiom === 'iPad') && 
         !NativeModules.PlatformConstants?.forceTouchAvailable;
};

// Function to get the appropriate API URL based on platform and environment
const getApiUrl = async () => {
  // For development
  if (__DEV__) {
    // For iOS simulator
    if (isIOSSimulator()) {
      return `http://localhost:${SERVER_PORT}${API_PATH}`;
    }
    
    // For Android emulator
    if (Platform.OS === 'android' && !isRunningOnPhysicalDevice()) {
      return `http://10.0.2.2:${SERVER_PORT}${API_PATH}`;
    }

    // For physical devices, use the developer's IP from environment variables
    console.log(`Using developer IP address: ${DEVELOPER_IP}`);
    return `http://${DEVELOPER_IP}:${SERVER_PORT}${API_PATH}`;
  }

  // For production
  return Constants.expoConfig?.extra?.apiUrl || 'https://your-production-api.com/api';
};

// Helper function to detect if running on a physical device
const isRunningOnPhysicalDevice = (): boolean => {
  if (Platform.OS === 'ios') {
    return !isIOSSimulator();
  }
  
  // For Android, this is a simplistic check and might need refinement
  if (Platform.OS === 'android') {
    return !NativeModules.PlatformConstants?.usingHermesEngine;
  }
  
  return false;
};

// Token storage key
const TOKEN_KEY = '@auth_token';

// Create axios instance with placeholder, we'll update the baseURL later
const api = axios.create({
  baseURL: 'http://placeholder-will-be-replaced',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Initialize API configuration
const initializeApi = async () => {
  try {
    // Check network connectivity first
    const netInfo = await NetInfo.fetch();
    console.log('API Service: Network status:', JSON.stringify(netInfo));
    
    if (!netInfo.isConnected) {
      console.warn('API Service: No network connection detected');
    }
    
    const apiUrl = await getApiUrl();
    api.defaults.baseURL = apiUrl;
    console.log('API Service: API URL configured:', apiUrl);
    
    // Test the connection
    try {
      const healthResponse = await axios.get(`${apiUrl.replace('/api', '')}/health`, { timeout: 5000 });
      console.log('API Service: Health check successful:', healthResponse.status);
    } catch (healthError) {
      console.error('API Service: Health check failed:', healthError.message);
      // We don't throw here, just log the error as the server might come up later
    }
  } catch (error) {
    console.error('API Service: Failed to initialize API URL:', error);
  }
};

// Call initialization right away
initializeApi();

// Add a request interceptor for authentication
api.interceptors.request.use(
  async (config) => {
    // If baseURL is still the placeholder, try to update it
    if (config.baseURL === 'http://placeholder-will-be-replaced') {
      config.baseURL = await getApiUrl();
    }
    
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
      const apiUrl = await getApiUrl();
      
      // Make the actual login request to the backend
      const response = await fetch(`${apiUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Login failed');
      }
      
      const userData = await response.json();
      console.log('API Service: Login successful');
      
      // Store token in AsyncStorage
      if (userData.token) {
        await AsyncStorage.setItem(TOKEN_KEY, userData.token);
      }
      
      return userData;
    } catch (error: any) {
      console.error('API Service: Login error:', error.message);
      throw { message: error.message || 'Login failed' };
    }
  },
  
  // Logout user
  async logout() {
    try {
      await AsyncStorage.removeItem(TOKEN_KEY);
      // Also clear the profile image from AsyncStorage
      await AsyncStorage.removeItem('@profile_image');
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
      
      // Get the API URL
      const apiUrl = await getApiUrl();
      
      // Make request to get user data
      const response = await fetch(`${apiUrl}/auth/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to get user data');
      }
      
      const userData = await response.json();
      return userData;
    } catch (error: any) {
      console.error('API Service: Get current user error:', error.message);
      return null;
    }
  },
  
  // Check if user is authenticated
  async isAuthenticated() {
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    return !!token;
  },

  // Upload profile image
  async uploadProfileImage(imageUri: string) {
    try {
      console.log('API Service: Uploading profile image...');
      // Create form data for the image upload
      const formData = new FormData();
      
      // Get file name and extension from URI
      const uriParts = imageUri.split('/');
      let fileName = uriParts[uriParts.length - 1];
      
      // Sanitize filename to avoid special characters
      // Replace problematic characters with safe alternatives
      fileName = fileName.replace(/[=&?%+]/g, '_');
      
      // Get file type based on extension
      const fileType = fileName.split('.').pop()?.toLowerCase() || 'jpg';
      const mimeType = fileType === 'jpg' || fileType === 'jpeg' ? 'image/jpeg' : `image/${fileType}`;
      
      console.log('API Service: Sanitized image details:', { fileName, fileType, mimeType });
      
      // Create the file object
      const file = {
        uri: imageUri,
        name: fileName,
        type: mimeType,
      } as any;
      
      // Append the file to the form data
      formData.append('profileImage', file);
      
      // Send the request with Authorization header
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      
      if (!token) {
        throw new Error('Authentication required');
      }
      
      // Get the current API URL
      const apiUrl = await getApiUrl();
      console.log('API Service: Using API URL for upload:', apiUrl);
      
      const response = await fetch(`${apiUrl}/auth/profile-image`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
        body: formData,
      });
      
      const data = await response.json();
      console.log('API Service: Profile image upload response:', JSON.stringify(data));
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to upload profile image');
      }
      
      return data.profileImage;
    } catch (error: any) {
      console.error('API Service: Profile image upload error:', error.message);
      throw error;
    }
  }
};

export default api; 