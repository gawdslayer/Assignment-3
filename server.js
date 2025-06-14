const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const session = require('express-session');
const expressLayouts = require('express-ejs-layouts');
const flash = require('connect-flash');

// Load environment variables
dotenv.config();

// Create Express app
const app = express();

// Set EJS as templating engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'layout');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Session middleware
app.use(session({
    secret: process.env.SESSION_SECRET || 'a_very_strong_default_secret_key_for_dev', // IMPORTANT: Ensure a strong, unique secret is set in your environment variables for production.
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000,
        httpOnly: true
    }
}));

// Connect flash
app.use(flash());

// Global variables
app.use((req, res, next) => {
    res.locals.currentUser = req.session.user || null;
    res.locals.error_msg = req.flash('error_msg');
    res.locals.success_msg = req.flash('success_msg');
    res.locals.validation_errors = req.flash('validation_errors');
    next();
});

// Database connection
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => {
    console.log('MongoDB Connected Successfully');
    console.log('Database:', mongoose.connection.db.databaseName);
    // mongoose.connection.collections is an object, Object.keys will return an empty array if no collections exist.
    console.log('Collections:', Object.keys(mongoose.connection.collections));
})
.catch(err => {
    console.error('MongoDB Connection Error:', err.message);
    process.exit(1);
});

mongoose.connection.on('error', err => {
  console.error(`MongoDB connection error: ${err.message}`);
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected.');
});

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/notes', require('./routes/notes'));

// Web Page Routes
const webRoutes = require('./routes/web'); // Require the new web routes
app.use('/', webRoutes); // Use the web routes

// Catch 404 and forward to error handler
app.use((req, res, next) => {
    const error = new Error('Page Not Found');
    error.status = 404;
    next(error);
});

// General error handling middleware (must be last)
app.use((err, req, res, next) => {
    console.error('Server Error Handled:', err.message, err.stack || '');

    const statusCode = err.status || 500;
    const errorMessage = statusCode === 500 && process.env.NODE_ENV !== 'development'
                         ? 'An unexpected error occurred on the server.'
                         : err.message || 'Something went wrong!';

    // For API requests, send JSON
    if (req.originalUrl.startsWith('/api/')) {
        return res.status(statusCode).json({ error: errorMessage });
    }

    // For web requests, render the error page
    res.status(statusCode).render('error', {
        title: `Error ${statusCode}`,
        error_message: errorMessage,
        stack: process.env.NODE_ENV === 'development' ? err.stack : null,
        currentUser: req.session.user || null
    });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
    console.log(`MongoDB URI: ${process.env.MONGODB_URI}`);
}); 