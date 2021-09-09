import { Injectable } from '@angular/core';
import { io } from "socket.io-client";

@Injectable({
    providedIn: 'root'
})
export class WebsocketsService {
    socket = io('http://localhost:5001', { autoConnect: false });

    constructor() {
    }

    setUpSocketEvent(eventName: string, callback: (event: any) => void) {
        // somebody joined or left the room
        this.socket.on(eventName, callback);
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

            this.socket.connect();
        });
    }

    sendMessage(eventName: string, message: any) {
        this.socket.emit(eventName, message);
    }
}
