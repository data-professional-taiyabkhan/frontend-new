import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { Card, Switch, Button, IconButton, Chip } from 'react-native-paper';
import { MotiView } from 'moti';
import voiceController from '../services/voiceController';
import { VOICE_CONFIG } from '../config/voice';

export default function VoiceControlUI() {
  const [voiceStatus, setVoiceStatus] = useState('idle');
  const [isEnabled, setIsEnabled] = useState(false);
  const [hasEnrollment, setHasEnrollment] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Subscribe to voice controller events
    const unsubscribe = voiceController.addListener(handleVoiceEvent);
    
    // Get initial status
    updateStatus();
    
    return unsubscribe;
  }, []);

  const handleVoiceEvent = (event, data) => {
    switch (event) {
      case 'started':
        setIsEnabled(true);
        setVoiceStatus('listening');
        break;
      case 'stopped':
        setIsEnabled(false);
        setVoiceStatus('idle');
        break;
      case 'wakeDetected':
        setVoiceStatus('processing');
        break;
      case 'verificationProgress':
        setVoiceStatus('verifying');
        break;
      case 'verificationFailed':
        setVoiceStatus('listening');
        break;
      case 'confirmModalShown':
        setVoiceStatus('confirming');
        break;
      case 'alertTriggered':
      case 'alertCancelled':
        setVoiceStatus('listening');
        break;
      case 'error':
        setVoiceStatus('error');
        break;
      default:
        break;
    }
  };

  const updateStatus = async () => {
    try {
      const status = voiceController.getStatus();
      setIsEnabled(status.isEnabled);
      setHasEnrollment(status.hasVoiceprint);
      
      if (status.isEnabled) {
        setVoiceStatus('listening');
      } else {
        setVoiceStatus('idle');
      }
    } catch (error) {
      console.error('Error getting voice status:', error);
    }
  };

  const handleToggle = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      if (isEnabled) {
        await voiceController.stop();
      } else {
        if (!hasEnrollment) {
          Alert.alert(
            'Voice Not Enrolled',
            'You need to enroll your voice first to use "Mummy Help" voice alerts.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Enroll Now', onPress: handleReEnroll },
            ]
          );
          return;
        }
        await voiceController.start();
      }
    } catch (error) {
      console.error('Error toggling voice:', error);
      Alert.alert('Error', 'Failed to toggle voice detection');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReEnroll = async () => {
    try {
      await voiceController.reEnrollVoice();
    } catch (error) {
      console.error('Error starting re-enrollment:', error);
      Alert.alert('Error', 'Failed to start voice re-enrollment');
    }
  };

  const handleTest = async () => {
    if (__DEV__) {
      await voiceController.testVoicePipeline();
    }
  };

  const getStatusDescription = () => {
    switch (voiceStatus) {
      case 'listening':
        return 'Listening for "Mummy Help"';
      case 'processing':
        return 'Wake word detected';
      case 'verifying':
        return 'Verifying voice...';
      case 'confirming':
        return 'Waiting for confirmation';
      case 'error':
        return 'Error occurred';
      case 'idle':
      default:
        return hasEnrollment ? 'Voice detection off' : 'Voice not enrolled';
    }
  };

  const getStatusColor = () => {
    switch (voiceStatus) {
      case 'listening':
        return VOICE_CONFIG.UI.COLORS.SUCCESS;
      case 'processing':
      case 'verifying':
        return VOICE_CONFIG.UI.COLORS.WARNING;
      case 'confirming':
        return VOICE_CONFIG.UI.COLORS.PRIMARY;
      case 'error':
        return VOICE_CONFIG.UI.COLORS.ERROR;
      case 'idle':
      default:
        return '#757575';
    }
  };

  return (
    <MotiView
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 300 }}
    >
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.header}>
            <View style={styles.titleContainer}>
              <Text style={styles.title}>Voice Control</Text>
              <Chip 
                icon={voiceStatus === 'listening' ? 'microphone' : 'microphone-off'}
                style={[styles.statusChip, { backgroundColor: getStatusColor() + '20' }]}
                textStyle={[styles.statusText, { color: getStatusColor() }]}
                compact
              >
                {getStatusDescription()}
              </Chip>
            </View>
            
            <Switch
              value={isEnabled}
              onValueChange={handleToggle}
              disabled={isLoading || !hasEnrollment}
              color={VOICE_CONFIG.UI.COLORS.PRIMARY}
            />
          </View>

          <Text style={styles.description}>
            {hasEnrollment 
              ? 'Say "Mummy Help" to trigger an emergency alert with voice verification.'
              : 'Enroll your voice to enable "Mummy Help" voice alerts.'
            }
          </Text>

          <View style={styles.actions}>
            <Button
              mode="outlined"
              onPress={handleReEnroll}
              icon="account-voice"
              style={styles.actionButton}
              compact
            >
              {hasEnrollment ? 'Re-enroll Voice' : 'Enroll Voice'}
            </Button>

            {__DEV__ && (
              <Button
                mode="text"
                onPress={handleTest}
                icon="test-tube"
                style={styles.actionButton}
                compact
              >
                Test
              </Button>
            )}
          </View>

          {!hasEnrollment && (
            <View style={styles.warningContainer}>
              <IconButton icon="alert" size={16} iconColor={VOICE_CONFIG.UI.COLORS.WARNING} />
              <Text style={styles.warningText}>
                Voice enrollment required to use voice alerts
              </Text>
            </View>
          )}
        </Card.Content>
      </Card>
    </MotiView>
  );
}

const styles = StyleSheet.create({
  card: {
    marginVertical: 8,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  titleContainer: {
    flex: 1,
    marginRight: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
  },
  statusChip: {
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  description: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 16,
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#ecf0f1',
  },
  warningText: {
    flex: 1,
    fontSize: 12,
    color: VOICE_CONFIG.UI.COLORS.WARNING,
    marginLeft: 4,
  },
});
