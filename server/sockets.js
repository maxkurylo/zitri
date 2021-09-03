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

        socket.join(socket.userId); // for private messaging
        socket.join(socket.roomId); // for room broadcasting

        socket.on("disconnect", (reason) => {
            const {roomId, userId } = socket;
            const room = Database.getRoomById(roomId);

            if (room.participants.length <= 1) {
                // if this is the last user in room, just remove the entire room
                Database.removeRoom(roomId);
            } else {
                io.to(roomId).emit(`room-members-update`, { type: 'user-left', userId, roomId });
                Database.removeUserFromRoom(userId, roomId);
            }
            Database.removeUser(userId);
        });
    });

    return io;
};
