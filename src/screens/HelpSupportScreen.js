import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Linking } from 'react-native';
import { Card, Button, List, Divider } from 'react-native-paper';
import { MotiView } from 'moti';

export default function HelpSupportScreen({ navigation }) {
  const [expandedId, setExpandedId] = useState(null);

  const faqs = [
    {
      id: '1',
      title: 'How do I set up voice commands?',
      content: 'To set up voice commands, go to Voice Settings in your profile. You can customize wake phrases, adjust sensitivity, and test voice recognition. Make sure to grant microphone permissions when prompted.',
      icon: '🎤'
    },
    {
      id: '2',
      title: 'How does location tracking work?',
      content: 'Location tracking uses GPS and network location to provide real-time updates. The app shares your location with family members based on your privacy settings. You can control when and how often location is shared.',
      icon: '📍'
    },
    {
      id: '3',
      title: 'What are emergency alerts?',
      content: 'Emergency alerts are triggered when you say wake phrases multiple times quickly or manually trigger them. They send immediate notifications to your emergency contacts with your current location.',
      icon: '🚨'
    },
    {
      id: '4',
      title: 'How do I add emergency contacts?',
      content: 'Go to Profile > Emergency Contacts and tap the + button. Enter the contact name and phone number. You can add multiple emergency contacts for better coverage.',
      icon: '📞'
    },
    {
      id: '5',
      title: 'Can I use the app without internet?',
      content: 'Basic location tracking works offline, but features like push notifications and real-time updates require an internet connection. The app will sync data when connection is restored.',
      icon: '🌐'
    },
    {
      id: '6',
      title: 'How do I change my role from child to parent?',
      content: 'Contact our support team to change your account role. This requires verification to ensure account security and proper family setup.',
      icon: '👥'
    }
  ];

  const troubleshooting = [
    {
      title: 'Voice commands not working',
      solutions: [
        'Check microphone permissions in device settings',
        'Ensure voice recognition is enabled in app settings',
        'Try speaking clearly and in a quiet environment',
        'Restart the app and try again'
      ]
    },
    {
      title: 'Location not updating',
      solutions: [
        'Verify location permissions are granted',
        'Check if location services are enabled on device',
        'Ensure the app has background location access',
        'Try refreshing the location manually'
      ]
    },
    {
      title: 'Push notifications not received',
      solutions: [
        'Check notification permissions in device settings',
        'Verify notification settings in the app',
        ' Ensure the app is not battery optimized',
        'Check if Do Not Disturb mode is enabled'
      ]
    },
    {
      title: 'App crashes or freezes',
      solutions: [
        'Close and restart the app',
        'Clear app cache and data',
        'Update to the latest version',
        'Restart your device if problems persist'
      ]
    }
  ];

  const contactMethods = [
    {
      title: 'Email Support',
      description: 'Get help via email',
      icon: '✉️',
      action: () => Linking.openURL('mailto:support@mummyhelp.com')
    },
    {
      title: 'Live Chat',
      description: 'Chat with our support team',
      icon: '💬',
      action: () => navigation.navigate('LiveChat')
    },
    {
      title: 'Phone Support',
      description: 'Call us directly',
      icon: '📞',
      action: () => Linking.openURL('tel:+1-800-MUMMY-HELP')
    },
    {
      title: 'In-App Support',
      description: 'Submit a support ticket',
      icon: '🎫',
      action: () => navigation.navigate('SupportTicket')
    }
  ];

  const handleAccordionPress = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const renderFAQSection = () => (
    <MotiView
      from={{ opacity: 0, translateY: 30 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 800 }}
    >
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
          
          {faqs.map((faq) => (
            <List.Accordion
              key={faq.id}
              title={faq.title}
              description={expandedId === faq.id ? faq.content : null}
              expanded={expandedId === faq.id}
              onPress={() => handleAccordionPress(faq.id)}
              style={styles.faqItem}
              titleStyle={styles.faqTitleStyle}
              descriptionStyle={styles.faqDescriptionStyle}
              left={(props) => <Text style={styles.faqIcon}>{faq.icon}</Text>}
            >
              <View style={styles.faqContent}>
                <Text style={styles.faqContentText}>{faq.content}</Text>
              </View>
            </List.Accordion>
          ))}
        </Card.Content>
      </Card>
    </MotiView>
  );

  const renderTroubleshootingSection = () => (
    <MotiView
      from={{ opacity: 0, translateY: 30 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 800, delay: 200 }}
    >
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Troubleshooting Guide</Text>
          
          {troubleshooting.map((item, index) => (
            <View key={index}>
              <List.Item
                title={item.title}
                left={(props) => <List.Icon {...props} icon="wrench" />}
                titleStyle={styles.troubleshootingTitle}
              />
              <View style={styles.solutionsList}>
                {item.solutions.map((solution, solutionIndex) => (
                  <View key={solutionIndex} style={styles.solutionItem}>
                    <Text style={styles.solutionBullet}>•</Text>
                    <Text style={styles.solutionText}>{solution}</Text>
                  </View>
                ))}
              </View>
              {index < troubleshooting.length - 1 && <Divider style={styles.divider} />}
            </View>
          ))}
        </Card.Content>
      </Card>
    </MotiView>
  );

  const renderContactSection = () => (
    <MotiView
      from={{ opacity: 0, translateY: 30 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 800, delay: 400 }}
    >
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Get Help</Text>
          
          {contactMethods.map((method, index) => (
            <List.Item
              key={index}
              title={method.title}
              description={method.description}
              left={(props) => <Text style={styles.contactIcon}>{method.icon}</Text>}
              onPress={method.action}
              style={styles.contactItem}
              titleStyle={styles.contactTitle}
              descriptionStyle={styles.contactDescription}
            />
          ))}
        </Card.Content>
      </Card>
    </MotiView>
  );

  const renderQuickActions = () => (
    <MotiView
      from={{ opacity: 0, translateY: 30 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 800, delay: 600 }}
    >
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          
          <View style={styles.quickActionsGrid}>
            <Button
              mode="outlined"
              onPress={() => navigation.navigate('VoiceSettings')}
              icon="cog"
              style={styles.quickActionButton}
              contentStyle={styles.quickActionContent}
            >
              Voice Settings
            </Button>
            
            <Button
              mode="outlined"
              onPress={() => navigation.navigate('Profile')}
              icon="account"
              style={styles.quickActionButton}
              contentStyle={styles.quickActionContent}
            >
              Profile
            </Button>
            
            <Button
              mode="outlined"
              onPress={() => navigation.navigate('MapScreen')}
              icon="map"
              style={styles.quickActionButton}
              contentStyle={styles.quickActionContent}
            >
              Map View
            </Button>
            
            <Button
              mode="outlined"
              onPress={() => navigation.navigate('Notifications')}
              icon="bell"
              style={styles.quickActionButton}
              contentStyle={styles.quickActionContent}
            >
              Notifications
            </Button>
          </View>
        </Card.Content>
      </Card>
    </MotiView>
  );

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {renderFAQSection()}
        {renderTroubleshootingSection()}
        {renderContactSection()}
        {renderQuickActions()}
        
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
  card: {
    margin: 16,
    elevation: 4,
    borderRadius: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 20,
  },
  faqItem: {
    marginBottom: 8,
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  faqIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  faqTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    flex: 1,
  },
  faqTitleStyle: {
    paddingVertical: 8,
  },
  faqDescriptionStyle: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    lineHeight: 22,
    color: '#666',
  },
  faqContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  faqContentText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#666',
  },
  troubleshootingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
  },
  solutionsList: {
    paddingLeft: 16,
    paddingBottom: 16,
  },
  solutionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  solutionBullet: {
    fontSize: 16,
    color: '#3498db',
    marginRight: 8,
    marginTop: 2,
  },
  solutionText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
    lineHeight: 20,
  },
  divider: {
    marginVertical: 16,
  },
  contactItem: {
    paddingVertical: 8,
  },
  contactIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
  },
  contactDescription: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickActionButton: {
    flex: 1,
    minWidth: '45%',
    borderRadius: 8,
  },
  quickActionContent: {
    paddingVertical: 8,
  },
  bottomSpacing: {
    height: 20,
  },
});
