const mongoose = require('mongoose');

const FoodItemSchema = new mongoose.Schema({
    id: { type: String, unique: true }, // bh_poori (Keep existing IDs for reference)
    name: { type: String, required: true },
    category: { type: String },
    price: { type: Number },
    location: { type: String, required: true }, // e.g., 'Boys Hostel Mess', 'Protein House'
    nutrition: {
        calories: Number,
        protein: Number,
        carbs: Number,
        fat: Number,
        fiber: Number
    },
    healthScore: { type: Number },
    ingredients: [String],
    weight: String,
    isVeg: { type: Boolean, default: true },
    description: String,

    // Recommendation Engine
    availableMeals: [String],
    tags: [String],
    embeddings: [Number],
    imageUrl: String // URL to food image
}, { timestamps: true });

module.exports = mongoose.model('FoodItem', FoodItemSchema);
