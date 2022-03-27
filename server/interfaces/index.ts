export interface IDBUser {
    id: string,
    name: string,
    avatarUrl?: string,
    device?: string,
}

export interface IDBRoom {
    members: Array<string>
}

export interface IDatabase {
    users: {[userId: string]: IDBUser},
    rooms: {[userId: string]: IDBRoom},
}