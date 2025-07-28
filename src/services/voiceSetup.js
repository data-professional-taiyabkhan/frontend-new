import voiceService from './voice';
import { VOICE_CONFIG } from '../config/voiceConfig';

// Initialize voice service with Google Speech-to-Text
export const initializeVoiceService = () => {
  try {
    // Set Google API key if available
    if (VOICE_CONFIG.GOOGLE_API_KEY) {
      voiceService.setGoogleApiKey(VOICE_CONFIG.GOOGLE_API_KEY);
      console.log('✅ Google Speech-to-Text API key configured');
    } else {
      console.log('⚠️ No Google API key found. Using simulated voice recognition.');
    }

    // Log voice service status
    const status = voiceService.getListeningStatus();
    console.log('🎤 Voice service status:', status);

    return true;
  } catch (error) {
    console.error('❌ Error initializing voice service:', error);
    return false;
  }
};

// Get voice service compatibility info
export const getVoiceCompatibilityInfo = () => {
  return voiceService.getIOSCompatibilityInfo();
};

// Test voice service functionality
export const testVoiceService = async () => {
  try {
    console.log('🧪 Testing voice service...');
    
    // Test speech synthesis
    await voiceService.speakResponse('Voice service test successful!');
    
    // Test voice tutorial
    await voiceService.speakVoiceTutorial();
    
    console.log('✅ Voice service test completed');
    return true;
  } catch (error) {
    console.error('❌ Voice service test failed:', error);
    return false;
  }
};

// Setup voice service for production
export const setupVoiceForProduction = async () => {
  try {
    // Initialize voice service
    const initialized = initializeVoiceService();
    if (!initialized) {
      throw new Error('Failed to initialize voice service');
    }

    // Test voice functionality
    const tested = await testVoiceService();
    if (!tested) {
      throw new Error('Voice service test failed');
    }

    console.log('✅ Voice service ready for production');
    return true;
  } catch (error) {
    console.error('❌ Voice service production setup failed:', error);
    return false;
  }
};

export default {
  initializeVoiceService,
  getVoiceCompatibilityInfo,
  testVoiceService,
  setupVoiceForProduction
}; 