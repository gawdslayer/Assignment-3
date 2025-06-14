const express = require('express');
const router = express.Router();
const { check } = require('express-validator');

const webController = require('../controllers/webController');
const userController = require('../controllers/userController');
const { ensureWebAuthenticated, ensureGuest } = require('../middleware/webAuth');

// --- User Authentication Routes ---

// @desc    Show Login page
// @route   GET /login
router.get('/login', ensureGuest, userController.renderLoginForm);

// @desc    Process Login form
// @route   POST /login
const loginValidation = [
    check('email', 'A valid email address is required.').isEmail().normalizeEmail(),
    check('password', 'Password is required.').not().isEmpty()
];
router.post('/login', ensureGuest, loginValidation, userController.loginUser);

// @desc    Show Register page
// @route   GET /register
router.get('/register', ensureGuest, userController.renderRegisterForm);

// @desc    Process Register form
// @route   POST /register
const registerValidation = [
    check('username', 'Username is required and must be between 3 and 20 characters.').not().isEmpty().trim().isLength({ min: 3, max: 20 }),
    check('email', 'A valid email address is required.').isEmail().normalizeEmail(),
    check('password', 'Password is required and must be at least 6 characters long.').isLength({ min: 6 })
];
router.post('/register', ensureGuest, registerValidation, userController.registerUser);

// @desc    Logout user
// @route   GET /logout
router.get('/logout', ensureWebAuthenticated, userController.logoutUser);


// --- Note Management Routes ---

// @desc    Dashboard (or Welcome page if not logged in)
// @route   GET /
router.get('/', webController.renderDashboard);

// @desc    Show add note page
// @route   GET /notes/add
router.get('/notes/add', ensureWebAuthenticated, webController.renderAddNoteForm);

// @desc    Process add note form
// @route   POST /notes/add
router.post('/notes/add', ensureWebAuthenticated, webController.createNote);

// @desc    Show edit note page
// @route   GET /notes/edit/:id
router.get('/notes/edit/:id', ensureWebAuthenticated, webController.renderEditNoteForm);

// @desc    Process edit note form
// @route   POST /notes/edit/:id
router.post('/notes/edit/:id', ensureWebAuthenticated, webController.updateNote);

// @desc    Process delete note request
// @route   POST /notes/delete/:id
router.post('/notes/delete/:id', ensureWebAuthenticated, webController.deleteNote);

// @desc    Show Profile page
// @route   GET /profile
router.get('/profile', ensureWebAuthenticated, userController.renderProfilePage);

// @desc    Handle profile update
// @route   POST /profile
router.post('/profile', ensureWebAuthenticated, userController.updateProfile);

module.exports = router;
