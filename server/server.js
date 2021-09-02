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

const app = express();
const server = http.createServer(app);

const Database = require("./database");
const Sockets = require('./sockets')(server);

const PORT = process.env.PORT || 5001;

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
        roomId = '2'; // generate room id
    }

    const userId = +Math.floor(Math.random() * 1000000000000);
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
    // TODO replace broadcasting with room connections
    Sockets.emit(`room-${roomId}`, { type: 'user-added', user }); // broadcast to room that user joined
    res.send({ user, roomId });
});

server.listen(PORT, () => console.log(`Backend listening on port ${PORT}!`));

