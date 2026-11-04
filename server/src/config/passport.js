const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const User = require('../models/User');
const env = require('./env');
const logger = require('../utils/logger');

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user || false);
    } catch (err) {
        logger.error('Error deserializing user:', err);
        done(err, null);
    }
});

async function handleOAuth(providerName, providerId, profileData, done) {
    try {
        const { user, isNew } = await User.findOrCreateByProvider(providerName, providerId, profileData);
        logger.info(`OAuth ${providerName}: ${isNew ? 'new' : 'existing'} user ${user.id}`);
        done(null, user);
    } catch (err) {
        logger.error(`OAuth ${providerName} error:`, err);
        done(err, null);
    }
}

// Google OAuth Strategy
passport.use(
    new GoogleStrategy(
        {
            clientID: env.GOOGLE_CLIENT_ID,
            clientSecret: env.GOOGLE_CLIENT_SECRET,
            callbackURL: `${env.AUTH_CALLBACK_URL}/auth/google/callback`,
        },
        (_accessToken, _refreshToken, profile, done) => {
            handleOAuth(
                'google',
                profile.id,
                {
                    email: profile.emails?.[0]?.value?.toLowerCase(),
                    firstName: profile.name?.givenName || '',
                    lastName: profile.name?.familyName || '',
                    avatar: profile.photos?.[0]?.value || null,
                },
                done
            );
        }
    )
);

// Facebook OAuth Strategy
passport.use(
    new FacebookStrategy(
        {
            clientID: env.FACEBOOK_APP_ID,
            clientSecret: env.FACEBOOK_APP_SECRET,
            callbackURL: `${env.AUTH_CALLBACK_URL}/auth/facebook/callback`,
            profileFields: ['id', 'name', 'picture.type(large)'],
        },
        (_accessToken, _refreshToken, profile, done) => {
            handleOAuth(
                'facebook',
                profile.id,
                {
                    email: profile.emails?.[0]?.value?.toLowerCase()
                        || `facebook-${profile.id}@users.invalid`,
                    firstName: profile.name?.givenName || '',
                    lastName: profile.name?.familyName || '',
                    avatar: profile.photos?.[0]?.value || null,
                },
                done
            );
        }
    )
);

module.exports = passport;