import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const FoodLocationsHubScreen = ({ route, navigation }) => {
  // 🎯 Get initial section from navigation params
  const initialSection = route.params?.initialSection || 'cafeterias';
  const [selectedSection, setSelectedSection] = useState(initialSection);

  // 🎯 Set initial section when component mounts
  useEffect(() => {
    if (route.params?.initialSection) {
      setSelectedSection(route.params.initialSection);
    }
  }, [route.params?.initialSection]);

  // 🏢 LPU Food Locations Data
  const foodLocations = {
    cafeterias: [
      { id: 'nk-food-court', name: 'NK Food Court', location: 'Main Campus', type: 'Restaurant', timing: '8:00 AM - 10:00 PM', popular: true, icon: 'restaurant', color: '#FF6B35' },
      { id: 'block-26-cafe', name: 'Block 26 Cafeteria', location: 'Academic Block 26', type: 'Cafeteria', timing: '7:00 AM - 9:00 PM', icon: 'cafe', color: '#4CAF50' },
      { id: 'block-27-cafe', name: 'Block 27 Cafeteria', location: 'Academic Block 27', type: 'Cafeteria', timing: '7:00 AM - 9:00 PM', icon: 'cafe', color: '#2196F3' },
      { id: 'block-33-cafe', name: 'Block 33 Cafeteria', location: 'Academic Block 33', type: 'Cafeteria', timing: '7:00 AM - 9:00 PM', icon: 'cafe', color: '#9C27B0' },
      { id: 'block-34-cafe', name: 'Block 34 Cafeteria', location: 'Academic Block 34', type: 'Cafeteria', timing: '7:00 AM - 9:00 PM', icon: 'cafe', color: '#FF9800' },
      { id: 'mba-block-cafe', name: 'MBA Block Cafeteria', location: 'MBA Block', type: 'Cafeteria', timing: '7:00 AM - 8:00 PM', icon: 'cafe', color: '#607D8B' },
      { id: 'unimall-foodcourt', name: 'Uni Mall Food Court', location: 'University Mall', type: 'Food Court', timing: '9:00 AM - 11:00 PM', popular: true, icon: 'storefront', color: '#E91E63' },
    ],
    foodCourts: [
    { id: 'nk-food-court', name: 'NK Food Court', location: 'Main Campus', type: 'Restaurant', timing: '8:00 AM - 10:00 PM', popular: true, icon: 'restaurant', color: '#FF6B35' },
    { id: 'protein-house', name: 'Protein House', location: 'Gym Area', type: 'Fitness Nutrition', timing: '6:00 AM - 11:00 PM', popular: true, icon: 'fitness', color: '#E91E63' },
    { id: 'unimall-foodcourt', name: 'Uni Mall Food Court', location: 'University Mall', type: 'Food Court', timing: '9:00 AM - 11:00 PM', popular: true, icon: 'storefront', color: '#E91E63' },
    { id: 'bh1-foodcourt', name: 'BH-1 Food Court', location: 'Boys Hostel 1', type: 'Food Court', timing: '7:00 AM - 11:00 PM', icon: 'fast-food', color: '#4CAF50' },
    { id: 'bh2-foodcourt', name: 'BH-2 Food Court', location: 'Boys Hostel 2', type: 'Food Court', timing: '7:00 AM - 11:00 PM', icon: 'fast-food', color: '#2196F3' },
    { id: 'bh3-foodcourt', name: 'BH-3 Food Court', location: 'Boys Hostel 3', type: 'Food Court', timing: '7:00 AM - 11:00 PM', icon: 'fast-food', color: '#FF9800' },
    { id: 'bh4-foodcourt', name: 'BH-4 Food Court', location: 'Boys Hostel 4', type: 'Food Court', timing: '7:00 AM - 11:00 PM', icon: 'fast-food', color: '#9C27B0' },
    { id: 'bh5-foodcourt', name: 'BH-5 Food Court', location: 'Boys Hostel 5', type: 'Food Court', timing: '7:00 AM - 11:00 PM', icon: 'fast-food', color: '#607D8B' },
    { id: 'bh6-foodcourt', name: 'BH-6 Food Court', location: 'Boys Hostel 6', type: 'Food Court', timing: '7:00 AM - 11:00 PM', icon: 'fast-food', color: '#795548' },
    { id: 'bh7-foodcourt', name: 'BH-7 Food Court', location: 'Boys Hostel 7', type: 'Food Court', timing: '7:00 AM - 11:00 PM', icon: 'fast-food', color: '#FF5722' },
    { id: 'bh8-foodcourt', name: 'BH-8 Food Court', location: 'Boys Hostel 8', type: 'Food Court', timing: '7:00 AM - 11:00 PM', icon: 'fast-food', color: '#009688' },
    { id: 'gh1-foodcourt', name: 'GH-1 Food Court', location: 'Girls Hostel 1', type: 'Food Court', timing: '7:00 AM - 11:00 PM', icon: 'fast-food', color: '#E91E63' },
    { id: 'gh2-foodcourt', name: 'GH-2 Food Court', location: 'Girls Hostel 2', type: 'Food Court', timing: '7:00 AM - 11:00 PM', icon: 'fast-food', color: '#9C27B0' },
    { id: 'gh3-foodcourt', name: 'GH-3 Food Court', location: 'Girls Hostel 3', type: 'Food Court', timing: '7:00 AM - 11:00 PM', icon: 'fast-food', color: '#673AB7' },
    { id: 'gh4-foodcourt', name: 'GH-4 Food Court', location: 'Girls Hostel 4', type: 'Food Court', timing: '7:00 AM - 11:00 PM', icon: 'fast-food', color: '#FF4081' },
    { id: 'gh5-foodcourt', name: 'GH-5 Food Court', location: 'Girls Hostel 5', type: 'Food Court', timing: '7:00 AM - 11:00 PM', icon: 'fast-food', color: '#8BC34A' },
    { id: 'gh6-foodcourt', name: 'GH-6 Food Court', location: 'Girls Hostel 6', type: 'Food Court', timing: '7:00 AM - 11:00 PM', icon: 'fast-food', color: '#00BCD4' },
  ],
    boysHostels: [
      { id: 'bh1-mess', name: 'BH-1 Mess', location: 'Boys Hostel 1', type: 'Mess', timing: '7:30 AM - 10:00 PM', icon: 'home', color: '#4CAF50' },
      { id: 'bh2-mess', name: 'BH-2 Mess', location: 'Boys Hostel 2', type: 'Mess', timing: '7:30 AM - 10:00 PM', icon: 'home', color: '#2196F3' },
      { id: 'bh3-mess', name: 'BH-3 Mess', location: 'Boys Hostel 3', type: 'Mess', timing: '7:30 AM - 10:00 PM', icon: 'home', color: '#FF9800' },
      { id: 'bh4-mess', name: 'BH-4 Mess', location: 'Boys Hostel 4', type: 'Mess', timing: '7:30 AM - 10:00 PM', icon: 'home', color: '#9C27B0' },
      { id: 'bh5-mess', name: 'BH-5 Mess', location: 'Boys Hostel 5', type: 'Mess', timing: '7:30 AM - 10:00 PM', icon: 'home', color: '#607D8B' },
      { id: 'bh6-mess', name: 'BH-6 Mess', location: 'Boys Hostel 6', type: 'Mess', timing: '7:30 AM - 10:00 PM', icon: 'home', color: '#795548' },
      { id: 'bh7-mess', name: 'BH-7 Mess', location: 'Boys Hostel 7', type: 'Mess', timing: '7:30 AM - 10:00 PM', icon: 'home', color: '#FF5722' },
      { id: 'bh8-mess', name: 'BH-8 Mess', location: 'Boys Hostel 8', type: 'Mess', timing: '7:30 AM - 10:00 PM', icon: 'home', color: '#009688' },
    ],
    girlsHostels: [
      { id: 'gh1-mess', name: 'GH-1 Mess', location: 'Girls Hostel 1', type: 'Mess', timing: '7:00 AM - 10:00 PM', icon: 'flower', color: '#E91E63' },
      { id: 'gh2-mess', name: 'GH-2 Mess', location: 'Girls Hostel 2', type: 'Mess', timing: '7:00 AM - 10:00 PM', icon: 'flower', color: '#9C27B0' },
      { id: 'gh3-mess', name: 'GH-3 Mess', location: 'Girls Hostel 3', type: 'Mess', timing: '7:00 AM - 10:00 PM', icon: 'flower', color: '#673AB7' },
      { id: 'gh4-mess', name: 'GH-4 Mess', location: 'Girls Hostel 4', type: 'Mess', timing: '7:00 AM - 10:00 PM', icon: 'flower', color: '#FF4081' },
      { id: 'gh5-mess', name: 'GH-5 Mess', location: 'Girls Hostel 5', type: 'Mess', timing: '7:00 AM - 10:00 PM', icon: 'flower', color: '#8BC34A' },
      { id: 'gh6-mess', name: 'GH-6 Mess', location: 'Girls Hostel 6', type: 'Mess', timing: '7:00 AM - 10:00 PM', icon: 'flower', color: '#00BCD4' },
    ]
  };

  const sections = [
    { key: 'cafeterias', label: 'Cafeterias', icon: 'restaurant', count: foodLocations.cafeterias.length },
    { key: 'foodCourts', label: 'Food Courts', icon: 'fast-food', count: foodLocations.foodCourts.length },
    { key: 'boysHostels', label: 'Boys Hostels', icon: 'man', count: foodLocations.boysHostels.length },
    { key: 'girlsHostels', label: 'Girls Hostels', icon: 'woman', count: foodLocations.girlsHostels.length },
  ];

    const handleLocationPress = (location) => {
    navigation.navigate('FoodCourtMenu', {  
        courtId: location.id,
        locationData: location 
    });
    };


  const renderLocationCard = (location) => (
    <TouchableOpacity
      key={location.id}
      style={styles.locationCard}
      onPress={() => handleLocationPress(location)}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={[location.color, `${location.color}CC`]}
        style={styles.locationGradient}
      >
        <View style={styles.locationHeader}>
          <View style={styles.locationIcon}>
            <Ionicons name={location.icon} size={24} color="white" />
          </View>
          {location.popular && (
            <View style={styles.popularBadge}>
              <Text style={styles.popularText}>Popular</Text>
            </View>
          )}
        </View>
        
        <View style={styles.locationContent}>
          <Text style={styles.locationName}>{location.name}</Text>
          <Text style={styles.locationLocation}>{location.location}</Text>
          <Text style={styles.locationType}>{location.type}</Text>
        </View>
        
        <View style={styles.locationFooter}>
          <View style={styles.timingContainer}>
            <Ionicons name="time" size={14} color="rgba(255,255,255,0.8)" />
            <Text style={styles.locationTiming}>{location.timing}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.8)" />
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4CAF50" />
      
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
          <Text style={styles.headerTitle}>LPU Food Locations</Text>
          <View style={styles.headerRight} />
        </View>
        
        <Text style={styles.headerSubtitle}>
          Discover 20+ dining options across campus
        </Text>
      </LinearGradient>

      {/* Section Tabs */}
      <View style={styles.sectionTabs}>
        {sections.map(section => (
          <TouchableOpacity
            key={section.key}
            style={[
              styles.sectionTab,
              selectedSection === section.key && styles.sectionTabActive
            ]}
            onPress={() => setSelectedSection(section.key)}
          >
            <Ionicons 
              name={section.icon} 
              size={20} 
              color={selectedSection === section.key ? '#4CAF50' : '#666'} 
            />
            <Text style={[
              styles.sectionTabText,
              selectedSection === section.key && styles.sectionTabTextActive
            ]}>
              {section.label}
            </Text>
            <View style={[
              styles.sectionTabBadge,
              selectedSection === section.key && styles.sectionTabBadgeActive
            ]}>
              <Text style={[
                styles.sectionTabBadgeText,
                selectedSection === section.key && styles.sectionTabBadgeTextActive
              ]}>
                {section.count}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Locations List */}
      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        <View style={styles.locationsList}>
          {foodLocations[selectedSection].map(renderLocationCard)}
        </View>
        
        {/* Bottom Spacing */}
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
  header: {
    paddingTop: StatusBar.currentHeight || 44,
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 12,
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
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  sectionTabs: {
    flexDirection: 'row',
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginTop: -10,
    borderRadius: 12,
    padding: 4,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  sectionTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  sectionTabActive: {
    backgroundColor: '#f0f8f0',
  },
  sectionTabText: {
    fontSize: 13,
    color: '#666',
    marginLeft: 6,
    marginRight: 4,
    fontWeight: '500',
  },
  sectionTabTextActive: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  sectionTabBadge: {
    backgroundColor: '#e0e0e0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
  },
  sectionTabBadgeActive: {
    backgroundColor: '#4CAF50',
  },
  sectionTabBadgeText: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  sectionTabBadgeTextActive: {
    color: 'white',
  },
  content: {
    flex: 1,
    marginTop: 16,
  },
  contentContainer: {
    paddingHorizontal: 16,
  },
  locationsList: {
    marginTop: 8,
  },
  locationCard: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  locationGradient: {
    padding: 20,
  },
  locationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  locationIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  popularBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FF6B35',
  },
  locationContent: {
    marginBottom: 16,
  },
  locationName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  locationLocation: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 2,
  },
  locationType: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  locationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationTiming: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginLeft: 6,
  },
  bottomSpacing: {
    height: 20,
  },
});

export default FoodLocationsHubScreen;
