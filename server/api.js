const express = require("express");
const router = express.Router();
const { uuid } = require('uuidv4');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const passport = require("passport");

const WebSockets = require("./sockets");
const Database = require("./database");

const SECRET = process.env.SECRET;

/**
 * Removes user from old room and add it to the new one.
 * Also used for initial room join
 * oldRoomId - string | null
 * newRoomId - string | null - if null, an id will be generated based on ip
 */
router.post('/change-room', passport.authenticate('jwt', { session: false }), (req, res) => {
    const user = req.user;
    const { oldRoomId } = req.body;
    let { newRoomId } = req.body;

    const oldRoom = Database.getRoomById(oldRoomId);
    if (oldRoom) {
        if (oldRoom.members.length === 1) {
            // if user is the last one in the room, remove entire room
            Database.removeRoom(oldRoomId);
        } else {
            Database.removeUserFromRoom(user.id, oldRoomId)
        }
        const leaveEvent = { type: 'user-left', userId: user.id, roomId: oldRoomId};
        WebSockets.leaveRoom(user.id, `room-${oldRoomId}`);
        WebSockets.emitEvent(`room-${oldRoomId}`, 'room-members-update', leaveEvent);
    }

    // If newRoomId is empty, generate one for displaying devices from the same network
    if (!newRoomId) {
        newRoomId = generateRoomIdFromUserIp(req.headers['cf-connecting-ip'] || req.ip);
    }

    const newRoom = Database.getRoomById(newRoomId);
    const newRoomUsers = [];

    if (newRoom) {
        newRoom.members.forEach(uid => newRoomUsers.push(Database.getUserById(uid)));
    } else {
        // if room does not exist, create it
        Database.addRoom(newRoomId);
    }

    Database.addUserToRoom(user.id, newRoomId);

    const joinEvent = { type: 'user-added', user, roomId: newRoomId};
    WebSockets.joinRoom(user.id, `room-${newRoomId}`);
    WebSockets.emitEvent(`room-${newRoomId}`, 'room-members-update', joinEvent);

    const response = {
        roomId: newRoomId,
        roomUsers: newRoomUsers,
    };
    res.send(response);
});


/**
 * Receives user data - name, avatarUrl, device. Optionally receives roomId
 * Generates missing fields for user (his id) and JWT
 * If roomId was not specified, generate roomId based on user's IP
 * Returns JWT, user data and roomId
 */
router.post('/auth', (req, res) => {
    const { name, avatarUrl, device } = req.body;

    const user = generateUser(name, avatarUrl, device);
    Database.addUser(user);

    const token = jwt.sign(user, SECRET, { expiresIn: 1000 * 60 * 60 * 24 * 365 }); // 1 year
    res.json({ token, user });
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