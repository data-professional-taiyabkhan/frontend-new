import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
  Platform,
} from 'react-native';
import { Button, Card, IconButton, Divider, List } from 'react-native-paper';
import { MotiView, AnimatePresence } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SettingsScreen = ({ navigation }) => {
  const [settings, setSettings] = useState({
    pushNotifications: true,
    locationSharing: true,
    voiceActivation: true,
    emergencyContacts: true,
    locationAccuracy: 'high',
    autoCheckIn: false,
    darkMode: false,
    soundEnabled: true,
    vibrationEnabled: true,
  });
  const [loading, setLoading] = useState(false);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem('appSettings');
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const saveSettings = async (newSettings) => {
    try {
      await AsyncStorage.setItem('appSettings', JSON.stringify(newSettings));
      setSettings(newSettings);
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  const handleSettingChange = async (key, value) => {
    const newSettings = { ...settings, [key]: value };
    
    // Handle special cases
    if (key === 'pushNotifications') {
      if (value) {
        const { status } = await Notifications.requestPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(
            'Permission Required',
            'Please enable push notifications in your device settings.',
            [{ text: 'OK' }]
          );
          return;
        }
      }
    }

    if (key === 'locationSharing') {
      if (value) {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(
            'Permission Required',
            'Please enable location access in your device settings.',
            [{ text: 'OK' }]
          );
          return;
        }
      }
    }

    saveSettings(newSettings);
  };

  const resetSettings = () => {
    Alert.alert(
      'Reset Settings',
      'Are you sure you want to reset all settings to default?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            const defaultSettings = {
              pushNotifications: true,
              locationSharing: true,
              voiceActivation: true,
              emergencyContacts: true,
              locationAccuracy: 'high',
              autoCheckIn: false,
              darkMode: false,
              soundEnabled: true,
              vibrationEnabled: true,
            };
            await saveSettings(defaultSettings);
          },
        },
      ]
    );
  };

  const SettingItem = ({ icon, title, subtitle, value, onPress, type = 'toggle', rightIcon }) => (
    <MotiView
      from={{ opacity: 0, translateX: -20 }}
      animate={{ opacity: 1, translateX: 0 }}
      transition={{ type: 'spring', damping: 20, stiffness: 100 }}
    >
      <TouchableOpacity
        style={styles.settingItem}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <View style={styles.settingLeft}>
          <View style={styles.settingIcon}>
            <Text style={styles.settingIconText}>{icon}</Text>
          </View>
          <View style={styles.settingText}>
            <Text style={styles.settingTitle}>{title}</Text>
            {subtitle && (
              <Text style={styles.settingSubtitle}>{subtitle}</Text>
            )}
          </View>
        </View>
        
        <View style={styles.settingRight}>
          {type === 'toggle' ? (
            <Switch
              value={value}
              onValueChange={onPress}
              trackColor={{ false: '#767577', true: '#667eea' }}
              thumbColor={value ? '#ffffff' : '#f4f3f4'}
              ios_backgroundColor="#767577"
            />
          ) : type === 'chevron' ? (
            <IconButton
              icon="chevron-right"
              iconColor="#667eea"
              size={24}
            />
          ) : (
            <Text style={styles.settingValue}>{value}</Text>
          )}
          {rightIcon && (
            <Text style={styles.rightIconText}>{rightIcon}</Text>
          )}
        </View>
      </TouchableOpacity>
    </MotiView>
  );

  const SettingSection = ({ title, children }) => (
    <MotiView
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'spring', damping: 20, stiffness: 100 }}
      style={styles.section}
    >
      <Text style={styles.sectionTitle}>{title}</Text>
      <Card style={styles.sectionCard}>
        {children}
      </Card>
    </MotiView>
  );

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
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Notifications Section */}
        <SettingSection title="Notifications & Alerts">
          <SettingItem
            icon="🔔"
            title="Push Notifications"
            subtitle="Receive emergency alerts and updates"
            value={settings.pushNotifications}
            onPress={() => handleSettingChange('pushNotifications', !settings.pushNotifications)}
          />
          <Divider style={styles.divider} />
          <SettingItem
            icon="🔊"
            title="Sound Enabled"
            subtitle="Play sounds for notifications"
            value={settings.soundEnabled}
            onPress={() => handleSettingChange('soundEnabled', !settings.soundEnabled)}
          />
          <Divider style={styles.divider} />
          <SettingItem
            icon="📳"
            title="Vibration Enabled"
            subtitle="Vibrate for notifications"
            value={settings.vibrationEnabled}
            onPress={() => handleSettingChange('vibrationEnabled', !settings.vibrationEnabled)}
          />
        </SettingSection>

        {/* Location & Privacy Section */}
        <SettingSection title="Location & Privacy">
          <SettingItem
            icon="📍"
            title="Location Sharing"
            subtitle="Share your location with family"
            value={settings.locationSharing}
            onPress={() => handleSettingChange('locationSharing', !settings.locationSharing)}
          />
          <Divider style={styles.divider} />
          <SettingItem
            icon="🎯"
            title="Location Accuracy"
            subtitle="High accuracy for better tracking"
            value={settings.locationAccuracy}
            onPress={() => {
              const options = ['low', 'balanced', 'high'];
              const currentIndex = options.indexOf(settings.locationAccuracy);
              const nextIndex = (currentIndex + 1) % options.length;
              handleSettingChange('locationAccuracy', options[nextIndex]);
            }}
            type="value"
          />
          <Divider style={styles.divider} />
          <SettingItem
            icon="🔄"
            title="Auto Check-in"
            subtitle="Automatically check in periodically"
            value={settings.autoCheckIn}
            onPress={() => handleSettingChange('autoCheckIn', !settings.autoCheckIn)}
          />
        </SettingSection>

        {/* Voice & Safety Section */}
        <SettingSection title="Voice & Safety">
          <SettingItem
            icon="🎤"
            title="Voice Activation"
            subtitle="Enable voice commands"
            value={settings.voiceActivation}
            onPress={() => handleSettingChange('voiceActivation', !settings.voiceActivation)}
          />
          <Divider style={styles.divider} />
          <SettingItem
            icon="👥"
            title="Emergency Contacts"
            subtitle="Manage emergency contacts"
            value={settings.emergencyContacts}
            onPress={() => handleSettingChange('emergencyContacts', !settings.emergencyContacts)}
            type="chevron"
          />
        </SettingSection>

        {/* Appearance Section */}
        <SettingSection title="Appearance">
          <SettingItem
            icon="🌙"
            title="Dark Mode"
            subtitle="Use dark theme"
            value={settings.darkMode}
            onPress={() => handleSettingChange('darkMode', !settings.darkMode)}
          />
        </SettingSection>

        {/* Actions Section */}
        <View style={styles.actionsSection}>
          <MotiView
            from={{ opacity: 0, translateY: 50 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 100, delay: 500 }}
          >
            <Button
              mode="outlined"
              onPress={resetSettings}
              style={styles.resetButton}
              textColor="#ff6b6b"
              outlineColor="#ff6b6b"
            >
              Reset to Default
            </Button>
          </MotiView>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 200,
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
    color: '#2c3e50',
    marginBottom: 12,
    marginLeft: 4,
  },
  sectionCard: {
    borderRadius: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  settingIconText: {
    fontSize: 20,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#7f8c8d',
    lineHeight: 18,
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingValue: {
    fontSize: 14,
    color: '#667eea',
    fontWeight: '600',
    textTransform: 'capitalize',
    marginRight: 8,
  },
  rightIconText: {
    fontSize: 16,
    color: '#667eea',
  },
  divider: {
    marginHorizontal: 20,
    backgroundColor: '#e0e0e0',
  },
  actionsSection: {
    marginTop: 20,
    alignItems: 'center',
  },
  resetButton: {
    borderRadius: 12,
    borderWidth: 2,
    paddingHorizontal: 32,
  },
});

export default SettingsScreen;
