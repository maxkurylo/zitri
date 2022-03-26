/* eslint-env node */
if (process.env.NODE_ENV === 'development') {
    require('dotenv').config();
}

if (!process.env.JWT_SECRET || !process.env.ROOM_SECRET) {
    throw 'App secrets are missing! Add ROOM_SECRET and JWT_SECRET environment variables'
}
import http from 'http';
import express from 'express';
import cors from 'cors';
import compression from 'compression';
import path from 'path';
import bodyParser from 'body-parser';
import passport from 'passport';

import WebSockets from './sockets';
import api from './api';

const PORT = process.env.PORT || 5001;
const CLIENT_DIST_DIRECTORY = '../client/dist/client';
const CLIENT_INDEX_PATH = path.join(__dirname, CLIENT_DIST_DIRECTORY, 'index.html');


const app = express();
const server = http.createServer(app);


// Passport stuff
passport.serializeUser((user: Express.User, done: any) => { done(null, user); });
passport.deserializeUser((obj: Express.User, done: any) => { done(null, obj); });


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
// TODO: set correct types for requests and responses everywhere
app.get('*', (req: any, res: any) => { res.sendFile(CLIENT_INDEX_PATH); });

server.listen(PORT, () => console.log(`Backend listening on port ${PORT}!`));

