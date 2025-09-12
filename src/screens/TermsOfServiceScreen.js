import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Card } from 'react-native-paper';
import { MotiView } from 'moti';

export default function TermsOfServiceScreen({ navigation }) {
  const termsSections = [
    {
      title: 'Acceptance of Terms',
      content: [
        'By downloading, installing, or using the MummyHelp application, you agree to be bound by these Terms of Service.',
        'If you do not agree to these terms, do not use the application.',
        'These terms apply to all users of the application, including parents and children.',
        'We reserve the right to modify these terms at any time, with notice to users.',
        'Continued use of the app after changes constitutes acceptance of the new terms.'
      ]
    },
    {
      title: 'Description of Service',
      content: [
        'MummyHelp is a family safety application that provides location tracking, voice-activated emergency alerts, and communication features.',
        'The app uses GPS and network location services to track family member locations.',
        'Voice recognition technology enables hands-free emergency activation and commands.',
        'Push notifications provide real-time updates and emergency alerts.',
        'The service is designed for family safety and should not be used for surveillance or unauthorized tracking.'
      ]
    },
    {
      title: 'User Accounts and Registration',
      content: [
        'You must be at least 13 years old to create an account.',
        'Users under 18 require parental consent and supervision.',
        'You are responsible for maintaining the security of your account credentials.',
        'Provide accurate and complete information during registration.',
        'Notify us immediately of any unauthorized use of your account.'
      ]
    },
    {
      title: 'Acceptable Use',
      content: [
        'Use the app only for its intended purpose of family safety.',
        'Do not use the app to harass, stalk, or harm others.',
        'Respect the privacy and consent of family members.',
        'Do not attempt to circumvent security measures or access unauthorized areas.',
        'Report any abuse or misuse of the service to our support team.'
      ]
    },
    {
      title: 'Privacy and Data Protection',
      content: [
        'We collect and process personal data as described in our Privacy Policy.',
        'Location data is collected only with user consent and for safety purposes.',
        'Voice recordings are processed locally and not stored without permission.',
        'We implement appropriate security measures to protect your data.',
        'You control what information is shared and with whom.'
      ]
    },
    {
      title: 'Location Services',
      content: [
        'Location tracking requires explicit user consent and device permissions.',
        'Location data is shared only with authorized family members.',
        'Users can disable location sharing at any time.',
        'Background location access is required for continuous safety monitoring.',
        'Location accuracy depends on device capabilities and environmental factors.'
      ]
    },
    {
      title: 'Emergency Services',
      content: [
        'The app provides emergency alert capabilities but is not a replacement for emergency services.',
        'In life-threatening situations, contact emergency services directly (911 in the US).',
        'Emergency alerts are sent to designated contacts, not emergency services.',
        'Response time depends on network conditions and recipient availability.',
        'We are not responsible for delays or failures in emergency communications.'
      ]
    },
    {
      title: 'Voice Recognition Features',
      content: [
        'Voice commands require microphone permissions and clear audio input.',
        'Voice recognition accuracy may vary based on environment and speech clarity.',
        'Voice data is processed locally when possible to protect privacy.',
        'Users can disable voice features at any time.',
        'We are not responsible for voice recognition failures or misinterpretations.'
      ]
    },
    {
      title: 'Limitations of Liability',
      content: [
        'The app is provided "as is" without warranties of any kind.',
        'We are not liable for any damages arising from use of the service.',
        'We do not guarantee uninterrupted service or error-free operation.',
        'Location accuracy and emergency response times are not guaranteed.',
        'Users assume all risks associated with relying on the app for safety.'
      ]
    },
    {
      title: 'Intellectual Property',
      content: [
        'The app and its content are protected by copyright and other intellectual property laws.',
        'You may not copy, modify, or distribute the app without permission.',
        'User-generated content remains the property of the user.',
        'We retain rights to improve and modify the service.',
        'Third-party components are used under their respective licenses.'
      ]
    },
    {
      title: 'Termination',
      content: [
        'We may terminate or suspend accounts for violations of these terms.',
        'Users may delete their accounts at any time.',
        'Upon termination, access to the service will be immediately revoked.',
        'Data deletion requests will be processed within 30 days.',
        'Some information may be retained for legal or security purposes.'
      ]
    },
    {
      title: 'Governing Law',
      content: [
        'These terms are governed by the laws of the jurisdiction where MummyHelp operates.',
        'Disputes will be resolved through binding arbitration when possible.',
        'Class action lawsuits are waived by using the service.',
        'Users agree to jurisdiction in the specified legal venue.',
        'Local laws may provide additional consumer protections.'
      ]
    }
  ];

  const renderSection = (section, index) => (
    <MotiView
      key={index}
      from={{ opacity: 0, translateY: 30 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 600, delay: index * 100 }}
    >
      <Card style={styles.sectionCard}>
        <Card.Content>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          {section.content.map((item, itemIndex) => (
            <View key={itemIndex} style={styles.bulletPoint}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.bulletText}>{item}</Text>
            </View>
          ))}
        </Card.Content>
      </Card>
    </MotiView>
  );

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <MotiView
          from={{ opacity: 0, translateY: -30 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 800 }}
        >
          <Card style={styles.headerCard}>
            <Card.Content>
              <Text style={styles.mainTitle}>Terms of Service</Text>
              <Text style={styles.subtitle}>
                Last updated: {new Date().toLocaleDateString()}
              </Text>
              <Text style={styles.description}>
                Please read these Terms of Service carefully before using the MummyHelp application. These terms govern your use of our service and outline your rights and responsibilities.
              </Text>
            </Card.Content>
          </Card>
        </MotiView>

        {/* Terms Sections */}
        {termsSections.map((section, index) => renderSection(section, index))}

        {/* Contact Information */}
        <MotiView
          from={{ opacity: 0, translateY: 30 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 600, delay: 1200 }}
        >
          <Card style={styles.contactCard}>
            <Card.Content>
              <Text style={styles.contactTitle}>Questions About These Terms?</Text>
              <Text style={styles.contactText}>
                If you have any questions about these Terms of Service, please contact us:
              </Text>
              <Text style={styles.contactEmail}>Email: legal@mummyhelp.com</Text>
              <Text style={styles.contactPhone}>Phone: +1-800-MUMMY-HELP</Text>
              <Text style={styles.contactAddress}>
                Address: 123 Safety Street, Security City, SC 12345
              </Text>
            </Card.Content>
          </Card>
        </MotiView>

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
  scrollView: {
    flex: 1,
  },
  headerCard: {
    margin: 16,
    elevation: 4,
    borderRadius: 16,
    backgroundColor: '#e74c3c',
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    lineHeight: 24,
  },
  sectionCard: {
    margin: 16,
    elevation: 2,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 16,
  },
  bulletPoint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  bullet: {
    fontSize: 16,
    color: '#e74c3c',
    marginRight: 12,
    marginTop: 2,
  },
  bulletText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
    lineHeight: 20,
  },
  contactCard: {
    margin: 16,
    elevation: 4,
    borderRadius: 16,
    backgroundColor: '#e74c3c',
  },
  contactTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
    textAlign: 'center',
  },
  contactText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  contactEmail: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
    fontWeight: '600',
  },
  contactPhone: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
    fontWeight: '600',
  },
  contactAddress: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    fontWeight: '600',
  },
  bottomSpacing: {
    height: 20,
  },
});
