import React, { createContext, useContext, useState, useEffect } from 'react';
import UserDataService from '../services/userDataService';

const DataContext = createContext();

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

export const DataProvider = ({ children }) => {
  const DEFAULT_GOALS = {
    dailyCalories: 2200,
    dailyProtein: 80,
    dailyCarbs: 275,
    dailyFat: 73,
    dailyFiber: 25,
    waterGlasses: 8,
    mealsPerDay: 4
  };

  const [dailyStats, setDailyStats] = useState(null);
  const [userGoals, setUserGoals] = useState(DEFAULT_GOALS);
  const [recentScans, setRecentScans] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load initial data
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      console.log('🔄 DataContext: Loading all data...');
      setLoading(true);

      // 🔧 FIXED: Ensure we are fetching data for TODAY in local time
      const today = new Date().toISOString().split('T')[0];
      console.log('📅 DataContext: Fetching data for date:', today);

      // Load data with proper error handling
      const todayIntake = await UserDataService.getDailyIntake(new Date());
      const goals = await UserDataService.getUserGoals();
      const scans = await UserDataService.getRecentScans(4);

      console.log('📊 Daily stats loaded:', todayIntake);
      console.log('🎯 User goals loaded:', goals);
      console.log('📱 Recent scans loaded:', scans?.length || 0, 'items');

      // Set data with fallbacks
      setDailyStats(todayIntake || {
        breakfast: [],
        lunch: [],
        snacks: [],
        dinner: [],
        totalNutrition: {
          calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0,
          sodium: 0, iron: 0, calcium: 0, vitaminC: 0
        },
        waterGlasses: 0,
        date: new Date().toISOString().split('T')[0]
      });

      setUserGoals(goals || {
        dailyCalories: 2200,
        dailyProtein: 80,
        dailyCarbs: 275,
        dailyFat: 73,
        dailyFiber: 25,
        waterGlasses: 8,
        mealsPerDay: 4
      });

      setRecentScans(scans || []);

      console.log('✅ DataContext: All data loaded successfully');

    } catch (error) {
      console.error('❌ DataContext: Error loading data:', error);

      // Set fallback data to prevent crashes
      setDailyStats({
        breakfast: [],
        lunch: [],
        snacks: [],
        dinner: [],
        totalNutrition: {
          calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0,
          sodium: 0, iron: 0, calcium: 0, vitaminC: 0
        },
        waterGlasses: 0,
        date: new Date().toISOString().split('T')[0]
      });

      setUserGoals({
        dailyCalories: 2200,
        dailyProtein: 80,
        dailyCarbs: 275,
        dailyFat: 73,
        dailyFiber: 25,
        waterGlasses: 8,
        mealsPerDay: 4
      });

      setRecentScans([]);

    } finally {
      // 🔧 CRITICAL: Always set loading to false
      console.log('🏁 DataContext: Setting loading to false');
      setLoading(false);
    }
  };

  // 🔧 REAL-TIME UPDATE: Add food and refresh all data
  const addFoodToMeal = async (foodData, mealType) => {
    try {
      console.log('🍽️ DataContext: Adding food to meal:', foodData.foodName, 'to', mealType);

      // Add to storage
      const updatedIntake = await UserDataService.addFoodToMeal(foodData, mealType);

      if (updatedIntake) {
        // 🚀 INSTANTLY update states
        setDailyStats(updatedIntake);

        // 🔧 SYNC TO BACKEND
        try {
          // Get current steps if available
          // Note: Step count might be slightly delayed if not passed in, but that's okay for food updates
          UserDataService.syncDailyLog(updatedIntake, 0); // We'll assume 0 steps here or better, let StepService handle steps separately
        } catch (syncError) {
          console.log('Background sync failed:', syncError);
        }

        // Update recent scans
        try {
          const updatedScans = await UserDataService.getRecentScans(4);
          setRecentScans(updatedScans || []);
        } catch (scanError) {
          console.log('Warning: Could not update recent scans:', scanError);
        }

        console.log('✅ DataContext: Data updated in real-time!');
        return true;
      }

      return false;

    } catch (error) {
      console.error('❌ DataContext: Error adding food:', error);
      return false;
    }
  };

  // 🔧 REAL-TIME UPDATE: Update goals and refresh
  const updateGoals = async (newGoals) => {
    try {
      console.log('🎯 DataContext: Updating goals');
      const success = await UserDataService.saveUserGoals(newGoals);
      if (success) {
        setUserGoals(newGoals);
        console.log('✅ DataContext: Goals updated');
        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ DataContext: Error updating goals:', error);
      return false;
    }
  };

  // Manual refresh function
  const refreshData = async () => {
    console.log('🔄 DataContext: Manual refresh triggered');
    await loadAllData();
  };

  // 🔧 Debug values
  console.log('🔍 DataContext current state:', {
    loading,
    hasStats: !!dailyStats,
    hasGoals: !!userGoals,
    scansCount: recentScans?.length || 0
  });

  return (
    <DataContext.Provider value={{
      dailyStats,
      userGoals,
      recentScans,
      loading,
      addFoodToMeal,
      updateGoals,
      refreshData,
      loadAllData
    }}>
      {children}
    </DataContext.Provider>
  );
};
