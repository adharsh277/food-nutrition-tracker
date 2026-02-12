import AsyncStorage from '@react-native-async-storage/async-storage';
import NotificationService from './notificationService';

class UserDataService {
  constructor() {
    this.currentUserId = null;

    // Base storage keys (will be prefixed with user ID)
    this.BASE_KEYS = {
      USER_GOALS: 'user_goals',
      DAILY_INTAKE: 'daily_intake_',
      RECENT_SCANS: 'recent_scans',
      USER_PROFILE: 'user_profile'
    };

    // Legacy keys (for migration)
    this.LEGACY_KEYS = {
      USER_GOALS: 'user_goals',
      DAILY_INTAKE: 'daily_intake_',
      RECENT_SCANS: 'recent_scans',
      USER_PROFILE: 'user_profile'
    };
  }

  // === USER CONTEXT MANAGEMENT ===

  /**
   * Set the current user ID for namespaced storage
   */
  setCurrentUserId(userId) {
    console.log('📦 UserDataService: Setting user context to:', userId);
    this.currentUserId = userId;
  }

  /**
   * Clear user context (called on logout)
   */
  clearUserContext() {
    console.log('📦 UserDataService: Clearing user context');
    this.currentUserId = null;
  }

  /**
   * Get namespaced storage key for current user
   */
  getKey(baseKey) {
    if (this.currentUserId) {
      return `user_${this.currentUserId}_${baseKey}`;
    }
    // Fallback to legacy key if no user context
    return baseKey;
  }

  /**
   * Migrate legacy non-namespaced data to namespaced format
   * Called on first login after update
   */
  async migrateToNamespacedStorage(userId) {
    try {
      console.log('📦 UserDataService: Checking for data migration...');

      // Check if migration was already done for this user
      const migrationKey = `migration_done_${userId}`;
      const alreadyMigrated = await AsyncStorage.getItem(migrationKey);

      if (alreadyMigrated) {
        console.log('📦 UserDataService: Migration already done');
        return;
      }

      // Check for legacy data
      const legacyGoals = await AsyncStorage.getItem(this.LEGACY_KEYS.USER_GOALS);
      const legacyProfile = await AsyncStorage.getItem(this.LEGACY_KEYS.USER_PROFILE);
      const legacyScans = await AsyncStorage.getItem(this.LEGACY_KEYS.RECENT_SCANS);

      let migrated = false;

      // Migrate goals
      if (legacyGoals) {
        const namespacedKey = `user_${userId}_${this.BASE_KEYS.USER_GOALS}`;
        const existingNamespaced = await AsyncStorage.getItem(namespacedKey);
        if (!existingNamespaced) {
          await AsyncStorage.setItem(namespacedKey, legacyGoals);
          console.log('📦 UserDataService: Migrated goals');
          migrated = true;
        }
      }

      // Migrate profile
      if (legacyProfile) {
        const namespacedKey = `user_${userId}_${this.BASE_KEYS.USER_PROFILE}`;
        const existingNamespaced = await AsyncStorage.getItem(namespacedKey);
        if (!existingNamespaced) {
          await AsyncStorage.setItem(namespacedKey, legacyProfile);
          console.log('📦 UserDataService: Migrated profile');
          migrated = true;
        }
      }

      // Migrate recent scans
      if (legacyScans) {
        const namespacedKey = `user_${userId}_${this.BASE_KEYS.RECENT_SCANS}`;
        const existingNamespaced = await AsyncStorage.getItem(namespacedKey);
        if (!existingNamespaced) {
          await AsyncStorage.setItem(namespacedKey, legacyScans);
          console.log('📦 UserDataService: Migrated recent scans');
          migrated = true;
        }
      }

      // Migrate daily intake (try last 7 days)
      for (let i = 0; i < 7; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const legacyKey = this.LEGACY_KEYS.DAILY_INTAKE + dateStr;
        const legacyIntake = await AsyncStorage.getItem(legacyKey);

        if (legacyIntake) {
          const namespacedKey = `user_${userId}_${this.BASE_KEYS.DAILY_INTAKE}${dateStr}`;
          const existingNamespaced = await AsyncStorage.getItem(namespacedKey);
          if (!existingNamespaced) {
            await AsyncStorage.setItem(namespacedKey, legacyIntake);
            console.log(`📦 UserDataService: Migrated daily intake for ${dateStr}`);
            migrated = true;
          }
        }
      }

      if (migrated) {
        console.log('📦 UserDataService: Migration complete!');
      }

      // Mark migration as done
      await AsyncStorage.setItem(migrationKey, 'true');

    } catch (error) {
      console.error('📦 UserDataService: Migration error:', error);
    }
  }

  /**
   * Clear ALL data for current user only
   * Called from "Clear My Data" button
   */
  async clearCurrentUserData() {
    try {
      if (!this.currentUserId) {
        console.log('📦 UserDataService: No user context, cannot clear');
        return false;
      }

      console.log('📦 UserDataService: Clearing all data for user:', this.currentUserId);

      // Get all keys and filter for current user's namespace
      const allKeys = await AsyncStorage.getAllKeys();
      const userPrefix = `user_${this.currentUserId}_`;
      const userKeys = allKeys.filter(key => key.startsWith(userPrefix));

      if (userKeys.length > 0) {
        await AsyncStorage.multiRemove(userKeys);
        console.log(`📦 UserDataService: Cleared ${userKeys.length} keys`);
      }

      // Also clear the migration flag so fresh data works correctly
      await AsyncStorage.removeItem(`migration_done_${this.currentUserId}`);

      return true;
    } catch (error) {
      console.error('📦 UserDataService: Error clearing user data:', error);
      return false;
    }
  }

  /**
   * @deprecated Use clearCurrentUserData() instead
   */
  async clearAllData() {
    console.log('📦 UserDataService: clearAllData() is deprecated, use clearCurrentUserData()');
    return this.clearCurrentUserData();
  }

  // === USER GOALS ===
  async getUserGoals() {
    try {
      const key = this.getKey(this.BASE_KEYS.USER_GOALS);
      const goals = await AsyncStorage.getItem(key);
      return goals ? JSON.parse(goals) : {
        dailyCalories: 2200,
        dailyProtein: 80,
        dailyCarbs: 275,
        dailyFat: 73,
        dailyFiber: 25,
        waterGlasses: 8,
        mealsPerDay: 4,
        dailySteps: 10000
      };
    } catch (error) {
      console.error('Error loading user goals:', error);
      return null;
    }
  }

  async saveUserGoals(goals) {
    try {
      const key = this.getKey(this.BASE_KEYS.USER_GOALS);
      await AsyncStorage.setItem(key, JSON.stringify(goals));
      return true;
    } catch (error) {
      console.error('Error saving user goals:', error);
      return false;
    }
  }

  // === DAILY INTAKE TRACKING ===
  getDailyIntakeKey(date = new Date()) {
    const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
    return this.getKey(this.BASE_KEYS.DAILY_INTAKE + dateStr);
  }

  async getDailyIntake(date = new Date()) {
    try {
      const key = this.getDailyIntakeKey(date);
      const intake = await AsyncStorage.getItem(key);
      return intake ? JSON.parse(intake) : {
        breakfast: [],
        lunch: [],
        snacks: [],
        dinner: [],
        totalNutrition: {
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0,
          fiber: 0,
          sodium: 0,
          iron: 0,
          calcium: 0,
          vitaminC: 0
        },
        waterGlasses: 0,
        date: date.toISOString().split('T')[0]
      };
    } catch (error) {
      console.error('Error loading daily intake:', error);
      return null;
    }
  }

  async addFoodToMeal(foodData, mealType, date = new Date()) {
    try {
      const dailyIntake = await this.getDailyIntake(date);

      // Add food to specific meal
      if (!dailyIntake[mealType]) {
        dailyIntake[mealType] = [];
      }

      const foodEntry = {
        ...foodData,
        timestamp: new Date().toISOString(),
        id: Date.now().toString()
      };

      dailyIntake[mealType].push(foodEntry);

      // Recalculate total nutrition
      dailyIntake.totalNutrition = this.calculateTotalNutrition(dailyIntake);

      // Save updated data
      const key = this.getDailyIntakeKey(date);
      await AsyncStorage.setItem(key, JSON.stringify(dailyIntake));

      // Also update recent scans
      await this.addToRecentScans(foodEntry);

      // 🔧 FIXED: Safe notification calls with error handling
      try {
        if (NotificationService && typeof NotificationService.sendMealCompletionNotification === 'function') {
          await NotificationService.sendMealCompletionNotification(mealType, foodData.nutrition);
        }
      } catch (notificationError) {
        console.log('Note: Notification not sent (development mode or error):', notificationError.message);
      }

      // 🔧 FIXED: Safe goal check
      try {
        await this.checkGoalAchievements(dailyIntake.totalNutrition);
      } catch (goalError) {
        console.log('Note: Goal check skipped:', goalError.message);
      }

      return dailyIntake;
    } catch (error) {
      console.error('Error adding food to meal:', error);
      return null;
    }
  }

  // 🔧 UPDATED: Safe goal achievements check
  async checkGoalAchievements(totalNutrition) {
    try {
      const goals = await this.getUserGoals();
      if (!goals) return;

      // Skip notifications in development mode
      if (__DEV__) {
        console.log('🎯 Goal check (dev mode):', {
          calories: `${Math.round((totalNutrition.calories / goals.dailyCalories) * 100)}%`,
          protein: `${Math.round((totalNutrition.protein / goals.dailyProtein) * 100)}%`
        });
        return;
      }

      // Check if NotificationService methods exist
      if (!NotificationService || typeof NotificationService.sendGoalNotification !== 'function') {
        console.log('Note: Goal notifications not available');
        return;
      }

      // Check calorie goal
      if (totalNutrition.calories >= goals.dailyCalories * 0.9 && totalNutrition.calories <= goals.dailyCalories * 1.1) {
        await NotificationService.sendGoalNotification(
          'calorie_goal',
          `Perfect! You've reached ${Math.round((totalNutrition.calories / goals.dailyCalories) * 100)}% of your calorie goal.`
        );
      }

      // Check protein goal
      if (totalNutrition.protein >= goals.dailyProtein) {
        await NotificationService.sendGoalNotification(
          'protein_goal',
          `Excellent! You've hit your protein target with ${totalNutrition.protein}g.`
        );
      }

      // Check if over calories
      if (totalNutrition.calories > goals.dailyCalories * 1.2) {
        await NotificationService.sendGoalNotification(
          'over_calories',
          `You've exceeded your calorie goal by ${Math.round(totalNutrition.calories - goals.dailyCalories)} calories.`
        );
      }

      // Check daily completion
      const caloriePercent = (totalNutrition.calories / goals.dailyCalories) * 100;
      const proteinPercent = (totalNutrition.protein / goals.dailyProtein) * 100;

      if (caloriePercent >= 90 && proteinPercent >= 90) {
        await NotificationService.sendGoalNotification(
          'daily_complete',
          'Amazing! You\'ve completed your daily nutrition goals. Keep it up!'
        );
      }

    } catch (error) {
      console.error('Error checking goal achievements:', error);
    }
  }

  calculateTotalNutrition(dailyIntake) {
    const total = {
      calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0,
      sodium: 0, iron: 0, calcium: 0, vitaminC: 0
    };

    ['breakfast', 'lunch', 'snacks', 'dinner'].forEach(mealType => {
      if (dailyIntake[mealType]) {
        dailyIntake[mealType].forEach(food => {
          if (food.nutrition) {
            Object.keys(total).forEach(key => {
              total[key] += food.nutrition[key] || 0;
            });
          }
        });
      }
    });

    // Round values
    Object.keys(total).forEach(key => {
      if (key === 'calories' || key === 'sodium' || key === 'calcium') {
        total[key] = Math.round(total[key]);
      } else {
        total[key] = Math.round(total[key] * 10) / 10;
      }
    });

    return total;
  }

  async updateWaterIntake(glasses, date = new Date()) {
    try {
      const dailyIntake = await this.getDailyIntake(date);
      dailyIntake.waterGlasses = glasses;

      const key = this.getDailyIntakeKey(date);
      await AsyncStorage.setItem(key, JSON.stringify(dailyIntake));
      return dailyIntake;
    } catch (error) {
      console.error('Error updating water intake:', error);
      return null;
    }
  }

  // === RECENT SCANS ===
  async getRecentScans(limit = 10) {
    try {
      const key = this.getKey(this.BASE_KEYS.RECENT_SCANS);
      const scans = await AsyncStorage.getItem(key);
      const recentScans = scans ? JSON.parse(scans) : [];
      return recentScans.slice(0, limit);
    } catch (error) {
      console.error('Error loading recent scans:', error);
      return [];
    }
  }

  async addToRecentScans(foodData) {
    try {
      const recentScans = await this.getRecentScans(50); // Keep max 50

      const scanEntry = {
        ...foodData,
        scannedAt: new Date().toISOString(),
        id: Date.now().toString()
      };

      // Add to beginning of array
      recentScans.unshift(scanEntry);

      // Keep only last 50 scans
      const updatedScans = recentScans.slice(0, 50);

      const key = this.getKey(this.BASE_KEYS.RECENT_SCANS);
      await AsyncStorage.setItem(key, JSON.stringify(updatedScans));
      return updatedScans;
    } catch (error) {
      console.error('Error adding to recent scans:', error);
      return null;
    }
  }

  // === WEEKLY ANALYTICS ===
  async getWeeklyData(startDate = new Date()) {
    try {
      const weeklyData = [];
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() - 6); // Last 7 days

      for (let i = 0; i < 7; i++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() - i);

        const dailyIntake = await this.getDailyIntake(date);
        weeklyData.push({
          date: date.toISOString().split('T')[0],
          ...dailyIntake.totalNutrition,
          mealsCount: this.getMealsCount(dailyIntake)
        });
      }

      return weeklyData.reverse(); // Oldest to newest
    } catch (error) {
      console.error('Error loading weekly data:', error);
      return [];
    }
  }

  getMealsCount(dailyIntake) {
    let count = 0;
    ['breakfast', 'lunch', 'snacks', 'dinner'].forEach(mealType => {
      if (dailyIntake[mealType] && dailyIntake[mealType].length > 0) {
        count++;
      }
    });
    return count;
  }

  // === USER PROFILE ===
  async getUserProfile() {
    try {
      const key = this.getKey(this.BASE_KEYS.USER_PROFILE);
      const profile = await AsyncStorage.getItem(key);
      return profile ? JSON.parse(profile) : {
        name: 'User',
        age: 25,
        height: 170, // cm
        weight: 70,  // kg
        gender: 'male',
        activityLevel: 'moderate',
        goal: 'maintain' // maintain, lose, gain
      };
    } catch (error) {
      console.error('Error loading user profile:', error);
      return null;
    }
  }

  async saveUserProfile(profile) {
    try {
      const key = this.getKey(this.BASE_KEYS.USER_PROFILE);
      await AsyncStorage.setItem(key, JSON.stringify(profile));
      return true;
    } catch (error) {
      console.error('Error saving user profile:', error);
      return false;
    }
  }

  // 🔧 NEW: Calculate macros based on profile
  calculateTargetMacros(profile) {
    try {
      // Mifflin-St Jeor Equation
      let bmr;
      if (profile.gender.toLowerCase() === 'male') {
        bmr = 10 * profile.weight + 6.25 * profile.height - 5 * profile.age + 5;
      } else {
        bmr = 10 * profile.weight + 6.25 * profile.height - 5 * profile.age - 161;
      }

      const activityMultipliers = {
        'sedentary': 1.2,
        'lightly active': 1.375,
        'moderately active': 1.55,
        'very active': 1.725,
        'super active': 1.9
      };

      const levelKey = profile.activityLevel.toLowerCase();
      const multiplier = activityMultipliers[levelKey] || 1.2;

      let tdee = bmr * multiplier;

      // Goal Adjustment
      const goalKey = profile.goal.toLowerCase();
      if (goalKey.includes('lose')) tdee -= 500;
      else if (goalKey.includes('gain')) tdee += 300; // Moderate surplus

      // Ensure safe minimum
      if (tdee < 1400) tdee = 1400;

      const calories = Math.round(tdee);
      const weight = parseFloat(profile.weight);

      // 🧠 Scientific Macro Split (Protein based on Body Weight)
      // Protein: 2.2g per kg (approx 1g per lb) - Optimal for building muscle
      const proteinGrams = Math.round(weight * 2.2);

      // Fat: 25% of Total Calories (Healthy Hormone Levels)
      const fatGrams = Math.round((calories * 0.25) / 9);

      // Carbs: Remainder (Energy for training)
      const consumedCals = (proteinGrams * 4) + (fatGrams * 9);
      const remainingCals = calories - consumedCals;
      const carbsGrams = Math.round(remainingCals / 4);

      return {
        dailyCalories: calories,
        dailyProtein: proteinGrams,
        dailyCarbs: carbsGrams,
        dailyFat: fatGrams,
        dailyFiber: 30,
        waterGlasses: 8,
        mealsPerDay: 4,
        dailySteps: 10000
      };
    } catch (error) {
      console.error('Error calculating macros:', error);
      return null;
    }
  }

  // 🔧 NEW: Update profile AND recalculate goals
  async updateProfileAndRecalculateGoals(profile) {
    try {
      // 1. Save Profile
      const saved = await this.saveUserProfile(profile);
      if (!saved) return false;

      // 2. Calculate New Goals
      const newGoals = this.calculateTargetMacros(profile);

      // 3. Save New Goals
      if (newGoals) {
        await this.saveUserGoals(newGoals);
      }

      return { success: true, goals: newGoals };
    } catch (error) {
      console.error('Error updating profile and goals:', error);
      return { success: false };
    }
  }

  // === UTILITIES ===
  getTimeBasedGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return '🌅 Good Morning';
    if (hour < 17) return '☀️ Good Afternoon';
    if (hour < 21) return '🌆 Good Evening';
    return '🌙 Good Night';
  }

  getMealTimeFromHour() {
    const hour = new Date().getHours();
    if (hour < 10) return 'breakfast';
    if (hour < 14) return 'lunch';
    if (hour < 18) return 'snacks';
    return 'dinner';
  }

  async getDailyLogs(token, startDate, endDate) {
    try {
      const API_URL = process.env.EXPO_PUBLIC_API_BASE_URL;
      let url = `${API_URL}/api/users/daily-log`;

      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const queryString = params.toString();
      if (queryString) url += `?${queryString}`;

      console.log('🔍 Fetching daily logs from:', url);

      if (token) {
        // Add timeout controller
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          console.log('✅ Logs fetch success, count:', data.length);
          return data;
        } else {
          console.log('⚠️ Logs fetch failed status:', response.status);
        }
      }
      return [];
    } catch (error) {
      console.error('Error fetching daily logs:', error);
      return [];
    }
  }

  // 🔧 NEW: Sync local daily stats to backend
  async syncDailyLog(dailyStats, steps = 0) {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) return;

      const API_URL = process.env.EXPO_PUBLIC_API_BASE_URL;
      const { totalNutrition, date } = dailyStats;

      const logData = {
        date: date || new Date().toISOString().split('T')[0],
        caloriesConsumed: totalNutrition.calories,
        caloriesBurned: Math.round(steps * 0.04), // simple estimate
        steps: steps,
        waterIntake: dailyStats.waterGlasses || 0,
        macrosConsumed: {
          protein: totalNutrition.protein,
          carbs: totalNutrition.carbs,
          fat: totalNutrition.fat
        }
      };

      await fetch(`${API_URL}/api/users/daily-log`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(logData)
      });

      console.log('✅ Synced daily log to backend');
    } catch (error) {
      console.error('❌ Failed to sync daily log:', error);
    }
  }
}

export default new UserDataService();
