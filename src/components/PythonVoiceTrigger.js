import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import pythonVoiceService from '../services/pythonVoiceService';
import EmergencyCountdownModal from './EmergencyCountdownModal';

const PythonVoiceTrigger = ({ onEmergencyTriggered, autoStart = true, emergencyCountdownVisible = false }) => {
  const [isListening, setIsListening] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [status, setStatus] = useState('Disconnected');
  const [emergencyActive, setEmergencyActive] = useState(false);

  useEffect(() => {
    // Test API connection on mount
    testConnection();
    
    // Add listener for wake word detection
    pythonVoiceService.addListener(handleWakeWordDetected);
    
    // Auto-start if enabled
    if (autoStart) {
      // Start after a short delay to ensure connection is established
      const timer = setTimeout(() => {
        if (isConnected) {
          startListening();
        }
      }, 2000);
      
      return () => {
        clearTimeout(timer);
        pythonVoiceService.removeListener(handleWakeWordDetected);
        pythonVoiceService.stopDetection();
      };
    }
    
    return () => {
      // Cleanup
      pythonVoiceService.removeListener(handleWakeWordDetected);
      pythonVoiceService.stopDetection();
    };
  }, [autoStart, isConnected]);

  // Monitor emergency countdown state and reset status when dismissed
  useEffect(() => {
    if (!emergencyCountdownVisible && emergencyActive) {
      console.log('[PythonVoiceTrigger] Emergency countdown dismissed - resuming voice detection status');
      setEmergencyActive(false);
      if (isListening) {
        setStatus('Listening...');
      }
    }
  }, [emergencyCountdownVisible, emergencyActive, isListening]);

  const testConnection = async () => {
    try {
      setStatus('Testing connection...');
      const connected = await pythonVoiceService.testConnection();
      setIsConnected(connected);
      setStatus(connected ? 'Connected' : 'Disconnected');
    } catch (error) {
      console.error('Connection test failed:', error);
      setIsConnected(false);
      setStatus('Connection failed');
    }
  };

  const handleWakeWordDetected = () => {
    console.log('[PythonVoiceTrigger] Wake word detected!');
    // Don't stop listening - keep voice detection active
    setStatus('Processing...');
    setEmergencyActive(true);
    
    // Trigger emergency countdown
    if (onEmergencyTriggered) {
      onEmergencyTriggered();
    }
  };

  const startListening = async () => {
    if (!isConnected) {
      Alert.alert(
        'Connection Error',
        'Cannot connect to voice recognition service. Please check your internet connection.',
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      setIsListening(true);
      setStatus('Listening...');
      await pythonVoiceService.startDetection();
    } catch (error) {
      console.error('Error starting voice detection:', error);
      setIsListening(false);
      setStatus('Error starting');
      Alert.alert(
        'Error',
        'Failed to start voice detection. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const stopListening = async () => {
    try {
      setIsListening(false);
      setStatus('Stopped');
      await pythonVoiceService.stopDetection();
    } catch (error) {
      console.error('Error stopping voice detection:', error);
    }
  };

  const getStatusColor = () => {
    if (!isConnected) return '#ff4444';
    if (isListening) return '#00ff00';
    return '#ffaa00';
  };

  const getStatusIcon = () => {
    if (!isConnected) return 'cloud-offline-outline';
    if (isListening) return 'mic';
    return 'mic-off';
  };

  return (
    <View style={styles.container}>
      <View style={styles.statusContainer}>
        <Ionicons 
          name={getStatusIcon()} 
          size={20} 
          color={getStatusColor()} 
        />
        <Text style={[styles.statusText, { color: getStatusColor() }]}>
          {status}
        </Text>
      </View>
      
      <View style={styles.controlsContainer}>
        {autoStart ? (
          // Auto-start mode: Show status only
          <View style={styles.statusIndicator}>
            <Ionicons 
              name={isListening ? "mic" : "mic-off"} 
              size={24} 
              color={isListening ? "#28a745" : "#6c757d"} 
            />
            <Text style={[
              styles.statusIndicatorText, 
              { color: isListening ? "#28a745" : "#6c757d" }
            ]}>
              {isListening ? "Voice Active" : "Voice Inactive"}
            </Text>
          </View>
        ) : (
          // Manual mode: Show start/stop buttons
          <>
            {!isListening ? (
              <View style={styles.startButton} onTouchEnd={startListening}>
                <Ionicons name="mic" size={24} color="white" />
                <Text style={styles.buttonText}>Start Listening</Text>
              </View>
            ) : (
              <View style={styles.stopButton} onTouchEnd={stopListening}>
                <Ionicons name="stop" size={24} color="white" />
                <Text style={styles.buttonText}>Stop Listening</Text>
              </View>
            )}
          </>
        )}
      </View>
      
      <Text style={styles.instructionText}>
        Say "mummy help" to trigger emergency alert
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    marginVertical: 8,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statusText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
  },
  controlsContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  startButton: {
    backgroundColor: '#28a745',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  stopButton: {
    backgroundColor: '#dc3545',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  instructionText: {
    textAlign: 'center',
    fontSize: 14,
    color: '#6c757d',
    fontStyle: 'italic',
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#f8f9fa',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  statusIndicatorText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default PythonVoiceTrigger;
