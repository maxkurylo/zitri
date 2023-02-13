import { Injectable } from '@angular/core';
import {io, Socket} from "socket.io-client";
import {Subject} from "rxjs";


const MESSAGE_EVENTS = [
    'file-transfer',
    'private-message',
    'sdp-offer',
    'sdp-answer',
    'ice-candidate',
];

// new events:
// 'room-user-left'
// 'room-user-joined'

@Injectable({
    providedIn: 'root'
})
export class SocketsService {
    private socket: Socket<any> | null = null;
    private eventSubject = new Subject<SocketMessage>();

    public event$ = this.eventSubject.asObservable();

    constructor() {
    }

    init(): Promise<void> {
        return new Promise((resolve, reject) => {
            this.socket = io({
                extraHeaders: {
                    Authorization: "Bearer " + sessionStorage.getItem('token'),
                },
                // query: {roomId}
            });

            this.socket.on("connect_error", (err: any) => {
                reject(err.message);
            });

            this.socket.on("connect", () => {
                resolve();
            });

            this.socket.on('message', (e: any) => {
                this.eventSubject.next(e)
            });
        });
    }

    sendMessage(message: SocketMessage) {
        this.socket && this.socket.emit('message', message);
    }
}


export interface SocketMessage {
    type: string;
    message: any;
    to?: string[];  // userId or roomId
    from?: string
    forServer?: boolean;
}
