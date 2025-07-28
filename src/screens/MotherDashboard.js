import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Dimensions,
  TouchableOpacity,
  Linking,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  ActivityIndicator,
  TextInput,
  Badge,
} from 'react-native-paper';
import { authAPI, userAPI, alertAPI, storage } from '../services/api';
import notificationService from '../services/notifications';
import locationService from '../services/location';

const { width, height } = Dimensions.get('window');

const MotherDashboard = ({ navigation }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [pairingCode, setPairingCode] = useState('');
  const [pairingLoading, setPairingLoading] = useState(false);
  const [showPairingForm, setShowPairingForm] = useState(false);
  const [pairedUser, setPairedUser] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [alertsLoading, setAlertsLoading] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState(false);
  const [childLocation, setChildLocation] = useState(null);

  const notificationListener = useRef();
  const responseListener = useRef();

  useEffect(() => {
    loadUserProfile();
    setupNotifications();
    
    // Cleanup notification listeners on unmount
    return () => {
      if (notificationListener.current) {
        notificationService.removeNotificationListener(notificationListener.current);
      }
      if (responseListener.current) {
        notificationService.removeNotificationListener(responseListener.current);
      }
    };
  }, []);

  const setupNotifications = async () => {
    try {
      // Register for push notifications
      const token = await notificationService.registerForPushNotifications();
      console.log('Push token:', token);

      // Check notification permissions
      const permissions = await notificationService.getNotificationPermissions();
      setNotificationPermission(permissions.status === 'granted');

      // Listen for incoming notifications
      notificationListener.current = notificationService.addNotificationListener((notification) => {
        console.log('Notification received:', notification);
        // Refresh alerts when notification is received
        if (user?.isPaired) {
          loadAlerts();
        }
      });

      // Listen for notification responses (when user taps notification)
      responseListener.current = notificationService.addNotificationResponseListener((response) => {
        console.log('Notification response:', response);
        const data = response.notification.request.content.data;
        
        // Handle different notification types
        if (data.type === 'emergency') {
          Alert.alert(
            '🚨 Emergency Alert',
            `${data.childName} needs immediate help at ${data.location}`,
            [
              { text: 'OK', onPress: () => loadAlerts() },
              { text: 'Call Child', onPress: () => handleCallChild() }
            ]
          );
        } else if (data.type === 'check-in') {
          Alert.alert(
            '📍 Check-In',
            `${data.childName} is checking in from ${data.location}`,
            [{ text: 'OK', onPress: () => loadAlerts() }]
          );
        }
      });
    } catch (error) {
      console.error('Error setting up notifications:', error);
    }
  };

  const handleCallChild = () => {
    Alert.alert(
      'Call Child',
      'Would you like to call your child?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Call', 
          onPress: () => {
            // This would integrate with phone calling
            Alert.alert('Call Feature', 'Calling feature will be implemented in the next update.');
          }
        }
      ]
    );
  };

  const loadUserProfile = async () => {
    try {
      const response = await userAPI.getProfile();
      if (response.success) {
        setUser(response.data.user);
        
        // If user is paired, get paired user info and alerts
        if (response.data.user.isPaired) {
          loadPairedUserInfo();
          loadAlerts();
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      Alert.alert('Error', 'Failed to load user profile');
    } finally {
      setLoading(false);
    }
  };

  const loadPairedUserInfo = async () => {
    try {
      const response = await userAPI.getPairedUser();
      if (response.success) {
        setPairedUser(response.data.pairedUser);
      }
    } catch (error) {
      console.error('Error loading paired user:', error);
    }
  };

  const loadAlerts = async () => {
    setAlertsLoading(true);
    try {
      const response = await alertAPI.getPairedAlerts();
      if (response.success) {
        setAlerts(response.data.alerts);
        
        // Get the most recent alert with location
        const recentAlertWithLocation = response.data.alerts
          .filter(alert => alert.latitude && alert.longitude)
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
        
        if (recentAlertWithLocation) {
          setChildLocation({
            latitude: recentAlertWithLocation.latitude,
            longitude: recentAlertWithLocation.longitude,
            address: recentAlertWithLocation.address,
            timestamp: recentAlertWithLocation.createdAt,
            accuracy: recentAlertWithLocation.accuracy,
          });
        }
      }
    } catch (error) {
      console.error('Error loading alerts:', error);
    } finally {
      setAlertsLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            setLogoutLoading(true);
            try {
              await storage.clearAuthData();
              navigation.replace('Signin');
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert('Error', 'Failed to logout');
            } finally {
              setLogoutLoading(false);
            }
          },
        },
      ]
    );
  };

  const handlePairing = async () => {
    if (!pairingCode.trim()) {
      Alert.alert('Error', 'Please enter a pairing code');
      return;
    }

    setPairingLoading(true);
    try {
      const response = await userAPI.pairWithUser(pairingCode.trim());
      
      if (response.success) {
        Alert.alert(
          'Pairing Successful! 🎉',
          `You are now connected with ${response.data.pairedUser.name}. You will receive alerts when they need help.`,
          [
            {
              text: 'Continue',
              onPress: () => {
                setShowPairingForm(false);
                setPairingCode('');
                // Reload user profile to update pairing status
                loadUserProfile();
              },
            },
          ]
        );
      }
    } catch (error) {
      console.error('Pairing error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to pair with child. Please check the code and try again.';
      Alert.alert('Error', errorMessage);
    } finally {
      setPairingLoading(false);
    }
  };

  const handleUnpair = async () => {
    Alert.alert(
      'Unpair',
      'Are you sure you want to disconnect from your child?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await userAPI.unpairUser();
              if (response.success) {
                Alert.alert('Disconnected', 'You have been disconnected from your child.');
                setPairedUser(null);
                setAlerts([]);
                setChildLocation(null);
                loadUserProfile();
              }
            } catch (error) {
              console.error('Unpair error:', error);
              Alert.alert('Error', 'Failed to disconnect');
            }
          },
        },
      ]
    );
  };

  const handleAcknowledgeAlert = async (alertId) => {
    try {
      const response = await alertAPI.acknowledgeAlert(alertId);
      if (response.success) {
        Alert.alert('Alert Acknowledged', 'You have acknowledged the alert.');
        loadAlerts(); // Reload alerts to update status
      }
    } catch (error) {
      console.error('Acknowledge alert error:', error);
      Alert.alert('Error', 'Failed to acknowledge alert');
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hours ago`;
    return date.toLocaleDateString();
  };

  const getAlertIcon = (type) => {
    switch (type) {
      case 'emergency':
        return '🚨';
      case 'help':
        return '🆘';
      case 'check-in':
        return '📍';
      default:
        return '📢';
    }
  };

  const getAlertColor = (type) => {
    switch (type) {
      case 'emergency':
        return '#e74c3c';
      case 'help':
        return '#f39c12';
      case 'check-in':
        return '#3498db';
      default:
        return '#95a5a6';
    }
  };

  // Action button handlers
  const handleLiveMap = () => {
    if (!childLocation) {
      Alert.alert('No Location', 'No recent location data available from your child.');
      return;
    }
    
    Alert.alert(
      'Live Map',
      'Would you like to open your child\'s location in maps?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Open Maps', 
          onPress: () => {
            const url = `https://www.google.com/maps?q=${childLocation.latitude},${childLocation.longitude}`;
            Linking.openURL(url);
          }
        }
      ]
    );
  };

  const handleAlerts = () => {
    Alert.alert(
      'Alerts',
      'Recent alerts from your child:',
      [
        { text: 'OK' },
        { 
          text: 'View All', 
          onPress: () => {
            // This would navigate to a detailed alerts screen
            Alert.alert('Alerts Screen', 'Detailed alerts screen will be implemented in the next update.');
          }
        }
      ]
    );
  };

  const handleSettings = () => {
    Alert.alert(
      'Settings',
      'App settings and preferences:',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Notification Settings', onPress: () => Alert.alert('Settings', 'Notification settings will be implemented.') },
        { text: 'Privacy Settings', onPress: () => Alert.alert('Settings', 'Privacy settings will be implemented.') },
        { text: 'Account Settings', onPress: () => Alert.alert('Settings', 'Account settings will be implemented.') },
      ]
    );
  };

  const handleHelp = () => {
    Alert.alert(
      'Help & Support',
      'How can we help you?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'FAQ', onPress: () => Alert.alert('FAQ', 'Frequently asked questions will be shown here.') },
        { text: 'Contact Support', onPress: () => Alert.alert('Support', 'Contact support feature will be implemented.') },
        { text: 'User Guide', onPress: () => Alert.alert('Guide', 'User guide will be implemented.') },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#667eea" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>MummyHelp</Text>
          <Text style={styles.headerSubtitle}>Parent Dashboard</Text>
        </View>
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          disabled={logoutLoading}
        >
          {logoutLoading ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Text style={styles.logoutButtonText}>Logout</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Welcome Card */}
        <Card style={styles.welcomeCard}>
          <Card.Content>
            <Title style={styles.welcomeTitle}>
              Welcome back, {user?.name}! 👋
            </Title>
            <Paragraph style={styles.welcomeText}>
              You're logged in as a parent. {user?.isPaired ? 'You are connected with your child.' : 'Connect with your child to start receiving alerts.'}
            </Paragraph>
            {!notificationPermission && (
              <Paragraph style={styles.notificationWarning}>
                ⚠️ Enable notifications to receive instant alerts from your child.
              </Paragraph>
            )}
          </Card.Content>
        </Card>

        {/* Pairing Status Card */}
        <Card style={styles.pairingCard}>
          <Card.Content>
            <Title style={styles.pairingTitle}>
              {user?.isPaired ? '🟢 Connected' : '🔴 Not Connected'}
            </Title>
            <Paragraph style={styles.pairingText}>
              {user?.isPaired 
                ? 'You are paired with your child. You will receive emergency alerts and location updates.'
                : 'You need to pair with your child to receive alerts and location updates.'
              }
            </Paragraph>
            
            {!user?.isPaired ? (
              <Button
                mode="contained"
                onPress={() => setShowPairingForm(true)}
                style={styles.pairButton}
              >
                Connect with Child
              </Button>
            ) : (
              <Button
                mode="outlined"
                onPress={handleUnpair}
                style={styles.unpairButton}
              >
                Disconnect
              </Button>
            )}
          </Card.Content>
        </Card>

        {/* Pairing Form */}
        {showPairingForm && (
          <Card style={styles.pairingFormCard}>
            <Card.Content>
              <Title style={styles.pairingFormTitle}>Connect with Your Child</Title>
              <Paragraph style={styles.pairingInstructions}>
                Follow these steps to connect with your child:
              </Paragraph>
              
              <View style={styles.stepsContainer}>
                <View style={styles.step}>
                  <Text style={styles.stepNumber}>1</Text>
                  <Text style={styles.stepText}>Ask your child to open their MummyHelp app</Text>
                </View>
                <View style={styles.step}>
                  <Text style={styles.stepNumber}>2</Text>
                  <Text style={styles.stepText}>They will see a 6-digit pairing code on their screen</Text>
                </View>
                <View style={styles.step}>
                  <Text style={styles.stepNumber}>3</Text>
                  <Text style={styles.stepText}>Enter that code below</Text>
                </View>
              </View>

              <TextInput
                label="Enter Pairing Code"
                value={pairingCode}
                onChangeText={setPairingCode}
                mode="outlined"
                style={styles.pairingInput}
                keyboardType="numeric"
                maxLength={6}
                placeholder="123456"
              />

              <View style={styles.pairingButtons}>
                <Button
                  mode="outlined"
                  onPress={() => {
                    setShowPairingForm(false);
                    setPairingCode('');
                  }}
                  style={styles.cancelButton}
                >
                  Cancel
                </Button>
                <Button
                  mode="contained"
                  onPress={handlePairing}
                  loading={pairingLoading}
                  disabled={pairingLoading || !pairingCode.trim()}
                  style={styles.confirmButton}
                >
                  Connect
                </Button>
              </View>
            </Card.Content>
          </Card>
        )}

        {/* Connected Child Info */}
        {user?.isPaired && pairedUser && (
          <Card style={styles.childInfoCard}>
            <Card.Content>
              <Title style={styles.childInfoTitle}>Connected Child</Title>
              <View style={styles.childInfo}>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Name:</Text>
                  <Text style={styles.infoValue}>{pairedUser.name}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Status:</Text>
                  <Text style={styles.infoValue}>🟢 Online</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Last Seen:</Text>
                  <Text style={styles.infoValue}>2 minutes ago</Text>
                </View>
                {childLocation && (
                  <>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Last Location:</Text>
                      <Text style={styles.infoValue}>{childLocation.address || 'Unknown'}</Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Location Time:</Text>
                      <Text style={styles.infoValue}>{formatTime(childLocation.timestamp)}</Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Accuracy:</Text>
                      <Text style={styles.infoValue}>{childLocation.accuracy ? `${Math.round(childLocation.accuracy)}m` : 'Unknown'}</Text>
                    </View>
                  </>
                )}
              </View>
            </Card.Content>
          </Card>
        )}

        {/* Alerts Section */}
        {user?.isPaired && (
          <Card style={styles.alertsCard}>
            <Card.Content>
              <View style={styles.alertsHeader}>
                <Title style={styles.alertsTitle}>Recent Alerts</Title>
                <TouchableOpacity onPress={loadAlerts} disabled={alertsLoading}>
                  <Text style={styles.refreshText}>Refresh</Text>
                </TouchableOpacity>
              </View>
              
              {alertsLoading ? (
                <ActivityIndicator size="small" color="#667eea" style={styles.alertsLoading} />
              ) : alerts.length === 0 ? (
                <Paragraph style={styles.noAlertsText}>
                  No alerts yet. Your child will send alerts when they need help.
                </Paragraph>
              ) : (
                <View style={styles.alertsList}>
                  {alerts.slice(0, 5).map((alert) => (
                    <View key={alert.id} style={styles.alertItem}>
                      <View style={styles.alertHeader}>
                        <View style={styles.alertType}>
                          <Text style={styles.alertIcon}>{getAlertIcon(alert.type)}</Text>
                          <Text style={[styles.alertTypeText, { color: getAlertColor(alert.type) }]}>
                            {alert.type.toUpperCase()}
                          </Text>
                        </View>
                        <View style={styles.alertStatus}>
                          {alert.status === 'active' ? (
                            <Badge style={styles.activeBadge}>Active</Badge>
                          ) : (
                            <Badge style={styles.acknowledgedBadge}>Acknowledged</Badge>
                          )}
                        </View>
                      </View>
                      
                      <Text style={styles.alertMessage}>{alert.message}</Text>
                      
                      {alert.address && (
                        <Text style={styles.alertLocation}>📍 {alert.address}</Text>
                      )}
                      
                      <View style={styles.alertFooter}>
                        <Text style={styles.alertTime}>{formatTime(alert.createdAt)}</Text>
                        {alert.status === 'active' && (
                          <Button
                            mode="outlined"
                            onPress={() => handleAcknowledgeAlert(alert.id)}
                            style={styles.acknowledgeButton}
                            compact
                          >
                            Acknowledge
                          </Button>
                        )}
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </Card.Content>
          </Card>
        )}

        {/* Quick Actions */}
        <Card style={styles.actionsCard}>
          <Card.Content>
            <Title style={styles.actionsTitle}>Quick Actions</Title>
            <View style={styles.actionsGrid}>
              <TouchableOpacity 
                style={[styles.actionButton, !user?.isPaired && styles.actionButtonDisabled]}
                onPress={handleLiveMap}
                disabled={!user?.isPaired}
              >
                <Text style={styles.actionIcon}>🗺️</Text>
                <Text style={styles.actionText}>Live Map</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.actionButton, !user?.isPaired && styles.actionButtonDisabled]}
                onPress={handleAlerts}
                disabled={!user?.isPaired}
              >
                <Text style={styles.actionIcon}>🚨</Text>
                <Text style={styles.actionText}>Alerts</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={handleSettings}
              >
                <Text style={styles.actionIcon}>⚙️</Text>
                <Text style={styles.actionText}>Settings</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={handleHelp}
              >
                <Text style={styles.actionIcon}>❓</Text>
                <Text style={styles.actionText}>Help</Text>
              </TouchableOpacity>
            </View>
          </Card.Content>
        </Card>

        {/* Coming Soon Features */}
        <Card style={styles.comingSoonCard}>
          <Card.Content>
            <Title style={styles.comingSoonTitle}>🚧 Coming Soon</Title>
            <Paragraph style={styles.comingSoonText}>
              We're working hard to bring you these features:
            </Paragraph>
            <View style={styles.featuresList}>
              <View style={styles.featureItem}>
                <Text style={styles.featureIcon}>🚨</Text>
                <Text style={styles.featureText}>Emergency alerts with voice activation</Text>
              </View>
              <View style={styles.featureItem}>
                <Text style={styles.featureIcon}>📍</Text>
                <Text style={styles.featureText}>Real-time location tracking</Text>
              </View>
              <View style={styles.featureItem}>
                <Text style={styles.featureIcon}>💬</Text>
                <Text style={styles.featureText}>Check-in messages</Text>
              </View>
              <View style={styles.featureItem}>
                <Text style={styles.featureIcon}>📱</Text>
                <Text style={styles.featureText}>Push notifications</Text>
              </View>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: '#667eea',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#ffffff80',
    marginTop: 2,
  },
  logoutButton: {
    backgroundColor: '#ffffff20',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  logoutButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  welcomeCard: {
    marginBottom: 20,
    borderRadius: 12,
    elevation: 4,
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
  },
  welcomeText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  notificationWarning: {
    fontSize: 12,
    color: '#e74c3c',
    marginTop: 8,
    fontStyle: 'italic',
  },
  pairingCard: {
    marginBottom: 20,
    borderRadius: 12,
    elevation: 4,
  },
  pairingTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 12,
  },
  pairingText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  pairButton: {
    backgroundColor: '#667eea',
    marginTop: 8,
  },
  unpairButton: {
    marginTop: 8,
    borderColor: '#e74c3c',
  },
  pairingFormCard: {
    marginBottom: 20,
    borderRadius: 12,
    elevation: 4,
  },
  pairingFormTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 12,
  },
  pairingInstructions: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  stepsContainer: {
    marginBottom: 20,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  stepNumber: {
    backgroundColor: '#667eea',
    color: '#ffffff',
    width: 24,
    height: 24,
    borderRadius: 12,
    textAlign: 'center',
    lineHeight: 24,
    fontSize: 12,
    fontWeight: 'bold',
    marginRight: 12,
  },
  stepText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  pairingInput: {
    marginBottom: 16,
  },
  pairingButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    flex: 1,
    marginRight: 8,
  },
  confirmButton: {
    flex: 1,
    marginLeft: 8,
    backgroundColor: '#667eea',
  },
  childInfoCard: {
    marginBottom: 20,
    borderRadius: 12,
    elevation: 4,
  },
  childInfoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 16,
  },
  childInfo: {
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: '#2c3e50',
    fontWeight: '600',
  },
  alertsCard: {
    marginBottom: 20,
    borderRadius: 12,
    elevation: 4,
  },
  alertsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  alertsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
  },
  refreshText: {
    color: '#667eea',
    fontSize: 14,
    fontWeight: '500',
  },
  alertsLoading: {
    marginVertical: 20,
  },
  noAlertsText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
    marginVertical: 20,
  },
  alertsList: {
    gap: 12,
  },
  alertItem: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#667eea',
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  alertType: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  alertIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  alertTypeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  alertStatus: {
    // Badge styling is handled by react-native-paper
  },
  activeBadge: {
    backgroundColor: '#e74c3c',
  },
  acknowledgedBadge: {
    backgroundColor: '#27ae60',
  },
  alertMessage: {
    fontSize: 14,
    color: '#2c3e50',
    marginBottom: 8,
  },
  alertLocation: {
    fontSize: 12,
    color: '#3498db',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  alertFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  alertTime: {
    fontSize: 12,
    color: '#666',
  },
  acknowledgeButton: {
    borderColor: '#667eea',
  },
  actionsCard: {
    marginBottom: 20,
    borderRadius: 12,
    elevation: 4,
  },
  actionsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 16,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    width: (width - 60) / 2,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  actionButtonDisabled: {
    opacity: 0.5,
  },
  actionIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  actionText: {
    fontSize: 14,
    color: '#2c3e50',
    fontWeight: '500',
  },
  comingSoonCard: {
    marginBottom: 20,
    borderRadius: 12,
    elevation: 4,
  },
  comingSoonTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 12,
  },
  comingSoonText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  featuresList: {
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  featureText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
});

export default MotherDashboard; 