import React, { createContext, useState, useContext, useEffect } from 'react';
import { storage } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Load auth data on app start
  useEffect(() => {
    loadAuthData();
  }, []);

  const loadAuthData = async () => {
    try {
      setIsLoading(true);
      const authData = await storage.getAuthData();
      
      if (authData.token && authData.userData) {
        setToken(authData.token);
        setUser(authData.userData);
        setIsAuthenticated(true);
      } else {
        setToken(null);
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Error loading auth data:', error);
      setToken(null);
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (token, userData) => {
    try {
      console.log('🔐 AuthContext: Saving auth data...', { hasToken: !!token, user: userData?.name });
      await storage.saveAuthData(token, userData);
      
      // Verify the token was saved
      const savedData = await storage.getAuthData();
      console.log('✅ AuthContext: Auth data saved and verified', { hasToken: !!savedData.token });
      
      setToken(token);
      setUser(userData);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Error saving auth data:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await storage.clearAuthData();
      setToken(null);
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Error clearing auth data:', error);
      throw error;
    }
  };

  const updateUser = async (userData) => {
    try {
      if (token) {
        await storage.saveAuthData(token, userData);
        setUser(userData);
      }
    } catch (error) {
      console.error('Error updating user data:', error);
      throw error;
    }
  };

  const value = {
    user,
    token,
    isLoading,
    isAuthenticated,
    login,
    logout,
    updateUser,
    loadAuthData,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
