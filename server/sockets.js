const Database = require("./database");

class Sockets {
    init(server) {
        this.io = require('socket.io')(server, {
            cors: {
                origin: "http://localhost:4200",
            },
        });

        this.io.use((socket, next) => {
            const { userId, roomId } = socket.handshake.auth;
            const room = Database.getRoomById(roomId);
            const user = Database.getUserById(userId);
            if (!userId || !roomId || !user || !room || !room.participants.includes(userId)) {
                return next(new Error("Invalid credentials"));
            }
            socket.userId = userId;
            socket.roomId = roomId;
            next();
        });

        this.io.on('connection', (socket) => {
            // socket.on('msg-from-client', (msg) => {
            //     console.log(msg);
            // });

            socket.join(socket.userId); // for private messaging
            socket.join(socket.roomId); // for room broadcasting

            socket.on("disconnect", (reason) => {
                const {roomId, userId } = socket;
                const room = Database.getRoomById(roomId);

                if (room.participants.length <= 1) {
                    // if this is the last user in room, just remove the entire room
                    Database.removeRoom(roomId);
                } else {
                    const event = { type: 'user-left', userId, roomId };
                    this.emitEvent(roomId, 'room-members-update', event);
                    Database.removeUserFromRoom(userId, roomId);
                }
                Database.removeUser(userId);
            });
        });
    }

    /**
     * @param reciever: string - can be either roomId or userId
     * @param eventName
     * @param event
     */
    emitEvent(reciever, eventName, event) {
        this.io.to(reciever).emit(eventName, event);
    }
}

module.exports = new Sockets();
