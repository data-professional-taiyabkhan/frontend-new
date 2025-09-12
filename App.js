import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, ActivityIndicator, Linking } from 'react-native';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import * as ExpoLinking from 'expo-linking';

// Import screens
import WelcomeScreen from './src/screens/WelcomeScreen';
import SigninScreen from './src/screens/SigninScreen';
import SignupScreen from './src/screens/SignupScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import EmergencyScreen from './src/screens/EmergencyScreen';
import CheckInScreen from './src/screens/CheckInScreen';
import FamilyScreen from './src/screens/FamilyScreen';
import VoiceRecognitionScreen from './src/screens/VoiceRecognitionScreen';
import VoiceEnrollScreen from './src/screens/VoiceEnrollScreen';
import NotificationScreen from './src/screens/NotificationScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import MotherDashboard from './src/screens/MotherDashboard';
import ChildDashboard from './src/screens/ChildDashboard';
import ProfileScreen from './src/screens/ProfileScreen';
import HelpSupportScreen from './src/screens/HelpSupportScreen';
import MapScreen from './src/screens/MapScreen';
import TermsOfServiceScreen from './src/screens/TermsOfServiceScreen';
import PrivacyPolicyScreen from './src/screens/PrivacyPolicyScreen';
import EmailVerificationScreen from './src/screens/EmailVerificationScreen';

const Stack = createStackNavigator();

// Loading component
const LoadingScreen = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <ActivityIndicator size="large" color="#e74c3c" />
  </View>
);

// Navigation component that uses auth context
const AppNavigator = () => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [initialRoute, setInitialRoute] = useState(null);
  const [initialParams, setInitialParams] = useState({});

  // Handle deep links
  useEffect(() => {
    const handleDeepLink = (url) => {
      console.log('Deep link received:', url);
      
      if (url) {
        const { hostname, path, queryParams } = ExpoLinking.parse(url);
        
        // Handle email verification deep link
        if (hostname === 'verify-email' && queryParams?.token) {
          console.log('Email verification deep link detected with token:', queryParams.token);
          setInitialRoute('EmailVerification');
          setInitialParams({ token: queryParams.token });
        }
      }
    };

    // Handle deep link when app is already running
    const subscription = Linking.addEventListener('url', handleDeepLink);

    // Handle deep link when app is opened from a cold start
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink(url);
      }
    });

    return () => {
      subscription?.remove();
    };
  }, []);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer
      initialRouteName={initialRoute || 'Welcome'}
      initialParams={initialParams}
    >
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: '#2c3e50',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
          <Stack.Screen
            name="Welcome"
            component={WelcomeScreen}
            options={{
              title: 'Welcome to MummyHelp',
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="Signin"
            component={SigninScreen}
            options={{
              title: 'Sign In',
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="Signup"
            component={SignupScreen}
            options={{
              title: 'Create Account',
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="Onboarding"
            component={OnboardingScreen}
            options={{
              title: 'Setup Your Profile',
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="VoiceEnroll"
            component={VoiceEnrollScreen}
            options={{
              title: 'Voice Enrollment',
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="Emergency"
            component={EmergencyScreen}
            options={{
              title: 'Emergency Alert',
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="CheckIn"
            component={CheckInScreen}
            options={{
              title: 'Safe Check-in',
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="Family"
            component={FamilyScreen}
            options={{
              title: 'Family',
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="VoiceRecognition"
            component={VoiceRecognitionScreen}
            options={{
              title: 'Voice Recognition',
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="Notifications"
            component={NotificationScreen}
            options={{
              title: 'Notifications',
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="Settings"
            component={SettingsScreen}
            options={{
              title: 'Settings',
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="MotherDashboard"
            component={MotherDashboard}
            options={{
              title: 'Parent Dashboard',
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="ChildDashboard"
            component={ChildDashboard}
            options={{
              title: 'Child Dashboard',
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="Profile"
            component={ProfileScreen}
            options={{
              title: 'Profile',
              headerShown: true,
            }}
          />
          <Stack.Screen
            name="HelpSupport"
            component={HelpSupportScreen}
            options={{
              title: 'Help & Support',
              headerShown: true,
            }}
          />
          <Stack.Screen
            name="MapScreen"
            component={MapScreen}
            options={{
              title: 'Location Map',
              headerShown: true,
            }}
          />
          <Stack.Screen
            name="TermsOfService"
            component={TermsOfServiceScreen}
            options={{
              title: 'Terms of Service',
              headerShown: true,
            }}
          />
          <Stack.Screen
            name="PrivacyPolicy"
            component={PrivacyPolicyScreen}
            options={{
              title: 'Privacy Policy',
              headerShown: true,
            }}
          />
          <Stack.Screen
            name="VoiceSettings"
            component={require('./src/components/VoiceSettingsUI').default}
            options={{
              title: 'Voice Settings',
              headerShown: true,
            }}
          />
          <Stack.Screen
            name="EmailVerification"
            component={EmailVerificationScreen}
            options={{
              title: 'Verify Email',
              headerShown: false,
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>
  );
};

const App = () => {
  return (
    <SafeAreaProvider>
      <PaperProvider>
        <AuthProvider>
          <AppNavigator />
        </AuthProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
};

export default App;
