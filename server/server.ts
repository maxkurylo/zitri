// Prerequisites
if (process.env.NODE_ENV === 'development') {
    require('dotenv').config();
}
if (!process.env.JWT_SECRET || !process.env.ROOM_SECRET) {
    throw 'App secrets are missing! Add ROOM_SECRET and JWT_SECRET environment variables'
}

// external imports
import http from 'http';
import express from 'express';
import cors from 'cors';
import compression from 'compression';
import path from 'path';
import bodyParser from 'body-parser';
import passport from 'passport';

// own modules imports
import enableSSLForProduction from './modules/ssl-for-production'
import WebSockets from './modules/sockets';
import api from './api';
import Auth from './auth';

// constants
const PORT = process.env.PORT || 5001;
const CLIENT_DIST_DIRECTORY = '../client/dist/client';
const CLIENT_INDEX_PATH = path.join(__dirname, CLIENT_DIST_DIRECTORY, 'index.html');

// Passport stuff
passport.serializeUser((user: Express.User, done: any) => { done(null, user); });
passport.deserializeUser((obj: Express.User, done: any) => { done(null, obj); });

// app creation
const app = express();
const server = http.createServer(app);

// app configuration
enableSSLForProduction(app);
app.use(passport.initialize());
app.use(passport.session());
app.use(cors());
app.use(compression());
app.use(bodyParser.json());
app.enable('trust proxy');

// add websockets
WebSockets.init(server, passport);

// authentication
Auth(passport);

// API
app.use("/api", api);

// serve static files
app.use(express.static(path.join(__dirname, CLIENT_DIST_DIRECTORY)));

// Handle Angular routing
app.get('*', (req: any, res: any) => { res.sendFile(CLIENT_INDEX_PATH); });

// start listening
server.listen(PORT, () => console.log(`Backend listening on port ${PORT}!`));

