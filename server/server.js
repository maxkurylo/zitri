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

const PORT = process.env.PORT || 5001;

const DATABASE = {
    rooms: {},
    users: {}
};

const app = express();
const server = http.createServer(app);
const io = require('socket.io')(server, {
    cors: {
        origin: "http://localhost:4200",
    },
});

io.use((socket, next) => {
    const { userId, roomId } = socket.handshake.auth;
    if (!userId || !roomId) {
        return next(new Error("invalid userId or roomId"));
    }
    socket.userId = userId;
    socket.roomId = roomId;
    next();
});

io.on('connection', (socket) => {
    console.log('User connected');
    // io.emit('msg', "Hello!");
    // io.emit(`user${id}`, "Hello!"); // broadcast to specific channel


    socket.on('msg-from-client', (msg) => {
        console.log(msg);
    });

    socket.on("disconnect", (reason) => {
        delete DATABASE.users[socket.userId];

        const roomParticipants = DATABASE.rooms[socket.roomId].participants;
        const index = roomParticipants.indexOf(socket.userId);
        if (index !== -1) {
            roomParticipants.splice(index, 1);
        }
        if (!roomParticipants.length) {
            // if room is empty, remove it from db
            delete DATABASE.rooms[socket.roomId];
        }
    });
});

app.use(cors());
app.use(compression());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));
app.enable('trust proxy');


app.post('/api/auth', (req, res) => {
    const { name, avatarUrl, device } = req.body;
    let { roomId } = req.body;

    if (!roomId) {
        roomId = '2'; // generate room id
    }

    const userId = +Math.floor(Math.random() * 10);
    const user = {
        name,
        avatarUrl,
        device,
        id: userId
    };
    if (DATABASE.rooms[roomId] && DATABASE.rooms[roomId].participants) {
        DATABASE.rooms[roomId].participants.push(userId);
    } else {
        DATABASE.rooms[roomId] = { participants: [userId], messages: []};
    }
    DATABASE.users[userId] = user;
    io.emit(roomId, user); // broadcast to room that user was joined channel
    res.send({ user, roomId });
});

server.listen(PORT, () => console.log(`Backend listening on port ${PORT}!`));

