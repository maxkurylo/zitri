import { Injectable } from '@angular/core';
import {User} from "./current-user.service";
import {makeObjectReadonly} from "./init.service";
import {WebsocketsService} from "./websockets.service";
import {ChatService} from "./chat.service";
import {WebRTCService} from "./webrtc.service";

@Injectable({
  providedIn: 'root'
})
export class UsersService {
    private _roomUsers: User[] = [];

    get roomUsers(): User[] { return this._roomUsers }
    set roomUsers(users: User[]) {
        this._roomUsers = users.map((u: User) => makeObjectReadonly(u));
    }

    constructor(private ws: WebsocketsService, private cs: ChatService, private webRTCService: WebRTCService) {
    }

    listenSocketEvents() {
        this.ws.setUpSocketEvent(`room-members-update`, (event: any) => {
            switch (event.type) {
                case 'user-added':
                    this.addRoomUser(event.user);
                    break;
                case 'user-left':
                    this.removeRoomUser(event.userId);
                    break;
                default:
                    break;
            }
        });
    }

    addRoomUser(user: User) {
        this._roomUsers.push(makeObjectReadonly(user));
    }

    removeRoomUser(userId: string) {
        const index = this.roomUsers.findIndex((u => u.id === userId));
        if (index > -1) {
            this._roomUsers.splice(index, 1);
        }
        this.cs.removeChat(userId);
        this.webRTCService.removePeerConnection(userId);
    }

    getUserById(userId: string): User | undefined {
        return this._roomUsers.find((u) => u.id === userId);
    }
}
