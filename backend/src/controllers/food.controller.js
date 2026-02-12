const FoodItem = require('../models/FoodItem');
const RecommendationService = require('../services/recommendation.service');

// @desc    Get personalized food recommendations
// @route   GET /api/food/recommendations
// @access  Private
// @desc    Get personalized food recommendations
// @route   GET /api/food/recommendations
// @access  Private
exports.getRecommendations = async (req, res) => {
    try {
        console.log('🔍 [API] GET /recommendations - Start');
        const user = req.user; // From auth middleware
        console.log('👤 [API] User ID:', user?.id);

        if (!user) {
            throw new Error("User object missing from request");
        }

        // Determine meal time based on current hour
        // 🔧 FIXED: Use user's local hour if provided, otherwise server time
        let hour = new Date().getHours();
        if (req.query.localHour) {
            const localHour = parseInt(req.query.localHour);
            if (!isNaN(localHour) && localHour >= 0 && localHour <= 23) {
                hour = localHour;
                console.log('🕒 [API] Using User Local Hour:', hour);
            }
        }

        let mealTime = 'Snack';
        if (hour >= 6 && hour < 11) mealTime = 'Breakfast';
        else if (hour >= 11 && hour < 16) mealTime = 'Lunch';
        else if (hour >= 16 && hour < 19) mealTime = 'Snack';
        else if (hour >= 19 && hour < 23) mealTime = 'Dinner';

        console.log('🕒 [API] Calculated Meal Time:', mealTime);

        // Make sure user profile exists (or use defaults)
        if (!user.profile) {
            console.warn('⚠️ [API] No profile found for user');
            return res.status(400).json({ msg: 'User profile not found. Please complete onboarding.' });
        }

        // Debug: Check RecommendationService
        if (!RecommendationService || !RecommendationService.getRecommendations) {
            throw new Error("RecommendationService is not defined correctly");
        }

        const recommendations = await RecommendationService.getRecommendations(user.profile, mealTime);
        console.log('✅ [API] Recommendations count:', recommendations?.length);

        res.json({
            mealTime,
            recommendations
        });
    } catch (err) {
        console.error('❌ [API] Recommendation Error:', err);
        // Respond with JSON even on error to avoid parsing issues
        res.status(500).json({
            msg: 'Server Error during recommendations',
            error: err.message
        });
    }
};

// @desc    Get all food items (optional filtering)
// @route   GET /api/food
// @access  Private
exports.getAllFood = async (req, res) => {
    try {
        const foods = await FoodItem.find({});
        res.json(foods);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};
