/* eslint-env node */
if (process.env.NODE_ENV === 'development') {
    require('dotenv').config();
}
const http = require('http');
const express = require('express');
const cors = require('cors');
const compression = require('compression');
const path = require('path');
const bodyParser = require('body-parser');
const Sockets = require('./sockets');
const passport = require('passport');

const PORT = process.env.PORT || 5001;

const app = express();
const server = http.createServer(app);
Sockets.init(server);

// Passport stuff
passport.serializeUser(function(user, done) {
    done(null, user);
});

passport.deserializeUser(function(obj, done) {
    done(null, obj);
});


app.use(passport.initialize());
app.use(passport.session());

require('./auth')(passport);

// end of passport stuff


app.use(cors());
app.use(compression());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));
app.enable('trust proxy');

const api = require('./api');
app.use("/api", api);

server.listen(PORT, () => console.log(`Backend listening on port ${PORT}!`));

