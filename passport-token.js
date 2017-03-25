var GoogleTokenStrategy = require('passport-google-id-token');
var configAuth = require('./config/auth');

module.exports = function(passport) {

    passport.serializeUser(function(user, done) {
        done(null, user.email);
    });

    passport.deserializeUser(function(email, done) {
        done(null, { 'email': email });
    });

    passport.use(new GoogleTokenStrategy({
            clientID: configAuth.googleAuth.clientID
        },
        function (parsedToken, googleId, done) {

          var email = parsedToken.payload.email;

            process.nextTick(function() {

                // If the current user's email is authorized to go on
                if (configAuth.allowedUsers.indexOf(email) != -1)
                {
                    return done(null, {
                        name: parsedToken.payload.name,
                        email: email
                    });
                }
                else
                {
                    // This user is not authorized to continue
                    return done(null);
                }
            });
        }
    ));
};