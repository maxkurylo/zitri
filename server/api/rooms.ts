import express, {Request, Response} from 'express';
import crypto from 'crypto';

import WebSockets, {SocketMessage} from "../modules/sockets";
import Database from "../database";
import {IDBUser, IRoomInfo} from "../interfaces";
import jwtMiddleware from "../modules/jwt-middleware";

const ROOM_SECRET: string = process.env.ROOM_SECRET as string;

const router = express.Router();


// TODO: move this event listener to the other place
// remove user everywhere if it was disconnected from sockets
WebSockets.event$.subscribe((e: SocketMessage) => {
    if (e.type === 'user-disconnected') {
        const userId = e.message;
        leaveAllRooms(userId);
        Database.removeUser(userId);
    }
});


/**
 * Removes user from old room and add it to the new one.
 * Also used for initial room join
 * newRoomId - string | null - if null, an id will be generated based on ip
 */
router.post('/change-room', jwtMiddleware, (req: Request, res: Response) => {
    const user = req.user as IDBUser;
    let newRoomId: string = req.body.newRoomId;

    // If newRoomId is empty, generate one for displaying devices from the same network
    if (!newRoomId) {
        const userIp = req.headers['cf-connecting-ip'] || req.ip
        newRoomId = generateRoomIdFromUserIp(userIp as string);
    }

    // remove user from old room
    leaveAllRooms(user.id);

    const roomInfo = joinRoom(newRoomId, user);

    joinSocketRoom(newRoomId, user);

    res.send(roomInfo);
});


function generateRoomIdFromUserIp(ip: string): string {
    return crypto.createHmac('md5', ROOM_SECRET).update(ip).digest('hex');
}


function joinRoom(roomId: string, user: IDBUser): IRoomInfo {
    // add user to the new room
    const newRoom = Database.getRoomById(roomId);
    let newRoomUsers: IDBUser[] = [];

    if (newRoom) {
        newRoom.members.forEach(uid => {
            const u = Database.getUserById(uid);
            if (u) { newRoomUsers.push(u); }
        });
    } else {
        // if room does not exist, create it
        Database.addRoom(roomId);
        newRoomUsers = [ user ];
    }

    Database.addUserToRoom(user.id, roomId);

   return {
        roomId,
        roomUsers: newRoomUsers,
    };
}



function joinSocketRoom(roomId: string, user: IDBUser): void {
    // send socket events that specific user joined
    const joinMessage: SocketMessage = {
        type: 'room-user-joined',
        to: [roomId],
        message: {
            roomId,
            user
        },
    };
    WebSockets.sendMessage(joinMessage);
    // join to the sockets room
    WebSockets.joinRoom(user.id, roomId);
}


function leaveAllRooms(userId: string): void {
    const roomIds = Database.getUserRooms(userId);
    roomIds.forEach(roomId => {
        const room = Database.getRoomById(roomId);
        if (room && room.members.length <= 1) {
            // if it is the last user in room, just remove entire room
            Database.removeRoom(roomId);
        } else {
            Database.removeUserFromRoom(userId, roomId);
        }
        leaveSocketRoom(userId, roomId);
    })
}


function leaveSocketRoom(userId: string, roomId: string): void {
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

export default router;