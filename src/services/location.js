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
        (location) => {
          this.currentLocation = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            accuracy: location.coords.accuracy,
            timestamp: location.timestamp,
            speed: location.coords.speed,
            heading: location.coords.heading,
          };

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