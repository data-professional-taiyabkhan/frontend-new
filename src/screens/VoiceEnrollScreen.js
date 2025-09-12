import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Alert,
  Animated,
  Platform,
} from 'react-native';
import {
  Button,
  Card,
  IconButton,
  ProgressBar,
  ActivityIndicator,
  Paragraph,
  Title,
} from 'react-native-paper';
import { MotiView, AnimatePresence } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import * as Haptics from 'expo-haptics';
import { Linking } from 'react-native';
import { voiceAPI } from '../services/api';

const { width, height } = Dimensions.get('window');

const VoiceEnrollScreen = ({ navigation, route }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [recordings, setRecordings] = useState([]);
  const [recording, setRecording] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [qualityChecks, setQualityChecks] = useState([]);
  const insets = useSafeAreaInsets();
  
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const { user } = route.params || {};

  const REQUIRED_SAMPLES = 5;
  const TARGET_DURATION = 1200; // 1.2 seconds in ms
  const MIN_DURATION = 800; // 0.8 seconds minimum
  const MAX_DURATION = 2000; // 2 seconds maximum

  useEffect(() => {
    requestAudioPermissions();
    return () => {
      // Cleanup any ongoing recordings
      if (recording) {
        recording.stopAndUnloadAsync();
      }
    };
  }, []);

  useEffect(() => {
    // Pulse animation for recording button
    if (isRecording) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isRecording]);

  const requestAudioPermissions = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'We need microphone access to enroll your voice for the "Mummy Help" alert.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Settings', onPress: () => Linking.openSettings() },
          ]
        );
        return false;
      }
      
      // Configure audio settings
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
      
      return true;
    } catch (error) {
      console.error('Error requesting audio permissions:', error);
      return false;
    }
  };

  const startRecording = async () => {
    try {
      setIsRecording(true);
      setRecordingDuration(0);
      
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const recordingOptions = {
        android: {
          extension: '.wav',
          outputFormat: Audio.RECORDING_OPTION_ANDROID_OUTPUT_FORMAT_DEFAULT,
          audioEncoder: Audio.RECORDING_OPTION_ANDROID_AUDIO_ENCODER_DEFAULT,
          sampleRate: 16000,
          numberOfChannels: 1,
          bitRate: 128000,
        },
        ios: {
          extension: '.wav',
          audioQuality: Audio.RECORDING_OPTION_IOS_AUDIO_QUALITY_HIGH,
          sampleRate: 16000,
          numberOfChannels: 1,
          bitRate: 128000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
        web: {
          mimeType: 'audio/wav',
          bitsPerSecond: 128000,
        },
      };

      const { recording: newRecording } = await Audio.Recording.createAsync(
        recordingOptions
      );
      setRecording(newRecording);

      // Start duration timer
      const timer = setInterval(() => {
        setRecordingDuration(prev => {
          const newDuration = prev + 100;
          // Auto-stop at max duration
          if (newDuration >= MAX_DURATION) {
            stopRecording();
            clearInterval(timer);
          }
          return newDuration;
        });
      }, 100);

      // Auto-stop after target duration
      setTimeout(() => {
        if (isRecording) {
          stopRecording();
        }
        clearInterval(timer);
      }, TARGET_DURATION);

    } catch (error) {
      console.error('Failed to start recording:', error);
      setIsRecording(false);
      Alert.alert('Recording Error', 'Failed to start recording. Please try again.');
    }
  };

  const stopRecording = async () => {
    try {
      if (!recording) return;

      setIsRecording(false);
      await recording.stopAndUnloadAsync();
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      const uri = recording.getURI();
      const duration = recordingDuration;

      // Basic quality check
      const qualityScore = calculateQualityScore(duration);
      const passed = qualityScore.score >= 3;

      const newRecording = {
        uri,
        duration,
        quality: qualityScore,
        passed,
        timestamp: Date.now(),
      };

      if (passed) {
        setRecordings(prev => [...prev, newRecording]);
        setQualityChecks(prev => [...prev, qualityScore]);
        
        if (recordings.length + 1 < REQUIRED_SAMPLES) {
          setCurrentStep(prev => prev + 1);
        }
      } else {
        Alert.alert(
          'Recording Quality',
          `${qualityScore.message}\n\nPlease try again with a clear voice in a quiet environment.`,
          [{ text: 'Try Again', onPress: () => setRecording(null) }]
        );
      }

      setRecording(null);
      setRecordingDuration(0);

    } catch (error) {
      console.error('Failed to stop recording:', error);
      setIsRecording(false);
      Alert.alert('Recording Error', 'Failed to save recording. Please try again.');
    }
  };

  const calculateQualityScore = (duration) => {
    let score = 0;
    let issues = [];

    // Duration check
    if (duration < MIN_DURATION) {
      issues.push('Recording too short');
    } else if (duration > MAX_DURATION) {
      issues.push('Recording too long');
    } else {
      score += 2;
    }

    // Duration accuracy (closer to target gets higher score)
    const durationAccuracy = 1 - Math.abs(duration - TARGET_DURATION) / TARGET_DURATION;
    if (durationAccuracy > 0.8) score += 2;
    else if (durationAccuracy > 0.6) score += 1;

    // Basic amplitude check (would need actual audio analysis for real implementation)
    // For now, assume good quality if duration is acceptable
    if (duration >= MIN_DURATION && duration <= MAX_DURATION) {
      score += 1;
    }

    let message = '';
    if (score >= 4) message = 'Excellent quality recording!';
    else if (score >= 3) message = 'Good quality recording.';
    else if (score >= 2) message = 'Recording quality could be better.';
    else message = 'Poor recording quality.';

    if (issues.length > 0) {
      message += ` Issues: ${issues.join(', ')}.`;
    }

    return { score, message, issues, durationAccuracy };
  };

  const retryRecording = (index) => {
    const newRecordings = [...recordings];
    newRecordings.splice(index, 1);
    setRecordings(newRecordings);
    
    const newQualityChecks = [...qualityChecks];
    newQualityChecks.splice(index, 1);
    setQualityChecks(newQualityChecks);
    
    setCurrentStep(index);
  };

  const enrollVoice = async () => {
    if (recordings.length < REQUIRED_SAMPLES) {
      Alert.alert('Incomplete', `Please complete all ${REQUIRED_SAMPLES} recordings first.`);
      return;
    }

    setEnrolling(true);
    setLoading(true);

    try {
      // Prepare form data
      const formData = new FormData();
      
      for (let i = 0; i < recordings.length; i++) {
        const recording = recordings[i];
        
        // Read file as blob
        const response = await fetch(recording.uri);
        const blob = await response.blob();
        
        formData.append('samples', {
          uri: recording.uri,
          name: `sample_${i + 1}.wav`,
          type: 'audio/wav',
        });
      }

      // Add device ID if available
      const deviceId = await getDeviceId();
      if (deviceId) {
        formData.append('deviceId', deviceId);
      }

      const result = await voiceAPI.enroll(formData);

      if (result.success) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        
        Alert.alert(
          'Voice Enrollment Successful!',
          'Your voice has been enrolled successfully. You can now use "Mummy Help" voice commands.',
          [
            {
              text: 'Continue',
              onPress: () => {
                // Navigate to child dashboard or next step
                navigation.replace('ChildDashboard');
              },
            },
          ]
        );
      } else {
        throw new Error(result.message || 'Enrollment failed');
      }

    } catch (error) {
      console.error('Voice enrollment error:', error);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      
      Alert.alert(
        'Enrollment Failed',
        error.message || 'Failed to enroll voice. Please check your internet connection and try again.',
        [
          { text: 'Retry', onPress: () => setEnrolling(false) },
          { text: 'Skip for Now', onPress: () => navigation.replace('ChildDashboard') },
        ]
      );
    } finally {
      setLoading(false);
      setEnrolling(false);
    }
  };

  const getDeviceId = async () => {
    try {
      // You might want to use expo-device or another method to get a unique device ID
      return Platform.OS + '_' + Date.now();
    } catch (error) {
      console.error('Failed to get device ID:', error);
      return null;
    }
  };

  const skipEnrollment = () => {
    Alert.alert(
      'Skip Voice Enrollment',
      'You can enroll your voice later in Settings. Without voice enrollment, you won\'t be able to use "Mummy Help" voice alerts.',
      [
        { text: 'Go Back', style: 'cancel' },
        {
          text: 'Skip',
          style: 'destructive',
          onPress: () => navigation.replace('ChildDashboard'),
        },
      ]
    );
  };

  const renderStepContent = () => {
    if (currentStep < REQUIRED_SAMPLES) {
      return (
        <View style={styles.stepContainer}>
          <MotiView
            from={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', damping: 15 }}
          >
            <Card style={styles.recordingCard}>
              <Card.Content>
                <Title style={styles.stepTitle}>
                  Recording {currentStep + 1} of {REQUIRED_SAMPLES}
                </Title>
                <Paragraph style={styles.stepDescription}>
                  Say "Mummy Help" clearly into your microphone.
                  {'\n\n'}Target duration: 1-2 seconds
                </Paragraph>

                {/* Recording Button */}
                <View style={styles.recordingButtonContainer}>
                  <Animated.View
                    style={[
                      styles.recordingButton,
                      {
                        transform: [{ scale: pulseAnim }],
                        backgroundColor: isRecording ? '#ff4757' : '#2ed573',
                      },
                    ]}
                  >
                    <TouchableOpacity
                      style={styles.recordingButtonTouch}
                      onPress={isRecording ? stopRecording : startRecording}
                      disabled={loading}
                    >
                      <IconButton
                        icon={isRecording ? 'stop' : 'microphone'}
                        size={40}
                        iconColor="white"
                      />
                    </TouchableOpacity>
                  </Animated.View>
                </View>

                {/* Recording Timer */}
                {isRecording && (
                  <MotiView
                    from={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    style={styles.timerContainer}
                  >
                    <Text style={styles.timerText}>
                      {(recordingDuration / 1000).toFixed(1)}s
                    </Text>
                    <ProgressBar
                      progress={Math.min(recordingDuration / TARGET_DURATION, 1)}
                      color="#2ed573"
                      style={styles.progressBar}
                    />
                  </MotiView>
                )}

                {/* Instructions */}
                <View style={styles.instructionsContainer}>
                  <Text style={styles.instructionText}>
                    {isRecording
                      ? '🎤 Say "Mummy Help" now...'
                      : '👆 Tap the microphone to start recording'}
                  </Text>
                </View>
              </Card.Content>
            </Card>
          </MotiView>

          {/* Completed Recordings */}
          {recordings.length > 0 && (
            <MotiView
              from={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ delay: 300 }}
              style={styles.completedContainer}
            >
              <Text style={styles.completedTitle}>Completed Recordings:</Text>
              {recordings.map((rec, index) => (
                <View key={index} style={styles.recordingItem}>
                  <IconButton icon="check-circle" size={20} iconColor="#2ed573" />
                  <Text style={styles.recordingItemText}>
                    Recording {index + 1} - {(rec.duration / 1000).toFixed(1)}s
                  </Text>
                  <TouchableOpacity onPress={() => retryRecording(index)}>
                    <IconButton icon="refresh" size={16} iconColor="#ff6b6b" />
                  </TouchableOpacity>
                </View>
              ))}
            </MotiView>
          )}
        </View>
      );
    } else {
      // Enrollment summary
      return (
        <View style={styles.summaryContainer}>
          <MotiView
            from={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', damping: 15 }}
          >
            <Card style={styles.summaryCard}>
              <Card.Content>
                <Title style={styles.summaryTitle}>Ready to Enroll!</Title>
                <Paragraph style={styles.summaryDescription}>
                  You've completed all {REQUIRED_SAMPLES} recordings. 
                  {'\n\n'}We'll now process your voice samples to create your unique voiceprint.
                </Paragraph>

                <View style={styles.summaryStats}>
                  <Text style={styles.statItem}>
                    ✅ {recordings.length} recordings completed
                  </Text>
                  <Text style={styles.statItem}>
                    📊 Average quality: {
                      Math.round(
                        qualityChecks.reduce((sum, q) => sum + q.score, 0) / qualityChecks.length
                      )
                    }/5
                  </Text>
                </View>

                <Button
                  mode="contained"
                  onPress={enrollVoice}
                  loading={enrolling}
                  disabled={loading}
                  style={styles.enrollButton}
                  contentStyle={styles.enrollButtonContent}
                >
                  {enrolling ? 'Processing...' : 'Enroll My Voice'}
                </Button>
              </Card.Content>
            </Card>
          </MotiView>
        </View>
      );
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="light" />
      
      {/* Background Gradient */}
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.backgroundGradient}
      />

      {/* Header */}
      <View style={styles.header}>
        <IconButton
          icon="arrow-left"
          size={24}
          iconColor="white"
          onPress={() => navigation.goBack()}
        />
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>Voice Enrollment</Text>
          <Text style={styles.headerSubtitle}>Set up "Mummy Help" voice alerts</Text>
        </View>
        <TouchableOpacity onPress={skipEnrollment}>
          <Text style={styles.skipButton}>Skip</Text>
        </TouchableOpacity>
      </View>

      {/* Progress */}
      <View style={styles.progressContainer}>
        <ProgressBar
          progress={(currentStep + (recordings.length > 0 ? 1 : 0)) / (REQUIRED_SAMPLES + 1)}
          color="white"
          style={styles.progressBarHeader}
        />
        <Text style={styles.progressText}>
          Step {Math.min(currentStep + 1, REQUIRED_SAMPLES)} of {REQUIRED_SAMPLES}
        </Text>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {renderStepContent()}
      </View>

      {/* Loading Overlay */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="white" />
          <Text style={styles.loadingText}>
            {enrolling ? 'Processing your voice...' : 'Loading...'}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTextContainer: {
    flex: 1,
    marginLeft: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  skipButton: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  progressContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  progressBarHeader: {
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  progressText: {
    color: 'white',
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  stepContainer: {
    flex: 1,
  },
  recordingCard: {
    borderRadius: 16,
    elevation: 8,
    backgroundColor: 'white',
  },
  stepTitle: {
    textAlign: 'center',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#2c3e50',
  },
  stepDescription: {
    textAlign: 'center',
    fontSize: 16,
    color: '#7f8c8d',
    marginBottom: 24,
  },
  recordingButtonContainer: {
    alignItems: 'center',
    marginVertical: 24,
  },
  recordingButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  recordingButtonTouch: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 60,
  },
  timerContainer: {
    alignItems: 'center',
    marginTop: 16,
  },
  timerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
  },
  progressBar: {
    width: 200,
    height: 8,
    borderRadius: 4,
  },
  instructionsContainer: {
    marginTop: 16,
    alignItems: 'center',
  },
  instructionText: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
  },
  completedContainer: {
    marginTop: 24,
  },
  completedTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 12,
  },
  recordingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
  },
  recordingItemText: {
    flex: 1,
    marginLeft: 8,
    color: '#2c3e50',
  },
  summaryContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  summaryCard: {
    borderRadius: 16,
    elevation: 8,
    backgroundColor: 'white',
  },
  summaryTitle: {
    textAlign: 'center',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#2c3e50',
  },
  summaryDescription: {
    textAlign: 'center',
    fontSize: 16,
    color: '#7f8c8d',
    marginBottom: 24,
  },
  summaryStats: {
    marginBottom: 24,
  },
  statItem: {
    fontSize: 16,
    color: '#2c3e50',
    marginBottom: 8,
    textAlign: 'center',
  },
  enrollButton: {
    borderRadius: 8,
  },
  enrollButtonContent: {
    paddingVertical: 8,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: 'white',
    fontSize: 16,
    marginTop: 16,
  },
});

export default VoiceEnrollScreen;
