const Database = require("./database");

const MESSAGE_EVENTS = [
    'file-transfer-offer',
    'private-message',
    'sdp-offer',
    'sdp-answer',
    'ice-candidate'
];

class Sockets {
    init(server) {
        this.io = require('socket.io')(server, {
            cors: {
                origin: "http://localhost:4201",
            },
        });

        this.io.use((socket, next) => {
            const roomId = socket.handshake.query;
            if (!roomId) {
                return next(new Error("User roomId was not specified"));
            }
            const { userId } = socket.handshake.auth;
            socket.userId = userId;

            // const { userId, roomId } = socket.handshake.auth;
            // const room = Database.getRoomById(roomId);
            // const user = Database.getUserById(userId);
            // if (!userId || !roomId || !user || !room || !room.members.includes(userId)) {
            //     return next(new Error("Invalid credentials"));
            // }
            // socket.userId = userId;
            // socket.roomId = roomId;
            next();
        });

        this.io.on('connection', (socket) => {
            const { roomId } = socket.handshake.query;

            console.log('User joined room id', roomId);

            socket.join(`user-${socket.userId}`); // for private messaging
            socket.join(`room-${roomId}`); // for room broadcasting

            this.setupSocketEvents(socket);
        });
    }

    setupSocketEvents(socket) {
        socket.on("disconnecting", (reason) => {
            const { userId } = socket;
            socket.rooms.forEach(socketRoomId => {
                if (socketRoomId.startsWith('room-')) {
                    // remove room- prefix to get real roomId
                    const roomId = socketRoomId.substring(5);
                    this.removeUserFromDatabase(roomId, userId);
                    const event = { type: 'user-left', userId, roomId };
                    this.emitEvent(`room-${roomId}`, 'room-members-update', event);
                }
            });
            Database.removeUser(userId);
        });

        MESSAGE_EVENTS.forEach(eventName => {
            socket.on(eventName, this.transmitMessage(socket, eventName));
        });
    }

    /**
     * @param receiver: string - can be either roomId or userId
     * @param eventName
     * @param event
     */
    emitEvent(receiver, eventName, event) {
        this.io.to(receiver).emit(eventName, event);
    }

    changeRoom(userId, newRoomId, oldRoomId) {
        const clients = this.io.sockets.adapter.rooms.get(`user-${userId}`);
        clients.forEach(clientId => {
            const socket = this.io.sockets.sockets.get(clientId);
            // leave existing room
            socket.leave(`room-${oldRoomId}`);
            const leaveEvent = { type: 'user-left', userId, roomId: oldRoomId };
            this.emitEvent(`room-${oldRoomId}`, 'room-members-update', leaveEvent);

            // join new room
            const user = Database.getUserById(userId);
            const joinEvent = { type: 'user-added', user, roomId: newRoomId };
            this.emitEvent(`room-${newRoomId}`, 'room-members-update', joinEvent);
            socket.join(`room-${newRoomId}`);
        });
    }

    // TODO: emit event rather than have this method
    removeUserFromDatabase(roomId, userId) {
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
        return ({ message, to }) => {
            socket.to(`user-${to}`).emit(eventName, {
                message,
                from: socket.userId,
            });
        }
    }
}

module.exports = new Sockets();
