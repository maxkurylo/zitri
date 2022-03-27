import {IDatabase, IDBRoom, IDBUser} from "./interfaces";

class Database {
    db: IDatabase = {
        rooms: {},
        users: {}
    };

    addUser(user: IDBUser) {
        this.db.users[user.id] = user;
    }

    removeUser(userId: string) {
        delete this.db.users[userId];
    }

    getUserById(userId: string): IDBUser | null {
        return this.db.users[userId] || null;
    }

    addUserToRoom(userId: string, roomId: string) {
        this.db.rooms[roomId]?.members?.push(userId);
    }

    removeUserFromRoom(userId: string, roomId: string) {
        const roomMembers = this.db.rooms[roomId]?.members || [];
        const index = roomMembers.indexOf(userId);
        if (index !== -1) {
            roomMembers.splice(index, 1);
        }
    }

    addRoom(roomId: string) {
        this.db.rooms[roomId] = { members: [] }
    }

    removeRoom(roomId: string) {
        delete this.db.rooms[roomId];
    }

    getRoomById(roomId: string): IDBRoom | null {
        return this.db.rooms[roomId] || null;
    }
}


// singleton
const database = new Database();
export default database;