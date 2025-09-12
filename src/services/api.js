import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// API base URL - update this with your computer's IP address for phone testing
// For development on same machine, use localhost
// For phone testing, use your computer's IP address (e.g., 'http://192.168.1.123:3000/api')
// For now, using your computer's IP address for iPhone testing
const API_BASE_URL = 'https://mummyhelpbackend.onrender.com/api';

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
      let token = await AsyncStorage.getItem('authToken');
      
      // If no token found, try a few more times with small delays
      // This helps with race conditions during login
      if (!token) {
        const maxRetries = config.url?.includes('unpair') ? 5 : 3; // More retries for unpair
        const retryDelay = config.url?.includes('unpair') ? 100 : 50; // Longer delay for unpair
        
        for (let i = 0; i < maxRetries; i++) {
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          token = await AsyncStorage.getItem('authToken');
          if (token) break;
        }
      }
      
      console.log('🔑 API Request interceptor - Token available:', !!token, 'for URL:', config.url);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      } else {
        console.log('⚠️ No auth token found for API request to:', config.url);
        // Let's check all AsyncStorage keys to see what's there
        const allKeys = await AsyncStorage.getAllKeys();
        console.log('📱 AsyncStorage keys:', allKeys);
        if (allKeys.includes('authToken')) {
          const tokenValue = await AsyncStorage.getItem('authToken');
          console.log('🔍 Token exists but is:', tokenValue);
        }
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
      // Only clear token for core auth endpoints, not for all 401 errors
      const shouldClearToken = [
        '/auth/signin',
        '/auth/signup', 
        '/users/profile',
        '/users/paired-user'
      ].some(endpoint => error.config?.url?.includes(endpoint));
      
      if (shouldClearToken) {
        console.log('🚨 Clearing token due to auth failure on core endpoint:', error.config?.url);
        try {
          await AsyncStorage.multiRemove(['authToken', 'userData']);
          // Navigate to sign in if we have navigation available
          // This should be handled by the app's auth state management
        } catch (storageError) {
          console.error('Error clearing storage:', storageError);
        }
      } else {
        console.log('⚠️ 401 error on non-core endpoint, keeping token:', error.config?.url);
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


  // Verify email
  verifyEmail: async (token) => {
    const response = await api.post('/auth/verify-email', { token });
    return response.data;
  },

  // Resend verification email
  resendVerification: async (email) => {
    const response = await api.post('/auth/resend-verification', { email });
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

  // Get information about paired user
  getPairedUser: async () => {
    const response = await api.get('/users/paired-user');
    return response.data;
  },

  // Unpair from current user
  unpairUser: async () => {
    console.log('🔓 Attempting to unpair user...');
    
    // Double-check token is available before making the request
    let token = await AsyncStorage.getItem('authToken');
    console.log('🔑 Token available for unpair request:', !!token);
    
    if (!token) {
      // Try to wait a bit more for token to be available
      console.log('⏳ Token not found, waiting and retrying...');
      await new Promise(resolve => setTimeout(resolve, 200));
      token = await AsyncStorage.getItem('authToken');
      console.log('🔑 Token available after retry:', !!token);
    }
    
    if (!token) {
      throw new Error('No authentication token available. Please sign in again.');
    }
    
    // Make the request with explicit header to ensure token is sent
    const response = await api.delete('/users/unpair', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  },
};

// Device token management API methods
export const deviceTokenAPI = {
  // Register a new device token
  register: async (platform, expoPushToken) => {
    const response = await api.post('/device-tokens', {
      platform,
      expoPushToken
    });
    return response.data;
  },

  // Get all device tokens for current user
  getAll: async () => {
    const response = await api.get('/device-tokens');
    return response.data;
  },

  // Delete a specific device token
  delete: async (tokenId) => {
    const response = await api.delete(`/device-tokens/${tokenId}`);
    return response.data;
  },

  // Delete all device tokens for current user
  deleteAll: async () => {
    const response = await api.delete('/device-tokens');
    return response.data;
  },
};

// Location management API methods
export const locationAPI = {
  // Create a new location entry
  create: async (locationData) => {
    const response = await api.post('/locations', locationData);
    return response.data;
  },

  // Get latest location for a specific child (by child ID)
  getLatestByChildId: async (childId) => {
    const response = await api.get(`/locations/latest/${childId}`);
    return response.data;
  },

  // Get all locations for current user
  getAll: async () => {
    const response = await api.get('/locations');
    return response.data;
  },

  // Get locations for a specific child (by child ID)
  getByChildId: async (childId) => {
    const response = await api.get(`/locations/child/${childId}`);
    return response.data;
  },

  // Delete a specific location
  delete: async (locationId) => {
    const response = await api.delete(`/locations/${locationId}`);
    return response.data;
  },

  // Create multiple location entries
  createBulk: async (locationsData) => {
    const response = await api.post('/locations/bulk', locationsData);
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

  // Cancel an alert
  cancelAlert: async (alertId) => {
    const response = await api.put(`/alerts/${alertId}/cancel`);
    return response.data;
  },
};

// Storage methods
export const storage = {
  // Save auth data
  saveAuthData: async (token, userData) => {
    try {
      console.log('💾 Storage: Saving auth data...', { hasToken: !!token, userName: userData?.name });
      await AsyncStorage.multiSet([
        ['authToken', token],
        ['userData', JSON.stringify(userData)],
      ]);
      
      // Verify it was saved
      const savedToken = await AsyncStorage.getItem('authToken');
      console.log('✅ Storage: Auth data saved and verified', { tokenSaved: !!savedToken });
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

  // Get user data only
  getUser: async () => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error getting user data:', error);
      return null;
    }
  },

  // Clear auth data
  clearAuthData: async () => {
    try {
      console.log('🗑️ Storage: Clearing auth data...');
      await AsyncStorage.multiRemove(['authToken', 'userData']);
      console.log('✅ Storage: Auth data cleared');
    } catch (error) {
      console.error('Error clearing auth data:', error);
      throw error;
    }
  },
};

// Voice enrollment and verification API methods
export const voiceAPI = {
  // Enroll user voice with audio samples
  enroll: async (formData) => {
    try {
      console.log('Starting voice enrollment...');
      
      const response = await api.post('/voice/enroll', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 60000, // 60 seconds for voice processing
      });
      
      console.log('Voice enrollment response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Voice enrollment error:', error);
      throw error;
    }
  },

  // Verify voice sample
  verify: async (audioBlob, deviceId = null) => {
    try {
      console.log('Starting voice verification...');
      
      const formData = new FormData();
      formData.append('audio', {
        uri: audioBlob,
        name: 'verification.wav',
        type: 'audio/wav',
      });
      
      if (deviceId) {
        formData.append('deviceId', deviceId);
      }
      
      const response = await api.post('/voice/verify', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000, // 30 seconds for verification
      });
      
      console.log('Voice verification response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Voice verification error:', error);
      throw error;
    }
  },

  // Get voice enrollment status
  getStatus: async () => {
    try {
      const response = await api.get('/voice/status');
      return response.data;
    } catch (error) {
      console.error('Voice status error:', error);
      throw error;
    }
  },

  // Remove voice enrollment
  removeEnrollment: async () => {
    try {
      const response = await api.delete('/voice/enrollment');
      return response.data;
    } catch (error) {
      console.error('Voice enrollment removal error:', error);
      throw error;
    }
  },

  // Check voice service health
  checkHealth: async () => {
    try {
      const response = await api.get('/voice/health');
      return response.data;
    } catch (error) {
      console.error('Voice health check error:', error);
      throw error;
    }
  },
};

export default api; 