import { Injectable } from '@angular/core';
import {WebsocketsService} from "./websockets.service";
import {Subject} from "rxjs";

@Injectable({
    providedIn: 'root'
})
export class ChatService {
    chats: ChatsDictionary = { };

    selectedChatId: string | null = null;

    private newMessageSubject = new Subject<Message>();
    newMessage = this.newMessageSubject.asObservable();

    constructor(private ws: WebsocketsService) {
        ws.setUpSocketEvent(`private-message`, (event: any) => {
            this.addMessage(event.message.sender, event.message);
        });
    }

    sendMessage(recipient: string, message: Message) {
        const socketMessage: any = {
            to: recipient,
            message
        };
        this.ws.sendMessage('private-message', socketMessage);
        this.addMessage(recipient, message);
    }

    addMessage(userId: string, message: Message) {
        if (!this.chats[userId]) {
            this.chats[userId] = [];
        }
        this.chats[userId].push(message);
        this.chats = {...this.chats};

        this.newMessageSubject.next(message);
    }

    removeChat(userId: string) {
        delete this.chats[userId];
        if (this.selectedChatId === userId) {
            this.selectedChatId = null;
        }
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