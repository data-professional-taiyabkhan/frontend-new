import * as Speech from 'expo-speech';
import { Alert } from 'react-native';
import { alertAPI } from '../../services/api';
import locationService from '../../services/location';
import notificationService from '../../services/notifications';

class VoiceCommands {
  constructor() {
    this.commands = new Map();
    this.aliases = new Map();
    this.onCommandExecuted = null;
    
    // Voice feedback settings
    this.voiceEnabled = true;
    this.voiceVolume = 1.0;
    this.voiceRate = 0.9;
    
    // Initialize default commands
    this.initializeDefaultCommands();
    
    console.log('🎤 Voice commands system initialized');
  }

  // Initialize default voice commands
  initializeDefaultCommands() {
    // Emergency commands
    this.registerCommand('emergency', 'emergency', 'Triggers emergency alert');
    this.registerCommand('help', 'emergency', 'Triggers emergency alert');
    this.registerCommand('sos', 'emergency', 'Triggers emergency alert');
    this.registerCommand('danger', 'emergency', 'Triggers emergency alert');
    
    // Check-in commands
    this.registerCommand('check in', 'checkin', 'Sends check-in message');
    this.registerCommand('checkin', 'checkin', 'Sends check-in message');
    this.registerCommand('safe', 'checkin', 'Sends check-in message');
    this.registerCommand('i am safe', 'checkin', 'Sends check-in message');
    this.registerCommand('im safe', 'checkin', 'Sends check-in message');
    
    // Location commands
    this.registerCommand('where am i', 'location', 'Gets current location');
    this.registerCommand('location', 'location', 'Gets current location');
    this.registerCommand('my location', 'location', 'Gets current location');
    this.registerCommand('current location', 'location', 'Gets current location');
    this.registerCommand('share location', 'shareLocation', 'Shares current location with parent');
    this.registerCommand('send location', 'shareLocation', 'Shares current location with parent');
    
    // Status commands
    this.registerCommand('status', 'status', 'Gets app status');
    this.registerCommand('how am i', 'status', 'Gets app status');
    this.registerCommand('whats my status', 'status', 'Gets app status');
    
    // Voice control commands
    this.registerCommand('stop listening', 'stopVoice', 'Stops voice recognition');
    this.registerCommand('stop voice', 'stopVoice', 'Stops voice recognition');
    this.registerCommand('start listening', 'startVoice', 'Starts voice recognition');
    this.registerCommand('start voice', 'startVoice', 'Starts voice recognition');
    
    // Test commands
    this.registerCommand('test', 'test', 'Runs test command');
    this.registerCommand('test voice', 'test', 'Runs test command');
    
    console.log('🎤 Default voice commands registered');
  }

  // Register a new voice command
  registerCommand(phrase, action, description) {
    const normalizedPhrase = phrase.toLowerCase().trim();
    
    this.commands.set(normalizedPhrase, {
      action,
      description,
      phrase: normalizedPhrase
    });
    
    // Also register common variations
    const variations = this.generateVariations(normalizedPhrase);
    variations.forEach(variation => {
      this.aliases.set(variation, normalizedPhrase);
    });
    
    console.log(`🎤 Command registered: "${phrase}" -> ${action}`);
  }

  // Generate common variations of a phrase
  generateVariations(phrase) {
    const variations = [];
    
    // Add common prefixes
    ['hey', 'hi', 'hello', 'please', 'can you', 'could you'].forEach(prefix => {
      variations.push(`${prefix} ${phrase}`);
    });
    
    // Add common suffixes
    ['please', 'now', 'quick', 'fast'].forEach(suffix => {
      variations.push(`${phrase} ${suffix}`);
    });
    
    // Add contractions
    if (phrase.includes('i am')) {
      variations.push(phrase.replace('i am', 'im'));
    }
    if (phrase.includes('i will')) {
      variations.push(phrase.replace('i will', 'ill'));
    }
    
    return variations;
  }

  // Process voice input and execute commands
  async processVoiceInput(text) {
    if (!text || typeof text !== 'string') return null;
    
    const normalizedText = text.toLowerCase().trim();
    console.log('🎤 Processing voice input:', normalizedText);
    
    // Check for exact command match
    let command = this.commands.get(normalizedText);
    
    // If no exact match, check aliases
    if (!command) {
      const alias = this.aliases.get(normalizedText);
      if (alias) {
        command = this.commands.get(alias);
      }
    }
    
    // If still no match, try partial matching
    if (!command) {
      command = this.findPartialMatch(normalizedText);
    }
    
    if (command) {
      console.log(`🎤 Command matched: "${normalizedText}" -> ${command.action}`);
      return await this.executeCommand(command.action, normalizedText);
    } else {
      console.log('🎤 No command matched:', normalizedText);
      await this.speakResponse('Command not recognized. Please try again.');
      return {
        type: 'no_match',
        input: normalizedText,
        message: 'Command not recognized'
      };
    }
  }

  // Find partial matches for voice input
  findPartialMatch(input) {
    let bestMatch = null;
    let bestScore = 0;
    
    for (const [phrase, command] of this.commands) {
      // Check if input contains the command phrase
      if (input.includes(phrase)) {
        const score = phrase.length / input.length;
        if (score > bestScore) {
          bestScore = score;
          bestMatch = command;
        }
      }
      
      // Check if command phrase contains the input
      if (phrase.includes(input)) {
        const score = input.length / phrase.length;
        if (score > bestScore) {
          bestScore = score;
          bestMatch = command;
        }
      }
    }
    
    // Only return match if confidence is high enough
    return bestScore > 0.6 ? bestMatch : null;
  }

  // Execute a voice command
  async executeCommand(action, input) {
    try {
      console.log(`🎤 Executing command: ${action}`);
      
      let result = null;
      
      switch (action) {
        case 'emergency':
          result = await this.handleEmergencyCommand(input);
          break;
        case 'checkin':
          result = await this.handleCheckinCommand(input);
          break;
        case 'location':
          result = await this.handleLocationCommand(input);
          break;
        case 'shareLocation':
          result = await this.handleShareLocationCommand(input);
          break;
        case 'status':
          result = await this.handleStatusCommand(input);
          break;
        case 'stopVoice':
          result = await this.handleStopVoiceCommand(input);
          break;
        case 'startVoice':
          result = await this.handleStartVoiceCommand(input);
          break;
        case 'test':
          result = await this.handleTestCommand(input);
          break;
        default:
          result = {
            type: 'unknown_action',
            action,
            input,
            message: 'Unknown action'
          };
      }
      
      // Notify callback if registered
      if (this.onCommandExecuted) {
        this.onCommandExecuted(result);
      }
      
      return result;
    } catch (error) {
      console.error('🎤 Error executing command:', error);
      
      const errorResult = {
        type: 'error',
        action,
        input,
        error: error.message,
        message: 'Error executing command'
      };
      
      // Notify callback if registered
      if (this.onCommandExecuted) {
        this.onCommandExecuted(errorResult);
      }
      
      return errorResult;
    }
  }

  // Handle emergency command
  async handleEmergencyCommand(input) {
    await this.speakResponse('Emergency command recognized. Processing...');
    
    try {
      // Get current location
      const location = await locationService.getCurrentLocationWithAddress();
      
      if (!location) {
        await this.speakResponse('Could not get your location. Please try again.');
        return {
          type: 'emergency_failed',
          input,
          message: 'Location not available',
          action: 'trigger_emergency'
        };
      }

      // Send emergency alert
      const response = await alertAPI.createAlertWithLocation(
        {
          type: 'emergency',
          message: 'Emergency alert triggered by voice command',
          location: location.address || 'Current location'
        },
        location
      );

      if (response.success) {
        await this.speakResponse('Emergency alert sent successfully. Help is on the way.');
        
        // Send local notification
        await notificationService.sendLocalNotification(
          '🚨 Emergency Alert Sent!',
          'Your parent has been notified via voice command.',
          {
            type: 'voice_emergency',
            timestamp: new Date().toISOString(),
          }
        );
        
        return {
          type: 'emergency_success',
          input,
          message: 'Emergency alert sent successfully',
          action: 'trigger_emergency',
          alertId: response.data.alert.id,
          location: location.address
        };
      } else {
        throw new Error(response.message || 'Failed to send emergency alert');
      }
    } catch (error) {
      console.error('🎤 Emergency command error:', error);
      await this.speakResponse('Failed to send emergency alert. Please try again.');
      
      return {
        type: 'emergency_failed',
        input,
        message: 'Failed to send emergency alert',
        action: 'trigger_emergency',
        error: error.message
      };
    }
  }

  // Handle check-in command
  async handleCheckinCommand(input) {
    await this.speakResponse('Check-in command recognized. Sending safe message...');
    
    try {
      // Get current location
      const location = await locationService.getCurrentLocationWithAddress();
      
      if (!location) {
        await this.speakResponse('Could not get your location. Please try again.');
        return {
          type: 'checkin_failed',
          input,
          message: 'Location not available',
          action: 'send_checkin'
        };
      }

      // Send check-in alert
      const response = await alertAPI.createAlertWithLocation(
        {
          type: 'checkin',
          message: 'Check-in message: I am safe and well',
          location: location.address || 'Current location'
        },
        location
      );

      if (response.success) {
        await this.speakResponse('Check-in message sent successfully. Your parent knows you are safe.');
        
        // Send local notification
        await notificationService.sendLocalNotification(
          '✅ Check-in Sent!',
          'Your parent has been notified that you are safe.',
          {
            type: 'voice_checkin',
            timestamp: new Date().toISOString(),
          }
        );
        
        return {
          type: 'checkin_success',
          input,
          message: 'Check-in message sent successfully',
          action: 'send_checkin',
          alertId: response.data.alert.id,
          location: location.address
        };
      } else {
        throw new Error(response.message || 'Failed to send check-in message');
      }
    } catch (error) {
      console.error('🎤 Check-in command error:', error);
      await this.speakResponse('Failed to send check-in message. Please try again.');
      
      return {
        type: 'checkin_failed',
        input,
        message: 'Failed to send check-in message',
        action: 'send_checkin',
        error: error.message
      };
    }
  }

  // Handle location command
  async handleLocationCommand(input) {
    await this.speakResponse('Location command recognized. Getting current location...');
    
    try {
      // Get current location with address
      const location = await locationService.getCurrentLocationWithAddress();
      
      if (!location) {
        await this.speakResponse('Could not get your location. Please check location permissions.');
        return {
          type: 'location_failed',
          input,
          message: 'Location not available',
          action: 'get_location'
        };
      }

      // Send location to backend
      const locationSent = await locationService.sendLocationToBackend(location);
      
      if (locationSent) {
        const locationText = location.address || `Latitude ${location.latitude.toFixed(4)}, Longitude ${location.longitude.toFixed(4)}`;
        await this.speakResponse(`Your current location is ${locationText}. Location has been shared with your parent.`);
        
        // Send local notification
        await notificationService.sendLocalNotification(
          '📍 Location Shared!',
          `Your location has been shared: ${locationText}`,
          {
            type: 'voice_location',
            timestamp: new Date().toISOString(),
            location: locationText
          }
        );
        
        return {
          type: 'location_success',
          input,
          message: 'Location retrieved and shared successfully',
          action: 'get_location',
          location: location.address,
          coordinates: {
            latitude: location.latitude,
            longitude: location.longitude
          }
        };
      } else {
        throw new Error('Failed to send location to backend');
      }
    } catch (error) {
      console.error('🎤 Location command error:', error);
      await this.speakResponse('Failed to get your location. Please try again.');
      
      return {
        type: 'location_failed',
        input,
        message: 'Failed to get location',
        action: 'get_location',
        error: error.message
      };
    }
  }

  // Handle share location command
  async handleShareLocationCommand(input) {
    await this.speakResponse('Share location command recognized. Sharing your location...');
    
    try {
      // Get current location with address
      const location = await locationService.getCurrentLocationWithAddress();
      
      if (!location) {
        await this.speakResponse('Could not get your location. Please check location permissions.');
        return {
          type: 'shareLocation_failed',
          input,
          message: 'Location not available',
          action: 'share_location'
        };
      }

      // Send location to backend
      const locationSent = await locationService.sendLocationToBackend(location);
      
      if (locationSent) {
        const locationText = location.address || `Latitude ${location.latitude.toFixed(4)}, Longitude ${location.longitude.toFixed(4)}`;
        await this.speakResponse(`Location shared successfully. Your parent can now see you are at ${locationText}.`);
        
        // Send local notification
        await notificationService.sendLocalNotification(
          '📍 Location Shared!',
          `Your location has been shared with your parent: ${locationText}`,
          {
            type: 'voice_share_location',
            timestamp: new Date().toISOString(),
            location: locationText
          }
        );
        
        return {
          type: 'shareLocation_success',
          input,
          message: 'Location shared successfully',
          action: 'share_location',
          location: location.address,
          coordinates: {
            latitude: location.latitude,
            longitude: location.longitude
          }
        };
      } else {
        throw new Error('Failed to send location to backend');
      }
    } catch (error) {
      console.error('🎤 Share location command error:', error);
      await this.speakResponse('Failed to share your location. Please try again.');
      
      return {
        type: 'shareLocation_failed',
        input,
        message: 'Failed to share location',
        action: 'share_location',
        error: error.message
      };
    }
  }

  // Handle status command
  async handleStatusCommand(input) {
    await this.speakResponse('Status command recognized. Checking app status...');
    
    try {
      // Get various status information
      const locationStatus = await locationService.getLocationStatus();
      const hasLocationPermission = await locationService.checkLocationPermissions();
      const locationServicesEnabled = await locationService.checkLocationServices();
      
      // Build status message
      let statusMessage = 'App status: ';
      
      if (hasLocationPermission) {
        statusMessage += 'Location permissions granted. ';
      } else {
        statusMessage += 'Location permissions not granted. ';
      }
      
      if (locationServicesEnabled) {
        statusMessage += 'Location services are enabled. ';
      } else {
        statusMessage += 'Location services are disabled. ';
      }
      
      if (locationStatus.isTracking) {
        statusMessage += 'Location tracking is active. ';
      } else {
        statusMessage += 'Location tracking is not active. ';
      }
      
      if (locationStatus.currentLocation) {
        const accuracy = Math.round(locationStatus.currentLocation.accuracy || 0);
        statusMessage += `Current location accuracy: ${accuracy} meters. `;
      }
      
      await this.speakResponse(statusMessage);
      
      return {
        type: 'status_success',
        input,
        message: 'Status retrieved successfully',
        action: 'get_status',
        status: {
          locationPermission: hasLocationPermission,
          locationServices: locationServicesEnabled,
          locationTracking: locationStatus.isTracking,
          hasCurrentLocation: !!locationStatus.currentLocation,
          locationAccuracy: locationStatus.currentLocation?.accuracy
        }
      };
    } catch (error) {
      console.error('🎤 Status command error:', error);
      await this.speakResponse('Failed to get app status. Please try again.');
      
      return {
        type: 'status_failed',
        input,
        message: 'Failed to get status',
        action: 'get_status',
        error: error.message
      };
    }
  }

  // Handle stop voice command
  async handleStopVoiceCommand(input) {
    await this.speakResponse('Stopping voice recognition...');
    
    return {
      type: 'stopVoice',
      input,
      message: 'Voice recognition stopped',
      action: 'stop_voice'
    };
  }

  // Handle start voice command
  async handleStartVoiceCommand(input) {
    await this.speakResponse('Starting voice recognition...');
    
    return {
      type: 'startVoice',
      input,
      message: 'Voice recognition started',
      action: 'start_voice'
    };
  }

  // Handle test command
  async handleTestCommand(input) {
    await this.speakResponse('Test command recognized. Running test...');
    
    return {
      type: 'test',
      input,
      message: 'Test command executed',
      action: 'run_test'
    };
  }

  // Speak response using text-to-speech
  async speakResponse(text) {
    if (!this.voiceEnabled) return;
    
    try {
      await Speech.speak(text, {
        language: 'en-US',
        pitch: 1.0,
        rate: this.voiceRate,
        volume: this.voiceVolume,
      });
      console.log('🗣️ Voice response:', text);
    } catch (error) {
      console.error('Error speaking response:', error);
    }
  }

  // Get all registered commands
  getCommands() {
    const commands = [];
    for (const [phrase, command] of this.commands) {
      commands.push({
        phrase: command.phrase,
        action: command.action,
        description: command.description
      });
    }
    return commands;
  }

  // Get command help
  getCommandHelp() {
    const help = [];
    for (const [phrase, command] of this.commands) {
      help.push(`"${phrase}" - ${command.description}`);
    }
    return help;
  }

  // Set command executed callback
  setCommandCallback(callback) {
    this.onCommandExecuted = callback;
    console.log('🎤 Command callback registered');
  }

  // Update settings
  updateSettings(settings) {
    if (settings.voiceEnabled !== undefined) {
      this.voiceEnabled = settings.voiceEnabled;
    }
    if (settings.voiceVolume !== undefined) {
      this.voiceVolume = settings.voiceVolume;
    }
    if (settings.voiceRate !== undefined) {
      this.voiceRate = settings.voiceRate;
    }
    
    console.log('🎤 Voice commands settings updated:', settings);
  }

  // Test voice commands
  testVoiceCommands() {
    console.log('🧪 Testing voice commands...');
    
    const testInputs = [
      'emergency',
      'check in',
      'where am i',
      'status',
      'stop listening'
    ];
    
    testInputs.forEach((input, index) => {
      setTimeout(() => {
        this.processVoiceInput(input);
      }, index * 2000); // Test each command every 2 seconds
    });
  }

  // Clear all commands
  clearCommands() {
    this.commands.clear();
    this.aliases.clear();
    console.log('🎤 All voice commands cleared');
  }

  // Get system status
  getStatus() {
    return {
      commandsCount: this.commands.size,
      aliasesCount: this.aliases.size,
      voiceEnabled: this.voiceEnabled,
      hasCallback: !!this.onCommandExecuted
    };
  }
}

// Create singleton instance
const voiceCommands = new VoiceCommands();

export default voiceCommands;
