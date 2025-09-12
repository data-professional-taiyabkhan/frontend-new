import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Modal, Button } from 'react-native-paper';
import { AnimatePresence, MotiView } from 'moti';
import { PanGestureHandler } from 'react-native-gesture-handler';

const { width, height } = Dimensions.get('window');

export default function ConfirmModal({ visible, onConfirm, onCancel, timeoutMs = 5000 }) {
  const [remaining, setRemaining] = useState(timeoutMs / 1000);

  useEffect(() => {
    if (!visible) return;
    
    setRemaining(timeoutMs / 1000);
    const timer = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          onConfirm?.(); // Auto-confirm when timer expires
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [visible, timeoutMs, onConfirm]);

  if (!visible) return null;

  return (
    <View>
      <Modal 
        visible={visible} 
        onDismiss={onCancel} 
        contentContainerStyle={styles.container}
        dismissable={false}
      >
        <AnimatePresence>
          <MotiView 
            from={{ opacity: 0, scale: 0.95, translateY: 20 }}
            animate={{ opacity: 1, scale: 1, translateY: 0 }}
            exit={{ opacity: 0, scale: 0.95, translateY: -20 }}
            transition={{ type: 'spring', damping: 15, stiffness: 150 }}
            style={styles.modalContent}
          >
            {/* Emergency Icon */}
            <MotiView 
              from={{ scale: 0.8, rotate: '0deg' }}
              animate={{ scale: 1, rotate: '360deg' }}
              transition={{ type: 'spring', damping: 10, stiffness: 100 }}
              style={styles.emergencyIcon}
            >
              <Text style={styles.emergencyIconText}>🚨</Text>
            </MotiView>

            {/* Title */}
            <Text style={styles.title}>Emergency Alert?</Text>
            
            {/* Countdown Timer */}
            <MotiView 
              from={{ scale: 1 }}
              animate={{ scale: remaining <= 3 ? 1.1 : 1 }}
              transition={{ type: 'spring', damping: 10, stiffness: 200 }}
              style={styles.timerContainer}
            >
              <Text style={[
                styles.timer, 
                { color: remaining <= 3 ? '#e74c3c' : '#2c3e50' }
              ]}>
                {remaining}s
              </Text>
            </MotiView>

            {/* Description */}
            <Text style={styles.description}>
              This will immediately notify your parent and start location tracking.
            </Text>

            {/* Action Buttons */}
            <View style={styles.buttonContainer}>
              <Button 
                mode="contained" 
                onPress={onConfirm}
                style={[styles.button, styles.confirmButton]}
                buttonColor="#e74c3c"
                textColor="#ffffff"
              >
                Send Alert Now
              </Button>
              
              <Button 
                mode="outlined" 
                onPress={onCancel}
                style={[styles.button, styles.cancelButton]}
                textColor="#666"
              >
                Cancel
              </Button>
            </View>

            {/* Hint */}
            <Text style={styles.hint}>
              Swipe down to send • Swipe up to cancel
            </Text>
          </MotiView>
        </AnimatePresence>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    margin: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
    maxWidth: width * 0.9,
  },
  emergencyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 3,
    borderColor: '#e74c3c',
  },
  emergencyIconText: {
    fontSize: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 16,
    textAlign: 'center',
  },
  timerContainer: {
    marginBottom: 20,
  },
  timer: {
    fontSize: 48,
    fontWeight: '800',
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
    marginBottom: 16,
  },
  button: {
    borderRadius: 12,
    paddingVertical: 8,
  },
  confirmButton: {
    borderWidth: 0,
  },
  cancelButton: {
    borderColor: '#ddd',
  },
  hint: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
