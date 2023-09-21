const passport = require("passport");
const { Strategy, ExtractJwt } = require("passport-jwt");

const auth = passport.use(
    new Strategy(
        {
            secretOrKey: "RANDOM_TOKEN",
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken()
        },
        async (tokenPayload, cb) => {
            try {
                return cb(null, tokenPayload);
            } catch (error) {
                cb(error);
            }
        }
    )
);

module.exports = auth; 
