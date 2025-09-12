import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import { deviceTokenAPI } from '../services/api';

// Define the background task name
const LOCATION_TASK_NAME = 'MUMMYHELP_LOCATION';

// Background task for location tracking
TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
  if (error) {
    console.error('Location task error:', error);
    return;
  }

  try {
    // Get current location
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
      timeInterval: 5000, // Update every 5 seconds
    });

    // Send location to backend
    await sendLocationToBackend(location);
    
    console.log('Background location sent:', {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      accuracy: location.coords.accuracy,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in background location task:', error);
  }
});

// Function to send location to backend
const sendLocationToBackend = async (location) => {
  try {
    const locationData = {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      accuracy: location.coords.accuracy,
      heading: location.coords.heading,
      speed: location.coords.speed,
      altitude: location.coords.altitude,
      timestamp: location.timestamp,
    };

    // Import API dynamically to avoid circular imports
    const { locationAPI } = await import('../services/api');
    
    const response = await locationAPI.create(locationData);
    if (response.success) {
      console.log('Background location sent to backend successfully');
    } else {
      console.log('Failed to send background location to backend:', response.message);
    }
  } catch (error) {
    console.error('Failed to send location to backend:', error);
  }
};

// Start background location tracking
export const startBackgroundLocation = async () => {
  try {
    // Check if location permissions are granted
    const { status } = await Location.getForegroundPermissionsAsync();
    
    if (status !== 'granted') {
      console.log('Location permission not granted');
      return false;
    }

    // Check if background location is enabled
    const backgroundStatus = await Location.getBackgroundPermissionsAsync();
    
    if (backgroundStatus.status !== 'granted') {
      console.log('Background location permission not granted');
      return false;
    }

    // Start the background task
    await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
      accuracy: Location.Accuracy.High,
      timeInterval: 5000, // Update every 5 seconds
      distanceInterval: 10, // Update every 10 meters
      foregroundService: {
        notificationTitle: 'MummyHelp Location Tracking',
        notificationBody: 'Tracking your location for safety',
        notificationColor: '#FF6B6B',
      },
      // Android specific options
      android: {
        notificationChannelId: 'mummyhelp-location',
        notificationTitle: 'MummyHelp Location Tracking',
        notificationBody: 'Tracking your location for safety',
        notificationColor: '#FF6B6B',
      },
    });

    console.log('Background location tracking started');
    return true;
  } catch (error) {
    console.error('Failed to start background location:', error);
    return false;
  }
};

// Stop background location tracking
export const stopBackgroundLocation = async () => {
  try {
    await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
    console.log('Background location tracking stopped');
    return true;
  } catch (error) {
    console.error('Failed to stop background location:', error);
    return false;
  }
};

// Check if background location is active
export const isBackgroundLocationActive = async () => {
  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(LOCATION_TASK_NAME);
    return isRegistered;
  } catch (error) {
    console.error('Error checking background location status:', error);
    return false;
  }
};

// Request background location permissions
export const requestBackgroundLocationPermissions = async () => {
  try {
    // First request foreground location permission
    const foregroundPermission = await Location.requestForegroundPermissionsAsync();
    
    if (foregroundPermission.status !== 'granted') {
      console.log('Foreground location permission denied');
      return false;
    }

    // Then request background location permission
    const backgroundPermission = await Location.requestBackgroundPermissionsAsync();
    
    if (backgroundPermission.status !== 'granted') {
      console.log('Background location permission denied');
      return false;
    }

    console.log('Background location permissions granted');
    return true;
  } catch (error) {
    console.error('Error requesting location permissions:', error);
    return false;
  }
};
