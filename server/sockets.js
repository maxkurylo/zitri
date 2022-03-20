const socketIo = require('socket.io');
const Database = require("./database");

const MESSAGE_EVENTS = [
    'file-transfer',
    'private-message',
    'sdp-offer',
    'sdp-answer',
    'ice-candidate',
];

const wrap = middleware => (socket, next) => middleware(socket.request, {}, next);

class WebSockets {
    io;

    init(server, passport) {
        this.io = socketIo(server);

        this.io.use(wrap(passport.initialize()));
        this.io.use(wrap(passport.session()));
        this.io.use(wrap(passport.authenticate(['jwt'])));

        this.io.use((socket, next) => {
            if (socket.request.user) {
                next();
            } else {
                next(new Error("Unauthorized"))
            }
        });

        this.io.on('connection', (socket) => {
            const { id: userId } = socket.request.user;
            socket.join(`user-${userId}`); // for personal events
            this.setupSocketEvents(socket);
            // const { roomId } = socket.handshake.query;
        });
    }

    setupSocketEvents(socket) {
        socket.on("disconnecting", (reason) => {
            const user = socket.request.user;
            // emit event that user disconnected
            socket.rooms.forEach(socketRoomId => {
                if (socketRoomId.startsWith('room-')) {
                    // remove user from all rooms
                    const roomId = socketRoomId.substring(5);
                    this.removeUserFromRoomInDatabase(user.id, roomId);
                    const leaveEvent = { type: 'user-left', userId: user.id, roomId };
                    this.emitEvent(`room-${roomId}`, 'room-members-update', leaveEvent);
                }
            });
            Database.removeUser(user.id);
        });

        MESSAGE_EVENTS.forEach(eventName => {
            socket.on(eventName, this.transmitMessage(socket, eventName));
        });
    }

    /**
     * @param to: string - can be either roomId or userId
     * @param eventName: string
     * @param message: object
     */
    emitEvent(to, eventName, message) {
        this.io.to(to).emit(eventName, message);
    }


    joinRoom(userId, roomName) {
        const socket = this.getSocketsByRoomName(`user-${userId}`)[0];
        socket.join(roomName);
    }

    leaveRoom(userId, roomName) {
        const socket = this.getSocketsByRoomName(`user-${userId}`)[0];
        socket.leave(roomName);
    }


    getSocketsByRoomName(roomName) {
        const sockets = [];
        const ids = this.io.sockets.adapter.rooms.get(roomName);
        ids.forEach(id => sockets.push(this.io.sockets.sockets.get(id)));
        return sockets;
    }


    // rubbish


    // TODO: emit event rather than have this method
    removeUserFromRoomInDatabase(userId, roomId) {
        const room = Database.getRoomById(roomId);

        if (room) {
            if (room.members.length <= 1) {
                // if this is the last user in room, just remove the entire room
                Database.removeRoom(roomId);
            } else {
                Database.removeUserFromRoom(userId, roomId);
            }
        }
    }

    transmitMessage(socket, eventName) {
        const { id: userId } = socket.request.user;
        return ({ message, to }) => {
            socket.to(`user-${to}`).emit(eventName, {
                message,
                from: userId,
            });
        }
    }
}

// Singleton
const webSockets = new WebSockets();
module.exports = webSockets;
