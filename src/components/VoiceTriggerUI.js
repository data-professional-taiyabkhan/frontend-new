import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Card, ProgressBar, Button, Modal } from 'react-native-paper';
import { MotiView } from 'moti';
import voiceTrigger from '../features/voice/voiceTrigger';
import voiceRecognition from '../features/voice/voiceRecognition';
import voiceCommands from '../features/voice/voiceCommands';
import alertHandlers from '../features/alerts/alertHandlers';
import ConfirmModal from './ConfirmModal';
import VoiceSettingsUI from './VoiceSettingsUI';

export default function VoiceTriggerUI() {
  const [hitStatus, setHitStatus] = useState({ count: 0, required: 3, timeLeft: 0, progress: 0 });
  const [isListening, setIsListening] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [alertResult, setAlertResult] = useState(null);
  const [commandHistory, setCommandHistory] = useState([]);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const hitCountRef = useRef(0);

  useEffect(() => {
    const initializeVoiceSystems = async () => {
      try {
        // Initialize voice trigger system
        await voiceTrigger.init(
          handleSingleHit,
          handleEmergency
        );

        // Initialize voice recognition system
        voiceRecognition.init(
          handleVoiceTextDetected,
          handleVoiceError,
          handleVoiceStatusChange
        );

        // Initialize voice commands system
        voiceCommands.setCommandCallback(handleCommandExecuted);

        // Start voice recognition
        startVoiceRecognition();

        // Set up periodic status updates
        const statusInterval = setInterval(updateStatus, 1000);

        return () => {
          clearInterval(statusInterval);
          voiceTrigger.stopListening();
          voiceRecognition.cleanup();
        };
      } catch (error) {
        console.error('Error initializing voice systems:', error);
      }
    };

    initializeVoiceSystems();
  }, []);

  // Update voice trigger status
  const updateStatus = () => {
    const status = voiceTrigger.getStatus();
    setHitStatus(status.hitStatus);
    setIsListening(status.isListening);
  };

  // Start voice recognition
  const startVoiceRecognition = async () => {
    try {
      const started = await voiceRecognition.startListening();
      if (started) {
        setIsListening(true);
        console.log('🎤 Voice recognition started');
      }
    } catch (error) {
      console.error('🎤 Error starting voice recognition:', error);
    }
  };

  // Stop voice recognition
  const stopVoiceRecognition = async () => {
    try {
      const stopped = await voiceRecognition.stopListening();
      if (stopped) {
        setIsListening(false);
        console.log('🎤 Voice recognition stopped');
      }
    } catch (error) {
      console.error('🎤 Error stopping voice recognition:', error);
    }
  };

  // Handle voice text detected
  const handleVoiceTextDetected = (text) => {
    console.log('🎤 Voice text detected:', text);
    
    // First check if it's a wake phrase
    voiceTrigger.processText(text);
    
    // Then process as a voice command
    voiceCommands.processVoiceInput(text);
  };

  // Handle voice error
  const handleVoiceError = (error) => {
    console.error('🎤 Voice recognition error:', error);
  };

  // Handle voice status change
  const handleVoiceStatusChange = (status) => {
    console.log('🎤 Voice recognition status:', status);
    setIsListening(status.isListening);
  };

  // Handle command executed
  const handleCommandExecuted = (result) => {
    console.log('🎤 Command executed:', result);
    
    // Add to command history
    const historyEntry = {
      ...result,
      timestamp: new Date().toISOString(),
      id: Date.now()
    };
    
    setCommandHistory(prev => [historyEntry, ...prev.slice(0, 9)]); // Keep last 10 commands
    
    // Handle specific command results
    if (result.type === 'emergency' || result.type === 'emergency_success') {
      // Emergency command detected - trigger voice trigger
      voiceTrigger.processText('mummy help');
    } else if (result.type === 'stopVoice') {
      stopVoiceRecognition();
    } else if (result.type === 'startVoice') {
      startVoiceRecognition();
    }
  };

  // Handle single hit wake phrase
  const handleSingleHit = () => {
    console.log('🎤 Single hit handler called');
    setShowConfirmModal(true);
  };

  // Handle emergency threshold reached
  const handleEmergency = async () => {
    console.log('🚨 Emergency handler called');
    
    try {
      const result = await alertHandlers.handleEmergency();
      setAlertResult(result);
      
      // Show result for 3 seconds
      setTimeout(() => setAlertResult(null), 3000);
      
      console.log('🚨 Emergency result:', result);
    } catch (error) {
      console.error('🚨 Emergency handler error:', error);
    }
  };

  // Handle user confirmation
  const handleConfirm = async () => {
    setShowConfirmModal(false);
    
    try {
      const result = await alertHandlers.handleEmergencyConfirmed();
      setAlertResult(result);
      
      // Show result for 3 seconds
      setTimeout(() => setAlertResult(null), 3000);
      
      console.log('✅ Confirmation result:', result);
    } catch (error) {
      console.error('✅ Confirmation error:', error);
    }
  };

  // Handle user cancellation
  const handleCancel = () => {
    setShowConfirmModal(false);
    alertHandlers.handleEmergencyCancelled();
  };

  // Test wake phrase detection
  const testWakePhrase = (phrase) => {
    voiceTrigger.testWakePhrase(phrase);
  };

  // Test multiple hits
  const testMultipleHits = () => {
    voiceTrigger.testMultipleHits();
  };

  // Reset voice trigger
  const resetVoiceTrigger = () => {
    voiceTrigger.resetHits();
    updateStatus();
  };

  // Animate pulse when hit count changes
  useEffect(() => {
    if (hitStatus.count !== hitCountRef.current) {
      hitCountRef.current = hitStatus.count;
      
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [hitStatus.count]);

  return (
    <View style={styles.container}>
      {/* Voice Status Card */}
      <Card style={styles.statusCard}>
        <Card.Content>
          <View style={styles.headerRow}>
            <Text style={styles.title}>🎤 Voice Trigger</Text>
            <View style={styles.headerControls}>
              <View style={[
                styles.statusIndicator,
                { backgroundColor: isListening ? '#27ae60' : '#e74c3c' }
              ]} />
              <Button
                mode="text"
                onPress={() => setShowSettingsModal(true)}
                icon="cog"
                compact
                textColor="#3498db"
              >
                Settings
              </Button>
            </View>
          </View>

          {/* Hit Counter */}
          <View style={styles.hitCounterContainer}>
            <Animated.View style={[styles.hitCounter, { transform: [{ scale: pulseAnim }] }]}>
              <Text style={styles.hitCount}>{hitStatus.count}</Text>
              <Text style={styles.hitLabel}>hits</Text>
            </Animated.View>
            
            <View style={styles.hitInfo}>
              <Text style={styles.hitRequired}>of {hitStatus.required} required</Text>
              <Text style={styles.hitTimeLeft}>
                {hitStatus.timeLeft > 0 ? `${Math.ceil(hitStatus.timeLeft / 1000)}s left` : 'Window expired'}
              </Text>
            </View>
          </View>

          {/* Progress Bar */}
          <ProgressBar 
            progress={hitStatus.progress} 
            color={hitStatus.isEmergencyReady ? '#e74c3c' : '#3498db'}
            style={styles.progressBar}
          />

          {/* Status Text */}
          <Text style={[
            styles.statusText,
            { color: hitStatus.isEmergencyReady ? '#e74c3c' : '#666' }
          ]}>
            {hitStatus.isEmergencyReady 
              ? '🚨 Emergency Ready!' 
              : `${hitStatus.required - hitStatus.count} more hits needed`
            }
          </Text>
        </Card.Content>
      </Card>

      {/* Wake Phrases */}
      <Card style={styles.phrasesCard}>
        <Card.Content>
          <Text style={styles.phrasesTitle}>Wake Phrases:</Text>
          <View style={styles.phrasesList}>
            {voiceTrigger.wakePhrases.map((phrase, index) => (
              <Text key={index} style={styles.phrase}>• "{phrase}"</Text>
            ))}
          </View>
        </Card.Content>
      </Card>

                {/* Voice Recognition Controls */}
          <Card style={styles.voiceCard}>
            <Card.Content>
              <Text style={styles.voiceTitle}>🎤 Voice Recognition</Text>
              
              <View style={styles.voiceControls}>
                <Button 
                  mode="contained" 
                  onPress={isListening ? stopVoiceRecognition : startVoiceRecognition}
                  style={[styles.voiceButton, { backgroundColor: isListening ? '#e74c3c' : '#27ae60' }]}
                  buttonColor={isListening ? '#e74c3c' : '#27ae60'}
                  textColor="#ffffff"
                  compact
                >
                  {isListening ? 'Stop Listening' : 'Start Listening'}
                </Button>
                
                <Button 
                  mode="outlined" 
                  onPress={() => voiceRecognition.testVoiceRecognition()}
                  style={styles.testVoiceButton}
                  compact
                >
                  Test Voice
                </Button>
              </View>
              
              <Text style={styles.voiceStatus}>
                Status: {isListening ? '🟢 Listening' : '🔴 Stopped'}
              </Text>
            </Card.Content>
          </Card>

          {/* Command History */}
          {commandHistory.length > 0 && (
            <Card style={styles.historyCard}>
              <Card.Content>
                <View style={styles.historyHeaderRow}>
                  <Text style={styles.historyTitle}>📝 Recent Commands</Text>
                  <Button 
                    mode="text" 
                    onPress={() => setCommandHistory([])}
                    compact
                    textColor="#e74c3c"
                  >
                    Clear
                  </Button>
                </View>
                <View style={styles.historyList}>
                  {commandHistory.map((command) => (
                    <View key={command.id} style={styles.historyItem}>
                      <View style={styles.historyHeader}>
                        <Text style={styles.historyCommand}>
                          "{command.input}"
                        </Text>
                        <Text style={[
                          styles.historyStatus,
                          { color: command.type.includes('success') ? '#27ae60' : command.type.includes('failed') ? '#e74c3c' : '#666' }
                        ]}>
                          {command.type.includes('success') ? '✅' : command.type.includes('failed') ? '❌' : '🔄'}
                        </Text>
                      </View>
                      <Text style={styles.historyMessage}>
                        {command.message}
                      </Text>
                      <Text style={styles.historyTime}>
                        {new Date(command.timestamp).toLocaleTimeString()}
                      </Text>
                    </View>
                  ))}
                </View>
              </Card.Content>
            </Card>
          )}

          {/* Test Controls */}
          <Card style={styles.testCard}>
            <Card.Content>
              <Text style={styles.testTitle}>🧪 Test Controls</Text>
              
              <View style={styles.testButtons}>
                <Button 
                  mode="outlined" 
                  onPress={() => testWakePhrase('mummy help')}
                  style={styles.testButton}
                  compact
                >
                  Test "mummy help"
                </Button>
                
                <Button 
                  mode="outlined" 
                  onPress={testMultipleHits}
                  style={styles.testButton}
                  compact
                >
                  Test 3 Hits
                </Button>
              </View>
              
              <Button 
                mode="outlined" 
                onPress={resetVoiceTrigger}
                style={styles.resetButton}
                compact
              >
                Reset Counter
              </Button>
            </Card.Content>
          </Card>

      {/* Alert Result */}
      {alertResult && (
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          exit={{ opacity: 0, translateY: -20 }}
          style={[
            styles.alertResult,
            { backgroundColor: alertResult.type.includes('success') ? '#d4edda' : '#f8d7da' }
          ]}
        >
          <Text style={[
            styles.alertResultText,
            { color: alertResult.type.includes('success') ? '#155724' : '#721c24' }
          ]}>
            {alertResult.message}
          </Text>
        </MotiView>
      )}

      {/* Confirmation Modal */}
      <ConfirmModal
        visible={showConfirmModal}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        timeoutMs={5000}
      />

      {/* Settings Modal */}
      <Modal
        visible={showSettingsModal}
        onDismiss={() => setShowSettingsModal(false)}
        contentContainerStyle={styles.settingsModal}
      >
        <VoiceSettingsUI />
        <Button
          mode="contained"
          onPress={() => setShowSettingsModal(false)}
          style={styles.closeSettingsButton}
        >
          Close Settings
        </Button>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 16,
  },
  statusCard: {
    elevation: 4,
    borderRadius: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2c3e50',
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  hitCounterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  hitCounter: {
    alignItems: 'center',
    marginRight: 16,
  },
  hitCount: {
    fontSize: 32,
    fontWeight: '800',
    color: '#e74c3c',
  },
  hitLabel: {
    fontSize: 12,
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  hitInfo: {
    flex: 1,
  },
  hitRequired: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
  },
  hitTimeLeft: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    marginBottom: 12,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  phrasesCard: {
    elevation: 2,
    borderRadius: 12,
  },
  phrasesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 12,
  },
  phrasesList: {
    gap: 8,
  },
  phrase: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  testCard: {
    elevation: 2,
    borderRadius: 12,
  },
  testTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 16,
  },
  testButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  testButton: {
    flex: 1,
  },
  resetButton: {
    borderColor: '#e74c3c',
  },
  voiceCard: {
    elevation: 2,
    borderRadius: 12,
  },
  voiceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 16,
  },
  voiceControls: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  voiceButton: {
    flex: 1,
  },
  testVoiceButton: {
    flex: 1,
  },
  voiceStatus: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    fontWeight: '500',
  },
  historyCard: {
    elevation: 2,
    borderRadius: 12,
  },
  historyHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
  },
  historyList: {
    gap: 12,
  },
  historyItem: {
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#3498db',
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  historyCommand: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    fontStyle: 'italic',
    flex: 1,
  },
  historyStatus: {
    fontSize: 16,
    fontWeight: '600',
  },
  historyMessage: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  historyTime: {
    fontSize: 10,
    color: '#999',
    textAlign: 'right',
  },
  alertResult: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    padding: 16,
    borderRadius: 8,
    elevation: 8,
  },
  alertResultText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  settingsModal: {
    backgroundColor: '#fff',
    margin: 20,
    borderRadius: 12,
    flex: 1,
  },
  closeSettingsButton: {
    margin: 16,
  },
});
