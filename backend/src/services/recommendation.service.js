const FoodItem = require('../models/FoodItem');


const RecommendationService = {
    /**
     * Get personalized recommendations for a user
     * @param {Object} userProfile - The user's profile object (from User model)
     * @param {String} mealTime - Current meal time (e.g., 'Breakfast', 'Lunch', 'Dinner')
     * @returns {Array} - Array of recommended FoodItem documents sorted by score
     */
    getRecommendations: async (userProfile, mealTime) => {
        try {
            // 1. Basic Filtering (Dietary Restrictions & Meal Time)
            let query = {
                availableMeals: mealTime // Strict filtering: Must be available now
            };
            const preferences = userProfile.preferences || [];

            // If user is vegetarian, filter for veg items only
            if (preferences.includes('Vegetarian') || preferences.includes('Vegan')) {
                query.isVeg = true;
            }

            // TODO: Add allergy filtering if ingredients are reliably populated
            // if (userProfile.allergies && userProfile.allergies.length > 0) { ... }

            let foods = await FoodItem.find(query).lean();
            console.log('Recommendation query:', query, 'matched foods:', foods.length);

            // 2. Scoring Logic
            const scoredFoods = foods.map(food => {
                let score = 0;

                // --- Goal Alignment ---
                const { goal } = userProfile;
                const { protein, carbs, calories } = food.nutrition;

                // Example: If goal is 'Gain Muscle', prioritize Protein
                if (goal === 'Gain Muscle') {
                    score += (protein * 2); // Heavy weight on protein
                    if (calories > 300) score += 5; // Slight boost for higher calories
                }
                else if (goal === 'Lose Weight') {
                    score += (protein * 1.5); // Still need protein
                    if (calories < 400) score += 10; // Boost for lower calorie density
                    if (carbs < 30) score += 5; // Boost for lower carbs
                }
                else { // Maintain
                    score += protein;
                    // Balanced profile
                    if (calories > 200 && calories < 600) score += 5;
                }

                // --- Health Score Boost ---
                if (food.healthScore) {
                    score += (food.healthScore * 2);
                }

                return { ...food, matchScore: score };
            });

            // 3. Sort by Score (Descending)
            scoredFoods.sort((a, b) => b.matchScore - a.matchScore);

            // Return top 10
            return scoredFoods.slice(0, 10);

        } catch (error) {
            console.error('Recommendation Error:', error);
            throw new Error('Failed to generate recommendations');
        }
    }
};

module.exports = RecommendationService;
