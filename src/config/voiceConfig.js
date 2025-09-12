// Voice Recognition Configuration
export const VOICE_CONFIG = {
  // Google Cloud Speech-to-Text API Key
  // Get your API key from: https://console.cloud.google.com/apis/credentials
  GOOGLE_API_KEY: null, // Set your API key here
  
  // Voice Recognition Settings
  RECOGNITION: {
    // Language for speech recognition
    LANGUAGE: 'en-US',
    
    // Sample rate for audio recording
    SAMPLE_RATE: 16000,
    
    // Audio encoding
    ENCODING: 'LINEAR16',
    
    // Enable automatic punctuation
    ENABLE_PUNCTUATION: true,
    
    // Enable word time offsets
    ENABLE_WORD_OFFSETS: false,
  },
  
  // Wake Phrases Configuration
  WAKE_PHRASES: {
    // Primary wake phrase
    PRIMARY: 'mummy help',
    
    // Alternative wake phrases - only mummy help and help
    ALTERNATIVES: [
      'mummy help',
      'help'
    ],
    
    // Confidence threshold for wake phrase detection
    CONFIDENCE_THRESHOLD: 0.8,
  },
  
  // Emergency Phrases
  EMERGENCY_PHRASES: [
    'emergency',
    'help me',
    'danger',
    'panic',
    'sos',
    'i need help',
    'call for help',
    'emergency alert',
    'save me',
    'rescue me'
  ],
  
  // Check-in Phrases
  CHECK_IN_PHRASES: [
    'check in',
    'i am safe',
    'i am okay',
    'i am fine',
    'all good',
    'safe',
    'okay',
    'fine',
    'doing well',
    'everything is fine'
  ],
  
  // Audio Recording Settings
  AUDIO: {
    // Recording duration in seconds
    RECORDING_DURATION: 5,
    
    // Quality preset
    QUALITY: 'HIGH_QUALITY',
    
    // Enable background recording
    BACKGROUND_RECORDING: true,
    
    // Audio mode settings
    AUDIO_MODE: {
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    }
  },
  
  // Speech Synthesis Settings
  SPEECH: {
    // Language for speech synthesis
    LANGUAGE: 'en',
    
    // Speech rate (0.1 to 2.0)
    RATE: 0.9,
    
    // Speech pitch (0.5 to 2.0)
    PITCH: 1.0,
    
    // Speech volume (0.0 to 1.0)
    VOLUME: 1.0,
  },
  
  // iOS Specific Settings
  IOS: {
    // Background audio session
    BACKGROUND_AUDIO: true,
    
    // Audio session category
    AUDIO_SESSION_CATEGORY: 'playAndRecord',
    
    // Audio session mode
    AUDIO_SESSION_MODE: 'voiceChat',
    
    // Enable audio interruption handling
    HANDLE_INTERRUPTIONS: true,
  },
  
  // Android Specific Settings
  ANDROID: {
    // Audio focus gain type
    AUDIO_FOCUS_GAIN: 'gain',
    
    // Audio focus loss behavior
    AUDIO_FOCUS_LOSS_BEHAVIOR: 'pause',
    
    // Enable audio ducking
    ENABLE_DUCKING: true,
  },
  
  // Fallback Settings
  FALLBACK: {
    // Enable simulated recognition when Google API is not available
    ENABLE_SIMULATION: true,
    
    // Simulation detection interval (milliseconds)
    SIMULATION_INTERVAL: 3000,
    
    // Simulation detection probability (0.0 to 1.0)
    SIMULATION_PROBABILITY: 0.1,
  }
};

// Instructions for setting up Google Speech-to-Text
export const GOOGLE_SETUP_INSTRUCTIONS = {
  title: 'Google Speech-to-Text Setup',
  steps: [
    {
      step: 1,
      title: 'Create Google Cloud Project',
      description: 'Go to https://console.cloud.google.com and create a new project or select an existing one.',
      url: 'https://console.cloud.google.com'
    },
    {
      step: 2,
      title: 'Enable Speech-to-Text API',
      description: 'In your Google Cloud Console, go to APIs & Services > Library and enable the Speech-to-Text API.',
      url: 'https://console.cloud.google.com/apis/library/speech.googleapis.com'
    },
    {
      step: 3,
      title: 'Create API Key',
      description: 'Go to APIs & Services > Credentials and create a new API key. Restrict it to Speech-to-Text API only.',
      url: 'https://console.cloud.google.com/apis/credentials'
    },
    {
      step: 4,
      title: 'Set API Key',
      description: 'Copy your API key and set it in the GOOGLE_API_KEY field in voiceConfig.js',
      code: 'GOOGLE_API_KEY: "your-api-key-here"'
    },
    {
      step: 5,
      title: 'Test Integration',
      description: 'Test the voice recognition by saying wake phrases and emergency commands.',
      note: 'Make sure to enable billing in your Google Cloud project as Speech-to-Text API has usage costs.'
    }
  ],
  pricing: {
    note: 'Google Speech-to-Text API has usage-based pricing. Check current rates at:',
    url: 'https://cloud.google.com/speech-to-text/pricing'
  }
};

// iOS App Store Requirements
export const IOS_REQUIREMENTS = {
  permissions: [
    {
      name: 'Microphone',
      usage: 'Required for voice recognition and emergency alerts',
      required: true
    },
    {
      name: 'Background Audio',
      usage: 'Required for continuous voice listening',
      required: true
    },
    {
      name: 'Notifications',
      usage: 'Required for voice feedback and alerts',
      required: true
    },
    {
      name: 'Location',
      usage: 'Required for location-based emergency alerts',
      required: true
    }
  ],
  appStoreGuidelines: [
    'Voice recognition must be clearly explained to users',
    'Audio recording must be disclosed in privacy policy',
    'Background audio usage must be justified',
    'Emergency features must be clearly labeled',
    'Voice commands must be accessible and documented'
  ],
  privacyPolicy: {
    required: true,
    sections: [
      'Audio recording and processing',
      'Voice data storage and usage',
      'Location data collection',
      'Emergency alert functionality',
      'Data sharing with emergency contacts'
    ]
  }
};

// Android Play Store Requirements
export const ANDROID_REQUIREMENTS = {
  permissions: [
    {
      name: 'RECORD_AUDIO',
      usage: 'Required for voice recognition',
      required: true
    },
    {
      name: 'ACCESS_FINE_LOCATION',
      usage: 'Required for location-based alerts',
      required: true
    },
    {
      name: 'ACCESS_COARSE_LOCATION',
      usage: 'Required for location-based alerts',
      required: true
    },
    {
      name: 'POST_NOTIFICATIONS',
      usage: 'Required for voice feedback and alerts',
      required: true
    }
  ],
  playStoreGuidelines: [
    'Voice recognition must be clearly explained',
    'Audio recording must be disclosed',
    'Emergency features must be properly labeled',
    'Background processing must be justified',
    'Privacy policy must be comprehensive'
  ]
};

export default VOICE_CONFIG; 