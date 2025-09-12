import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Dimensions,
  TouchableOpacity,
  Linking,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  ActivityIndicator,
  TextInput,
  Badge,
  IconButton,
} from 'react-native-paper';
import { MotiView, AnimatePresence } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';

import { authAPI, userAPI, alertAPI } from '../services/api';
import notificationService from '../services/notifications';
import { useAuth } from '../context/AuthContext';
import locationService from '../services/location';

const { width, height } = Dimensions.get('window');

const MotherDashboard = ({ navigation }) => {
  const { user: authUser, logout } = useAuth();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [pairingCode, setPairingCode] = useState('');
  const [pairingLoading, setPairingLoading] = useState(false);
  const [showPairingForm, setShowPairingForm] = useState(false);
  const [pairedUser, setPairedUser] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [alertsLoading, setAlertsLoading] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState(false);
  const [childLocation, setChildLocation] = useState(null);
  const [locationUpdateTrigger, setLocationUpdateTrigger] = useState(0);
  const [isRefreshingLocation, setIsRefreshingLocation] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const notificationListener = useRef();
  const responseListener = useRef();
  const locationPollingRef = useRef();

  useEffect(() => {
    loadUserProfile();
    setupNotifications();
    
    // Cleanup notification listeners on unmount
    return () => {
      if (notificationListener.current) {
        notificationService.removeNotificationListener(notificationListener.current);
      }
      if (responseListener.current) {
        notificationService.removeNotificationListener(responseListener.current);
      }
    };
  }, []);

  // Start location polling when user is paired
  useEffect(() => {
    if (user?.isPaired && pairedUser) {
      startLocationPolling();
    }
    
    return () => {
      if (locationPollingRef.current) {
        clearInterval(locationPollingRef.current);
      }
    };
  }, [user?.isPaired, pairedUser]);

  const setupNotifications = async () => {
    try {
      // Register for push notifications
      const token = await notificationService.registerForPushNotifications();
      console.log('Push token:', token);

      // Register token with backend
      if (token) {
        const registered = await notificationService.registerTokenWithBackend();
        if (registered) {
          console.log('Push token successfully registered with backend');
        } else {
          console.log('Failed to register push token with backend');
        }
      }

      // Check notification permissions
      const permissions = await notificationService.getNotificationPermissions();
      setNotificationPermission(permissions.status === 'granted');

      // Listen for incoming notifications
      notificationListener.current = notificationService.addNotificationListener((notification) => {
        console.log('Notification received:', notification);
        // Refresh alerts when notification is received
        if (user?.isPaired) {
          loadAlerts();
        }
      });

      // Listen for notification responses
      responseListener.current = notificationService.addNotificationResponseListener((response) => {
        console.log('Notification response:', response);
        // Handle notification response if needed
      });

    } catch (error) {
      console.error('Error setting up notifications:', error);
    }
  };

  const loadUserProfile = async () => {
    try {
      const userData = authUser;
      if (userData) {
        setUser(userData);
        
        // Load paired user info if user is paired
        if (userData.isPaired) {
          await loadPairedUserInfo();
        }
        
        // Load alerts and location if user is paired
        if (userData.isPaired) {
          // Clear any old location data first to avoid showing stale data
          console.log('🧹 Clearing old location data on login...');
          setChildLocation(null);
          setIsInitialLoad(true); // Show loading state
          
          // Wait for paired user to be loaded, then load location
          setTimeout(async () => {
            if (pairedUser) {
              console.log('🔄 Loading fresh child location on login...');
              await loadChildLocation();
              setIsInitialLoad(false); // Hide loading state after location loads
              
              // Wait a moment for location to be set, then load alerts
              setTimeout(async () => {
                console.log('🔄 Loading alerts after location is set...');
                await loadAlerts();
              }, 500);
            } else {
              console.log('⚠️ Paired user not available yet, loading alerts first...');
              await loadAlerts();
              setIsInitialLoad(false); // Hide loading state
            }
          }, 100);
          
          // Load location again after 2 seconds to catch any recent updates
          setTimeout(async () => {
            console.log('🔄 Delayed location load triggered');
            await loadChildLocation();
          }, 2000);
          // Load location again after 5 seconds for additional updates
          setTimeout(async () => {
            console.log('🔄 Additional location load triggered');
            await loadChildLocation();
          }, 5000);
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      Alert.alert('Error', 'Failed to load user profile');
    } finally {
      setLoading(false);
    }
  };

  const loadPairedUserInfo = async () => {
    try {
      const response = await userAPI.getPairedUser();
      if (response.success) {
        setPairedUser(response.data.pairedUser);
        console.log('Paired user loaded:', response.data.pairedUser);
      }
    } catch (error) {
      console.error('Error loading paired user:', error);
    }
  };

  const loadAlerts = async () => {
    setAlertsLoading(true);
    try {
      const response = await alertAPI.getPairedAlerts();
      if (response.success) {
        setAlerts(response.data.alerts);
        
        // Get the most recent alert with location
        const recentAlertWithLocation = response.data.alerts
          .filter(alert => alert.latitude && alert.longitude)
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
        
        if (recentAlertWithLocation) {
          // Only use alert location if we don't already have a more recent location
          const alertTime = new Date(recentAlertWithLocation.createdAt);
          const currentLocationTime = childLocation ? new Date(childLocation.timestamp) : null;
          
          console.log('🔍 Alert location timestamp:', recentAlertWithLocation.createdAt);
          console.log('🔍 Current location timestamp:', currentLocationTime ? currentLocationTime.toISOString() : 'None');
          
          if (!currentLocationTime || alertTime > currentLocationTime) {
            console.log('✅ Using location from alerts as it is more recent');
            
            // If we don't have an address, try to get one from coordinates
            let address = recentAlertWithLocation.address;
            if (!address && recentAlertWithLocation.latitude && recentAlertWithLocation.longitude) {
              try {
                address = await getSimpleAddress(recentAlertWithLocation.latitude, recentAlertWithLocation.longitude);
              } catch (error) {
                console.log('Could not get address from alert coordinates:', error.message);
              }
            }
            
            setChildLocation({
              latitude: recentAlertWithLocation.latitude,
              longitude: recentAlertWithLocation.longitude,
              address: address,
              timestamp: recentAlertWithLocation.createdAt,
              accuracy: recentAlertWithLocation.accuracy,
            });
            // Trigger UI update
            setLocationUpdateTrigger(prev => prev + 1);
          } else {
            console.log('✅ Keeping current location as it is more recent than alert location');
          }
        }
      }
    } catch (error) {
      console.error('Error loading alerts:', error);
    } finally {
      setAlertsLoading(false);
    }
  };

  // Start polling for child location updates
  const startLocationPolling = () => {
    if (locationPollingRef.current) {
      clearInterval(locationPollingRef.current);
    }
    
    // Poll for child location every 15 seconds for more frequent updates
    locationPollingRef.current = setInterval(async () => {
      if (pairedUser) {
        console.log('🔄 Automatic location poll triggered');
        await loadChildLocation();
      }
    }, 15000);
    
    console.log('Location polling started for child:', pairedUser?.name);
  };

  const loadChildLocation = async () => {
    try {
      if (!pairedUser) {
        console.log('No paired user available for location loading');
        return;
      }

      console.log('🔄 Loading fresh location for child:', pairedUser.id);
      
      // Use the dedicated location API to get latest child location
      const { locationAPI } = await import('../services/api');
      const response = await locationAPI.getLatestByChildId(pairedUser.id);
      
      console.log('📍 Location API response:', response);
      
      if (response.success && response.data && response.data.location) {
        const location = response.data.location;
        const locationTime = new Date(location.createdAt);
        const now = new Date();
        const timeDiff = Math.floor((now - locationTime) / (1000 * 60)); // minutes ago
        
        console.log('📍 Location timestamp:', location.createdAt);
        console.log('📍 Location age:', timeDiff, 'minutes ago');
        
        // Only show location data that's reasonably recent (less than 2 hours old)
        if (timeDiff > 120) { // 2 hours = 120 minutes
          console.log('⚠️ Location data is too old (' + timeDiff + ' minutes), not showing to user');
          return;
        }
        
        // If we don't have an address, try to get one from coordinates
        let address = location.address;
        if (!address && location.latitude && location.longitude) {
          try {
            address = await getSimpleAddress(location.latitude, location.longitude);
          } catch (error) {
            console.log('Could not get address from coordinates:', error.message);
          }
        }
        
        setChildLocation({
          latitude: location.latitude,
          longitude: location.longitude,
          address: address,
          timestamp: location.createdAt,
          accuracy: location.accuracy,
        });
        // Trigger UI update
        setLocationUpdateTrigger(prev => prev + 1);
        console.log('✅ Child location updated successfully:', {
          address: address,
          timestamp: location.createdAt,
          age: timeDiff + ' minutes ago'
        });
      } else {
        console.log('❌ No location data available for child');
        // Don't clear existing location, just log the issue
      }
    } catch (error) {
      console.error('❌ Error loading child location:', error);
      
      // Handle rate limiting specifically
      if (error.response?.status === 429) {
        console.log('Rate limited - will retry later');
        return; // Don't fallback to alerts for rate limiting
      }
      
      // For other errors, fallback to alerts
      await loadAlerts();
    }
  };

  const handlePairing = async () => {
    if (!pairingCode.trim()) {
      Alert.alert('Error', 'Please enter a pairing code');
      return;
    }

    setPairingLoading(true);
    try {
      const response = await userAPI.pairWithUser(pairingCode.trim());
      if (response.success) {
        Alert.alert('Success', 'Successfully paired with your child!');
        setShowPairingForm(false);
        setPairingCode('');
        
        // Refresh user profile and load paired user info
        await loadUserProfile();
      } else {
        Alert.alert('Error', response.message || 'Failed to pair with child');
      }
    } catch (error) {
      console.error('Error pairing with child:', error);
      Alert.alert('Error', 'Failed to pair with child. Please check the code and try again.');
    } finally {
      setPairingLoading(false);
    }
  };

  const handleUnpair = async () => {
    Alert.alert(
      'Disconnect from Child',
      'Are you sure you want to disconnect from your child? This will stop all alerts and location updates.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await userAPI.unpairUser();
              if (response.success) {
                Alert.alert('Success', 'Disconnected from your child');
                setPairedUser(null);
                setAlerts([]);
                setChildLocation(null);
                
                // Refresh user profile
                await loadUserProfile();
              } else {
                Alert.alert('Error', response.message || 'Failed to disconnect from child');
              }
            } catch (error) {
              console.error('Error unpairing from child:', error);
              Alert.alert('Error', 'Failed to disconnect from child');
            }
          }
        }
      ]
    );
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            setLogoutLoading(true);
            try {
              // Reset initial load state for next login
              setIsInitialLoad(true);
              await logout();
              navigation.reset({
                index: 0,
                routes: [{ name: 'Welcome' }],
              });
            } catch (error) {
              console.error('Error during logout:', error);
              setLogoutLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleViewMap = () => {
    if (!pairedUser) {
      Alert.alert('No Child Connected', 'You need to be connected with your child to view their location on the map.');
      return;
    }
    navigation.navigate('MapScreen', { childId: pairedUser.id });
  };

  const handleViewAlerts = () => {
    navigation.navigate('Notifications');
  };

  const handleViewProfile = () => {
    navigation.navigate('Profile');
  };

  const handleEmergencyContact = () => {
    // This would typically open emergency contacts or call emergency services
    Alert.alert('Emergency Contact', 'This feature will be available soon.');
  };

  const handleAcknowledgeAlert = async (alertId) => {
    try {
      const response = await alertAPI.acknowledgeAlert(alertId);
      if (response.success) {
        // Refresh alerts to update the UI
        await loadAlerts();
        Alert.alert('Success', 'Alert acknowledged successfully');
      } else {
        Alert.alert('Error', response.message || 'Failed to acknowledge alert');
      }
    } catch (error) {
      console.error('Error acknowledging alert:', error);
      Alert.alert('Error', 'Failed to acknowledge alert');
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return 'Unknown';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hours ago`;
    return `${Math.floor(diffInMinutes / 1440)} days ago`;
  };

  const formatLocation = (location) => {
    if (!location) return 'Unknown';
    
    // If we have an address, use it
    if (location.address && location.address.trim()) {
      return location.address;
    }
    
    // If we have coordinates, show a loading message while we get the address
    if (location.latitude && location.longitude) {
      return 'Getting address...';
    }
    
    return 'Unknown';
  };

  const getLocationDescription = (location) => {
    if (!location) return 'Location not available';
    
    const formattedLocation = formatLocation(location);
    const timeAgo = formatTime(location.timestamp);
    
    return `${formattedLocation} (${timeAgo})`;
  };

  const getSimpleAddress = async (latitude, longitude) => {
    try {
      // Use the same reverse geocoding as check-in functionality
      const { Location } = require('expo-location');
      const reverseGeocode = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      if (reverseGeocode.length > 0) {
        const address = reverseGeocode[0];
        const parts = [];
        
        // Get the first line of address (street, city, region, country)
        if (address.street) parts.push(address.street);
        if (address.city) parts.push(address.city);
        if (address.region) parts.push(address.region);
        if (address.country) parts.push(address.country);
        
        return parts.join(', ');
      }
      
      // Fallback to coordinates if reverse geocoding fails
      const lat = latitude.toFixed(4);
      const lng = longitude.toFixed(4);
      const latDir = latitude >= 0 ? 'N' : 'S';
      const lngDir = longitude >= 0 ? 'E' : 'W';
      
      return `${Math.abs(lat)}°${latDir}, ${Math.abs(lng)}°${lngDir}`;
    } catch (error) {
      console.log('Reverse geocoding failed:', error.message);
      
      // Fallback to coordinates
      const lat = latitude.toFixed(4);
      const lng = longitude.toFixed(4);
      const latDir = latitude >= 0 ? 'N' : 'S';
      const lngDir = longitude >= 0 ? 'E' : 'W';
      
      return `${Math.abs(lat)}°${latDir}, ${Math.abs(lng)}°${lngDir}`;
    }
  };

  const getLastSeenTime = (user) => {
    if (!user || !user.lastLogin) {
      return 'Unknown';
    }
    
    const lastSeen = new Date(user.lastLogin);
    const now = new Date();
    const diffMs = now - lastSeen;
    const diffMinutes = Math.floor(diffMs / 60000);
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`;
    return `${Math.floor(diffMinutes / 1440)}d ago`;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          style={styles.loadingGradient}
        >
          <MotiView
            from={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', damping: 15, stiffness: 100 }}
          >
            <ActivityIndicator size="large" color="#ffffff" />
            <Text style={styles.loadingText}>Loading your dashboard...</Text>
          </MotiView>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header with Gradient Background */}
      <LinearGradient
        colors={user?.isPaired ? ['#43e97b', '#38f9d7'] : ['#667eea', '#764ba2']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <MotiView
            from={{ opacity: 0, translateY: -20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'spring', damping: 15, stiffness: 100 }}
          >
            <Text style={styles.headerTitle}>MummyHelp</Text>
            <Text style={styles.headerSubtitle}>Parent Dashboard</Text>
          </MotiView>
        </View>
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          disabled={logoutLoading}
        >
          {logoutLoading ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Text style={styles.logoutButtonText}>Logout</Text>
          )}
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Welcome Card with Animation */}
        <MotiView
          from={{ opacity: 0, translateY: 30 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'spring', damping: 15, stiffness: 100, delay: 200 }}
        >
          <Card style={styles.welcomeCard}>
            <Card.Content>
              <View style={styles.welcomeHeader}>
                <Text style={styles.welcomeIcon}>👋</Text>
                <View style={styles.welcomeTextContainer}>
                  <Title style={styles.welcomeTitle}>
                    Welcome back, {user?.name}!
                  </Title>
                  <Paragraph style={styles.welcomeText}>
                    {user?.isPaired 
                      ? 'You are connected with your child and ready to receive alerts.'
                      : 'Connect with your child to start receiving emergency alerts and location updates.'
                    }
                  </Paragraph>
                </View>
              </View>
              {!notificationPermission && (
                <View style={styles.notificationWarning}>
                  <Text style={styles.warningIcon}>⚠️</Text>
                  <Text style={styles.warningText}>
                    Enable notifications to receive instant alerts from your child.
                  </Text>
                </View>
              )}
            </Card.Content>
          </Card>
        </MotiView>


        {/* Connection Status Card */}
        <MotiView
          from={{ opacity: 0, translateY: 30 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'spring', damping: 15, stiffness: 100, delay: 400 }}
        >
          <Card style={styles.statusCard}>
            <Card.Content>
              <View style={styles.statusHeader}>
                <View style={styles.statusIndicator}>
                  <Text style={styles.statusIcon}>
                    {user?.isPaired ? '🟢' : '🔴'}
                  </Text>
                  <Title style={styles.statusTitle}>
                    {user?.isPaired ? 'Connected' : 'Not Connected'}
                  </Title>
                </View>
                <Text style={styles.statusSubtitle}>
                  {user?.isPaired 
                    ? 'Your child is paired and sharing location'
                    : 'Pair with your child to get started'
                  }
                </Text>
              </View>
              
              {!user?.isPaired ? (
                <Button
                  mode="contained"
                  onPress={() => setShowPairingForm(true)}
                  style={styles.connectButton}
                  labelStyle={styles.connectButtonLabel}
                >
                  Connect with Child
                </Button>
              ) : (
                <Button
                  mode="outlined"
                  onPress={handleUnpair}
                  style={styles.disconnectButton}
                  labelStyle={styles.disconnectButtonLabel}
                >
                  Disconnect
                </Button>
              )}
            </Card.Content>
          </Card>
        </MotiView>

        {/* Pairing Form */}
        <AnimatePresence>
          {showPairingForm && (
            <MotiView
              from={{ opacity: 0, scale: 0.9, translateY: 20 }}
              animate={{ opacity: 1, scale: 1, translateY: 0 }}
              exit={{ opacity: 0, scale: 0.9, translateY: 20 }}
              transition={{ type: 'spring', damping: 15, stiffness: 100 }}
            >
              <Card style={styles.pairingFormCard}>
                <Card.Content>
                  <Title style={styles.pairingFormTitle}>Connect with Your Child</Title>
                  <Paragraph style={styles.pairingInstructions}>
                    Follow these steps to connect with your child:
                  </Paragraph>
                  
                  <View style={styles.stepsContainer}>
                    {[
                      { number: 1, text: 'Ask your child to open their MummyHelp app' },
                      { number: 2, text: 'They will see a 6-digit pairing code on their screen' },
                      { number: 3, text: 'Enter that code below' }
                    ].map((step, index) => (
                      <MotiView
                        key={step.number}
                        from={{ opacity: 0, translateX: -20 }}
                        animate={{ opacity: 1, translateX: 0 }}
                        transition={{ type: 'spring', damping: 15, stiffness: 100, delay: index * 200 }}
                        style={styles.step}
                      >
                        <View style={styles.stepNumber}>
                          <Text style={styles.stepNumberText}>{step.number}</Text>
                        </View>
                        <Text style={styles.stepText}>{step.text}</Text>
                      </MotiView>
                    ))}
                  </View>

                  <TextInput
                    label="Enter Pairing Code"
                    value={pairingCode}
                    onChangeText={setPairingCode}
                    mode="outlined"
                    style={styles.pairingInput}
                    keyboardType="numeric"
                    maxLength={6}
                    placeholder="123456"
                  />

                  <View style={styles.pairingButtons}>
                    <Button
                      mode="outlined"
                      onPress={() => {
                        setShowPairingForm(false);
                        setPairingCode('');
                      }}
                      style={styles.cancelButton}
                    >
                      Cancel
                    </Button>
                    <Button
                      mode="contained"
                      onPress={handlePairing}
                      loading={pairingLoading}
                      disabled={pairingLoading || !pairingCode.trim()}
                      style={styles.confirmButton}
                    >
                      Connect
                    </Button>
                  </View>
                </Card.Content>
              </Card>
            </MotiView>
          )}
        </AnimatePresence>

        {/* Connected Child Info */}
        {user?.isPaired && pairedUser && (
          <MotiView
            from={{ opacity: 0, translateY: 30 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'spring', damping: 15, stiffness: 100, delay: 600 }}
          >
            <Card style={styles.childInfoCard}>
              <Card.Content>
                <View style={styles.childInfoHeader}>
                  <Text style={styles.childInfoIcon}>👶</Text>
                  <Title style={styles.childInfoTitle}>Connected Child</Title>
                </View>
                
                <View style={styles.childInfo}>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Name:</Text>
                    <Text style={styles.infoValue}>{pairedUser.name}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Status:</Text>
                    <Text style={styles.infoValue}>🟢 Online</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Last Seen:</Text>
                    <Text style={styles.infoValue}>{getLastSeenTime(pairedUser)}</Text>
                  </View>
                  
                  {isInitialLoad ? (
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Last Location:</Text>
                      <View style={styles.loadingContainer}>
                        <ActivityIndicator size="small" color="#3498db" />
                        <Text style={[styles.infoValue, { color: '#95a5a6', fontStyle: 'italic', marginLeft: 8 }]}>
                          Loading fresh location...
                        </Text>
                      </View>
                    </View>
                  ) : childLocation ? (
                    <>
                      <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Last Location:</Text>
                        <Text style={styles.infoValue}>
                          {formatLocation(childLocation)}
                        </Text>
                      </View>
                      <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Location Time:</Text>
                        <Text style={styles.infoValue}>{formatTime(childLocation.timestamp)}</Text>
                      </View>
                      <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Accuracy:</Text>
                        <Text style={styles.infoValue}>
                          {childLocation.accuracy ? `${Math.round(childLocation.accuracy)}m` : 'Unknown'}
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={[styles.refreshLocationButton, isRefreshingLocation && styles.refreshLocationButtonDisabled]}
                        onPress={async () => {
                          if (isRefreshingLocation) return;
                          
                          console.log('Manual location refresh requested');
                          setIsRefreshingLocation(true);
                          try {
                            // Force refresh by clearing current location first
                            setChildLocation(null);
                            // Then load fresh location
                            await loadChildLocation();
                            console.log('Manual location refresh completed');
                          } catch (error) {
                            console.error('Manual refresh failed:', error);
                          } finally {
                            setIsRefreshingLocation(false);
                          }
                        }}
                        disabled={isRefreshingLocation}
                      >
                        <Text style={styles.refreshLocationButtonText}>
                          {isRefreshingLocation ? '🔄 Refreshing...' : '🔄 Refresh Location'}
                        </Text>
                      </TouchableOpacity>
                    </>
                  ) : (
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Last Location:</Text>
                      <Text style={[styles.infoValue, { color: '#95a5a6', fontStyle: 'italic' }]}>
                        No location data available
                      </Text>
                    </View>
                  )}
                </View>
              </Card.Content>
            </Card>
          </MotiView>
        )}

        {/* Quick Actions Grid */}
        <MotiView
          from={{ opacity: 0, translateY: 30 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'spring', damping: 15, stiffness: 100, delay: 800 }}
        >
          <Card style={styles.actionsCard}>
            <Card.Content>
              <Title style={styles.actionsTitle}>Quick Actions</Title>
              <View style={styles.actionsGrid}>
                {[
                  { icon: '🗺️', title: 'View Map', action: handleViewMap, color: ['#4facfe', '#00f2fe'] },
                  { icon: '🔔', title: 'Alerts', action: handleViewAlerts, color: ['#f093fb', '#f5576c'] },
                  { icon: '👤', title: 'Profile', action: handleViewProfile, color: ['#43e97b', '#38f9d7'] },
                  { icon: '🚨', title: 'Emergency', action: handleEmergencyContact, color: ['#fa709a', '#fee140'] }
                ].map((action, index) => (
                  <MotiView
                    key={action.title}
                    from={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: 'spring', damping: 15, stiffness: 100, delay: 1000 + index * 100 }}
                  >
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={action.action}
                    >
                      <LinearGradient
                        colors={action.color}
                        style={styles.actionButtonGradient}
                      >
                        <Text style={styles.actionIcon}>{action.icon}</Text>
                        <Text style={styles.actionText}>{action.title}</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </MotiView>
                ))}
              </View>
            </Card.Content>
          </Card>
        </MotiView>

        {/* Recent Alerts */}
        {user?.isPaired && (
          <MotiView
            from={{ opacity: 0, translateY: 30 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'spring', damping: 15, stiffness: 100, delay: 1000 }}
          >
            <Card style={styles.alertsCard}>
              <Card.Content>
                <View style={styles.alertsHeader}>
                  <Text style={styles.alertsIcon}>🚨</Text>
                  <Title style={styles.alertsTitle}>Recent Alerts</Title>
                </View>
                
                {alertsLoading ? (
                  <View style={styles.alertsLoading}>
                    <ActivityIndicator size="small" color="#667eea" />
                    <Text style={styles.alertsLoadingText}>Loading alerts...</Text>
                  </View>
                ) : alerts.length > 0 ? (
                  <View style={styles.alertsList}>
                    {alerts.slice(0, 3).map((alert, index) => (
                      <MotiView
                        key={alert.id}
                        from={{ opacity: 0, translateX: -20 }}
                        animate={{ opacity: 1, translateX: 0 }}
                        transition={{ type: 'spring', damping: 15, stiffness: 100, delay: 1200 + index * 100 }}
                        style={styles.alertItem}
                      >
                        <View style={styles.alertHeader}>
                          <View style={styles.alertType}>
                            <Text style={styles.alertIcon}>🚨</Text>
                            <Text style={styles.alertTypeText}>
                              {alert.type === 'emergency' ? 'Emergency' : 'Check-in'}
                            </Text>
                          </View>
                          <Badge
                            style={[
                              styles.alertStatus,
                              alert.status === 'active' ? styles.activeBadge : styles.acknowledgedBadge
                            ]}
                          >
                            {alert.status === 'active' ? 'Active' : 'Acknowledged'}
                          </Badge>
                        </View>
                        <Text style={styles.alertMessage}>{alert.message}</Text>
                        {alert.address && (
                          <Text style={styles.alertLocation}>📍 {alert.address}</Text>
                        )}
                        <View style={styles.alertFooter}>
                          <Text style={styles.alertTime}>{formatTime(alert.createdAt)}</Text>
                          {alert.status === 'active' && (
                            <Button
                              mode="outlined"
                              onPress={() => handleAcknowledgeAlert(alert.id)}
                              style={styles.acknowledgeButton}
                              compact
                            >
                              Acknowledge
                            </Button>
                          )}
                        </View>
                      </MotiView>
                    ))}
                  </View>
                ) : (
                  <View style={styles.noAlerts}>
                    <Text style={styles.noAlertsIcon}>✅</Text>
                    <Text style={styles.noAlertsText}>No recent alerts</Text>
                    <Text style={styles.noAlertsSubtext}>Your child is safe and sound!</Text>
                  </View>
                )}
              </Card.Content>
            </Card>
          </MotiView>
        )}

      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
  },
  loadingGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#ffffff',
    fontSize: 18,
    marginTop: 16,
    fontWeight: '600',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#ffffff90',
    fontWeight: '500',
  },
  logoutButton: {
    backgroundColor: '#ffffff20',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ffffff30',
  },
  logoutButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  welcomeCard: {
    marginBottom: 20,
    borderRadius: 16,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  welcomeHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  welcomeIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  welcomeTextContainer: {
    flex: 1,
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 8,
  },
  welcomeText: {
    fontSize: 15,
    color: '#666',
    lineHeight: 22,
  },
  notificationWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff3cd',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
  },
  warningIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  warningText: {
    fontSize: 13,
    color: '#856404',
    flex: 1,
    fontWeight: '500',
  },
  statusCard: {
    marginBottom: 20,
    borderRadius: 16,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  statusHeader: {
    marginBottom: 20,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  statusTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2c3e50',
  },
  statusSubtitle: {
    fontSize: 15,
    color: '#666',
    lineHeight: 22,
  },
  connectButton: {
    backgroundColor: '#667eea',
    borderRadius: 12,
    paddingVertical: 8,
  },
  connectButtonLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  disconnectButton: {
    borderColor: '#e74c3c',
    borderRadius: 12,
    paddingVertical: 8,
  },
  disconnectButtonLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#e74c3c',
  },
  pairingFormCard: {
    marginBottom: 20,
    borderRadius: 16,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  pairingFormTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 12,
  },
  pairingInstructions: {
    fontSize: 15,
    color: '#666',
    marginBottom: 20,
    lineHeight: 22,
  },
  stepsContainer: {
    marginBottom: 20,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  stepNumberText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  stepText: {
    fontSize: 15,
    color: '#2c3e50',
    flex: 1,
    lineHeight: 22,
  },
  pairingInput: {
    marginBottom: 20,
  },
  pairingButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    flex: 1,
    marginRight: 8,
    borderRadius: 12,
  },
  confirmButton: {
    flex: 1,
    marginLeft: 8,
    backgroundColor: '#667eea',
    borderRadius: 12,
  },
  childInfoCard: {
    marginBottom: 20,
    borderRadius: 16,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  childInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  childInfoIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  childInfoTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2c3e50',
  },
  childInfo: {
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: '#2c3e50',
    fontWeight: '600',
  },
  refreshLocationButton: {
    backgroundColor: '#667eea',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    alignSelf: 'center',
    marginTop: 16,
  },
  refreshLocationButtonDisabled: {
    backgroundColor: '#95a5a6',
    opacity: 0.7,
  },
  refreshLocationButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  actionsCard: {
    marginBottom: 20,
    borderRadius: 16,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  actionsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 20,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  actionButton: {
    width: (width - 60) / 2,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  actionButtonGradient: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
  },
  actionIcon: {
    fontSize: 32,
    marginBottom: 12,
  },
  actionText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '700',
    textAlign: 'center',
  },
  alertsCard: {
    marginBottom: 20,
    borderRadius: 16,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  alertsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  alertsIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  alertsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2c3e50',
  },
  alertsLoading: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  alertsLoadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  alertsList: {
    gap: 12,
  },
  alertItem: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#667eea',
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  alertType: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  alertIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  alertTypeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
  },
  alertStatus: {
    // Badge styling is handled by react-native-paper
  },
  activeBadge: {
    backgroundColor: '#e74c3c',
  },
  acknowledgedBadge: {
    backgroundColor: '#27ae60',
  },
  alertMessage: {
    fontSize: 15,
    color: '#2c3e50',
    marginBottom: 12,
    lineHeight: 22,
  },
  alertLocation: {
    fontSize: 13,
    color: '#3498db',
    marginBottom: 12,
    fontStyle: 'italic',
  },
  alertFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  alertTime: {
    fontSize: 13,
    color: '#666',
  },
  acknowledgeButton: {
    borderColor: '#667eea',
    borderRadius: 8,
  },
  noAlerts: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noAlertsIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  noAlertsText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
  },
  noAlertsSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});

export default MotherDashboard; 