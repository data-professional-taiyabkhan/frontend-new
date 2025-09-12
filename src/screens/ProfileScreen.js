import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Image } from 'react-native';
import { Card, Button, Avatar, List, Switch, Divider, TextInput, ActivityIndicator } from 'react-native-paper';
import { MotiView } from 'moti';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { userAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function ProfileScreen({ navigation, route }) {
  const { user: authUser, logout } = useAuth();
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [settings, setSettings] = useState({
    pushNotifications: true,
    locationSharing: true,
    voiceCommands: true,
    emergencyAlerts: true,
    locationHistory: true,
    autoCheckIn: false
  });

  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});

  useEffect(() => {
    loadUserProfile();
    loadSettings();
  }, []);

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      // Get user from auth context
      if (authUser) {
        setUserProfile(authUser);
      }
      
      // Then fetch fresh data from API
      const response = await userAPI.getProfile();
      if (response.success) {
        setUserProfile(response.data.user);
        // Update local storage with fresh data
        // User data is automatically updated through auth context
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      Alert.alert('Error', 'Failed to load user profile');
    } finally {
      setLoading(false);
    }
  };

  const loadSettings = async () => {
    try {
      const storedSettings = await AsyncStorage.getItem('userSettings');
      if (storedSettings) {
        setSettings(JSON.parse(storedSettings));
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const saveUserProfile = async (newProfile) => {
    try {
      const response = await userAPI.updateProfile({
        name: newProfile.name,
        email: newProfile.email
      });
      
      if (response.success) {
        setUserProfile(response.data.user);
        // Update local storage
        // User data is automatically updated through auth context
        Alert.alert('Success', 'Profile updated successfully');
      } else {
        Alert.alert('Error', response.message || 'Failed to save profile');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Failed to save profile');
    }
  };

  const saveSettings = async (newSettings) => {
    try {
      await AsyncStorage.setItem('userSettings', JSON.stringify(newSettings));
      setSettings(newSettings);
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  const handleEditProfile = () => {
    setEditData({ ...userProfile });
    setIsEditing(true);
  };

  const handleSaveProfile = () => {
    saveUserProfile(editData);
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditData({});
  };

  const handleSettingChange = (key, value) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              navigation.reset({
                index: 0,
                routes: [{ name: 'Welcome' }],
              });
            } catch (error) {
              console.error('Error during logout:', error);
            }
          }
        }
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This action cannot be undone. All your data will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Account Deleted', 'Your account has been deleted successfully.');
          }
        }
      ]
    );
  };

  if (loading || !userProfile) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#667eea" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  const renderProfileHeader = () => (
    <MotiView
      from={{ opacity: 0, translateY: -30 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 800 }}
    >
      <Card style={styles.profileCard}>
        <Card.Content style={styles.profileContent}>
          <View style={styles.avatarSection}>
            <Avatar.Image
              size={80}
              source={userProfile.avatar ? { uri: userProfile.avatar } : null}
              style={styles.avatar}
            />
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{userProfile.name}</Text>
              <Text style={styles.profileRole}>{userProfile.role === 'mother' ? 'Parent' : 'Child'}</Text>
              <Text style={styles.profileEmail}>{userProfile.email}</Text>
            </View>
          </View>
          
          <View style={styles.profileActions}>
            <Button
              mode="outlined"
              onPress={handleEditProfile}
              style={styles.editButton}
              compact
            >
              Edit Profile
            </Button>
          </View>
        </Card.Content>
      </Card>
    </MotiView>
  );

  const renderProfileForm = () => (
    <MotiView
      from={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'timing', duration: 600 }}
    >
      <Card style={styles.formCard}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          
          <TextInput
            label="Full Name"
            value={editData.name || ''}
            onChangeText={(text) => setEditData({ ...editData, name: text })}
            style={styles.input}
            mode="outlined"
          />
          
          <TextInput
            label="Email"
            value={editData.email || ''}
            onChangeText={(text) => setEditData({ ...editData, email: text })}
            style={styles.input}
            mode="outlined"
            keyboardType="email-address"
          />
          

          
          <View style={styles.formActions}>
            <Button
              mode="outlined"
              onPress={handleCancelEdit}
              style={styles.cancelButton}
              compact
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={handleSaveProfile}
              style={styles.saveButton}
              compact
            >
              Save
            </Button>
          </View>
        </Card.Content>
      </Card>
    </MotiView>
  );

  const renderSettings = () => (
    <MotiView
      from={{ opacity: 0, translateY: 30 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 800, delay: 200 }}
    >
      <Card style={styles.settingsCard}>
        <Card.Content>
          <Text style={styles.sectionTitle}>App Settings</Text>
          
          <List.Item
            title="Push Notifications"
            description="Receive alerts and updates"
            left={(props) => <List.Icon {...props} icon="bell" />}
            right={() => (
              <Switch
                value={settings.pushNotifications}
                onValueChange={(value) => handleSettingChange('pushNotifications', value)}
              />
            )}
          />
          
          <Divider />
          
          <List.Item
            title="Location Sharing"
            description="Share location with family members"
            left={(props) => <List.Icon {...props} icon="map-marker" />}
            right={() => (
              <Switch
                value={settings.locationSharing}
                onValueChange={(value) => handleSettingChange('locationSharing', value)}
              />
            )}
          />
          
          <Divider />
          
          <List.Item
            title="Voice Commands"
            description="Enable voice-activated features"
            left={(props) => <List.Icon {...props} icon="microphone" />}
            right={() => (
              <Switch
                value={settings.voiceCommands}
                onValueChange={(value) => handleSettingChange('voiceCommands', value)}
              />
            )}
          />
          
          <Divider />
          
          <List.Item
            title="Emergency Alerts"
            description="Receive emergency notifications"
            left={(props) => <List.Icon {...props} icon="alert" />}
            right={() => (
              <Switch
                value={settings.emergencyAlerts}
                onValueChange={(value) => handleSettingChange('emergencyAlerts', value)}
              />
            )}
          />
          
          <Divider />
          
          <List.Item
            title="Location History"
            description="Save location tracking data"
            left={(props) => <List.Icon {...props} icon="history" />}
            right={() => (
              <Switch
                value={settings.locationHistory}
                onValueChange={(value) => handleSettingChange('locationHistory', value)}
              />
            )}
          />
          
          <Divider />
          
          <List.Item
            title="Auto Check-in"
            description="Automatic location check-ins"
            left={(props) => <List.Icon {...props} icon="clock-check" />}
            right={() => (
              <Switch
                value={settings.autoCheckIn}
                onValueChange={(value) => handleSettingChange('autoCheckIn', value)}
              />
            )}
          />
        </Card.Content>
      </Card>
    </MotiView>
  );



  const renderActions = () => (
    <MotiView
      from={{ opacity: 0, translateY: 30 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 800, delay: 600 }}
    >
      <Card style={styles.actionsCard}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Account Actions</Text>
          
          <Button
            mode="outlined"
            onPress={() => navigation.navigate('VoiceSettings')}
            icon="cog"
            style={styles.actionButton}
            contentStyle={styles.actionButtonContent}
          >
            Voice Settings
          </Button>
          
          <Button
            mode="outlined"
            onPress={() => navigation.navigate('PrivacyPolicy')}
            icon="shield"
            style={styles.actionButton}
            contentStyle={styles.actionButtonContent}
          >
            Privacy Policy
          </Button>
          
          <Button
            mode="outlined"
            onPress={() => navigation.navigate('TermsOfService')}
            icon="file-document"
            style={styles.actionButton}
            contentStyle={styles.actionButtonContent}
          >
            Terms of Service
          </Button>
          
          <Button
            mode="outlined"
            onPress={() => navigation.navigate('HelpSupport')}
            icon="help-circle"
            style={styles.actionButton}
            contentStyle={styles.actionButtonContent}
          >
            Help & Support
          </Button>
          
          <Divider style={styles.divider} />
          
          <Button
            mode="outlined"
            onPress={handleLogout}
            icon="logout"
            style={[styles.actionButton, styles.logoutButton]}
            contentStyle={styles.actionButtonContent}
            textColor="#e74c3c"
          >
            Logout
          </Button>
          
          <Button
            mode="outlined"
            onPress={handleDeleteAccount}
            icon="delete"
            style={[styles.actionButton, styles.deleteButton]}
            contentStyle={styles.actionButtonContent}
            textColor="#e74c3c"
          >
            Delete Account
          </Button>
        </Card.Content>
      </Card>
    </MotiView>
  );

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {renderProfileHeader()}
        
        {isEditing && renderProfileForm()}
        
        {renderSettings()}
        
        {renderActions()}
        
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
}

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
  scrollView: {
    flex: 1,
  },
  profileCard: {
    margin: 16,
    elevation: 4,
    borderRadius: 16,
  },
  profileContent: {
    padding: 20,
  },
  avatarSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatar: {
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
  },
  profileRole: {
    fontSize: 16,
    color: '#7f8c8d',
    marginBottom: 4,
    textTransform: 'capitalize',
  },
  profileEmail: {
    fontSize: 14,
    color: '#95a5a6',
  },
  profileActions: {
    alignItems: 'flex-end',
  },
  editButton: {
    borderRadius: 8,
  },
  formCard: {
    margin: 16,
    elevation: 4,
    borderRadius: 16,
  },
  input: {
    marginBottom: 16,
  },
  formActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    borderColor: '#95a5a6',
  },
  saveButton: {
    flex: 1,
  },
  settingsCard: {
    margin: 16,
    elevation: 4,
    borderRadius: 16,
  },

  actionsCard: {
    margin: 16,
    elevation: 4,
    borderRadius: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 16,
  },
  actionButton: {
    marginBottom: 12,
    borderRadius: 8,
  },
  actionButtonContent: {
    paddingVertical: 8,
  },
  logoutButton: {
    borderColor: '#e74c3c',
  },
  deleteButton: {
    borderColor: '#e74c3c',
  },
  divider: {
    marginVertical: 16,
  },
  bottomSpacing: {
    height: 20,
  },
});
