const express = require('express');
const router = express.Router();
const ensureAuthenticated = require('../middleware/ensureAuthenticated'); // Import the new unified middleware
const User = require('../models/User');
const bcrypt = require('bcryptjs');

// @route   GET /
// @desc    Render Home Page
// @access  Public
router.get('/', (req, res) => {
    res.render('index', { title: 'Welcome' });
});

// @route   GET /login
// @desc    Render Login Page
// @access  Public
router.get('/login', (req, res) => {
    if (req.session.user) { // If already logged in, redirect to notes
        return res.redirect('/notes');
    }
    
    // Check for logout success message
    if (req.query.logout === 'success') {
        req.flash('success_msg', 'Logged out YaY!!');
        return res.redirect('/login'); // Redirect to clean URL
    }
    
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.render('login', { title: 'Login' });
});

// @route   GET /register
// @desc    Render Register Page
// @access  Public
router.get('/register', (req, res) => {
    if (req.session.user) { // If already logged in, redirect to notes
        return res.redirect('/notes');
    }
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.render('register', { title: 'Register' });
});

// @route   GET /notes
// @desc    Render Notes Page (Protected)
// @access  Private
router.get('/notes', ensureAuthenticated, (req, res) => { // Use ensureAuthenticated middleware
    // ensureAuthenticated handles the redirect if not logged in.
    // If it passes, req.user is available.
    // The actual notes data will be fetched by client-side JS from /api/notes
    res.render('notes', { title: 'My Notes' });
});

// @route   GET /profile
// @desc    Render Profile Page (Protected)
// @access  Private
router.get('/profile', ensureAuthenticated, (req, res) => {
    res.render('profile', { title: 'Profile' });
});

// @route   POST /profile
// @desc    Handle Profile Update (Protected)
// @access  Private
router.post('/profile', ensureAuthenticated, async (req, res) => {
    const { username, email, currentPassword, newPassword, confirmPassword } = req.body;
    const user = await User.findById(req.session.user.id);
    let error_msg = '';
    let success_msg = '';

    // Handle missing user (stale session or deleted user)
    if (!user) {
        error_msg = 'User not found. Please log in again.';
        req.flash('error_msg', error_msg); // Set flash before destroying session
        req.session.destroy(() => {
            res.redirect('/login');
        });
        return;
    }

    // Require all fields
    if (!username || !email || !currentPassword) {
        error_msg = 'All fields are required.';
        return res.render('profile', { title: 'Profile', error_msg, success_msg, currentUser: req.session.user });
    }

    // Check current password
    let isMatch = false;
    try {
        isMatch = await user.comparePassword(currentPassword);
    } catch (err) {
        error_msg = 'Error checking current password. Please try again.';
        return res.render('profile', { title: 'Profile', error_msg, success_msg, currentUser: req.session.user });
    }
    if (!isMatch) {
        error_msg = 'Current password is incorrect.';
        return res.render('profile', { title: 'Profile', error_msg, success_msg, currentUser: req.session.user });
    }

    // Validate new password if provided
    if (newPassword || confirmPassword) {
        if (newPassword !== confirmPassword) {
            error_msg = 'New passwords do not match.';
            return res.render('profile', { title: 'Profile', error_msg, success_msg, currentUser: req.session.user });
        }
        if (newPassword && newPassword.length < 6) {
            error_msg = 'New password must be at least 6 characters.';
            return res.render('profile', { title: 'Profile', error_msg, success_msg, currentUser: req.session.user });
        }
    }

    // Update user fields
    user.username = username;
    user.email = email;
    if (newPassword) {
        user.password = newPassword;
    }
    try {
        await user.save();
    } catch (err) {
        error_msg = 'Error saving user details. Please try again.';
        return res.render('profile', { title: 'Profile', error_msg, success_msg, currentUser: req.session.user });
    }

    // Update session with new user details (keep them logged in)
    req.session.user = user.toJSON(); // Update session with new user info
    success_msg = 'Your profile has been updated successfully!';
    
    // Render profile page with success message
    res.render('profile', { title: 'Profile', error_msg, success_msg, currentUser: req.session.user });
});

module.exports = router;
