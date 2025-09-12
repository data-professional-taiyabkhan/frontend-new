/**
 * Voice Controller - Orchestrates the complete voice pipeline:
 * Wake Word Detection → Speaker Verification → Confirmation Modal → Alert Flow
 */

import kwsService from './kwsService';
import svService from './svService';
import { voiceAPI } from './api';
import { VOICE_CONFIG } from '../config/voice';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

class VoiceController {
  constructor() {
    this.isInitialized = false;
    this.isEnabled = false;
    this.hasVoiceprint = false;
    this.currentUser = null;
    this.listeners = [];
    this.isProcessingWake = false;
    
    // Callbacks
    this.onConfirmModalShow = null;
    this.onConfirmModalHide = null;
    this.onAlertTriggered = null;
  }

  /**
   * Initialize the voice controller
   */
  async initialize(user, callbacks = {}) {
    try {
      console.log('Initializing Voice Controller...');
      
      this.currentUser = user;
      this.onConfirmModalShow = callbacks.onConfirmModalShow;
      this.onConfirmModalHide = callbacks.onConfirmModalHide;
      this.onAlertTriggered = callbacks.onAlertTriggered;

      // Check if user is a child (only children can use voice alerts)
      if (user?.role !== 'child') {
        console.log('Voice controller not available for non-child users');
        return false;
      }

      // Initialize services
      await kwsService.initialize({
        accessKey: process.env.EXPO_PUBLIC_PORCUPINE_ACCESS_KEY,
        sensitivity: await this.getSavedSensitivity(),
      });

      await svService.initialize();

      // Check voice enrollment status
      await this.checkVoiceEnrollment();

      // Set up wake word listener
      this.unsubscribeKWS = kwsService.addWakeListener(this.handleWakeWordDetected.bind(this));

      this.isInitialized = true;
      console.log('Voice Controller initialized successfully');

      // Auto-start if previously enabled
      await this.autoStart();

      return true;
    } catch (error) {
      console.error('Voice Controller initialization failed:', error);
      this.isInitialized = false;
      throw error;
    }
  }

  /**
   * Check if user has voice enrollment
   */
  async checkVoiceEnrollment() {
    try {
      const status = await voiceAPI.getStatus();
      this.hasVoiceprint = status.enrolled;
      console.log('Voice enrollment status:', this.hasVoiceprint);
      return this.hasVoiceprint;
    } catch (error) {
      console.error('Failed to check voice enrollment:', error);
      this.hasVoiceprint = false;
      return false;
    }
  }

  /**
   * Start voice listening (KWS)
   */
  async start() {
    try {
      if (!this.isInitialized) {
        throw new Error('Voice controller not initialized');
      }

      // Allow wake word detection without voiceprint for emergency alerts
      if (!this.hasVoiceprint) {
        console.log('Starting wake word detection without voiceprint for emergency alerts');
      }

      console.log('Starting voice listening...');
      await kwsService.start();
      this.isEnabled = true;

      // Save enabled state
      await AsyncStorage.setItem('voice_enabled', 'true');

      this.notifyListeners('started', { enabled: true });
      return true;
    } catch (error) {
      console.error('Failed to start voice listening:', error);
      this.isEnabled = false;
      throw error;
    }
  }

  /**
   * Stop voice listening
   */
  async stop() {
    try {
      console.log('Stopping voice listening...');
      await kwsService.stop();
      this.isEnabled = false;

      // Clear enabled state
      await AsyncStorage.removeItem('voice_enabled');

      this.notifyListeners('stopped', { enabled: false });
      return true;
    } catch (error) {
      console.error('Failed to stop voice listening:', error);
      throw error;
    }
  }

  /**
   * Auto-start if previously enabled
   */
  async autoStart() {
    try {
      const wasEnabled = await AsyncStorage.getItem('voice_enabled');
      if (wasEnabled === 'true') {
        console.log('Auto-starting voice listening from previous session');
        await this.start();
      } else {
        // Auto-start wake word detection for emergency alerts
        console.log('Auto-starting wake word detection for emergency alerts');
        await this.start();
      }
    } catch (error) {
      console.error('Error during auto-start:', error);
    }
  }

  /**
   * Handle wake word detection
   */
  async handleWakeWordDetected(wakeData) {
    try {
      if (this.isProcessingWake) {
        console.log('Already processing wake word, ignoring');
        return;
      }

      this.isProcessingWake = true;
      console.log('Wake word detected, showing emergency countdown...', wakeData);

      // Provide immediate feedback
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // Notify listeners of wake detection (this will trigger the emergency countdown modal)
      this.notifyListeners('wakeDetected', wakeData);

      // Skip speaker verification for emergency alerts - go directly to countdown
      console.log('Skipping speaker verification for emergency alert');

    } catch (error) {
      console.error('Error handling wake word:', error);
      this.notifyListeners('error', { message: error.message });
    } finally {
      this.isProcessingWake = false;
    }
  }

  /**
   * Show confirmation modal after successful verification
   */
  async showConfirmationModal(verificationResult) {
    try {
      console.log('Showing confirmation modal for verified voice');

      // Provide success haptic feedback
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      const modalData = {
        visible: true,
        verificationScore: verificationResult.score,
        threshold: verificationResult.threshold,
        timestamp: Date.now(),
        autoConfirmMs: VOICE_CONFIG.TIMING.AUTO_CANCEL_MODAL_MS,
      };

      // Notify that modal should be shown
      if (this.onConfirmModalShow) {
        this.onConfirmModalShow(modalData);
      }

      this.notifyListeners('confirmModalShown', modalData);

    } catch (error) {
      console.error('Error showing confirmation modal:', error);
    }
  }

  /**
   * Handle confirmation modal result
   */
  async handleConfirmationResult(confirmed, modalData = {}) {
    try {
      console.log('Confirmation result:', confirmed);

      if (confirmed) {
        // User confirmed - trigger emergency alert
        await this.triggerEmergencyAlert(modalData);
      } else {
        // User cancelled
        console.log('Emergency alert cancelled by user');
        this.notifyListeners('alertCancelled', modalData);
      }

      // Hide modal
      if (this.onConfirmModalHide) {
        this.onConfirmModalHide();
      }

    } catch (error) {
      console.error('Error handling confirmation result:', error);
    }
  }

  /**
   * Trigger emergency alert
   */
  async triggerEmergencyAlert(modalData = {}) {
    try {
      console.log('Triggering emergency alert from voice command');

      const alertData = {
        triggeredBy: 'voice',
        verificationScore: modalData.verificationScore,
        timestamp: modalData.timestamp || Date.now(),
        source: 'mummy_help_voice',
      };

      // Notify that alert should be triggered
      if (this.onAlertTriggered) {
        await this.onAlertTriggered(alertData);
      }

      this.notifyListeners('alertTriggered', alertData);

    } catch (error) {
      console.error('Error triggering emergency alert:', error);
      throw error;
    }
  }

  /**
   * Update sensitivity setting
   */
  async updateSensitivity(sensitivity) {
    try {
      if (!VOICE_CONFIG.VoiceConfigHelpers?.isValidSensitivity?.(sensitivity)) {
        throw new Error('Invalid sensitivity value');
      }

      await kwsService.updateSensitivity(sensitivity);
      await AsyncStorage.setItem('voice_sensitivity', sensitivity.toString());
      
      this.notifyListeners('sensitivityUpdated', { sensitivity });
      console.log('Voice sensitivity updated to:', sensitivity);

    } catch (error) {
      console.error('Error updating sensitivity:', error);
      throw error;
    }
  }

  /**
   * Get saved sensitivity or default
   */
  async getSavedSensitivity() {
    try {
      const saved = await AsyncStorage.getItem('voice_sensitivity');
      return saved ? parseFloat(saved) : VOICE_CONFIG.PORCUPINE.DEFAULT_SENSITIVITY;
    } catch (error) {
      console.error('Error getting saved sensitivity:', error);
      return VOICE_CONFIG.PORCUPINE.DEFAULT_SENSITIVITY;
    }
  }

  /**
   * Navigate to voice enrollment
   */
  navigateToEnrollment() {
    this.notifyListeners('navigationRequested', { screen: 'VoiceEnroll', params: { user: this.currentUser } });
  }

  /**
   * Re-enroll voice (for settings)
   */
  async reEnrollVoice() {
    try {
      // Stop current listening
      if (this.isEnabled) {
        await this.stop();
      }

      // Navigate to enrollment
      this.navigateToEnrollment();

    } catch (error) {
      console.error('Error during re-enrollment:', error);
      throw error;
    }
  }

  /**
   * Get device ID
   */
  async getDeviceId() {
    try {
      let deviceId = await AsyncStorage.getItem('device_id');
      if (!deviceId) {
        deviceId = Platform.OS + '_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        await AsyncStorage.setItem('device_id', deviceId);
      }
      return deviceId;
    } catch (error) {
      console.error('Error getting device ID:', error);
      return Platform.OS + '_unknown';
    }
  }

  /**
   * Get current status
   */
  getStatus() {
    return {
      isInitialized: this.isInitialized,
      isEnabled: this.isEnabled,
      hasVoiceprint: this.hasVoiceprint,
      isProcessingWake: this.isProcessingWake,
      kwsStatus: kwsService.getStatus(),
      svStatus: svService.getStatus(),
    };
  }

  /**
   * Add event listener
   */
  addListener(listener) {
    if (typeof listener !== 'function') {
      throw new Error('Listener must be a function');
    }
    
    this.listeners.push(listener);
    
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Notify all listeners
   */
  notifyListeners(event, data) {
    this.listeners.forEach(listener => {
      try {
        listener(event, data);
      } catch (error) {
        console.error('Error in voice controller listener:', error);
      }
    });
  }

  /**
   * Test voice pipeline (for development)
   */
  async testVoicePipeline() {
    if (!__DEV__) return;

    console.log('Testing voice pipeline...');
    
    // Simulate wake word detection
    await this.handleWakeWordDetected({
      keywordIndex: 0,
      timestamp: Date.now(),
      confidence: 0.8,
    });
  }

  /**
   * Cleanup
   */
  async cleanup() {
    try {
      console.log('Cleaning up voice controller...');
      
      await this.stop();
      
      if (this.unsubscribeKWS) {
        this.unsubscribeKWS();
      }

      await kwsService.cleanup();
      await svService.cleanup();

      this.listeners = [];
      this.isInitialized = false;

      console.log('Voice controller cleanup completed');

    } catch (error) {
      console.error('Error during voice controller cleanup:', error);
    }
  }
}

// Create singleton instance
const voiceController = new VoiceController();

export default voiceController;
