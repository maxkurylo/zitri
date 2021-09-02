const Database = require("./database");


module.exports = function(server) {
    const io = require('socket.io')(server, {
        cors: {
            origin: "http://localhost:4200",
        },
    });

    io.use((socket, next) => {
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

    io.on('connection', (socket) => {
        // socket.on('msg-from-client', (msg) => {
        //     console.log(msg);
        // });

        socket.on("disconnect", (reason) => {
            const {roomId, userId } = socket;
            const user = Database.getUserById(userId);

            // TODO replace broadcasting with room connections
            io.emit(`room-${roomId}`, { type: 'user-left', user }); // broadcast to room that user left
            Database.removeUser(userId);
            Database.removeUserFromRoom(userId, roomId);

            const room = Database.getRoomById(roomId);
            if (room && room.participants.length === 0) {
                // if room is empty, remove it from db
                Database.removeRoom(roomId)
            }
        });
    });

    return io;
};
