import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, Image, TouchableOpacity, ScrollView } from 'react-native';
import { Button, Card, IconButton } from 'react-native-paper';
import { MotiView, AnimatePresence } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

export default function WelcomeScreen({ navigation }) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef(null);

  const slides = [
    {
      id: 1,
      title: 'Welcome to MummyHelp',
      subtitle: 'Your family\'s safety companion',
      description: 'Stay connected with your loved ones through intelligent voice commands and real-time location tracking.',
      icon: '👨‍👩‍👧‍👦',
      color: ['#667eea', '#764ba2'],
      gradient: ['#667eea', '#764ba2']
    },
    {
      id: 2,
      title: 'Voice-Activated Safety',
      subtitle: 'Just say "Hey MummyHelp"',
      description: 'Emergency alerts triggered by voice commands. Multiple wake phrases for reliable activation.',
      icon: '🎤',
      color: ['#f093fb', '#f5576c'],
      gradient: ['#f093fb', '#f5576c']
    },
    {
      id: 3,
      title: 'Real-Time Location',
      subtitle: 'Always know where they are',
      description: 'Live location tracking with address information. Background location sharing for peace of mind.',
      icon: '📍',
      color: ['#4facfe', '#00f2fe'],
      gradient: ['#4facfe', '#00f2fe']
    },
    {
      id: 4,
      title: 'Smart Notifications',
      subtitle: 'Instant alerts & updates',
      description: 'Push notifications for emergencies, check-ins, and location updates. Stay informed in real-time.',
      icon: '🔔',
      color: ['#43e97b', '#38f9d7'],
      gradient: ['#43e97b', '#38f9d7']
    }
  ];

  useEffect(() => {
    if (isAutoPlaying) {
      const timer = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % slides.length);
      }, 5000);

      return () => clearInterval(timer);
    }
  }, [isAutoPlaying, slides.length]);

  const handleSlideChange = (index) => {
    setCurrentSlide(index);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 3000);
  };

  const handleGetStarted = () => {
    navigation.navigate('Signup');
  };

  const handleSignIn = () => {
    navigation.navigate('Signin');
  };

  const handlePausePlay = () => {
    setIsAutoPlaying(!isAutoPlaying);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="light" />
      
      {/* Background Gradient */}
      <LinearGradient
        colors={slides[currentSlide].gradient}
        style={styles.backgroundGradient}
      />

      {/* Header */}
      <MotiView
        from={{ opacity: 0, translateY: -50 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 1000 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.appInfo}>
            <Text style={styles.appName}>MummyHelp</Text>
            <Text style={styles.appTagline}>Family Safety First</Text>
          </View>
          <IconButton
            icon={isAutoPlaying ? 'pause' : 'play'}
            iconColor="#fff"
            size={24}
            onPress={handlePausePlay}
            style={styles.playPauseButton}
          />
        </View>
      </MotiView>

      {/* Slides Container */}
      <View style={styles.slidesContainer}>
        <AnimatePresence>
          {slides.map((slide, index) => (
            currentSlide === index && (
              <MotiView
                key={slide.id}
                from={{ opacity: 0, scale: 0.8, translateX: 100 }}
                animate={{ opacity: 1, scale: 1, translateX: 0 }}
                exit={{ opacity: 0, scale: 0.8, translateX: -100 }}
                transition={{ 
                  type: 'spring',
                  damping: 20,
                  stiffness: 100,
                  duration: 800
                }}
                style={styles.slide}
              >
                <Card style={styles.slideCard}>
                  <Card.Content style={styles.slideContent}>
                    <MotiView
                      from={{ scale: 0, rotate: '0deg' }}
                      animate={{ scale: 1, rotate: '360deg' }}
                      transition={{ 
                        type: 'spring',
                        damping: 15,
                        stiffness: 100,
                        delay: 200
                      }}
                    >
                      <Text style={styles.slideIcon}>{slide.icon}</Text>
                    </MotiView>
                    
                    <MotiView
                      from={{ opacity: 0, translateY: 20 }}
                      animate={{ opacity: 1, translateY: 0 }}
                      transition={{ type: 'timing', duration: 600, delay: 400 }}
                    >
                      <Text style={styles.slideTitle}>{slide.title}</Text>
                    </MotiView>
                    
                    <MotiView
                      from={{ opacity: 0, translateY: 20 }}
                      animate={{ opacity: 1, translateY: 0 }}
                      transition={{ type: 'timing', duration: 600, delay: 600 }}
                    >
                      <Text style={styles.slideSubtitle}>{slide.subtitle}</Text>
                    </MotiView>
                    
                    <MotiView
                      from={{ opacity: 0, translateY: 20 }}
                      animate={{ opacity: 1, translateY: 0 }}
                      transition={{ type: 'timing', duration: 600, delay: 800 }}
                    >
                      <Text style={styles.slideDescription}>{slide.description}</Text>
                    </MotiView>
                  </Card.Content>
                </Card>
              </MotiView>
            )
          ))}
        </AnimatePresence>
      </View>

      {/* Pagination Dots */}
      <View style={styles.pagination}>
        {slides.map((_, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => handleSlideChange(index)}
            style={styles.dotContainer}
          >
            <MotiView
              animate={{
                scale: currentSlide === index ? 1.3 : 1,
                backgroundColor: currentSlide === index ? '#fff' : 'rgba(255,255,255,0.3)'
              }}
              transition={{ type: 'spring', damping: 15, stiffness: 100 }}
              style={[
                styles.dot,
                { backgroundColor: currentSlide === index ? '#fff' : 'rgba(255,255,255,0.3)' }
              ]}
            />
          </TouchableOpacity>
        ))}
      </View>

      {/* Action Buttons */}
      <View style={styles.actions}>
        <MotiView
          from={{ opacity: 0, translateY: 50, scale: 0.8 }}
          animate={{ opacity: 1, translateY: 0, scale: 1 }}
          transition={{ 
            type: 'spring',
            damping: 20,
            stiffness: 100,
            delay: 1000
          }}
        >
          <Button
            mode="contained"
            onPress={handleGetStarted}
            style={styles.getStartedButton}
            contentStyle={styles.buttonContent}
            labelStyle={styles.buttonLabel}
            buttonColor="#fff"
            textColor={slides[currentSlide].color[0]}
          >
            Get Started
          </Button>
        </MotiView>

        <MotiView
          from={{ opacity: 0, translateY: 50, scale: 0.8 }}
          animate={{ opacity: 1, translateY: 0, scale: 1 }}
          transition={{ 
            type: 'spring',
            damping: 20,
            stiffness: 100,
            delay: 1200
          }}
        >
          <Button
            mode="outlined"
            onPress={handleSignIn}
            style={styles.signInButton}
            contentStyle={styles.buttonContent}
            labelStyle={styles.buttonLabel}
            textColor="#fff"
            outlineColor="#fff"
          >
            Already have an account? Sign In
          </Button>
        </MotiView>
      </View>

      {/* Footer */}
      <MotiView
        from={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ type: 'timing', duration: 1000, delay: 1400 }}
        style={styles.footer}
      >
        <Text style={styles.footerText}>
          By continuing, you agree to our{' '}
          <Text style={styles.linkText} onPress={() => navigation.navigate('TermsOfService')}>
            Terms of Service
          </Text>
          {' '}and{' '}
          <Text style={styles.linkText} onPress={() => navigation.navigate('PrivacyPolicy')}>
            Privacy Policy
          </Text>
        </Text>
      </MotiView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  appInfo: {
    alignItems: 'flex-start',
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  appTagline: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
  },
  playPauseButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
  },
  slidesContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  slide: {
    width: '100%',
    alignItems: 'center',
  },
  slideCard: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 24,
    elevation: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.3,
    shadowRadius: 25,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  slideContent: {
    alignItems: 'center',
    padding: 32,
  },
  slideIcon: {
    fontSize: 72,
    marginBottom: 24,
  },
  slideTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2c3e50',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 34,
  },
  slideSubtitle: {
    fontSize: 20,
    color: '#7f8c8d',
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: '600',
    lineHeight: 26,
  },
  slideDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 26,
    paddingHorizontal: 10,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 24,
  },
  dotContainer: {
    padding: 8,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginHorizontal: 4,
  },
  actions: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    gap: 16,
  },
  getStartedButton: {
    borderRadius: 16,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  signInButton: {
    borderRadius: 16,
    borderWidth: 2,
  },
  buttonContent: {
    paddingVertical: 14,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  footerText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    lineHeight: 20,
  },
  linkText: {
    textDecorationLine: 'underline',
    fontWeight: '600',
  },
});
