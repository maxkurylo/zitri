import { Injectable } from '@angular/core';
import { io } from "socket.io-client";
import {UsersService} from "./users.service";

@Injectable({
    providedIn: 'root'
})
export class WebsocketsService {
    socket = io('http://localhost:5001', { autoConnect: false });

    constructor(private us: UsersService) {
    }

    private setUpSocketEvents() {
        this.socket.on(`room-members-update`, (event: any) => {
            switch (event.type) {
                case 'user-added':
                    this.us.addRoomUser(event.user);
                    break;
                case 'user-left':
                    this.us.removeRoomUser(event.userId);
                    break;
                default:
                    break;
            }
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

            this.setUpSocketEvents();

            this.socket.connect();
        });
    }
}
