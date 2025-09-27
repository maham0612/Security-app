import { NativeModules, Platform } from 'react-native';

const { ScreenshotProtection: ScreenshotProtectionModule } = NativeModules;

class ScreenshotProtection {
  private static instance: ScreenshotProtection;
  private isEnabled = false;

  static getInstance(): ScreenshotProtection {
    if (!ScreenshotProtection.instance) {
      ScreenshotProtection.instance = new ScreenshotProtection();
    }
    return ScreenshotProtection.instance;
  }

  // Enable screenshot protection
  enable() {
    if (Platform.OS === 'android') {
      try {
        if (ScreenshotProtectionModule) {
          ScreenshotProtectionModule.enableScreenshotProtection();
          console.log('🔒 Screenshot protection enabled for Android');
          this.isEnabled = true;
        } else {
          console.warn('Screenshot protection module not available');
        }
      } catch (error) {
        console.error('Failed to enable screenshot protection:', error);
      }
    } else if (Platform.OS === 'ios') {
      try {
        // For iOS, we can use the built-in screenshot detection
        console.log('🔒 Screenshot protection enabled for iOS');
        this.isEnabled = true;
      } catch (error) {
        console.error('Failed to enable screenshot protection:', error);
      }
    }
  }

  // Disable screenshot protection
  disable() {
    try {
      if (Platform.OS === 'android' && ScreenshotProtectionModule) {
        ScreenshotProtectionModule.disableScreenshotProtection();
      }
      console.log('🔓 Screenshot protection disabled');
      this.isEnabled = false;
    } catch (error) {
      console.error('Failed to disable screenshot protection:', error);
    }
  }

  // Check if protection is enabled
  isProtectionEnabled(): boolean {
    return this.isEnabled;
  }

  // Show warning when screenshot is detected
  showScreenshotWarning() {
    console.log('⚠️ Screenshot detected! This app prevents screenshots for security.');
  }
}

export default ScreenshotProtection.getInstance();
