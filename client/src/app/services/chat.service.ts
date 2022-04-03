import { Injectable } from '@angular/core';
import {SocketMessage, WebsocketsService} from "./websockets.service";
import {Subject} from "rxjs";
import {filter} from "rxjs/operators";

@Injectable({
    providedIn: 'root'
})
export class ChatService {
    chats: ChatsDictionary = { };

    selectedChatId: string | null = null;

    private newMessageSubject = new Subject<Message>();
    newMessage = this.newMessageSubject.asObservable();

    constructor(private ws: WebsocketsService) {
        this.ws.event$
            .pipe(
                filter((message) => message.type === 'private-message')
            )
            .subscribe((e: SocketMessage) => {
                this.addMessage(e.message.sender, e.message)
            });
    }

    public sendMessage(recipient: string, message: Message) {
        const socketMessage: SocketMessage = {
            type: 'private-message',
            to: [recipient],
            message
        };
        this.ws.sendMessage(socketMessage);
        this.addMessage(recipient, message);
    }

    public removeChat(userId: string) {
        delete this.chats[userId];
        if (this.selectedChatId === userId) {
            this.selectedChatId = null;
        }
    }

    private addMessage(userId: string, message: Message) {
        if (!this.chats[userId]) {
            this.chats[userId] = [];
        }
        this.chats[userId].push(message);
        this.chats = {...this.chats};

        this.newMessageSubject.next(message);
    }
}



export interface ChatsDictionary {
    [userId: string]: Array<Message>; // Array of messages;
}

export interface Message {
    sender: string; // user id
    timestamp: number;
    text: string;
}