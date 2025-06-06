const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { check, validationResult } = require('express-validator');
const User = require('../models/User');

// Helper function to determine if the request is an API request
const isApiRequest = (req) => req.xhr || (req.headers.accept && req.headers.accept.includes('application/json'));

// Helper function to handle validation errors
const handleValidationErrors = (req, res, errors, redirectPath) => {
    const errorMessages = errors.array().map(err => err.msg);
    if (isApiRequest(req)) {
        return res.status(400).json({ errors: errorMessages });
    }
    req.flash('validation_errors', errorMessages);
    req.flash('form_data', req.body);
    return res.redirect(redirectPath);
};

// Helper function to handle general authentication errors
const handleAuthError = (req, res, message, redirectPath, statusCode = 400) => {
    if (isApiRequest(req)) {
        return res.status(statusCode).json({ errors: [message] });
    }
    req.flash('error_msg', message);
    req.flash('form_data', req.body);
    return res.redirect(redirectPath);
};

// Validation rules for registration
const registerValidationRules = [
    check('username', 'Username is required and must be at least 3 characters long.')
        .not().isEmpty()
        .trim()
        .isLength({ min: 3 }),
    check('email', 'Please include a valid email.')
        .isEmail()
        .normalizeEmail(),
    check('password', 'Password is required and must be at least 6 characters long.')
        .isLength({ min: 6 })
];

// Validation rules for login
const loginValidationRules = [
    check('email', 'Please include a valid email.')
        .isEmail()
        .normalizeEmail(),
    check('password', 'Password is required.')
        .not().isEmpty()
];

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', registerValidationRules, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return handleValidationErrors(req, res, errors, '/register');
    }

    const { username, email, password } = req.body;

    try {
        // Check if email already exists
        let user = await User.findOne({ email });
        if (user) {
            return handleAuthError(req, res, 'Email already registered. Please use a different email or log in.', '/register');
        }

        // Check if username already exists
        user = await User.findOne({ username });
        if (user) {
            return handleAuthError(req, res, 'Username already taken. Please choose another one.', '/register');
        }

        // Create new user instance (password will be hashed by pre-save hook in User model)
        user = new User({
            username,
            email,
            password
        });

        await user.save(); // Password hashing happens here via the model's pre-save hook

        // User is saved, now create JWT
        const payload = {
            id: user.id // Use user.id (which is the _id as a string from toJSON)
        };

        const token = jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '24h' } // Token expires in 24 hours
        );

        // Store essential user info and token in session
        req.session.user = user.toJSON(); // user.toJSON() removes password
        req.session.token = token;

        // For API requests
        if (isApiRequest(req)) {
            return res.status(201).json({
                token,
                user: req.session.user // Send the sanitized user object
            });
        }

        // For web form submissions
        req.flash('success_msg', 'Registration successful! You are now logged in.');
        res.redirect('/notes'); // Redirect to notes page or dashboard

    } catch (err) {
        console.error('Registration Error:', err.message);
        if (err.code === 11000) { // MongoDB duplicate key error
             const field = Object.keys(err.keyPattern)[0];
             const message = `An account with that ${field} already exists.`;
            return handleAuthError(req, res, message, '/register');
        }
        return handleAuthError(req, res, 'Server error during registration. Please try again.', '/register', 500);
    }
});

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user & get token (Login)
 * @access  Public
 */
router.post('/login', loginValidationRules, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return handleValidationErrors(req, res, errors, '/login');
    }

    const { email, password } = req.body;

    try {
        // Check if user exists
        const user = await User.findOne({ email });
        if (!user) {
            return handleAuthError(req, res, 'Invalid credentials. Please check your email and password.', '/login');
        }

        // Validate password (using the method from User model)
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return handleAuthError(req, res, 'Invalid credentials. Please check your email and password.', '/login');
        }

        // User authenticated, create JWT
        const payload = {
            id: user.id
        };

        const token = jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Store user info and token in session
        req.session.user = user.toJSON(); // user.toJSON() removes password
        req.session.token = token;

        if (isApiRequest(req)) {
            return res.json({
                token,
                user: req.session.user
            });
        }

        req.flash('success_msg', 'Login successful! Welcome back.');
        res.redirect('/notes'); // Or to a saved intended URL

    } catch (err) {
        console.error('Login Error:', err.message);
        return handleAuthError(req, res, 'Server error during login. Please try again.', '/login', 500);
    }
});

/**
 * @route   GET /api/auth/logout
 * @desc    Logout user
 * @access  Private (implicitly, as you need to be logged in to log out)
 */
router.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.redirect('/');
        }
        res.redirect('/login?logout=success');
    });
});

module.exports = router; 