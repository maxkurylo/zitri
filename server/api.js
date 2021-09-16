const express = require("express");
const router = express.Router();
const { uuid } = require('uuidv4');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const passport = require("passport");

const Sockets = require("./sockets");
const Database = require("./database");

const SECRET = process.env.SECRET || 'maslo';

/**
 * Removes user from old room and add it to the new one.
 * Returns list of users from the new room
 */
router.post('/change-room', passport.authenticate('jwt', { session: false }), (req, res) => {
    const { newRoomId, oldRoomId } = req.body;
    if (!newRoomId || !oldRoomId) {
        return res.status(400).send('Either newRoomId or oldRoomId was not provided');
    }

    const user = req.user;
    const oldRoom = Database.getRoomById(oldRoomId);

    if (!oldRoom) {
        // Avoid memory leaks, when user was added to a new room but was not removed from the old one
        return res.status(400).send('Room you are leaving does not exist.');
    }
    if (!oldRoom) {
        // Avoid memory leaks, when user send an existing roomId but it is not a member of it
        return res.status(400).send('You are not a member of leaving room');
    }
    if (oldRoom.members.length === 1) {
        // if user is the last one in the room, remove entire room
        Database.removeRoom(oldRoomId);
    } else {
        Database.removeUserFromRoom(user.id, oldRoomId)
    }

    Sockets.changeRoom(user.id, newRoomId, oldRoomId);

    const newRoom = Database.getRoomById(newRoomId);
    const newRoomParticipants = [];
    if (!newRoom) {
        // if room does not exist, create it
        Database.addRoom(newRoomId);
    } else {
        newRoom.members.forEach(uid => newRoomParticipants.push(Database.getUserById(uid)));
    }
    res.send(newRoomParticipants);
});

/**
 * Returns all users from requested room
 */
router.get('/get-room-users', passport.authenticate('jwt', { session: false }), (req, res) => {
    const roomId = req.query.roomId;
    const room = Database.getRoomById(roomId);
    if (!room) {
        return res.status(400).send('Room does not exist');
    }
    if (!room.members || !room.members.includes(req.user.id)) {
        return res.status(403).send('You are not allowed to access another room if you are not a member');
    }
    const users = room.members.map(uid => Database.getUserById(uid));
    res.send(users);
});


/**
 * Receives user data - name, avatarUrl, device. Optionally receives roomId
 * Generates missing fields for user (his id) and JWT
 * If roomId was not specified, generate roomId based on user's IP
 * Returns JWT, user data and roomId
 */
router.post('/auth', (req, res) => {
    const { name, avatarUrl, device } = req.body;
    let { roomId } = req.body;

    if (!roomId) {
        // for displaying devices from the same network
        roomId = generateRoomIdFromUserIp(req.headers['cf-connecting-ip'] || req.ip);
    }

    const user = generateUser(name, avatarUrl, device);

    if (!Database.getRoomById(roomId)) {
        // if room doesn't exist, create a new one
        Database.addRoom(roomId);
    }
    Database.addUser(user);
    Database.addUserToRoom(user.id, roomId);

    Sockets.emitEvent(`room-${roomId}`, 'room-members-update', { type: 'user-added', user, roomId });

    const token = jwt.sign(user, SECRET, { expiresIn: 1000 * 60 * 60 * 24 * 365 }); // 1 year
    res.json({ token, user, roomId });
});



function generateUser(name, avatarUrl, device) {
    const userId = uuid();
    return {
        name,
        avatarUrl,
        device,
        id: userId
    };
}

function generateRoomIdFromUserIp(ip) {
    return crypto.createHmac('md5', SECRET).update(ip).digest('hex');
}

module.exports = router;