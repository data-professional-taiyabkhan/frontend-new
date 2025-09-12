import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { Button, Card, IconButton, TextInput, Chip } from 'react-native-paper';
import { MotiView, AnimatePresence } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';

const { width, height } = Dimensions.get('window');

const CheckInScreen = ({ navigation, route }) => {
  const [location, setLocation] = useState(null);
  const [address, setAddress] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('safe');
  const [loading, setLoading] = useState(false);
  const [checkInSent, setCheckInSent] = useState(false);
  const [sound, setSound] = useState(null);
  const insets = useSafeAreaInsets();

  const { isAutoCheckIn = false } = route.params || {};

  useEffect(() => {
    if (isAutoCheckIn) {
      handleAutoCheckIn();
    } else {
      getCurrentLocation();
    }
  }, [isAutoCheckIn]);

  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  const getCurrentLocation = async () => {
    try {
      setLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required for check-ins.');
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        timeout: 10000,
      });

      setLocation(currentLocation);
      
      // Get address from coordinates
      const reverseGeocode = await Location.reverseGeocodeAsync({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      });

      if (reverseGeocode.length > 0) {
        const place = reverseGeocode[0];
        const addressParts = [
          place.street,
          place.city,
          place.region,
          place.country
        ].filter(Boolean);
        setAddress(addressParts.join(', '));
      }
    } catch (error) {
      console.error('Location error:', error);
      Alert.alert('Location Error', 'Could not get your current location.');
    } finally {
      setLoading(false);
    }
  };

  const handleAutoCheckIn = async () => {
    try {
      await getCurrentLocation();
      await sendCheckIn('Auto check-in - All good!');
    } catch (error) {
      console.error('Auto check-in error:', error);
    }
  };

  const playCheckInSound = async () => {
    try {
      const { sound: audioSound } = await Audio.Sound.createAsync(
        require('../assets/checkin-success.mp3'), // You'll need to add this sound file
        { shouldPlay: true }
      );
      setSound(audioSound);
    } catch (error) {
      console.log('Could not play check-in sound:', error);
    }
  };

  const sendCheckIn = async (customMessage = null) => {
    if (!location) {
      Alert.alert('Error', 'Location is required for check-in.');
      return;
    }

    try {
      setLoading(true);
      
      // Play success sound
      await playCheckInSound();
      
      // Trigger haptic feedback
      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }

      // Here you would send the check-in to your backend
      // For now, we'll simulate it
      console.log('Sending check-in:', {
        location,
        address,
        message: customMessage || message,
        status,
        timestamp: new Date().toISOString()
      });
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setCheckInSent(true);
      
      // Show success message
      setTimeout(() => {
        Alert.alert(
          'Check-in Sent! ✅',
          'Your family has been notified that you are safe.',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      }, 1000);
      
    } catch (error) {
      console.error('Check-in error:', error);
      Alert.alert('Error', 'Failed to send check-in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (statusType) => {
    switch (statusType) {
      case 'safe': return '#4caf50';
      case 'delayed': return '#ff9800';
      case 'concerned': return '#f44336';
      default: return '#667eea';
    }
  };

  const getStatusIcon = (statusType) => {
    switch (statusType) {
      case 'safe': return '✅';
      case 'delayed': return '⏰';
      case 'concerned': return '⚠️';
      default: return '📍';
    }
  };

  const getStatusText = (statusType) => {
    switch (statusType) {
      case 'safe': return 'Safe & Well';
      case 'delayed': return 'Running Late';
      case 'concerned': return 'Need Help';
      default: return 'Location Update';
    }
  };

  if (checkInSent) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <StatusBar style="light" />
        
        <LinearGradient
          colors={['#4caf50', '#45a049']}
          style={styles.backgroundGradient}
        />

        <View style={styles.successContainer}>
          <MotiView
            from={{ scale: 0, rotate: '0deg' }}
            animate={{ scale: 1, rotate: '360deg' }}
            transition={{ type: 'spring', damping: 15, stiffness: 100 }}
            style={styles.successIcon}
          >
            <Text style={styles.successIconText}>✅</Text>
          </MotiView>

          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 100, delay: 300 }}
          >
            <Text style={styles.successTitle}>Check-in Sent!</Text>
            <Text style={styles.successSubtitle}>
              Your family has been notified that you are safe
            </Text>
          </MotiView>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="light" />
      
      {/* Background Gradient */}
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.backgroundGradient}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <IconButton
            icon="arrow-left"
            iconColor="#ffffff"
            size={24}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Safe Check-in</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Status Selection */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'spring', damping: 20, stiffness: 100 }}
          style={styles.section}
        >
          <Text style={styles.sectionTitle}>How are you feeling?</Text>
          <View style={styles.statusOptions}>
            {['safe', 'delayed', 'concerned'].map((statusType) => (
              <TouchableOpacity
                key={statusType}
                style={[
                  styles.statusOption,
                  status === statusType && styles.statusOptionSelected,
                  { borderColor: getStatusColor(statusType) }
                ]}
                onPress={() => setStatus(statusType)}
              >
                <Text style={styles.statusIcon}>{getStatusIcon(statusType)}</Text>
                <Text style={[
                  styles.statusText,
                  status === statusType && styles.statusTextSelected
                ]}>
                  {getStatusText(statusType)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </MotiView>

        {/* Location Information */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'spring', damping: 20, stiffness: 100, delay: 200 }}
          style={styles.section}
        >
          <Text style={styles.sectionTitle}>Your Location</Text>
          <Card style={styles.locationCard}>
            <Card.Content>
              {location ? (
                <View style={styles.locationInfo}>
                  <View style={styles.locationIcon}>
                    <Text style={styles.locationIconText}>📍</Text>
                  </View>
                  <View style={styles.locationDetails}>
                    <Text style={styles.locationTitle}>Current Location</Text>
                    <Text style={styles.locationAddress}>
                      {address || 'Getting address...'}
                    </Text>
                    <Text style={styles.locationCoords}>
                      {location.coords.latitude.toFixed(6)}, {location.coords.longitude.toFixed(6)}
                    </Text>
                  </View>
                </View>
              ) : (
                <View style={styles.locationLoading}>
                  <Text style={styles.locationLoadingText}>
                    {loading ? 'Getting your location...' : 'Location not available'}
                  </Text>
                  {!loading && (
                    <Button
                      mode="outlined"
                      onPress={getCurrentLocation}
                      style={styles.retryButton}
                      textColor="#667eea"
                    >
                      Try Again
                    </Button>
                  )}
                </View>
              )}
            </Card.Content>
          </Card>
        </MotiView>

        {/* Message Input */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'spring', damping: 20, stiffness: 100, delay: 400 }}
          style={styles.section}
        >
          <Text style={styles.sectionTitle}>Add a Message (Optional)</Text>
          <TextInput
            mode="outlined"
            label="How are you doing?"
            value={message}
            onChangeText={setMessage}
            style={styles.messageInput}
            outlineColor="#ffffff80"
            activeOutlineColor="#ffffff"
            textColor="#ffffff"
            placeholderTextColor="#ffffff80"
            multiline
            numberOfLines={3}
            left={<TextInput.Icon icon="message" color="#ffffff80" />}
          />
        </MotiView>

        {/* Quick Messages */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'spring', damping: 20, stiffness: 100, delay: 600 }}
          style={styles.section}
        >
          <Text style={styles.sectionTitle}>Quick Messages</Text>
          <View style={styles.quickMessages}>
            {[
              'All good!',
              'Running late',
              'At school/work',
              'On my way home',
              'Need a ride',
              'Everything is fine'
            ].map((quickMsg) => (
              <TouchableOpacity
                key={quickMsg}
                style={styles.quickMessageChip}
                onPress={() => setMessage(quickMsg)}
              >
                <Text style={styles.quickMessageText}>{quickMsg}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </MotiView>

        {/* Send Button */}
        <MotiView
          from={{ opacity: 0, translateY: 50, scale: 0.8 }}
          animate={{ opacity: 1, translateY: 0, scale: 1 }}
          transition={{ type: 'spring', damping: 20, stiffness: 100, delay: 800 }}
          style={styles.sendButtonContainer}
        >
          <Button
            mode="contained"
            onPress={() => sendCheckIn()}
            loading={loading}
            disabled={loading || !location}
            style={styles.sendButton}
            contentStyle={styles.buttonContent}
            labelStyle={styles.buttonLabel}
            buttonColor="#ffffff"
            textColor="#667eea"
          >
            {loading ? 'Sending...' : 'Send Safe Check-in'}
          </Button>
        </MotiView>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#667eea',
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  backButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  headerRight: {
    width: 48,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 16,
    marginLeft: 4,
  },
  statusOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  statusOption: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  statusOptionSelected: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderColor: '#ffffff',
  },
  statusIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center',
  },
  statusTextSelected: {
    color: '#ffffff',
    fontWeight: '700',
  },
  locationCard: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  locationIconText: {
    fontSize: 24,
  },
  locationDetails: {
    flex: 1,
  },
  locationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  locationAddress: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 2,
  },
  locationCoords: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
  },
  locationLoading: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  locationLoadingText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 16,
  },
  retryButton: {
    borderColor: '#ffffff',
  },
  messageInput: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
  },
  quickMessages: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickMessageChip: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  quickMessageText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
  sendButtonContainer: {
    marginTop: 20,
  },
  sendButton: {
    borderRadius: 16,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  buttonContent: {
    paddingVertical: 16,
  },
  buttonLabel: {
    fontSize: 18,
    fontWeight: '700',
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  successIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  successIconText: {
    fontSize: 60,
  },
  successTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 38,
  },
  successSubtitle: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
});

export default CheckInScreen;
