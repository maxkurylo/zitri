import {Strategy, ExtractJwt, VerifiedCallback} from 'passport-jwt';
import Database from "./database";

const JWT_SECRET = process.env.JWT_SECRET;

const opts = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: JWT_SECRET as string,
};

const strategy = new Strategy(opts, (jwtPayload: any, done: VerifiedCallback) => {
    if (jwtPayload.userId) {
        const user = Database.getUserById(jwtPayload.userId);
        return done(null, user);
    }
    return done(null, false);
});

export default strategy;