import {Strategy, ExtractJwt, VerifiedCallback} from 'passport-jwt';
import {PassportStatic} from 'passport';

const JWT_SECRET = process.env.JWT_SECRET;

export default function(passport: PassportStatic) {

    const opts = {
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        secretOrKey: JWT_SECRET as string,
    };

    passport.use(new Strategy(opts, (jwt_payload: any, done: VerifiedCallback) => {
        if (jwt_payload.userId) {
            return done(null, jwt_payload.userId);
        }
        return done(null, false);
    }));
};
