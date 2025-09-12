import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Card } from 'react-native-paper';
import { MotiView } from 'moti';

export default function PrivacyPolicyScreen({ navigation }) {
  const privacySections = [
    {
      title: 'Information We Collect',
      content: [
        'Personal Information: Name, email address, phone number, and emergency contact details.',
        'Location Data: GPS coordinates and address information for safety and tracking purposes.',
        'Voice Data: Audio recordings and voice commands for voice-activated features.',
        'Device Information: Device type, operating system, and app usage statistics.',
        'Usage Data: How you interact with the app, features used, and settings preferences.'
      ]
    },
    {
      title: 'How We Use Your Information',
      content: [
        'Provide core safety features like location tracking and emergency alerts.',
        'Enable voice-activated commands and wake phrase detection.',
        'Send push notifications for emergencies, check-ins, and updates.',
        'Improve app functionality and user experience.',
        'Ensure app security and prevent fraud or abuse.'
      ]
    },
    {
      title: 'Information Sharing',
      content: [
        'Family Members: Location and status information is shared with family members based on your settings.',
        'Emergency Services: Critical information may be shared with emergency services when required.',
        'Service Providers: We work with trusted third-party services for app functionality.',
        'Legal Requirements: Information may be disclosed if required by law or to protect rights.',
        'Never Sold: We never sell, rent, or trade your personal information to third parties.'
      ]
    },
    {
      title: 'Data Security',
      content: [
        'Encryption: All data is encrypted in transit and at rest using industry-standard protocols.',
        'Access Control: Limited access to personal information on a need-to-know basis.',
        'Regular Audits: We conduct regular security assessments and updates.',
        'Secure Storage: Data is stored in secure, certified cloud environments.',
        'User Control: You control what information is shared and with whom.'
      ]
    },
    {
      title: 'Your Rights',
      content: [
        'Access: View and download your personal information.',
        'Correction: Update or correct inaccurate information.',
        'Deletion: Request deletion of your account and associated data.',
        'Portability: Export your data in a machine-readable format.',
        'Opt-out: Disable specific features or data collection methods.'
      ]
    },
    {
      title: 'Data Retention',
      content: [
        'Active Use: Data is retained while your account is active.',
        'Deletion: Data is permanently deleted within 30 days of account deletion.',
        'Backup: Backup copies may be retained for up to 90 days for security purposes.',
        'Legal Requirements: Some data may be retained longer if required by law.',
        'Anonymization: Historical data may be anonymized for research purposes.'
      ]
    },
    {
      title: 'Children\'s Privacy',
      content: [
        'Age Requirement: Users must be 13 or older to create an account.',
        'Parental Consent: For users under 18, parental consent may be required.',
        'Limited Collection: We collect only necessary information for safety features.',
        'Parental Control: Parents can monitor and control their child\'s account.',
        'Educational Content: We provide resources for safe app usage.'
      ]
    },
    {
      title: 'International Transfers',
      content: [
        'Global Service: Our app is available worldwide.',
        'Data Centers: Data may be processed in different countries.',
        'Adequacy Decisions: We ensure adequate protection for international transfers.',
        'Standard Contracts: We use standard contractual clauses for data protection.',
        'Local Laws: We comply with local data protection laws.'
      ]
    },
    {
      title: 'Updates to This Policy',
      content: [
        'Notification: We will notify you of significant changes to this policy.',
        'Review: Please review this policy periodically for updates.',
        'Consent: Continued use of the app constitutes acceptance of changes.',
        'Version History: Previous versions are available upon request.',
        'Contact: Questions about changes should be directed to our support team.'
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
              <Text style={styles.mainTitle}>Privacy Policy</Text>
              <Text style={styles.subtitle}>
                Last updated: {new Date().toLocaleDateString()}
              </Text>
              <Text style={styles.description}>
                At MummyHelp, we are committed to protecting your privacy and ensuring the security of your personal information. This policy explains how we collect, use, and protect your data.
              </Text>
            </Card.Content>
          </Card>
        </MotiView>

        {/* Privacy Sections */}
        {privacySections.map((section, index) => renderSection(section, index))}

        {/* Contact Information */}
        <MotiView
          from={{ opacity: 0, translateY: 30 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 600, delay: 1000 }}
        >
          <Card style={styles.contactCard}>
            <Card.Content>
              <Text style={styles.contactTitle}>Contact Us</Text>
              <Text style={styles.contactText}>
                If you have any questions about this Privacy Policy or our data practices, please contact us:
              </Text>
              <Text style={styles.contactEmail}>Email: privacy@mummyhelp.com</Text>
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
    backgroundColor: '#2c3e50',
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
    color: '#3498db',
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
    backgroundColor: '#3498db',
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
