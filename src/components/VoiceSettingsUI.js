import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TextInput } from 'react-native';
import { Card, Button, Switch, List, Divider, FAB, Modal, TextInput as PaperTextInput } from 'react-native-paper';
import { MotiView } from 'moti';
import voiceSettings from '../features/voice/voiceSettings';
import * as Speech from 'expo-speech';

export default function VoiceSettingsUI() {
  const [settings, setSettings] = useState({});
  const [activeTab, setActiveTab] = useState('voice');
  const [showAddCommandModal, setShowAddCommandModal] = useState(false);
  const [showAddWakePhraseModal, setShowAddWakePhraseModal] = useState(false);
  const [newCommand, setNewCommand] = useState({ phrase: '', action: '', description: '' });
  const [newWakePhrase, setNewWakePhrase] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const tabs = [
    { id: 'voice', label: '🎤 Voice', icon: '🎤' },
    { id: 'wake', label: '🔔 Wake Phrases', icon: '🔔' },
    { id: 'commands', label: '⚡ Commands', icon: '⚡' },
    { id: 'recognition', label: '👂 Recognition', icon: '👂' },
    { id: 'notifications', label: '🔔 Notifications', icon: '🔔' },
    { id: 'privacy', label: '🔒 Privacy', icon: '🔒' },
    { id: 'advanced', label: '⚙️ Advanced', icon: '⚙️' },
  ];

  useEffect(() => {
    loadSettings();
    
    // Listen for settings changes
    const unsubscribe = voiceSettings.addListener(handleSettingChange);
    
    return () => {
      unsubscribe();
    };
  }, []);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      await voiceSettings.initialize();
      const currentSettings = voiceSettings.getSettings();
      setSettings(currentSettings);
    } catch (error) {
      console.error('Error loading settings:', error);
      Alert.alert('Error', 'Failed to load voice settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSettingChange = (key, value, allSettings) => {
    setSettings({ ...allSettings });
  };

  const updateSetting = async (key, value) => {
    try {
      await voiceSettings.updateSetting(key, value);
    } catch (error) {
      console.error('Error updating setting:', error);
      Alert.alert('Error', 'Failed to update setting');
    }
  };

  const updateSettings = async (newSettings) => {
    try {
      await voiceSettings.updateSettings(newSettings);
    } catch (error) {
      console.error('Error updating settings:', error);
      Alert.alert('Error', 'Failed to update settings');
    }
  };

  const resetToDefaults = async () => {
    Alert.alert(
      'Reset Settings',
      'Are you sure you want to reset all voice settings to defaults?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              await voiceSettings.resetToDefaults();
              Alert.alert('Success', 'Settings reset to defaults');
            } catch (error) {
              Alert.alert('Error', 'Failed to reset settings');
            }
          }
        }
      ]
    );
  };

  const testVoiceSettings = async () => {
    try {
      const testText = 'This is a test of your current voice settings. How does it sound?';
      await Speech.speak(testText, {
        language: settings.voiceLanguage,
        pitch: settings.voicePitch,
        rate: settings.voiceRate,
        volume: settings.voiceVolume,
      });
    } catch (error) {
      console.error('Error testing voice:', error);
      Alert.alert('Error', 'Failed to test voice settings');
    }
  };

  const applyVoicePreset = async (presetName) => {
    try {
      await voiceSettings.applyVoicePreset(presetName);
      Alert.alert('Success', `Voice preset "${presetName}" applied`);
    } catch (error) {
      Alert.alert('Error', 'Failed to apply voice preset');
    }
  };

  const addCustomCommand = async () => {
    if (!newCommand.phrase || !newCommand.action) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      await voiceSettings.addCustomCommand(
        newCommand.phrase,
        newCommand.action,
        newCommand.description
      );
      setShowAddCommandModal(false);
      setNewCommand({ phrase: '', action: '', description: '' });
      Alert.alert('Success', 'Custom command added');
    } catch (error) {
      Alert.alert('Error', 'Failed to add custom command');
    }
  };

  const removeCustomCommand = async (commandId) => {
    Alert.alert(
      'Remove Command',
      'Are you sure you want to remove this custom command?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await voiceSettings.removeCustomCommand(commandId);
              Alert.alert('Success', 'Custom command removed');
            } catch (error) {
              Alert.alert('Error', 'Failed to remove custom command');
            }
          }
        }
      ]
    );
  };

  const addWakePhrase = async () => {
    if (!newWakePhrase.trim()) {
      Alert.alert('Error', 'Please enter a wake phrase');
      return;
    }

    try {
      await voiceSettings.addWakePhrase(newWakePhrase.trim());
      setShowAddWakePhraseModal(false);
      setNewWakePhrase('');
      Alert.alert('Success', 'Wake phrase added');
    } catch (error) {
      Alert.alert('Error', 'Failed to add wake phrase');
    }
  };

  const removeWakePhrase = async (phrase) => {
    if (settings.wakePhrases.length <= 1) {
      Alert.alert('Error', 'At least one wake phrase is required');
      return;
    }

    Alert.alert(
      'Remove Wake Phrase',
      `Are you sure you want to remove "${phrase}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await voiceSettings.removeWakePhrase(phrase);
              Alert.alert('Success', 'Wake phrase removed');
            } catch (error) {
              Alert.alert('Error', 'Failed to remove wake phrase');
            }
          }
        }
      ]
    );
  };

  const renderVoiceTab = () => (
    <ScrollView style={styles.tabContent}>
      {/* Voice Feedback Settings */}
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.cardTitle}>🎤 Voice Feedback</Text>
          
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Enable Voice</Text>
            <Switch
              value={settings.voiceEnabled || true}
              onValueChange={(value) => updateSetting('voiceEnabled', value)}
            />
          </View>

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Volume: {Math.round((settings.voiceVolume || 0.8) * 100)}%</Text>
            <View style={styles.controlButtons}>
              <Button 
                mode="outlined" 
                onPress={() => updateSetting('voiceVolume', Math.max(0, (settings.voiceVolume || 0.8) - 0.1))}
                compact
              >
                -
              </Button>
              <Button 
                mode="outlined" 
                onPress={() => updateSetting('voiceVolume', Math.min(1, (settings.voiceVolume || 0.8) + 0.1))}
                compact
              >
                +
              </Button>
            </View>
          </View>

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Speed: {(settings.voiceRate || 0.9).toFixed(1)}x</Text>
            <View style={styles.controlButtons}>
              <Button 
                mode="outlined" 
                onPress={() => updateSetting('voiceRate', Math.max(0.1, (settings.voiceRate || 0.9) - 0.1))}
                compact
              >
                -
              </Button>
              <Button 
                mode="outlined" 
                onPress={() => updateSetting('voiceRate', Math.min(2.0, (settings.voiceRate || 0.9) + 0.1))}
                compact
              >
                +
              </Button>
            </View>
          </View>

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Pitch: {(settings.voicePitch || 1.0).toFixed(1)}x</Text>
            <View style={styles.controlButtons}>
              <Button 
                mode="outlined" 
                onPress={() => updateSetting('voicePitch', Math.max(0.5, (settings.voicePitch || 1.0) - 0.1))}
                compact
              >
                -
              </Button>
              <Button 
                mode="outlined" 
                onPress={() => updateSetting('voicePitch', Math.min(2.0, (settings.voicePitch || 1.0) + 0.1))}
                compact
              >
                +
              </Button>
            </View>
          </View>

          <Button
            mode="outlined"
            onPress={testVoiceSettings}
            style={styles.testButton}
            icon="play"
          >
            Test Voice Settings
          </Button>
        </Card.Content>
      </Card>

      {/* Language Settings */}
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.cardTitle}>🌍 Language</Text>
          
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Voice Language</Text>
            <Button
              mode="outlined"
              onPress={() => {/* TODO: Show language picker */}}
              compact
            >
              {settings.voiceLanguage || 'en-US'}
            </Button>
          </View>
        </Card.Content>
      </Card>

      {/* Voice Presets */}
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.cardTitle}>🎯 Voice Presets</Text>
          
          <View style={styles.presetGrid}>
            {Object.entries(voiceSettings.getVoicePresets()).map(([key, preset]) => (
              <Button
                key={key}
                mode="outlined"
                onPress={() => applyVoicePreset(key)}
                style={styles.presetButton}
                compact
              >
                {preset.name}
              </Button>
            ))}
          </View>
        </Card.Content>
      </Card>
    </ScrollView>
  );

  const renderWakeTab = () => (
    <ScrollView style={styles.tabContent}>
      {/* Wake Phrase Settings */}
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.cardTitle}>🔔 Wake Phrases</Text>
          
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Hit Threshold: {settings.hitThreshold || 3}</Text>
            <View style={styles.controlButtons}>
              <Button 
                mode="outlined" 
                onPress={() => updateSetting('hitThreshold', Math.max(1, (settings.hitThreshold || 3) - 1))}
                compact
              >
                -
              </Button>
              <Button 
                mode="outlined" 
                onPress={() => updateSetting('hitThreshold', Math.min(10, (settings.hitThreshold || 3) + 1))}
                compact
              >
                +
              </Button>
            </View>
          </View>

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Time Window: {Math.round((settings.timeWindow || 10000) / 1000)}s</Text>
            <View style={styles.controlButtons}>
              <Button 
                mode="outlined" 
                onPress={() => updateSetting('timeWindow', Math.max(1000, (settings.timeWindow || 10000) - 1000))}
                compact
              >
                -
              </Button>
              <Button 
                mode="outlined" 
                onPress={() => updateSetting('timeWindow', Math.min(60000, (settings.timeWindow || 10000) + 1000))}
                compact
              >
                +
              </Button>
            </View>
          </View>

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Auto Emergency</Text>
            <Switch
              value={settings.autoEmergency || true}
              onValueChange={(value) => updateSetting('autoEmergency', value)}
            />
          </View>

          <Button
            mode="outlined"
            onPress={() => setShowAddWakePhraseModal(true)}
            style={styles.addButton}
            icon="plus"
          >
            Add Wake Phrase
          </Button>
        </Card.Content>
      </Card>

      {/* Current Wake Phrases */}
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.cardTitle}>Current Wake Phrases</Text>
          
          {settings.wakePhrases?.map((phrase, index) => (
            <View key={index} style={styles.phraseItem}>
              <Text style={styles.phraseText}>• "{phrase}"</Text>
              <Button
                mode="text"
                onPress={() => removeWakePhrase(phrase)}
                textColor="#e74c3c"
                compact
                disabled={settings.wakePhrases.length <= 1}
              >
                Remove
              </Button>
            </View>
          ))}
        </Card.Content>
      </Card>
    </ScrollView>
  );

  const renderCommandsTab = () => (
    <ScrollView style={styles.tabContent}>
      {/* Command Settings */}
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.cardTitle}>⚡ Voice Commands</Text>
          
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Enable Commands</Text>
            <Switch
              value={settings.commandsEnabled || true}
              onValueChange={(value) => updateSetting('commandsEnabled', value)}
            />
          </View>

          <Button
            mode="outlined"
            onPress={() => setShowAddCommandModal(true)}
            style={styles.addButton}
            icon="plus"
          >
            Add Custom Command
          </Button>
        </Card.Content>
      </Card>

      {/* Custom Commands */}
      {settings.customCommands?.length > 0 && (
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.cardTitle}>Custom Commands</Text>
            
            {settings.customCommands.map((command) => (
              <View key={command.id} style={styles.commandItem}>
                <View style={styles.commandHeader}>
                  <Text style={styles.commandPhrase}>"{command.phrase}"</Text>
                  <Text style={styles.commandAction}>→ {command.action}</Text>
                </View>
                <Text style={styles.commandDescription}>{command.description}</Text>
                <View style={styles.commandActions}>
                  <Button
                    mode="text"
                    onPress={() => removeCustomCommand(command.id)}
                    textColor="#e74c3c"
                    compact
                  >
                    Remove
                  </Button>
                </View>
              </View>
            ))}
          </Card.Content>
        </Card>
      )}
    </ScrollView>
  );

  const renderRecognitionTab = () => (
    <ScrollView style={styles.tabContent}>
      {/* Recognition Settings */}
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.cardTitle}>👂 Voice Recognition</Text>
          
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Enable Recognition</Text>
            <Switch
              value={settings.recognitionEnabled || true}
              onValueChange={(value) => updateSetting('recognitionEnabled', value)}
            />
          </View>

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Continuous Listening</Text>
            <Switch
              value={settings.continuousListening}
              onValueChange={(value) => updateSetting('continuousListening', value)}
            />
          </View>

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Sensitivity: {Math.round((settings.sensitivity || 0.7) * 100)}%</Text>
            <View style={styles.controlButtons}>
              <Button 
                mode="outlined" 
                onPress={() => updateSetting('sensitivity', Math.max(0.1, (settings.sensitivity || 0.7) - 0.1))}
                compact
              >
                -
              </Button>
              <Button 
                mode="outlined" 
                onPress={() => updateSetting('sensitivity', Math.min(1.0, (settings.sensitivity || 0.7) + 0.1))}
                compact
              >
                +
              </Button>
            </View>
          </View>

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Timeout: {Math.round((settings.timeout || 5000) / 1000)}s</Text>
            <View style={styles.controlButtons}>
              <Button 
                mode="outlined" 
                onPress={() => updateSetting('timeout', Math.max(1000, (settings.timeout || 5000) - 1000))}
                compact
              >
                -
              </Button>
              <Button 
                mode="outlined" 
                onPress={() => updateSetting('timeout', Math.min(30000, (settings.timeout || 5000) + 1000))}
                compact
              >
                +
              </Button>
            </View>
          </View>
        </Card.Content>
      </Card>
    </ScrollView>
  );

  const renderNotificationsTab = () => (
    <ScrollView style={styles.tabContent}>
      {/* Notification Settings */}
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.cardTitle}>🔔 Notifications</Text>
          
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Voice Notifications</Text>
            <Switch
              value={settings.voiceNotifications}
              onValueChange={(value) => updateSetting('voiceNotifications', value)}
            />
          </View>

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Command Confirmations</Text>
            <Switch
              value={settings.commandConfirmations}
              onValueChange={(value) => updateSetting('commandConfirmations', value)}
            />
          </View>

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Error Feedback</Text>
            <Switch
              value={settings.errorFeedback}
              onValueChange={(value) => updateSetting('errorFeedback', value)}
            />
          </View>
        </Card.Content>
      </Card>
    </ScrollView>
  );

  const renderPrivacyTab = () => (
    <ScrollView style={styles.tabContent}>
      {/* Privacy Settings */}
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.cardTitle}>🔒 Privacy</Text>
          
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Save Voice History</Text>
            <Switch
              value={settings.saveVoiceHistory}
              onValueChange={(value) => updateSetting('saveVoiceHistory', value)}
            />
          </View>

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Max History Items: {settings.maxHistoryItems || 50}</Text>
            <View style={styles.controlButtons}>
              <Button 
                mode="outlined" 
                onPress={() => updateSetting('maxHistoryItems', Math.max(10, (settings.maxHistoryItems || 50) - 10))}
                compact
              >
                -
              </Button>
              <Button 
                mode="outlined" 
                onPress={() => updateSetting('maxHistoryItems', Math.min(200, (settings.maxHistoryItems || 50) + 10))}
                compact
              >
                +
              </Button>
            </View>
          </View>

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Auto Clear History</Text>
            <Switch
              value={settings.autoClearHistory}
              onValueChange={(value) => updateSetting('autoClearHistory', value)}
            />
          </View>
        </Card.Content>
      </Card>
    </ScrollView>
  );

  const renderAdvancedTab = () => (
    <ScrollView style={styles.tabContent}>
      {/* Advanced Settings */}
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.cardTitle}>⚙️ Advanced</Text>
          
          <Button
            mode="outlined"
            onPress={resetToDefaults}
            style={styles.resetButton}
            icon="refresh"
            textColor="#e74c3c"
          >
            Reset to Defaults
          </Button>

          <Button
            mode="outlined"
            onPress={async () => {
              const exported = await voiceSettings.exportSettings();
              if (exported) {
                // TODO: Share or save exported settings
                Alert.alert('Success', 'Settings exported successfully');
              }
            }}
            style={styles.exportButton}
            icon="export"
          >
            Export Settings
          </Button>

          <Button
            mode="outlined"
            onPress={() => {
              // TODO: Show import dialog
              Alert.alert('Import', 'Import functionality coming soon');
            }}
            style={styles.importButton}
            icon="import"
          >
            Import Settings
          </Button>
        </Card.Content>
      </Card>

      {/* Settings Summary */}
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.cardTitle}>📊 Settings Summary</Text>
          
          {(() => {
            const summary = voiceSettings.getSettingsSummary();
            return (
              <View>
                <Text style={styles.summaryText}>Total Settings: {summary.totalSettings}</Text>
                <Text style={styles.summaryText}>Wake Phrases: {summary.wakePhrasesCount}</Text>
                <Text style={styles.summaryText}>Custom Commands: {summary.customCommandsCount}</Text>
                <Text style={styles.summaryText}>Command Aliases: {summary.commandAliasesCount}</Text>
                <Text style={styles.summaryText}>Voice Enabled: {summary.voiceEnabled ? 'Yes' : 'No'}</Text>
                <Text style={styles.summaryText}>Recognition Enabled: {summary.recognitionEnabled ? 'Yes' : 'No'}</Text>
                <Text style={styles.summaryText}>Commands Enabled: {summary.commandsEnabled ? 'Yes' : 'No'}</Text>
              </View>
            );
          })()}
        </Card.Content>
      </Card>
    </ScrollView>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'voice':
        return renderVoiceTab();
      case 'wake':
        return renderWakeTab();
      case 'commands':
        return renderCommandsTab();
      case 'recognition':
        return renderRecognitionTab();
      case 'notifications':
        return renderNotificationsTab();
      case 'privacy':
        return renderPrivacyTab();
      case 'advanced':
        return renderAdvancedTab();
      default:
        return renderVoiceTab();
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading voice settings...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Tab Navigation */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabBar}>
        {tabs.map((tab) => (
          <Button
            key={tab.id}
            mode={activeTab === tab.id ? 'contained' : 'outlined'}
            onPress={() => setActiveTab(tab.id)}
            style={styles.tabButton}
            compact
          >
            {tab.label}
          </Button>
        ))}
      </ScrollView>

      {/* Tab Content */}
      {renderTabContent()}

      {/* Add Command Modal */}
      <View>
        <Modal
          visible={showAddCommandModal}
          onDismiss={() => setShowAddCommandModal(false)}
          contentContainerStyle={styles.modal}
        >
          <Text style={styles.modalTitle}>Add Custom Command</Text>
          
          <PaperTextInput
            label="Phrase (what to say)"
            value={newCommand.phrase}
            onChangeText={(text) => setNewCommand({ ...newCommand, phrase: text })}
            style={styles.modalInput}
          />
          
          <PaperTextInput
            label="Action (what it does)"
            value={newCommand.action}
            onChangeText={(text) => setNewCommand({ ...newCommand, action: text })}
            style={styles.modalInput}
          />
          
          <PaperTextInput
            label="Description (optional)"
            value={newCommand.description}
            onChangeText={(text) => setNewCommand({ ...newCommand, description: text })}
            style={styles.modalInput}
          />
          
          <View style={styles.modalButtons}>
            <Button
              mode="outlined"
              onPress={() => setShowAddCommandModal(false)}
              style={styles.modalButton}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={addCustomCommand}
              style={styles.modalButton}
            >
              Add Command
            </Button>
          </View>
        </Modal>
      </View>

      {/* Add Wake Phrase Modal */}
      <View>
        <Modal
          visible={showAddWakePhraseModal}
          onDismiss={() => setShowAddWakePhraseModal(false)}
          contentContainerStyle={styles.modal}
        >
          <Text style={styles.modalTitle}>Add Wake Phrase</Text>
          
          <PaperTextInput
            label="Wake Phrase"
            value={newWakePhrase}
            onChangeText={setNewWakePhrase}
            style={styles.modalInput}
            placeholder="e.g., 'hey mummy'"
          />
          
          <View style={styles.modalButtons}>
            <Button
              mode="outlined"
              onPress={() => setShowAddWakePhraseModal(false)}
              style={styles.modalButton}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={addWakePhrase}
              style={styles.modalButton}
            >
              Add Phrase
            </Button>
          </View>
        </Modal>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  tabBar: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    elevation: 2,
  },
  tabButton: {
    marginRight: 8,
  },
  tabContent: {
    flex: 1,
    padding: 16,
  },
  card: {
    marginBottom: 16,
    elevation: 2,
    borderRadius: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  settingLabel: {
    fontSize: 16,
    color: '#2c3e50',
    flex: 1,
  },
  controlButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  testButton: {
    marginTop: 8,
  },
  addButton: {
    marginTop: 8,
  },
  resetButton: {
    marginTop: 8,
    borderColor: '#e74c3c',
  },
  exportButton: {
    marginTop: 8,
  },
  importButton: {
    marginTop: 8,
  },
  presetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  presetButton: {
    flex: 1,
    minWidth: '45%',
  },
  phraseItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  phraseText: {
    fontSize: 16,
    color: '#2c3e50',
    flex: 1,
  },
  commandItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  commandHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  commandPhrase: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    flex: 1,
  },
  commandAction: {
    fontSize: 14,
    color: '#7f8c8d',
    fontStyle: 'italic',
  },
  commandDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  commandActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  summaryText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  modal: {
    backgroundColor: '#fff',
    padding: 20,
    margin: 20,
    borderRadius: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalInput: {
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalButton: {
    flex: 1,
  },
});
