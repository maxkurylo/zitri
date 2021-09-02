const DATABASE = {
    rooms: {},
    users: {}
};

function addUser(user) {
    DATABASE.users[user.id] = user;
}

function removeUser(userId) {
    delete DATABASE.users[userId];
}

function getUserById(userId) {
    return DATABASE.users[userId];
}

function getRoomById(roomId) {
    return DATABASE.rooms[roomId];
}

function addRoom(roomId) {
    DATABASE.rooms[roomId] = { participants: [] }
}

function removeRoom(roomId) {
    delete DATABASE.rooms[roomId];
}

function addUserToRoom(userId, roomId) {
    DATABASE.rooms[roomId].participants.push(userId);
}

function removeUserFromRoom(userId, roomId) {
    const roomParticipants = DATABASE.rooms[roomId].participants;
    const index = roomParticipants.indexOf(userId);
    if (index !== -1) {
        roomParticipants.splice(index, 1);
    }
}

module.exports = {
    addUser,
    removeUser,
    getUserById,
    getRoomById,
    addRoom,
    removeRoom,
    addUserToRoom,
    removeUserFromRoom
};