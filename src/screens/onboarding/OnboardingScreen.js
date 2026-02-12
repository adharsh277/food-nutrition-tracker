import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    Dimensions,
    Animated,
    ScrollView,
    StatusBar,
    Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import UserDataService from '../../services/userDataService';

const { width, height } = Dimensions.get('window');

const ACTIVITY_LEVELS = [
    { id: 'Sedentary', label: 'Sedentary', desc: 'Little or no exercise', icon: 'bed-outline' },
    { id: 'Lightly Active', label: 'Lightly Active', desc: 'Exercise 1-3 times/week', icon: 'walk-outline' },
    { id: 'Moderately Active', label: 'Moderately Active', desc: 'Exercise 3-5 times/week', icon: 'bicycle-outline' },
    { id: 'Very Active', label: 'Very Active', desc: 'Exercise 6-7 times/week', icon: 'fitness-outline' },
    { id: 'Super Active', label: 'Super Active', desc: 'Physical job or intense exercise', icon: 'barbell-outline' },
];

const GOALS = [
    { id: 'Lose Weight', label: 'Lose Weight', icon: 'trending-down-outline' },
    { id: 'Maintain', label: 'Maintain Weight', icon: 'remove-outline' },
    { id: 'Gain Muscle', label: 'Gain Muscle', icon: 'trending-up-outline' },
];

const OnboardingScreen = ({ navigation }) => {
    const { token, login, user: currentUser } = useAuth();
    const [step, setStep] = useState(0); // 0: Intro, 1: Basic Info, 2: Activity, 3: Goals, 4: Preferences
    const slideAnim = useRef(new Animated.Value(0)).current;
    const fadeAnim = useRef(new Animated.Value(1)).current;

    // Form Data
    const [formData, setFormData] = useState({
        age: '',
        gender: 'Male',
        height: '', // cm
        weight: '', // kg
        activityLevel: 'Moderately Active',
        goal: 'Maintain',
        preferences: [],
        dislikes: [],
        allergies: []
    });

    const [loading, setLoading] = useState(false);

    const animateNext = () => {
        Animated.sequence([
            Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
            Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
        ]).start();
    };

    const handleNext = () => {
        if (step === 1) {
            if (!formData.age || !formData.height || !formData.weight) {
                Alert.alert('Details Missing', 'Please fill in all basic details.');
                return;
            }
        }
        animateNext();
        setStep(step + 1);
    };

    const handleBack = () => {
        if (step > 0) {
            animateNext();
            setStep(step - 1);
        }
    };

    const handleFinish = async () => {
        setLoading(true);
        try {
            const API_URL = process.env.EXPO_PUBLIC_API_BASE_URL;
            const res = await fetch(`${API_URL}/api/users/profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.message || 'Failed to update user');

            // Update local user state
            const updatedUser = { ...currentUser, ...data, onboardingCompleted: true };

            // 🔧 SYNC: Save to Local Storage for ProfileScreen
            try {
                await UserDataService.saveUserProfile({
                    name: currentUser.name || 'User',
                    email: currentUser.email || '',
                    ...formData
                });

                // Save Goals locally too
                if (data.profile && data.profile.macroTargets) {
                    await UserDataService.saveUserGoals({
                        dailyCalories: data.profile.macroTargets.calories,
                        dailyProtein: data.profile.macroTargets.protein,
                        dailyCarbs: data.profile.macroTargets.carbs,
                        dailyFat: data.profile.macroTargets.fat,
                        dailyFiber: 30, // Default
                        waterGlasses: 8,
                        mealsPerDay: 4
                    });
                }
            } catch (err) {
                console.log('Error syncing local storage:', err);
            }

            // Re-login to update context/SecureStore
            await login(token, updatedUser);

            // Navigation is handled by AuthContext state change (user.onboardingCompleted)

        } catch (error) {
            Alert.alert('Error', error.message);
        } finally {
            setLoading(false);
        }
    };

    const updateForm = (key, value) => {
        setFormData(prev => ({ ...prev, [key]: value }));
    };

    const toggleSelection = (key, item) => {
        setFormData(prev => {
            const list = prev[key];
            if (list.includes(item)) {
                return { ...prev, [key]: list.filter(i => i !== item) };
            } else {
                return { ...prev, [key]: [...list, item] };
            }
        });
    };

    // --- Render Steps ---

    const renderIntro = () => (
        <View style={styles.stepContainer}>
            <Ionicons name="nutrition-outline" size={100} color="white" />
            <Text style={styles.title}>Welcome to LPU Food Scanner</Text>
            <Text style={styles.subtitle}>
                Let's personalize your experience. We'll build a custom nutrition plan based on your body and goals.
            </Text>
            <TouchableOpacity style={styles.primaryButton} onPress={handleNext}>
                <Text style={styles.primaryButtonText}>Get Started</Text>
                <Ionicons name="arrow-forward" size={24} color="#4CAF50" />
            </TouchableOpacity>
        </View>
    );

    const renderBasicInfo = () => (
        <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Tell us about yourself</Text>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>Age</Text>
                <TextInput
                    style={styles.input}
                    keyboardType="numeric"
                    placeholder="20"
                    placeholderTextColor="#aaa"
                    value={formData.age}
                    onChangeText={val => updateForm('age', val)}
                />
            </View>

            <View style={styles.row}>
                <View style={styles.halfInput}>
                    <Text style={styles.label}>Height (cm)</Text>
                    <TextInput
                        style={styles.input}
                        keyboardType="numeric"
                        placeholder="175"
                        placeholderTextColor="#aaa"
                        value={formData.height}
                        onChangeText={val => updateForm('height', val)}
                    />
                </View>
                <View style={styles.halfInput}>
                    <Text style={styles.label}>Weight (kg)</Text>
                    <TextInput
                        style={styles.input}
                        keyboardType="numeric"
                        placeholder="70"
                        placeholderTextColor="#aaa"
                        value={formData.weight}
                        onChangeText={val => updateForm('weight', val)}
                    />
                </View>
            </View>

            <Text style={styles.label}>Gender</Text>
            <View style={styles.genderContainer}>
                {['Male', 'Female'].map(g => (
                    <TouchableOpacity
                        key={g}
                        style={[styles.genderButton, formData.gender === g && styles.genderButtonActive]}
                        onPress={() => updateForm('gender', g)}
                    >
                        <Ionicons name={g === 'Male' ? 'male' : 'female'} size={24} color={formData.gender === g ? 'white' : '#aaa'} />
                        <Text style={[styles.genderText, formData.gender === g && { color: 'white' }]}>{g}</Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );

    const renderActivity = () => (
        <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>How active are you?</Text>
            <ScrollView style={{ width: '100%' }} contentContainerStyle={{ gap: 10 }}>
                {ACTIVITY_LEVELS.map((level) => (
                    <TouchableOpacity
                        key={level.id}
                        style={[styles.card, formData.activityLevel === level.id && styles.cardActive]}
                        onPress={() => updateForm('activityLevel', level.id)}
                    >
                        <View style={styles.cardIcon}>
                            <Ionicons name={level.icon} size={30} color={formData.activityLevel === level.id ? 'white' : '#4CAF50'} />
                        </View>
                        <View style={styles.cardContent}>
                            <Text style={[styles.cardTitle, formData.activityLevel === level.id && { color: 'white' }]}>{level.label}</Text>
                            <Text style={[styles.cardDesc, formData.activityLevel === level.id && { color: '#e0e0e0' }]}>{level.desc}</Text>
                        </View>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );

    const renderGoals = () => (
        <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>What is your goal?</Text>
            <View style={{ width: '100%', gap: 15 }}>
                {GOALS.map((g) => (
                    <TouchableOpacity
                        key={g.id}
                        style={[styles.goalCard, formData.goal === g.id && styles.goalCardActive]}
                        onPress={() => updateForm('goal', g.id)}
                    >
                        <Ionicons name={g.icon} size={40} color={formData.goal === g.id ? 'white' : '#4CAF50'} />
                        <Text style={[styles.goalText, formData.goal === g.id && { color: 'white' }]}>{g.label}</Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );

    const renderPreferences = () => (
        <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Any food preferences?</Text>
            <Text style={styles.label}>Select what you like/follow:</Text>

            <View style={styles.chipContainer}>
                {['Vegetarian', 'Non-Vegetarian', 'Eggetarian', 'Vegan', 'Gluten-Free'].map(pref => (
                    <TouchableOpacity
                        key={pref}
                        style={[styles.chip, formData.preferences.includes(pref) && styles.chipActive]}
                        onPress={() => toggleSelection('preferences', pref)}
                    >
                        <Text style={[styles.chipText, formData.preferences.includes(pref) && { color: 'white' }]}>{pref}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            <Text style={styles.label}>Any Allergies?</Text>
            <View style={styles.chipContainer}>
                {['Nuts', 'Dairy', 'Soy', 'Shellfish', 'Eggs'].map(alg => (
                    <TouchableOpacity
                        key={alg}
                        style={[styles.chip, formData.allergies.includes(alg) && styles.chipActive]}
                        onPress={() => toggleSelection('allergies', alg)}
                    >
                        <Text style={[styles.chipText, formData.allergies.includes(alg) && { color: 'white' }]}>{alg}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            <TouchableOpacity style={styles.finishButton} onPress={handleFinish} disabled={loading}>
                <LinearGradient
                    colors={['#4CAF50', '#2E7D32']}
                    style={styles.finishGradient}
                >
                    {loading ? (
                        <Text style={styles.finishText}>Saving...</Text>
                    ) : (
                        <>
                            <Text style={styles.finishText}>Complete Profile</Text>
                            <Ionicons name="checkmark-circle" size={24} color="white" />
                        </>
                    )}
                </LinearGradient>
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <LinearGradient
                colors={['#1a1a1a', '#2d3436']}
                style={styles.background}
            />

            {/* Progress Bar */}
            {step > 0 && (
                <View style={styles.progressContainer}>
                    <View style={[styles.progressBar, { width: `${(step / 4) * 100}%` }]} />
                </View>
            )}

            {/* Navigation Header */}
            {step > 0 && (
                <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                    <Ionicons name="arrow-back" size={24} color="white" />
                </TouchableOpacity>
            )}

            <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
                {step === 0 && renderIntro()}
                {step === 1 && renderBasicInfo()}
                {step === 2 && renderActivity()}
                {step === 3 && renderGoals()}
                {step === 4 && renderPreferences()}
            </Animated.View>

            {/* Floating Action Button for Next (Steps 1-3) */}
            {step > 0 && step < 4 && (
                <TouchableOpacity style={styles.fab} onPress={handleNext}>
                    <LinearGradient colors={['#4CAF50', '#2E7D32']} style={styles.fabGradient}>
                        <Ionicons name="arrow-forward" size={28} color="white" />
                    </LinearGradient>
                </TouchableOpacity>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1a1a1a',
    },
    background: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
    },
    progressContainer: {
        height: 4,
        backgroundColor: '#333',
        width: '100%',
        position: 'absolute',
        top: StatusBar.currentHeight + 50,
        zIndex: 10,
    },
    progressBar: {
        height: '100%',
        backgroundColor: '#4CAF50',
    },
    backButton: {
        position: 'absolute',
        top: 50,
        left: 20,
        zIndex: 20,
        padding: 10,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        paddingTop: 80,
    },
    stepContainer: {
        width: '100%',
        alignItems: 'center',
        gap: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#4CAF50',
        textAlign: 'center',
        marginTop: 20,
    },
    subtitle: {
        fontSize: 16,
        color: '#aaa',
        textAlign: 'center',
        lineHeight: 24,
        maxWidth: '80%',
    },
    primaryButton: {
        backgroundColor: 'white',
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 15,
        paddingHorizontal: 30,
        borderRadius: 30,
        marginTop: 30,
        gap: 10,
    },
    primaryButtonText: {
        color: '#4CAF50',
        fontSize: 18,
        fontWeight: 'bold',
    },
    stepTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 20,
        alignSelf: 'flex-start',
    },
    inputGroup: {
        width: '100%',
        gap: 5,
    },
    label: {
        color: '#aaa',
        fontSize: 14,
        marginLeft: 5,
        marginBottom: 5,
        alignSelf: 'flex-start',
    },
    input: {
        backgroundColor: '#333',
        color: 'white',
        padding: 15,
        borderRadius: 12,
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#444',
    },
    row: {
        flexDirection: 'row',
        gap: 15,
        width: '100%',
    },
    halfInput: {
        flex: 1,
    },
    genderContainer: {
        flexDirection: 'row',
        gap: 15,
        width: '100%',
    },
    genderButton: {
        flex: 1,
        backgroundColor: '#333',
        padding: 15,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#444',
    },
    genderButtonActive: {
        backgroundColor: '#4CAF50',
        borderColor: '#4CAF50',
    },
    genderText: {
        color: '#aaa',
        marginTop: 5,
        fontWeight: 'bold',
    },
    // Activity Cards
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#333',
        padding: 15,
        borderRadius: 12,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#444',
    },
    cardActive: {
        borderColor: '#4CAF50',
        backgroundColor: '#388E3C',
    },
    cardIcon: {
        width: 50,
        alignItems: 'center',
    },
    cardContent: {
        flex: 1,
    },
    cardTitle: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    cardDesc: {
        color: '#aaa',
        fontSize: 12,
    },
    // Goal Cards
    goalCard: {
        backgroundColor: '#333',
        padding: 20,
        borderRadius: 15,
        alignItems: 'center',
        flexDirection: 'row',
        gap: 15,
        borderWidth: 1,
        borderColor: '#444',
    },
    goalCardActive: {
        backgroundColor: '#4CAF50',
        borderColor: '#4CAF50',
    },
    goalText: {
        color: '#aaa',
        fontSize: 18,
        fontWeight: 'bold',
    },
    // Preferences
    chipContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        marginBottom: 20,
        width: '100%',
    },
    chip: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        backgroundColor: '#333',
        borderWidth: 1,
        borderColor: '#444',
    },
    chipActive: {
        backgroundColor: '#4CAF50',
        borderColor: '#4CAF50',
    },
    chipText: {
        color: '#aaa',
        fontSize: 14,
    },
    finishButton: {
        width: '100%',
        marginTop: 20,
    },
    finishGradient: {
        padding: 18,
        borderRadius: 12,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 10,
    },
    finishText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    fab: {
        position: 'absolute',
        bottom: 30,
        right: 30,
        borderRadius: 30,
        elevation: 8,
    },
    fabGradient: {
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default OnboardingScreen;
