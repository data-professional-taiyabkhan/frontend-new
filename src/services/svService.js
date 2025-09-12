/**
 * Speaker Verification Service (SV) for voice verification after wake word detection
 */

import { Audio } from 'expo-av';
import { Platform } from 'react-native';
import { voiceAPI } from './api';
import * as Haptics from 'expo-haptics';

class SpeakerVerificationService {
  constructor() {
    this.recording = null;
    this.isRecording = false;
    this.targetDuration = 1200; // 1.2 seconds in ms
    this.maxDuration = 2000; // 2 seconds maximum
    this.listeners = [];
  }

  /**
   * Initialize the SV service with audio configuration
   */
  async initialize() {
    try {
      console.log('Initializing Speaker Verification Service...');
      
      // Configure audio settings for recording
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
        staysActiveInBackground: true,
      });
      
      console.log('SV Service initialized successfully');
      return true;
    } catch (error) {
      console.error('SV Service initialization failed:', error);
      throw error;
    }
  }

  /**
   * Start verification recording immediately after wake word detection
   */
  async startVerificationRecording() {
    try {
      if (this.isRecording) {
        console.log('Already recording for verification');
        return null;
      }

      console.log('Starting verification recording...');
      this.isRecording = true;

      // Provide haptic feedback
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      // Recording configuration optimized for speech recognition
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

      const { recording } = await Audio.Recording.createAsync(recordingOptions);
      this.recording = recording;

      // Auto-stop after target duration
      setTimeout(async () => {
        if (this.isRecording) {
          await this.stopVerificationRecording();
        }
      }, this.targetDuration);

      // Failsafe - stop after max duration
      setTimeout(async () => {
        if (this.isRecording) {
          console.log('Verification recording reached max duration, stopping');
          await this.stopVerificationRecording();
        }
      }, this.maxDuration);

      return recording;
    } catch (error) {
      console.error('Failed to start verification recording:', error);
      this.isRecording = false;
      this.recording = null;
      throw error;
    }
  }

  /**
   * Stop verification recording and return the audio URI
   */
  async stopVerificationRecording() {
    try {
      if (!this.recording || !this.isRecording) {
        console.log('No active verification recording to stop');
        return null;
      }

      console.log('Stopping verification recording...');
      
      // Prevent multiple stop calls by setting flag immediately
      this.isRecording = false;
      
      // Check if recording is still valid and can be stopped
      const recordingStatus = await this.recording.getStatusAsync();
      if (recordingStatus.isRecording) {
        await this.recording.stopAndUnloadAsync();
      }
      
      const uri = this.recording.getURI();
      this.recording = null;

      console.log('Verification recording stopped, URI:', uri);
      return uri;
    } catch (error) {
      console.error('Failed to stop verification recording:', error);
      this.isRecording = false;
      this.recording = null;
      // Don't throw error, just return null to prevent crash
      return null;
    }
  }

  /**
   * Verify voice sample against enrolled voiceprint
   */
  async verifyWithServer(audioUri, deviceId = null) {
    try {
      if (!audioUri) {
        throw new Error('No audio URI provided for verification');
      }

      console.log('Starting server verification...');
      
      const result = await voiceAPI.verify(audioUri, deviceId);
      
      console.log('Server verification result:', {
        score: result.score,
        match: result.match,
        threshold: result.threshold,
      });

      return {
        success: true,
        score: result.score,
        match: result.match,
        threshold: result.threshold,
        message: result.message,
      };
    } catch (error) {
      console.error('Server verification failed:', error);
      
      return {
        success: false,
        score: 0,
        match: false,
        threshold: 0,
        message: error.message || 'Verification failed',
        error: error,
      };
    }
  }

  /**
   * Complete verification flow: record -> verify -> return result
   */
  async performVerification(deviceId = null) {
    try {
      console.log('Starting complete verification flow...');
      
      // Step 1: Record audio
      const recording = await this.startVerificationRecording();
      if (!recording) {
        throw new Error('Failed to start recording');
      }

      // Wait for recording to complete
      await new Promise(resolve => {
        const checkRecording = () => {
          if (!this.isRecording) {
            resolve();
          } else {
            setTimeout(checkRecording, 100);
          }
        };
        checkRecording();
      });

      // Step 2: Get the audio URI
      const audioUri = await this.stopVerificationRecording();
      if (!audioUri) {
        throw new Error('Failed to get recorded audio');
      }

      // Step 3: Verify with server
      const verificationResult = await this.verifyWithServer(audioUri, deviceId);
      
      // Step 4: Cleanup audio file (optional, as temp files are usually cleaned up automatically)
      // You might want to keep the file for debugging or delete it for privacy
      
      // Provide haptic feedback based on result
      if (verificationResult.match) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }

      return verificationResult;
    } catch (error) {
      console.error('Complete verification flow failed:', error);
      
      // Ensure recording is stopped
      if (this.isRecording) {
        await this.stopVerificationRecording();
      }

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      
      return {
        success: false,
        score: 0,
        match: false,
        threshold: 0,
        message: error.message || 'Verification failed',
        error: error,
      };
    }
  }

  /**
   * Quick verification for immediate wake word response
   * This version is optimized for speed and runs in the background
   */
  async quickVerify(options = {}) {
    const { 
      timeout = 2000,
      deviceId = null,
      onProgress = null,
    } = options;

    try {
      console.log('Starting quick verification...');
      
      if (onProgress) onProgress('recording');
      
      // Start recording immediately
      await this.startVerificationRecording();
      
      // Use shorter duration for quick verification
      const quickDuration = Math.min(this.targetDuration, timeout - 500);
      
      return new Promise((resolve) => {
        setTimeout(async () => {
          try {
            if (onProgress) onProgress('processing');
            
            const audioUri = await this.stopVerificationRecording();
            if (!audioUri) {
              resolve({
                success: false,
                match: false,
                message: 'Failed to record audio',
              });
              return;
            }

            if (onProgress) onProgress('verifying');
            
            const result = await this.verifyWithServer(audioUri, deviceId);
            
            if (onProgress) onProgress('complete');
            
            resolve(result);
          } catch (error) {
            console.error('Quick verification error:', error);
            resolve({
              success: false,
              match: false,
              message: error.message || 'Quick verification failed',
            });
          }
        }, quickDuration);
      });
    } catch (error) {
      console.error('Quick verification setup failed:', error);
      return {
        success: false,
        match: false,
        message: error.message || 'Quick verification setup failed',
      };
    }
  }

  /**
   * Check if user has voice enrollment
   */
  async checkEnrollmentStatus() {
    try {
      const status = await voiceAPI.getStatus();
      return status.enrolled;
    } catch (error) {
      console.error('Failed to check enrollment status:', error);
      return false;
    }
  }

  /**
   * Cancel ongoing recording
   */
  async cancelRecording() {
    try {
      if (this.recording && this.isRecording) {
        await this.recording.stopAndUnloadAsync();
        this.recording = null;
        this.isRecording = false;
        console.log('Verification recording cancelled');
      }
    } catch (error) {
      console.error('Error cancelling recording:', error);
    }
  }

  /**
   * Get current status
   */
  getStatus() {
    return {
      isRecording: this.isRecording,
      targetDuration: this.targetDuration,
      maxDuration: this.maxDuration,
    };
  }

  /**
   * Add verification event listener
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
   * Emit event to all listeners
   */
  emit(event, data) {
    this.listeners.forEach(listener => {
      try {
        listener(event, data);
      } catch (error) {
        console.error('Error in SV listener:', error);
      }
    });
  }

  /**
   * Cleanup resources
   */
  async cleanup() {
    try {
      await this.cancelRecording();
      this.listeners = [];
      console.log('SV Service cleanup completed');
    } catch (error) {
      console.error('Error during SV cleanup:', error);
    }
  }
}

// Create singleton instance
const svService = new SpeakerVerificationService();

export default svService;
