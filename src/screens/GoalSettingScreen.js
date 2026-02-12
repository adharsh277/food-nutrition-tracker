import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Dimensions,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import UserDataService from '../services/userDataService';
import NotificationService from '../services/notificationService'; // 🔔 NEW

const { width } = Dimensions.get('window');

const GoalSettingScreen = ({ navigation }) => {
  const [goals, setGoals] = useState({
    dailyCalories: 2200,
    dailyProtein: 80,
    dailyCarbs: 275,
    dailyFat: 73,
    dailyFiber: 25,
    dailySteps: 10000,
    waterGlasses: 8,
    mealsPerDay: 4
  });

  const [loading, setLoading] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true); // 🔔 NEW

  useEffect(() => {
    loadCurrentGoals();
    checkNotificationStatus(); // 🔔 NEW
  }, []);

  const loadCurrentGoals = async () => {
    try {
      const currentGoals = await UserDataService.getUserGoals();
      if (currentGoals) {
        setGoals(currentGoals);
      }
    } catch (error) {
      console.error('Error loading goals:', error);
    } finally {
      setLoading(false);
    }
  };

  // 🔔 NEW: Check notification status
  const checkNotificationStatus = async () => {
    try {
      const status = await NotificationService.getNotificationStatus();
      setNotificationsEnabled(status);
    } catch (error) {
      console.error('Error checking notification status:', error);
    }
  };

  const saveGoals = async () => {
    try {
      const success = await UserDataService.saveUserGoals(goals);
      if (success) {
        Alert.alert(
          'Success!',
          'Your nutrition goals have been saved.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } else {
        Alert.alert('Error', 'Failed to save goals. Please try again.');
      }
    } catch (error) {
      console.error('Error saving goals:', error);
      Alert.alert('Error', 'Failed to save goals. Please try again.');
    }
  };

  const updateGoal = (key, value) => {
    const numValue = parseInt(value) || 0;
    setGoals(prev => ({ ...prev, [key]: numValue }));
  };

  // 🔔 NEW: Handle notification toggle
  const handleNotificationToggle = async (value) => {
    try {
      setNotificationsEnabled(value);

      if (value) {
        // Don't reinitialize if already done today
        const shouldInit = await NotificationService.shouldInitialize();

        if (shouldInit) {
          const initialized = await NotificationService.initialize();
          if (initialized) {
            Alert.alert(
              'Notifications Enabled! 🔔',
              'You\'ll receive reminders for breakfast, lunch, snacks, and dinner.',
              [{ text: 'Great!' }]
            );
          } else {
            Alert.alert(
              'Permission Required',
              'Please enable notifications in your device settings to receive meal reminders.',
              [
                { text: 'Cancel', onPress: () => setNotificationsEnabled(false) },
                { text: 'OK', onPress: () => setNotificationsEnabled(false) }
              ]
            );
          }
        } else {
          Alert.alert(
            'Notifications Already Active! 🔔',
            'Your meal reminders are already scheduled for today.',
            [{ text: 'OK' }]
          );
        }
      } else {
        await NotificationService.cancelAllNotifications();
        // Clear the initialization flag
        await AsyncStorage.removeItem('notifications_initialized_today');
        Alert.alert(
          'Notifications Disabled 🔕',
          'You won\'t receive meal reminders anymore.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error toggling notifications:', error);
      setNotificationsEnabled(!value);
    }
  };

  const presetGoals = {
    sedentary: { dailyCalories: 1800, dailyProtein: 65, dailyCarbs: 225, dailyFat: 60, dailySteps: 5000 },
    moderate: { dailyCalories: 2200, dailyProtein: 80, dailyCarbs: 275, dailyFat: 73, dailySteps: 10000 },
    active: { dailyCalories: 2600, dailyProtein: 95, dailyCarbs: 325, dailyFat: 87, dailySteps: 15000 }
  };

  const applyPreset = (preset) => {
    setGoals(prev => ({ ...prev, ...presetGoals[preset] }));
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient
          colors={['#4CAF50', '#45a049']}
          style={styles.loadingGradient}
        >
          <Ionicons name="settings" size={48} color="white" />
          <Text style={styles.loadingText}>Loading your goals...</Text>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#4CAF50', '#45a049']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Set Your Goals</Text>
          <TouchableOpacity style={styles.saveButton} onPress={saveGoals}>
            <Text style={styles.saveButtonText}>Save</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 🔔 NEW: Notification Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notification Settings</Text>

          <View style={styles.notificationCard}>
            <View style={styles.notificationHeader}>
              <View style={styles.notificationIcon}>
                <Ionicons name="notifications" size={24} color="#FF9800" />
              </View>
              <View style={styles.notificationContent}>
                <Text style={styles.notificationTitle}>Meal Reminders</Text>
                <Text style={styles.notificationDescription}>
                  Get smart reminders for breakfast, lunch, snacks & dinner
                </Text>
              </View>
              <Switch
                trackColor={{ false: '#e0e0e0', true: '#4CAF50' }}
                thumbColor={notificationsEnabled ? '#fff' : '#f4f3f4'}
                ios_backgroundColor="#e0e0e0"
                onValueChange={handleNotificationToggle}
                value={notificationsEnabled}
                style={styles.switch}
              />
            </View>

            {notificationsEnabled && (
              <View style={styles.notificationTimes}>
                <Text style={styles.timesTitle}>Daily Reminders:</Text>
                <View style={styles.timesList}>
                  <View style={styles.timeItem}>
                    <Ionicons name="sunny" size={16} color="#FF9800" />
                    <Text style={styles.timeText}>Breakfast - 8:00 AM</Text>
                  </View>
                  <View style={styles.timeItem}>
                    <Ionicons name="partly-sunny" size={16} color="#FF9800" />
                    <Text style={styles.timeText}>Lunch - 1:00 PM</Text>
                  </View>
                  <View style={styles.timeItem}>
                    <Ionicons name="cafe" size={16} color="#FF9800" />
                    <Text style={styles.timeText}>Snacks - 5:00 PM</Text>
                  </View>
                  <View style={styles.timeItem}>
                    <Ionicons name="moon" size={16} color="#FF9800" />
                    <Text style={styles.timeText}>Dinner - 8:00 PM</Text>
                  </View>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Quick Presets */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Presets</Text>
          <View style={styles.presetGrid}>
            {Object.keys(presetGoals).map(preset => (
              <TouchableOpacity
                key={preset}
                style={styles.presetButton}
                onPress={() => applyPreset(preset)}
              >
                <Text style={styles.presetTitle}>
                  {preset.charAt(0).toUpperCase() + preset.slice(1)}
                </Text>
                <Text style={styles.presetCalories}>
                  {presetGoals[preset].dailyCalories} cal
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Macro Goals */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Daily Nutrition Goals</Text>

          <View style={styles.goalCard}>
            <View style={styles.goalHeader}>
              <Ionicons name="flame" size={20} color="#FF6B35" />
              <Text style={styles.goalTitle}>Calories</Text>
            </View>
            <TextInput
              style={styles.goalInput}
              value={goals.dailyCalories.toString()}
              onChangeText={(value) => updateGoal('dailyCalories', value)}
              keyboardType="numeric"
              placeholder="2200"
            />
            <Text style={styles.goalUnit}>kcal per day</Text>
          </View>

          <View style={styles.goalCard}>
            <View style={styles.goalHeader}>
              <Ionicons name="fitness" size={20} color="#2196F3" />
              <Text style={styles.goalTitle}>Protein</Text>
            </View>
            <TextInput
              style={styles.goalInput}
              value={goals.dailyProtein.toString()}
              onChangeText={(value) => updateGoal('dailyProtein', value)}
              keyboardType="numeric"
              placeholder="80"
            />
            <Text style={styles.goalUnit}>grams per day</Text>
          </View>

          <View style={styles.goalCard}>
            <View style={styles.goalHeader}>
              <Ionicons name="leaf" size={20} color="#4CAF50" />
              <Text style={styles.goalTitle}>Carbohydrates</Text>
            </View>
            <TextInput
              style={styles.goalInput}
              value={goals.dailyCarbs.toString()}
              onChangeText={(value) => updateGoal('dailyCarbs', value)}
              keyboardType="numeric"
              placeholder="275"
            />
            <Text style={styles.goalUnit}>grams per day</Text>
          </View>

          <View style={styles.goalCard}>
            <View style={styles.goalHeader}>
              <Ionicons name="water" size={20} color="#FF9800" />
              <Text style={styles.goalTitle}>Fat</Text>
            </View>
            <TextInput
              style={styles.goalInput}
              value={goals.dailyFat.toString()}
              onChangeText={(value) => updateGoal('dailyFat', value)}
              keyboardType="numeric"
              placeholder="73"
            />
            <Text style={styles.goalUnit}>grams per day</Text>
          </View>

          <View style={styles.goalCard}>
            <View style={styles.goalHeader}>
              <Ionicons name="nutrition" size={20} color="#9C27B0" />
              <Text style={styles.goalTitle}>Fiber</Text>
            </View>
            <TextInput
              style={styles.goalInput}
              value={goals.dailyFiber.toString()}
              onChangeText={(value) => updateGoal('dailyFiber', value)}
              keyboardType="numeric"
              placeholder="25"
            />
            <Text style={styles.goalUnit}>grams per day</Text>
          </View>
        </View>

        {/* Lifestyle Goals */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Lifestyle Goals</Text>

          <View style={styles.goalCard}>
            <View style={styles.goalHeader}>
              <Ionicons name="cafe" size={20} color="#2196F3" />
              <Text style={styles.goalTitle}>Water Intake</Text>
            </View>
            <TextInput
              style={styles.goalInput}
              value={goals.waterGlasses.toString()}
              onChangeText={(value) => updateGoal('waterGlasses', value)}
              keyboardType="numeric"
              placeholder="8"
            />
            <Text style={styles.goalUnit}>glasses per day</Text>
          </View>

          <View style={styles.goalCard}>
            <View style={styles.goalHeader}>
              <Ionicons name="walk" size={20} color="#4CAF50" />
              <Text style={styles.goalTitle}>Daily Steps</Text>
            </View>
            <TextInput
              style={styles.goalInput}
              value={goals.dailySteps ? goals.dailySteps.toString() : '10000'}
              onChangeText={(value) => updateGoal('dailySteps', value)}
              keyboardType="numeric"
              placeholder="10000"
            />
            <Text style={styles.goalUnit}>steps per day</Text>
          </View>

          <View style={styles.goalCard}>
            <View style={styles.goalHeader}>
              <Ionicons name="restaurant" size={20} color="#FF6B35" />
              <Text style={styles.goalTitle}>Meals</Text>
            </View>
            <TextInput
              style={styles.goalInput}
              value={goals.mealsPerDay.toString()}
              onChangeText={(value) => updateGoal('mealsPerDay', value)}
              keyboardType="numeric"
              placeholder="4"
            />
            <Text style={styles.goalUnit}>meals per day</Text>
          </View>
        </View>

        {/* Tips */}
        <View style={styles.section}>
          <View style={styles.tipCard}>
            <Ionicons name="bulb" size={20} color="#FF9800" />
            <Text style={styles.tipText}>
              Goals are personalized based on your activity level, age, and fitness objectives.
              Smart notifications will help you stay consistent with your nutrition tracking.
            </Text>
          </View>
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
  },
  loadingGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: 'white',
    marginTop: 16,
  },
  header: {
    paddingTop: 44,
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  saveButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  saveButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    marginTop: -10,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    marginTop: 16,
  },

  // 🔔 NEW: Notification Styles
  notificationCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    elevation: 4,
    shadowColor: '#FF9800',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  notificationIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFF3E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  notificationDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  switch: {
    transform: [{ scaleX: 1.1 }, { scaleY: 1.1 }],
  },
  notificationTimes: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
  },
  timesTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  timesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  timeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '48%',
    marginBottom: 8,
  },
  timeText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
  },

  // Existing styles continue...
  presetGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  presetButton: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  presetTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  presetCalories: {
    fontSize: 12,
    color: '#666',
  },
  goalCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  goalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
  },
  goalInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  goalUnit: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  tipCard: {
    backgroundColor: '#FFF3E0',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  tipText: {
    fontSize: 14,
    color: '#E65100',
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
  bottomSpacing: {
    height: 20,
  },
});

export default GoalSettingScreen;
