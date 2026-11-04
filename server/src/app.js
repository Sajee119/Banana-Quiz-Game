const express = require('express');
const passport = require('./config/passport');
const userRoutes = require('./routes/user.routes');

const app = express();

app.use(passport.initialize());
app.use(passport.session());

app.use((req, res, next) => {
    if (!req.isAuthenticated || !req.isAuthenticated() || !req.user) return next();

    const sessionVersion = req.session?.authVersion ?? 0;
    const userVersion = req.user.authVersion ?? 0;
    if (sessionVersion === userVersion) return next();

    req.logout((err) => {
        if (err) return next(err);
        req.session.destroy((destroyErr) => {
            if (destroyErr) return next(destroyErr);
            res.clearCookie('sid', { path: '/' });
            next();
        });
    });
});

app.use('/api/users', userRoutes);

app.get('/health', (req, res) => {
    res.json({
        success: true,
        status: 'ok',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
    });
});

// Error handling
app.use(notFound);
app.use(errorHandler);

module.exports = app;