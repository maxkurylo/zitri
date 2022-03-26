
export interface User {
    id?: string;
    name?: string;
    avatarUrl?: string;
    device?: string;

}

export interface AuthInfo {
    token: string;
    user: User;
}

export interface RoomInfo {
    roomId: string;
    roomUsers: User[];
}
