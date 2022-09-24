import { Injectable } from '@angular/core';
import {SocketMessage, WebsocketsService} from "./websockets.service";
import {Subject} from "rxjs";
import {filter} from "rxjs/operators";

@Injectable({
    providedIn: 'root'
})
export class ChatService {
    /**
     * Contains all user chats and messages.
     */
    public chats: ChatsDictionary = { };
    /**
     * Id of current opened chat
     */
    public selectedChatId: string | null = null;

    public newChatMessage$ = new Subject<ChatMessage>();

    constructor(private ws: WebsocketsService) {
        this.ws.event$
            .pipe(
                filter((message) => message.type === 'private-message')
            )
            .subscribe((e: SocketMessage) => {
                this.addMessage(e.message.sender, e.message)
            });
    }


    public sendMessage(recipient: string, message: ChatMessage): void {
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


    private addMessage(userId: string, message: ChatMessage): void {
        if (!this.chats[userId]) {
            this.chats[userId] = [];
        }
        this.chats[userId].push(message);
        this.chats = {...this.chats};

        this.newChatMessage$.next(message);
    }
}



export interface ChatsDictionary {
    [userId: string]: ChatMessage[];
}

export interface ChatMessage {
    sender: string; // user id
    timestamp: number;
    text: string;
}
