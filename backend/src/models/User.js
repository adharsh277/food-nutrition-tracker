const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },

  email: {
    type: String,
    required: true,
    unique: true
  },

  password: {
    type: String
  },

  googleId: {
    type: String
  },

  role: {
    type: String,
    enum: ['USER', 'ADMIN', 'SUPER_ADMIN'],
    default: 'USER'
  },

  onboardingCompleted: {
    type: Boolean,
    default: false
  },

  profile: {
    height: Number,
    weight: Number,
    age: Number,
    gender: String,
    activityLevel: String,
    goal: String,
    macroTargets: {
      calories: Number,
      protein: Number,
      carbs: Number,
      fat: Number
    },
    preferences: [String],
    dislikes: [String],
    allergies: [String]
  }
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
