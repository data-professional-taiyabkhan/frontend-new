import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// API base URL - update this with your computer's IP address for phone testing
// For development on same machine, use localhost
// For phone testing, use your computer's IP address (e.g., 'http://192.168.1.123:3000/api')
// Using your computer's IP address for cross-device communication
const API_BASE_URL = 'https://mummyhelpbackend.onrender.com';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000, // Increased timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error getting auth token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    console.error('API Error Details:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.config?.url,
      method: error.config?.method,
      data: error.response?.data,
    });

    if (error.response?.status === 401) {
      // Token expired or invalid, clear storage
      try {
        await AsyncStorage.multiRemove(['authToken', 'userData']);
      } catch (storageError) {
        console.error('Error clearing storage:', storageError);
      }
    }
    return Promise.reject(error);
  }
);

// Authentication API methods
export const authAPI = {
  // Sign up a new user
  signup: async (userData) => {
    console.log('Attempting signup with:', { ...userData, password: '[HIDDEN]' });
    const response = await api.post('/auth/signup', userData);
    return response.data;
  },

  // Sign in existing user
  signin: async (credentials) => {
    console.log('Attempting signin with:', { ...credentials, password: '[HIDDEN]' });
    const response = await api.post('/auth/signin', credentials);
    return response.data;
  },

  // Get current user profile
  getProfile: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },
};

// User management API methods
export const userAPI = {
  // Get user profile
  getProfile: async () => {
    const response = await api.get('/users/profile');
    return response.data;
  },

  // Update user profile
  updateProfile: async (profileData) => {
    const response = await api.put('/users/profile', profileData);
    return response.data;
  },

  // Get pairing code (for children)
  getPairingCode: async () => {
    const response = await api.get('/users/pairing-code');
    return response.data;
  },

  // Pair with another user using pairing code
  pairWithUser: async (pairingCode) => {
    const response = await api.post('/users/pair', { pairingCode });
    return response.data;
  },

  // Unpair from current user
  unpairUser: async () => {
    const response = await api.delete('/users/unpair');
    return response.data;
  },

  // Get information about paired user
  getPairedUser: async () => {
    const response = await api.get('/users/paired-user');
    return response.data;
  },
};

// Alert API methods
export const alertAPI = {
  // Create a new alert
  createAlert: async (alertData) => {
    const response = await api.post('/alerts/create', alertData);
    return response.data;
  },

  // Create a new alert with location
  createAlertWithLocation: async (alertData, locationData) => {
    const alertWithLocation = {
      ...alertData,
      latitude: locationData?.latitude,
      longitude: locationData?.longitude,
      accuracy: locationData?.accuracy,
      address: locationData?.address,
    };
    const response = await api.post('/alerts/create', alertWithLocation);
    return response.data;
  },

  // Get current user's alerts
  getMyAlerts: async () => {
    const response = await api.get('/alerts/my-alerts');
    return response.data;
  },

  // Get alerts from paired user
  getPairedAlerts: async () => {
    const response = await api.get('/alerts/paired-alerts');
    return response.data;
  },

  // Acknowledge an alert
  acknowledgeAlert: async (alertId) => {
    const response = await api.put(`/alerts/${alertId}/acknowledge`);
    return response.data;
  },

  // Delete an alert
  deleteAlert: async (alertId) => {
    const response = await api.delete(`/alerts/${alertId}`);
    return response.data;
  },

  // Get all active alerts
  getActiveAlerts: async () => {
    const response = await api.get('/alerts/active');
    return response.data;
  },
};

// Storage methods
export const storage = {
  // Save auth data
  saveAuthData: async (token, userData) => {
    try {
      await AsyncStorage.multiSet([
        ['authToken', token],
        ['userData', JSON.stringify(userData)],
      ]);
    } catch (error) {
      console.error('Error saving auth data:', error);
      throw error;
    }
  },

  // Get auth data
  getAuthData: async () => {
    try {
      const [token, userData] = await AsyncStorage.multiGet([
        'authToken',
        'userData',
      ]);
      return {
        token: token[1],
        userData: userData[1] ? JSON.parse(userData[1]) : null,
      };
    } catch (error) {
      console.error('Error getting auth data:', error);
      return { token: null, userData: null };
    }
  },

  // Clear auth data
  clearAuthData: async () => {
    try {
      await AsyncStorage.multiRemove(['authToken', 'userData']);
    } catch (error) {
      console.error('Error clearing auth data:', error);
      throw error;
    }
  },
};

export default api; 