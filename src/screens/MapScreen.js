import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { locationAPI } from '../services/api';

const { width, height } = Dimensions.get('window');

const MapScreen = ({ route, navigation }) => {
  const [childLocation, setChildLocation] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const mapRef = useRef(null);
  const locationIntervalRef = useRef(null);

  // Get childId from route params (passed from notification tap)
  const { childId, alertId } = route.params || {};

  useEffect(() => {
    if (childId) {
      loadChildLocation();
      startLocationPolling();
    } else {
      setError('No child ID provided');
      setIsLoading(false);
    }

    return () => {
      if (locationIntervalRef.current) {
        clearInterval(locationIntervalRef.current);
      }
    };
  }, [childId]);

  const loadChildLocation = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await locationAPI.getLatestByChildId(childId);
      
      if (response.success && response.data && response.data.location) {
        setChildLocation(response.data.location);
        setLastUpdate(new Date());
        
        // Center map on child's location
        if (mapRef.current) {
          mapRef.current.animateToRegion({
            latitude: response.data.location.latitude,
            longitude: response.data.location.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          });
        }
      } else {
        setError('No location data available for this child');
      }
    } catch (error) {
      console.error('Error loading child location:', error);
      setError('Failed to load child location');
    } finally {
      setIsLoading(false);
    }
  };

  const startLocationPolling = () => {
    // Poll for location updates every 4 seconds
    locationIntervalRef.current = setInterval(() => {
      loadChildLocation();
    }, 4000);
  };

  const handleRefresh = () => {
    loadChildLocation();
  };

  const handleCenterOnChild = () => {
    if (childLocation && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: childLocation.latitude,
        longitude: childLocation.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    }
  };

  const formatLastUpdate = () => {
    if (!lastUpdate) return 'Never';
    
    const now = new Date();
    const diffMs = now - lastUpdate;
    const diffSeconds = Math.floor(diffMs / 1000);
    
    if (diffSeconds < 60) return `${diffSeconds}s ago`;
    if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m ago`;
    return `${Math.floor(diffSeconds / 3600)}h ago`;
  };

  const getLocationAccuracy = () => {
    if (!childLocation?.accuracy) return 'Unknown';
    
    if (childLocation.accuracy < 5) return 'Excellent';
    if (childLocation.accuracy < 10) return 'Good';
    if (childLocation.accuracy < 20) return 'Fair';
    return 'Poor';
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B6B" />
        <Text style={styles.loadingText}>Loading child location...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="location-off" size={64} color="#FF6B6B" />
        <Text style={styles.errorTitle}>Location Unavailable</Text>
        <Text style={styles.errorMessage}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>Child Location</Text>
          <Text style={styles.headerSubtitle}>
            Last updated: {formatLastUpdate()}
          </Text>
        </View>

        <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
          <Ionicons name="refresh" size={24} color="#FF6B6B" />
        </TouchableOpacity>
      </View>

      {/* Map */}
      {childLocation ? (
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          initialRegion={{
            latitude: childLocation.latitude,
            longitude: childLocation.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
          showsUserLocation={false}
          showsMyLocationButton={false}
          showsCompass={true}
          showsScale={true}
        >
          <Marker
            coordinate={{
              latitude: childLocation.latitude,
              longitude: childLocation.longitude,
            }}
            title="Child Location"
            description={`Accuracy: ${getLocationAccuracy()}`}
            pinColor="#FF6B6B"
          />
        </MapView>
      ) : (
        <View style={styles.mapPlaceholder}>
          <Text style={styles.mapPlaceholderText}>Loading child location...</Text>
        </View>
      )}

      {/* Location Info Panel */}
      {childLocation && (
        <View style={styles.infoPanel}>
          <View style={styles.infoRow}>
            <Ionicons name="location" size={20} color="#FF6B6B" />
            <Text style={styles.infoLabel}>Accuracy:</Text>
            <Text style={styles.infoValue}>{getLocationAccuracy()}</Text>
          </View>
          
          {childLocation.address && (
            <View style={styles.infoRow}>
              <Ionicons name="map" size={20} color="#FF6B6B" />
              <Text style={styles.infoLabel}>Address:</Text>
              <Text style={styles.infoValue} numberOfLines={2}>
                {childLocation.address}
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={styles.centerButton}
            onPress={handleCenterOnChild}
          >
            <Ionicons name="locate" size={20} color="white" />
            <Text style={styles.centerButtonText}>Center on Child</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab} onPress={handleRefresh}>
        <Ionicons name="refresh" size={24} color="white" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    padding: 8,
  },
  headerInfo: {
    flex: 1,
    marginLeft: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  refreshButton: {
    padding: 8,
  },
  map: {
    flex: 1,
  },
  mapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  mapPlaceholderText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  infoPanel: {
    backgroundColor: '#fff',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
    marginRight: 8,
    minWidth: 60,
  },
  infoValue: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  centerButton: {
    backgroundColor: '#FF6B6B',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  centerButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  fab: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    backgroundColor: '#FF6B6B',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
});

export default MapScreen;
