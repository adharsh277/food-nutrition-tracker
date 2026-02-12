const mongoose = require('mongoose');

const DailyLogSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    date: {
        type: String, // Format: YYYY-MM-DD
        required: true
    },
    steps: {
        type: Number,
        default: 0
    },
    caloriesBurned: {
        type: Number, // BMR + Activity + Steps
        default: 0
    },
    caloriesConsumed: {
        type: Number,
        default: 0
    },
    macrosConsumed: {
        protein: { type: Number, default: 0 },
        carbs: { type: Number, default: 0 },
        fat: { type: Number, default: 0 }
    },
    waterIntake: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

// Compound index to ensure one log per user per day
DailyLogSchema.index({ user: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('DailyLog', DailyLogSchema);
