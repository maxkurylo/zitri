import express from 'express';
import { uuid } from 'uuidv4';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import passport from 'passport';

import WebSockets, {SocketMessage} from "./modules/sockets";
import Database from "./database";
import {IDBUser} from "./interfaces";

const ROOM_SECRET: string = process.env.ROOM_SECRET || '';
const JWT_SECRET: string = process.env.JWT_SECRET || '';

const router = express.Router();

// remove user everywhere if it was disconnected from sockets
WebSockets.event$.subscribe((e: SocketMessage) => {
    if (e.type === 'user-disconnected') {
        const userId = e.message;
        Database.getUserRoomIds(userId).forEach(rId => {
            removeUserFromRoomInDatabase(userId, rId);
        });
        Database.removeUser(userId);
    }
});


/**
 * Removes user from old room and add it to the new one.
 * Also used for initial room join
 * oldRoomId - string | null
 * newRoomId - string | null - if null, an id will be generated based on ip
 */
router.post(
    '/change-room',
    passport.authenticate('jwt', { session: false }),
    (req: any, res: any) => {
        const userId: string = req.user;
        const oldRoomId: string = req.body.oldRoomId;
        let newRoomId: string = req.body.newRoomId;

        const user = Database.getUserById(userId);

        if (!user) {
            return res.status(403).send('User does not exist');
        }

        // remove user from old room
        removeUserFromRoomInDatabase(userId, oldRoomId);

        // If newRoomId is empty, generate one for displaying devices from the same network
        if (!newRoomId) {
            newRoomId = generateRoomIdFromUserIp(req.headers['cf-connecting-ip'] || req.ip);
        }

        // add user to the new room
        const newRoom = Database.getRoomById(newRoomId);
        let newRoomUsers: Array<IDBUser> = [];

        if (newRoom) {
            newRoom.members.forEach(uid => {
                const u = Database.getUserById(uid);
                if (u) { newRoomUsers.push(u); }
            });
        } else {
            // if room does not exist, create it
            Database.addRoom(newRoomId);
            newRoomUsers = [ user ];
        }

        Database.addUserToRoom(userId, newRoomId);

        // send socket events that specific user joined
        const joinMessage: SocketMessage = {
            type: 'room-user-joined',
            to: [newRoomId],
            message: {
                roomId: newRoomId,
                user
            },
        };
        WebSockets.sendMessage(joinMessage);
        // join to the sockets room
        WebSockets.joinRoom(userId, newRoomId);

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

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: 1000 * 60 * 60 * 24 * 365 }); // 1 year
    res.json({ token, user });
});



function generateUser(name: string, avatarUrl: string, device: string) {
    const userId = uuid();
    return {
        name,
        avatarUrl,
        device,
        id: userId
    };
}

function generateRoomIdFromUserIp(ip: string) {
    return crypto.createHmac('md5', ROOM_SECRET).update(ip).digest('hex');
}

function removeUserFromRoomInDatabase(userId: string, roomId: string) {
    const room = Database.getRoomById(roomId);

    if (room) {
        if (room.members.length <= 1) {
            // if this is the last user in room, just remove the entire room
            Database.removeRoom(roomId);
        } else {
            Database.removeUserFromRoom(userId, roomId);
        }
        const leaveEvent: SocketMessage = {
            type: 'room-user-left',
            to: [roomId],
            message: {
                userId,
                roomId
            },
        };
        WebSockets.leaveRoom(userId, roomId);
        WebSockets.sendMessage(leaveEvent);
    }
}

export default router;