var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
var configAuth = require('./config/auth');

module.exports = function(passport) {

    passport.serializeUser(function(user, done) {
        done(null, user.email);
    });

    passport.deserializeUser(function(email, done) {
        done(null, { 'email': email });
    });

    passport.use(new GoogleStrategy({
            clientID        : configAuth.googleAuth.clientID,
            clientSecret    : configAuth.googleAuth.clientSecret,
            callbackURL     : configAuth.googleAuth.callbackURL
        },
        function(token, refreshToken, profile, done) {

            process.nextTick(function() {

				// If the current user's email is authorized to go on
                if (configAuth.allowedUsers.indexOf(profile.emails[0].value) != -1)
                {
                    return done(null, {
                        name: profile.displayName,
                        email: profile.emails[0].value
                    });
                }
                else
                {
                    // This user is not authorized to continue
                    return done(null);
                }

            });

        }));
};
