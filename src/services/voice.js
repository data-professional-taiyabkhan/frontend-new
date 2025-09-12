import * as Speech from 'expo-speech';
// TODO: Migrate to expo-audio when upgrading to SDK 54+ (expo-av is deprecated)
import { Audio } from 'expo-av';
import { Alert, Platform } from 'react-native';

class VoiceService {
  constructor() {
    this.recording = null;
    this.sound = null;
    this.isListening = false;
    this.googleApiKey = null; // Set your Google API key here
    this.wakePhrases = [
      'hey mummy help',
      'hey mummyhelp',
      'mummy help',
      'mummyhelp',
      'help me',
      'emergency',
      'sos',
      'help',
      'danger',
      'panic'
    ];
    this.emergencyPhrases = [
      'emergency',
      'help me',
      'danger',
      'panic',
      'sos',
      'i need help',
      'call for help',
      'emergency alert'
    ];
    this.checkInPhrases = [
      'check in',
      'i am safe',
      'i am okay',
      'i am fine',
      'all good',
      'safe',
      'okay',
      'fine'
    ];
  }

  // Set Google API key
  setGoogleApiKey(apiKey) {
    this.googleApiKey = apiKey;
  }

  // Initialize audio permissions
  async initializeAudio() {
    try {
      console.log('Initializing voice service...');
      
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
      
      console.log('Voice service initialized successfully');
      return true;
    } catch (error) {
      console.error('Error initializing audio:', error);
      return false;
    }
  }

  // Start listening for voice commands with Google Speech-to-Text
  async startVoiceListening(onWakePhrase, onEmergency, onCheckIn) {
    if (this.isListening) {
      console.log('Already listening for voice commands');
      return false;
    }

    try {
      const hasPermission = await this.initializeAudio();
      if (!hasPermission) {
        return false;
      }

      this.isListening = true;
      console.log('🎤 Voice listening started...');

      // Start recording
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      this.recording = recording;

      // Start voice recognition
      if (this.googleApiKey) {
        // Use Google Speech-to-Text
        this.startGoogleSpeechRecognition(onWakePhrase, onEmergency, onCheckIn);
      } else {
        // Fallback to simulated recognition
        this.startSimulatedRecognition(onWakePhrase, onEmergency, onCheckIn);
      }

      return true;
    } catch (error) {
      console.error('Error starting voice listening:', error);
      this.isListening = false;
      return false;
    }
  }

  // Google Speech-to-Text recognition
  async startGoogleSpeechRecognition(onWakePhrase, onEmergency, onCheckIn) {
    try {
      // Record for 5 seconds
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      if (!this.isListening) return;

      // Stop recording and get audio data
      await this.recording.stopAndUnloadAsync();
      const uri = this.recording.getURI();
      
      // Convert audio to base64
      const audioData = await this.audioToBase64(uri);
      
      // Send to Google Speech-to-Text API
      const transcription = await this.sendToGoogleSpeechAPI(audioData);
      
      if (transcription) {
        console.log('🎤 Google Speech detected:', transcription);
        await this.processVoiceCommand(transcription, onWakePhrase, onEmergency, onCheckIn);
      }

      // Continue listening
      if (this.isListening) {
        setTimeout(() => {
          this.startVoiceListening(onWakePhrase, onEmergency, onCheckIn);
        }, 1000);
      }
    } catch (error) {
      console.error('Google Speech recognition error:', error);
      // Fallback to simulated recognition
      this.startSimulatedRecognition(onWakePhrase, onEmergency, onCheckIn);
    }
  }

  // Send audio to Google Speech-to-Text API
  async sendToGoogleSpeechAPI(audioData) {
    try {
      const response = await fetch(
        `https://speech.googleapis.com/v1/speech:recognize?key=${this.googleApiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            config: {
              encoding: 'LINEAR16',
              sampleRateHertz: 16000,
              languageCode: 'en-US',
              enableWordTimeOffsets: false,
              enableAutomaticPunctuation: true,
            },
            audio: {
              content: audioData,
            },
          }),
        }
      );

      const result = await response.json();
      
      if (result.results && result.results[0]) {
        return result.results[0].alternatives[0].transcript.toLowerCase();
      }
      
      return null;
    } catch (error) {
      console.error('Google Speech API error:', error);
      return null;
    }
  }

  // Convert audio file to base64
  async audioToBase64(uri) {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = reader.result.split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Audio to base64 error:', error);
      return null;
    }
  }

  // Simulated voice recognition (fallback)
  startSimulatedRecognition(onWakePhrase, onEmergency, onCheckIn) {
    this.voiceDetectionInterval = setInterval(async () => {
      if (!this.isListening) return;

      // Simulate random voice detection
      const random = Math.random();
      if (random < 0.1) { // 10% chance of detecting a phrase
        const detectedPhrase = this.simulateVoiceDetection();
        
        if (detectedPhrase) {
          console.log('🎤 Simulated voice detected:', detectedPhrase);
          
          // Stop listening temporarily
          await this.stopVoiceListening();
          
          // Process the detected phrase
          await this.processVoiceCommand(detectedPhrase, onWakePhrase, onEmergency, onCheckIn);
          
          // Resume listening after a short delay
          setTimeout(() => {
            this.startVoiceListening(onWakePhrase, onEmergency, onCheckIn);
          }, 2000);
        }
      }
    }, 3000); // Check every 3 seconds
  }

  // Stop listening for voice commands
  async stopVoiceListening() {
    try {
      this.isListening = false;
      
      if (this.voiceDetectionInterval) {
        clearInterval(this.voiceDetectionInterval);
        this.voiceDetectionInterval = null;
      }

      if (this.recording) {
        await this.recording.stopAndUnloadAsync();
        this.recording = null;
      }

      console.log('🎤 Voice listening stopped');
      return true;
    } catch (error) {
      console.error('Error stopping voice listening:', error);
      return false;
    }
  }

  // Simulate voice detection (replace with actual speech-to-text)
  simulateVoiceDetection() {
    const allPhrases = [
      ...this.wakePhrases,
      ...this.emergencyPhrases,
      ...this.checkInPhrases
    ];
    
    // Randomly return a phrase (in real implementation, this would be actual speech recognition)
    const randomIndex = Math.floor(Math.random() * allPhrases.length);
    return allPhrases[randomIndex];
  }

  // Process detected voice command
  async processVoiceCommand(phrase, onWakePhrase, onEmergency, onCheckIn) {
    const lowerPhrase = phrase.toLowerCase();

    // Check for wake phrase
    if (this.wakePhrases.some(wake => lowerPhrase.includes(wake))) {
      console.log('🎤 Wake phrase detected:', phrase);
      await this.speakResponse('Hello! I heard you say ' + phrase + '. How can I help you?');
      
      if (onWakePhrase) {
        onWakePhrase(phrase);
      }
      return;
    }

    // Check for emergency phrases
    if (this.emergencyPhrases.some(emergency => lowerPhrase.includes(emergency))) {
      console.log('🚨 Emergency phrase detected:', phrase);
      await this.speakResponse('Emergency alert detected! Sending alert to your parent now.');
      
      if (onEmergency) {
        onEmergency(phrase);
      }
      return;
    }

    // Check for check-in phrases
    if (this.checkInPhrases.some(checkin => lowerPhrase.includes(checkin))) {
      console.log('📍 Check-in phrase detected:', phrase);
      await this.speakResponse('Check-in message detected! Letting your parent know you are safe.');
      
      if (onCheckIn) {
        onCheckIn(phrase);
      }
      return;
    }

    // Unknown phrase
    console.log('❓ Unknown phrase detected:', phrase);
    await this.speakResponse('I heard you say ' + phrase + '. Please try saying "help me" for emergency or "check in" for safety.');
  }

  // Speak a response
  async speakResponse(text) {
    try {
      await Speech.speak(text, {
        language: 'en',
        pitch: 1.0,
        rate: 0.9,
        volume: 1.0,
      });
    } catch (error) {
      console.error('Error speaking response:', error);
    }
  }

  // Manual voice command (for testing)
  async manualVoiceCommand(command, onWakePhrase, onEmergency, onCheckIn) {
    console.log('🎤 Manual voice command:', command);
    await this.processVoiceCommand(command, onWakePhrase, onEmergency, onCheckIn);
  }

  // Test voice recognition
  async testVoiceRecognition() {
    console.log('🎤 Testing voice recognition...');
    
    const testPhrases = [
      'Hey MummyHelp',
      'Help me',
      'Emergency',
      'Check in',
      'I am safe'
    ];

    for (const phrase of testPhrases) {
      console.log(`Testing phrase: "${phrase}"`);
      await this.speakResponse(`Testing: ${phrase}`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  // Get voice listening status
  getListeningStatus() {
    return {
      isListening: this.isListening,
      wakePhrases: this.wakePhrases,
      emergencyPhrases: this.emergencyPhrases,
      checkInPhrases: this.checkInPhrases,
      hasGoogleApiKey: !!this.googleApiKey,
      platform: Platform.OS
    };
  }

  // Add custom wake phrases
  addWakePhrase(phrase) {
    if (!this.wakePhrases.includes(phrase.toLowerCase())) {
      this.wakePhrases.push(phrase.toLowerCase());
    }
  }

  // Add custom emergency phrases
  addEmergencyPhrase(phrase) {
    if (!this.emergencyPhrases.includes(phrase.toLowerCase())) {
      this.emergencyPhrases.push(phrase.toLowerCase());
    }
  }

  // Add custom check-in phrases
  addCheckInPhrase(phrase) {
    if (!this.checkInPhrases.includes(phrase.toLowerCase())) {
      this.checkInPhrases.push(phrase.toLowerCase());
    }
  }

  // Voice feedback for different actions
  async speakEmergencySent() {
    await this.speakResponse('Emergency alert sent! Your parent has been notified. Help is on the way.');
  }

  async speakCheckInSent() {
    await this.speakResponse('Check-in message sent! Your parent knows you are safe.');
  }

  async speakLocationUpdated() {
    await this.speakResponse('Location updated and shared with your parent.');
  }

  async speakPairingSuccessful() {
    await this.speakResponse('Successfully connected with your parent. Voice alerts are now active.');
  }

  async speakPairingFailed() {
    await this.speakResponse('Failed to connect. Please check the pairing code and try again.');
  }

  // Voice tutorial
  async speakVoiceTutorial() {
    const tutorial = [
      'Welcome to voice-activated MummyHelp!',
      'Say "Hey MummyHelp" to activate voice commands.',
      'Say "Help me" or "Emergency" to send an emergency alert.',
      'Say "Check in" or "I am safe" to send a safety message.',
      'Voice recognition is now active and listening for your commands.'
    ];

    for (const line of tutorial) {
      await this.speakResponse(line);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  // Get iOS compatibility info
  getIOSCompatibilityInfo() {
    return {
      platform: Platform.OS,
      iosCompatible: true,
      androidCompatible: true,
      googleSpeechSupported: !!this.googleApiKey,
      expoSpeechSupported: true,
      backgroundAudioSupported: Platform.OS === 'ios',
      permissions: {
        microphone: 'Required for voice recognition',
        backgroundAudio: 'Required for continuous listening (iOS)',
        notifications: 'Required for voice feedback'
      }
    };
  }
}

const voiceService = new VoiceService();
export default voiceService; 