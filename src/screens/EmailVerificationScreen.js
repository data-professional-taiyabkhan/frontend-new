import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  ScrollView,
  Dimensions,
} from 'react-native';
import {
  Text,
  Button,
  Title,
  Paragraph,
  ActivityIndicator,
  IconButton,
} from 'react-native-paper';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { authHelpers } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

const { width, height } = Dimensions.get('window');

const EmailVerificationScreen = ({ navigation, route }) => {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const insets = useSafeAreaInsets();

  // Check if we have a verification token from deep link
  const { token } = route.params || {};

  useEffect(() => {
    if (token) {
      handleTokenVerification(token);
    }
  }, [token]);

  const handleTokenVerification = async (verificationToken) => {
    setLoading(true);
    try {
      // Exchange the verification token for a session
      const { data, error } = await authHelpers.exchangeCodeForSession(verificationToken);

      if (error) {
        console.error('Email verification error:', error);
        Alert.alert(
          'Verification Failed',
          error.message || 'Failed to verify email. The token may be invalid or expired.'
        );
        return;
      }

      // Update user in auth context
      const updatedUser = { ...user, emailVerified: true };
      await updateUser(updatedUser);

      Alert.alert(
        'Email Verified! ✅',
        'Your email has been successfully verified.',
        [
          {
            text: 'Continue',
            onPress: () => {
              // Use navigation.reset to properly reset the navigation stack
              navigation.reset({
                index: 0,
                routes: [
                  { 
                    name: user?.role === 'child' ? 'ChildDashboard' : 'MotherDashboard' 
                  }
                ],
              });
            },
          },
        ]
      );
    } catch (error) {
      console.error('Email verification error:', error);
      Alert.alert(
        'Verification Failed',
        'Failed to verify email. The token may be invalid or expired.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!user?.email) {
      Alert.alert('Error', 'User email not found. Please sign in again.');
      return;
    }

    setResendLoading(true);
    try {
      const { data, error } = await authHelpers.resendVerification(user.email);

      if (error) {
        console.error('Resend verification error:', error);
        Alert.alert(
          'Error',
          error.message || 'Failed to send verification email. Please try again.'
        );
        return;
      }

      setVerificationSent(true);
      
      Alert.alert(
        'Verification Email Sent! 📧',
        'Please check your email for the verification link.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Resend verification error:', error);
      Alert.alert(
        'Error',
        'Failed to send verification email. Please try again.'
      );
    } finally {
      setResendLoading(false);
    }
  };

  const handleSkipForNow = () => {
    if (!user) {
      Alert.alert('Error', 'User data not found. Please sign in again.');
      navigation.reset({
        index: 0,
        routes: [{ name: 'Welcome' }],
      });
      return;
    }

    Alert.alert(
      'Skip Verification?',
      'You can still use the app, but some features may be limited until you verify your email.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Skip',
          onPress: () => {
            // Use navigation.reset to properly reset the navigation stack
            navigation.reset({
              index: 0,
              routes: [
                { 
                  name: user.role === 'child' ? 'ChildDashboard' : 'MotherDashboard' 
                }
              ],
            });
          },
        },
      ]
    );
  };

  // Show loading if user data is not available
  if (!user) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#ffffff" />
        <Text style={{ color: '#ffffff', marginTop: 16 }}>Loading...</Text>
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

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <MotiView
          from={{ opacity: 0, translateY: -30 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 600 }}
          style={styles.headerSection}
        >
          <View style={styles.iconContainer}>
            <Text style={styles.emailIcon}>📧</Text>
          </View>
          <Title style={styles.title}>Verify Your Email</Title>
          <Paragraph style={styles.subtitle}>
            We've sent a verification link to{'\n'}
            <Text style={styles.emailText}>{user?.email}</Text>
          </Paragraph>
        </MotiView>

        {/* Content Section */}
        <MotiView
          from={{ opacity: 0, translateY: 30 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 600, delay: 200 }}
          style={styles.contentSection}
        >
          <View style={styles.instructionsContainer}>
            <Text style={styles.instructionTitle}>How to verify:</Text>
            <View style={styles.step}>
              <Text style={styles.stepNumber}>1</Text>
              <Text style={styles.stepText}>Check your email inbox</Text>
            </View>
            <View style={styles.step}>
              <Text style={styles.stepNumber}>2</Text>
              <Text style={styles.stepText}>Look for an email from MummyHelp</Text>
            </View>
            <View style={styles.step}>
              <Text style={styles.stepNumber}>3</Text>
              <Text style={styles.stepText}>Click the verification link</Text>
            </View>
          </View>

          <View style={styles.buttonContainer}>
            {loading ? (
              <ActivityIndicator size="large" color="#ffffff" />
            ) : (
              <>
                <Button
                  mode="contained"
                  onPress={handleResendVerification}
                  loading={resendLoading}
                  disabled={resendLoading || verificationSent}
                  style={[styles.primaryButton, (resendLoading || verificationSent) && styles.primaryButtonDisabled]}
                  labelStyle={styles.primaryButtonText}
                  contentStyle={styles.primaryButtonContent}
                >
                  {verificationSent ? 'Email Sent!' : 'Resend Verification Email'}
                </Button>

                <Button
                  mode="outlined"
                  onPress={handleSkipForNow}
                  style={styles.secondaryButton}
                  labelStyle={styles.secondaryButtonText}
                  contentStyle={styles.secondaryButtonContent}
                >
                  Skip for now
                </Button>
              </>
            )}
          </View>

          <View style={styles.helpContainer}>
            <Text style={styles.helpText}>
              Didn't receive the email? Check your spam folder or try resending.
            </Text>
          </View>
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
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
    justifyContent: 'center',
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconContainer: {
    marginBottom: 20,
  },
  emailIcon: {
    fontSize: 64,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#ffffff90',
    textAlign: 'center',
    lineHeight: 24,
  },
  emailText: {
    fontWeight: '600',
    color: '#ffffff',
  },
  contentSection: {
    flex: 1,
  },
  instructionsContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 24,
    marginBottom: 30,
  },
  instructionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 16,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    color: '#667eea',
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: '600',
    fontSize: 14,
    marginRight: 12,
  },
  stepText: {
    flex: 1,
    fontSize: 16,
    color: '#ffffff',
  },
  buttonContainer: {
    marginBottom: 20,
  },
  primaryButton: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    marginBottom: 12,
  },
  primaryButtonDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  primaryButtonContent: {
    paddingVertical: 8,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#667eea',
  },
  secondaryButton: {
    borderColor: '#ffffff',
    borderWidth: 1,
    borderRadius: 12,
  },
  secondaryButtonContent: {
    paddingVertical: 8,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  helpContainer: {
    alignItems: 'center',
  },
  helpText: {
    fontSize: 14,
    color: '#ffffff80',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default EmailVerificationScreen;
