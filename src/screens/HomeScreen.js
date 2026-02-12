import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Alert,
  Animated,
  RefreshControl,
  ActivityIndicator,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import UserDataService from '../services/userDataService';
import NotificationService from '../services/notificationService';
import StepTracker from '../services/StepTrackerService';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import FoodDetailsModal from '../components/FoodDetailsModal';

const { width, height } = Dimensions.get('window');

const HomeScreen = ({ navigation }) => {
  const [refreshing, setRefreshing] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Recommendation State
  const [recommendations, setRecommendations] = useState([]);
  const [recMealTime, setRecMealTime] = useState('');
  const [recLoading, setRecLoading] = useState(true);

  // Modal State
  const [selectedFood, setSelectedFood] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  const { token } = useAuth();

  const {
    dailyStats,
    userGoals,
    recentScans,
    loading,
    refreshData
  } = useData();

  // Animation values
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));

  // Step Tracking State
  const [steps, setSteps] = useState(0);

  useEffect(() => {
    // Step Tracker Init
    const initSteps = async () => {
      try {
        await StepTracker.init();

        // Start live tracking
        await StepTracker.startTracking((currentSteps) => {
          setSteps(currentSteps);
        });

        // Initial Sync with backend
        if (token) {
          StepTracker.syncWithBackend(null, token, Math.round(StepTracker.stepCount * 0.04));
        }

      } catch (e) {
        console.log("Step tracking init error", e);
      }
    };
    initSteps();

    // Cleanup
    // Cleanup handled at end of useEffect

    // Update time every minute
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    // Initial animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();

    // Check missed meals
    checkMissedMealsOnly();

    return () => {
      StepTracker.stopTracking();
      clearInterval(timer);
    };
  }, []);

  const checkMissedMealsOnly = async () => {
    try {
      await NotificationService.checkMissedMeals();
    } catch (error) {
      console.error('Error checking missed meals:', error);
    }
  };

  const fetchRecommendations = async () => {
    try {
      setRecLoading(true);
      const API_URL = process.env.EXPO_PUBLIC_API_BASE_URL;
      const localHour = new Date().getHours();
      const res = await fetch(`${API_URL}/api/food/recommendations?localHour=${localHour}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await res.json();
      // console.log('GET /api/food/recommendations status:', res.status);
      // console.log('GET /api/food/recommendations body:', data);

      if (res.ok) {
        setRecommendations(data.recommendations || []);
        setRecMealTime(data.mealTime || '');
      } else {
        // You can show message so you know what's wrong
        Alert.alert('Recommendations error', data.msg || 'Unable to fetch recommendations');
        setRecommendations([]);
      }
    } catch (error) {
      console.log('Error fetching recommendations:', error);
      Alert.alert('Network error', 'Unable to fetch recommendations');
    } finally {
      setRecLoading(false);
    }
  };


  useEffect(() => {
    if (token) fetchRecommendations();
  }, [token]);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refreshData(), fetchRecommendations()]);
    setRefreshing(false);
  }, [refreshData, token]);

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return '🌅 Good Morning';
    if (hour < 17) return '☀️ Good Afternoon';
    if (hour < 21) return '🌆 Good Evening';
    return '🌙 Good Night';
  };

  const getMealTime = () => {
    const hour = currentTime.getHours();
    if (hour < 10) return 'Breakfast Time';
    if (hour < 14) return 'Lunch Time';
    if (hour < 18) return 'Snack Time';
    if (hour < 22) return 'Dinner Time';
    return 'Late Night';
  };

  const getCalorieProgress = () => {
    if (!dailyStats || !userGoals) return 0;
    return (dailyStats.totalNutrition.calories / userGoals.dailyCalories) * 100;
  };

  const getProteinProgress = () => {
    if (!dailyStats || !userGoals) return 0;
    return (dailyStats.totalNutrition.protein / userGoals.dailyProtein) * 100;
  };

  const getTotalScannedMeals = () => {
    if (!dailyStats) return 0;
    return ['breakfast', 'lunch', 'snacks', 'dinner'].reduce((count, mealType) => {
      return count + (dailyStats[mealType]?.length || 0);
    }, 0);
  };

  const getOverallHealthScore = () => {
    if (!dailyStats || !userGoals) return 5;

    const calorieScore = Math.min(dailyStats.totalNutrition.calories / userGoals.dailyCalories, 1) * 3;
    const proteinScore = Math.min(dailyStats.totalNutrition.protein / userGoals.dailyProtein, 1) * 3;
    const fiberScore = Math.min(dailyStats.totalNutrition.fiber / (userGoals.dailyFiber || 25), 1) * 2;
    const mealScore = getTotalScannedMeals() >= 3 ? 2 : getTotalScannedMeals();

    return Math.round(calorieScore + proteinScore + fiberScore + mealScore);
  };

  const handleQuickScan = () => {
    navigation.navigate('Scanner');
  };

  const handleBrowseMenu = () => {
    navigation.navigate('FoodLocationsHub');
  };

  const handleViewProfile = () => {
    navigation.navigate('Profile');
  };

  const handleViewStats = () => {
    navigation.navigate('NutritionStats');
  };

  const handleSetGoals = () => {
    navigation.navigate('GoalSetting');
  };

  const handleDrawerOpen = () => {
    navigation.openDrawer();
  };

  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return 'Unknown';

    const now = new Date();
    const scanTime = new Date(timestamp);
    const diffInHours = Math.floor((now - scanTime) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return `${Math.floor(diffInHours / 24)}d ago`;
  };

  // Helper function for health score colors
  const getHealthColor = (score) => {
    if (score >= 8) return '#4CAF50';
    if (score >= 6) return '#FF9800';
    return '#F44336';
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient
          colors={['#4CAF50', '#45a049']}
          style={styles.loadingGradient}
        >
          <Ionicons name="nutrition" size={48} color="white" />
          <Text style={styles.loadingText}>Loading your nutrition data...</Text>
        </LinearGradient>
      </View>
    );
  }

  const handleFoodPress = (item) => {
    setSelectedFood(item);
    setModalVisible(true);
  };

  const handleAddMeal = async (item) => {
    try {
      // Determine meal type based on time
      const hour = new Date().getHours();
      let mealType = 'snacks';
      if (hour < 11) mealType = 'breakfast';
      else if (hour < 22) mealType = 'dinner';

      // 🔧 FIXED: Verify and map object structure if coming from recommendations
      const foodData = {
        ...item,
        foodName: item.foodName || item.name || item.startCaseName || 'Unknown Food'
      };

      await UserDataService.addFoodToMeal(foodData, mealType);
      await refreshData();

      Alert.alert('Success', `Added ${item.name} to your daily goals!`);
      setModalVisible(false);
    } catch (error) {
      console.error('Error adding meal:', error);
      Alert.alert('Error', 'Could not track meal');
    }
  };



  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4CAF50" />

      {/* Header with Gradient */}
      <LinearGradient
        colors={['#4CAF50', '#45a049', '#3d8b40']}
        style={styles.header}
      >
        <Animated.View
          style={[
            styles.headerContent,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <TouchableOpacity style={styles.drawerButton} onPress={handleDrawerOpen}>
            <Ionicons name="menu" size={24} color="white" />
          </TouchableOpacity>

          <View style={styles.greetingSection}>
            <Text style={styles.greetingText}>{getGreeting()}</Text>
            <Text style={styles.usernameText}>Welcome back! 👋</Text>
            <Text style={styles.mealTimeText}>{getMealTime()}</Text>
          </View>

          <TouchableOpacity style={styles.profileButton} onPress={handleViewProfile}>
            <View style={styles.profileAvatar}>
              <Ionicons name="person" size={24} color="#4CAF50" />
            </View>
          </TouchableOpacity>
        </Animated.View>

        {/* Daily Progress Cards */}
        <Animated.View
          style={[
            styles.progressSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <View style={styles.progressCardsContainer}>
            {/* Calories Progress */}
            <View style={[styles.progressCard, { backgroundColor: 'rgba(255,255,255,0.15)', flex: 1 }]}>
              <View style={styles.cardContent}>
                <View style={styles.cardHeader}>
                  <Ionicons name="flame" size={20} color="#FF6B35" />
                  <Text style={styles.cardTitle}>Calories</Text>
                </View>
                <Text style={styles.cardValue}>
                  {dailyStats?.totalNutrition.calories || 0}
                </Text>
                <Text style={styles.cardTarget}>
                  of {userGoals?.dailyCalories || 2200}
                </Text>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${Math.min(getCalorieProgress(), 100)}%`,
                        backgroundColor: getCalorieProgress() > 100 ? '#FF6B35' : '#4CAF50'
                      }
                    ]}
                  />
                </View>
                <Text style={styles.progressPercent}>
                  {Math.round(getCalorieProgress())}%
                </Text>
              </View>
            </View>

            {/* Spacer */}
            <View style={{ width: 12 }} />

            {/* Protein Progress */}
            <View style={[styles.progressCard, { backgroundColor: 'rgba(255,255,255,0.15)', flex: 1 }]}>
              <View style={styles.cardContent}>
                <View style={styles.cardHeader}>
                  <Ionicons name="fitness" size={20} color="#2196F3" />
                  <Text style={styles.cardTitle}>Protein</Text>
                </View>
                <Text style={styles.cardValue}>
                  {dailyStats?.totalNutrition.protein || 0}g
                </Text>
                <Text style={styles.cardTarget}>
                  of {userGoals?.dailyProtein || 80}g
                </Text>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${Math.min(getProteinProgress(), 100)}%`,
                        backgroundColor: getProteinProgress() > 100 ? '#FF6B35' : '#2196F3'
                      }
                    ]}
                  />
                </View>
                <Text style={styles.progressPercent}>
                  {Math.round(getProteinProgress())}%
                </Text>
              </View>
            </View>
          </View>
        </Animated.View>
      </LinearGradient>

      {/* Main Content */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Quick Actions */}
        <Animated.View
          style={[
            styles.section,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActions}>
            {/* AI Scan Button */}
            <TouchableOpacity style={styles.primaryAction} onPress={handleQuickScan}>
              <LinearGradient
                colors={['#FF6B35', '#FF8E53']}
                style={styles.actionGradient}
              >
                <Ionicons name="scan" size={32} color="white" />
                <Text style={styles.primaryActionText}>AI Food Scan</Text>
                <Text style={styles.primaryActionSubtext}>Instant nutrition analysis</Text>
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.secondaryActions}>
              {/* Browse Menu */}
              <TouchableOpacity style={styles.secondaryAction} onPress={handleBrowseMenu}>
                <View style={styles.actionIcon}>
                  <Ionicons name="restaurant" size={24} color="#4CAF50" />
                </View>
                <Text style={styles.actionText}>Browse Menu</Text>
              </TouchableOpacity>

              {/* View Stats */}
              <TouchableOpacity style={styles.secondaryAction} onPress={handleViewStats}>
                <View style={styles.actionIcon}>
                  <Ionicons name="analytics" size={24} color="#2196F3" />
                </View>
                <Text style={styles.actionText}>Nutrition Stats</Text>
                <Text style={styles.actionSubtext}>View insights</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>

        {/* 🌟 RECOMMENDED FOR YOU (USP) */}
        <Animated.View
          style={[
            styles.section,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Recommended for You ✨</Text>
              <Text style={styles.sectionSubtitle}>
                Based on your goal: <Text style={{ fontWeight: 'bold', color: '#4CAF50' }}>{userGoals?.goal ? userGoals.goal.replace('_', ' ') : 'Health'}</Text>
              </Text>
            </View>
          </View>

          {recLoading ? (
            <ActivityIndicator color="#4CAF50" style={{ margin: 20 }} />
          ) : recommendations.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.recommendationList}>
              {recommendations.map((item, index) => (
                <TouchableOpacity
                  key={item._id || index}
                  style={styles.recommendationCard}
                  onPress={() => handleFoodPress(item)}
                >
                  <View style={styles.recCardImagePlaceholder}>
                    {item.imageUrl ? (
                      <Image
                        source={{ uri: item.imageUrl }}
                        style={{ width: '100%', height: '100%' }}
                        resizeMode="cover"
                      />
                    ) : (
                      <Ionicons name="fast-food" size={40} color="white" />
                    )}
                  </View>
                  <View style={styles.recCardContent}>
                    <Text style={styles.recCardTitle} numberOfLines={1}>{item.startCaseName || item.name}</Text>
                    <Text style={styles.recCardLocation} numberOfLines={1}>📍 {item.location}</Text>

                    <View style={styles.recCardTags}>
                      <View style={styles.recTag}>
                        <Text style={styles.recTagText}>{item.nutrition.protein}g Protein</Text>
                      </View>
                      <View style={[styles.recTag, { backgroundColor: '#e8f5e9' }]}>
                        <Text style={[styles.recTagText, { color: '#4CAF50' }]}>{item.nutrition.calories} Cal</Text>
                      </View>
                    </View>
                  </View>

                  {index === 0 && (
                    <View style={styles.bestMatchBadge}>
                      <Text style={styles.bestMatchText}>Best Match 🔥</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : (
            <View style={styles.emptyRecCard}>
              <Ionicons name="sparkles-outline" size={40} color="#FF9800" />
              <Text style={styles.emptyRecText}>
                We're analyzing your profile...
              </Text>
              <Text style={styles.emptyRecSubtext}>
                Recommendations will appear here once we match foods to your goals!
              </Text>
            </View>
          )}
        </Animated.View>

        {/* Today's Summary */}
        <Animated.View
          style={[
            styles.section,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <Text style={styles.sectionTitle}>Today's Summary</Text>
          <View style={styles.summaryCard}>
            <View style={styles.summaryItem}>
              <View style={styles.summaryIcon}>
                <Ionicons name="camera" size={20} color="#4CAF50" />
              </View>
              <View style={styles.summaryContent}>
                <Text style={styles.summaryValue}>{getTotalScannedMeals()}</Text>
                <Text style={styles.summaryLabel}>Meals Scanned</Text>
              </View>
            </View>

            <View style={styles.summaryDivider} />

            <View style={styles.summaryItem}>
              <View style={styles.summaryIcon}>
                <Ionicons name="trending-up" size={20} color="#FF6B35" />
              </View>
              <View style={styles.summaryContent}>
                <Text style={styles.summaryValue}>
                  {Math.round(Math.max(getCalorieProgress(), getProteinProgress()))}%
                </Text>
                <Text style={styles.summaryLabel}>Goal Progress</Text>
              </View>
            </View>

            <View style={styles.summaryDivider} />

            <View style={styles.summaryItem}>
              <View style={styles.summaryIcon}>
                <Ionicons name="checkmark-circle" size={20} color="#2196F3" />
              </View>
              <View style={styles.summaryContent}>
                <Text style={styles.summaryValue}>{getOverallHealthScore()}/10</Text>
                <Text style={styles.summaryLabel}>Health Score</Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Recent Scans */}
        <Animated.View
          style={[
            styles.section,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Scans</Text>
            <TouchableOpacity onPress={() => navigation.navigate('NutritionStats')}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.recentScans}>
            {recentScans.length > 0 ? (
              recentScans.map((item, index) => (
                <View key={item.id || index} style={styles.recentScanItem}>
                  <View style={styles.scanItemHeader}>
                    <Text style={styles.scanItemName} numberOfLines={2}>
                      {item.foodName || 'Unknown Food'}
                    </Text>
                    <View style={[styles.healthBadge, { backgroundColor: getHealthColor(item.healthScore || 6) }]}>
                      <Text style={styles.healthBadgeText}>{item.healthScore || 6}/10</Text>
                    </View>
                  </View>
                  <Text style={styles.scanItemCalories}>
                    {item.nutrition?.calories || 0} cal
                  </Text>
                  <Text style={styles.scanItemTime}>
                    {formatTimeAgo(item.scannedAt || item.timestamp)}
                  </Text>
                </View>
              ))
            ) : (
              <View style={styles.noScansContainer}>
                <Ionicons name="camera-outline" size={48} color="#ccc" />
                <Text style={styles.noScansText}>No recent scans</Text>
                <Text style={styles.noScansSubtext}>Start scanning food to see your history!</Text>
              </View>
            )}
          </ScrollView>
        </Animated.View>

        {/* 🏃‍♂️ ACTIVITY / STEPS TRACKER */}
        <Animated.View
          style={[
            styles.section,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Activity Tracker</Text>
          </View>

          <View style={styles.activityCard}>
            <View style={styles.activityHeader}>
              <View style={[styles.activityIconContainer, { backgroundColor: '#F3E5F5' }]}>
                <Ionicons name="footsteps" size={24} color="#9C27B0" />
              </View>
              <View style={styles.activityHeaderText}>
                <Text style={styles.activityTitle}>Daily Steps</Text>
                <Text style={styles.activitySubtitle}>Keep moving!</Text>
              </View>
              <Text style={styles.activityBigValue}>{steps || 0}</Text>
            </View>

            <View style={styles.activityStatsRow}>
              <View style={styles.activityStatItem}>
                <Text style={styles.activityStatLabel}>Burned</Text>
                <Text style={[styles.activityStatValue, { color: '#FF6B35' }]}>
                  {Math.round(steps * 0.04)} kcal
                </Text>
              </View>
              <View style={styles.activityDivider} />
              <View style={styles.activityStatItem}>
                <Text style={styles.activityStatLabel}>Distance</Text>
                <Text style={[styles.activityStatValue, { color: '#2196F3' }]}>
                  {(steps * 0.00076).toFixed(2)} km
                </Text>
              </View>
              <View style={styles.activityDivider} />
              <View style={styles.activityStatItem}>
                <Text style={styles.activityStatLabel}>Goal</Text>
                <Text style={[styles.activityStatValue, { color: '#4CAF50' }]}>
                  {Math.round((steps / (userGoals?.dailySteps || 10000)) * 100)}%
                </Text>
              </View>
            </View>

            <View style={styles.activityProgressBarBg}>
              <View
                style={[
                  styles.activityProgressBarFill,
                  { width: `${Math.min((steps / (userGoals?.dailySteps || 10000)) * 100, 100)}%` }
                ]}
              />
            </View>
          </View>
        </Animated.View>

        {/* AI Features Highlight */}
        <Animated.View
          style={[
            styles.section,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <View style={styles.aiFeatureCard}>
            <LinearGradient
              colors={['#667eea', '#764ba2']}
              style={styles.aiCardGradient}
            >
              <View style={styles.aiCardContent}>
                <View style={styles.aiIcon}>
                  <Ionicons name="sparkles" size={24} color="white" />
                </View>
                <View style={styles.aiTextContent}>
                  <Text style={styles.aiTitle}>Powered by AI</Text>
                  <Text style={styles.aiDescription}>
                    Advanced nutrition analysis with Gemini 2.5 Flash
                  </Text>
                  <Text style={styles.aiStats}>
                    70+ LPU foods recognized • Real-time analysis • Batch processing
                  </Text>
                </View>
              </View>
            </LinearGradient>
          </View>
        </Animated.View>

        {/* Tips Section */}
        <Animated.View
          style={[
            styles.section,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <Text style={styles.sectionTitle}>💡 Today's Tip</Text>
          <View style={styles.tipCard}>
            <View style={styles.tipIcon}>
              <Ionicons name="bulb" size={20} color="#FF9800" />
            </View>
            <View style={styles.tipContent}>
              <Text style={styles.tipText}>
                {getTotalScannedMeals() === 0
                  ? "Start your nutrition journey by scanning your first meal! Our AI can analyze combo meals and provide detailed breakdowns."
                  : getTotalScannedMeals() < 3
                    ? "Great start! Try scanning all your meals today to get complete nutrition insights and better goal tracking."
                    : "Excellent! You're consistently tracking your meals. Check your nutrition stats to see weekly trends and patterns."
                }
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Floating Action Button for Goal Settings */}
      <TouchableOpacity
        style={styles.goalSettingFab}
        onPress={handleSetGoals}
      >
        <Ionicons name="settings" size={24} color="white" />
      </TouchableOpacity>

      <FoodDetailsModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        foodItem={selectedFood}
        onAdd={() => handleAddMeal(selectedFood)}
      />
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  loadingText: {
    fontSize: 18,
    color: 'white',
    marginTop: 16,
    textAlign: 'center',
  },
  header: {
    paddingTop: StatusBar.currentHeight || 44,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  drawerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  greetingSection: {
    flex: 1,
  },
  greetingText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  usernameText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 2,
  },
  mealTimeText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontStyle: 'italic',
  },
  profileButton: {
    padding: 4,
  },
  profileAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressSection: {
    paddingHorizontal: 20,
  },
  progressCards: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressCard: {
    flex: 1,
    marginHorizontal: 6,
    borderRadius: 16,
    overflow: 'hidden',
  },
  cardContent: {
    padding: 16,
    alignItems: 'center',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
    marginLeft: 6,
  },
  cardValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 2,
  },
  cardTarget: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 12,
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    marginBottom: 6,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressPercent: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
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
    marginTop: 18,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  seeAllText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
  },
  quickActions: {
    marginBottom: 8,
    marginTop: 4,
  },
  primaryAction: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#FF6B35',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  actionGradient: {
    padding: 24,
    alignItems: 'center',
  },
  primaryActionText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 8,
  },
  primaryActionSubtext: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 4,
  },
  secondaryActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  secondaryAction: {
    flex: 1,
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    marginHorizontal: 6,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 4,
  },
  actionSubtext: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  summaryCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryIcon: {
    marginBottom: 8,
  },
  summaryContent: {
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
  },
  summaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#eee',
    marginHorizontal: 10,
  },
  videoContainer: {
    height: 180,
    backgroundColor: '#333',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recentScans: {
    marginLeft: -10,
    paddingLeft: 10,
  },
  recentScanItem: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginRight: 16,
    width: 160,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  scanItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  scanItemName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginRight: 8,
  },
  healthBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  healthBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  scanItemCalories: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF6B35',
    marginBottom: 4,
  },
  scanItemTime: {
    fontSize: 12,
    color: '#999',
  },
  noScansContainer: {
    width: width - 80,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 16,
    marginRight: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed'
  },
  noScansText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 10
  },
  noScansSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 5
  },
  aiFeatureCard: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#667eea',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  aiCardGradient: {
    padding: 1,
  },
  aiCardContent: {
    backgroundColor: 'white', // Create border effect
    borderRadius: 15,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  aiIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  aiTextContent: {
    flex: 1,
  },
  aiTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  aiDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  aiStats: {
    fontSize: 12,
    color: '#888',
    fontStyle: 'italic',
  },
  tipCard: {
    backgroundColor: '#FFF3E0',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: '#FFE0B2',
  },
  tipIcon: {
    marginRight: 16,
    marginTop: 2,
  },
  tipContent: {
    flex: 1,
  },
  tipText: {
    fontSize: 14,
    color: '#E65100',
    lineHeight: 20,
  },
  bottomSpacing: {
    height: 100,
  },
  goalSettingFab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: -12,
    marginBottom: 16,
  },
  recommendationList: {
    paddingBottom: 10,
  },
  recommendationCard: {
    width: 260,
    backgroundColor: 'white',
    borderRadius: 16,
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  recCardImagePlaceholder: {
    height: 120,
    backgroundColor: '#FF6B35', // Orange brand color
    justifyContent: 'center',
    alignItems: 'center',
  },
  recCardContent: {
    padding: 12,
  },
  recCardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  recCardLocation: {
    fontSize: 13,
    color: '#666',
    marginBottom: 8,
  },
  recCardTags: {
    flexDirection: 'row',
    gap: 8,
  },
  recTag: {
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  recTagText: {
    fontSize: 11,
    color: '#2196F3',
    fontWeight: '600',
  },
  bestMatchBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  bestMatchText: {
    color: '#FFD700',
    fontSize: 11,
    fontWeight: 'bold',
  },
  emptyRecCard: {
    backgroundColor: '#fff3e0',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ffe0b2',
  },
  emptyRecText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ef6c00',
    marginTop: 10,
  },
  emptyRecSubtext: {
    fontSize: 13,
    color: '#e65100',
    textAlign: 'center',
    marginTop: 4,
  },
  progressCardsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  activityCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  activityIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  activityHeaderText: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  activitySubtitle: {
    fontSize: 13,
    color: '#666',
  },
  activityBigValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  activityStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  activityStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  activityStatLabel: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4,
  },
  activityStatValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  activityDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#eee',
  },
  activityProgressBarBg: {
    height: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  activityProgressBarFill: {
    height: '100%',
    backgroundColor: '#9C27B0',
    borderRadius: 4,
  },
});

export default HomeScreen;
