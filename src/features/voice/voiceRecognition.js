import * as Speech from 'expo-speech';

class VoiceRecognition {
  constructor() {
    this.isListening = false;
    this.isContinuous = false;
    this.onTextDetected = null;
    this.onError = null;
    this.onStatusChange = null;
    
    // Mock voice input for testing (will be replaced with real voice recognition)
    this.mockInputEnabled = false; // Disabled automatic mock input
    this.mockInputInterval = null;
    
    // Voice feedback settings
    this.voiceEnabled = true;
    this.voiceVolume = 1.0;
    this.voiceRate = 0.9;
    
    // Recognition settings
    this.language = 'en-US';
    this.continuous = true;
    this.interimResults = false;
    
    console.log('🎤 Voice recognition service initialized');
  }

  // Initialize the voice recognition system
  init(onTextDetected, onError, onStatusChange) {
    this.onTextDetected = onTextDetected;
    this.onError = onError;
    this.onStatusChange = onStatusChange;
    
    console.log('🎤 Voice recognition callbacks registered');
    return true;
  }

  // Start listening for voice input
  async startListening(options = {}) {
    if (this.isListening) {
      console.log('🎤 Already listening');
      return false;
    }

    try {
      this.isListening = true;
      this.isContinuous = options.continuous !== false;
      
      // Update status
      this.updateStatus('listening');
      
      // Speak feedback
      if (this.voiceEnabled) {
        await this.speak('Listening for voice commands');
      }
      
      console.log('🎤 Voice recognition started');
      
      // For now, use mock input system
      if (this.mockInputEnabled) {
        this.startMockInput();
      }
      
      return true;
    } catch (error) {
      console.error('🎤 Error starting voice recognition:', error);
      this.isListening = false;
      this.updateStatus('error', error.message);
      return false;
    }
  }

  // Stop listening
  async stopListening() {
    if (!this.isListening) {
      console.log('🎤 Not currently listening');
      return false;
    }

    try {
      this.isListening = false;
      
      // Stop mock input
      if (this.mockInputInterval) {
        clearInterval(this.mockInputInterval);
        this.mockInputInterval = null;
      }
      
      // Update status
      this.updateStatus('stopped');
      
      // Speak feedback
      if (this.voiceEnabled) {
        await this.speak('Voice recognition stopped');
      }
      
      console.log('🎤 Voice recognition stopped');
      return true;
    } catch (error) {
      console.error('🎤 Error stopping voice recognition:', error);
      return false;
    }
  }

  // Start mock voice input system for testing
  startMockInput() {
    if (this.mockInputInterval) {
      clearInterval(this.mockInputInterval);
    }
    
    // Simulate voice input every 3-8 seconds
    this.mockInputInterval = setInterval(() => {
      if (!this.isListening) return;
      
      // Randomly generate mock voice input
      const mockPhrases = [
        'mummy help',
        'hey mummy help',
        'help me mummy',
        'check in',
        'i am safe',
        'hello world',
        'test voice',
        'emergency',
        'hey mummyhelp',
        'mummy i need help'
      ];
      
      const randomPhrase = mockPhrases[Math.floor(Math.random() * mockPhrases.length)];
      
      // Simulate voice detection delay
      setTimeout(() => {
        if (this.isListening && this.onTextDetected) {
          console.log('🎤 Mock voice detected:', randomPhrase);
          this.onTextDetected(randomPhrase);
        }
      }, Math.random() * 2000 + 1000); // 1-3 second delay
      
    }, Math.random() * 5000 + 3000); // 3-8 second intervals
  }

  // Process detected voice text
  processVoiceText(text) {
    if (!text || typeof text !== 'string') return;
    
    console.log('🎤 Processing voice text:', text);
    
    // Normalize text
    const normalizedText = text.toLowerCase().trim();
    
    // Call the text detected callback
    if (this.onTextDetected) {
      this.onTextDetected(normalizedText);
    }
  }

  // Manual voice input (for testing)
  manualVoiceInput(text) {
    console.log('🎤 Manual voice input:', text);
    this.processVoiceText(text);
  }

  // Enable/disable mock input for testing
  setMockInputEnabled(enabled) {
    this.mockInputEnabled = enabled;
    console.log('🎤 Mock input', enabled ? 'enabled' : 'disabled');
    
    if (!enabled && this.mockInputInterval) {
      clearInterval(this.mockInputInterval);
      this.mockInputInterval = null;
    } else if (enabled && this.isListening) {
      this.startMockInput();
    }
  }

  // Get mock input status
  isMockInputEnabled() {
    return this.mockInputEnabled;
  }

  // Speak text using text-to-speech
  async speak(text) {
    if (!this.voiceEnabled) return;
    
    try {
      await Speech.speak(text, {
        language: this.language,
        pitch: 1.0,
        rate: this.voiceRate,
        volume: this.voiceVolume,
      });
      console.log('🗣️ Voice feedback:', text);
    } catch (error) {
      console.error('Error speaking text:', error);
    }
  }

  // Update status and notify callback
  updateStatus(status, message = '') {
    const statusInfo = {
      status,
      message,
      timestamp: new Date().toISOString(),
      isListening: this.isListening,
      isContinuous: this.isContinuous
    };
    
    console.log('🎤 Status update:', statusInfo);
    
    if (this.onStatusChange) {
      this.onStatusChange(statusInfo);
    }
  }

  // Get current status
  getStatus() {
    return {
      isListening: this.isListening,
      isContinuous: this.isContinuous,
      language: this.language,
      voiceEnabled: this.voiceEnabled,
      mockInputEnabled: this.mockInputEnabled
    };
  }

  // Update settings
  updateSettings(settings) {
    if (settings.language) {
      this.language = settings.language;
    }
    if (settings.continuous !== undefined) {
      this.continuous = settings.continuous;
    }
    if (settings.voiceEnabled !== undefined) {
      this.voiceEnabled = settings.voiceEnabled;
    }
    if (settings.voiceVolume !== undefined) {
      this.voiceVolume = settings.voiceVolume;
    }
    if (settings.voiceRate !== undefined) {
      this.voiceRate = settings.voiceRate;
    }
    if (settings.mockInputEnabled !== undefined) {
      this.mockInputEnabled = settings.mockInputEnabled;
    }
    
    console.log('🎤 Voice recognition settings updated:', settings);
  }

  // Test voice recognition
  testVoiceRecognition() {
    console.log('🧪 Testing voice recognition...');
    
    if (!this.isListening) {
      this.startListening();
    }
    
    // Simulate a test phrase after 2 seconds
    setTimeout(() => {
      this.manualVoiceInput('test mummy help');
    }, 2000);
  }

  // Enable/disable mock input
  setMockInput(enabled) {
    this.mockInputEnabled = enabled;
    
    if (enabled && this.isListening) {
      this.startMockInput();
    } else if (!enabled && this.mockInputInterval) {
      clearInterval(this.mockInputInterval);
      this.mockInputInterval = null;
    }
    
    console.log(`🎤 Mock input ${enabled ? 'enabled' : 'disabled'}`);
  }

  // Get available languages (placeholder for future implementation)
  getAvailableLanguages() {
    return [
      { code: 'en-US', name: 'English (US)' },
      { code: 'en-GB', name: 'English (UK)' },
      { code: 'es-ES', name: 'Spanish' },
      { code: 'fr-FR', name: 'French' },
      { code: 'de-DE', name: 'German' }
    ];
  }

  // Check if voice recognition is supported
  isSupported() {
    // For now, always return true since we're using mock input
    // This will change when real voice recognition is implemented
    return true;
  }

  // Request permissions (placeholder for future implementation)
  async requestPermissions() {
    // For now, always return true since we're using mock input
    // This will change when real voice recognition is implemented
    console.log('🎤 Voice recognition permissions granted (mock mode)');
    return true;
  }

  // Cleanup resources
  cleanup() {
    this.stopListening();
    this.onTextDetected = null;
    this.onError = null;
    this.onStatusChange = null;
    console.log('🎤 Voice recognition service cleaned up');
  }
}

// Create singleton instance
const voiceRecognition = new VoiceRecognition();

export default voiceRecognition;
