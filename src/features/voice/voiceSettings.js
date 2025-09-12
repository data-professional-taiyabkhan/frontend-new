import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Speech from 'expo-speech';

class VoiceSettings {
  constructor() {
    // Default settings
    this.defaultSettings = {
      // Voice feedback settings
      voiceEnabled: true,
      voiceVolume: 0.8,
      voiceRate: 0.9,
      voicePitch: 1.0,
      voiceLanguage: 'en-US',
      
      // Wake phrase settings
      wakePhrases: ['mummy help', 'hey mummy help', 'help me mummy'],
      hitThreshold: 3,
      timeWindow: 10000, // 10 seconds
      autoEmergency: true,
      
      // Command settings
      commandsEnabled: true,
      customCommands: [],
      commandAliases: {},
      
      // Recognition settings
      recognitionEnabled: true,
      continuousListening: true,
      sensitivity: 0.7,
      timeout: 5000,
      
      // Notification settings
      voiceNotifications: true,
      commandConfirmations: true,
      errorFeedback: true,
      
      // Privacy settings
      saveVoiceHistory: true,
      maxHistoryItems: 50,
      autoClearHistory: false,
      clearHistoryAfter: 24 * 60 * 60 * 1000, // 24 hours
    };
    
    this.settings = { ...this.defaultSettings };
    this.listeners = new Set();
    
    console.log('🎛️ Voice settings service initialized');
  }

  // Initialize settings from storage
  async initialize() {
    try {
      const storedSettings = await AsyncStorage.getItem('voiceSettings');
      if (storedSettings) {
        const parsed = JSON.parse(storedSettings);
        this.settings = { ...this.defaultSettings, ...parsed };
        console.log('🎛️ Voice settings loaded from storage');
      } else {
        await this.saveSettings();
        console.log('🎛️ Default voice settings saved');
      }
      
      // Apply settings to speech
      this.applySpeechSettings();
      
      return true;
    } catch (error) {
      console.error('🎛️ Error loading voice settings:', error);
      return false;
    }
  }

  // Get all settings
  getSettings() {
    return { ...this.settings };
  }

  // Get a specific setting
  getSetting(key) {
    return this.settings[key];
  }

  // Get speech options for Speech.speak()
  getSpeechOptions() {
    return {
      language: this.settings.voiceLanguage,
      rate: this.settings.voiceRate,
      pitch: this.settings.voicePitch,
      volume: this.settings.voiceVolume,
    };
  }

  // Update a single setting
  async updateSetting(key, value) {
    if (key in this.settings) {
      this.settings[key] = value;
      await this.saveSettings();
      this.notifyListeners(key, value);
      
      // Apply speech settings if voice-related
      if (key.startsWith('voice')) {
        this.applySpeechSettings();
      }
      
      console.log(`🎛️ Setting updated: ${key} = ${value}`);
      return true;
    }
    return false;
  }

  // Update multiple settings
  async updateSettings(newSettings) {
    try {
      Object.assign(this.settings, newSettings);
      await this.saveSettings();
      
      // Notify listeners for each changed setting
      Object.keys(newSettings).forEach(key => {
        this.notifyListeners(key, newSettings[key]);
      });
      
      // Apply speech settings
      this.applySpeechSettings();
      
      console.log('🎛️ Multiple settings updated:', newSettings);
      return true;
    } catch (error) {
      console.error('🎛️ Error updating settings:', error);
      return false;
    }
  }

  // Reset settings to defaults
  async resetToDefaults() {
    try {
      this.settings = { ...this.defaultSettings };
      await this.saveSettings();
      
      // Notify all listeners
      this.notifyListeners('reset', this.settings);
      
      // Apply speech settings
      this.applySpeechSettings();
      
      console.log('🎛️ Settings reset to defaults');
      return true;
    } catch (error) {
      console.error('🎛️ Error resetting settings:', error);
      return false;
    }
  }

  // Save settings to storage
  async saveSettings() {
    try {
      await AsyncStorage.setItem('voiceSettings', JSON.stringify(this.settings));
      return true;
    } catch (error) {
      console.error('🎛️ Error saving settings:', error);
      return false;
    }
  }

  // Apply speech settings to expo-speech
  applySpeechSettings() {
    try {
      // Store speech settings for use in Speech.speak() calls
      // Note: expo-speech doesn't have global default methods
      // Settings are applied when calling Speech.speak() with options
      console.log('🎛️ Speech settings stored:', {
        language: this.settings.voiceLanguage,
        rate: this.settings.voiceRate,
        pitch: this.settings.voicePitch,
        volume: this.settings.voiceVolume
      });
    } catch (error) {
      console.error('🎛️ Error storing speech settings:', error);
    }
  }

  // Wake phrase management
  async addWakePhrase(phrase) {
    if (!this.settings.wakePhrases.includes(phrase)) {
      this.settings.wakePhrases.push(phrase);
      await this.saveSettings();
      this.notifyListeners('wakePhrases', this.settings.wakePhrases);
      console.log(`🎛️ Wake phrase added: "${phrase}"`);
      return true;
    }
    return false;
  }

  async removeWakePhrase(phrase) {
    const index = this.settings.wakePhrases.indexOf(phrase);
    if (index > -1) {
      this.settings.wakePhrases.splice(index, 1);
      await this.saveSettings();
      this.notifyListeners('wakePhrases', this.settings.wakePhrases);
      console.log(`🎛️ Wake phrase removed: "${phrase}"`);
      return true;
    }
    return false;
  }

  async updateWakePhrases(phrases) {
    this.settings.wakePhrases = [...phrases];
    await this.saveSettings();
    this.notifyListeners('wakePhrases', this.settings.wakePhrases);
    console.log('🎛️ Wake phrases updated:', phrases);
    return true;
  }

  // Custom command management
  async addCustomCommand(phrase, action, description) {
    const command = {
      id: Date.now().toString(),
      phrase: phrase.toLowerCase().trim(),
      action,
      description,
      timestamp: new Date().toISOString(),
      enabled: true
    };
    
    this.settings.customCommands.push(command);
    await this.saveSettings();
    this.notifyListeners('customCommands', this.settings.customCommands);
    console.log(`🎛️ Custom command added: "${phrase}" -> ${action}`);
    return command;
  }

  async removeCustomCommand(commandId) {
    const index = this.settings.customCommands.findIndex(cmd => cmd.id === commandId);
    if (index > -1) {
      const removed = this.settings.customCommands.splice(index, 1)[0];
      await this.saveSettings();
      this.notifyListeners('customCommands', this.settings.customCommands);
      console.log(`🎛️ Custom command removed: "${removed.phrase}"`);
      return true;
    }
    return false;
  }

  async updateCustomCommand(commandId, updates) {
    const command = this.settings.customCommands.find(cmd => cmd.id === commandId);
    if (command) {
      Object.assign(command, updates);
      command.timestamp = new Date().toISOString();
      await this.saveSettings();
      this.notifyListeners('customCommands', this.settings.customCommands);
      console.log(`🎛️ Custom command updated: "${command.phrase}"`);
      return true;
    }
    return false;
  }

  // Command alias management
  async addCommandAlias(alias, command) {
    this.settings.commandAliases[alias.toLowerCase().trim()] = command;
    await this.saveSettings();
    this.notifyListeners('commandAliases', this.settings.commandAliases);
    console.log(`🎛️ Command alias added: "${alias}" -> "${command}"`);
    return true;
  }

  async removeCommandAlias(alias) {
    if (this.settings.commandAliases[alias.toLowerCase().trim()]) {
      delete this.settings.commandAliases[alias.toLowerCase().trim()];
      await this.saveSettings();
      this.notifyListeners('commandAliases', this.settings.commandAliases);
      console.log(`🎛️ Command alias removed: "${alias}"`);
      return true;
    }
    return false;
  }

  // Get available languages
  getAvailableLanguages() {
    return [
      { code: 'en-US', name: 'English (US)', flag: '🇺🇸' },
      { code: 'en-GB', name: 'English (UK)', flag: '🇬🇧' },
      { code: 'es-ES', name: 'Spanish', flag: '🇪🇸' },
      { code: 'fr-FR', name: 'French', flag: '🇫🇷' },
      { code: 'de-DE', name: 'German', flag: '🇩🇪' },
      { code: 'it-IT', name: 'Italian', flag: '🇮🇹' },
      { code: 'pt-BR', name: 'Portuguese (Brazil)', flag: '🇧🇷' },
      { code: 'ru-RU', name: 'Russian', flag: '🇷🇺' },
      { code: 'ja-JP', name: 'Japanese', flag: '🇯🇵' },
      { code: 'ko-KR', name: 'Korean', flag: '🇰🇷' },
      { code: 'zh-CN', name: 'Chinese (Simplified)', flag: '🇨🇳' },
      { code: 'ar-SA', name: 'Arabic', flag: '🇸🇦' },
      { code: 'hi-IN', name: 'Hindi', flag: '🇮🇳' },
    ];
  }

  // Get voice presets
  getVoicePresets() {
    return {
      'default': {
        name: 'Default',
        volume: 0.8,
        rate: 0.9,
        pitch: 1.0,
        language: 'en-US'
      },
      'slow': {
        name: 'Slow & Clear',
        volume: 0.9,
        rate: 0.7,
        pitch: 1.0,
        language: 'en-US'
      },
      'fast': {
        name: 'Quick',
        volume: 0.7,
        rate: 1.2,
        pitch: 1.0,
        language: 'en-US'
      },
      'child': {
        name: 'Child Friendly',
        volume: 0.9,
        rate: 0.8,
        pitch: 1.1,
        language: 'en-US'
      },
      'elderly': {
        name: 'Elderly Friendly',
        volume: 1.0,
        rate: 0.6,
        pitch: 0.9,
        language: 'en-US'
      }
    };
  }

  // Apply voice preset
  async applyVoicePreset(presetName) {
    const presets = this.getVoicePresets();
    const preset = presets[presetName];
    
    if (preset) {
      await this.updateSettings({
        voiceVolume: preset.volume,
        voiceRate: preset.rate,
        voicePitch: preset.pitch,
        voiceLanguage: preset.language
      });
      
      console.log(`🎛️ Voice preset applied: ${preset.name}`);
      return true;
    }
    return false;
  }

  // Export settings
  async exportSettings() {
    try {
      const exportData = {
        settings: this.settings,
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      };
      
      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      console.error('🎛️ Error exporting settings:', error);
      return null;
    }
  }

  // Import settings
  async importSettings(settingsJson) {
    try {
      const importData = JSON.parse(settingsJson);
      
      if (importData.settings && importData.version) {
        // Merge with current settings, keeping current values for missing keys
        this.settings = { ...this.settings, ...importData.settings };
        await this.saveSettings();
        
        // Notify all listeners
        this.notifyListeners('import', this.settings);
        
        // Apply speech settings
        this.applySpeechSettings();
        
        console.log('🎛️ Settings imported successfully');
        return true;
      }
      return false;
    } catch (error) {
      console.error('🎛️ Error importing settings:', error);
      return false;
    }
  }

  // Event listener management
  addListener(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  removeListener(callback) {
    this.listeners.delete(callback);
  }

  notifyListeners(key, value) {
    this.listeners.forEach(callback => {
      try {
        callback(key, value, this.settings);
      } catch (error) {
        console.error('🎛️ Error in settings listener:', error);
      }
    });
  }

  // Get settings summary
  getSettingsSummary() {
    return {
      totalSettings: Object.keys(this.settings).length,
      wakePhrasesCount: this.settings.wakePhrases.length,
      customCommandsCount: this.settings.customCommands.length,
      commandAliasesCount: Object.keys(this.settings.commandAliases).length,
      voiceEnabled: this.settings.voiceEnabled,
      recognitionEnabled: this.settings.recognitionEnabled,
      commandsEnabled: this.settings.commandsEnabled,
      lastUpdated: new Date().toISOString()
    };
  }

  // Validate settings
  validateSettings() {
    const errors = [];
    
    // Validate numeric ranges
    if (this.settings.voiceVolume < 0 || this.settings.voiceVolume > 1) {
      errors.push('Voice volume must be between 0 and 1');
    }
    
    if (this.settings.voiceRate < 0.1 || this.settings.voiceRate > 2.0) {
      errors.push('Voice rate must be between 0.1 and 2.0');
    }
    
    if (this.settings.voicePitch < 0.5 || this.settings.voicePitch > 2.0) {
      errors.push('Voice pitch must be between 0.5 and 2.0');
    }
    
    if (this.settings.hitThreshold < 1 || this.settings.hitThreshold > 10) {
      errors.push('Hit threshold must be between 1 and 10');
    }
    
    if (this.settings.timeWindow < 1000 || this.settings.timeWindow > 60000) {
      errors.push('Time window must be between 1 and 60 seconds');
    }
    
    // Validate wake phrases
    if (this.settings.wakePhrases.length === 0) {
      errors.push('At least one wake phrase is required');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Cleanup
  cleanup() {
    this.listeners.clear();
    console.log('🎛️ Voice settings service cleaned up');
  }
}

// Create singleton instance
const voiceSettings = new VoiceSettings();

export default voiceSettings;
