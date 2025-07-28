import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

class NotificationService {
  constructor() {
    this.expoPushToken = null;
  }

  // Register for push notifications
  async registerForPushNotifications() {
    let token;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.log('Failed to get push token for push notification!');
        return null;
      }
      
      // Get the token that uniquely identifies this device
      try {
        // Try to get projectId from EAS config, fallback to undefined for development
        const projectId = Constants.expoConfig?.extra?.eas?.projectId;
        
        token = await Notifications.getExpoPushTokenAsync({
          projectId: projectId,
        });
      } catch (error) {
        console.log('Could not get push token (this is normal in development):', error);
        // For development, we can still use local notifications
        return null;
      }
    } else {
      console.log('Must use physical device for Push Notifications');
    }

    this.expoPushToken = token?.data;
    return this.expoPushToken;
  }

  // Get the current push token
  getPushToken() {
    return this.expoPushToken;
  }

  // Send local notification
  async sendLocalNotification(title, body, data = {}) {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: null, // Send immediately
      });
    } catch (error) {
      console.error('Error sending local notification:', error);
    }
  }

  // Send emergency alert notification
  async sendEmergencyAlert(childName, location = 'Unknown location') {
    await this.sendLocalNotification(
      '🚨 Emergency Alert!',
      `${childName} needs immediate help at ${location}`,
      {
        type: 'emergency',
        childName,
        location,
        timestamp: new Date().toISOString(),
      }
    );
  }

  // Send check-in notification
  async sendCheckInAlert(childName, location = 'Unknown location') {
    await this.sendLocalNotification(
      '📍 Check-In',
      `${childName} is checking in from ${location}`,
      {
        type: 'check-in',
        childName,
        location,
        timestamp: new Date().toISOString(),
      }
    );
  }

  // Send help alert notification
  async sendHelpAlert(childName, location = 'Unknown location') {
    await this.sendLocalNotification(
      '🆘 Help Request',
      `${childName} is asking for help at ${location}`,
      {
        type: 'help',
        childName,
        location,
        timestamp: new Date().toISOString(),
      }
    );
  }

  // Add notification listener
  addNotificationListener(callback) {
    return Notifications.addNotificationReceivedListener(callback);
  }

  // Add notification response listener (when user taps notification)
  addNotificationResponseListener(callback) {
    return Notifications.addNotificationResponseReceivedListener(callback);
  }

  // Remove notification listener
  removeNotificationListener(listener) {
    return Notifications.removeNotificationSubscription(listener);
  }

  // Get notification permissions status
  async getNotificationPermissions() {
    return await Notifications.getPermissionsAsync();
  }

  // Request notification permissions
  async requestNotificationPermissions() {
    return await Notifications.requestPermissionsAsync();
  }

  // Cancel all notifications
  async cancelAllNotifications() {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  // Get all scheduled notifications
  async getScheduledNotifications() {
    return await Notifications.getAllScheduledNotificationsAsync();
  }
}

// Create singleton instance
const notificationService = new NotificationService();

export default notificationService; 