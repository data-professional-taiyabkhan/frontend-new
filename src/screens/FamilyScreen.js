import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { Button, Card, IconButton, Avatar, FAB, Chip } from 'react-native-paper';
import { MotiView, AnimatePresence } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

const FamilyScreen = ({ navigation }) => {
  const [familyMembers, setFamilyMembers] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newMember, setNewMember] = useState({
    name: '',
    relationship: '',
    phone: '',
    email: '',
    isEmergencyContact: false,
  });
  const [loading, setLoading] = useState(false);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    loadFamilyMembers();
  }, []);

  const loadFamilyMembers = async () => {
    try {
      const savedMembers = await AsyncStorage.getItem('familyMembers');
      if (savedMembers) {
        setFamilyMembers(JSON.parse(savedMembers));
      } else {
        // Add default family members
        const defaultMembers = [
          {
            id: '1',
            name: 'Mom',
            relationship: 'Mother',
            phone: '+1234567890',
            email: 'mom@family.com',
            isEmergencyContact: true,
            avatar: '👩‍👧‍👦',
            status: 'online',
            lastSeen: '2 minutes ago',
          },
          {
            id: '2',
            name: 'Dad',
            relationship: 'Father',
            phone: '+1234567891',
            email: 'dad@family.com',
            isEmergencyContact: true,
            avatar: '👨‍👧‍👦',
            status: 'online',
            lastSeen: '5 minutes ago',
          },
        ];
        setFamilyMembers(defaultMembers);
        await AsyncStorage.setItem('familyMembers', JSON.stringify(defaultMembers));
      }
    } catch (error) {
      console.error('Error loading family members:', error);
    }
  };

  const saveFamilyMembers = async (members) => {
    try {
      await AsyncStorage.setItem('familyMembers', JSON.stringify(members));
      setFamilyMembers(members);
    } catch (error) {
      console.error('Error saving family members:', error);
    }
  };

  const addFamilyMember = async () => {
    if (!newMember.name || !newMember.relationship) {
      Alert.alert('Error', 'Name and relationship are required.');
      return;
    }

    try {
      setLoading(true);
      
      const member = {
        id: Date.now().toString(),
        ...newMember,
        avatar: getRandomAvatar(),
        status: 'online',
        lastSeen: 'Just now',
      };

      const updatedMembers = [...familyMembers, member];
      await saveFamilyMembers(updatedMembers);
      
      setNewMember({
        name: '',
        relationship: '',
        phone: '',
        email: '',
        isEmergencyContact: false,
      });
      setShowAddModal(false);
      
      Alert.alert('Success', `${member.name} has been added to your family!`);
    } catch (error) {
      console.error('Error adding family member:', error);
      Alert.alert('Error', 'Failed to add family member. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const removeFamilyMember = (memberId) => {
    Alert.alert(
      'Remove Family Member',
      'Are you sure you want to remove this family member?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            const updatedMembers = familyMembers.filter(member => member.id !== memberId);
            await saveFamilyMembers(updatedMembers);
          },
        },
      ]
    );
  };

  const toggleEmergencyContact = async (memberId) => {
    const updatedMembers = familyMembers.map(member => {
      if (member.id === memberId) {
        return { ...member, isEmergencyContact: !member.isEmergencyContact };
      }
      return member;
    });
    await saveFamilyMembers(updatedMembers);
  };

  const getRandomAvatar = () => {
    const avatars = ['👨‍👧‍👦', '👩‍👧‍👦', '👨‍👦', '👩‍👦', '👨‍👧', '👩‍👧', '👴', '👵', '👨', '👩'];
    return avatars[Math.floor(Math.random() * avatars.length)];
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'online': return '#4caf50';
      case 'away': return '#ff9800';
      case 'offline': return '#9e9e9e';
      default: return '#667eea';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'online': return 'Online';
      case 'away': return 'Away';
      case 'offline': return 'Offline';
      default: return 'Unknown';
    }
  };

  const FamilyMemberCard = ({ member, index }) => (
    <MotiView
      from={{ opacity: 0, translateX: -50 }}
      animate={{ opacity: 1, translateX: 0 }}
      transition={{ type: 'spring', damping: 20, stiffness: 100, delay: index * 100 }}
    >
      <Card style={styles.memberCard}>
        <Card.Content>
          <View style={styles.memberHeader}>
            <View style={styles.memberAvatar}>
              <Text style={styles.avatarText}>{member.avatar}</Text>
            </View>
            <View style={styles.memberInfo}>
              <Text style={styles.memberName}>{member.name}</Text>
              <Text style={styles.memberRelationship}>{member.relationship}</Text>
              <View style={styles.memberStatus}>
                <View style={[styles.statusDot, { backgroundColor: getStatusColor(member.status) }]} />
                <Text style={styles.statusText}>{getStatusText(member.status)}</Text>
                <Text style={styles.lastSeen}> • {member.lastSeen}</Text>
              </View>
            </View>
            <View style={styles.memberActions}>
              <TouchableOpacity
                style={[
                  styles.emergencyToggle,
                  member.isEmergencyContact && styles.emergencyActive
                ]}
                onPress={() => toggleEmergencyContact(member.id)}
              >
                <Text style={styles.emergencyIcon}>🚨</Text>
              </TouchableOpacity>
              <IconButton
                icon="dots-vertical"
                iconColor="#667eea"
                size={20}
                onPress={() => {
                  Alert.alert(
                    'Family Member Options',
                    `What would you like to do with ${member.name}?`,
                    [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Call', onPress: () => console.log('Call', member.phone) },
                      { text: 'Message', onPress: () => console.log('Message', member.name) },
                      { text: 'View Profile', onPress: () => console.log('View Profile', member.name) },
                      { text: 'Remove', style: 'destructive', onPress: () => removeFamilyMember(member.id) },
                    ]
                  );
                }}
              />
            </View>
          </View>
          
          <View style={styles.memberDetails}>
            {member.phone && (
              <TouchableOpacity style={styles.contactItem}>
                <Text style={styles.contactIcon}>📞</Text>
                <Text style={styles.contactText}>{member.phone}</Text>
              </TouchableOpacity>
            )}
            {member.email && (
              <TouchableOpacity style={styles.contactItem}>
                <Text style={styles.contactIcon}>📧</Text>
                <Text style={styles.contactText}>{member.email}</Text>
              </TouchableOpacity>
            )}
          </View>

          {member.isEmergencyContact && (
            <View style={styles.emergencyBadge}>
              <Text style={styles.emergencyBadgeText}>🚨 Emergency Contact</Text>
            </View>
          )}
        </Card.Content>
      </Card>
    </MotiView>
  );

  const AddMemberModal = () => (
    <Modal
      visible={showAddModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowAddModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <MotiView
            from={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', damping: 20, stiffness: 100 }}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Family Member</Text>
              <TouchableOpacity
                onPress={() => setShowAddModal(false)}
                style={styles.closeButton}
              >
                <IconButton icon="close" iconColor="#667eea" size={24} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <TextInput
                mode="outlined"
                label="Name"
                value={newMember.name}
                onChangeText={(text) => setNewMember({ ...newMember, name: text })}
                style={styles.input}
                outlineColor="#e0e0e0"
                activeOutlineColor="#667eea"
              />

              <TextInput
                mode="outlined"
                label="Relationship"
                value={newMember.relationship}
                onChangeText={(text) => setNewMember({ ...newMember, relationship: text })}
                style={styles.input}
                outlineColor="#e0e0e0"
                activeOutlineColor="#667eea"
              />

              <TextInput
                mode="outlined"
                label="Phone (Optional)"
                value={newMember.phone}
                onChangeText={(text) => setNewMember({ ...newMember, phone: text })}
                style={styles.input}
                outlineColor="#e0e0e0"
                activeOutlineColor="#667eea"
                keyboardType="phone-pad"
              />

              <TextInput
                mode="outlined"
                label="Email (Optional)"
                value={newMember.email}
                onChangeText={(text) => setNewMember({ ...newMember, email: text })}
                style={styles.input}
                outlineColor="#e0e0e0"
                activeOutlineColor="#667eea"
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <TouchableOpacity
                style={[
                  styles.emergencyToggle,
                  newMember.isEmergencyContact && styles.emergencyActive
                ]}
                onPress={() => setNewMember({ ...newMember, isEmergencyContact: !newMember.isEmergencyContact })}
              >
                <Text style={styles.emergencyIcon}>🚨</Text>
                <Text style={styles.emergencyLabel}>
                  {newMember.isEmergencyContact ? 'Emergency Contact' : 'Mark as Emergency Contact'}
                </Text>
              </TouchableOpacity>
            </ScrollView>

            <View style={styles.modalFooter}>
              <Button
                mode="outlined"
                onPress={() => setShowAddModal(false)}
                style={styles.modalButton}
                textColor="#667eea"
              >
                Cancel
              </Button>
              <Button
                mode="contained"
                onPress={addFamilyMember}
                loading={loading}
                disabled={loading}
                style={[styles.modalButton, styles.addButton]}
                buttonColor="#667eea"
              >
                Add Member
              </Button>
            </View>
          </MotiView>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="light" />
      
      {/* Background Gradient */}
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.backgroundGradient}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <IconButton
            icon="arrow-left"
            iconColor="#ffffff"
            size={24}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Family</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Family Summary */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'spring', damping: 20, stiffness: 100 }}
          style={styles.summarySection}
        >
          <Card style={styles.summaryCard}>
            <Card.Content>
              <View style={styles.summaryHeader}>
                <Text style={styles.summaryTitle}>Family Overview</Text>
                <Text style={styles.summarySubtitle}>
                  {familyMembers.length} family member{familyMembers.length !== 1 ? 's' : ''}
                </Text>
              </View>
              
              <View style={styles.summaryStats}>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>
                    {familyMembers.filter(m => m.status === 'online').length}
                  </Text>
                  <Text style={styles.statLabel}>Online</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>
                    {familyMembers.filter(m => m.isEmergencyContact).length}
                  </Text>
                  <Text style={styles.statLabel}>Emergency Contacts</Text>
                </View>
              </View>
            </Card.Content>
          </Card>
        </MotiView>

        {/* Family Members List */}
        <View style={styles.membersSection}>
          <Text style={styles.sectionTitle}>Family Members</Text>
          {familyMembers.map((member, index) => (
            <FamilyMemberCard key={member.id} member={member} index={index} />
          ))}
          
          {familyMembers.length === 0 && (
            <MotiView
              from={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', damping: 20, stiffness: 100 }}
              style={styles.emptyState}
            >
              <Text style={styles.emptyIcon}>👨‍👩‍👧‍👦</Text>
              <Text style={styles.emptyTitle}>No Family Members Yet</Text>
              <Text style={styles.emptySubtitle}>
                Add your family members to stay connected and safe
              </Text>
            </MotiView>
          )}
        </View>
      </ScrollView>

      {/* Add Member FAB */}
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => setShowAddModal(true)}
        color="#ffffff"
      />

      {/* Add Member Modal */}
      <AddMemberModal />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 200,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  backButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  headerRight: {
    width: 48,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  summarySection: {
    marginBottom: 24,
  },
  summaryCard: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  summaryHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
  },
  summarySubtitle: {
    fontSize: 16,
    color: '#7f8c8d',
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#667eea',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#7f8c8d',
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#e0e0e0',
  },
  membersSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 16,
    marginLeft: 4,
  },
  memberCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  memberHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  memberAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 32,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 2,
  },
  memberRelationship: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 4,
  },
  memberStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    color: '#7f8c8d',
    fontWeight: '500',
  },
  lastSeen: {
    fontSize: 12,
    color: '#bdc3c7',
  },
  memberActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emergencyToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
  },
  emergencyActive: {
    backgroundColor: '#ffebee',
    borderWidth: 1,
    borderColor: '#f44336',
  },
  emergencyIcon: {
    fontSize: 16,
    marginRight: 4,
  },
  emergencyLabel: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  memberDetails: {
    marginBottom: 12,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  contactIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  contactText: {
    fontSize: 14,
    color: '#667eea',
    textDecorationLine: 'underline',
  },
  emergencyBadge: {
    backgroundColor: '#ffebee',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: 'flex-start',
  },
  emergencyBadgeText: {
    fontSize: 12,
    color: '#f44336',
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 80,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#7f8c8d',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#bdc3c7',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#667eea',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    width: '90%',
    maxHeight: '80%',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  closeButton: {
    borderRadius: 20,
  },
  modalBody: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  input: {
    marginBottom: 16,
    backgroundColor: '#ffffff',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  modalButton: {
    flex: 1,
    marginHorizontal: 8,
    borderRadius: 12,
  },
  addButton: {
    backgroundColor: '#667eea',
  },
});

export default FamilyScreen;
