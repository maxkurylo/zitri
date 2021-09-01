import { Injectable } from '@angular/core';
import { io } from "socket.io-client";
import {UsersService} from "./users.service";
import {User} from "./current-user.service";

@Injectable({
    providedIn: 'root'
})
export class WebsocketsService {
    socket = io('http://localhost:5001', { autoConnect: false });

    constructor(private us: UsersService) {
    }

    private setUpSocketEvents(roomId: string, userId: string) {
        this.socket.on(`room-${roomId}-user-added`, (newUser: User) => {
            console.log('    USER JOINED', newUser);
            this.us.addRoomUser(newUser);
        });

        this.socket.on(`room-${roomId}-user-left`, (newUser: User) => {
            this.us.removeRoomUser(newUser);
        });
    }

    connectToServer(roomId: string, userId: string): Promise<void> {
        return new Promise((resolve, reject) => {
            this.socket.auth = { userId, roomId };

            this.socket.on("connect_error", (err: any) => {
                reject(err.message);
            });

            this.socket.on("connect", () => {
                resolve();
            });

            this.setUpSocketEvents(roomId, userId);

            this.socket.connect();
        });
    }
}
