import { Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

class NotificationService {
  private static instance: NotificationService;
  private isEnabled = true;

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  // Request notification permissions
  async requestPermissions(): Promise<boolean> {
    try {
      // For now, we'll use a simple approach
      console.log('Requesting notification permissions...');
      
      // Store permission status
      await AsyncStorage.setItem('notificationPermission', 'granted');
      return true;
    } catch (error) {
      console.error('Failed to request notification permissions:', error);
      return false;
    }
  }

  // Send local notification
  async sendLocalNotification(title: string, body: string, data?: any) {
    try {
      if (!this.isEnabled) return;

      // Simple console log instead of notifications
      console.log('🔔 Notification:', { title, body, data });
    } catch (error) {
      console.error('Failed to send notification:', error);
    }
  }

  // Send push notification (would integrate with FCM in real app)
  async sendPushNotification(token: string, title: string, body: string, data?: any) {
    try {
      if (!this.isEnabled) return;

      // This would send to Firebase Cloud Messaging
      console.log('Push notification sent:', { token, title, body, data });
    } catch (error) {
      console.error('Failed to send push notification:', error);
    }
  }

  // Handle new message notification
  async handleNewMessage(senderName: string, message: string, chatId: string) {
    try {
      // Just log to console, no notifications
      console.log(`New message from ${senderName}: ${message}`);
    } catch (error) {
      console.error('Failed to handle new message notification:', error);
    }
  }

  // Handle typing notification
  async handleTypingNotification(senderName: string, chatId: string) {
    try {
      // Just log to console, no notifications
      console.log(`${senderName} is typing...`);
    } catch (error) {
      console.error('Failed to handle typing notification:', error);
    }
  }

  // Enable/disable notifications
  async setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
    await AsyncStorage.setItem('notificationsEnabled', enabled.toString());
  }

  // Check if notifications are enabled
  async isNotificationsEnabled(): Promise<boolean> {
    try {
      const enabled = await AsyncStorage.getItem('notificationsEnabled');
      return enabled !== 'false';
    } catch (error) {
      return true; // Default to enabled
    }
  }

  // Get device token (for push notifications)
  async getDeviceToken(): Promise<string | null> {
    try {
      // In a real app, this would get the FCM token
      const token = await AsyncStorage.getItem('deviceToken');
      return token;
    } catch (error) {
      console.error('Failed to get device token:', error);
      return null;
    }
  }

  // Set device token
  async setDeviceToken(token: string) {
    try {
      await AsyncStorage.setItem('deviceToken', token);
    } catch (error) {
      console.error('Failed to set device token:', error);
    }
  }
}

export default NotificationService.getInstance();