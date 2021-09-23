import { Injectable } from '@angular/core';
import {io, Socket} from "socket.io-client";

@Injectable({
    providedIn: 'root'
})
export class WebsocketsService {
    private socket = io('http://localhost:5001', { autoConnect: false });

    constructor() {
    }

    connectToServer(roomId: string, userId: string): Promise<void> {
        return new Promise((resolve, reject) => {
            this.socket.auth = { userId, roomId };
            this.socket.io.opts.query = { roomId };

            this.socket.on("connect_error", (err: any) => {
                reject(err.message);
            });

            this.socket.on("connect", () => {
                resolve();
            });

            this.socket.connect();
        });
    }

    setUpSocketEvent(eventName: string, callback: (event: any) => void) {
        // somebody joined or left the room
        this.socket.on(eventName, callback);
    }

    removeSocketEvent(eventName: string, callback?: (event: any) => void) {
        if (callback) {
            this.socket.off(eventName, callback);
        } else {
            this.socket.off(eventName);
        }
    }

    sendMessage(eventName: string, message: any) {
        this.socket.emit(eventName, message);
    }
}
