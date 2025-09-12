import React, { useState, useEffect } from 'react';
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
  IconButton,
} from 'react-native-paper';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { authAPI, userAPI, alertAPI, voiceAPI } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../context/AuthContext';
import notificationService from '../services/notifications';
import locationService from '../services/location';
import voiceController from '../services/voiceController';
import { 
  startBackgroundLocation, 
  stopBackgroundLocation, 
  requestBackgroundLocationPermissions,
  isBackgroundLocationActive as checkBackgroundLocationActive
} from '../background/locationTask';
import ConfirmModal from '../components/ConfirmModal';

const { width, height } = Dimensions.get('window');

const ChildDashboard = ({ navigation }) => {
  const { user: authUser, logout, updateUser } = useAuth();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [pairingCode, setPairingCode] = useState('');
  const [pairingCodeLoading, setPairingCodeLoading] = useState(false);
  const [pairedUser, setPairedUser] = useState(null);
  const [alertLoading, setAlertLoading] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [locationPermission, setLocationPermission] = useState(false);
  const [isLocationTracking, setIsLocationTracking] = useState(false);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);
  const [voiceEnrollmentStatus, setVoiceEnrollmentStatus] = useState(false);
  const [isBackgroundLocationActive, setIsBackgroundLocationActive] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmModalData, setConfirmModalData] = useState(null);
  const [voiceStatus, setVoiceStatus] = useState('idle'); // 'idle', 'listening', 'processing', 'verifying'
  const [voicePermission, setVoicePermission] = useState(false);
  const [isWakePhraseActive, setIsWakePhraseActive] = useState(false);
  const [isInVoiceMode, setIsInVoiceMode] = useState(false);
  const [unpairLoading, setUnpairLoading] = useState(false);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log('🚀 Starting ChildDashboard initialization...');
        // Load user profile first (this validates the auth token)
        await loadUserProfile();
        console.log('✅ User profile loaded, starting authenticated services...');
        
        // Only start services that need authentication AFTER user is loaded
        await setupNotifications();
        await setupLocation();
        console.log('✅ ChildDashboard base initialization complete');
      } catch (error) {
        console.error('❌ Error during ChildDashboard initialization:', error);
      }
    };
    
    initializeApp();
  }, []);

  // Setup voice after user is loaded
  useEffect(() => {
    if (user) {
      console.log('👤 User loaded, starting voice setup for:', user.role);
      setupVoice().catch(error => {
        console.error('❌ Voice setup failed:', error);
      });
    }
  }, [user]);

  const setupNotifications = async () => {
    try {
      console.log('🔔 Setting up notifications...');
      
      // Verify auth token exists before making API calls
      const authToken = await AsyncStorage.getItem('authToken');
      if (!authToken) {
        console.log('❌ No auth token available for notification setup');
        return;
      }
      
      // Register for push notifications (for future use)
      const token = await notificationService.registerForPushNotifications();
      console.log('✅ Child push token obtained:', token ? 'YES' : 'NO');

      // Register token with backend
      if (token) {
        const registered = await notificationService.registerTokenWithBackend();
        if (registered) {
          console.log('✅ Child push token successfully registered with backend');
        } else {
          console.log('❌ Failed to register child push token with backend');
        }
      }
      
      console.log('✅ Notification setup completed');
    } catch (error) {
      console.error('❌ Error setting up notifications:', error);
    }
  };

  const setupLocation = async () => {
    try {
      console.log('📍 Setting up location services...');
      
      // Verify auth token exists before making API calls
      const authToken = await AsyncStorage.getItem('authToken');
      if (!authToken) {
        console.log('❌ No auth token available for location setup');
        return;
      }
      
      // Check location permissions
      const hasPermission = await locationService.checkLocationPermissions();
      setLocationPermission(hasPermission);
      console.log('📍 Location permission:', hasPermission ? 'GRANTED' : 'DENIED');

      if (hasPermission) {
        // Get initial location and send immediately
        const location = await locationService.getCurrentLocation();
        if (location) {
          setCurrentLocation(location);
          console.log('📍 Initial location obtained');
          // Send initial location to backend immediately
          await sendLocationToBackend(location);
          console.log('📍 Initial location sent to backend');
        } else {
          console.log('⚠️ Could not get initial location');
        }

        // Start automatic location tracking and sending
        await startAutomaticLocationSharing();
        
        // Send location one more time after a short delay to ensure parent gets it
        setTimeout(async () => {
          const currentLocation = await locationService.getCurrentLocation();
          if (currentLocation) {
            await sendLocationToBackend(currentLocation);
            console.log('📍 Additional location send for parent dashboard');
          }
        }, 5000); // Send again after 5 seconds

        // Check if background location is already active
        try {
          const backgroundActive = await checkBackgroundLocationActive();
          setIsBackgroundLocationActive(backgroundActive);
          console.log('✅ Background location status:', backgroundActive);
        } catch (bgError) {
          console.log('⚠️ Background location check failed (normal for Expo Go):', bgError.message);
          setIsBackgroundLocationActive(false);
        }
      }
      
      console.log('✅ Location setup completed');
    } catch (error) {
      console.error('❌ Error setting up location:', error);
    }
  };

  const setupVoice = async () => {
    try {
      console.log('🎤 Starting voice setup...');
      
      // Step 1: Check user role
      if (user?.role !== 'child') {
        console.log('❌ Voice features not available for non-child users');
        return;
      }
      console.log('✅ User role check passed');

      // Step 2: Check authentication
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        console.log('❌ No auth token available, skipping voice setup');
        return;
      }
      console.log('✅ Auth token found');

      // Step 3: Check Porcupine access key
      const porcupineKey = process.env.EXPO_PUBLIC_PORCUPINE_ACCESS_KEY;
      console.log('🔑 Porcupine access key available:', porcupineKey ? 'YES' : 'NO');
      if (!porcupineKey) {
        console.warn('⚠️ EXPO_PUBLIC_PORCUPINE_ACCESS_KEY not found in environment variables');
      }
      
      // Step 4: Setup audio permissions and mode
      console.log('🔊 Setting up audio permissions...');
      try {
        const { Audio } = await import('expo-av');
        const permission = await Audio.getPermissionsAsync();
        
        if (permission.status !== 'granted') {
          console.log('🔊 Audio permission not granted, requesting...');
          const newPermission = await Audio.requestPermissionsAsync();
          if (newPermission.status !== 'granted') {
            console.log('❌ Audio permission denied');
            setVoicePermission(false);
            return;
          }
        }
        
        // Configure audio mode for iOS recording
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
          staysActiveInBackground: true,
        });
        
        setVoicePermission(true);
        console.log('✅ Audio permissions and mode configured successfully');
      } catch (permError) {
        console.error('❌ Audio permission/mode setup failed:', permError);
        setVoicePermission(false);
        return;
      }
      
      // Step 5: Initialize voice controller
      console.log('🎛️ Initializing voice controller...');
      try {
        const success = await voiceController.initialize(user, {
          onConfirmModalShow: handleConfirmModalShow,
          onConfirmModalHide: handleConfirmModalHide,
          onAlertTriggered: handleVoiceAlert,
        });

        if (success) {
          console.log('✅ Voice controller initialized successfully');
          
          // Set up voice event listener
          const unsubscribe = voiceController.addListener(handleVoiceEvent);
          console.log('✅ Voice event listener added');
          
          // Step 6: Skip enrollment status check to avoid API errors
          console.log('🔍 Skipping voice enrollment status check (disabled for production)');
          setVoiceEnrollmentStatus(false);
          
          console.log('🎉 Voice setup completed successfully');
        } else {
          console.log('❌ Voice controller initialization failed');
        }
      } catch (controllerError) {
        console.error('❌ Voice controller initialization error:', controllerError);
      }
    } catch (error) {
      console.error('❌ Critical error in voice setup:', error);
    }
  };

  const startLocationTracking = async () => {
    try {
      const success = await locationService.startLocationTracking((location) => {
        setCurrentLocation(location);
        console.log('Location updated:', location);
      });

      if (success) {
        setIsLocationTracking(true);
        Alert.alert('Location Tracking', 'Location tracking has been started. Your parent will be able to see your location.');
      } else {
        Alert.alert('Error', 'Failed to start location tracking. Please check your location permissions.');
      }
    } catch (error) {
      console.error('Error starting location tracking:', error);
      Alert.alert('Error', 'Failed to start location tracking.');
    }
  };

  const stopLocationTracking = async () => {
    try {
      await locationService.stopLocationTracking();
      setIsLocationTracking(false);
      Alert.alert('Location Tracking', 'Location tracking has been stopped.');
    } catch (error) {
      console.error('Error stopping location tracking:', error);
    }
  };

  const requestLocationPermission = async () => {
    try {
      const granted = await locationService.requestLocationPermissions();
      setLocationPermission(granted);
      
      if (granted) {
        const location = await locationService.getCurrentLocation();
        if (location) {
          setCurrentLocation(location);
        }
        
        // Also request background location permission
        try {
          const backgroundGranted = await requestBackgroundLocationPermissions();
          console.log('Background location permission:', backgroundGranted);
        } catch (bgError) {
          console.log('Background location permission request failed (normal for Expo Go):', bgError.message);
        }
      }
    } catch (error) {
      console.error('Error requesting location permission:', error);
    }
  };

  const loadUserProfile = async () => {
    try {
      // Use auth context user data first
      if (authUser) {
        setUser(authUser);
        
        // If user is paired, get paired user info
        if (authUser.isPaired) {
          loadPairedUserInfo();
          // Start voice listening if paired and voice enrolled
          if (voiceEnrollmentStatus) {
            startVoiceListening();
          }
        } else {
          // If not paired, get pairing code
          loadPairingCode();
        }
      } else {
        // If no user in auth context, redirect to signin
        console.log('No user found in auth context');
        navigation.replace('Signin');
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
      }
    } catch (error) {
      console.error('Error loading paired user:', error);
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

  const loadPairingCode = async () => {
    setPairingCodeLoading(true);
    try {
      const response = await userAPI.getPairingCode();
      if (response.success) {
        setPairingCode(response.data.pairingCode);
      }
    } catch (error) {
      console.error('Error loading pairing code:', error);
      Alert.alert('Error', 'Failed to load pairing code');
    } finally {
      setPairingCodeLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            setLogoutLoading(true);
            try {
              await logout();
              await locationService.stopLocationTracking();
              await voiceController.stop();
              navigation.replace('Signin');
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert('Error', 'Failed to logout');
            } finally {
              setLogoutLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleEmergencyAlert = () => {
    Alert.alert(
      '🚨 Emergency Alert',
      'Are you sure you want to send an emergency alert to your parent?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Send Alert',
          style: 'destructive',
          onPress: async () => {
            setAlertLoading(true);
            try {
              // Get current location with address
              const locationWithAddress = await locationService.getCurrentLocationWithAddress();
              
              const response = await alertAPI.createAlertWithLocation(
                {
                  type: 'emergency',
                  message: 'Emergency alert from child',
                  location: locationWithAddress?.address || 'Current location'
                },
                locationWithAddress
              );
              
              if (response.success) {
                // Start background location tracking
                const backgroundStarted = await startBackgroundLocation();
                if (backgroundStarted) {
                  setIsBackgroundLocationActive(true);
                  console.log('Background location tracking started for emergency alert');
                }

                // Send local notification to confirm alert was sent
                await notificationService.sendLocalNotification(
                  '🚨 Emergency Alert Sent!',
                  'Your parent has been notified. Help is on the way! Background location tracking is now active.',
                  {
                    type: 'alert_sent',
                    alertType: 'emergency',
                    timestamp: new Date().toISOString(),
                  }
                );

                Alert.alert(
                  'Alert Sent! 🚨',
                  'Your parent has been notified. Help is on the way! Background location tracking is now active.',
                  [{ text: 'OK' }]
                );
              }
            } catch (error) {
              console.error('Emergency alert error:', error);
              const errorMessage = error.response?.data?.message || 'Failed to send emergency alert';
              Alert.alert('Error', errorMessage);
            } finally {
              setAlertLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleSoftAlert = () => {
    Alert.alert(
      '📍 Check-In',
      'Send a gentle check-in message to your parent?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Send',
          onPress: async () => {
            setAlertLoading(true);
            try {
              // Get current location with address
              const locationWithAddress = await locationService.getCurrentLocationWithAddress();
              
              const response = await alertAPI.createAlertWithLocation(
                {
                  type: 'check-in',
                  message: 'Just checking in to let you know I\'m safe',
                  location: locationWithAddress?.address || 'Current location'
                },
                locationWithAddress
              );
              
              if (response.success) {
                // Start background location tracking for check-in
                const backgroundStarted = await startBackgroundLocation();
                if (backgroundStarted) {
                  setIsBackgroundLocationActive(true);
                  console.log('Background location tracking started for check-in');
                }

                // Send local notification to confirm check-in was sent
                await notificationService.sendLocalNotification(
                  '📍 Check-In Sent!',
                  'Your parent has been notified that you\'re checking in.',
                  {
                    type: 'alert_sent',
                    alertType: 'check-in',
                    timestamp: new Date().toISOString(),
                  }
                );

                Alert.alert(
                  'Message Sent! 📍',
                  'Your parent has been notified that you\'re checking in. Background location tracking is now active.',
                  [{ text: 'OK' }]
                );
              }
            } catch (error) {
              console.error('Check-in error:', error);
              const errorMessage = error.response?.data?.message || 'Failed to send check-in';
              Alert.alert('Error', errorMessage);
            } finally {
              setAlertLoading(false);
            }
          },
        },
      ]
    );
  };

  const stopBackgroundLocationTracking = async () => {
    try {
      const stopped = await stopBackgroundLocation();
      if (stopped) {
        setIsBackgroundLocationActive(false);
        console.log('Background location tracking stopped');
        Alert.alert('Location Tracking Stopped', 'Background location tracking has been stopped.');
      }
    } catch (error) {
      console.error('Error stopping background location:', error);
      Alert.alert('Error', 'Failed to stop background location tracking.');
    }
  };

  const handleUnpair = async () => {
    Alert.alert(
      'Unpair',
      'Are you sure you want to disconnect from your parent?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: async () => {
            if (unpairLoading) return; // Prevent double-clicks
            
            setUnpairLoading(true);
            try {
              console.log('🔓 ChildDashboard: Starting unpair process...');
              
              // Verify we have user data
              if (!authUser) {
                throw new Error('No user data available');
              }
              
              console.log('✅ User data available:', authUser.name);
              
              const response = await userAPI.unpairUser();
              if (response.success) {
                Alert.alert('Disconnected', 'You have been disconnected from your parent.');
                setPairedUser(null);
                // Update user data to reflect unpaired status
                const updatedUser = { ...authUser, isPaired: false, pairedWith: null };
                setUser(updatedUser);
                // Update auth context as well
                await updateUser(updatedUser);
                // Clear pairing code display
                setPairingCode('');
                // Generate new pairing code for future pairing
                loadPairingCode();
              } else {
                Alert.alert('Error', response.message || 'Failed to disconnect');
              }
            } catch (error) {
              console.error('Unpair error:', error);
              const errorMessage = error.response?.data?.message || error.message || 'Failed to disconnect';
              Alert.alert('Disconnect Error', `Unable to disconnect: ${errorMessage}`);
            } finally {
              setUnpairLoading(false);
            }
          },
        },
      ]
    );
  };

  // Action button handlers
  const handleLocation = () => {
    if (!currentLocation || typeof currentLocation.latitude !== 'number' || typeof currentLocation.longitude !== 'number') {
      Alert.alert('No Location', 'No location data available. Please enable location tracking.');
      return;
    }
    
    Alert.alert(
      'My Location',
      `Your current location: ${currentLocation.latitude.toFixed(6)}, ${currentLocation.longitude.toFixed(6)}`,
      [
        { text: 'OK' },
        { 
          text: 'Open in Maps', 
          onPress: () => {
            const url = `https://www.google.com/maps?q=${currentLocation.latitude},${currentLocation.longitude}`;
            Linking.openURL(url);
          }
        }
      ]
    );
  };

  const handleCallParent = () => {
    if (!pairedUser) {
      Alert.alert('Not Connected', 'You need to be connected with your parent to call them.');
      return;
    }
    
    Alert.alert(
      'Call Parent',
      `Would you like to call ${pairedUser.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Call', 
          onPress: () => {
            // Integrate with phone calling
            Alert.alert(
              '📞 Call Emergency Contact',
              'Would you like to call your parent directly?',
              [
                { text: 'Cancel', style: 'cancel' },
                { 
                  text: 'Call Now', 
                  onPress: () => {
                    // This would open the phone app with the parent's number
                    Alert.alert('Calling...', 'This feature will dial your emergency contact when fully implemented.');
                  }
                }
              ]
            );
          }
        }
      ]
    );
  };

  const handleSettings = () => {
    navigation.navigate('Settings');
  };

  const handleHelp = () => {
    Alert.alert(
      'Help & Support',
      'How can we help you?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Voice Commands', onPress: () => Alert.alert('Voice Commands', 'Say "Mummy Help" to activate voice alerts.') },
        { text: 'Emergency Guide', onPress: () => Alert.alert('🚨 Emergency Guide', 'In an emergency:\n\n1. Use the red emergency button for immediate alerts\n2. Say "Mummy Help" to trigger voice alerts\n3. Ensure location services are enabled\n4. Your parents will be notified immediately with your location\n5. Call 911 if you\'re in immediate danger') },
        { text: 'Safety Tips', onPress: () => Alert.alert('🛡️ Safety Tips', 'Check the safety tips section on your dashboard for important safety reminders and app usage tips.') },
        { text: 'Contact Support', onPress: () => Alert.alert('📞 Contact Support', 'For help with the app:\n\n• Check the Help & Support section in your profile\n• Review the FAQ for common questions\n• Contact your parent for account issues\n• Email: support@mummyhelp.com') },
        { text: 'User Guide', onPress: () => Alert.alert('📖 User Guide', 'MummyHelp Features:\n\n🚨 Emergency Alerts - Tap red button or use voice\n📍 Location Sharing - Parents can see your location\n🎤 Voice Commands - Say "Mummy Help" for alerts\n⚙️ Settings - Customize your preferences\n🛡️ Safety Tips - Important reminders') },
      ]
    );
  };

  // New Voice Pipeline Event Handlers
  const handleVoiceEvent = (event, data) => {
    console.log('Voice event:', event, data);
    
    switch (event) {
      case 'started':
        setIsVoiceEnabled(true);
        setVoiceStatus('listening');
        break;
      
      case 'stopped':
        setIsVoiceEnabled(false);
        setVoiceStatus('idle');
        break;
      
      case 'wakeDetected':
        setVoiceStatus('processing');
        console.log('Wake word detected, starting verification...');
        break;
      
      case 'verificationProgress':
        setVoiceStatus('verifying');
        break;
      
      case 'verificationFailed':
        setVoiceStatus('listening');
        if (__DEV__) {
          console.log('Voice verification failed:', data.message);
        }
        break;
      
      case 'confirmModalShown':
        // Modal is handled by handleConfirmModalShow callback
        break;
      
      case 'alertTriggered':
        setVoiceStatus('listening');
        console.log('Alert triggered by voice:', data);
        break;
      
      case 'alertCancelled':
        setVoiceStatus('listening');
        console.log('Alert cancelled:', data);
        break;
      
      case 'error':
        setVoiceStatus('idle');
        console.error('Voice controller error:', data.message);
        if (__DEV__) {
          Alert.alert('Voice Error', data.message);
        }
        break;
      
      case 'navigationRequested':
        if (data.screen === 'VoiceEnroll') {
          navigation.navigate('VoiceEnroll', data.params);
        }
        break;
      
      default:
        console.log('Unhandled voice event:', event);
    }
  };

  const handleConfirmModalShow = (modalData) => {
    console.log('Showing voice confirmation modal:', modalData);
    setConfirmModalData(modalData);
    setShowConfirmModal(true);
    setVoiceStatus('idle'); // Reset status while modal is shown
  };

  const handleConfirmModalHide = () => {
    console.log('Hiding voice confirmation modal');
    setShowConfirmModal(false);
    setConfirmModalData(null);
    setVoiceStatus('listening');
  };

  const handleVoiceAlert = async (alertData) => {
    console.log('Voice alert triggered:', alertData);
    try {
      // Use the existing emergency alert handler
      await handleEmergencyAlert();
    } catch (error) {
      console.error('Error handling voice alert:', error);
    }
  };

  const handleConfirmModalResult = async (confirmed) => {
    try {
      await voiceController.handleConfirmationResult(confirmed, confirmModalData);
    } catch (error) {
      console.error('Error handling confirmation result:', error);
    }
  };

  // Voice Control Functions
  const startVoiceListening = async () => {
    try {
      if (!voiceEnrollmentStatus) {
        Alert.alert(
          'Voice Not Enrolled',
          'You need to enroll your voice first to use "Mummy Help" voice alerts.',
          [
            { text: 'Later', style: 'cancel' },
            { text: 'Enroll Now', onPress: () => navigation.navigate('VoiceEnroll', { user }) },
          ]
        );
        return;
      }

      const success = await voiceController.start();
      if (success) {
        Alert.alert('Voice Active', '"Mummy Help" voice detection is now active!');
      }
    } catch (error) {
      console.error('Error starting voice listening:', error);
      Alert.alert('Error', 'Failed to start voice detection');
    }
  };

  const stopVoiceListening = async () => {
    try {
      await voiceController.stop();
      Alert.alert('Voice Deactivated', 'Voice detection has been stopped.');
    } catch (error) {
      console.error('Error stopping voice listening:', error);
    }
  };

  const toggleVoiceListening = async () => {
    if (isVoiceEnabled) {
      await stopVoiceListening();
    } else {
      await startVoiceListening();
    }
  };

  const reEnrollVoice = async () => {
    try {
      await voiceController.reEnrollVoice();
    } catch (error) {
      console.error('Error re-enrolling voice:', error);
      Alert.alert('Error', 'Failed to start voice re-enrollment');
    }
  };


  // Legacy voice functions removed - using new voiceController implementation

  // Enhanced voice functions removed - using new voiceController implementation

  // Legacy stopVoiceListening removed - using new voiceController implementation above

  const handleWakePhrase = (phrase) => {
    console.log('Wake phrase detected:', phrase);
    Alert.alert(
      'Voice Activated! 🎤',
      `I heard you say "${phrase}". How can I help you?`,
      [
        { text: 'Emergency Alert', onPress: () => handleVoiceEmergency('emergency') },
        { text: 'Check-In', onPress: () => handleVoiceCheckIn('check in') },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const handleVoiceEmergency = async (phrase) => {
    console.log('Voice emergency detected:', phrase);
    // Note: Voice responses are now handled by the voice controller
    await handleEmergencyAlert();
  };

  const handleVoiceCheckIn = async (phrase) => {
    console.log('Voice check-in detected:', phrase);
    // Note: Voice responses are now handled by the voice controller
    await handleSoftAlert();
  };

  // Voice alert handlers removed - using new voiceController implementation



  // Send location to backend
  const sendLocationToBackend = async (location) => {
    try {
      const { locationAPI } = await import('../services/api');
      
      // Prepare location data with only valid fields expected by backend
      const locationData = {
        latitude: location.latitude,
        longitude: location.longitude,
      };
      
      // Only include optional fields if they have valid values
      if (location.accuracy && location.accuracy > 0) {
        locationData.accuracy = location.accuracy;
      }
      
      if (location.heading && location.heading >= 0 && location.heading <= 360) {
        locationData.heading = location.heading;
      }
      
      if (location.speed && location.speed >= 0) {
        locationData.speed = location.speed;
      }
      
      if (location.altitude) {
        locationData.altitude = location.altitude;
      }
      
      const response = await locationAPI.create(locationData);
      
      if (response.success) {
        console.log('Location sent to backend successfully');
      } else {
        console.log('Failed to send location to backend:', response.message);
      }
    } catch (error) {
      console.error('Error sending location to backend:', error);
    }
  };

  // Start automatic location sharing with backend
  const startAutomaticLocationSharing = async () => {
    try {
      // Start location tracking with callback to send to backend
      const success = await locationService.startLocationTracking(async (location) => {
        setCurrentLocation(location);
        console.log('Location updated:', location);
        
        // Send location to backend every 10 seconds
        await sendLocationToBackend(location);
      });

      if (success) {
        setIsLocationTracking(true);
        console.log('Automatic location sharing started');
        
        // Send location more frequently in the first 2 minutes after login
        let initialSends = 0;
        const initialInterval = setInterval(async () => {
          if (initialSends < 6) { // Send 6 times in first 2 minutes (every 20 seconds)
            const currentLocation = await locationService.getCurrentLocation();
            if (currentLocation) {
              await sendLocationToBackend(currentLocation);
              console.log('Initial frequent location send:', initialSends + 1);
            }
            initialSends++;
          } else {
            clearInterval(initialInterval);
            console.log('Initial frequent location sending completed');
          }
        }, 20000); // Every 20 seconds
      }
    } catch (error) {
      console.error('Error starting automatic location sharing:', error);
    }
  };



  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient
          colors={['#ff7b7b', '#667eea']}
          style={styles.loadingGradient}
        >
          <MotiView
            from={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', damping: 15, stiffness: 100 }}
          >
            <ActivityIndicator size="large" color="#ffffff" />
            <Text style={styles.loadingText}>Loading your safety dashboard...</Text>
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
        colors={user?.isPaired ? ['#ff7b7b', '#667eea'] : ['#f093fb', '#f5576c']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <MotiView
            from={{ opacity: 0, translateY: -20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'spring', damping: 15, stiffness: 100 }}
          >
            <Text style={styles.headerTitle}>MummyHelp</Text>
            <Text style={styles.headerSubtitle}>Child Safety Dashboard</Text>
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
        {/* Welcome Card with Beautiful Animation */}
        <MotiView
          from={{ opacity: 0, translateY: 30 }}
          animate={{ opacity: 1, translateY: 0 }}
          delay={100}
          transition={{ type: 'spring', damping: 15, stiffness: 100 }}
        >
          <Card style={styles.welcomeCard}>
            <LinearGradient
              colors={user?.isPaired ? ['#667eea', '#764ba2'] : ['#f093fb', '#f5576c']}
              style={styles.welcomeCardGradient}
            >
              <Text style={styles.welcomeTitle}>
                Hi {user?.name}! 👋
              </Text>
              <Text style={styles.welcomeText}>
                {user?.isPaired 
                  ? '🟢 Connected & Protected! Your parent is watching over you.' 
                  : '🔴 Not Connected - Connect with your parent to activate safety features.'}
              </Text>
              {!locationPermission && (
                <Text style={styles.locationWarning}>
                  ⚠️ Enable location access to share your location with your parent.
                </Text>
              )}
            </LinearGradient>
          </Card>
        </MotiView>

        {/* Pairing Status Card */}
        <Card style={styles.pairingCard}>
          <Card.Content>
            <Title style={styles.pairingTitle}>
              {user?.isPaired ? '🟢 Connected' : '🔴 Not Connected'}
            </Title>
            <Paragraph style={styles.pairingText}>
              {user?.isPaired 
                ? 'You are paired with your parent. You can send alerts and check-ins.'
                : 'You need to pair with your parent to use the safety features.'
              }
            </Paragraph>
            
            {user?.isPaired && (
              <Button
                mode="outlined"
                onPress={handleUnpair}
                style={styles.unpairButton}
                loading={unpairLoading}
                disabled={unpairLoading}
              >
                {unpairLoading ? 'Disconnecting...' : 'Disconnect'}
              </Button>
            )}
          </Card.Content>
        </Card>

        {/* Connected Parent Info */}
        {user?.isPaired && pairedUser && (
          <Card style={styles.parentInfoCard}>
            <Card.Content>
              <Title style={styles.parentInfoTitle}>Connected Parent</Title>
              <View style={styles.parentInfo}>
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
              </View>
            </Card.Content>
          </Card>
        )}

        {/* Emergency Action Buttons */}
        <MotiView
          from={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          delay={300}
          transition={{ type: 'spring', damping: 15, stiffness: 100 }}
          style={styles.actionButtonsContainer}
        >
          {/* Emergency Alert Button */}
          <TouchableOpacity
            style={[styles.emergencyButton, (!user?.isPaired || alertLoading) && styles.buttonDisabled]}
            onPress={handleEmergencyAlert}
            disabled={!user?.isPaired || alertLoading}
          >
            <LinearGradient
              colors={['#ff416c', '#ff4b2b']}
              style={styles.emergencyButtonGradient}
            >
              <MotiView
                animate={{ scale: alertLoading ? 1.1 : 1 }}
                transition={{ type: 'spring', damping: 15 }}
              >
                {alertLoading ? (
                  <ActivityIndicator size="large" color="#ffffff" />
                ) : (
                  <>
                    <Text style={styles.emergencyIcon}>🚨</Text>
                    <Text style={styles.emergencyButtonText}>EMERGENCY</Text>
                    <Text style={styles.emergencySubtext}>Tap for immediate help</Text>
                  </>
                )}
              </MotiView>
            </LinearGradient>
          </TouchableOpacity>

          {/* Check-In Button */}
          <TouchableOpacity
            style={[styles.checkInButton, (!user?.isPaired || alertLoading) && styles.buttonDisabled]}
            onPress={handleSoftAlert}
            disabled={!user?.isPaired || alertLoading}
          >
            <LinearGradient
              colors={['#667eea', '#764ba2']}
              style={styles.checkInButtonGradient}
            >
              <MotiView
                animate={{ scale: alertLoading ? 1.1 : 1 }}
                transition={{ type: 'spring', damping: 15 }}
              >
                {alertLoading ? (
                  <ActivityIndicator size="large" color="#ffffff" />
                ) : (
                  <>
                    <Text style={styles.checkInIcon}>📍</Text>
                    <Text style={styles.checkInButtonText}>CHECK-IN</Text>
                    <Text style={styles.checkInSubtext}>I'm safe & sound</Text>
                  </>
                )}
              </MotiView>
            </LinearGradient>
          </TouchableOpacity>
        </MotiView>

        {/* Pairing Code Card */}
        {!user?.isPaired && (
          <Card style={styles.pairingCodeCard}>
            <Card.Content>
              <Title style={styles.pairingCodeTitle}>Your Pairing Code</Title>
              <Paragraph style={styles.pairingCodeInstructions}>
                Share this code with your parent to connect your accounts:
              </Paragraph>
              
              <View style={styles.codeContainer}>
                {pairingCodeLoading ? (
                  <ActivityIndicator size="large" color="#667eea" />
                ) : (
                  <Text style={styles.pairingCode}>{pairingCode}</Text>
                )}
              </View>
              
              <Paragraph style={styles.pairingCodeNote}>
                Your parent needs to enter this code in their app to connect with you.
              </Paragraph>
            </Card.Content>
          </Card>
        )}

        {/* Location Status Card */}
        <Card style={styles.locationCard}>
          <Card.Content>
            <Title style={styles.locationTitle}>
              📍 Location Status
            </Title>
            <View style={styles.locationInfo}>
              <View style={styles.locationRow}>
                <Text style={styles.locationLabel}>Permission:</Text>
                <Text style={[styles.locationValue, { color: locationPermission ? '#27ae60' : '#e74c3c' }]}>
                  {locationPermission ? '✅ Granted' : '❌ Not Granted'}
                </Text>
              </View>
              <View style={styles.locationRow}>
                <Text style={styles.locationLabel}>Tracking:</Text>
                <Text style={[styles.locationValue, { color: isLocationTracking ? '#27ae60' : '#95a5a6' }]}>
                  {isLocationTracking ? '🟢 Active' : '⚪ Inactive'}
                </Text>
              </View>
              {currentLocation && (
                <View style={styles.locationRow}>
                  <Text style={styles.locationLabel}>Last Update:</Text>
                  <Text style={styles.locationValue}>
                    {new Date(currentLocation.timestamp).toLocaleTimeString()}
                  </Text>
                </View>
              )}
              <View style={styles.locationRow}>
                <Text style={styles.locationLabel}>Background:</Text>
                <Text style={[styles.locationValue, { color: isBackgroundLocationActive ? '#27ae60' : '#95a5a6' }]}>
                  {isBackgroundLocationActive ? '🟢 Active' : '⚪ Inactive'}
                </Text>
              </View>
            </View>
            
            {!locationPermission ? (
              <Button
                mode="contained"
                onPress={requestLocationPermission}
                style={styles.locationButton}
              >
                Enable Location Access
              </Button>
            ) : !isLocationTracking ? (
              <Button
                mode="contained"
                onPress={startLocationTracking}
                style={styles.locationButton}
              >
                Start Location Tracking
              </Button>
            ) : (
              <View style={styles.locationButtons}>
                <Button
                  mode="outlined"
                  onPress={stopLocationTracking}
                  style={styles.stopLocationButton}
                >
                  Stop Location Tracking
                </Button>
                {isBackgroundLocationActive && (
                  <Button
                    mode="contained"
                    onPress={stopBackgroundLocationTracking}
                    style={styles.stopBackgroundButton}
                    buttonColor="#e74c3c"
                  >
                    Stop Background Tracking
                  </Button>
                )}
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Quick Actions */}
        <Card style={styles.actionsCard}>
          <Card.Content>
            <Title style={styles.actionsTitle}>Quick Actions</Title>
            <View style={styles.actionsGrid}>
              <TouchableOpacity 
                style={[styles.actionButton, !locationPermission && styles.actionButtonDisabled]}
                onPress={handleLocation}
                disabled={!locationPermission}
              >
                <Text style={styles.actionIcon}>📍</Text>
                <Text style={styles.actionText}>Location</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.actionButton, !user?.isPaired && styles.actionButtonDisabled]}
                onPress={handleCallParent}
                disabled={!user?.isPaired}
              >
                <Text style={styles.actionIcon}>📱</Text>
                <Text style={styles.actionText}>Call Parent</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={handleSettings}
              >
                <Text style={styles.actionIcon}>⚙️</Text>
                <Text style={styles.actionText}>Settings</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={handleHelp}
              >
                <Text style={styles.actionIcon}>❓</Text>
                <Text style={styles.actionText}>Help</Text>
              </TouchableOpacity>
            </View>
          </Card.Content>
        </Card>

        {/* Safety Tips */}
        <Card style={styles.safetyCard}>
          <Card.Content>
            <Title style={styles.safetyTitle}>🛡️ Safety Tips</Title>
            <View style={styles.safetyTips}>
              <View style={styles.tipItem}>
                <Text style={styles.tipIcon}>🎤</Text>
                <Text style={styles.tipText}>Say "Mummy Help" to activate voice alerts when in danger</Text>
              </View>
              <View style={styles.tipItem}>
                <Text style={styles.tipIcon}>🚨</Text>
                <Text style={styles.tipText}>Use the red emergency button for immediate help</Text>
              </View>
              <View style={styles.tipItem}>
                <Text style={styles.tipIcon}>📍</Text>
                <Text style={styles.tipText}>Keep location services on so parents can find you</Text>
              </View>
              <View style={styles.tipItem}>
                <Text style={styles.tipIcon}>📱</Text>
                <Text style={styles.tipText}>Keep your phone charged and notify parents if battery is low</Text>
              </View>
              <View style={styles.tipItem}>
                <Text style={styles.tipIcon}>👥</Text>
                <Text style={styles.tipText}>Stay with trusted friends when going out</Text>
              </View>
              <View style={styles.tipItem}>
                <Text style={styles.tipIcon}>🏠</Text>
                <Text style={styles.tipText}>Always tell parents where you're going and when you'll be back</Text>
              </View>
              <View style={styles.tipItem}>
                <Text style={styles.tipIcon}>⚠️</Text>
                <Text style={styles.tipText}>Trust your instincts - if something feels wrong, get help</Text>
              </View>
              <View style={styles.tipItem}>
                <Text style={styles.tipIcon}>🔒</Text>
                <Text style={styles.tipText}>Never share personal information with strangers</Text>
              </View>
            </View>
          </Card.Content>
        </Card>

      </ScrollView>

      {/* Voice Confirmation Modal */}
      <ConfirmModal
        visible={showConfirmModal}
        onConfirm={() => handleConfirmModalResult(true)}
        onCancel={() => handleConfirmModalResult(false)}
        timeoutMs={confirmModalData?.autoConfirmMs || 10000}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  loadingText: {
    marginTop: 20,
    fontSize: 18,
    color: '#ffffff',
    fontWeight: '600',
    textAlign: 'center',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 30,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 4,
    fontWeight: '500',
  },
  logoutButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
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
    marginBottom: 24,
    borderRadius: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    overflow: 'hidden',
  },
  welcomeCardGradient: {
    padding: 24,
    borderRadius: 20,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 12,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  welcomeText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.95)',
    lineHeight: 24,
    fontWeight: '500',
  },
  locationWarning: {
    fontSize: 14,
    color: '#fff3cd',
    marginTop: 12,
    fontWeight: '500',
    backgroundColor: 'rgba(255, 193, 7, 0.2)',
    padding: 8,
    borderRadius: 8,
  },
  locationCard: {
    marginBottom: 20,
    borderRadius: 12,
    elevation: 4,
  },
  locationTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 16,
  },
  locationInfo: {
    gap: 12,
    marginBottom: 16,
  },
  locationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  locationLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
     locationValue: {
     fontSize: 14,
     fontWeight: '600',
   },
  locationButton: {
    backgroundColor: '#667eea',
  },
  stopLocationButton: {
    borderColor: '#e74c3c',
  },
  locationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stopBackgroundButton: {
    flex: 1,
    marginLeft: 8,
  },
  pairingCard: {
    marginBottom: 20,
    borderRadius: 12,
    elevation: 4,
  },
  pairingTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 12,
  },
  pairingText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  unpairButton: {
    marginTop: 8,
    borderColor: '#e74c3c',
  },
  pairingCodeCard: {
    marginBottom: 20,
    borderRadius: 12,
    elevation: 4,
  },
  pairingCodeTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 12,
  },
  pairingCodeInstructions: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  codeContainer: {
    backgroundColor: '#f8f9fa',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#667eea',
    borderStyle: 'dashed',
    minHeight: 80,
    justifyContent: 'center',
  },
  pairingCode: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#667eea',
    letterSpacing: 4,
  },
  pairingCodeNote: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  parentInfoCard: {
    marginBottom: 20,
    borderRadius: 12,
    elevation: 4,
  },
  parentInfoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 16,
  },
  parentInfo: {
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 16,
  },
  emergencyButton: {
    flex: 1,
    borderRadius: 20,
    elevation: 8,
    shadowColor: '#ff4b2b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  emergencyButtonGradient: {
    padding: 24,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
  },
  emergencyIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  emergencyButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  emergencySubtext: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
    textAlign: 'center',
  },
  checkInButton: {
    flex: 1,
    borderRadius: 20,
    elevation: 8,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  checkInButtonGradient: {
    padding: 24,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
  },
  checkInIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  checkInButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  checkInSubtext: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
    textAlign: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  actionsCard: {
    marginBottom: 20,
    borderRadius: 12,
    elevation: 4,
  },
  actionsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 16,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    width: (width - 60) / 2,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  actionButtonDisabled: {
    opacity: 0.5,
  },
  actionIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  actionText: {
    fontSize: 14,
    color: '#2c3e50',
    fontWeight: '500',
  },
  safetyCard: {
    marginBottom: 20,
    borderRadius: 12,
    elevation: 4,
  },
  safetyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 16,
  },
  safetyTips: {
    gap: 12,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tipIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  tipText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
});

export default ChildDashboard; 