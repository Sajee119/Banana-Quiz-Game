const express = require('express');
const session = require('express-session');
const { MongoStore } = require('connect-mongo');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const env = require('./config/env');
const passport = require('./config/passport');
const gameRoutes = require('./routes/game.routes');
const authRoutes = require('./routes/auth.routes');
const { notFound, errorHandler } = require('./middleware/error.middleware');
const userRoutes = require('./routes/user.routes');

const app = express();

app.disable('x-powered-by');
app.set('trust proxy', 1);

app.use(helmet());
app.use(cors({ origin: env.CLIENT_URL, credentials: true }));
app.use(compression());
app.use(express.json({ limit: '10kb' }));
app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Rate limiting for auth endpoints
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 min
    max: 30,
    message: { success: false, message: 'Too many attempts, try again later' },
});
const gameLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  message: { success: false, message: 'Slow down! Too many game requests.' },
});
const passwordResetLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 15,
    message: { success: false, message: 'Too many password reset attempts, try again later.' },
});

app.use(['/auth/login', '/auth/register'], authLimiter);

app.post(['/auth/forgot-password', '/auth/reset-password'], passwordResetLimiter);

app.use('/api/game', gameLimiter);

app.use(
    session({
        name: 'sid',
        secret: env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        store: MongoStore.create({
            mongoUrl: env.MONGODB_URI,
            ttl: 14 * 24 * 60 * 60, // 14 days
            autoRemove: 'native',
            touchAfter: 24 * 3600,
        }),
        cookie: {
            httpOnly: true,
            secure: env.COOKIE_SECURE, // true in production w/ HTTPS
            sameSite: env.COOKIE_SECURE ? 'none' : 'lax',
            // No maxAge by default: the browser drops the cookie when it closes.
            // Login can opt into a persistent cookie with "Remember me".
        },
    })
);

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

app.get('/', (req, res) => {
    res.json({ message: 'Banana Quiz API', endpoints: { auth: '/auth', user: '/api/users', game: '/api/game' } });
});
app.use('/auth', authRoutes);
app.use('/api/users', userRoutes);

app.get('/health', (req, res) => {
    res.json({
        success: true,
        status: 'ok',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
    });
});

app.use('/api/game', gameRoutes);

// Error handling
app.use(notFound);
app.use(errorHandler);

module.exports = app;