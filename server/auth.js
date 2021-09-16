const Database = require('./database');
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;

const SECRET = process.env.SECRET || 'maslo';

module.exports = function(passport) {
    const opts = {
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        secretOrKey: SECRET,
    };

    passport.use(new JwtStrategy(opts, function(jwt_payload, done) {
        const user = Database.getUserById(jwt_payload.id);
        if (!user) {
            return done(null, false);
        }
        return done(null, user);
    }));
};
