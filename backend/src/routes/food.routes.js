const express = require('express');
const router = express.Router();
const { getRecommendations, getAllFood } = require('../controllers/food.controller');
const protect = require('../middleware/auth.middleware');

router.get('/recommendations', protect, getRecommendations);
router.get('/', protect, getAllFood);

module.exports = router;
