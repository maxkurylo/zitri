const express = require("express");
const router = express.Router();
const { uuid } = require('uuidv4');
const crypto = require('crypto');

const Sockets = require("./sockets");
const Database = require("./database");

const SECRET = process.env.SECRET || 'maslo';


router.get('/getRoomUsers', (req, res) => {
    const roomId = req.query.roomId;
    const room = Database.getRoomById(roomId);
    if (!room) {
        res.status(400).send('Room does not exist');
    }
    const participantIds = room.participants;
    const users = participantIds.map(uid => Database.getUserById(uid));
    res.send(users);
});

router.post('/auth', (req, res) => {
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

    Sockets.emitEvent(roomId, 'room-members-update', { type: 'user-added', user, roomId });
    res.send({ user, roomId });
});

module.exports = router;