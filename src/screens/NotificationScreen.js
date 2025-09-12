import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { Button, Card, IconButton, Chip, Switch, Divider } from 'react-native-paper';
import { MotiView, AnimatePresence } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

const NotificationScreen = ({ navigation }) => {
  const [notifications, setNotifications] = useState([]);
  const [notificationSettings, setNotificationSettings] = useState({
    pushNotifications: true,
    emergencyAlerts: true,
    checkInReminders: true,
    familyUpdates: true,
    locationSharing: true,
    soundEnabled: true,
    vibrationEnabled: true,
    quietHours: false,
    quietHoursStart: '22:00',
    quietHoursEnd: '07:00',
  });
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    loadNotifications();
    loadNotificationSettings();
    setupNotificationListener();
  }, []);

  const setupNotificationListener = () => {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: notificationSettings.soundEnabled,
        shouldSetBadge: false,
      }),
    });
  };

  const loadNotifications = async () => {
    try {
      const savedNotifications = await AsyncStorage.getItem('notifications');
      if (savedNotifications) {
        setNotifications(JSON.parse(savedNotifications));
      } else {
        // Add sample notifications
        const sampleNotifications = [
          {
            id: '1',
            title: 'Emergency Alert',
            message: 'Emergency alert activated by voice command',
            type: 'emergency',
            timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 minutes ago
            isRead: false,
            icon: '🚨',
            color: '#f44336',
          },
          {
            id: '2',
            title: 'Safe Check-in',
            message: 'Your child has sent a safe check-in',
            type: 'checkin',
            timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // 15 minutes ago
            isRead: true,
            icon: '✅',
            color: '#4caf50',
          },
          {
            id: '3',
            title: 'Location Update',
            message: 'Family member location has been updated',
            type: 'location',
            timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
            isRead: true,
            icon: '📍',
            color: '#2196f3',
          },
          {
            id: '4',
            title: 'Family Member Online',
            message: 'Mom is now online',
            type: 'family',
            timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(), // 45 minutes ago
            isRead: true,
            icon: '👨‍👩‍👧‍👦',
            color: '#9c27b0',
          },
        ];
        setNotifications(sampleNotifications);
        await AsyncStorage.setItem('notifications', JSON.stringify(sampleNotifications));
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const loadNotificationSettings = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem('notificationSettings');
      if (savedSettings) {
        setNotificationSettings(JSON.parse(savedSettings));
      }
    } catch (error) {
      console.error('Error loading notification settings:', error);
    }
  };

  const saveNotificationSettings = async (newSettings) => {
    try {
      await AsyncStorage.setItem('notificationSettings', JSON.stringify(newSettings));
      setNotificationSettings(newSettings);
    } catch (error) {
      console.error('Error saving notification settings:', error);
    }
  };

  const handleSettingChange = async (key, value) => {
    const newSettings = { ...notificationSettings, [key]: value };
    
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

    saveNotificationSettings(newSettings);
  };

  const markAsRead = async (notificationId) => {
    const updatedNotifications = notifications.map(notification => {
      if (notification.id === notificationId) {
        return { ...notification, isRead: true };
      }
      return notification;
    });
    
    setNotifications(updatedNotifications);
    await AsyncStorage.setItem('notifications', JSON.stringify(updatedNotifications));
  };

  const deleteNotification = async (notificationId) => {
    Alert.alert(
      'Delete Notification',
      'Are you sure you want to delete this notification?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const updatedNotifications = notifications.filter(
              notification => notification.id !== notificationId
            );
            setNotifications(updatedNotifications);
            await AsyncStorage.setItem('notifications', JSON.stringify(updatedNotifications));
          },
        },
      ]
    );
  };

  const clearAllNotifications = () => {
    Alert.alert(
      'Clear All Notifications',
      'Are you sure you want to clear all notifications?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            setNotifications([]);
            await AsyncStorage.setItem('notifications', JSON.stringify([]));
          },
        },
      ]
    );
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  };

  const getTimeAgo = (timestamp) => {
    const now = new Date();
    const notificationTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now - notificationTime) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const getNotificationTypeText = (type) => {
    switch (type) {
      case 'emergency': return 'Emergency';
      case 'checkin': return 'Check-in';
      case 'location': return 'Location';
      case 'family': return 'Family';
      default: return 'General';
    }
  };

  const NotificationItem = ({ notification, index }) => (
    <MotiView
      from={{ opacity: 0, translateX: -50 }}
      animate={{ opacity: 1, translateX: 0 }}
      transition={{ type: 'spring', damping: 20, stiffness: 100, delay: index * 100 }}
    >
      <TouchableOpacity
        style={[
          styles.notificationCard,
          !notification.isRead && styles.unreadNotification
        ]}
        onPress={() => markAsRead(notification.id)}
        activeOpacity={0.8}
      >
        <View style={styles.notificationHeader}>
          <View style={styles.notificationIcon}>
            <Text style={styles.notificationIconText}>{notification.icon}</Text>
          </View>
          <View style={styles.notificationInfo}>
            <Text style={styles.notificationTitle}>{notification.title}</Text>
            <Text style={styles.notificationMessage}>{notification.message}</Text>
            <View style={styles.notificationMeta}>
              <Chip
                mode="outlined"
                textStyle={styles.typeChipText}
                style={[styles.typeChip, { borderColor: notification.color }]}
              >
                {getNotificationTypeText(notification.type)}
              </Chip>
              <Text style={styles.timestamp}>{getTimeAgo(notification.timestamp)}</Text>
            </View>
          </View>
          <View style={styles.notificationActions}>
            {!notification.isRead && (
              <View style={styles.unreadDot} />
            )}
            <IconButton
              icon="dots-vertical"
              iconColor="#667eea"
              size={20}
              onPress={() => {
                Alert.alert(
                  'Notification Options',
                  'What would you like to do?',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Mark as Read', onPress: () => markAsRead(notification.id) },
                    { text: 'Delete', style: 'destructive', onPress: () => deleteNotification(notification.id) },
                  ]
                );
              }}
            />
          </View>
        </View>
      </TouchableOpacity>
    </MotiView>
  );

  const SettingItem = ({ icon, title, subtitle, value, onPress, type = 'toggle' }) => (
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
          ) : (
            <IconButton
              icon="chevron-right"
              iconColor="#667eea"
              size={24}
            />
          )}
        </View>
      </TouchableOpacity>
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
        <Text style={styles.headerTitle}>Notifications</Text>
        <TouchableOpacity
          style={styles.clearButton}
          onPress={clearAllNotifications}
        >
          <Text style={styles.clearButtonText}>Clear All</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#667eea']}
            tintColor="#667eea"
          />
        }
      >
        {/* Notification Settings */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'spring', damping: 20, stiffness: 100 }}
          style={styles.settingsSection}
        >
          <Text style={styles.sectionTitle}>Notification Settings</Text>
          <Card style={styles.settingsCard}>
            <Card.Content>
              <SettingItem
                icon="🔔"
                title="Push Notifications"
                subtitle="Receive notifications on your device"
                value={notificationSettings.pushNotifications}
                onPress={() => handleSettingChange('pushNotifications', !notificationSettings.pushNotifications)}
              />
              <Divider style={styles.divider} />
              <SettingItem
                icon="🚨"
                title="Emergency Alerts"
                subtitle="Get notified of emergency situations"
                value={notificationSettings.emergencyAlerts}
                onPress={() => handleSettingChange('emergencyAlerts', !notificationSettings.emergencyAlerts)}
              />
              <Divider style={styles.divider} />
              <SettingItem
                icon="✅"
                title="Check-in Reminders"
                subtitle="Reminders for safe check-ins"
                value={notificationSettings.checkInReminders}
                onPress={() => handleSettingChange('checkInReminders', !notificationSettings.checkInReminders)}
              />
              <Divider style={styles.divider} />
              <SettingItem
                icon="👨‍👩‍👧‍👦"
                title="Family Updates"
                subtitle="Updates about family members"
                value={notificationSettings.familyUpdates}
                onPress={() => handleSettingChange('familyUpdates', !notificationSettings.familyUpdates)}
              />
              <Divider style={styles.divider} />
              <SettingItem
                icon="📍"
                title="Location Sharing"
                subtitle="Location updates and alerts"
                value={notificationSettings.locationSharing}
                onPress={() => handleSettingChange('locationSharing', !notificationSettings.locationSharing)}
              />
              <Divider style={styles.divider} />
              <SettingItem
                icon="🔊"
                title="Sound Enabled"
                subtitle="Play sounds for notifications"
                value={notificationSettings.soundEnabled}
                onPress={() => handleSettingChange('soundEnabled', !notificationSettings.soundEnabled)}
              />
              <Divider style={styles.divider} />
              <SettingItem
                icon="📳"
                title="Vibration Enabled"
                subtitle="Vibrate for notifications"
                value={notificationSettings.vibrationEnabled}
                onPress={() => handleSettingChange('vibrationEnabled', !notificationSettings.vibrationEnabled)}
              />
            </Card.Content>
          </Card>
        </MotiView>

        {/* Notifications List */}
        <View style={styles.notificationsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Notifications</Text>
            <Text style={styles.notificationCount}>
              {notifications.filter(n => !n.isRead).length} unread
            </Text>
          </View>
          
          {notifications.length > 0 ? (
            notifications.map((notification, index) => (
              <NotificationItem key={notification.id} notification={notification} index={index} />
            ))
          ) : (
            <MotiView
              from={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', damping: 20, stiffness: 100 }}
              style={styles.emptyState}
            >
              <Text style={styles.emptyIcon}>🔔</Text>
              <Text style={styles.emptyTitle}>No Notifications</Text>
              <Text style={styles.emptySubtitle}>
                You're all caught up! New notifications will appear here.
              </Text>
            </MotiView>
          )}
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
  clearButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  clearButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  settingsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 16,
    marginLeft: 4,
  },
  settingsCard: {
    backgroundColor: 'rgba(255,255,255,0.95)',
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
  divider: {
    marginHorizontal: 20,
    backgroundColor: '#e0e0e0',
  },
  notificationsSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  notificationCount: {
    fontSize: 14,
    color: '#667eea',
    fontWeight: '600',
  },
  notificationCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    borderLeftWidth: 4,
    borderLeftColor: '#e0e0e0',
  },
  unreadNotification: {
    borderLeftColor: '#667eea',
    backgroundColor: '#f8f9fa',
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
  },
  notificationIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  notificationIconText: {
    fontSize: 24,
  },
  notificationInfo: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: 14,
    color: '#7f8c8d',
    lineHeight: 20,
    marginBottom: 12,
  },
  notificationMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  typeChip: {
    height: 24,
  },
  typeChipText: {
    fontSize: 12,
    color: '#667eea',
  },
  timestamp: {
    fontSize: 12,
    color: '#bdc3c7',
  },
  notificationActions: {
    alignItems: 'center',
    marginLeft: 12,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#667eea',
    marginBottom: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 80,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#7f8c8d',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#bdc3c7',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
});

export default NotificationScreen;
