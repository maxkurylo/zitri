import { Injectable } from '@angular/core';

import { ChatService } from './chat.service';
import { UsersService } from './users.service';
import { ApiService, RoomInfo } from './api.service';
import { CurrentUserService } from './current-user.service';
import { User } from '../types/IUser';

@Injectable({
    providedIn: 'root',
})
export class RoomService {
    roomUrl: string;

    private _currentRoomId: string;
    set currentRoomId(roomId: string) {
        this._currentRoomId = roomId;
        this.roomUrl = window.origin + '/' + roomId;
    }
    get currentRoomId(): string {
        return this._currentRoomId;
    }

    constructor(
        private cs: ChatService,
        private us: UsersService,
        private req: ApiService,
        private cu: CurrentUserService
    ) {}

    changeRoom(newRoomId: string) {
        this.req
            .changeRoom(newRoomId, this.currentRoomId)
            .then((roomInfo: RoomInfo) => {
                this.currentRoomId = newRoomId;
                this.cs.chats = {};
                this.us.roomUsers = roomInfo.roomUsers.filter(
                    (u: User) => u.id !== this.cu.user.id
                );
            });
    }
}
