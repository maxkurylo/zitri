import { Injectable } from '@angular/core';
import {SocketMessage, WebsocketsService} from "./websockets.service";
import {Subject} from "rxjs";
import {filter} from "rxjs/operators";
import {UserId} from "./current-user.service";

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
    private _selectedChatId: string | null = null;
    public get selectedChatId(): string | null {
        return this._selectedChatId;
    }

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


    public sendMessage(recipient: UserId, message: ChatMessage): void {
        const socketMessage: SocketMessage = {
            type: 'private-message',
            to: [recipient],
            message
        };
        this.ws.sendMessage(socketMessage);
        this.addMessage(recipient, message);
    }


    public openChat(chatId: UserId | null): void {
        this._selectedChatId = chatId;
        if (chatId) {
            this.clearUnreadCounter(chatId)
        }
    }


    public removeChat(userId: UserId): void {
        delete this.chats[userId];
        if (this.selectedChatId === userId) {
            this.openChat(null);
        }
    }


    private clearUnreadCounter(chatId: UserId): void {
        if (this.chats[chatId]) {
            this.chats[chatId].unreadCount = 0;
        }
    }


    /**
     *
     * @param userId - remote user id
     * @param message
     * @private
     */
    private addMessage(userId: UserId, message: ChatMessage): void {
        if (!this.chats[userId]) {
            this.chats[userId] = {
                unreadCount: 0,
                messages: []
            };
        }
        if (this.selectedChatId !== userId) {
            this.chats[userId].unreadCount += 1;
        }
        this.chats[userId].messages = [message, ...this.chats[userId].messages];
        this.chats = {...this.chats};

        this.newChatMessage$.next(message);
    }
}



export interface ChatsDictionary {
    [userId: UserId]: {
        unreadCount: number,
        messages: ChatMessage[],
    };
}

export interface ChatMessage {
    sender: UserId; // user id
    timestamp: number;
    text: string;
}
