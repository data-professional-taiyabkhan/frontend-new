/**
 * Voice configuration constants and settings
 */

export const VOICE_CONFIG = {
  // Porcupine wake word detection settings
  PORCUPINE: {
    DEFAULT_SENSITIVITY: 0.5,
    MIN_SENSITIVITY: 0.0,
    MAX_SENSITIVITY: 1.0,
    SENSITIVITY_STEP: 0.1,
    
    // Sensitivity presets
    SENSITIVITY_PRESETS: {
      VERY_LOW: 0.2,
      LOW: 0.35,
      MEDIUM: 0.5,
      HIGH: 0.65,
      VERY_HIGH: 0.8,
    },
  },

  // Speaker verification settings
  VERIFICATION: {
    DEFAULT_THRESHOLD: 0.78,
    MIN_THRESHOLD: 0.5,
    MAX_THRESHOLD: 0.95,
    THRESHOLD_STEP: 0.01,
    
    // Threshold presets
    THRESHOLD_PRESETS: {
      STRICT: 0.85,
      NORMAL: 0.78,
      RELAXED: 0.70,
      VERY_RELAXED: 0.65,
    },
  },

  // Recording settings
  RECORDING: {
    // Enrollment recording settings
    ENROLLMENT: {
      TARGET_DURATION: 1200,  // 1.2 seconds
      MIN_DURATION: 800,      // 0.8 seconds
      MAX_DURATION: 2000,     // 2.0 seconds
      REQUIRED_SAMPLES: 5,
      SAMPLE_RATE: 16000,
      CHANNELS: 1,
      BIT_RATE: 128000,
    },
    
    // Verification recording settings
    VERIFICATION: {
      TARGET_DURATION: 1200,  // 1.2 seconds
      MAX_DURATION: 2000,     // 2.0 seconds
      QUICK_DURATION: 1000,   // 1.0 second for quick verification
      SAMPLE_RATE: 16000,
      CHANNELS: 1,
      BIT_RATE: 128000,
    },
  },

  // Timing and debouncing settings
  TIMING: {
    DEBOUNCE_MS: 1500,          // Ignore repeated wake words within 1.5s
    VERIFICATION_TIMEOUT: 5000,  // 5 seconds timeout for verification
    QUICK_VERIFICATION_TIMEOUT: 3000, // 3 seconds for quick verification
    AUTO_CANCEL_MODAL_MS: 10000, // Auto-cancel confirm modal after 10s
  },

  // Quality scoring settings
  QUALITY: {
    MIN_SCORE: 1,
    MAX_SCORE: 5,
    PASS_THRESHOLD: 3,
    
    // Quality check weights
    DURATION_WEIGHT: 0.4,
    AMPLITUDE_WEIGHT: 0.3,
    NOISE_WEIGHT: 0.3,
  },

  // UI settings
  UI: {
    PULSE_DURATION: 800,        // Recording button pulse animation
    FADE_DURATION: 300,         // UI fade animations
    PROGRESS_UPDATE_INTERVAL: 100, // Progress bar update interval
    
    // Colors
    COLORS: {
      RECORDING: '#ff4757',
      READY: '#2ed573',
      SUCCESS: '#2ed573',
      ERROR: '#ff6b6b',
      WARNING: '#ffa726',
      PRIMARY: '#667eea',
    },
  },

  // Error messages
  ERRORS: {
    NO_MICROPHONE_PERMISSION: 'Microphone permission is required for voice features',
    ENROLLMENT_INCOMPLETE: 'Voice enrollment is incomplete. Please complete enrollment first.',
    VERIFICATION_FAILED: 'Voice verification failed. Please try again.',
    NETWORK_ERROR: 'Network error. Please check your internet connection.',
    SERVICE_UNAVAILABLE: 'Voice service is temporarily unavailable.',
    RECORDING_TOO_SHORT: 'Recording is too short. Please try again.',
    RECORDING_TOO_LONG: 'Recording is too long. Please try again.',
    QUALITY_TOO_LOW: 'Recording quality is too low. Please try again in a quieter environment.',
  },

  // Success messages
  SUCCESS: {
    ENROLLMENT_COMPLETE: 'Voice enrollment completed successfully!',
    VERIFICATION_SUCCESS: 'Voice verified successfully!',
    WAKE_WORD_DETECTED: 'Wake word detected!',
    SETTINGS_SAVED: 'Voice settings saved successfully!',
  },

  // Feature flags
  FEATURES: {
    CONTINUOUS_LISTENING: true,
    BACKGROUND_VERIFICATION: true,
    QUICK_VERIFICATION: true,
    AUTO_ENROLLMENT_RETRY: true,
    QUALITY_FEEDBACK: true,
    HAPTIC_FEEDBACK: true,
    VOICE_ACTIVITY_DETECTION: false, // Future feature
    NOISE_CANCELLATION: false,       // Future feature
  },

  // Development and debugging
  DEBUG: {
    ENABLE_CONSOLE_LOGS: __DEV__,
    ENABLE_VERIFICATION_LOGS: __DEV__,
    ENABLE_TIMING_LOGS: __DEV__,
    MOCK_VERIFICATION: false,        // For testing without backend
    BYPASS_ENROLLMENT: false,        // For testing without enrollment
  },
};

// Helper functions for voice configuration
export const VoiceConfigHelpers = {
  /**
   * Get sensitivity description
   */
  getSensitivityDescription: (sensitivity) => {
    if (sensitivity <= 0.3) return 'Very Low (fewer false positives)';
    if (sensitivity <= 0.45) return 'Low (reduced sensitivity)';
    if (sensitivity <= 0.55) return 'Medium (balanced)';
    if (sensitivity <= 0.7) return 'High (more responsive)';
    return 'Very High (maximum sensitivity)';
  },

  /**
   * Get threshold description
   */
  getThresholdDescription: (threshold) => {
    if (threshold >= 0.85) return 'Strict (high security)';
    if (threshold >= 0.78) return 'Normal (recommended)';
    if (threshold >= 0.70) return 'Relaxed (easier verification)';
    return 'Very Relaxed (lowest security)';
  },

  /**
   * Validate sensitivity value
   */
  isValidSensitivity: (sensitivity) => {
    return typeof sensitivity === 'number' && 
           sensitivity >= VOICE_CONFIG.PORCUPINE.MIN_SENSITIVITY && 
           sensitivity <= VOICE_CONFIG.PORCUPINE.MAX_SENSITIVITY;
  },

  /**
   * Validate threshold value
   */
  isValidThreshold: (threshold) => {
    return typeof threshold === 'number' && 
           threshold >= VOICE_CONFIG.VERIFICATION.MIN_THRESHOLD && 
           threshold <= VOICE_CONFIG.VERIFICATION.MAX_THRESHOLD;
  },

  /**
   * Get recording quality description
   */
  getQualityDescription: (score) => {
    if (score >= 5) return 'Excellent';
    if (score >= 4) return 'Good';
    if (score >= 3) return 'Fair';
    if (score >= 2) return 'Poor';
    return 'Very Poor';
  },

  /**
   * Calculate optimal settings based on environment
   */
  getOptimalSettings: (environment = 'normal') => {
    const settings = {
      normal: {
        sensitivity: VOICE_CONFIG.PORCUPINE.DEFAULT_SENSITIVITY,
        threshold: VOICE_CONFIG.VERIFICATION.DEFAULT_THRESHOLD,
      },
      noisy: {
        sensitivity: VOICE_CONFIG.PORCUPINE.SENSITIVITY_PRESETS.LOW,
        threshold: VOICE_CONFIG.VERIFICATION.THRESHOLD_PRESETS.RELAXED,
      },
      quiet: {
        sensitivity: VOICE_CONFIG.PORCUPINE.SENSITIVITY_PRESETS.HIGH,
        threshold: VOICE_CONFIG.VERIFICATION.THRESHOLD_PRESETS.STRICT,
      },
    };

    return settings[environment] || settings.normal;
  },
};

export default VOICE_CONFIG;
