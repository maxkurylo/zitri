import {IDatabase, IDBRoom, IDBUser} from "./interfaces";

class Database {
    private db: IDatabase = {
        rooms: {},
        users: {}
    };

    public addUser(user: IDBUser) {
        this.db.users[user.id] = user;
    }

    public removeUser(userId: string) {
        delete this.db.users[userId];
    }

    public getUserById(userId: string): IDBUser | null {
        return this.db.users[userId] || null;
    }

    public addUserToRoom(userId: string, roomId: string) {
        this.db.rooms[roomId]?.members?.push(userId);
    }

    public removeUserFromRoom(userId: string, roomId: string) {
        const roomMembers = this.db.rooms[roomId]?.members || [];
        const index = roomMembers.indexOf(userId);
        if (index !== -1) {
            roomMembers.splice(index, 1);
        }
    }

    public addRoom(roomId: string) {
        this.db.rooms[roomId] = { members: [] }
    }

    public removeRoom(roomId: string) {
        delete this.db.rooms[roomId];
    }

    public getRoomById(roomId: string): IDBRoom | null {
        return this.db.rooms[roomId] || null;
    }

    public getUserRoomIds(userId: string): Array<string> {
        const allRoomIds = Object.keys(this.db.rooms);
        return allRoomIds.filter(rId => this.db.rooms[rId].members?.includes(userId));
    }
}


// singleton
const database = new Database();
export default database;