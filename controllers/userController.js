const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

/**
 * @desc    Render the login page
 * @route   GET /login
 */
exports.renderLoginForm = (req, res) => {
    res.render('login', { title: 'Login' });
};

/**
 * @desc    Process login form submission
 * @route   POST /login
 */
exports.loginUser = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        req.flash('validation_errors', errors.array());
        req.flash('form_data', req.body);
        return res.redirect('/login');
    }
    
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) {
            req.flash('error_msg', 'No user found with that email.');
            return res.redirect('/login');
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            req.flash('error_msg', 'Password incorrect.');
            return res.redirect('/login');
        }

        // Set session
        req.session.user = {
            id: user._id,
            username: user.username,
            email: user.email
        };

        req.flash('success_msg', 'You are now logged in.');
        res.redirect('/');

    } catch (err) {
        console.error('Web Login Error:', err.message);
        req.flash('error_msg', 'An error occurred during login. Please try again.');
        res.redirect('/login');
    }
};

/**
 * @desc    Render the registration page
 * @route   GET /register
 */
exports.renderRegisterForm = (req, res) => {
    res.render('register', { title: 'Register' });
};

/**
 * @desc    Process registration form submission
 * @route   POST /register
 */
exports.registerUser = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        req.flash('validation_errors', errors.array());
        req.flash('form_data', req.body);
        return res.redirect('/register');
    }

    const { username, email, password } = req.body;

    try {
        let user = await User.findOne({ email });
        if (user) {
            req.flash('error_msg', 'An account with that email already exists.');
            return res.redirect('/register');
        }
        
        user = await User.findOne({ username });
        if (user) {
            req.flash('error_msg', 'That username is already taken.');
            return res.redirect('/register');
        }

        const newUser = new User({
            username,
            email,
            password
        });
        
        await newUser.save();

        req.flash('success_msg', 'You are now registered and can log in.');
        res.redirect('/login');

    } catch (err) {
        console.error('Web Registration Error:', err.message);
        req.flash('error_msg', 'Something went wrong. Please try again.');
        res.redirect('/register');
    }
};

/**
 * @desc    Log user out
 * @route   GET /logout
 */
exports.logoutUser = (req, res, next) => {
    req.session.destroy((err) => {
        if (err) {
            return next(err);
        }
        res.redirect('/login');
    });
};

/**
 * @desc    Render the user profile page
 * @route   GET /profile
 */
exports.renderProfilePage = (req, res) => {
    // The user object from the session is passed to the profile view
    res.render('profile', {
        title: 'My Profile',
        user: req.session.user
    });
};

/**
 * @desc    Handle profile update logic
 * @route   POST /profile
 */
exports.updateProfile = async (req, res) => {
    const { username, email, currentPassword, newPassword, confirmPassword } = req.body;
    const userId = req.session.user.id;

    try {
        const user = await User.findById(userId);

        if (!user) {
            req.flash('error_msg', 'User not found.');
            return res.redirect('/profile');
        }

        // Verify current password
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            req.flash('error_msg', 'Incorrect current password.');
            return res.redirect('/profile');
        }

        // Update username and email if they have changed
        let updated = false;
        if (username !== user.username) {
            user.username = username;
            updated = true;
        }
        if (email !== user.email) {
            // Check if new email is already taken by another user
            const emailExists = await User.findOne({ email: email, _id: { $ne: userId } });
            if (emailExists) {
                req.flash('error_msg', 'Email is already in use by another account.');
                return res.redirect('/profile');
            }
            user.email = email;
            updated = true;
        }

        // Update password if a new one is provided and matches confirmation
        if (newPassword) {
            if (newPassword.length < 6) {
                req.flash('error_msg', 'New password must be at least 6 characters long.');
                return res.redirect('/profile');
            }
            if (newPassword !== confirmPassword) {
                req.flash('error_msg', 'New passwords do not match.');
                return res.redirect('/profile');
            }
            user.password = newPassword; // The pre-save hook will hash it
            updated = true;
        }

        if (updated) {
            await user.save();
            // IMPORTANT: Update the session with the new user info
            req.session.user = { id: user._id, username: user.username, email: user.email };
            req.flash('success_msg', 'Profile updated successfully.');
        } else {
            req.flash('success_msg', 'No changes were made.');
        }

        res.redirect('/profile');
    } catch (err) {
        console.error('Profile Update Error:', err);
        req.flash('error_msg', 'An error occurred while updating your profile.');
        res.redirect('/profile');
    }
}; 