import * as Speech from 'expo-speech';
// TODO: Migrate to expo-audio when upgrading to SDK 54+ (expo-av is deprecated)
import { Audio } from 'expo-av';
import { Alert } from 'react-native';

class EnhancedVoiceService {
  constructor() {
    this.isListening = false;
    this.recording = null;
    this.sound = null;
    this.wakePhraseTimeout = null;
    this.confirmationTimeout = null;
    this.alertCancellationTimeout = null;
    this.currentAlertId = null;
    this.onAlertConfirmed = null;
    this.onAlertCancelled = null;
  }

  // Initialize audio permissions and setup
  async initialize() {
    try {
      console.log('Initializing enhanced voice service...');
      
      // Request audio recording permissions
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        console.error('Audio permissions not granted');
        return false;
      }
      
      // Set audio mode for recording
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      
      console.log('Enhanced voice service initialized successfully');
      return true;
    } catch (error) {
      console.error('Error initializing voice service:', error);
      return false;
    }
  }

  // Start listening for wake phrase
  async startWakePhraseDetection(onWakePhraseDetected) {
    if (this.isListening) return false;

    try {
      // Initialize if not already done
      const initialized = await this.initialize();
      if (!initialized) {
        throw new Error('Failed to initialize audio service');
      }

      this.isListening = true;
      console.log('🎤 Listening for wake phrase...');
      
      // Start recording
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      this.recording = recording;

      // Simulate wake phrase detection (in real app, this would use speech recognition)
      this.simulateWakePhraseDetection(onWakePhraseDetected);

      return true;
    } catch (error) {
      console.error('Error starting wake phrase detection:', error);
      this.isListening = false;
      return false;
    }
  }

  // Simulate wake phrase detection (replace with actual speech recognition)
  simulateWakePhraseDetection(onWakePhraseDetected) {
    // In a real app, this would continuously listen and analyze audio
    // For now, we'll simulate it with a button or timer
    console.log('🔍 Wake phrase detection active - say "Hey MummyHelp"');
    
    // Simulate detection after 2 seconds (for testing)
    setTimeout(() => {
      if (this.isListening) {
        this.onWakePhraseDetected(onWakePhraseDetected);
      }
    }, 2000);
  }

  // Handle wake phrase detection
  onWakePhraseDetected(onWakePhraseDetected) {
    this.stopWakePhraseDetection();
    this.speakResponse('Hey! I heard you say "Hey MummyHelp". How can I help you?');
    
    // Trigger the wake phrase callback
    if (onWakePhraseDetected) {
      onWakePhraseDetected();
    }
  }

  // Stop wake phrase detection
  async stopWakePhraseDetection() {
    if (this.recording) {
      await this.recording.stopAndUnloadAsync();
      this.recording = null;
    }
    this.isListening = false;
    console.log('🎤 Wake phrase detection stopped');
  }

  // Start voice command mode
  async startVoiceCommandMode() {
    try {
      console.log('🎯 Voice command mode activated');
      this.speakResponse('I\'m listening. Say "emergency" for urgent help, "check in" for safety update, or "cancel" to stop.');
      
      // Start listening for commands
      return this.startCommandListening();
    } catch (error) {
      console.error('Error starting voice command mode:', error);
      return false;
    }
  }

  // Listen for voice commands
  async startCommandListening() {
    try {
      // Simulate command detection (replace with actual speech recognition)
      this.simulateCommandDetection();
      return true;
    } catch (error) {
      console.error('Error starting command listening:', error);
      return false;
    }
  }

  // Simulate command detection
  simulateCommandDetection() {
    // In real app, this would listen for specific commands
    console.log('🎧 Listening for commands: emergency, check in, cancel');
    
    // Simulate command after 3 seconds (for testing)
    setTimeout(() => {
      this.handleVoiceCommand('emergency');
    }, 3000);
  }

  // Handle voice commands
  handleVoiceCommand(command) {
    console.log('🎯 Voice command detected:', command);
    
    switch (command.toLowerCase()) {
      case 'emergency':
        this.handleEmergencyCommand();
        break;
      case 'check in':
        this.handleCheckInCommand();
        break;
      case 'cancel':
        this.handleCancelCommand();
        break;
      default:
        this.speakResponse('I didn\'t understand that command. Please try again.');
        break;
    }
  }

  // Handle emergency command
  async handleEmergencyCommand() {
    this.speakResponse('Emergency alert requested. This will notify your parent immediately. Say "confirm" to send, or "cancel" to abort.');
    
    // Start confirmation flow
    this.startConfirmationFlow('emergency');
  }

  // Handle check-in command
  async handleCheckInCommand() {
    this.speakResponse('Check-in requested. This will let your parent know you\'re safe. Say "confirm" to send, or "cancel" to abort.');
    
    // Start confirmation flow
    this.startConfirmationFlow('check-in');
  }

  // Handle cancel command
  handleCancelCommand() {
    this.speakResponse('Voice commands cancelled. Returning to normal mode.');
    this.stopVoiceCommandMode();
  }

  // Stop voice command mode
  stopVoiceCommandMode() {
    console.log('🛑 Voice command mode stopped');
    // Clean up any ongoing processes
    if (this.confirmationTimeout) {
      clearTimeout(this.confirmationTimeout);
      this.confirmationTimeout = null;
    }
  }

  // Start confirmation flow for alerts
  startConfirmationFlow(alertType) {
    console.log(`🔄 Starting confirmation flow for ${alertType}`);
    
    // Set up confirmation timeout
    this.confirmationTimeout = setTimeout(() => {
      this.speakResponse('Confirmation timeout. Alert not sent.');
      this.resetConfirmationFlow();
    }, 30000); // 30 seconds to confirm

    // Start listening for confirmation
    this.startConfirmationListening(alertType);
  }

  // Listen for confirmation
  async startConfirmationListening(alertType) {
    try {
      console.log('✅ Listening for confirmation...');
      
      // Simulate confirmation detection
      this.simulateConfirmationDetection(alertType);
    } catch (error) {
      console.error('Error starting confirmation listening:', error);
    }
  }

  // Simulate confirmation detection
  simulateConfirmationDetection(alertType) {
    // In real app, this would listen for "confirm" or "cancel"
    console.log('🎧 Listening for: confirm or cancel');
    
    // Simulate confirmation after 2 seconds (for testing)
    setTimeout(() => {
      this.handleConfirmation('confirm', alertType);
    }, 2000);
  }

  // Handle confirmation response
  handleConfirmation(response, alertType) {
    clearTimeout(this.confirmationTimeout);
    
    if (response === 'confirm') {
      this.speakResponse(`${alertType === 'emergency' ? 'Emergency' : 'Check-in'} alert confirmed. Sending now...`);
      
      // Trigger alert creation
      if (this.onAlertConfirmed) {
        this.onAlertConfirmed(alertType);
      }
    } else {
      this.speakResponse('Alert cancelled. Returning to normal mode.');
    }
    
    this.resetConfirmationFlow();
  }

  // Reset confirmation flow
  resetConfirmationFlow() {
    if (this.confirmationTimeout) {
      clearTimeout(this.confirmationTimeout);
      this.confirmationTimeout = null;
    }
    this.stopVoiceCommandMode();
  }

  // Set alert callbacks
  setAlertCallbacks(onConfirmed, onCancelled) {
    this.onAlertConfirmed = onConfirmed;
    this.onAlertCancelled = onCancelled;
  }

  // Start alert cancellation window
  startAlertCancellationWindow(alertId, onCancelled) {
    this.currentAlertId = alertId;
    this.onAlertCancelled = onCancelled;
    
    console.log(`⏰ Alert cancellation window started for alert ${alertId}`);
    
    // Set cancellation timeout (30 seconds)
    this.alertCancellationTimeout = setTimeout(() => {
      this.speakResponse('Alert cancellation window expired.');
      this.resetAlertCancellation();
    }, 30000);
    
    // Start listening for cancellation command
    this.startCancellationListening();
  }

  // Listen for cancellation command
  async startCancellationListening() {
    try {
      console.log('❌ Listening for cancellation command...');
      this.speakResponse('Alert sent! Say "cancel alert" within 30 seconds to cancel it.');
      
      // Simulate cancellation detection
      this.simulateCancellationDetection();
    } catch (error) {
      console.error('Error starting cancellation listening:', error);
    }
  }

  // Simulate cancellation detection
  simulateCancellationDetection() {
    // In real app, this would listen for "cancel alert"
    console.log('🎧 Listening for: cancel alert');
    
    // Simulate cancellation after 5 seconds (for testing)
    setTimeout(() => {
      this.handleAlertCancellation();
    }, 5000);
  }

  // Handle alert cancellation
  handleAlertCancellation() {
    if (this.alertCancellationTimeout) {
      clearTimeout(this.alertCancellationTimeout);
      this.speakResponse('Alert cancellation confirmed. Cancelling alert now...');
      
      // Trigger alert cancellation
      if (this.onAlertCancelled && this.currentAlertId) {
        this.onAlertCancelled(this.currentAlertId);
      }
      
      this.resetAlertCancellation();
    }
  }

  // Reset alert cancellation
  resetAlertCancellation() {
    if (this.alertCancellationTimeout) {
      clearTimeout(this.alertCancellationTimeout);
      this.alertCancellationTimeout = null;
    }
    this.currentAlertId = null;
    this.onAlertCancelled = null;
  }

  // Speak response
  async speakResponse(text) {
    try {
      if (this.sound) {
        await this.sound.unloadAsync();
      }
      
      await Speech.speak(text, {
        language: 'en',
        pitch: 1.0,
        rate: 0.9,
        volume: 1.0,
      });
      
      console.log('🗣️ Voice response:', text);
    } catch (error) {
      console.error('Error speaking response:', error);
    }
  }

  // Stop all voice services
  async stop() {
    try {
      await this.stopWakePhraseDetection();
      this.resetConfirmationFlow();
      this.resetAlertCancellation();
      
      if (this.sound) {
        await this.sound.unloadAsync();
        this.sound = null;
      }
      
      console.log('🛑 Voice service stopped');
    } catch (error) {
      console.error('Error stopping voice service:', error);
    }
  }

  // Manual trigger for testing (remove in production)
  manualWakePhrase() {
    if (this.isListening) {
      this.onWakePhraseDetected(() => {
        console.log('🎤 Manual wake phrase triggered');
      });
    }
  }

  manualCommand(command) {
    this.handleVoiceCommand(command);
  }

  manualConfirmation(response, alertType) {
    this.handleConfirmation(response, alertType);
  }

  manualCancellation() {
    this.handleAlertCancellation();
  }
}

export default new EnhancedVoiceService();
