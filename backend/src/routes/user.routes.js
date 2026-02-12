const express = require('express');
const router = express.Router();
const { getProfile, updateProfile, saveDailyLog, getDailyLogs } = require('../controllers/user.controller');
const protect = require('../middleware/auth.middleware');

router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.post('/daily-log', protect, saveDailyLog);
router.get('/daily-log', protect, getDailyLogs);

module.exports = router;
