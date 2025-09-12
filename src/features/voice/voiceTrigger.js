import * as Speech from 'expo-speech';
import voiceSettings from './voiceSettings';

class VoiceTrigger {
  constructor() {
    // Initialize with default settings
    this.wakePhrases = [
      'mummy help',
      'hey mummy help', 
      'hey mummyhelp',
      'mummyhelp',
      'help me mummy',
      'mummy i need help'
    ];
    
    this.hits = [];
    this.windowMs = 10000; // 10 seconds
    this.requiredHits = 3;
    this.isListening = false;
    this.onSingleHit = null;
    this.onEmergency = null;
    
    // Voice feedback settings
    this.voiceEnabled = true;
    this.voiceVolume = 1.0;
    this.voiceRate = 0.9;
    
    // Load settings when available
    this.loadSettings();
  }

  // Load settings from voice settings service
  async loadSettings() {
    try {
      await voiceSettings.initialize();
      const settings = voiceSettings.getSettings();
      
      // Update wake phrase settings
      if (settings.wakePhrases && settings.wakePhrases.length > 0) {
        this.wakePhrases = [...settings.wakePhrases];
      }
      if (settings.hitThreshold) {
        this.requiredHits = settings.hitThreshold;
      }
      if (settings.timeWindow) {
        this.windowMs = settings.timeWindow;
      }
      if (settings.autoEmergency !== undefined) {
        this.autoEmergency = settings.autoEmergency;
      }
      
      // Update voice feedback settings
      if (settings.voiceEnabled !== undefined) {
        this.voiceEnabled = settings.voiceEnabled;
      }
      if (settings.voiceVolume !== undefined) {
        this.voiceVolume = settings.voiceVolume;
      }
      if (settings.voiceRate !== undefined) {
        this.voiceRate = settings.voiceRate;
      }
      
      console.log('🎤 Voice trigger settings loaded:', {
        wakePhrases: this.wakePhrases,
        requiredHits: this.requiredHits,
        timeWindow: this.windowMs,
        autoEmergency: this.autoEmergency
      });
      
      // Listen for settings changes
      voiceSettings.addListener(this.handleSettingsChange.bind(this));
      
    } catch (error) {
      console.error('🎤 Error loading voice trigger settings:', error);
    }
  }

  // Handle settings changes
  handleSettingsChange(key, value) {
    switch (key) {
      case 'wakePhrases':
        this.wakePhrases = [...value];
        break;
      case 'hitThreshold':
        this.requiredHits = value;
        break;
      case 'timeWindow':
        this.windowMs = value;
        break;
      case 'autoEmergency':
        this.autoEmergency = value;
        break;
      case 'voiceEnabled':
        this.voiceEnabled = value;
        break;
      case 'voiceVolume':
        this.voiceVolume = value;
        break;
      case 'voiceRate':
        this.voiceRate = value;
        break;
    }
    
    console.log(`🎤 Voice trigger setting updated: ${key} = ${value}`);
  }

  // Initialize the voice trigger system
  async init(onSingleHit, onEmergency) {
    this.onSingleHit = onSingleHit;
    this.onEmergency = onEmergency;
    
    // Ensure settings are loaded
    if (!this.wakePhrases.length) {
      await this.loadSettings();
    }
    
    console.log('🎤 Voice trigger system initialized');
    console.log('Wake phrases:', this.wakePhrases);
    console.log(`Required hits: ${this.requiredHits} in ${this.windowMs}ms`);
    
    return true;
  }

  // Process detected text for wake phrases
  processText(text) {
    if (!text || typeof text !== 'string') return;
    
    const lowerText = text.toLowerCase().trim();
    console.log('🎤 Processing text:', lowerText);
    
    // Check if any wake phrase is detected
    const detectedPhrase = this.wakePhrases.find(phrase => 
      lowerText.includes(phrase)
    );
    
    if (detectedPhrase) {
      console.log('🎤 Wake phrase detected:', detectedPhrase);
      this.handleWakePhraseDetected(detectedPhrase);
    }
  }

  // Handle wake phrase detection
  handleWakePhraseDetected(phrase) {
    const now = Date.now();
    
    // Add current hit
    this.hits.push(now);
    
    // Clean old hits outside the time window
    this.hits = this.hits.filter(timestamp => now - timestamp <= this.windowMs);
    
    console.log(`🎤 Hit recorded. Total hits in window: ${this.hits.length}`);
    
    // Check if we have enough hits for emergency
    if (this.hits.length >= this.requiredHits) {
      console.log('🚨 Emergency threshold reached! Triggering emergency alert.');
      this.triggerEmergency();
    } else {
      // Single hit - show confirmation modal
      console.log('🎤 Single hit detected. Showing confirmation modal.');
      this.triggerSingleHit();
    }
  }

  // Trigger single hit (show confirmation modal)
  triggerSingleHit() {
    if (this.onSingleHit) {
      this.speakResponse('Wake phrase detected. Please confirm emergency alert.');
      this.onSingleHit();
    }
  }

  // Trigger emergency (auto-send alert)
  triggerEmergency() {
    if (this.onEmergency) {
      this.speakResponse('Emergency threshold reached! Sending alert immediately.');
      this.onEmergency();
      this.resetHits(); // Reset after emergency
    }
  }

  // Reset hit counter
  resetHits() {
    this.hits = [];
    console.log('🎤 Hit counter reset');
  }

  // Get current hit count
  getHitCount() {
    const now = Date.now();
    this.hits = this.hits.filter(timestamp => now - timestamp <= this.windowMs);
    return this.hits.length;
  }

  // Get time until next hit window
  getTimeUntilNextWindow() {
    if (this.hits.length === 0) return 0;
    
    const oldestHit = Math.min(...this.hits);
    const now = Date.now();
    const timeElapsed = now - oldestHit;
    
    return Math.max(0, this.windowMs - timeElapsed);
  }

  // Get hit status for UI display
  getHitStatus() {
    const count = this.getHitCount();
    const timeLeft = this.getTimeUntilNextWindow();
    
    return {
      count,
      required: this.requiredHits,
      timeLeft,
      progress: Math.min(1, count / this.requiredHits),
      isEmergencyReady: count >= this.requiredHits
    };
  }

  // Speak response using text-to-speech
  async speakResponse(text) {
    if (!this.voiceEnabled) return;
    
    try {
      await Speech.speak(text, {
        language: 'en',
        pitch: 1.0,
        rate: this.voiceRate,
        volume: this.voiceVolume,
      });
      console.log('🗣️ Voice response:', text);
    } catch (error) {
      console.error('Error speaking response:', error);
    }
  }

  // Test wake phrase detection (for development)
  testWakePhrase(phrase) {
    console.log('🧪 Testing wake phrase:', phrase);
    this.processText(phrase);
  }

  // Simulate multiple hits for testing
  testMultipleHits() {
    console.log('🧪 Testing multiple hits...');
    
    // Simulate 3 hits in quick succession
    this.hits = [];
    const now = Date.now();
    
    for (let i = 0; i < this.requiredHits; i++) {
      this.hits.push(now - (i * 1000)); // 1 second apart
    }
    
    console.log(`🧪 Simulated ${this.hits.length} hits`);
    this.handleWakePhraseDetected('test phrase');
  }

  // Update settings
  updateSettings(settings) {
    if (settings.wakePhrases) {
      this.wakePhrases = settings.wakePhrases;
    }
    if (settings.windowMs) {
      this.windowMs = settings.windowMs;
    }
    if (settings.requiredHits) {
      this.requiredHits = settings.requiredHits;
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
    
    console.log('🎤 Voice trigger settings updated:', settings);
  }

  // Get current settings
  getSettings() {
    return {
      wakePhrases: this.wakePhrases,
      windowMs: this.windowMs,
      requiredHits: this.requiredHits,
      voiceEnabled: this.voiceEnabled,
      voiceVolume: this.voiceVolume,
      voiceRate: this.voiceRate
    };
  }

  // Start listening mode
  startListening() {
    this.isListening = true;
    console.log('🎤 Voice trigger listening started');
  }

  // Stop listening mode
  stopListening() {
    this.isListening = false;
    console.log('🎤 Voice trigger listening stopped');
  }

  // Get system status
  getStatus() {
    return {
      isListening: this.isListening,
      hitStatus: this.getHitStatus(),
      settings: this.getSettings(),
      isInitialized: !!(this.onSingleHit && this.onEmergency)
    };
  }
}

// Create singleton instance
const voiceTrigger = new VoiceTrigger();

export default voiceTrigger;
