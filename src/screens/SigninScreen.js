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
} from 'react-native-paper';
import { authAPI, storage } from '../services/api';

const { width, height } = Dimensions.get('window');

const SigninScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

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
        // Save auth data
        await storage.saveAuthData(response.data.token, response.data.user);
        
        Alert.alert(
          'Welcome Back! 🎉',
          `Hello, ${response.data.user.name}!`,
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
            <Text style={styles.welcomeText}>Welcome Back!</Text>
            <Text style={styles.subtitle}>Sign in to your account</Text>
          </View>

          {/* Form Section */}
          <View style={styles.formSection}>
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

            {/* Sign In Button */}
            <TouchableOpacity
              style={[styles.signinButton, loading && styles.signinButtonDisabled]}
              onPress={handleSignin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <Text style={styles.signinButtonText}>Sign In</Text>
              )}
            </TouchableOpacity>

            {/* Forgot Password Link */}
            <TouchableOpacity style={styles.forgotPasswordContainer}>
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>
          </View>

          {/* Footer Section */}
          <View style={styles.footerSection}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
              <Text style={styles.signupLink}>Sign Up</Text>
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
    paddingTop: height * 0.1,
    paddingBottom: 40,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 40,
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
    marginBottom: 24,
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
    marginBottom: 40,
  },
  inputContainer: {
    marginBottom: 20,
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
  signinButton: {
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
  signinButtonDisabled: {
    opacity: 0.7,
  },
  signinButtonText: {
    color: '#667eea',
    fontSize: 18,
    fontWeight: '600',
  },
  forgotPasswordContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  forgotPasswordText: {
    color: '#ffffff',
    fontSize: 14,
    textDecorationLine: 'underline',
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
  signupLink: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});

export default SigninScreen; 