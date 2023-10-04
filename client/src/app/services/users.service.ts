import { Injectable } from '@angular/core';
import {CurrentUserService, User} from "./current-user.service";
import {SocketMessage, SocketsService} from "./sockets.service";
import {ChatService} from "./chat.service";
import {filter} from "rxjs/operators";

@Injectable({
  providedIn: 'root'
})
export class UsersService {
    private _roomUsers: User[] = [];

    get roomUsers(): User[] { return this._roomUsers }
    set roomUsers(users: User[]) {
        this._roomUsers = users.map((u: User) => Object.freeze(u));
    }

    constructor(private ws: SocketsService, private cs: ChatService,
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
            this._roomUsers.push(Object.freeze(user));
        }
    }

    private removeRoomUser(userId: string) {
        const index = this.roomUsers.findIndex((u => u.id === userId));
        if (index > -1) {
            this._roomUsers.splice(index, 1);
        }
        this.cs.removeChat(userId);
        // TODO: close peers when user leaves the room
        // this.webRTCService.removePeerConnection(userId);
    }

    public getUserById(userId: string): User | undefined {
        return this._roomUsers.find((u) => u.id === userId);
    }
}
