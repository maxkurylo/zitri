import { Injectable } from '@angular/core';
import {ChatService} from "./chat.service";
import {UsersService} from "./users.service";
import {RequestsService} from "./requests.service";
import {CurrentUserService, User} from "./current-user.service";


@Injectable({
  providedIn: 'root'
})
export class RoomService {
    currentRoomId: string;

    constructor(private cs: ChatService, private us: UsersService,
                private req: RequestsService, private cu: CurrentUserService) {
        const roomId = window.location.href.split('/room/')[1];
        if (roomId) {
            this.currentRoomId = roomId;
        }

    }

    changeRoom(newRoomId: string) {
        this.req.changeRoom(newRoomId, this.currentRoomId).subscribe((roomUsers: any) => {
            this.currentRoomId = newRoomId;
            this.cs.chats = {};
            this.us.roomUsers = roomUsers.filter((u: User) => u.id !== this.cu.user.id)
        });

    }
}
