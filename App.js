import React, { useEffect, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { StatusBar } from 'expo-status-bar';
import { Provider as PaperProvider } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';

import NotificationService from './src/services/notificationService';

// Screens
import HomeScreen from './src/screens/HomeScreen';
import ScannerScreen from './src/screens/ScannerScreen';
import FoodCourtScreen from './src/screens/FoodCourtScreen';
import CustomDrawer from './src/components/CustomDrawer';
import ScanResultScreen from './src/screens/ScanResultScreen';
import FoodLocationsHubScreen from './src/screens/FoodLocationsHubScreen';
import NutritionStatsScreen from './src/screens/NutritionStatsScreen';
import GoalSettingScreen from './src/screens/GoalSettingScreen';
import ProfileScreen from './src/screens/ProfileScreen';

// Contexts
import { ThemeProvider } from './src/context/ThemeContext';
import { DataProvider } from './src/context/DataContext';
import { AuthProvider, useAuth } from './src/context/AuthContext';

// Navigation
import AuthStack from './src/navigation/AuthStack';

const Drawer = createDrawerNavigator();

/* ---------------- MAIN DRAWER (UNCHANGED LOGIC) ---------------- */

function MainDrawer() {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawer {...props} />}
      screenOptions={{
        drawerPosition: 'left',
        headerShown: true,
        headerStyle: { backgroundColor: '#2196F3' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <Drawer.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: 'LPU Food Scanner', headerShown: false }}
      />

      <Drawer.Screen
        name="Scanner"
        component={ScannerScreen}
        options={{ title: 'Food Scanner', headerShown: false }}
      />

      <Drawer.Screen
        name="MainCafeteria"
        component={FoodLocationsHubScreen}
        options={{
          title: 'Main Cafeteria',
          headerShown: false,
          drawerLabel: 'Main Cafeteria',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="restaurant" size={size} color={color} />
          ),
        }}
        initialParams={{ initialSection: 'cafeterias' }}
      />

      <Drawer.Screen
        name="FoodCourt"
        component={FoodLocationsHubScreen}
        options={{
          title: 'Food Courts',
          headerShown: false,
          drawerLabel: 'Food Courts',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="fast-food" size={size} color={color} />
          ),
        }}
        initialParams={{ initialSection: 'foodCourts' }}
      />

      <Drawer.Screen
        name="HostelMess"
        component={FoodLocationsHubScreen}
        options={{
          title: 'Hostel Mess',
          headerShown: false,
          drawerLabel: 'Hostel Mess',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
        initialParams={{ initialSection: 'boysHostels' }}
      />

      <Drawer.Screen
        name="NutritionStats"
        component={NutritionStatsScreen}
        options={{
          title: 'Nutrition Analytics',
          headerShown: false,
          drawerLabel: 'Nutrition Stats',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="analytics" size={size} color={color} />
          ),
        }}
      />

      <Drawer.Screen
        name="GoalSetting"
        component={GoalSettingScreen}
        options={{
          title: 'Set Goals',
          headerShown: false,
          drawerLabel: 'Set Goals',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="flag" size={size} color={color} />
          ),
        }}
      />

      <Drawer.Screen
        name="ProteinHouse"
        component={FoodLocationsHubScreen}
        options={{
          title: 'Protein House',
          headerShown: false,
          drawerLabel: 'Protein House',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="fitness" size={size} color={color} />
          ),
        }}
        initialParams={{ initialSection: 'proteinHouse' }}
      />

      <Drawer.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: 'Profile',
          headerShown: false,
          drawerLabel: 'Profile',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />

      {/* Hidden Screens */}
      <Drawer.Screen
        name="FoodLocationsHub"
        component={FoodLocationsHubScreen}
        options={{ headerShown: false, drawerItemStyle: { display: 'none' } }}
      />

      <Drawer.Screen
        name="FoodCourtMenu"
        component={FoodCourtScreen}
        options={{ headerShown: false, drawerItemStyle: { display: 'none' } }}
      />

      <Drawer.Screen
        name="ScanResult"
        component={ScanResultScreen}
        options={{ headerShown: false, drawerItemStyle: { display: 'none' } }}
      />
    </Drawer.Navigator>
  );
}

/* ---------------- AUTH SWITCH ---------------- */

// Screens (Added Onboarding)
import OnboardingScreen from './src/screens/onboarding/OnboardingScreen';

// ... (existing imports)

/* ---------------- AUTH SWITCH ---------------- */

function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) return null; // splash/loading later

  // 1. Not Logged In -> Auth Stack
  if (!user) {
    return (
      <NavigationContainer>
        <AuthStack />
      </NavigationContainer>
    );
  }

  // 2. Logged In BUT Onboarding Not Complete -> Onboarding Screen
  // We wrap it in a stack to enable navigation within onboarding steps if needed, 
  // or just render the screen directly if it handles its own internal step state (which it does).
  if (!user.onboardingCompleted) {
    return (
      <NavigationContainer>
        <OnboardingScreen />
      </NavigationContainer>
    );
  }

  // 3. Logged In & Onboarding Complete -> Main App
  return (
    <NavigationContainer>
      <MainDrawer />
    </NavigationContainer>
  );
}

/* ---------------- ROOT APP ---------------- */

export default function App() {
  const notificationInitialized = useRef(false);

  useEffect(() => {
    const initNotifications = async () => {
      if (notificationInitialized.current) return;
      try {
        const ok = await NotificationService.initialize();
        if (ok) notificationInitialized.current = true;
      } catch (e) {
        console.log('Notification init skipped');
      }
    };
    initNotifications();
  }, []);

  return (
    <AuthProvider>
      <ThemeProvider>
        <DataProvider>
          <PaperProvider>
            <StatusBar style="auto" />
            <AppNavigator />
          </PaperProvider>
        </DataProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}
