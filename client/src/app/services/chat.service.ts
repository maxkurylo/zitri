import { Injectable } from '@angular/core';
import {SocketMessage, WebsocketsService} from "./websockets.service";
import {Subject} from "rxjs";
import {filter} from "rxjs/operators";

@Injectable({
    providedIn: 'root'
})
export class ChatService {
    public chats: ChatsDictionary = { };

    public selectedChatId: string | null = null;

    public newMessage$ = new Subject<Message>();

    constructor(private ws: WebsocketsService) {
        this.ws.event$
            .pipe(
                filter((message) => message.type === 'private-message')
            )
            .subscribe((e: SocketMessage) => {
                this.addMessage(e.message.sender, e.message)
            });
    }

    public sendMessage(recipient: string, message: Message): void {
        const socketMessage: SocketMessage = {
            type: 'private-message',
            to: [recipient],
            message
        };
        this.ws.sendMessage(socketMessage);
        this.addMessage(recipient, message);
    }

    public removeChat(userId: string): void {
        delete this.chats[userId];
        if (this.selectedChatId === userId) {
            this.selectedChatId = null;
        }
    }

    private addMessage(userId: string, message: Message): void {
        if (!this.chats[userId]) {
            this.chats[userId] = [];
        }
        this.chats[userId].push(message);
        this.chats = {...this.chats};

        this.newMessage$.next(message);
    }
}



export interface ChatsDictionary {
    [userId: string]: Message[];
}

export interface Message {
    sender: string; // user id
    timestamp: number;
    text: string;
}
