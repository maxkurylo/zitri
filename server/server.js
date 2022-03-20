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
const passport = require('passport');

const WebSockets = require('./sockets');
const api = require('./api');

const PORT = process.env.PORT || 5001;
const CLIENT_DIST_DIRECTORY = '../client/dist/client';
const CLIENT_INDEX_PATH = path.join(__dirname, CLIENT_DIST_DIRECTORY, 'index.html');


const app = express();
const server = http.createServer(app);


// Passport stuff
passport.serializeUser((user, done) => { done(null, user); });
passport.deserializeUser((obj, done) => { done(null, obj); });


app.use(passport.initialize());
app.use(passport.session());
app.use(cors());
app.use(compression());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, CLIENT_DIST_DIRECTORY)));
app.enable('trust proxy');


if (process.env.NODE_ENV !== 'development') {
    // Force SSL
    app.use((req, res, next) => {
        req.secure ? next() : res.redirect('https://' + req.headers.host + req.url)
    });
}

WebSockets.init(server, passport);

require('./auth')(passport);

app.use("/api", api);

// IMPORTANT! KEEP IT AFTER ALL APIs
// Handle Angular routing
app.get('*', (req, res) => { res.sendFile(CLIENT_INDEX_PATH); });

server.listen(PORT, () => console.log(`Backend listening on port ${PORT}!`));

