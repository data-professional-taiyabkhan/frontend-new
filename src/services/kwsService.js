/**
 * Keyword Wake Service (KWS) using Porcupine for "Mummy Help" detection
 */

import { PorcupineManager } from '@picovoice/porcupine-react-native';
import { PermissionsAndroid, Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

class KeywordWakeService {
  constructor() {
    this.porcupineManager = null;
    this.isListening = false;
    this.isInitialized = false;
    this.listeners = [];
    this.accessKey = null;
    this.keywordPath = null;
    this.sensitivity = 0.5;
    this.lastWakeTime = 0;
    this.debounceMs = 1500; // Ignore repeated wakes within 1.5 seconds
  }

  /**
   * Initialize the KWS with access key and keyword file
   */
  async initialize(config = {}) {
    try {
      console.log('Initializing Keyword Wake Service...');
      
      // Get configuration
      this.accessKey = config.accessKey || process.env.EXPO_PUBLIC_PORCUPINE_ACCESS_KEY;
      this.sensitivity = config.sensitivity || 0.5;
      this.debounceMs = config.debounceMs || 1500;
      
      if (!this.accessKey) {
        throw new Error('Porcupine access key is required');
      }

      // For now, we'll use a built-in keyword. In production, you'd bundle a custom "mummy_help.ppn" file
      // TODO: Replace with custom keyword file path when available
      this.keywordPath = 'porcupine'; // Built-in keyword for testing
      
      // Request microphone permissions
      const hasPermission = await this.requestMicrophonePermission();
      if (!hasPermission) {
        throw new Error('Microphone permission is required for wake word detection');
      }

      this.isInitialized = true;
      console.log('KWS initialized successfully');
      
      return true;
    } catch (error) {
      console.error('KWS initialization failed:', error);
      this.isInitialized = false;
      throw error;
    }
  }

  /**
   * Request microphone permissions
   */
  async requestMicrophonePermission() {
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          {
            title: 'Microphone Permission',
            message: 'MummyHelp needs microphone access to listen for "Mummy Help" voice commands.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } else {
        // iOS permissions are handled by expo-av in the enrollment screen
        return true;
      }
    } catch (error) {
      console.error('Error requesting microphone permission:', error);
      return false;
    }
  }

  /**
   * Start listening for wake words
   */
  async start() {
    try {
      if (!this.isInitialized) {
        throw new Error('KWS not initialized. Call initialize() first.');
      }

      if (this.isListening) {
        console.log('KWS already listening');
        return;
      }

      console.log('Starting keyword wake detection...');

      // Create Porcupine manager
      this.porcupineManager = await PorcupineManager.create(
        this.accessKey,
        [this.keywordPath], // Array of keyword paths
        [this.sensitivity], // Array of sensitivities for each keyword
        this.onWakeWordDetected.bind(this)
      );

      // Start listening
      await this.porcupineManager.start();
      this.isListening = true;
      
      console.log('KWS started successfully');
      
      // Store listening state
      await AsyncStorage.setItem('kws_listening', 'true');
      
    } catch (error) {
      console.error('Failed to start KWS:', error);
      this.isListening = false;
      throw error;
    }
  }

  /**
   * Stop listening for wake words
   */
  async stop() {
    try {
      if (!this.isListening || !this.porcupineManager) {
        console.log('KWS not listening');
        return;
      }

      console.log('Stopping keyword wake detection...');

      await this.porcupineManager.stop();
      await this.porcupineManager.delete();
      
      this.porcupineManager = null;
      this.isListening = false;
      
      console.log('KWS stopped successfully');
      
      // Clear listening state
      await AsyncStorage.removeItem('kws_listening');
      
    } catch (error) {
      console.error('Failed to stop KWS:', error);
      // Even if there's an error, mark as not listening
      this.isListening = false;
      this.porcupineManager = null;
    }
  }

  /**
   * Handle wake word detection
   */
  onWakeWordDetected(keywordIndex) {
    try {
      const now = Date.now();
      
      // Debounce repeated detections
      if (now - this.lastWakeTime < this.debounceMs) {
        console.log('Wake word detected but ignored due to debouncing');
        return;
      }
      
      this.lastWakeTime = now;
      
      console.log(`Wake word detected! Keyword index: ${keywordIndex}`);
      
      // Notify all listeners
      this.listeners.forEach(listener => {
        try {
          listener({
            keywordIndex,
            timestamp: now,
            confidence: this.sensitivity, // Approximate confidence based on sensitivity
          });
        } catch (error) {
          console.error('Error in wake word listener:', error);
        }
      });
      
    } catch (error) {
      console.error('Error handling wake word detection:', error);
    }
  }

  /**
   * Add a listener for wake word events
   */
  addWakeListener(listener) {
    if (typeof listener !== 'function') {
      throw new Error('Listener must be a function');
    }
    
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Remove all listeners
   */
  removeAllListeners() {
    this.listeners = [];
  }

  /**
   * Update sensitivity (0.0 - 1.0)
   */
  async updateSensitivity(newSensitivity) {
    if (newSensitivity < 0 || newSensitivity > 1) {
      throw new Error('Sensitivity must be between 0.0 and 1.0');
    }

    this.sensitivity = newSensitivity;
    
    // If currently listening, restart with new sensitivity
    if (this.isListening) {
      await this.stop();
      await this.start();
    }
    
    console.log(`KWS sensitivity updated to: ${newSensitivity}`);
  }

  /**
   * Get current status
   */
  getStatus() {
    return {
      isInitialized: this.isInitialized,
      isListening: this.isListening,
      sensitivity: this.sensitivity,
      listenerCount: this.listeners.length,
      lastWakeTime: this.lastWakeTime,
    };
  }

  /**
   * Auto-restart if the service was previously listening
   */
  async autoRestart() {
    try {
      const wasListening = await AsyncStorage.getItem('kws_listening');
      if (wasListening === 'true' && this.isInitialized && !this.isListening) {
        console.log('Auto-restarting KWS from previous session');
        await this.start();
      }
    } catch (error) {
      console.error('Error during KWS auto-restart:', error);
    }
  }

  /**
   * Cleanup resources
   */
  async cleanup() {
    try {
      await this.stop();
      this.removeAllListeners();
      this.isInitialized = false;
      await AsyncStorage.removeItem('kws_listening');
      console.log('KWS cleanup completed');
    } catch (error) {
      console.error('Error during KWS cleanup:', error);
    }
  }
}

// Create singleton instance
const kwsService = new KeywordWakeService();

export default kwsService;
