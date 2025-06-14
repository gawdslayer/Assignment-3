module.exports = {
    ensureWebAuthenticated: function (req, res, next) {
        if (req.session.user) {
            return next();
        }
        req.flash('error_msg', 'Please log in to view that resource');
        res.redirect('/login');
    },
    ensureGuest: function (req, res, next) {
        if (req.session.user) {
            res.redirect('/');
        } else {
            return next();
        }
    }
}; 