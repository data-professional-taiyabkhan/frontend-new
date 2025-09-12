import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { Button, Card, IconButton, ProgressBar } from 'react-native-paper';
import { MotiView, AnimatePresence } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';

const { width, height } = Dimensions.get('window');

const OnboardingScreen = ({ navigation, route }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [permissions, setPermissions] = useState({
    location: false,
    notifications: false,
    microphone: false,
  });
  const [loading, setLoading] = useState(false);
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef(null);

  const { user } = route.params || {};

  const steps = [
    {
      id: 1,
      title: 'Welcome to MummyHelp!',
      subtitle: 'Let\'s set up your safety profile',
      description: 'We\'ll help you configure the essential permissions and settings to keep you and your family safe.',
      icon: '👋',
      color: ['#667eea', '#764ba2'],
      action: null,
    },
    {
      id: 2,
      title: 'Location Access',
      subtitle: 'Enable location tracking',
      description: 'Allow MummyHelp to access your location so your family can find you in emergencies.',
      icon: '📍',
      color: ['#4facfe', '#00f2fe'],
      action: 'requestLocation',
      required: true,
    },
    {
      id: 3,
      title: 'Push Notifications',
      subtitle: 'Stay informed instantly',
      description: 'Receive emergency alerts, check-in confirmations, and important updates.',
      icon: '🔔',
      color: ['#43e97b', '#38f9d7'],
      action: 'requestNotifications',
      required: true,
    },
    {
      id: 4,
      title: 'Microphone Access',
      subtitle: 'Voice-activated safety',
      description: 'Enable voice commands for hands-free emergency alerts.',
      icon: '🎤',
      color: ['#f093fb', '#f5576c'],
      action: 'requestMicrophone',
      required: false,
    },
    {
      id: 5,
      title: 'You\'re All Set!',
      subtitle: 'Ready to stay safe',
      description: 'Your MummyHelp app is configured and ready to protect you and your family.',
      icon: '✅',
      color: ['#667eea', '#764ba2'],
      action: 'complete',
    },
  ];

  const requestLocationPermission = async () => {
    try {
      setLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      const backgroundStatus = await Location.requestBackgroundPermissionsAsync();
      
      if (status === 'granted' && backgroundStatus.status === 'granted') {
        setPermissions(prev => ({ ...prev, location: true }));
        return true;
      } else {
        Alert.alert(
          'Location Permission Required',
          'Location access is essential for emergency alerts. Please enable it in your device settings.',
          [{ text: 'OK' }]
        );
        return false;
      }
    } catch (error) {
      console.error('Location permission error:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const requestNotificationPermission = async () => {
    try {
      setLoading(true);
      const { status } = await Notifications.requestPermissionsAsync();
      
      if (status === 'granted') {
        setPermissions(prev => ({ ...prev, notifications: true }));
        return true;
      } else {
        Alert.alert(
          'Notification Permission Required',
          'Push notifications are essential for emergency alerts. Please enable them in your device settings.',
          [{ text: 'OK' }]
        );
        return false;
      }
    } catch (error) {
      console.error('Notification permission error:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const requestMicrophonePermission = async () => {
    try {
      setLoading(true);
      // For now, we'll simulate microphone permission
      // In a real app, you'd use expo-av or similar
      setTimeout(() => {
        setPermissions(prev => ({ ...prev, microphone: true }));
        setLoading(false);
      }, 1000);
      return true;
    } catch (error) {
      console.error('Microphone permission error:', error);
      setLoading(false);
      return false;
    }
  };

  const handleStepAction = async (action) => {
    if (!action) return;

    let success = false;
    
    switch (action) {
      case 'requestLocation':
        success = await requestLocationPermission();
        break;
      case 'requestNotifications':
        success = await requestNotificationPermission();
        break;
      case 'requestMicrophone':
        success = await requestMicrophonePermission();
        break;
      case 'complete':
        handleComplete();
        return;
    }

    if (success) {
      // Move to next step after a short delay
      setTimeout(() => {
        if (currentStep < steps.length - 1) {
          setCurrentStep(currentStep + 1);
        }
      }, 800);
    }
  };

  const handleComplete = () => {
    // Navigate to appropriate screen
    if (user?.role === 'child') {
      // For children, navigate to voice enrollment first
      navigation.replace('VoiceEnroll', { user });
    } else {
      // For mothers, go directly to dashboard
      navigation.replace('MotherDashboard');
    }
  };

  const handleSkip = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const getProgress = () => {
    return (currentStep + 1) / steps.length;
  };

  const currentStepData = steps[currentStep];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="light" />
      
      {/* Background Gradient */}
      <LinearGradient
        colors={currentStepData.color}
        style={styles.backgroundGradient}
      />

      {/* Header with Progress */}
      <View style={styles.header}>
        <MotiView
          from={{ opacity: 0, translateY: -20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'spring', damping: 20, stiffness: 100 }}
          style={styles.progressContainer}
        >
          <Text style={styles.progressText}>
            Step {currentStep + 1} of {steps.length}
          </Text>
          <ProgressBar
            progress={getProgress()}
            color="#ffffff"
            style={styles.progressBar}
          />
        </MotiView>
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        <AnimatePresence mode="wait">
          <MotiView
            key={currentStep}
            from={{ opacity: 0, scale: 0.8, translateX: 100 }}
            animate={{ opacity: 1, scale: 1, translateX: 0 }}
            exit={{ opacity: 0, scale: 0.8, translateX: -100 }}
            transition={{ type: 'spring', damping: 20, stiffness: 100 }}
            style={styles.stepContainer}
          >
            {/* Step Icon */}
            <MotiView
              from={{ scale: 0, rotate: '0deg' }}
              animate={{ scale: 1, rotate: '360deg' }}
              transition={{ type: 'spring', damping: 15, stiffness: 100, delay: 200 }}
              style={styles.iconContainer}
            >
              <Text style={styles.stepIcon}>{currentStepData.icon}</Text>
            </MotiView>

            {/* Step Content */}
            <MotiView
              from={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'spring', damping: 20, stiffness: 100, delay: 400 }}
              style={styles.stepContent}
            >
              <Text style={styles.stepTitle}>{currentStepData.title}</Text>
              <Text style={styles.stepSubtitle}>{currentStepData.subtitle}</Text>
              <Text style={styles.stepDescription}>{currentStepData.description}</Text>
            </MotiView>

            {/* Permission Status */}
            {currentStepData.action && currentStepData.action !== 'complete' && (
              <MotiView
                from={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', damping: 20, stiffness: 100, delay: 600 }}
                style={styles.permissionStatus}
              >
                <View style={styles.statusRow}>
                  <Text style={styles.statusLabel}>Status:</Text>
                  <View style={[
                    styles.statusIndicator,
                    { backgroundColor: permissions[currentStepData.action.replace('request', '').toLowerCase()] ? '#4caf50' : '#ff9800' }
                  ]}>
                    <Text style={styles.statusText}>
                      {permissions[currentStepData.action.replace('request', '').toLowerCase()] ? 'Granted' : 'Pending'}
                    </Text>
                  </View>
                </View>
              </MotiView>
            )}
          </MotiView>
        </AnimatePresence>
      </View>

      {/* Action Buttons */}
      <View style={styles.actions}>
        {currentStepData.action && currentStepData.action !== 'complete' ? (
          <MotiView
            from={{ opacity: 0, translateY: 50, scale: 0.8 }}
            animate={{ opacity: 1, translateY: 0, scale: 1 }}
            transition={{ type: 'spring', damping: 20, stiffness: 100, delay: 800 }}
          >
            <Button
              mode="contained"
              onPress={() => handleStepAction(currentStepData.action)}
              loading={loading}
              disabled={loading}
              style={styles.actionButton}
              contentStyle={styles.buttonContent}
              labelStyle={styles.buttonLabel}
              buttonColor="#ffffff"
              textColor={currentStepData.color[0]}
            >
              {loading ? 'Requesting...' : `Enable ${currentStepData.subtitle}`}
            </Button>
          </MotiView>
        ) : currentStepData.action === 'complete' ? (
          <MotiView
            from={{ opacity: 0, translateY: 50, scale: 0.8 }}
            animate={{ opacity: 1, translateY: 0, scale: 1 }}
            transition={{ type: 'spring', damping: 20, stiffness: 100, delay: 800 }}
          >
            <Button
              mode="contained"
              onPress={handleComplete}
              style={styles.actionButton}
              contentStyle={styles.buttonContent}
              labelStyle={styles.buttonLabel}
              buttonColor="#ffffff"
              textColor={currentStepData.color[0]}
            >
              Get Started
            </Button>
          </MotiView>
        ) : null}

        {/* Navigation Buttons */}
        <View style={styles.navigationButtons}>
          {currentStep > 0 && (
            <MotiView
              from={{ opacity: 0, translateX: -50 }}
              animate={{ opacity: 1, translateX: 0 }}
              transition={{ type: 'spring', damping: 20, stiffness: 100, delay: 1000 }}
            >
              <Button
                mode="outlined"
                onPress={handleBack}
                style={styles.navButton}
                textColor="#ffffff"
                outlineColor="#ffffff"
              >
                Back
              </Button>
            </MotiView>
          )}

          {currentStepData.action && currentStepData.action !== 'complete' && !currentStepData.required && (
            <MotiView
              from={{ opacity: 0, translateX: 50 }}
              animate={{ opacity: 1, translateX: 0 }}
              transition={{ type: 'spring', damping: 20, stiffness: 100, delay: 1000 }}
            >
              <Button
                mode="outlined"
                onPress={handleSkip}
                style={styles.navButton}
                textColor="#ffffff"
                outlineColor="#ffffff"
              >
                Skip
              </Button>
            </MotiView>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#667eea',
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
  progressContainer: {
    alignItems: 'center',
  },
  progressText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  progressBar: {
    width: '100%',
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  stepContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  stepIcon: {
    fontSize: 60,
  },
  stepContent: {
    alignItems: 'center',
    marginBottom: 30,
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 34,
  },
  stepSubtitle: {
    fontSize: 20,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    marginBottom: 16,
    fontWeight: '600',
    lineHeight: 26,
  },
  stepDescription: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  permissionStatus: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusLabel: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  statusIndicator: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  actions: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 20,
  },
  actionButton: {
    borderRadius: 16,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  buttonContent: {
    paddingVertical: 14,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: '700',
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  navButton: {
    borderRadius: 12,
    borderWidth: 2,
    minWidth: 100,
  },
});

export default OnboardingScreen;
