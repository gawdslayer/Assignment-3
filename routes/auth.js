const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const authController = require('../controllers/authController');

// Validation rules for registration
const registerValidation = [
    check('username', 'Username is required and must be between 3 and 20 characters.')
        .not().isEmpty()
        .trim()
        .isLength({ min: 3, max: 20 }),
    check('email', 'A valid email address is required.')
        .isEmail()
        .normalizeEmail(),
    check('password', 'Password is required and must be at least 6 characters long.')
        .isLength({ min: 6 })
];

// Validation rules for login
const loginValidation = [
    check('email', 'A valid email address is required.')
        .isEmail()
        .normalizeEmail(),
    check('password', 'Password is required.')
        .not().isEmpty()
];

/**
 * @route   POST /api/auth/register
 * @desc    Register a user for API access & get token
 * @access  Public
 */
router.post('/register', registerValidation, authController.register);

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user & get token (API Login)
 * @access  Public
 */
router.post('/login', loginValidation, authController.login);

module.exports = router; 