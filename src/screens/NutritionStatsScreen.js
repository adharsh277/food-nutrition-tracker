import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
  Alert,
  Platform,
  ActivityIndicator,
  Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker'; // 🔧 NEW IMPORT
import UserDataService from '../services/userDataService';
import PDFExportService from '../services/PDFExportService';
import StepTracker from '../services/StepTrackerService';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext'; // 🔧 Already imported

const { width } = Dimensions.get('window');

const NutritionStatsScreen = ({ navigation }) => {
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('today'); // today, week, month
  const [weeklyData, setWeeklyData] = useState([]);
  const [loading, setLoading] = useState(false); // Changed: no longer main loading state

  // 🔧 UPDATED: Use DataContext for real-time data
  const {
    dailyStats,
    userGoals,
    loading: dataLoading,
    refreshData
  } = useData();

  const { token, user } = useAuth();
  const [exporting, setExporting] = useState(false);

  // Custom Date Picker State
  const [showPicker, setShowPicker] = useState(false);
  const [pickerMode, setPickerMode] = useState('start'); // 'start' or 'end'
  const [customRange, setCustomRange] = useState({ start: new Date(), end: new Date() });

  // 🔧 UPDATED: handleExport now takes specific dates OR default to calculation
  const handleExport = async (startDate, endDate, label) => {
    console.log('📄 Export started for:', label);
    try {
      setExporting(true);
      // Ensure dates are string formatted YYYY-MM-DD
      const startStr = startDate.toISOString().split('T')[0];
      const endStr = endDate.toISOString().split('T')[0];

      console.log('📅 Fetching logs from:', startStr, 'to', endStr);
      const logs = await UserDataService.getDailyLogs(token, startStr, endStr);
      console.log('✅ Logs fetched:', logs?.length || 0);

      if (!logs || logs.length === 0) {
        console.log('⚠️ No data found');
        Alert.alert('No Data', 'No data found for the selected range.');
        return;
      }

      console.log('🖨️ Generating PDF...');
      await PDFExportService.generateAndSharePDF(
        user,
        logs,
        label || `${startStr} to ${endStr}`
      );
      console.log('✅ PDF Shared');

    } catch (error) {
      console.error('❌ Export Error:', error);
      Alert.alert('Export Failed', 'Could not generate PDF.');
    } finally {
      console.log('🏁 Export finished, resetting state');
      setExporting(false);
    }
  };

  const onDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || (pickerMode === 'start' ? customRange.start : customRange.end);

    // Close picker first (Android behavior mostly)
    setShowPicker(Platform.OS === 'ios');

    if (event.type === 'dismissed') {
      setShowPicker(false);
      return;
    }

    if (pickerMode === 'start') {
      setCustomRange(prev => ({ ...prev, start: currentDate }));
      // Automatically open end date picker for smoother UX on Android? 
      // Or simplify: just set start, checking user intent. 
      // Let's cycle: Pick Start -> Pick End -> Export.
      if (Platform.OS === 'android') {
        setTimeout(() => {
          setPickerMode('end');
          setShowPicker(true);
        }, 500); // slight delay
      } else {
        setPickerMode('end'); // iOS stays open? or requires modal
      }
    } else {
      // Mode is END
      setCustomRange(prev => ({ ...prev, end: currentDate }));
      setShowPicker(false);

      // Trigger export after end date selected
      // Using timeout to allow state to settle
      setTimeout(() => {
        // Validate
        let start = pickerMode === 'start' ? currentDate : customRange.start; // fallback
        let end = currentDate;

        if (end < start) {
          Alert.alert('Invalid Range', 'End date cannot be before start date.');
          return;
        }
        handleExport(start, end, 'Custom Range');
      }, 500);
    }
  };

  const startCustomExport = () => {
    setPickerMode('start');
    setShowPicker(true);
  };

  const [exportModalVisible, setExportModalVisible] = useState(false);

  // ... (keep existing handleExport and custom export logic)

  // New Export Options Modal
  const ExportOptionsModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={exportModalVisible}
      onRequestClose={() => setExportModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Export Data</Text>
          <Text style={styles.modalSubtitle}>Choose a range for your PDF report:</Text>

          <TouchableOpacity
            style={styles.modalOption}
            onPress={() => {
              setExportModalVisible(false);
              handleExport(new Date(), new Date(), 'Today');
            }}
          >
            <Ionicons name="today-outline" size={24} color="#333" />
            <Text style={styles.modalOptionText}>Today</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.modalOption}
            onPress={() => {
              setExportModalVisible(false);
              const end = new Date();
              const start = new Date();
              start.setDate(end.getDate() - 7);
              handleExport(start, end, 'Last 7 Days');
            }}
          >
            <Ionicons name="calendar-outline" size={24} color="#333" />
            <Text style={styles.modalOptionText}>Last 7 Days</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.modalOption}
            onPress={() => {
              setExportModalVisible(false);
              const end = new Date();
              const start = new Date();
              start.setDate(end.getDate() - 30);
              handleExport(start, end, 'Last 30 Days');
            }}
          >
            <Ionicons name="calendar-number-outline" size={24} color="#333" />
            <Text style={styles.modalOptionText}>Last 30 Days</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.modalOption}
            onPress={() => {
              setExportModalVisible(false);
              setTimeout(() => startCustomExport(), 500); // Wait for modal to close
            }}
          >
            <Ionicons name="create-outline" size={24} color="#333" />
            <Text style={styles.modalOptionText}>Custom Range</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.modalOption, styles.cancelOption]}
            onPress={() => setExportModalVisible(false)}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  useEffect(() => {
    // Only load weekly data when needed, today's data comes from context
    if (selectedPeriod === 'week') {
      loadWeeklyData();
    }
  }, [selectedPeriod]);

  // 🔧 UPDATED: Only load weekly data separately
  const loadWeeklyData = async () => {
    try {
      setLoading(true);
      const weekly = await UserDataService.getWeeklyData();
      setWeeklyData(weekly);
    } catch (error) {
      console.error('Error loading weekly stats:', error);
    } finally {
      setLoading(false);
    }
  };

  // 🔧 UPDATED: Use context refresh for today, load weekly if needed
  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);

    // Always refresh context data
    await refreshData();

    // Also refresh weekly data if that's the selected period
    if (selectedPeriod === 'week') {
      await loadWeeklyData();
    }

    setRefreshing(false);
  }, [selectedPeriod, refreshData]);

  const getProgressPercentage = (current, target) => {
    return Math.min((current / target) * 100, 100);
  };

  const getProgressColor = (percentage) => {
    if (percentage >= 90) return '#4CAF50';
    if (percentage >= 70) return '#FF9800';
    return '#F44336';
  };

  // 🔧 UPDATED: Use dailyStats from context instead of todayData
  const renderTodayStats = () => {
    if (!dailyStats || !userGoals) return null;

    const { totalNutrition } = dailyStats;

    return (
      <View>
        {/* Macro Overview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today's Macros</Text>
          <View style={styles.macroGrid}>
            {/* Calories */}
            <View style={styles.macroCard}>
              <View style={styles.macroIcon}>
                <Ionicons name="flame" size={24} color="#FF6B35" />
              </View>
              <Text style={styles.macroValue}>{totalNutrition.calories}</Text>
              <Text style={styles.macroTarget}>/ {userGoals.dailyCalories}</Text>
              <Text style={styles.macroLabel}>Calories</Text>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${getProgressPercentage(totalNutrition.calories, userGoals.dailyCalories)}%`,
                      backgroundColor: getProgressColor(getProgressPercentage(totalNutrition.calories, userGoals.dailyCalories))
                    }
                  ]}
                />
              </View>
            </View>

            {/* Protein */}
            <View style={styles.macroCard}>
              <View style={styles.macroIcon}>
                <Ionicons name="fitness" size={24} color="#2196F3" />
              </View>
              <Text style={styles.macroValue}>{totalNutrition.protein}g</Text>
              <Text style={styles.macroTarget}>/ {userGoals.dailyProtein}g</Text>
              <Text style={styles.macroLabel}>Protein</Text>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${getProgressPercentage(totalNutrition.protein, userGoals.dailyProtein)}%`,
                      backgroundColor: getProgressColor(getProgressPercentage(totalNutrition.protein, userGoals.dailyProtein))
                    }
                  ]}
                />
              </View>
            </View>

            {/* Carbs */}
            <View style={styles.macroCard}>
              <View style={styles.macroIcon}>
                <Ionicons name="leaf" size={24} color="#4CAF50" />
              </View>
              <Text style={styles.macroValue}>{totalNutrition.carbs}g</Text>
              <Text style={styles.macroTarget}>/ {userGoals.dailyCarbs}g</Text>
              <Text style={styles.macroLabel}>Carbs</Text>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${getProgressPercentage(totalNutrition.carbs, userGoals.dailyCarbs)}%`,
                      backgroundColor: getProgressColor(getProgressPercentage(totalNutrition.carbs, userGoals.dailyCarbs))
                    }
                  ]}
                />
              </View>
            </View>

            {/* Fat */}
            <View style={styles.macroCard}>
              <View style={styles.macroIcon}>
                <Ionicons name="water" size={24} color="#FF9800" />
              </View>
              <Text style={styles.macroValue}>{totalNutrition.fat}g</Text>
              <Text style={styles.macroTarget}>/ {userGoals.dailyFat}g</Text>
              <Text style={styles.macroLabel}>Fat</Text>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${getProgressPercentage(totalNutrition.fat, userGoals.dailyFat)}%`,
                      backgroundColor: getProgressColor(getProgressPercentage(totalNutrition.fat, userGoals.dailyFat))
                    }
                  ]}
                />
              </View>
            </View>
          </View>
        </View>

        {/* Meals Breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Meals Today</Text>
          {['breakfast', 'lunch', 'snacks', 'dinner'].map(mealType => (
            <View key={mealType} style={styles.mealCard}>
              <View style={styles.mealHeader}>
                <Text style={styles.mealTitle}>
                  {mealType.charAt(0).toUpperCase() + mealType.slice(1)}
                </Text>
                <Text style={styles.mealCount}>
                  {dailyStats[mealType]?.length || 0} item{(dailyStats[mealType]?.length || 0) !== 1 ? 's' : ''}
                </Text>
              </View>

              {dailyStats[mealType]?.map((food, index) => (
                <View key={food.id || index} style={styles.foodItem}>
                  <Text style={styles.foodName}>{food.foodName}</Text>
                  <Text style={styles.foodCalories}>{food.nutrition?.calories || 0} cal</Text>
                </View>
              ))}

              {(!dailyStats[mealType] || dailyStats[mealType].length === 0) && (
                <Text style={styles.emptyMeal}>No food logged yet</Text>
              )}
            </View>
          ))}
        </View>



        <View style={styles.updateIndicator}>
          <Ionicons name="sync" size={16} color="#4CAF50" />
          <Text style={styles.updateText}>Data updates in real-time</Text>
        </View>

        {showPicker && (
          <DateTimePicker
            value={pickerMode === 'start' ? customRange.start : customRange.end}
            mode="date"
            display="default"
            onChange={onDateChange}
            maximumDate={new Date()}
          />
        )}
      </View>
    );
  };

  const renderWeeklyStats = () => {
    if (weeklyData.length === 0) return null;

    const weeklyAvg = {
      calories: Math.round(weeklyData.reduce((sum, day) => sum + day.calories, 0) / weeklyData.length),
      protein: Math.round(weeklyData.reduce((sum, day) => sum + day.protein, 0) / weeklyData.length * 10) / 10,
      mealsCount: Math.round(weeklyData.reduce((sum, day) => sum + day.mealsCount, 0) / weeklyData.length * 10) / 10
    };

    return (
      <View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Weekly Overview</Text>
          <View style={styles.weeklyGrid}>
            <View style={styles.weeklyCard}>
              <Text style={styles.weeklyValue}>{weeklyAvg.calories}</Text>
              <Text style={styles.weeklyLabel}>Avg Calories/Day</Text>
            </View>
            <View style={styles.weeklyCard}>
              <Text style={styles.weeklyValue}>{weeklyAvg.protein}g</Text>
              <Text style={styles.weeklyLabel}>Avg Protein/Day</Text>
            </View>
            <View style={styles.weeklyCard}>
              <Text style={styles.weeklyValue}>{weeklyAvg.mealsCount}</Text>
              <Text style={styles.weeklyLabel}>Avg Meals/Day</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Daily Breakdown</Text>
          {weeklyData.map((dayData, index) => (
            <View key={dayData.date} style={styles.dayCard}>
              <Text style={styles.dayDate}>
                {new Date(dayData.date).toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric'
                })}
              </Text>
              <View style={styles.dayStats}>
                <Text style={styles.dayStat}>{dayData.calories} cal</Text>
                <Text style={styles.dayStat}>{dayData.protein}g protein</Text>
                <Text style={styles.dayStat}>{dayData.mealsCount} meals</Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  };

  // 🔧 UPDATED: Check both data loading and weekly loading
  const isLoading = dataLoading || (selectedPeriod === 'week' && loading);

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
          <Text style={styles.headerTitle}>Nutrition Stats</Text>
          <TouchableOpacity
            style={styles.headerRight}
            onPress={() => setExportModalVisible(true)}
            disabled={exporting}
          >
            {exporting ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Ionicons name="download-outline" size={24} color="white" />
            )}
          </TouchableOpacity>
        </View>

        {/* Period Selector */}
        <View style={styles.periodSelector}>
          {['today', 'week'].map(period => (
            <TouchableOpacity
              key={period}
              style={[
                styles.periodButton,
                selectedPeriod === period && styles.activePeriodButton
              ]}
              onPress={() => setSelectedPeriod(period)}
            >
              <Text style={[
                styles.periodButtonText,
                selectedPeriod === period && styles.activePeriodButtonText
              ]}>
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </LinearGradient>

      {/* Content */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <Ionicons name="analytics" size={48} color="#4CAF50" />
            <Text style={styles.loadingText}>Loading nutrition data...</Text>
          </View>
        ) : (
          <>
            {selectedPeriod === 'today' && renderTodayStats()}
            {selectedPeriod === 'week' && renderWeeklyStats()}
          </>
        )}

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Export Modal */}
      <ExportOptionsModal />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
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
    marginBottom: 20,
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
  headerRight: {
    width: 40,
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 25,
    marginHorizontal: 20,
    padding: 4,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 20,
  },
  activePeriodButton: {
    backgroundColor: 'white',
  },
  periodButtonText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '600',
  },
  activePeriodButtonText: {
    color: '#4CAF50',
  },
  content: {
    flex: 1,
    marginTop: -10,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
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
  },
  macroGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  macroCard: {
    width: '48%',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  macroIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  macroValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  macroTarget: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  macroLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: '#e0e0e0',
    borderRadius: 2,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  mealCard: {
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
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  mealTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  mealCount: {
    fontSize: 12,
    color: '#666',
  },
  foodItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  foodName: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  foodCalories: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4CAF50',
  },
  emptyMeal: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 8,
  },
  microGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  microItem: {
    width: '48%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  microValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  microLabel: {
    fontSize: 12,
    color: '#666',
  },
  weeklyGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  weeklyCard: {
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
  weeklyValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  weeklyLabel: {
    fontSize: 11,
    color: '#666',
    textAlign: 'center',
  },
  dayCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  dayDate: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  dayStats: {
    flexDirection: 'row',
  },
  dayStat: {
    fontSize: 12,
    color: '#666',
    marginLeft: 16,
  },
  // 🔧 NEW: Real-time update indicator styles
  updateIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8F5E8',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginHorizontal: 20,
    marginBottom: 16,
  },
  updateText: {
    fontSize: 12,
    color: '#4CAF50',
    marginLeft: 6,
    fontWeight: '500',
  },
  bottomSpacing: {
    height: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
    color: '#333',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalOptionText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 16,
    fontWeight: '500',
  },
  cancelOption: {
    borderBottomWidth: 0,
    marginTop: 10,
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
  },
  cancelText: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default NutritionStatsScreen;
