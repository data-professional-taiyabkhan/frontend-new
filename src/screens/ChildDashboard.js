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
} from 'react-native-paper';
import { authAPI, userAPI, alertAPI, storage } from '../services/api';
import notificationService from '../services/notifications';
import locationService from '../services/location';
import voiceService from '../services/voice';

const { width, height } = Dimensions.get('window');

const ChildDashboard = ({ navigation }) => {
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
  const [isVoiceListening, setIsVoiceListening] = useState(false);
  const [voicePermission, setVoicePermission] = useState(false);

  useEffect(() => {
    loadUserProfile();
    setupNotifications();
    setupLocation();
    setupVoice();
  }, []);

  const setupNotifications = async () => {
    try {
      // Register for push notifications (for future use)
      const token = await notificationService.registerForPushNotifications();
      console.log('Child push token:', token);
    } catch (error) {
      console.error('Error setting up notifications:', error);
    }
  };

  const setupLocation = async () => {
    try {
      // Check location permissions
      const hasPermission = await locationService.checkLocationPermissions();
      setLocationPermission(hasPermission);

      if (hasPermission) {
        // Get initial location
        const location = await locationService.getCurrentLocation();
        if (location) {
          setCurrentLocation(location);
        }
      }
    } catch (error) {
      console.error('Error setting up location:', error);
    }
  };

  const setupVoice = async () => {
    try {
      // Initialize voice service
      const hasPermission = await voiceService.initializeAudio();
      setVoicePermission(hasPermission);
      
      if (hasPermission && user?.isPaired) {
        // Start voice listening if paired
        startVoiceListening();
      }
    } catch (error) {
      console.error('Error setting up voice:', error);
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
      }
    } catch (error) {
      console.error('Error requesting location permission:', error);
    }
  };

  const loadUserProfile = async () => {
    try {
      const response = await userAPI.getProfile();
      if (response.success) {
        setUser(response.data.user);
        
        // If user is paired, get paired user info
        if (response.data.user.isPaired) {
          loadPairedUserInfo();
          // Start voice listening if paired and voice permission granted
          if (voicePermission) {
            startVoiceListening();
          }
        } else {
          // If not paired, get pairing code
          loadPairingCode();
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
      }
    } catch (error) {
      console.error('Error loading paired user:', error);
    }
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
              await storage.clearAuthData();
              await locationService.stopLocationTracking();
              await voiceService.stopVoiceListening();
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
                // Send local notification to confirm alert was sent
                await notificationService.sendLocalNotification(
                  '🚨 Emergency Alert Sent!',
                  'Your parent has been notified. Help is on the way!',
                  {
                    type: 'alert_sent',
                    alertType: 'emergency',
                    timestamp: new Date().toISOString(),
                  }
                );

                // Voice feedback
                await voiceService.speakEmergencySent();

                Alert.alert(
                  'Alert Sent! 🚨',
                  'Your parent has been notified. Help is on the way!',
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

                // Voice feedback
                await voiceService.speakCheckInSent();

                Alert.alert(
                  'Message Sent! 📍',
                  'Your parent has been notified that you\'re checking in.',
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
            try {
              const response = await userAPI.unpairUser();
              if (response.success) {
                Alert.alert('Disconnected', 'You have been disconnected from your parent.');
                setPairedUser(null);
                loadUserProfile();
              }
            } catch (error) {
              console.error('Unpair error:', error);
              Alert.alert('Error', 'Failed to disconnect');
            }
          },
        },
      ]
    );
  };

  // Action button handlers
  const handleLocation = () => {
    if (!currentLocation) {
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
            // This would integrate with phone calling
            Alert.alert('Call Feature', 'Calling feature will be implemented in the next update.');
          }
        }
      ]
    );
  };

  const handleSettings = () => {
    Alert.alert(
      'Settings',
      'App settings and preferences:',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Location Settings', onPress: () => Alert.alert('Settings', 'Location settings will be implemented.') },
        { text: 'Notification Settings', onPress: () => Alert.alert('Settings', 'Notification settings will be implemented.') },
        { text: 'Privacy Settings', onPress: () => Alert.alert('Settings', 'Privacy settings will be implemented.') },
        { text: 'Account Settings', onPress: () => Alert.alert('Settings', 'Account settings will be implemented.') },
      ]
    );
  };

  const handleHelp = () => {
    Alert.alert(
      'Help & Support',
      'How can we help you?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Voice Commands', onPress: () => voiceService.speakVoiceTutorial() },
        { text: 'Emergency Guide', onPress: () => Alert.alert('Help', 'Emergency guide will be implemented.') },
        { text: 'Safety Tips', onPress: () => Alert.alert('Help', 'Safety tips will be implemented.') },
        { text: 'Contact Support', onPress: () => Alert.alert('Help', 'Contact support will be implemented.') },
        { text: 'User Guide', onPress: () => Alert.alert('Help', 'User guide will be implemented.') },
      ]
    );
  };

  // Voice listening functions
  const startVoiceListening = async () => {
    if (!voicePermission) {
      Alert.alert('Permission Required', 'Audio permission is required for voice-activated alerts.');
      return;
    }

    try {
      const success = await voiceService.startVoiceListening(
        handleWakePhrase,
        handleVoiceEmergency,
        handleVoiceCheckIn
      );

      if (success) {
        setIsVoiceListening(true);
        Alert.alert('Voice Activated', 'Voice recognition is now active! Say "Hey MummyHelp" to get started.');
      }
    } catch (error) {
      console.error('Error starting voice listening:', error);
      Alert.alert('Error', 'Failed to start voice recognition');
    }
  };

  const stopVoiceListening = async () => {
    try {
      await voiceService.stopVoiceListening();
      setIsVoiceListening(false);
      Alert.alert('Voice Deactivated', 'Voice recognition has been stopped.');
    } catch (error) {
      console.error('Error stopping voice listening:', error);
    }
  };

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
    await voiceService.speakResponse('Sending emergency alert now...');
    await handleEmergencyAlert();
  };

  const handleVoiceCheckIn = async (phrase) => {
    console.log('Voice check-in detected:', phrase);
    await voiceService.speakResponse('Sending check-in message now...');
    await handleSoftAlert();
  };

  const testVoiceCommand = async () => {
    Alert.alert(
      'Test Voice Command',
      'Choose a command to test:',
      [
        { text: 'Hey MummyHelp', onPress: () => voiceService.manualVoiceCommand('Hey MummyHelp', handleWakePhrase, handleVoiceEmergency, handleVoiceCheckIn) },
        { text: 'Help me', onPress: () => voiceService.manualVoiceCommand('Help me', handleWakePhrase, handleVoiceEmergency, handleVoiceCheckIn) },
        { text: 'Check in', onPress: () => voiceService.manualVoiceCommand('Check in', handleWakePhrase, handleVoiceEmergency, handleVoiceCheckIn) },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#667eea" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>MummyHelp</Text>
          <Text style={styles.headerSubtitle}>Child Dashboard</Text>
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
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Welcome Card */}
        <Card style={styles.welcomeCard}>
          <Card.Content>
            <Title style={styles.welcomeTitle}>
              Hi {user?.name}! 👋
            </Title>
            <Paragraph style={styles.welcomeText}>
              You're logged in as a child. {user?.isPaired ? 'You are connected with your parent.' : 'Connect with your parent to use the safety features.'}
            </Paragraph>
            {!locationPermission && (
              <Paragraph style={styles.locationWarning}>
                ⚠️ Enable location access to share your location with your parent.
              </Paragraph>
            )}
          </Card.Content>
        </Card>

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
              <Button
                mode="outlined"
                onPress={stopLocationTracking}
                style={styles.stopLocationButton}
              >
                Stop Location Tracking
              </Button>
            )}
          </Card.Content>
        </Card>

        {/* Voice Status Card */}
        <Card style={styles.voiceCard}>
          <Card.Content>
            <Title style={styles.voiceTitle}>
              🎤 Voice Recognition
            </Title>
            <View style={styles.voiceInfo}>
              <View style={styles.voiceRow}>
                <Text style={styles.voiceLabel}>Permission:</Text>
                <Text style={[styles.voiceValue, { color: voicePermission ? '#27ae60' : '#e74c3c' }]}>
                  {voicePermission ? '✅ Granted' : '❌ Not Granted'}
                </Text>
              </View>
              <View style={styles.voiceRow}>
                <Text style={styles.voiceLabel}>Listening:</Text>
                <Text style={[styles.voiceValue, { color: isVoiceListening ? '#27ae60' : '#95a5a6' }]}>
                  {isVoiceListening ? '🟢 Active' : '⚪ Inactive'}
                </Text>
              </View>
              <View style={styles.voiceRow}>
                <Text style={styles.voiceLabel}>Status:</Text>
                <Text style={styles.voiceValue}>
                  {user?.isPaired ? 'Ready for voice commands' : 'Connect with parent first'}
                </Text>
              </View>
            </View>
            
            {!voicePermission ? (
              <Button
                mode="contained"
                onPress={setupVoice}
                style={styles.voiceButton}
              >
                Enable Voice Access
              </Button>
            ) : !user?.isPaired ? (
              <Button
                mode="outlined"
                disabled
                style={styles.voiceButton}
              >
                Connect with Parent First
              </Button>
            ) : !isVoiceListening ? (
              <Button
                mode="contained"
                onPress={startVoiceListening}
                style={styles.voiceButton}
              >
                Start Voice Recognition
              </Button>
            ) : (
              <View style={styles.voiceButtons}>
                <Button
                  mode="outlined"
                  onPress={stopVoiceListening}
                  style={styles.stopVoiceButton}
                >
                  Stop Listening
                </Button>
                <Button
                  mode="contained"
                  onPress={testVoiceCommand}
                  style={styles.testVoiceButton}
                >
                  Test Commands
                </Button>
              </View>
            )}
          </Card.Content>
        </Card>

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
              >
                Disconnect
              </Button>
            )}
          </Card.Content>
        </Card>

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
                  <Text style={styles.infoValue}>2 minutes ago</Text>
                </View>
              </View>
            </Card.Content>
          </Card>
        )}

        {/* Emergency Alert Card */}
        <Card style={styles.emergencyCard}>
          <Card.Content>
            <Title style={styles.emergencyTitle}>🚨 Emergency Alert</Title>
            <Paragraph style={styles.emergencyText}>
              Use this button if you need immediate help or are in danger.
            </Paragraph>
            
            <TouchableOpacity
              style={[styles.emergencyButton, (!user?.isPaired || alertLoading) && styles.buttonDisabled]}
              onPress={handleEmergencyAlert}
              disabled={!user?.isPaired || alertLoading}
            >
              {alertLoading ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={styles.emergencyButtonText}>SEND EMERGENCY ALERT</Text>
              )}
            </TouchableOpacity>
          </Card.Content>
        </Card>

        {/* Soft Alert Card */}
        <Card style={styles.softAlertCard}>
          <Card.Content>
            <Title style={styles.softAlertTitle}>📍 Check-In</Title>
            <Paragraph style={styles.softAlertText}>
              Let your parent know you're safe and where you are.
            </Paragraph>
            
            <TouchableOpacity
              style={[styles.softAlertButton, (!user?.isPaired || alertLoading) && styles.buttonDisabled]}
              onPress={handleSoftAlert}
              disabled={!user?.isPaired || alertLoading}
            >
              {alertLoading ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={styles.softAlertButtonText}>SEND CHECK-IN</Text>
              )}
            </TouchableOpacity>
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
                <Text style={styles.tipText}>Say "Hey MummyHelp" to activate voice commands</Text>
              </View>
              <View style={styles.tipItem}>
                <Text style={styles.tipIcon}>🚨</Text>
                <Text style={styles.tipText}>Say "Help me" or "Emergency" for urgent help</Text>
              </View>
              <View style={styles.tipItem}>
                <Text style={styles.tipIcon}>📍</Text>
                <Text style={styles.tipText}>Say "Check in" to let parents know you're safe</Text>
              </View>
              <View style={styles.tipItem}>
                <Text style={styles.tipIcon}>📱</Text>
                <Text style={styles.tipText}>Keep your phone charged and nearby</Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Coming Soon Features */}
        <Card style={styles.comingSoonCard}>
          <Card.Content>
            <Title style={styles.comingSoonTitle}>🚧 Coming Soon</Title>
            <Paragraph style={styles.comingSoonText}>
              We're working hard to bring you these features:
            </Paragraph>
            <View style={styles.featuresList}>
              <View style={styles.featureItem}>
                <Text style={styles.featureIcon}>🎤</Text>
                <Text style={styles.featureText}>Voice-activated alerts</Text>
              </View>
              <View style={styles.featureItem}>
                <Text style={styles.featureIcon}>📍</Text>
                <Text style={styles.featureText}>Automatic location sharing</Text>
              </View>
              <View style={styles.featureItem}>
                <Text style={styles.featureIcon}>💬</Text>
                <Text style={styles.featureText}>Quick message templates</Text>
              </View>
              <View style={styles.featureItem}>
                <Text style={styles.featureIcon}>🔔</Text>
                <Text style={styles.featureText}>Smart notifications</Text>
              </View>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: '#667eea',
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
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#ffffff80',
    marginTop: 2,
  },
  logoutButton: {
    backgroundColor: '#ffffff20',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  logoutButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  welcomeCard: {
    marginBottom: 20,
    borderRadius: 12,
    elevation: 4,
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
  },
  welcomeText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  locationWarning: {
    fontSize: 12,
    color: '#e74c3c',
    marginTop: 8,
    fontStyle: 'italic',
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
  voiceCard: {
    marginBottom: 20,
    borderRadius: 12,
    elevation: 4,
  },
  voiceTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 16,
  },
  voiceInfo: {
    gap: 12,
    marginBottom: 16,
  },
  voiceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  voiceLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  voiceValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  voiceButton: {
    backgroundColor: '#667eea',
  },
  voiceButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stopVoiceButton: {
    flex: 1,
    marginRight: 8,
    borderColor: '#e74c3c',
  },
  testVoiceButton: {
    flex: 1,
    marginLeft: 8,
    backgroundColor: '#27ae60',
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
  emergencyCard: {
    marginBottom: 20,
    borderRadius: 12,
    elevation: 4,
    borderLeftWidth: 4,
    borderLeftColor: '#e74c3c',
  },
  emergencyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 12,
  },
  emergencyText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  emergencyButton: {
    backgroundColor: '#e74c3c',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  emergencyButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  softAlertCard: {
    marginBottom: 20,
    borderRadius: 12,
    elevation: 4,
    borderLeftWidth: 4,
    borderLeftColor: '#3498db',
  },
  softAlertTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 12,
  },
  softAlertText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  softAlertButton: {
    backgroundColor: '#3498db',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  softAlertButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
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
  comingSoonCard: {
    marginBottom: 20,
    borderRadius: 12,
    elevation: 4,
  },
  comingSoonTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 12,
  },
  comingSoonText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  featuresList: {
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  featureText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
});

export default ChildDashboard; 