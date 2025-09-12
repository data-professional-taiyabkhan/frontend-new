import * as Location from 'expo-location';
import { Alert } from 'react-native';

class LocationService {
  constructor() {
    this.locationSubscription = null;
    this.currentLocation = null;
    this.isTracking = false;
  }

  // Request location permissions
  async requestLocationPermissions() {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Location Permission Required',
          'This app needs location access to help keep you safe. Please enable location permissions in your device settings.',
          [{ text: 'OK' }]
        );
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error requesting location permissions:', error);
      return false;
    }
  }

  // Check if location permissions are granted
  async checkLocationPermissions() {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error checking location permissions:', error);
      return false;
    }
  }

  // Get current location once
  async getCurrentLocation() {
    try {
      const hasPermission = await this.checkLocationPermissions();
      if (!hasPermission) {
        const granted = await this.requestLocationPermissions();
        if (!granted) return null;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        timeInterval: 5000,
        distanceInterval: 10,
      });

      this.currentLocation = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy,
        timestamp: location.timestamp,
        speed: location.coords.speed,
        heading: location.coords.heading,
        altitude: location.coords.altitude,
      };

      return this.currentLocation;
    } catch (error) {
      console.error('Error getting current location:', error);
      return null;
    }
  }

  // Start location tracking
  async startLocationTracking(callback) {
    try {
      const hasPermission = await this.checkLocationPermissions();
      if (!hasPermission) {
        const granted = await this.requestLocationPermissions();
        if (!granted) return false;
      }

      // Stop any existing tracking
      await this.stopLocationTracking();

      this.locationSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 10000, // Update every 10 seconds
          distanceInterval: 10, // Update when moved 10 meters
        },
        async (location) => {
          this.currentLocation = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            accuracy: location.coords.accuracy,
            timestamp: location.timestamp,
            speed: location.coords.speed,
            heading: location.coords.heading,
            altitude: location.coords.altitude,
          };

          // Note: Backend sending is handled by the calling component (ChildDashboard)
          // to avoid duplicate calls and user ID issues
          
          if (callback) {
            callback(this.currentLocation);
          }
        }
      );

      this.isTracking = true;
      console.log('Location tracking started');
      return true;
    } catch (error) {
      console.error('Error starting location tracking:', error);
      return false;
    }
  }

  // Stop location tracking
  async stopLocationTracking() {
    try {
      if (this.locationSubscription) {
        await this.locationSubscription.remove();
        this.locationSubscription = null;
      }
      this.isTracking = false;
      console.log('Location tracking stopped');
    } catch (error) {
      console.error('Error stopping location tracking:', error);
    }
  }

  // Get formatted address from coordinates
  async getAddressFromCoordinates(latitude, longitude) {
    try {
      const reverseGeocode = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      if (reverseGeocode.length > 0) {
        const address = reverseGeocode[0];
        const parts = [];
        
        if (address.street) parts.push(address.street);
        if (address.city) parts.push(address.city);
        if (address.region) parts.push(address.region);
        if (address.country) parts.push(address.country);
        
        return parts.join(', ');
      }
      
      return 'Unknown location';
    } catch (error) {
      console.error('Error getting address:', error);
      return 'Unknown location';
    }
  }

  // Calculate distance between two points (in meters)
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  // Format distance for display
  formatDistance(meters) {
    if (meters < 1000) {
      return `${Math.round(meters)}m`;
    } else {
      return `${(meters / 1000).toFixed(1)}km`;
    }
  }

  // Get current location with address
  async getCurrentLocationWithAddress() {
    const location = await this.getCurrentLocation();
    if (!location) return null;

    const address = await this.getAddressFromCoordinates(
      location.latitude,
      location.longitude
    );

    return {
      ...location,
      address,
    };
  }

  // Check if location is within a certain radius of a point
  isWithinRadius(lat1, lon1, lat2, lon2, radiusMeters) {
    const distance = this.calculateDistance(lat1, lon1, lat2, lon2);
    return distance <= radiusMeters;
  }

  // Get location status
  getLocationStatus() {
    return {
      isTracking: this.isTracking,
      currentLocation: this.currentLocation,
      hasPermission: this.checkLocationPermissions(),
    };
  }

  // Send location to backend
  async sendLocationToBackend(location) {
    try {
      // Import API dynamically to avoid circular imports
      const { locationAPI } = await import('./api');
      
      // Get current user ID from storage
      const { storage } = await import('./api');
      const userData = await storage.getUser();
      
      if (!userData || !userData.id) {
        console.error('No user ID available for location tracking');
        return false;
      }
      
      // Validate required fields first
      if (!location.latitude || !location.longitude || isNaN(location.latitude) || isNaN(location.longitude)) {
        console.error('Invalid location data - missing or invalid lat/lng:', location);
        return false;
      }

      // Validate latitude and longitude ranges
      const lat = parseFloat(location.latitude);
      const lng = parseFloat(location.longitude);
      
      if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        console.error('Location coordinates out of valid range:', { lat, lng });
        return false;
      }

      // Clean and validate location data before sending
      const cleanLocationData = {
        latitude: Math.round(lat * 1000000) / 1000000, // Round to 6 decimal places
        longitude: Math.round(lng * 1000000) / 1000000, // Round to 6 decimal places
      };

      // Only add optional fields if they have valid values
      if (location.accuracy && !isNaN(location.accuracy) && location.accuracy > 0) {
        cleanLocationData.accuracy = Math.round(parseFloat(location.accuracy) * 100) / 100; // Round to 2 decimal places
      }
      
      // Heading: -1 means invalid, only send if it's a valid bearing (0-360)
      if (location.heading && !isNaN(location.heading) && location.heading >= 0 && location.heading <= 360) {
        cleanLocationData.heading = Math.round(parseFloat(location.heading) * 10) / 10; // Round to 1 decimal place
      }
      
      // Speed: -1 or negative means invalid, only send if it's positive
      if (location.speed && !isNaN(location.speed) && location.speed >= 0) {
        cleanLocationData.speed = Math.round(parseFloat(location.speed) * 100) / 100; // Round to 2 decimal places
      }
      
      // Altitude: Only add if it's a valid number
      if (location.altitude && !isNaN(location.altitude)) {
        cleanLocationData.altitude = Math.round(parseFloat(location.altitude) * 10) / 10; // Round to 1 decimal place
      }

      // Note: Don't send timestamp as it's not expected by the backend validation
      // The backend will set its own timestamp when creating the location record

      // Log the cleaned data for debugging
      console.log('Sending cleaned location data:', cleanLocationData);

      const response = await locationAPI.create(cleanLocationData);
      
      if (response.success) {
        console.log('Location sent to backend successfully');
        return true;
      } else {
        console.log('Failed to send location to backend:', response.message);
        if (response.errors) {
          console.log('Validation errors:', JSON.stringify(response.errors, null, 2));
        }
        return false;
      }
    } catch (error) {
      console.error('Error sending location to backend:', error);
      if (error.response?.data?.errors) {
        console.log('Backend validation errors:', JSON.stringify(error.response.data.errors, null, 2));
      }
      if (error.response?.data) {
        console.log('Full error response:', JSON.stringify(error.response.data, null, 2));
      }
      return false;
    }
  }

  // Get the current location object
  getCurrentLocationObject() {
    return this.currentLocation;
  }

  // Check if location services are enabled
  async checkLocationServices() {
    try {
      const isEnabled = await Location.hasServicesEnabledAsync();
      return isEnabled;
    } catch (error) {
      console.error('Error checking location services:', error);
      return false;
    }
  }

  // Enable location services (opens device settings)
  async enableLocationServices() {
    try {
      const isEnabled = await Location.hasServicesEnabledAsync();
      if (!isEnabled) {
        Alert.alert(
          'Location Services Disabled',
          'Please enable location services in your device settings to use this feature.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Location.enableNetworkProviderAsync() }
          ]
        );
      }
      return isEnabled;
    } catch (error) {
      console.error('Error enabling location services:', error);
      return false;
    }
  }
}

// Create singleton instance
const locationService = new LocationService();

export default locationService; 