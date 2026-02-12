import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import UserDataService from '../services/userDataService';
import { useData } from '../context/DataContext';

const { width } = Dimensions.get('window');

const ScanResultScreen = ({ route, navigation }) => {
  const { imageUri, foodData, userInput } = route.params;
  const { addFoodToMeal, refreshData } = useData();

  // 🎯 Safe rendering helper to prevent Text component errors
  const safeRender = (value, fallback = 'N/A') => {
    if (value === null || value === undefined || value === '' || value === 'undefined') {
      return fallback;
    }
    return String(value);
  };

  // 🎯 Safe number rendering
  const safeNumber = (value, fallback = 0) => {
    const num = parseFloat(value);
    return isNaN(num) ? fallback : num;
  };

  // 🎯 Debug logging (remove in production)
  console.log('🔍 foodData received:', JSON.stringify(foodData, null, 2));

  const getHealthScoreColor = (score) => {
    const numScore = safeNumber(score, 5);
    if (numScore >= 8) return '#4CAF50';
    if (numScore >= 6) return '#FF9800';
    return '#F44336';
  };

  const getConfidenceColor = (confidence) => {
    const numConfidence = safeNumber(confidence, 0.5);
    if (numConfidence >= 0.8) return '#4CAF50';
    if (numConfidence >= 0.6) return '#FF9800';
    return '#F44336';
  };

  const handleSave = () => {
    Alert.alert('Saved!', 'Food item saved to your history');
  };

  const handleAddToMeal = async () => {
    try {
      // Show loading state
      Alert.alert('Adding...', 'Please wait');

      // Determine current meal time
      const mealType = UserDataService.getMealTimeFromHour();

      console.log('🍽️ Adding to meal:', mealType);

      // ✅ Use context method (this updates all screens instantly)
      const success = await addFoodToMeal(foodData, mealType);

      if (success) {
        // Dismiss loading
        Alert.dismiss?.();

        // Show success with options
        Alert.alert(
          '✅ Added to Meal!',
          `${foodData.foodName} added to your ${mealType}.`,
          [
            {
              text: 'Scan More',
              style: 'cancel',
              onPress: () => navigation.goBack()
            },
            {
              text: 'View Stats',
              onPress: () => {
                // ✅ Force refresh before navigating
                refreshData();
                navigation.navigate('NutritionStats');
              }
            }
          ]
        );
      } else {
        Alert.dismiss?.();
        Alert.alert('Error', 'Failed to add to meal. Please try again.');
      }
    } catch (error) {
      console.error('❌ Error adding to meal:', error);
      Alert.dismiss?.();
      Alert.alert('Error', 'Failed to add to meal. Please try again.');
    }
  };


  // Ensure foodData exists and has required structure
  if (!foodData) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No food data available</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Food Image */}
      {imageUri && (
        <View style={styles.imageContainer}>
          <Image source={{ uri: imageUri }} style={styles.foodImage} />

          <View style={styles.badgeContainer}>
            <View style={[styles.confidenceBadge, { backgroundColor: getConfidenceColor(foodData.confidence) }]}>
              <Text style={styles.badgeText}>
                {Math.round(safeNumber(foodData.confidence, 0) * 100)}% confident
              </Text>
            </View>

            <View style={[styles.healthBadge, { backgroundColor: getHealthScoreColor(foodData.healthScore) }]}>
              <Text style={styles.badgeText}>
                Health: {safeRender(foodData.healthScore, '5')}/10
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Food Information */}
      <View style={styles.contentContainer}>
        <Text style={styles.foodName}>{safeRender(foodData.foodName, 'Unknown Food')}</Text>
        <Text style={styles.category}>{safeRender(foodData.category, 'Unknown Category')}</Text>
        <Text style={styles.servingSize}>Serving: {safeRender(foodData.servingSize, 'Standard portion')}</Text>

        {/* User Input Display */}
        {userInput && (
          <View style={styles.userInputContainer}>
            <Ionicons name="person" size={16} color="#4CAF50" />
            <Text style={styles.userInputText}>User provided: "{safeRender(userInput)}"</Text>
          </View>
        )}

        {/* Method Info */}
        <View style={styles.methodContainer}>
          <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
          <Text style={styles.methodText}>Analyzed via {safeRender(foodData.method, 'AI Analysis')}</Text>
        </View>

        {/* AI Enhanced Notice */}
        {foodData.hasAIGeneratedNutrition && (
          <View style={styles.aiEnhancedContainer}>
            <Ionicons name="sparkles" size={16} color="#FF9800" />
            <Text style={styles.aiEnhancedText}>
              Nutrition data enhanced with AI analysis
            </Text>
          </View>
        )}

        {/* Individual Items Breakdown */}
        {foodData.individualItems && Array.isArray(foodData.individualItems) && foodData.individualItems.length > 0 && (
          <View style={styles.individualItemsContainer}>
            <Text style={styles.sectionTitle}>
              Individual Items {foodData.totalFoodPieces && `(${safeRender(foodData.totalFoodPieces)} pieces total)`}
            </Text>

            {foodData.individualItems.map((item, index) => {
              if (!item) return null; // Skip null items

              return (
                <View key={index} style={styles.individualItem}>
                  <View style={styles.itemHeader}>
                    <Text style={styles.itemName}>{safeRender(item.name, `Item ${index + 1}`)}</Text>
                    <View style={styles.itemQuantity}>
                      <Text style={styles.quantityText}>
                        {safeRender(item.visibleCount, '1')}x
                      </Text>
                      <Text style={styles.weightText}>
                        {safeRender(item.totalWeight, `${safeRender(item.visibleCount, '1')} piece${safeNumber(item.visibleCount, 1) > 1 ? 's' : ''}`)}
                      </Text>
                    </View>
                  </View>

                  {/* Per Unit Info */}
                  {item.perUnitNutrition && (
                    <View style={styles.perUnitInfo}>
                      <Text style={styles.perUnitLabel}>
                        Per piece ({safeRender(item.perUnitWeight, 'avg')}):
                      </Text>
                      <View style={styles.perUnitNutrition}>
                        <Text style={styles.nutritionItem}>
                          {safeRender(item.perUnitNutrition.calories, '0')} cal
                        </Text>
                        <Text style={styles.nutritionItem}>
                          {safeRender(item.perUnitNutrition.protein, '0')}g protein
                        </Text>
                        <Text style={styles.nutritionItem}>
                          {safeRender(item.perUnitNutrition.carbs, '0')}g carbs
                        </Text>
                        <Text style={styles.nutritionItem}>
                          {safeRender(item.perUnitNutrition.fat, '0')}g fat
                        </Text>
                        {safeNumber(item.perUnitNutrition?.fiber, 0) > 0 && (
                          <Text style={styles.nutritionItem}>
                            {safeRender(item.perUnitNutrition.fiber)}g fiber
                          </Text>
                        )}
                      </View>
                    </View>
                  )}

                  {/* Total for this item */}
                  <View style={styles.itemTotalInfo}>
                    <Text style={styles.itemTotalLabel}>
                      Total for {safeRender(item.visibleCount, '1')} piece{safeNumber(item.visibleCount, 1) > 1 ? 's' : ''}:
                    </Text>
                    <View style={styles.itemTotalNutrition}>
                      <Text style={[styles.nutritionItem, styles.totalNutrition]}>
                        {safeRender(item.totalNutrition?.calories || item.nutrition?.calories, '0')} cal
                      </Text>
                      <Text style={[styles.nutritionItem, styles.totalNutrition]}>
                        {safeRender(item.totalNutrition?.protein || item.nutrition?.protein, '0')}g protein
                      </Text>
                      <Text style={[styles.nutritionItem, styles.totalNutrition]}>
                        {safeRender(item.totalNutrition?.carbs || item.nutrition?.carbs, '0')}g carbs
                      </Text>
                      <Text style={[styles.nutritionItem, styles.totalNutrition]}>
                        {safeRender(item.totalNutrition?.fat || item.nutrition?.fat, '0')}g fat
                      </Text>
                    </View>
                  </View>

                  {/* AI Generated Badge */}
                  {item.generatedByAI && (
                    <View style={styles.aiGeneratedBadge}>
                      <Ionicons name="sparkles" size={12} color="#FF9800" />
                      <Text style={styles.aiGeneratedText}>AI generated nutrition</Text>
                    </View>
                  )}

                  {/* User provided badge */}
                  {item.userProvided && (
                    <View style={styles.userProvidedBadge}>
                      <Ionicons name="person" size={12} color="#4CAF50" />
                      <Text style={styles.userProvidedText}>User assisted</Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}

        {/* Fallback: Original Combo Display */}
        {foodData.isComboMeal && (!foodData.individualItems || foodData.individualItems.length === 0) && (
          <View style={styles.comboContainer}>
            <Text style={styles.comboTitle}>
              🍽️ Combo Meal ({safeRender(foodData.itemCount, '1')} items)
            </Text>

            {foodData.individualItems?.map((item, index) => (
              <View key={index} style={styles.comboItem}>
                <Text style={styles.comboItemName}>{safeRender(item.displayName || item.name, `Item ${index + 1}`)}</Text>
                <Text style={styles.comboItemPortion}>
                  {safeRender(item.portion?.size, 'Standard')} portion ({safeRender(item.portion?.estimatedWeight, 'avg weight')})
                </Text>
                <Text style={styles.comboItemCalories}>
                  {safeRender(item.nutrition?.calories, '0')} kcal
                </Text>
              </View>
            ))}

            {safeNumber(foodData.lpuSpecialties, 0) > 0 && (
              <Text style={styles.lpuSpecial}>
                ⭐ {safeRender(foodData.lpuSpecialties)} LPU Specialty dish(es)
              </Text>
            )}
          </View>
        )}

        {/* Total Nutrition Grid */}
        <View style={styles.nutritionContainer}>
          <Text style={styles.sectionTitle}>Total Nutrition Information</Text>
          {foodData.totalFoodPieces && (
            <Text style={styles.totalPiecesText}>
              Combined nutrition for {safeRender(foodData.totalFoodPieces)} pieces
            </Text>
          )}
          <View style={styles.nutritionGrid}>
            <View style={styles.nutritionGridItem}>
              <Text style={styles.nutritionValue}>{safeRender(foodData.nutrition?.calories, '0')}</Text>
              <Text style={styles.nutritionLabel}>Calories</Text>
            </View>
            <View style={styles.nutritionGridItem}>
              <Text style={styles.nutritionValue}>{safeRender(foodData.nutrition?.protein, '0')}g</Text>
              <Text style={styles.nutritionLabel}>Protein</Text>
            </View>
            <View style={styles.nutritionGridItem}>
              <Text style={styles.nutritionValue}>{safeRender(foodData.nutrition?.carbs, '0')}g</Text>
              <Text style={styles.nutritionLabel}>Carbs</Text>
            </View>
            <View style={styles.nutritionGridItem}>
              <Text style={styles.nutritionValue}>{safeRender(foodData.nutrition?.fat, '0')}g</Text>
              <Text style={styles.nutritionLabel}>Fat</Text>
            </View>
            <View style={styles.nutritionGridItem}>
              <Text style={styles.nutritionValue}>{safeRender(foodData.nutrition?.fiber, '0')}g</Text>
              <Text style={styles.nutritionLabel}>Fiber</Text>
            </View>
          </View>
        </View>

        {/* Dietary Info */}
        {foodData.dietaryInfo && (
          <View style={styles.dietaryContainer}>
            <Text style={styles.sectionTitle}>Dietary Information</Text>
            <View style={styles.dietaryTags}>
              {Object.entries(foodData.dietaryInfo).map(([key, value]) => {
                if (!value) return null;
                const label = key.replace(/^is/, '').replace(/([A-Z])/g, ' $1');
                return (
                  <View key={key} style={styles.dietaryTag}>
                    <Text style={styles.dietaryTagText}>{label}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Health Tips */}
        {foodData.tips && (
          <View style={styles.tipsContainer}>
            <View style={styles.tipsHeader}>
              <Ionicons name="bulb" size={20} color="#FF9800" />
              <Text style={styles.tipsTitle}>Health Tip</Text>
            </View>
            <Text style={styles.tipsText}>{safeRender(foodData.tips)}</Text>
          </View>
        )}

        {/* Warning for estimates */}
        {foodData.isEstimate && (
          <View style={styles.warningContainer}>
            <Ionicons name="warning" size={16} color="#FF9800" />
            <Text style={styles.warningText}>
              Nutrition values are estimated
            </Text>
          </View>
        )}

        {/* User Assisted Info */}
        {foodData.userAssisted && (
          <View style={styles.userAssistedContainer}>
            <Ionicons name="people" size={16} color="#4CAF50" />
            <Text style={styles.userAssistedText}>
              Analysis improved with your input
            </Text>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={[styles.actionButton, styles.primaryButton]}
            onPress={handleAddToMeal}
          >
            <Ionicons name="add-circle-outline" size={24} color="white" />
            <Text style={styles.primaryButtonText}>Add to Meal</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.secondaryButton]}
            onPress={handleSave}
          >
            <Ionicons name="bookmark-outline" size={24} color="#2196F3" />
            <Text style={styles.secondaryButtonText}>Save</Text>
          </TouchableOpacity>
        </View>

        {/* Bottom Actions */}
        <View style={styles.bottomActions}>
          <TouchableOpacity
            style={styles.bottomButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="camera" size={20} color="#666" />
            <Text style={styles.bottomButtonText}>Scan Again</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.bottomButton}
            onPress={() => navigation.navigate('MainCafeteria')}
          >
            <Ionicons name="restaurant" size={20} color="#666" />
            <Text style={styles.bottomButtonText}>Browse Menu</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  errorText: {
    fontSize: 18,
    color: '#f44336',
    textAlign: 'center',
    margin: 20,
  },
  backButtonText: {
    fontSize: 16,
    color: '#2196F3',
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
  imageContainer: {
    position: 'relative',
  },
  foodImage: {
    width: width,
    height: 250,
    resizeMode: 'cover',
  },
  badgeContainer: {
    position: 'absolute',
    top: 16,
    right: 16,
    alignItems: 'flex-end',
  },
  confidenceBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 8,
  },
  healthBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  contentContainer: {
    padding: 16,
  },
  foodName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  category: {
    fontSize: 16,
    color: '#2196F3',
    marginBottom: 4,
  },
  servingSize: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },

  // User Input Styles
  userInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f5e8',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  userInputText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#2e7d32',
    fontStyle: 'italic',
    flex: 1,
  },

  methodContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
  },
  methodText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '500',
  },

  // AI Enhanced Notice
  aiEnhancedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff3e0',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  aiEnhancedText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#e65100',
    fontWeight: '500',
  },

  // Individual Items Styles
  individualItemsContainer: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  individualItem: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  itemQuantity: {
    alignItems: 'flex-end',
  },
  quantityText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  weightText: {
    fontSize: 12,
    color: '#666',
  },
  perUnitInfo: {
    marginBottom: 8,
  },
  perUnitLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  perUnitNutrition: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  nutritionItem: {
    fontSize: 11,
    color: '#555',
    backgroundColor: 'white',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 6,
    marginBottom: 4,
  },
  itemTotalInfo: {
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 8,
  },
  itemTotalLabel: {
    fontSize: 12,
    color: '#333',
    fontWeight: '600',
    marginBottom: 4,
  },
  itemTotalNutrition: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  totalNutrition: {
    backgroundColor: '#2196F3',
    color: 'white',
    fontWeight: 'bold',
  },

  // AI Generated Badge
  aiGeneratedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#fff3e0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
  },
  aiGeneratedText: {
    fontSize: 10,
    color: '#FF9800',
    marginLeft: 4,
    fontWeight: '500',
  },

  userProvidedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#e8f5e8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
  },
  userProvidedText: {
    fontSize: 10,
    color: '#4CAF50',
    marginLeft: 4,
    fontWeight: '500',
  },

  // Fallback combo styles
  comboContainer: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  comboTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  comboItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  comboItemName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    flex: 1,
  },
  comboItemPortion: {
    fontSize: 12,
    color: '#666',
    marginHorizontal: 8,
  },
  comboItemCalories: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  lpuSpecial: {
    fontSize: 14,
    color: '#FF9800',
    fontWeight: 'bold',
    marginTop: 8,
    textAlign: 'center',
  },

  // Nutrition container
  nutritionContainer: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  totalPiecesText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 12,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  nutritionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start', // Keep items next to each other
  },
  nutritionGridItem: {
    width: '33.33%', // 3 items per row
    alignItems: 'center',
    marginBottom: 16,
  },
  nutritionValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  nutritionLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },

  dietaryContainer: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  dietaryTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dietaryTag: {
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  dietaryTagText: {
    color: '#4CAF50',
    fontSize: 12,
    fontWeight: '500',
  },
  tipsContainer: {
    backgroundColor: '#FFF3E0',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF9800',
    marginLeft: 8,
  },
  tipsText: {
    fontSize: 14,
    color: '#E65100',
    lineHeight: 20,
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8E1',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  warningText: {
    marginLeft: 8,
    fontSize: 12,
    color: '#F57C00',
    flex: 1,
  },

  // User assisted info
  userAssistedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f5e8',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  userAssistedText: {
    marginLeft: 8,
    fontSize: 12,
    color: '#2e7d32',
    fontWeight: '500',
  },

  actionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  primaryButton: {
    backgroundColor: '#2196F3',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#2196F3',
  },
  primaryButtonText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 8,
    fontSize: 16,
  },
  secondaryButtonText: {
    color: '#2196F3',
    fontWeight: 'bold',
    marginLeft: 8,
    fontSize: 16,
  },
  bottomActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  bottomButton: {
    alignItems: 'center',
  },
  bottomButtonText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
});

export default ScanResultScreen;
