import { Injectable } from '@angular/core';
import { io } from "socket.io-client";
import {UsersService} from "./users.service";
import {WebsocketsService} from "./websockets.service";

@Injectable({
    providedIn: 'root'
})
export class ChatService {
    chats: ChatsDictionary = { };

    constructor(private ws: WebsocketsService) {}


    // We could do this in constructor, but this service need to be initialized at app startup.
    // This way user can receive messages.
    init() {
        // private message from somebody
        this.ws.setUpSocketEvent(`private-message`, (event: any) => {
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
    }

    removeChat(userId: string) {
        delete this.chats[userId];
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