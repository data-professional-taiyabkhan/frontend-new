import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import * as Haptics from 'expo-haptics';

const { width, height } = Dimensions.get('window');

const EmergencyCountdownModal = ({ 
  visible, 
  onCancel, 
  onConfirm, 
  countdownSeconds = 3 
}) => {
  const [countdown, setCountdown] = useState(countdownSeconds);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    if (visible) {
      setCountdown(countdownSeconds);
      setIsActive(true);
      
      // Start countdown
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setIsActive(false);
            // Auto-confirm when countdown reaches 0
            setTimeout(() => {
              onConfirm();
            }, 100);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Provide haptic feedback
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

      return () => clearInterval(timer);
    } else {
      setIsActive(false);
      setCountdown(countdownSeconds);
    }
  }, [visible, countdownSeconds, onConfirm]);

  const handleCancel = () => {
    setIsActive(false);
    onCancel();
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      statusBarTranslucent={true}
    >
      <View style={styles.overlay}>
        <MotiView
          from={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 15 }}
          style={styles.modalContainer}
        >
          <LinearGradient
            colors={['#FF6B6B', '#FF8E8E', '#FFB3B3']}
            style={styles.gradient}
          >
            <View style={styles.content}>
              {/* Emergency Icon */}
              <MotiView
                from={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 200, type: 'spring' }}
                style={styles.iconContainer}
              >
                <Text style={styles.emergencyIcon}>🚨</Text>
              </MotiView>

              {/* Title */}
              <Text style={styles.title}>Do you need help?</Text>
              
              {/* Countdown */}
              <MotiView
                from={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 400, type: 'spring' }}
                style={styles.countdownContainer}
              >
                <Text style={styles.countdownText}>{countdown}</Text>
                <Text style={styles.countdownLabel}>
                  {countdown === 1 ? 'second' : 'seconds'}
                </Text>
              </MotiView>

              {/* Description */}
              <Text style={styles.description}>
                An emergency alert will be sent to your parent automatically
              </Text>

              {/* Cancel Button */}
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleCancel}
                disabled={!isActive}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </MotiView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: width * 0.85,
    maxWidth: 400,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  gradient: {
    padding: 30,
  },
  content: {
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 20,
  },
  emergencyIcon: {
    fontSize: 60,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 20,
  },
  countdownContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  countdownText: {
    fontSize: 72,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  countdownLabel: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.9,
    marginTop: -10,
  },
  description: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    opacity: 0.9,
    marginBottom: 30,
    lineHeight: 22,
  },
  cancelButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  cancelButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default EmergencyCountdownModal;
