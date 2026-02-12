const express = require('express');
const router = express.Router();
const { register, login } = require('../controllers/auth.controller');
const { googleMobileLogin } = require('../controllers/auth.controller');

router.post('/register', register);
router.post('/login', login);
router.post('/google/mobile', googleMobileLogin);



module.exports = router;
