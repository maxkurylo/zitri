import { Injectable } from '@angular/core';
import {CurrentUserService, User} from "./current-user.service";
import {makeObjectReadonly} from "./init.service";
import {SocketMessage, WebsocketsService} from "./websockets.service";
import {ChatService} from "./chat.service";
import {WebRTCService} from "./webrtc.service";
import {filter} from "rxjs/operators";

@Injectable({
  providedIn: 'root'
})
export class UsersService {
    private _roomUsers: User[] = [];

    get roomUsers(): User[] { return this._roomUsers }
    set roomUsers(users: User[]) {
        this._roomUsers = users.map((u: User) => makeObjectReadonly(u));
    }

    constructor(private ws: WebsocketsService, private cs: ChatService, private webRTCService: WebRTCService,
                private cu: CurrentUserService) {
        this.ws.event$
            .pipe(
                filter((message) => message.type === 'room-user-joined' || message.type === 'room-user-left')
            )
            .subscribe((message: SocketMessage) => {
                switch (message.type) {
                    case 'room-user-joined':
                        this.addRoomUser(message.message.user);
                        break;
                    case 'room-user-left':
                        this.removeRoomUser(message.message.userId);
                        break;
                    default:
                        break;
                }
            });
    }

    private addRoomUser(user: User) {
        if (user.id !== this.cu.user.id) {
            this._roomUsers.push(makeObjectReadonly(user));
        }
    }

    private removeRoomUser(userId: string) {
        const index = this.roomUsers.findIndex((u => u.id === userId));
        if (index > -1) {
            this._roomUsers.splice(index, 1);
        }
        this.cs.removeChat(userId);
        this.webRTCService.removePeerConnection(userId);
    }

    public getUserById(userId: string): User | undefined {
        return this._roomUsers.find((u) => u.id === userId);
    }
}
