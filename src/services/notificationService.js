import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import UserDataService from './userDataService';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

class NotificationService {
  constructor() {
    this.INIT_KEY = 'notifications_initialized_today';
    this.mealTimes = {
      breakfast: { hour: 8, minute: 0, title: 'Breakfast Time! 🌅', message: 'Start your day with a healthy breakfast' },
      lunch: { hour: 13, minute: 0, title: 'Lunch Break! ☀️', message: 'Time for a nutritious lunch' },
      snacks: { hour: 17, minute: 0, title: 'Snack Time! 🍎', message: 'Grab a healthy snack to keep energy up' },
      dinner: { hour: 20, minute: 0, title: 'Dinner Time! 🌙', message: 'End your day with a balanced dinner' }
    };

    this.reminderTimes = {
      breakfast: { hour: 9, minute: 30, message: 'Did you have breakfast? Track it now!' },
      lunch: { hour: 14, minute: 30, message: 'Don\'t forget to log your lunch!' },
      snacks: { hour: 18, minute: 0, message: 'Track your afternoon snack' },
      dinner: { hour: 21, minute: 30, message: 'Remember to log your dinner!' }
    };
  }

  // 🔧 FIXED: Better initialization check
  async shouldInitialize() {
    try {
      // Check if we're in development mode
      if (__DEV__) {
        console.log('🔔 Development mode: Notifications disabled');
        return false;
      }

      const today = new Date().toDateString();
      const lastInitDate = await AsyncStorage.getItem(this.INIT_KEY);

      if (lastInitDate === today) {
        console.log('🔔 Notifications already initialized today');
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error checking initialization status:', error);
      return true;
    }
  }

  async markAsInitialized() {
    try {
      const today = new Date().toDateString();
      await AsyncStorage.setItem(this.INIT_KEY, today);
    } catch (error) {
      console.error('Error marking as initialized:', error);
    }
  }

  // 🔧 FIXED: Better initialization
  async initialize() {
    try {
      // Skip in development
      if (__DEV__) {
        console.log('📱 Notifications disabled in development mode');
        return false;
      }

      // Check if we should initialize
      const shouldInit = await this.shouldInitialize();
      if (!shouldInit) {
        return true;
      }

      if (Device.isDevice) {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }

        if (finalStatus !== 'granted') {
          console.log('Failed to get push token for push notification!');
          return false;
        }

        console.log('✅ Notifications permission granted');
        await this.scheduleDailyMealReminders();
        await this.markAsInitialized();
        return true;
      } else {
        console.log('Must use physical device for Push Notifications');
        return false;
      }
    } catch (error) {
      console.error('Error initializing notifications:', error);
      return false;
    }
  }

  // 🔧 FIXED: Better scheduling logic
  async scheduleDailyMealReminders() {
    try {
      // Cancel existing notifications first
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log('🗑️ Cleared existing notifications');

      // Wait a moment for cleanup
      await new Promise(resolve => setTimeout(resolve, 500));

      // Schedule with proper date handling
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();

      // Schedule meal time notifications
      for (const [mealType, config] of Object.entries(this.mealTimes)) {
        await this.scheduleNotificationWithDate(mealType, config, 'mealTime');
      }

      // Schedule reminder notifications
      for (const [mealType, config] of Object.entries(this.reminderTimes)) {
        await this.scheduleNotificationWithDate(mealType, config, 'reminder');
      }

      console.log('✅ All meal notifications scheduled for production');
    } catch (error) {
      console.error('Error scheduling notifications:', error);
    }
  }

  // 🔧 NEW: Better scheduling with proper date calculation
  async scheduleNotificationWithDate(mealType, config, type) {
    try {
      const now = new Date();
      const scheduledTime = new Date();
      scheduledTime.setHours(config.hour, config.minute, 0, 0);

      // If the time has passed today, schedule for tomorrow
      if (scheduledTime <= now) {
        scheduledTime.setDate(scheduledTime.getDate() + 1);
      }

      const identifier = `${mealType}_${type}_${Date.now()}`;

      const result = await Notifications.scheduleNotificationAsync({
        identifier,
        content: {
          title: config.title || `${mealType.charAt(0).toUpperCase() + mealType.slice(1)} Reminder 🍽️`,
          body: config.message,
          data: {
            mealType,
            type,
            screen: type === 'mealTime' ? 'NutritionStats' : 'Scanner',
            scheduledFor: scheduledTime.toISOString()
          },
          sound: true,
        },
        trigger: scheduledTime, // Use date instead of repeating time
      });

      console.log(`📱 Scheduled ${type} for ${mealType} at ${scheduledTime.toLocaleString()}`);
      return result;
    } catch (error) {
      console.error(`Error scheduling ${mealType} notification:`, error);
    }
  }

  // 🔧 FIXED: Better missed meal checking
  async checkMissedMeals() {
    try {
      // Skip in development
      if (__DEV__) {
        return [];
      }

      const todayIntake = await UserDataService.getDailyIntake();
      const currentHour = new Date().getHours();

      const missedMeals = [];

      // Only check if current time has passed meal time
      if (currentHour >= 10 && (!todayIntake.breakfast || todayIntake.breakfast.length === 0)) {
        missedMeals.push('breakfast');
      }

      if (currentHour >= 15 && (!todayIntake.lunch || todayIntake.lunch.length === 0)) {
        missedMeals.push('lunch');
      }

      if (currentHour >= 21 && (!todayIntake.dinner || todayIntake.dinner.length === 0)) {
        missedMeals.push('dinner');
      }

      // Send only one missed meal notification per check
      if (missedMeals.length > 0) {
        await this.sendMissedMealNotification(missedMeals[0]);
      }

      return missedMeals;
    } catch (error) {
      console.error('Error checking missed meals:', error);
      return [];
    }
  }

  // Rest of your methods remain the same...
  async sendMissedMealNotification(mealType) {
    try {
      if (__DEV__) return; // Skip in development

      const messages = {
        breakfast: {
          title: 'Missed Breakfast? 🥞',
          body: 'Don\'t skip the most important meal! Track it now if you had something.',
        },
        lunch: {
          title: 'Lunch Missing! 🍽️',
          body: 'Your body needs fuel. Add your lunch to complete your nutrition tracking.',
        },
        dinner: {
          title: 'Dinner Not Logged 🌙',
          body: 'Complete your day by tracking your dinner for better nutrition insights.',
        },
      };

      const message = messages[mealType];

      await Notifications.scheduleNotificationAsync({
        content: {
          title: message.title,
          body: message.body,
          data: { mealType, type: 'missedMeal', screen: 'Scanner' },
          sound: true,
        },
        trigger: null,
      });

      console.log(`📱 Sent missed meal notification for ${mealType}`);
    } catch (error) {
      console.error(`Error sending missed meal notification for ${mealType}:`, error);
    }
  }

  // 🔧 NEW: Send generic goal notification (called by UserDataService)
  async sendGoalNotification(type, message) {
    try {
      if (__DEV__) return;

      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Goal Reached! 🎯',
          body: message,
          data: { type, screen: 'Home' },
          sound: true,
        },
        trigger: null,
      });
      console.log(`📱 Sent goal notification: ${type}`);
    } catch (error) {
      console.error('Error sending goal notification:', error);
    }
  }

  // 🔧 NEW: Send step goal notification
  async sendStepGoalNotification(steps) {
    try {
      if (__DEV__) return;

      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Step Goal Reached! 🎉',
          body: `Congratulations! You hit ${steps} steps today. Keep moving!`,
          data: { type: 'stepGoal', screen: 'Home' },
          sound: true,
        },
        trigger: null,
      });
      console.log('📱 Sent step goal notification');
    } catch (error) {
      console.error('Error sending step goal notification:', error);
    }
  }

  // ... rest of your existing methods stay the same

  async getNotificationStatus() {
    try {
      if (__DEV__) return false; // Always false in development
      const { status } = await Notifications.getPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error checking notification status:', error);
      return false;
    }
  }

  async cancelAllNotifications() {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      await AsyncStorage.removeItem(this.INIT_KEY);
      console.log('🔕 All notifications cancelled and reset');
    } catch (error) {
      console.error('Error cancelling notifications:', error);
    }
  }

  async getScheduledNotifications() {
    try {
      const notifications = await Notifications.getAllScheduledNotificationsAsync();
      console.log(`📋 Scheduled notifications: ${notifications.length}`);
      return notifications;
    } catch (error) {
      console.error('Error getting scheduled notifications:', error);
      return [];
    }
  }
}

export default new NotificationService();
