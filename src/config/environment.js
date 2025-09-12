// Environment configuration for different build profiles
const ENV = {
  development: {
    API_BASE_URL: 'http://localhost:3000',
    NODE_ENV: 'development',
    LOG_LEVEL: 'debug',
    ENABLE_LOGS: true,
    VOICE_RECOGNITION_ENABLED: true,
    LOCATION_ACCURACY: 'high',
    PUSH_NOTIFICATIONS_ENABLED: true
  },
  staging: {
    API_BASE_URL: 'https://your-staging-api.com',
    NODE_ENV: 'staging',
    LOG_LEVEL: 'info',
    ENABLE_LOGS: true,
    VOICE_RECOGNITION_ENABLED: true,
    LOCATION_ACCURACY: 'balanced',
    PUSH_NOTIFICATIONS_ENABLED: true
  },
  production: {
    API_BASE_URL: 'https://your-production-api.com',
    NODE_ENV: 'production',
    LOG_LEVEL: 'error',
    ENABLE_LOGS: false,
    VOICE_RECOGNITION_ENABLED: true,
    LOCATION_ACCURACY: 'balanced',
    PUSH_NOTIFICATIONS_ENABLED: true
  }
};

// Get current environment from Expo constants or default to development
const getEnvironment = () => {
  // Check if we're in a development build
  if (__DEV__) {
    return 'development';
  }
  
  // Check for environment variable from EAS build
  const buildEnv = process.env.NODE_ENV || process.env.EXPO_PUBLIC_NODE_ENV;
  if (buildEnv && ENV[buildEnv]) {
    return buildEnv;
  }
  
  // Default to production for release builds
  return 'production';
};

const currentEnv = getEnvironment();
const config = ENV[currentEnv];

// Environment-specific logging
const logger = {
  debug: (message, ...args) => {
    if (config.ENABLE_LOGS && config.LOG_LEVEL === 'debug') {
      console.log(`[DEBUG] ${message}`, ...args);
    }
  },
  info: (message, ...args) => {
    if (config.ENABLE_LOGS && ['debug', 'info'].includes(config.LOG_LEVEL)) {
      console.log(`[INFO] ${message}`, ...args);
    }
  },
  warn: (message, ...args) => {
    if (config.ENABLE_LOGS && ['debug', 'info', 'warn'].includes(config.LOG_LEVEL)) {
      console.warn(`[WARN] ${message}`, ...args);
    }
  },
  error: (message, ...args) => {
    if (config.ENABLE_LOGS) {
      console.error(`[ERROR] ${message}`, ...args);
    }
  }
};

// Export configuration and logger
export default {
  ...config,
  currentEnv,
  logger,
  
  // Helper methods
  isDevelopment: () => currentEnv === 'development',
  isStaging: () => currentEnv === 'staging',
  isProduction: () => currentEnv === 'production',
  
  // Feature flags
  features: {
    voiceRecognition: config.VOICE_RECOGNITION_ENABLED,
    locationTracking: true,
    pushNotifications: config.PUSH_NOTIFICATIONS_ENABLED,
    analytics: currentEnv === 'production',
    crashReporting: currentEnv === 'production'
  }
};
