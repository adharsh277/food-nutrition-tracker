// src/components/NutritionDisplay.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const NutritionDisplay = ({ nutrition, showDetailed = false }) => {
  const nutritionItems = [
    { key: 'calories', label: 'Calories', value: nutrition.calories, unit: 'kcal', color: '#FF9800' },
    { key: 'protein', label: 'Protein', value: nutrition.protein, unit: 'g', color: '#4CAF50' },
    { key: 'carbs', label: 'Carbs', value: nutrition.carbs, unit: 'g', color: '#2196F3' },
    { key: 'fat', label: 'Fat', value: nutrition.fat, unit: 'g', color: '#FF5722' },
  ];

  const detailedItems = [
    { key: 'fiber', label: 'Fiber', value: nutrition.fiber, unit: 'g', color: '#795548' },
    { key: 'iron', label: 'Iron', value: nutrition.iron, unit: 'mg', color: '#607D8B' },
  ];

  const renderNutritionItem = (item) => (
    <View key={item.key} style={styles.nutritionItem}>
      <View style={[styles.colorIndicator, { backgroundColor: item.color }]} />
      <View style={styles.nutritionContent}>
        <Text style={styles.nutritionValue}>{item.value}{item.unit}</Text>
        <Text style={styles.nutritionLabel}>{item.label}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Nutrition Information</Text>
      <View style={styles.nutritionGrid}>
        {nutritionItems.map(renderNutritionItem)}
        {showDetailed && detailedItems.map(renderNutritionItem)}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  nutritionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  nutritionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '48%',
    marginBottom: 12,
  },
  colorIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  nutritionContent: {
    flex: 1,
  },
  nutritionValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  nutritionLabel: {
    fontSize: 12,
    color: '#666',
  },
});

export default NutritionDisplay;
