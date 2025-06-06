const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Helper function to determine if the request is an API request
const isApiRequest = (req) => req.originalUrl.startsWith('/api/') || (req.xhr || (req.headers.accept && req.headers.accept.includes('application/json')));

module.exports = async function(req, res, next) {
    const token = req.session.token;
    const sessionUser = req.session.user;

    if (!token || !sessionUser) {
        if (isApiRequest(req)) {
            return res.status(401).json({ error: 'No token or session user, authorization denied' });
        }
        req.flash('error_msg', 'Please log in to access your Notes.');
        return res.redirect('/login');
    }

    try {
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // It's good practice to ensure the user from the token still exists and is valid
        const userFromDb = await User.findById(decoded.id).select('-password');
        if (!userFromDb) {
            if (isApiRequest(req)) {
                return res.status(401).json({ error: 'User not found, token invalid' });
            }
            req.flash('error_msg', 'Authentication error. Please log in again.');
            return res.redirect('/login');
        }

        // Check if session user ID matches token user ID and DB user ID
        if (sessionUser.id !== decoded.id || sessionUser.id !== userFromDb.id.toString()) {
            if (isApiRequest(req)) {
                return res.status(401).json({ error: 'Wrong user, authorization denied' });
            }
            req.flash('error_msg', 'Session mismatch. Please log in again.');
            // Consider destroying the session here before redirecting
            // req.session.destroy(); 
            return res.redirect('/login');
        }

        req.user = userFromDb; // Attach the full user object from DB (without password)
        next();
    } catch (err) {
        console.error('Token verification or user validation error:', err.message);
        if (isApiRequest(req)) {
            return res.status(401).json({ error: 'Token is not valid or expired' });
        }
        req.flash('error_msg', 'Your session has expired or is invalid. Please log in again.');
        // Consider destroying the session here before redirecting
        // req.session.destroy(); 
        return res.redirect('/login');
    }
}; 