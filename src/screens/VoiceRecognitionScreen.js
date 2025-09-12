import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Alert,
  ScrollView,
  Platform,
} from 'react-native';
import { Button, Card, IconButton, ProgressBar } from 'react-native-paper';
import { MotiView, AnimatePresence } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Speech from 'expo-speech';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';

const { width, height } = Dimensions.get('window');

const VoiceRecognitionScreen = ({ navigation }) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [confidence, setConfidence] = useState(0);
  const [recording, setRecording] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [voiceCommands, setVoiceCommands] = useState([]);
  const [recordingPermission, setRecordingPermission] = useState(false);
  const insets = useSafeAreaInsets();

  const voiceCommandsList = [
    {
      command: 'Emergency',
      description: 'Activate emergency alert',
      action: () => navigation.navigate('Emergency', { isVoiceTriggered: true }),
      icon: '🚨',
      color: '#f44336',
    },
    {
      command: 'Check in',
      description: 'Send safe check-in',
      action: () => navigation.navigate('CheckIn'),
      icon: '✅',
      color: '#4caf50',
    },
    {
      command: 'Call mom',
      description: 'Call emergency contact',
      action: () => console.log('Calling mom...'),
      icon: '📞',
      color: '#2196f3',
    },
    {
      command: 'Where am I',
      description: 'Get current location',
      action: () => navigation.navigate('MapScreen'),
      icon: '📍',
      color: '#ff9800',
    },
    {
      command: 'Help',
      description: 'Get help and support',
      action: () => navigation.navigate('HelpSupport'),
      icon: '🆘',
      color: '#9c27b0',
    },
  ];

  useEffect(() => {
    checkPermissions();
    loadVoiceCommands();
  }, []);

  useEffect(() => {
    return () => {
      if (recording) {
        recording.unloadAsync();
      }
    };
  }, [recording]);

  const checkPermissions = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      setRecordingPermission(status === 'granted');
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Microphone permission is required for voice recognition.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Permission check error:', error);
    }
  };

  const loadVoiceCommands = async () => {
    try {
      const savedCommands = await AsyncStorage.getItem('voiceCommands');
      if (savedCommands) {
        setVoiceCommands(JSON.parse(savedCommands));
      } else {
        setVoiceCommands(voiceCommandsList);
      }
    } catch (error) {
      console.error('Error loading voice commands:', error);
      setVoiceCommands(voiceCommandsList);
    }
  };

  const startListening = async () => {
    if (!recordingPermission) {
      Alert.alert('Permission Required', 'Please grant microphone permission to use voice recognition.');
      return;
    }

    try {
      setIsListening(true);
      setTranscript('');
      setConfidence(0);
      setIsProcessing(false);

      // Trigger haptic feedback
      if (Platform.OS === 'ios') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } else {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }

      // Simulate voice recognition (in a real app, you'd use a speech recognition API)
      await simulateVoiceRecognition();

    } catch (error) {
      console.error('Voice recognition error:', error);
      Alert.alert('Error', 'Failed to start voice recognition. Please try again.');
      setIsListening(false);
    }
  };

  const stopListening = async () => {
    try {
      setIsListening(false);
      setIsProcessing(true);

      // Process the transcript
      await processTranscript();

    } catch (error) {
      console.error('Stop listening error:', error);
      setIsProcessing(false);
    }
  };

  const simulateVoiceRecognition = async () => {
    // Simulate listening for 3 seconds
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Simulate transcript
    const sampleTranscripts = [
      'Emergency',
      'Check in',
      'Call mom',
      'Where am I',
      'Help',
      'I need assistance',
      'Send location',
    ];
    
    const randomTranscript = sampleTranscripts[Math.floor(Math.random() * sampleTranscripts.length)];
    setTranscript(randomTranscript);
    setConfidence(Math.random() * 0.3 + 0.7); // 70-100% confidence
    
    // Auto-stop after getting transcript
    setTimeout(() => {
      stopListening();
    }, 1000);
  };

  const processTranscript = async () => {
    try {
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Find matching command
      const matchedCommand = voiceCommands.find(cmd => 
        transcript.toLowerCase().includes(cmd.command.toLowerCase())
      );

      if (matchedCommand) {
        // Execute the command
        matchedCommand.action();
        
        // Speak confirmation
        await Speech.speak(`Executing ${matchedCommand.command} command`, {
          language: 'en',
          pitch: 1.0,
          rate: 0.9,
        });
      } else {
        // No command matched
        await Speech.speak('Command not recognized. Please try again.', {
          language: 'en',
          pitch: 1.0,
          rate: 0.9,
        });
      }

    } catch (error) {
      console.error('Transcript processing error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const speakText = async (text) => {
    try {
      await Speech.speak(text, {
        language: 'en',
        pitch: 1.0,
        rate: 0.9,
      });
    } catch (error) {
      console.error('Speech error:', error);
    }
  };

  const VoiceCommandCard = ({ command, index }) => (
    <MotiView
      from={{ opacity: 0, translateX: -50 }}
      animate={{ opacity: 1, translateX: 0 }}
      transition={{ type: 'spring', damping: 20, stiffness: 100, delay: index * 100 }}
    >
      <TouchableOpacity
        style={[styles.commandCard, { borderLeftColor: command.color }]}
        onPress={command.action}
        activeOpacity={0.8}
      >
        <View style={styles.commandHeader}>
          <View style={styles.commandIcon}>
            <Text style={styles.commandIconText}>{command.icon}</Text>
          </View>
          <View style={styles.commandInfo}>
            <Text style={styles.commandText}>{command.command}</Text>
            <Text style={styles.commandDescription}>{command.description}</Text>
          </View>
          <IconButton
            icon="chevron-right"
            iconColor="#667eea"
            size={20}
          />
        </View>
      </TouchableOpacity>
    </MotiView>
  );

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
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <IconButton
            icon="arrow-left"
            iconColor="#ffffff"
            size={24}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Voice Recognition</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Voice Recognition Status */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'spring', damping: 20, stiffness: 100 }}
          style={styles.statusSection}
        >
          <Card style={styles.statusCard}>
            <Card.Content>
              <View style={styles.statusHeader}>
                <Text style={styles.statusTitle}>Voice Recognition</Text>
                <View style={[
                  styles.statusIndicator,
                  { backgroundColor: isListening ? '#4caf50' : isProcessing ? '#ff9800' : '#9e9e9e' }
                ]}>
                  <Text style={styles.statusText}>
                    {isListening ? 'Listening...' : isProcessing ? 'Processing...' : 'Ready'}
                  </Text>
                </View>
              </View>

              {/* Voice Button */}
              <View style={styles.voiceButtonContainer}>
                <TouchableOpacity
                  style={[
                    styles.voiceButton,
                    isListening && styles.voiceButtonListening,
                    isProcessing && styles.voiceButtonProcessing
                  ]}
                  onPress={isListening ? stopListening : startListening}
                  disabled={isProcessing}
                  activeOpacity={0.8}
                >
                  <MotiView
                    animate={{
                      scale: isListening ? [1, 1.1, 1] : 1,
                    }}
                    transition={{
                      type: 'timing',
                      duration: 1000,
                      loop: isListening,
                    }}
                  >
                    <Text style={styles.voiceButtonIcon}>
                      {isListening ? '🎤' : isProcessing ? '⏳' : '🎤'}
                    </Text>
                  </MotiView>
                  <Text style={styles.voiceButtonText}>
                    {isListening ? 'Tap to Stop' : isProcessing ? 'Processing...' : 'Tap to Speak'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Transcript Display */}
              {transcript && (
                <MotiView
                  from={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: 'spring', damping: 20, stiffness: 100 }}
                  style={styles.transcriptContainer}
                >
                  <Text style={styles.transcriptLabel}>You said:</Text>
                  <Text style={styles.transcriptText}>{transcript}</Text>
                  
                  {confidence > 0 && (
                    <View style={styles.confidenceContainer}>
                      <Text style={styles.confidenceLabel}>Confidence: {Math.round(confidence * 100)}%</Text>
                      <ProgressBar
                        progress={confidence}
                        color="#4caf50"
                        style={styles.confidenceBar}
                      />
                    </View>
                  )}
                </MotiView>
              )}
            </Card.Content>
          </Card>
        </MotiView>

        {/* Voice Commands */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'spring', damping: 20, stiffness: 100, delay: 200 }}
          style={styles.commandsSection}
        >
          <Text style={styles.sectionTitle}>Available Voice Commands</Text>
          {voiceCommands.map((command, index) => (
            <VoiceCommandCard key={command.command} command={command} index={index} />
          ))}
        </MotiView>

        {/* Tips Section */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'spring', damping: 20, stiffness: 100, delay: 400 }}
          style={styles.tipsSection}
        >
          <Text style={styles.sectionTitle}>Voice Recognition Tips</Text>
          <Card style={styles.tipsCard}>
            <Card.Content>
              <View style={styles.tipItem}>
                <Text style={styles.tipIcon}>💡</Text>
                <Text style={styles.tipText}>Speak clearly and at a normal pace</Text>
              </View>
              <View style={styles.tipItem}>
                <Text style={styles.tipIcon}>🔇</Text>
                <Text style={styles.tipText}>Ensure a quiet environment for better accuracy</Text>
              </View>
              <View style={styles.tipItem}>
                <Text style={styles.tipIcon}>🎯</Text>
                <Text style={styles.tipText}>Use simple, direct commands for best results</Text>
              </View>
              <View style={styles.tipItem}>
                <Text style={styles.tipIcon}>📱</Text>
                <Text style={styles.tipText}>Hold your device close to your mouth</Text>
              </View>
            </Card.Content>
          </Card>
        </MotiView>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 200,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  backButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  headerRight: {
    width: 48,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  statusSection: {
    marginBottom: 24,
  },
  statusCard: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statusTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  statusIndicator: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 100,
    alignItems: 'center',
  },
  statusText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  voiceButtonContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  voiceButton: {
    backgroundColor: '#667eea',
    borderRadius: 80,
    width: 160,
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  voiceButtonListening: {
    backgroundColor: '#4caf50',
    transform: [{ scale: 1.1 }],
  },
  voiceButtonProcessing: {
    backgroundColor: '#ff9800',
  },
  voiceButtonIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  voiceButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  transcriptContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#667eea',
  },
  transcriptLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7f8c8d',
    marginBottom: 8,
  },
  transcriptText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 12,
    fontStyle: 'italic',
  },
  confidenceContainer: {
    marginTop: 8,
  },
  confidenceLabel: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 8,
  },
  confidenceBar: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#e0e0e0',
  },
  commandsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 16,
    marginLeft: 4,
  },
  commandCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    borderLeftWidth: 4,
  },
  commandHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  commandIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  commandIconText: {
    fontSize: 24,
  },
  commandInfo: {
    flex: 1,
  },
  commandText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 2,
  },
  commandDescription: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  tipsSection: {
    marginBottom: 24,
  },
  tipsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  tipIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  tipText: {
    fontSize: 14,
    color: '#2c3e50',
    flex: 1,
    lineHeight: 20,
  },
});

export default VoiceRecognitionScreen;
