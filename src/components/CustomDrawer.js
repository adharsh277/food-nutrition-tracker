import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Image,
} from 'react-native';
import { DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';


const CustomDrawer = (props) => {
  const { navigation } = props;

  const menuItems = [
    { 
      name: 'Home', 
      label: 'Dashboard', 
      icon: 'home', 
      color: '#4CAF50' 
    },
    { 
      name: 'Scanner', 
      label: 'AI Food Scanner', 
      icon: 'scan', 
      color: '#FF6B35' 
    },
    { 
      name: 'NutritionStats', 
      label: 'Nutrition Analytics', 
      icon: 'analytics', 
      color: '#2196F3' 
    },
    { 
      name: 'GoalSetting', 
      label: 'Set Goals', 
      icon: 'target', 
      color: '#9C27B0' 
    },
    { 
      name: 'MainCafeteria', 
      label: 'Main Cafeteria', 
      icon: 'restaurant', 
      color: '#FF9800' 
    },
    { 
      name: 'FoodCourt', 
      label: 'Food Court', 
      icon: 'fast-food', 
      color: '#E91E63' 
    },
    { 
      name: 'HostelMess', 
      label: 'Hostel Mess', 
      icon: 'bed', 
      color: '#607D8B' 
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#4CAF50', '#45a049']}
        style={styles.header}
      >
        <View style={styles.profileSection}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={32} color="white" />
          </View>
          <Text style={styles.welcomeText}>Welcome back!</Text>
          <Text style={styles.appName}>LPU Food Scanner</Text>
        </View>
      </LinearGradient>

      {/* Menu Items */}
      <ScrollView style={styles.menuContainer} showsVerticalScrollIndicator={false}>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.menuItem}
            onPress={() => navigation.navigate(item.name)}
          >
            <View style={[styles.iconContainer, { backgroundColor: `${item.color}20` }]}>
              <Ionicons name={item.icon} size={22} color={item.color} />
            </View>
            <Text style={styles.menuLabel}>{item.label}</Text>
            <Ionicons name="chevron-forward" size={16} color="#666" />
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.aiChip}>
          <Ionicons name="sparkles" size={16} color="#FF9800" />
          <Text style={styles.aiText}>Powered by AI</Text>
        </View>
        <Text style={styles.versionText}>Version 1.0.0</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  profileSection: {
    alignItems: 'center',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  welcomeText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 4,
  },
  appName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  menuContainer: {
    flex: 1,
    paddingTop: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginHorizontal: 12,
    marginVertical: 2,
    borderRadius: 12,
    backgroundColor: 'white',
    marginBottom: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  footer: {
    padding: 20,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  aiChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 8,
  },
  aiText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FF9800',
    marginLeft: 6,
  },
  versionText: {
    fontSize: 11,
    color: '#999',
  },
});

export default CustomDrawer;
