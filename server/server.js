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
const { uuid } = require('uuidv4');
const crypto = require('crypto');

const app = express();
const server = http.createServer(app);

const Database = require("./database");
const io = require('./sockets')(server);

const PORT = process.env.PORT || 5001;
const SECRET = process.env.SECRET || 'maslo';

app.use(cors());
app.use(compression());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));
app.enable('trust proxy');


app.get('/api/getRoomUsers', (req, res) => {
    const roomId = req.query.roomId;
    const room = Database.getRoomById(roomId);
    if (!room) {
        res.status(400).send('Room does not exist');
    }
    const participantIds = room.participants;
    const users = participantIds.map(uid => Database.getUserById(uid));
    res.send(users);
});

app.post('/api/auth', (req, res) => {
    const { name, avatarUrl, device } = req.body;
    let { roomId } = req.body;

    if (!roomId) {
        const ip = req.headers['cf-connecting-ip'] || req.ip;
        // generate roomId based on user ip (for displaying devices in local network)
        roomId = crypto.createHmac('md5', SECRET).update(ip).digest('hex');
    }

    const userId = uuid();
    const user = {
        name,
        avatarUrl,
        device,
        id: userId
    };
    Database.addUser(user);

    if (!Database.getRoomById(roomId)) {
        Database.addRoom(roomId);
    }
    Database.addUser(user);
    Database.addUserToRoom(user.id, roomId);

    io.to(roomId).emit(`room-members-update`, { type: 'user-added', user, roomId });
    res.send({ user, roomId });
});

server.listen(PORT, () => console.log(`Backend listening on port ${PORT}!`));

