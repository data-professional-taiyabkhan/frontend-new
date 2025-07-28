import React, { useState } from 'react';
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
} from 'react-native-paper';
import { authAPI, storage } from '../services/api';

const { width, height } = Dimensions.get('window');

const SignupScreen = ({ navigation }) => {
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
        // Save auth data
        await storage.saveAuthData(response.data.token, response.data.user);
        
        Alert.alert(
          'Welcome to MummyHelp! 🎉',
          `Account created successfully for ${response.data.user.name}!`,
          [
            {
              text: 'Continue',
              onPress: () => {
                // Navigate to appropriate screen based on role
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

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Header Section */}
          <View style={styles.headerSection}>
            <Text style={styles.logo}>MummyHelp</Text>
            <Text style={styles.tagline}>Emergency Alert System</Text>
            <Text style={styles.welcomeText}>Create Account</Text>
            <Text style={styles.subtitle}>Join our safety network</Text>
          </View>

          {/* Form Section */}
          <View style={styles.formSection}>
            {/* Name Input */}
            <View style={styles.inputContainer}>
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
                <Text style={styles.errorText}>{errors.name}</Text>
              )}
            </View>

            {/* Email Input */}
            <View style={styles.inputContainer}>
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
                <Text style={styles.errorText}>{errors.email}</Text>
              )}
            </View>

            {/* Password Input */}
            <View style={styles.inputContainer}>
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
                <Text style={styles.errorText}>{errors.password}</Text>
              )}
            </View>

            {/* Confirm Password Input */}
            <View style={styles.inputContainer}>
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
                <Text style={styles.errorText}>{errors.confirmPassword}</Text>
              )}
            </View>

            {/* Role Selection */}
            <View style={styles.roleContainer}>
              <Text style={styles.roleLabel}>I am a:</Text>
              <View style={styles.roleOptions}>
                <TouchableOpacity
                  style={[
                    styles.roleOption,
                    formData.role === 'mother' && styles.roleOptionSelected
                  ]}
                  onPress={() => updateFormData('role', 'mother')}
                >
                  <Text style={[
                    styles.roleText,
                    formData.role === 'mother' && styles.roleTextSelected
                  ]}>
                    👩 Mother/Parent
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.roleOption,
                    formData.role === 'child' && styles.roleOptionSelected
                  ]}
                  onPress={() => updateFormData('role', 'child')}
                >
                  <Text style={[
                    styles.roleText,
                    formData.role === 'child' && styles.roleTextSelected
                  ]}>
                    👶 Child
                  </Text>
                </TouchableOpacity>
              </View>
              {errors.role && (
                <Text style={styles.errorText}>{errors.role}</Text>
              )}
            </View>

            {/* Sign Up Button */}
            <TouchableOpacity
              style={[styles.signupButton, loading && styles.signupButtonDisabled]}
              onPress={handleSignup}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <Text style={styles.signupButtonText}>Create Account</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Footer Section */}
          <View style={styles.footerSection}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Signin')}>
              <Text style={styles.signinLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
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
  keyboardView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: height * 0.05,
    paddingBottom: 40,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logo: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    color: '#ffffff80',
    marginBottom: 20,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#ffffff80',
  },
  formSection: {
    marginBottom: 30,
  },
  inputContainer: {
    marginBottom: 16,
  },
  input: {
    backgroundColor: 'transparent',
    fontSize: 16,
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  roleContainer: {
    marginBottom: 20,
  },
  roleLabel: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 12,
  },
  roleOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  roleOption: {
    flex: 1,
    backgroundColor: '#ffffff20',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginHorizontal: 4,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  roleOptionSelected: {
    backgroundColor: '#ffffff',
    borderColor: '#ffffff',
  },
  roleText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
  roleTextSelected: {
    color: '#667eea',
  },
  signupButton: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  signupButtonDisabled: {
    opacity: 0.7,
  },
  signupButtonText: {
    color: '#667eea',
    fontSize: 18,
    fontWeight: '600',
  },
  footerSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 'auto',
  },
  footerText: {
    color: '#ffffff80',
    fontSize: 14,
  },
  signinLink: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});

export default SignupScreen; 