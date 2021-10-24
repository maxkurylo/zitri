import { Injectable } from '@angular/core';
import {io, Socket} from "socket.io-client";

@Injectable({
    providedIn: 'root'
})
export class WebsocketsService {
    private socket: Socket<any> | null = null;

    constructor() {
    }

    init() {
        this.socket = io({
            autoConnect: false,
            path: '/socket',
            extraHeaders: {
                Authorization: "Bearer " + localStorage.getItem('token'),
            }
        });
    }

    connectToServer(roomId: string, userId: string): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!this.socket) {
                return reject('Socket io was not initialized');
            }
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
        this.socket && this.socket.on(eventName, callback);
    }

    removeSocketEvent(eventName: string, callback?: (event: any) => void) {
        if (this.socket) {
            if (callback) {
                this.socket.off(eventName, callback);
            } else {
                this.socket.off(eventName);
            }
        }
    }

    sendMessage(eventName: string, message: SocketMessage) {
        this.socket && this.socket.emit(eventName, message);
    }
}


export interface SocketMessage {
    to: string; // userId
    message: any
}
