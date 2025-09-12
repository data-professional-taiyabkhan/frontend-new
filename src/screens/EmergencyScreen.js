import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Alert,
  Vibration,
  Platform,
} from 'react-native';
import { Button, Card, IconButton, ProgressBar } from 'react-native-paper';
import { MotiView, AnimatePresence } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';

const { width, height } = Dimensions.get('window');

const EmergencyScreen = ({ navigation, route }) => {
  const [emergencyActive, setEmergencyActive] = useState(false);
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [sound, setSound] = useState(null);
  const insets = useSafeAreaInsets();
  const countdownRef = useRef(null);

  const { isVoiceTriggered = false } = route.params || {};

  useEffect(() => {
    if (isVoiceTriggered) {
      handleVoiceEmergency();
    }
  }, [isVoiceTriggered]);

  useEffect(() => {
    if (emergencyActive && countdown > 0) {
      countdownRef.current = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
    } else if (countdown === 0) {
      sendEmergencyAlert();
    }

    return () => {
      if (countdownRef.current) {
        clearTimeout(countdownRef.current);
      }
    };
  }, [emergencyActive, countdown]);

  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  const handleVoiceEmergency = async () => {
    try {
      // Play emergency sound
      await playEmergencySound();
      
      // Trigger haptic feedback
      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } else {
        Vibration.vibrate([0, 500, 200, 500]);
      }

      // Start emergency sequence
      setEmergencyActive(true);
      setCountdown(5);
    } catch (error) {
      console.error('Voice emergency error:', error);
      setEmergencyActive(true);
      setCountdown(5);
    }
  };

  const handleManualEmergency = async () => {
    try {
      // Play emergency sound
      await playEmergencySound();
      
      // Trigger haptic feedback
      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } else {
        Vibration.vibrate([0, 500, 200, 500]);
      }

      // Start emergency sequence
      setEmergencyActive(true);
      setCountdown(5);
    } catch (error) {
      console.error('Manual emergency error:', error);
      setEmergencyActive(true);
      setCountdown(5);
    }
  };

  const playEmergencySound = async () => {
    try {
      const { sound: audioSound } = await Audio.Sound.createAsync(
        require('../assets/emergency-alert.mp3'), // You'll need to add this sound file
        { shouldPlay: true, isLooping: true }
      );
      setSound(audioSound);
    } catch (error) {
      console.log('Could not play emergency sound:', error);
    }
  };

  const getCurrentLocation = async () => {
    try {
      setLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required for emergency alerts.');
        return null;
      }

      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        timeout: 10000,
      });

      setLocation(currentLocation);
      return currentLocation;
    } catch (error) {
      console.error('Location error:', error);
      Alert.alert('Location Error', 'Could not get your current location.');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const sendEmergencyAlert = async () => {
    try {
      setLoading(true);
      
      // Get current location
      const currentLocation = await getCurrentLocation();
      
      if (!currentLocation) {
        Alert.alert('Error', 'Could not send emergency alert without location.');
        setEmergencyActive(false);
        setCountdown(5);
        return;
      }

      // Stop emergency sound
      if (sound) {
        await sound.stopAsync();
        await sound.unloadAsync();
        setSound(null);
      }

      // Here you would send the emergency alert to your backend
      // For now, we'll simulate it
      console.log('Sending emergency alert with location:', currentLocation);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Show success message
      Alert.alert(
        'Emergency Alert Sent! 🚨',
        'Your emergency alert has been sent to your emergency contacts. Help is on the way!',
        [
          {
            text: 'OK',
            onPress: () => {
              setEmergencyActive(false);
              setCountdown(5);
              navigation.goBack();
            },
          },
        ]
      );
    } catch (error) {
      console.error('Emergency alert error:', error);
      Alert.alert('Error', 'Failed to send emergency alert. Please try again.');
      setEmergencyActive(false);
      setCountdown(5);
    } finally {
      setLoading(false);
    }
  };

  const cancelEmergency = () => {
    Alert.alert(
      'Cancel Emergency',
      'Are you sure you want to cancel this emergency alert?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: () => {
            if (sound) {
              sound.stopAsync();
              sound.unloadAsync();
              setSound(null);
            }
            setEmergencyActive(false);
            setCountdown(5);
            navigation.goBack();
          },
        },
      ]
    );
  };

  const getEmergencyStatus = () => {
    if (!emergencyActive) return 'Ready';
    if (countdown > 0) return `Alerting in ${countdown}s`;
    return 'Sending Alert...';
  };

  const getStatusColor = () => {
    if (!emergencyActive) return '#4caf50';
    if (countdown > 0) return '#ff9800';
    return '#f44336';
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="light" />
      
      {/* Background Gradient */}
      <LinearGradient
        colors={emergencyActive ? ['#f44336', '#d32f2f'] : ['#667eea', '#764ba2']}
        style={styles.backgroundGradient}
      />

      {/* Header */}
      <View style={styles.header}>
        <MotiView
          from={{ opacity: 0, translateY: -20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'spring', damping: 20, stiffness: 100 }}
          style={styles.statusContainer}
        >
          <Text style={styles.statusLabel}>Emergency Status</Text>
          <View style={[styles.statusIndicator, { backgroundColor: getStatusColor() }]}>
            <Text style={styles.statusText}>{getEmergencyStatus()}</Text>
          </View>
        </MotiView>
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        {!emergencyActive ? (
          // Emergency Ready State
          <MotiView
            from={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', damping: 20, stiffness: 100 }}
            style={styles.readyContainer}
          >
            {/* Emergency Icon */}
            <MotiView
              animate={{
                scale: [1, 1.1, 1],
              }}
              transition={{
                type: 'timing',
                duration: 2000,
                loop: true,
              }}
              style={styles.emergencyIcon}
            >
              <Text style={styles.emergencyIconText}>🚨</Text>
            </MotiView>

            <Text style={styles.emergencyTitle}>Emergency Alert</Text>
            <Text style={styles.emergencySubtitle}>
              Tap the button below to send an emergency alert to your contacts
            </Text>

            {/* Emergency Button */}
            <MotiView
              animate={{
                scale: [1, 1.05, 1],
              }}
              transition={{
                type: 'timing',
                duration: 1500,
                loop: true,
              }}
            >
              <TouchableOpacity
                style={styles.emergencyButton}
                onPress={handleManualEmergency}
                activeOpacity={0.8}
              >
                <Text style={styles.emergencyButtonText}>SEND EMERGENCY ALERT</Text>
              </TouchableOpacity>
            </MotiView>

            <Text style={styles.emergencyNote}>
              This will immediately notify your emergency contacts and share your location
            </Text>
          </MotiView>
        ) : (
          // Emergency Active State
          <AnimatePresence>
            <MotiView
              key="emergency-active"
              from={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ type: 'spring', damping: 20, stiffness: 100 }}
              style={styles.activeContainer}
            >
              {/* Countdown Display */}
              <MotiView
                animate={{
                  scale: [1, 1.2, 1],
                }}
                transition={{
                  type: 'timing',
                  duration: 1000,
                  loop: true,
                }}
                style={styles.countdownContainer}
              >
                <Text style={styles.countdownText}>{countdown}</Text>
                <Text style={styles.countdownLabel}>seconds</Text>
              </MotiView>

              <Text style={styles.alertTitle}>Emergency Alert Active!</Text>
              <Text style={styles.alertSubtitle}>
                {countdown > 0 
                  ? `Alert will be sent in ${countdown} seconds`
                  : 'Sending emergency alert...'
                }
              </Text>

              {/* Progress Bar */}
              {countdown > 0 && (
                <View style={styles.progressContainer}>
                  <ProgressBar
                    progress={(5 - countdown) / 5}
                    color="#ffffff"
                    style={styles.progressBar}
                  />
                </View>
              )}

              {/* Cancel Button */}
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={cancelEmergency}
                activeOpacity={0.8}
              >
                <Text style={styles.cancelButtonText}>Cancel Emergency</Text>
              </TouchableOpacity>
            </MotiView>
          </AnimatePresence>
        )}
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <MotiView
          from={{ opacity: 0, translateY: 50 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'spring', damping: 20, stiffness: 100, delay: 1000 }}
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </MotiView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f44336',
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  statusContainer: {
    alignItems: 'center',
  },
  statusLabel: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  statusIndicator: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 120,
    alignItems: 'center',
  },
  statusText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  readyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emergencyIcon: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  emergencyIconText: {
    fontSize: 80,
  },
  emergencyTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 38,
  },
  emergencySubtitle: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  emergencyButton: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 40,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  emergencyButtonText: {
    color: '#f44336',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  emergencyNote: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  activeContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  countdownContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  countdownText: {
    fontSize: 120,
    fontWeight: 'bold',
    color: '#ffffff',
    lineHeight: 120,
  },
  countdownLabel: {
    fontSize: 20,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '600',
  },
  alertTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 34,
  },
  alertSubtitle: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  progressContainer: {
    width: '100%',
    marginBottom: 30,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  cancelButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  cancelButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  backButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  backButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default EmergencyScreen;
