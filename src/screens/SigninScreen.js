import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import {
  TextInput,
  Button,
  Title,
  Paragraph,
  ActivityIndicator,
  IconButton,
} from 'react-native-paper';
import { MotiView, AnimatePresence } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { authAPI } from '../services/api';
import notificationService from '../services/notifications';
import { useAuth } from '../context/AuthContext';

const { width, height } = Dimensions.get('window');

const SigninScreen = ({ navigation }) => {
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [formVisible, setFormVisible] = useState(false);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    // Animate form elements in sequence
    const timer = setTimeout(() => setFormVisible(true), 300);
    return () => clearTimeout(timer);
  }, []);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignin = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const response = await authAPI.signin({
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
      });

      if (response.success) {
        // Use auth context to login
        await login(response.data.token, response.data.user);
        
        // Add small delay to ensure token is fully persisted
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Register for push notifications after successful login
        try {
          await notificationService.registerForPushNotifications();
          await notificationService.registerTokenWithBackend();
          console.log('Push notifications registered successfully');
        } catch (error) {
          console.error('Failed to register push notifications:', error);
          // Don't block login if push registration fails
        }
        
        // Show success message and navigate
        Alert.alert(
          'Welcome Back! 🎉',
          `Hello, ${response.data.user.name}!`,
          [
            {
              text: 'Continue',
              onPress: () => {
                // Navigate to appropriate dashboard based on user role
                if (response.data.user.role === 'child') {
                  navigation.replace('ChildDashboard');
                } else {
                  navigation.replace('MotherDashboard');
                }
              },
            },
          ]
        );
      }
    } catch (error) {
      console.error('Signin error:', error);
      const errorMessage = error.response?.data?.message || 'Sign in failed. Please check your credentials.';
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };


  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="light" />
      
      {/* Background Gradient */}
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.backgroundGradient}
      />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Header Section */}
          <MotiView
            from={{ opacity: 0, translateY: -50 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 100 }}
            style={styles.headerSection}
          >
            <View style={styles.logoContainer}>
              <Text style={styles.logo}>MummyHelp</Text>
              <Text style={styles.tagline}>Emergency Alert System</Text>
            </View>
            <Text style={styles.welcomeText}>Welcome Back!</Text>
            <Text style={styles.subtitle}>Sign in to your account</Text>
          </MotiView>

          {/* Form Section */}
          <AnimatePresence>
            {formVisible && (
              <MotiView
                from={{ opacity: 0, translateY: 50, scale: 0.9 }}
                animate={{ opacity: 1, translateY: 0, scale: 1 }}
                transition={{ type: 'spring', damping: 20, stiffness: 100 }}
                style={styles.formSection}
              >
                {/* Email Input */}
                <MotiView
                  from={{ opacity: 0, translateX: -50 }}
                  animate={{ opacity: 1, translateX: 0 }}
                  transition={{ type: 'spring', damping: 20, stiffness: 100, delay: 100 }}
                  style={styles.inputContainer}
                >
                  <TextInput
                    label="Email Address"
                    value={formData.email}
                    onChangeText={(text) => updateFormData('email', text)}
                    mode="outlined"
                    style={styles.input}
                    outlineColor={errors.email ? '#ff6b6b' : '#ffffff80'}
                    activeOutlineColor="#ffffff"
                    textColor="#ffffff"
                    placeholderTextColor="#ffffff80"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    left={<TextInput.Icon icon="email" color="#ffffff80" />}
                  />
                  {errors.email && (
                    <MotiView
                      from={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ type: 'spring', damping: 15, stiffness: 100 }}
                    >
                      <Text style={styles.errorText}>{errors.email}</Text>
                    </MotiView>
                  )}
                </MotiView>

                {/* Password Input */}
                <MotiView
                  from={{ opacity: 0, translateX: -50 }}
                  animate={{ opacity: 1, translateX: 0 }}
                  transition={{ type: 'spring', damping: 20, stiffness: 100, delay: 200 }}
                  style={styles.inputContainer}
                >
                  <TextInput
                    label="Password"
                    value={formData.password}
                    onChangeText={(text) => updateFormData('password', text)}
                    mode="outlined"
                    style={styles.input}
                    outlineColor={errors.password ? '#ff6b6b' : '#ffffff80'}
                    activeOutlineColor="#ffffff"
                    textColor="#ffffff"
                    placeholderTextColor="#ffffff80"
                    secureTextEntry={!showPassword}
                    left={<TextInput.Icon icon="lock" color="#ffffff80" />}
                    right={
                      <TextInput.Icon 
                        icon={showPassword ? "eye-off" : "eye"} 
                        color="#ffffff80"
                        onPress={() => setShowPassword(!showPassword)}
                      />
                    }
                  />
                  {errors.password && (
                    <MotiView
                      from={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ type: 'spring', damping: 15, stiffness: 100 }}
                    >
                      <Text style={styles.errorText}>{errors.password}</Text>
                    </MotiView>
                  )}
                </MotiView>

                {/* Sign In Button */}
                <MotiView
                  from={{ opacity: 0, translateY: 50, scale: 0.8 }}
                  animate={{ opacity: 1, translateY: 0, scale: 1 }}
                  transition={{ type: 'spring', damping: 20, stiffness: 100, delay: 300 }}
                >
                  <TouchableOpacity
                    style={[styles.signinButton, loading && styles.signinButtonDisabled]}
                    onPress={handleSignin}
                    disabled={loading}
                  >
                    {loading ? (
                      <ActivityIndicator color="#667eea" size="small" />
                    ) : (
                      <Text style={styles.signinButtonText}>Sign In</Text>
                    )}
                  </TouchableOpacity>
                </MotiView>

                <MotiView
                  from={{ opacity: 0, translateY: 20 }}
                  animate={{ opacity: 1, translateY: 0 }}
                  transition={{ type: 'spring', damping: 20, stiffness: 100, delay: 400 }}
                >
                </MotiView>
              </MotiView>
            )}
          </AnimatePresence>

          {/* Footer Section */}
          <MotiView
            from={{ opacity: 0, translateY: 50 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 100, delay: 500 }}
            style={styles.footerSection}
          >
            <Text style={styles.footerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
              <Text style={styles.signupLink}>Sign Up</Text>
            </TouchableOpacity>
          </MotiView>
        </ScrollView>
      </KeyboardAvoidingView>
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
  keyboardView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logo: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    color: '#ffffff90',
    fontWeight: '500',
  },
  welcomeText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#ffffff90',
    textAlign: 'center',
    fontWeight: '500',
  },
  formSection: {
    marginBottom: 40,
  },
  inputContainer: {
    marginBottom: 20,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    fontSize: 16,
    borderRadius: 12,
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 12,
    marginTop: 6,
    marginLeft: 4,
    fontWeight: '500',
  },
  signinButton: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
  signinButtonDisabled: {
    opacity: 0.7,
  },
  signinButtonText: {
    color: '#667eea',
    fontSize: 18,
    fontWeight: '700',
  },
  footerSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 'auto',
    paddingTop: 20,
  },
  footerText: {
    color: '#ffffff90',
    fontSize: 15,
  },
  signupLink: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});

export default SigninScreen; 