import { useState, useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';

/**
 * Custom hook to monitor network connectivity status
 * @returns {Object} Network status information
 */
export const useNetworkStatus = () => {
  const [isConnected, setIsConnected] = useState(true);
  const [connectionType, setConnectionType] = useState('unknown');
  const [isInternetReachable, setIsInternetReachable] = useState(true);

  useEffect(() => {
    // Get initial network state
    const getInitialState = async () => {
      try {
        const state = await NetInfo.fetch();
        setIsConnected(state.isConnected);
        setConnectionType(state.type);
        setIsInternetReachable(state.isInternetReachable);
        console.log('🌐 Initial network state:', {
          isConnected: state.isConnected,
          type: state.type,
          isInternetReachable: state.isInternetReachable
        });
      } catch (error) {
        console.error('❌ Error fetching initial network state:', error);
        setIsConnected(false);
        setConnectionType('unknown');
        setIsInternetReachable(false);
      }
    };

    getInitialState();

    // Subscribe to network state changes
    const unsubscribe = NetInfo.addEventListener(state => {
      console.log('🌐 Network state changed:', {
        isConnected: state.isConnected,
        type: state.type,
        isInternetReachable: state.isInternetReachable
      });
      
      setIsConnected(state.isConnected);
      setConnectionType(state.type);
      setIsInternetReachable(state.isInternetReachable);
    });

    // Cleanup subscription on unmount
    return () => {
      unsubscribe();
    };
  }, []);

  // Determine overall online status
  const isOnline = isConnected && isInternetReachable;

  // Get status display information
  const getStatusInfo = () => {
    if (!isConnected) {
      return {
        text: '🔴 Offline',
        color: '#f44336',
        description: 'No network connection'
      };
    }
    
    if (!isInternetReachable) {
      return {
        text: '🟡 Limited',
        color: '#ff9800',
        description: 'Connected but no internet'
      };
    }

    switch (connectionType) {
      case 'wifi':
        return {
          text: '🟢 Online (WiFi)',
          color: '#4caf50',
          description: 'Connected via WiFi'
        };
      case 'cellular':
        return {
          text: '🟢 Online (Mobile)',
          color: '#4caf50',
          description: 'Connected via mobile data'
        };
      case 'ethernet':
        return {
          text: '🟢 Online (Ethernet)',
          color: '#4caf50',
          description: 'Connected via Ethernet'
        };
      default:
        return {
          text: '🟢 Online',
          color: '#4caf50',
          description: 'Connected'
        };
    }
  };

  return {
    isConnected,
    isInternetReachable,
    isOnline,
    connectionType,
    statusInfo: getStatusInfo()
  };
};

export default useNetworkStatus;
