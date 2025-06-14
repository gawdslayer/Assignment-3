const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
    // First, check for a web session user. This is the primary method for the web app.
    if (req.session && req.session.user) {
        // Attach the session user to the request object for consistency
        req.user = req.session.user;
        return next();
    }

    // If no session, check for a JWT Authorization header (for API clients)
    const authHeader = req.header('Authorization');

    if (!authHeader) {
        // No session and no token
        return res.status(401).json({ msg: 'No token or session user, authorization denied' });
    }

    const tokenParts = authHeader.split(' ');

    if (tokenParts.length !== 2 || tokenParts[0] !== 'Bearer') {
        return res.status(401).json({ msg: 'Token is malformed' });
    }

    const token = tokenParts[1];

    // Verify the JWT token
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded.user;
        next();
    } catch (err) {
        res.status(401).json({ msg: 'Token is not valid' });
    }
}; 