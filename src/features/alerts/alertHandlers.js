import { Alert } from 'react-native';
import { alertAPI } from '../../services/api';
import locationService from '../../services/location';
import notificationService from '../../services/notifications';
import { startBackgroundLocation } from '../../background/locationTask';

class AlertHandlers {
  constructor() {
    this.isProcessing = false;
    this.currentAlertId = null;
  }

  // Handle single hit wake phrase (show confirmation modal)
  async handleSingleHit() {
    if (this.isProcessing) {
      console.log('🚨 Alert already being processed');
      return;
    }

    console.log('🎤 Single hit detected - showing confirmation modal');
    
    // This will be handled by the UI component
    // The modal will call handleEmergencyConfirmed when user confirms
    return {
      type: 'single_hit',
      message: 'Wake phrase detected. Please confirm emergency alert.',
      showModal: true
    };
  }

  // Handle emergency threshold reached (auto-send alert)
  async handleEmergency() {
    if (this.isProcessing) {
      console.log('🚨 Alert already being processed');
      return;
    }

    console.log('🚨 Emergency threshold reached - sending alert automatically');
    
    try {
      this.isProcessing = true;
      
      // Get current location
      const location = await locationService.getCurrentLocationWithAddress();
      
      if (!location) {
        throw new Error('Could not get current location');
      }

      // Send emergency alert
      const response = await alertAPI.createAlertWithLocation(
        {
          type: 'emergency',
          message: 'Emergency alert triggered by voice command',
          location: location.address || 'Current location'
        },
        location
      );

      if (response.success) {
        this.currentAlertId = response.data.alert.id;
        
        // Start background location tracking
        await startBackgroundLocation();
        
        // Send local notification
        await notificationService.sendLocalNotification(
          '🚨 Emergency Alert Sent!',
          'Your parent has been notified. Help is on the way!',
          {
            type: 'alert_sent',
            alertType: 'emergency',
            timestamp: new Date().toISOString(),
          }
        );

        console.log('🚨 Emergency alert sent successfully:', this.currentAlertId);
        
        return {
          type: 'emergency_sent',
          alertId: this.currentAlertId,
          message: 'Emergency alert sent automatically!',
          location: location.address
        };
      } else {
        throw new Error(response.message || 'Failed to send emergency alert');
      }
    } catch (error) {
      console.error('🚨 Error sending emergency alert:', error);
      
      // Send local notification about failure
      await notificationService.sendLocalNotification(
        '❌ Alert Failed',
        'Failed to send emergency alert. Please try again.',
        {
          type: 'alert_failed',
          error: error.message,
          timestamp: new Date().toISOString(),
        }
      );
      
      return {
        type: 'emergency_failed',
        error: error.message,
        message: 'Failed to send emergency alert. Please try again.'
      };
    } finally {
      this.isProcessing = false;
    }
  }

  // Handle user confirmation of emergency alert
  async handleEmergencyConfirmed() {
    if (this.isProcessing) {
      console.log('🚨 Alert already being processed');
      return;
    }

    console.log('✅ User confirmed emergency alert');
    
    try {
      this.isProcessing = true;
      
      // Get current location
      const location = await locationService.getCurrentLocationWithAddress();
      
      if (!location) {
        throw new Error('Could not get current location');
      }

      // Send emergency alert
      const response = await alertAPI.createAlertWithLocation(
        {
          type: 'emergency',
          message: 'Emergency alert confirmed by user',
          location: location.address || 'Current location'
        },
        location
      );

      if (response.success) {
        this.currentAlertId = response.data.alert.id;
        
        // Start background location tracking
        await startBackgroundLocation();
        
        // Send local notification
        await notificationService.sendLocalNotification(
          '🚨 Emergency Alert Sent!',
          'Your parent has been notified. Help is on the way!',
          {
            type: 'alert_sent',
            alertType: 'emergency',
            timestamp: new Date().toISOString(),
          }
        );

        console.log('🚨 Emergency alert confirmed and sent:', this.currentAlertId);
        
        return {
          type: 'emergency_confirmed',
          alertId: this.currentAlertId,
          message: 'Emergency alert sent! Your parent has been notified.',
          location: location.address
        };
      } else {
        throw new Error(response.message || 'Failed to send emergency alert');
      }
    } catch (error) {
      console.error('🚨 Error sending confirmed emergency alert:', error);
      
      return {
        type: 'emergency_failed',
        error: error.message,
        message: 'Failed to send emergency alert. Please try again.'
      };
    } finally {
      this.isProcessing = false;
    }
  }

  // Handle user cancellation of emergency alert
  async handleEmergencyCancelled() {
    console.log('❌ User cancelled emergency alert');
    
    // Reset processing state
    this.isProcessing = false;
    
    return {
      type: 'emergency_cancelled',
      message: 'Emergency alert cancelled.'
    };
  }

  // Cancel current alert
  async cancelCurrentAlert() {
    if (!this.currentAlertId) {
      console.log('❌ No current alert to cancel');
      return false;
    }

    try {
      console.log('❌ Cancelling alert:', this.currentAlertId);
      
      const response = await alertAPI.cancelAlert(this.currentAlertId);
      
      if (response.success) {
        console.log('✅ Alert cancelled successfully');
        this.currentAlertId = null;
        return true;
      } else {
        console.log('❌ Failed to cancel alert:', response.message);
        return false;
      }
    } catch (error) {
      console.error('❌ Error cancelling alert:', error);
      return false;
    }
  }

  // Get current alert status
  getCurrentAlertStatus() {
    return {
      isProcessing: this.isProcessing,
      currentAlertId: this.currentAlertId,
      hasActiveAlert: !!this.currentAlertId
    };
  }

  // Reset alert system
  reset() {
    this.isProcessing = false;
    this.currentAlertId = null;
    console.log('🔄 Alert handlers reset');
  }

  // Test emergency alert (for development)
  async testEmergencyAlert() {
    console.log('🧪 Testing emergency alert...');
    
    try {
      // Simulate location
      const testLocation = {
        latitude: 51.5074,
        longitude: -0.1278,
        accuracy: 10,
        address: 'Test Location, London, UK',
        timestamp: Date.now()
      };

      const response = await alertAPI.createAlertWithLocation(
        {
          type: 'emergency',
          message: 'Test emergency alert from voice system',
          location: testLocation.address
        },
        testLocation
      );

      if (response.success) {
        console.log('🧪 Test emergency alert sent successfully');
        return {
          type: 'test_success',
          alertId: response.data.alert.id,
          message: 'Test emergency alert sent successfully!'
        };
      } else {
        throw new Error(response.message || 'Test alert failed');
      }
    } catch (error) {
      console.error('🧪 Test emergency alert failed:', error);
      return {
        type: 'test_failed',
        error: error.message,
        message: 'Test emergency alert failed.'
      };
    }
  }
}

// Create singleton instance
const alertHandlers = new AlertHandlers();

export default alertHandlers;
