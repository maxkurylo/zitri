import passport, {AuthenticateOptions} from "passport";

const options: AuthenticateOptions = {
    session: false
};

export default passport.authenticate('jwt', options)