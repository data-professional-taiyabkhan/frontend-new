import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { AppState } from 'react-native';

const PYTHON_API_URL = 'https://mummyhelpwakeword.onrender.com';

class PythonVoiceService {
  constructor() {
    this.recording = null;
    this.isRecording = false;
    this.isProcessing = false;
    this.listeners = [];
    this.appState = 'active';
    this.wasRecordingBeforeBackground = false;
    
    // Configure audio recording
    this.recordingOptions = {
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
        outputFormat: Audio.RECORDING_OPTION_IOS_OUTPUT_FORMAT_LINEARPCM,
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

    // Handle app state changes
    this.handleAppStateChange = this.handleAppStateChange.bind(this);
    AppState.addEventListener('change', this.handleAppStateChange);
  }

  /**
   * Handle app state changes (background/foreground)
   */
  handleAppStateChange(nextAppState) {
    console.log('[PythonVoiceService] App state changed:', this.appState, '->', nextAppState);
    
    if (this.appState.match(/inactive|background/) && nextAppState === 'active') {
      // App came to foreground
      if (this.wasRecordingBeforeBackground && !this.isRecording) {
        console.log('[PythonVoiceService] Resuming recording after app came to foreground');
        this.startDetection();
      }
    } else if (nextAppState.match(/inactive|background/)) {
      // App went to background
      if (this.isRecording) {
        console.log('[PythonVoiceService] Pausing recording - app went to background');
        this.wasRecordingBeforeBackground = true;
        this.stopDetection();
      }
    }
    
    this.appState = nextAppState;
  }

  /**
   * Add a listener for wake word detection events
   * @param {Function} callback - Function to call when wake word is detected
   */
  addListener(callback) {
    this.listeners.push(callback);
  }

  /**
   * Remove a listener
   * @param {Function} callback - Function to remove
   */
  removeListener(callback) {
    this.listeners = this.listeners.filter(listener => listener !== callback);
  }

  /**
   * Notify all listeners that wake word was detected
   */
  notifyListeners() {
    console.log('[PythonVoiceService] Wake word detected! Notifying listeners...');
    this.listeners.forEach(listener => {
      try {
        listener();
      } catch (error) {
        console.error('[PythonVoiceService] Error in listener:', error);
      }
    });
  }

  /**
   * Start continuous wake word detection
   */
  async startDetection() {
    if (this.isRecording || this.isProcessing) {
      console.log('[PythonVoiceService] Already recording or processing');
      return;
    }

    console.log('[PythonVoiceService] Starting wake word detection...');
    
    try {
      // Request audio permissions
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Audio permission not granted');
      }

      // Configure audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      this.isRecording = true;
      await this.recordAndProcess();
      
    } catch (error) {
      console.error('[PythonVoiceService] Error starting detection:', error);
      this.isRecording = false;
    }
  }

  /**
   * Stop wake word detection
   */
  async stopDetection() {
    console.log('[PythonVoiceService] Stopping wake word detection...');
    
    this.isRecording = false;
    
    if (this.recording) {
      try {
        await this.recording.stopAndUnloadAsync();
        this.recording = null;
      } catch (error) {
        console.error('[PythonVoiceService] Error stopping recording:', error);
      }
    }
  }

  /**
   * Record audio and process it for wake word detection
   */
  async recordAndProcess() {
    while (this.isRecording && !this.isProcessing) {
      try {
        // Record for 3 seconds
        console.log('[PythonVoiceService] Recording audio...');
        
        const recording = new Audio.Recording();
        await recording.prepareToRecordAsync(this.recordingOptions);
        await recording.startAsync();
        
        this.recording = recording;
        
        // Record for 3 seconds
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        if (this.isRecording) {
          await recording.stopAndUnloadAsync();
          const uri = recording.getURI();
          
          if (uri) {
            // Process the recorded audio
            await this.processAudioFile(uri);
          }
        }
        
        // Small delay between recordings to prevent overwhelming the API
        if (this.isRecording) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
        
      } catch (error) {
        console.error('[PythonVoiceService] Error in recordAndProcess:', error);
        // Continue recording even if one cycle fails
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  }

  /**
   * Process audio file by sending it to Python API
   * @param {string} audioUri - URI of the recorded audio file
   */
  async processAudioFile(audioUri) {
    if (this.isProcessing) {
      console.log('[PythonVoiceService] Already processing audio, skipping...');
      return;
    }

    this.isProcessing = true;
    
    try {
      console.log('[PythonVoiceService] Processing audio file:', audioUri);
      
      // Create FormData for file upload
      const formData = new FormData();
      
      // Create file object for FormData
      const audioFile = {
        uri: audioUri,
        type: 'audio/wav',
        name: 'audio.wav',
      };
      
      formData.append('audio', audioFile);
      
      // Send to Python API
      const response = await fetch(`${PYTHON_API_URL}/detect-wake-word`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('[PythonVoiceService] API Response:', result);
      
      // Check if wake word was detected
      if (result.detected) {
        console.log('[PythonVoiceService] Wake word detected!');
        this.notifyListeners();
      } else {
        console.log('[PythonVoiceService] No wake word detected');
      }
      
    } catch (error) {
      console.error('[PythonVoiceService] Error processing audio:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Test the Python API connection
   */
  async testConnection() {
    try {
      console.log('[PythonVoiceService] Testing API connection...');
      
      const response = await fetch(`${PYTHON_API_URL}/health`);
      const result = await response.json();
      
      console.log('[PythonVoiceService] API Health Check:', result);
      return result.status === 'healthy';
      
    } catch (error) {
      console.error('[PythonVoiceService] API connection test failed:', error);
      return false;
    }
  }

  /**
   * Get service status
   */
  getStatus() {
    return {
      isRecording: this.isRecording,
      isProcessing: this.isProcessing,
      hasListeners: this.listeners.length > 0,
      apiUrl: PYTHON_API_URL,
      appState: this.appState,
    };
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    console.log('[PythonVoiceService] Cleaning up resources...');
    this.stopDetection();
    AppState.removeEventListener('change', this.handleAppStateChange);
    this.listeners = [];
  }
}

// Create singleton instance
const pythonVoiceService = new PythonVoiceService();

export default pythonVoiceService;
