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
  RadioButton,
  IconButton,
} from 'react-native-paper';
import { MotiView, AnimatePresence } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { authAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const { width, height } = Dimensions.get('window');

const SignupScreen = ({ navigation }) => {
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    role: 'mother',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formVisible, setFormVisible] = useState(false);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    // Animate form elements in sequence
    const timer = setTimeout(() => setFormVisible(true), 300);
    return () => clearTimeout(timer);
  }, []);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

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

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!formData.role) {
      newErrors.role = 'Please select a role';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignup = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const response = await authAPI.signup({
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        name: formData.name.trim(),
        role: formData.role,
      });

      if (response.success) {
        // Use auth context to login
        await login(response.data.token, response.data.user);
        
        Alert.alert(
          'Welcome to MummyHelp! 🎉',
          `Account created successfully for ${response.data.user.name}!\n\nPlease verify your email to access all features.`,
          [
            {
              text: 'Verify Email',
              onPress: () => {
                // Navigate to email verification for new users
                navigation.navigate('EmailVerification');
              },
            },
          ]
        );
      }
    } catch (error) {
      console.error('Signup error:', error);
      const errorMessage = error.response?.data?.message || 'Sign up failed. Please try again.';
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

  const getPasswordStrength = (password) => {
    if (password.length === 0) return { strength: 0, color: '#ccc', text: '' };
    if (password.length < 6) return { strength: 1, color: '#ff6b6b', text: 'Weak' };
    if (password.length < 8) return { strength: 2, color: '#ffa726', text: 'Fair' };
    if (password.length < 10) return { strength: 3, color: '#66bb6a', text: 'Good' };
    return { strength: 4, color: '#4caf50', text: 'Strong' };
  };

  const passwordStrength = getPasswordStrength(formData.password);

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
            <Text style={styles.welcomeText}>Create Account</Text>
            <Text style={styles.subtitle}>Join our safety network</Text>
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
                {/* Name Input */}
                <MotiView
                  from={{ opacity: 0, translateX: -50 }}
                  animate={{ opacity: 1, translateX: 0 }}
                  transition={{ type: 'spring', damping: 20, stiffness: 100, delay: 100 }}
                  style={styles.inputContainer}
                >
                  <TextInput
                    label="Full Name"
                    value={formData.name}
                    onChangeText={(text) => updateFormData('name', text)}
                    mode="outlined"
                    style={styles.input}
                    outlineColor={errors.name ? '#ff6b6b' : '#ffffff80'}
                    activeOutlineColor="#ffffff"
                    textColor="#ffffff"
                    placeholderTextColor="#ffffff80"
                    autoCapitalize="words"
                    left={<TextInput.Icon icon="account" color="#ffffff80" />}
                  />
                  {errors.name && (
                    <MotiView
                      from={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ type: 'spring', damping: 15, stiffness: 100 }}
                    >
                      <Text style={styles.errorText}>{errors.name}</Text>
                    </MotiView>
                  )}
                </MotiView>

                {/* Email Input */}
                <MotiView
                  from={{ opacity: 0, translateX: -50 }}
                  animate={{ opacity: 1, translateX: 0 }}
                  transition={{ type: 'spring', damping: 20, stiffness: 100, delay: 200 }}
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
                  transition={{ type: 'spring', damping: 20, stiffness: 100, delay: 300 }}
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
                  
                  {/* Password Strength Indicator */}
                  {formData.password.length > 0 && (
                    <MotiView
                      from={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ type: 'spring', damping: 15, stiffness: 100 }}
                      style={styles.passwordStrengthContainer}
                    >
                      <View style={styles.strengthBar}>
                        {[1, 2, 3, 4].map((level) => (
                          <View
                            key={level}
                            style={[
                              styles.strengthSegment,
                              {
                                backgroundColor: level <= passwordStrength.strength 
                                  ? passwordStrength.color 
                                  : '#ffffff30'
                              }
                            ]}
                          />
                        ))}
                      </View>
                      <Text style={[styles.strengthText, { color: passwordStrength.color }]}>
                        {passwordStrength.text}
                      </Text>
                    </MotiView>
                  )}
                  
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

                {/* Confirm Password Input */}
                <MotiView
                  from={{ opacity: 0, translateX: -50 }}
                  animate={{ opacity: 1, translateX: 0 }}
                  transition={{ type: 'spring', damping: 20, stiffness: 100, delay: 400 }}
                  style={styles.inputContainer}
                >
                  <TextInput
                    label="Confirm Password"
                    value={formData.confirmPassword}
                    onChangeText={(text) => updateFormData('confirmPassword', text)}
                    mode="outlined"
                    style={styles.input}
                    outlineColor={errors.confirmPassword ? '#ff6b6b' : '#ffffff80'}
                    activeOutlineColor="#ffffff"
                    textColor="#ffffff"
                    placeholderTextColor="#ffffff80"
                    secureTextEntry={!showConfirmPassword}
                    left={<TextInput.Icon icon="lock-check" color="#ffffff80" />}
                    right={
                      <TextInput.Icon 
                        icon={showConfirmPassword ? "eye-off" : "eye"} 
                        color="#ffffff80"
                        onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                      />
                    }
                  />
                  {errors.confirmPassword && (
                    <MotiView
                      from={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ type: 'spring', damping: 15, stiffness: 100 }}
                    >
                      <Text style={styles.errorText}>{errors.confirmPassword}</Text>
                    </MotiView>
                  )}
                </MotiView>

                {/* Role Selection */}
                <MotiView
                  from={{ opacity: 0, translateX: -50 }}
                  animate={{ opacity: 1, translateX: 0 }}
                  transition={{ type: 'spring', damping: 20, stiffness: 100, delay: 500 }}
                  style={styles.roleContainer}
                >
                  <Text style={styles.roleLabel}>I am a:</Text>
                  <View style={styles.roleOptions}>
                    <TouchableOpacity
                      style={[
                        styles.roleOption,
                        formData.role === 'mother' && styles.roleOptionSelected
                      ]}
                      onPress={() => updateFormData('role', 'mother')}
                    >
                      <MotiView
                        animate={{
                          scale: formData.role === 'mother' ? 1.05 : 1,
                          backgroundColor: formData.role === 'mother' ? '#ffffff' : '#ffffff20'
                        }}
                        transition={{ type: 'spring', damping: 15, stiffness: 100 }}
                        style={styles.roleOptionInner}
                      >
                        <Text style={[
                          styles.roleText,
                          formData.role === 'mother' && styles.roleTextSelected
                        ]}>
                          👩 Mother/Parent
                        </Text>
                      </MotiView>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.roleOption,
                        formData.role === 'child' && styles.roleOptionSelected
                      ]}
                      onPress={() => updateFormData('role', 'child')}
                    >
                      <MotiView
                        animate={{
                          scale: formData.role === 'child' ? 1.05 : 1,
                          backgroundColor: formData.role === 'child' ? '#ffffff' : '#ffffff20'
                        }}
                        transition={{ type: 'spring', damping: 15, stiffness: 100 }}
                        style={styles.roleOptionInner}
                      >
                        <Text style={[
                          styles.roleText,
                          formData.role === 'child' && styles.roleTextSelected
                        ]}>
                          👶 Child
                        </Text>
                      </MotiView>
                    </TouchableOpacity>
                  </View>
                  {errors.role && (
                    <MotiView
                      from={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ type: 'spring', damping: 15, stiffness: 100 }}
                    >
                      <Text style={styles.errorText}>{errors.role}</Text>
                    </MotiView>
                  )}
                </MotiView>

                {/* Sign Up Button */}
                <MotiView
                  from={{ opacity: 0, translateY: 50, scale: 0.8 }}
                  animate={{ opacity: 1, translateY: 0, scale: 1 }}
                  transition={{ type: 'spring', damping: 20, stiffness: 100, delay: 600 }}
                >
                  <TouchableOpacity
                    style={[styles.signupButton, loading && styles.signupButtonDisabled]}
                    onPress={handleSignup}
                    disabled={loading}
                  >
                    {loading ? (
                      <ActivityIndicator color="#667eea" size="small" />
                    ) : (
                      <Text style={styles.signupButtonText}>Create Account</Text>
                    )}
                  </TouchableOpacity>
                </MotiView>
              </MotiView>
            )}
          </AnimatePresence>

          {/* Footer Section */}
          <MotiView
            from={{ opacity: 0, translateY: 50 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 100, delay: 800 }}
            style={styles.footerSection}
          >
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Signin')}>
              <Text style={styles.signinLink}>Sign In</Text>
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
    marginBottom: 30,
  },
  inputContainer: {
    marginBottom: 20,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    fontSize: 16,
    borderRadius: 12,
  },
  passwordStrengthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 12,
  },
  strengthBar: {
    flexDirection: 'row',
    gap: 4,
    flex: 1,
  },
  strengthSegment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  strengthText: {
    fontSize: 12,
    fontWeight: '600',
    minWidth: 40,
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 12,
    marginTop: 6,
    marginLeft: 4,
    fontWeight: '500',
  },
  roleContainer: {
    marginBottom: 24,
  },
  roleLabel: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  roleOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  roleOption: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  roleOptionInner: {
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderRadius: 14,
  },
  roleText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
  roleTextSelected: {
    color: '#667eea',
  },
  signupButton: {
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
  signupButtonDisabled: {
    opacity: 0.7,
  },
  signupButtonText: {
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
  signinLink: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});

export default SignupScreen; 