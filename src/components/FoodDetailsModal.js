import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

const FoodDetailsModal = ({ visible, onClose, foodItem, onAdd }) => {
    if (!foodItem) return null;

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    {/* Header Image */}
                    <View style={styles.imageHeader}>
                        {foodItem.imageUrl ? (
                            <Image
                                source={{ uri: foodItem.imageUrl }}
                                style={StyleSheet.absoluteFill}
                                resizeMode="cover"
                            />
                        ) : (
                            <LinearGradientBackground />
                        )}

                        {/* Gradient Overlay for text visibility if needed, or just standard header controls */}
                        <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.3)' }]} />

                        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                            <Ionicons name="close" size={24} color="white" />
                        </TouchableOpacity>

                        {!foodItem.imageUrl && (
                            <View style={styles.foodIconContainer}>
                                <Ionicons name="fast-food" size={60} color="white" />
                            </View>
                        )}
                    </View>

                    <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
                        {/* Title & Location */}
                        <View style={styles.headerInfo}>
                            <Text style={styles.foodName}>{foodItem.startCaseName || foodItem.name}</Text>
                            <View style={styles.locationBadge}>
                                <Ionicons name="location" size={16} color="#4CAF50" />
                                <Text style={styles.locationText}>{foodItem.location}</Text>
                            </View>
                            {foodItem.description && (
                                <Text style={styles.description}>{foodItem.description}</Text>
                            )}
                        </View>

                        {/* Macros Grid */}
                        <View style={styles.macrosContainer}>
                            <MacroItem
                                label="Calories"
                                value={foodItem.nutrition?.calories}
                                unit="kcal"
                                color="#FF6B35"
                                icon="flame"
                            />
                            <MacroItem
                                label="Protein"
                                value={foodItem.nutrition?.protein}
                                unit="g"
                                color="#2196F3"
                                icon="fitness"
                            />
                            <MacroItem
                                label="Carbs"
                                value={foodItem.nutrition?.carbs}
                                unit="g"
                                color="#FFC107"
                                icon="restaurant"
                            />
                            <MacroItem
                                label="Fats"
                                value={foodItem.nutrition?.fat}
                                unit="g"
                                color="#9C27B0"
                                icon="water"
                            />
                        </View>

                        {/* Ingredients */}
                        {foodItem.ingredients && foodItem.ingredients.length > 0 && (
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>Ingredients</Text>
                                <View style={styles.ingredientsList}>
                                    {foodItem.ingredients.map((ing, index) => (
                                        <View key={index} style={styles.ingredientChip}>
                                            <Text style={styles.ingredientText}>{ing}</Text>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        )}

                        {/* Tags/Dietary Info */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Dietary Info</Text>
                            <View style={styles.tagsRow}>
                                <View style={[styles.tag, { backgroundColor: foodItem.isVeg ? '#E8F5E9' : '#FFEBEE' }]}>
                                    <Text style={[styles.tagText, { color: foodItem.isVeg ? '#2E7D32' : '#C62828' }]}>
                                        {foodItem.isVeg ? 'Vegetarian' : 'Non-Vegetarian'}
                                    </Text>
                                </View>
                                {foodItem.weight && (
                                    <View style={[styles.tag, { backgroundColor: '#E3F2FD' }]}>
                                        <Text style={[styles.tagText, { color: '#1565C0' }]}>
                                            Portion: {foodItem.weight}
                                        </Text>
                                    </View>
                                )}
                                {foodItem.healthScore && (
                                    <View style={[styles.tag, { backgroundColor: '#FFF3E0' }]}>
                                        <Text style={[styles.tagText, { color: '#EF6C00' }]}>
                                            Health Score: {foodItem.healthScore}/10
                                        </Text>
                                    </View>
                                )}
                            </View>
                        </View>
                    </ScrollView>

                    {/* Action Button */}
                    <View style={styles.footer}>
                        <TouchableOpacity
                            style={styles.trackButton}
                            onPress={() => {
                                if (onAdd) onAdd();
                                else onClose();
                            }}
                        >
                            <Text style={styles.trackButtonText}>Add to Goal</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

// Helper Components
const MacroItem = ({ label, value, unit, color, icon }) => (
    <View style={styles.macroItem}>
        <View style={[styles.macroIcon, { backgroundColor: `${color}20` }]}>
            <Ionicons name={icon} size={20} color={color} />
        </View>
        <Text style={styles.macroValue}>{value || 0}<Text style={styles.macroUnit}>{unit}</Text></Text>
        <Text style={styles.macroLabel}>{label}</Text>
    </View>
);

const LinearGradientBackground = () => (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: '#4CAF50', borderTopLeftRadius: 24, borderTopRightRadius: 24 }]}>
        {/* Use simple view for background if LinearGradient implies extra dep, but since we use it in Home, importing is fine if passed or handled, 
           but to be safe/simple I'll use a solid color here or if user has LinearGradient I can use it. 
           User has expo-linear-gradient. I will use a solid color fall back to avoid imports if not passed. 
           Actually, let's keep it simple style. */}
    </View>
);

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: 'white',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        height: '80%',
        overflow: 'hidden',
    },
    imageHeader: {
        height: 150,
        backgroundColor: '#4CAF50',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    closeButton: {
        position: 'absolute',
        top: 20,
        right: 20,
        backgroundColor: 'rgba(0,0,0,0.2)',
        padding: 8,
        borderRadius: 20,
        zIndex: 10,
    },
    foodIconContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollContent: {
        flex: 1,
        padding: 24,
    },
    headerInfo: {
        marginBottom: 24,
    },
    foodName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
    },
    locationBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    locationText: {
        marginLeft: 4,
        color: '#666',
        fontWeight: '500',
    },
    description: {
        color: '#666',
        lineHeight: 20,
    },
    macrosContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        backgroundColor: '#F8F9FA',
        padding: 16,
        borderRadius: 16,
        marginBottom: 24,
    },
    macroItem: {
        alignItems: 'center',
    },
    macroIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    macroValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    macroUnit: {
        fontSize: 12,
        color: '#666',
        fontWeight: 'normal',
    },
    macroLabel: {
        fontSize: 12,
        color: '#666',
        marginTop: 2,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 12,
    },
    ingredientsList: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    ingredientChip: {
        backgroundColor: '#F5F5F5',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    ingredientText: {
        color: '#666',
        fontSize: 14,
    },
    tagsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    tag: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    tagText: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    footer: {
        padding: 24,
        borderTopWidth: 1,
        borderTopColor: '#EEE',
    },
    trackButton: {
        backgroundColor: '#4CAF50',
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: 'center',
    },
    trackButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default FoodDetailsModal;
