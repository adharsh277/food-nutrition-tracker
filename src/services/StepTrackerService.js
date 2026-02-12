import { Pedometer } from 'expo-sensors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, Platform, AppState } from 'react-native';
import UserDataService from './userDataService';
import NotificationService from './notificationService';

const STORAGE_KEY = 'daily_steps_data';
const SENSOR_VALUE_KEY = 'last_sensor_value';

const StepTracker = {
    stepCount: 0,
    listeners: [],
    subscription: null,
    appStateSubscription: null,
    lastSensorValue: null,

    /**
     * Get the start of today in local timezone
     */
    getStartOfToday() {
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
        return startOfDay;
    },

    /**
     * Get today's date string in YYYY-MM-DD format (local timezone)
     */
    getTodayString() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    },

    /**
     * Initialize step tracker - call on app launch
     */
    async init() {
        try {
            console.log('👣 StepTracker: Initializing...');
            const stored = await AsyncStorage.getItem(STORAGE_KEY);
            const today = this.getTodayString();

            if (stored) {
                const parsed = JSON.parse(stored);
                console.log('👣 StepTracker: Loaded stored data:', parsed);

                if (parsed.date === today) {
                    // Same day - restore step count
                    this.stepCount = parsed.steps || 0;
                    this.lastSensorValue = parsed.lastSensorValue || null;
                    console.log(`👣 StepTracker: Restored ${this.stepCount} steps for today`);
                } else {
                    // New day - reset steps
                    console.log(`👣 StepTracker: New day detected (stored: ${parsed.date}, today: ${today}). Resetting steps.`);
                    this.stepCount = 0;
                    this.lastSensorValue = null;
                    await this.save();
                }
            } else {
                // First time - start fresh
                console.log('👣 StepTracker: No stored data, starting fresh');
                this.stepCount = 0;
                await this.save();
            }

            // Setup app state listener to handle background/foreground transitions
            this.setupAppStateListener();

        } catch (e) {
            console.error('👣 StepTracker: Error in init:', e);
            this.stepCount = 0;
        }
    },

    /**
     * Setup listener for app state changes (background/foreground)
     */
    setupAppStateListener() {
        if (this.appStateSubscription) {
            this.appStateSubscription.remove();
        }

        this.appStateSubscription = AppState.addEventListener('change', async (nextAppState) => {
            if (nextAppState === 'active') {
                console.log('👣 StepTracker: App became active, recovering missed steps...');
                await this.recoverMissedSteps();
            }
        });
    },

    /**
     * Recover steps that were taken while app was in background/killed
     * This queries the pedometer history from midnight to now
     */
    async recoverMissedSteps() {
        try {
            const isAvailable = await Pedometer.isAvailableAsync();
            if (!isAvailable) {
                console.log('👣 StepTracker: Pedometer not available for recovery');
                return;
            }

            const startOfDay = this.getStartOfToday();
            const now = new Date();

            console.log(`👣 StepTracker: Querying history from ${startOfDay.toISOString()} to ${now.toISOString()}`);

            const history = await Pedometer.getStepCountAsync(startOfDay, now);

            if (history && history.steps > 0) {
                console.log(`👣 StepTracker: History shows ${history.steps} steps today`);

                // Check if today's date matches our stored date
                const today = this.getTodayString();
                const stored = await AsyncStorage.getItem(STORAGE_KEY);
                const parsed = stored ? JSON.parse(stored) : null;

                if (!parsed || parsed.date !== today) {
                    // Day changed while app was closed - use history directly
                    console.log('👣 StepTracker: Day changed, using history as base');
                    this.stepCount = history.steps;
                    this.lastSensorValue = null;
                    await this.save();
                } else if (history.steps > this.stepCount) {
                    // Same day but history > our count - we missed steps
                    const missed = history.steps - this.stepCount;
                    console.log(`👣 StepTracker: Recovered ${missed} missed steps`);
                    this.stepCount = history.steps;
                    await this.save();
                }

                // Notify any listeners of the updated count
                this.notifyListeners();
            }
        } catch (e) {
            console.log('👣 StepTracker: History query failed (expected on some Android devices):', e.message);
            // Fallback: try to recover using last sensor value
            await this.recoverUsingSensorValue();
        }
    },

    /**
     * Fallback recovery using saved sensor value (for devices that don't support history)
     */
    async recoverUsingSensorValue() {
        try {
            const savedSensorValue = await AsyncStorage.getItem(SENSOR_VALUE_KEY);
            if (savedSensorValue) {
                this.lastSensorValue = parseInt(savedSensorValue);
                console.log(`👣 StepTracker: Loaded last sensor value: ${this.lastSensorValue}`);
            }
        } catch (e) {
            console.log('👣 StepTracker: Sensor value recovery failed:', e.message);
        }
    },

    /**
     * Save current step data
     */
    async save() {
        try {
            const today = this.getTodayString();
            const data = {
                date: today,
                steps: this.stepCount,
                lastSaveTimestamp: Date.now(),
                lastSensorValue: this.lastSensorValue
            };
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));

            // Also save sensor value separately for quick recovery
            if (this.lastSensorValue !== null) {
                await AsyncStorage.setItem(SENSOR_VALUE_KEY, this.lastSensorValue.toString());
            }
        } catch (e) {
            console.error('👣 StepTracker: Error saving:', e);
        }
    },

    /**
     * Notify all registered listeners of step count change
     */
    notifyListeners() {
        this.listeners.forEach(callback => {
            try {
                callback(this.stepCount);
            } catch (e) {
                console.error('👣 StepTracker: Listener callback error:', e);
            }
        });
    },

    /**
     * Get historical step count (wrapper for Pedometer API)
     */
    async getPastSteps(start, end) {
        try {
            const isAvailable = await Pedometer.isAvailableAsync();
            if (isAvailable) {
                return await Pedometer.getStepCountAsync(start, end);
            }
        } catch (error) {
            console.log("👣 StepTracker: Step history error:", error.message);
        }
        return { steps: 0 };
    },

    /**
     * Start live step tracking
     */
    async startTracking(onUpdate) {
        try {
            console.log('👣 StepTracker: Starting tracking...');

            const isAvailable = await Pedometer.isAvailableAsync();
            console.log('👣 Pedometer Available:', isAvailable);

            if (!isAvailable) return false;

            // Request permissions explicitly
            if (Pedometer.requestPermissionsAsync) {
                const perm = await Pedometer.requestPermissionsAsync();
                if (!perm.granted) {
                    console.log('❌ Pedometer permission denied');
                    return false;
                }
            }

            // Register the callback
            if (onUpdate && !this.listeners.includes(onUpdate)) {
                this.listeners.push(onUpdate);
            }

            // Try to recover missed steps first
            await this.recoverMissedSteps();

            // Initial callback with current count
            onUpdate(this.stepCount);

            // Subscribe to live updates
            this.subscription = Pedometer.watchStepCount(result => {
                // console.log('👣 Pedometer Update:', result.steps);

                if (this.lastSensorValue === null) {
                    // First reading - establish baseline
                    this.lastSensorValue = result.steps;
                    AsyncStorage.setItem(SENSOR_VALUE_KEY, result.steps.toString());
                    console.log(`👣 StepTracker: Baseline sensor value set to ${result.steps}`);
                } else {
                    const delta = result.steps - this.lastSensorValue;

                    if (delta > 0) {
                        // Normal increment
                        this.stepCount += delta;
                        this.lastSensorValue = result.steps;
                        this.save();
                        this.notifyListeners();
                        this.checkGoal(this.stepCount);
                    } else if (delta < 0) {
                        // Sensor reset (phone reboot) - just update baseline
                        console.log(`👣 StepTracker: Sensor reset detected (${this.lastSensorValue} -> ${result.steps})`);
                        this.lastSensorValue = result.steps;
                        AsyncStorage.setItem(SENSOR_VALUE_KEY, result.steps.toString());
                    }
                    // delta === 0: No change, do nothing
                }
            });

            console.log('👣 StepTracker: Live tracking started successfully');
            return true;

        } catch (e) {
            console.error("👣 StepTracker: Tracking start error:", e);
            return false;
        }
    },

    /**
     * Stop tracking and cleanup
     */
    stopTracking() {
        if (this.subscription) {
            this.subscription.remove();
            this.subscription = null;
        }
        // Don't remove app state listener - we want that to persist
        this.listeners = [];
        console.log('👣 StepTracker: Tracking stopped');
    },

    /**
     * Full cleanup (call on logout)
     */
    cleanup() {
        this.stopTracking();
        if (this.appStateSubscription) {
            this.appStateSubscription.remove();
            this.appStateSubscription = null;
        }
    },

    /**
     * Sync step data with backend
     */
    async syncWithBackend(api, token, caloriesBurned) {
        try {
            const today = this.getTodayString();
            const API_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

            await fetch(`${API_URL}/api/users/daily-log`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    date: today,
                    steps: this.stepCount,
                    caloriesBurned: caloriesBurned || Math.round(this.stepCount * 0.04),
                })
            });
            console.log("👣 StepTracker: Steps synced to backend");
        } catch (e) {
            console.error("👣 StepTracker: Step sync error:", e);
        }
    },

    /**
     * Check if user has reached their step goal
     */
    async checkGoal(currentSteps) {
        try {
            const goals = await UserDataService.getUserGoals();
            if (goals && goals.dailySteps) {
                // Check if user just crossed the goal threshold (within 100 step margin)
                if (currentSteps >= goals.dailySteps && currentSteps < goals.dailySteps + 100) {
                    // Check if we already notified today
                    const notifiedKey = `step_goal_notified_${this.getTodayString()}`;
                    const alreadyNotified = await AsyncStorage.getItem(notifiedKey);

                    if (!alreadyNotified) {
                        await NotificationService.sendStepGoalNotification(currentSteps);
                        await AsyncStorage.setItem(notifiedKey, 'true');
                    }
                }
            }
        } catch (e) {
            console.log("👣 StepTracker: Step goal check error", e);
        }
    },

    /**
     * Get current step count (for external access)
     */
    getSteps() {
        return this.stepCount;
    },

    /**
     * Force reset steps (for debugging/testing)
     */
    async resetSteps() {
        this.stepCount = 0;
        this.lastSensorValue = null;
        await this.save();
        this.notifyListeners();
        console.log('👣 StepTracker: Steps reset to 0');
    }
};

export default StepTracker;
