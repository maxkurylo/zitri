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
const pathToClientDist = '../client/dist/client';

const app = express();
const server = http.createServer(app);

// Passport stuff
passport.serializeUser(function(user, done) {
    done(null, user);
});

passport.deserializeUser(function(obj, done) {
    done(null, obj);
});


app.use(passport.initialize());
app.use(passport.session());


app.use(cors());
app.use(compression());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));
app.enable('trust proxy');

console.log(process.env.NODE_ENV);

if (process.env.NODE_ENV !== 'development') {
    // Force SSL
    app.use((req, res, next) => {
        req.secure ? next() : res.redirect('https://' + req.headers.host + req.url)
    });
}

Sockets.init(server, passport);

require('./auth')(passport);

const api = require('./api');
app.use("/api", api);


// Serve any static files
app.use(express.static(path.join(__dirname, pathToClientDist)));

// Handle React routing, return all requests to React app
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, pathToClientDist, 'index.html'));
});


server.listen(PORT, () => console.log(`Backend listening on port ${PORT}!`));

