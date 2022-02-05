import { Injectable } from '@angular/core';
import {io, Socket} from "socket.io-client";

@Injectable({
    providedIn: 'root'
})
export class WebsocketsService {
    private socket: Socket<any> | null = null;

    constructor() {
    }

    init(roomId: string): Promise<void> {
        return new Promise((resolve, reject) => {
            this.socket = io({
                extraHeaders: {
                    Authorization: "Bearer " + localStorage.getItem('token'),
                },
                query: {roomId}
            });

            this.socket.on("connect_error", (err: any) => {
                reject(err.message);
            });

            this.socket.on("connect", () => {
                resolve();
            });
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
