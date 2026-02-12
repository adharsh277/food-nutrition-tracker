const DailyLog = require('../models/DailyLog');

// ... existing code ...

const User = require('../models/User');

// @desc    Get current user profile
// @route   GET /api/users/profile
// @access  Private
exports.getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Update user profile & onboarding
// @route   PUT /api/users/profile
// @access  Private
exports.updateProfile = async (req, res) => {
    try {
        const {
            height,
            weight,
            age,
            gender,
            activityLevel,
            goal,
            preferences,
            dislikes,
            allergies // Added allergies as per requirements
        } = req.body;

        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        // Calculate BMR & TDEE (Simple Harris-Benedict)
        let bmr;
        if (gender === 'Male') {
            bmr = 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age);
        } else {
            bmr = 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age);
        }

        let tdee;
        switch (activityLevel) {
            case 'Sedentary': tdee = bmr * 1.2; break;
            case 'Lightly Active': tdee = bmr * 1.375; break;
            case 'Moderately Active': tdee = bmr * 1.55; break;
            case 'Very Active': tdee = bmr * 1.725; break;
            case 'Super Active': tdee = bmr * 1.9; break;
            default: tdee = bmr * 1.2;
        }

        // Adjust for Goal
        let targetCalories = tdee;
        if (goal === 'Lose Weight') targetCalories -= 500;
        else if (goal === 'Gain Muscle') targetCalories += 300;

        // Ensure safe minimum
        if (targetCalories < 1400) targetCalories = 1400;

        // 🧠 Scientific Macro Split
        // Protein: 2.2g per kg (approx 1g per lb)
        const protein = Math.round(weight * 2.2);

        // Fat: 25% of Total Calories
        const fat = Math.round((targetCalories * 0.25) / 9);

        // Carbs: Remainder
        const consumedCals = (protein * 4) + (fat * 9);
        const carbs = Math.round((targetCalories - consumedCals) / 4);

        // Update Profile Fields
        user.profile = {
            height,
            weight,
            age,
            gender,
            activityLevel,
            goal,
            preferences,
            dislikes,
            allergies, // Ensure schema supports this or adding it now
            macroTargets: {
                calories: Math.round(targetCalories),
                protein: Math.round(protein),
                fat: Math.round(fat),
                carbs: Math.round(carbs)
            }
        };

        user.onboardingCompleted = true;

        await user.save();

        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Save or Update Daily Log
// @route   POST /api/users/daily-log
// @access  Private
exports.saveDailyLog = async (req, res) => {
    try {
        const { date, steps, caloriesBurned, caloriesConsumed, macrosConsumed, waterIntake } = req.body;

        // Validation
        if (!date) return res.status(400).json({ msg: 'Date is required' });

        const userId = req.user.id;

        // Upsert: Find and update, or create new if not exists
        let log = await DailyLog.findOne({ user: userId, date });

        if (log) {
            // Update existing
            if (steps !== undefined) log.steps = steps;
            if (caloriesBurned !== undefined) log.caloriesBurned = caloriesBurned;
            if (caloriesConsumed !== undefined) log.caloriesConsumed = caloriesConsumed;
            if (macrosConsumed !== undefined) log.macrosConsumed = macrosConsumed;
            if (waterIntake !== undefined) log.waterIntake = waterIntake;
            await log.save();
        } else {
            // Create new
            log = new DailyLog({
                user: userId,
                date,
                steps: steps || 0,
                caloriesBurned: caloriesBurned || 0,
                caloriesConsumed: caloriesConsumed || 0,
                macrosConsumed: macrosConsumed || { protein: 0, carbs: 0, fat: 0 },
                waterIntake: waterIntake || 0
            });
            await log.save();
        }

        res.json(log);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Get Daily Logs (Optional Range)
// @route   GET /api/users/daily-log
// @access  Private
exports.getDailyLogs = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const userId = req.user.id;

        let query = { user: userId };

        if (startDate && endDate) {
            query.date = { $gte: startDate, $lte: endDate };
        } else if (startDate) {
            query.date = { $gte: startDate };
        }

        const logs = await DailyLog.find(query).sort({ date: 1 }); // Sort by date ascending

        res.json(logs);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

