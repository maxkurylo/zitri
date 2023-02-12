import { Injectable } from '@angular/core';
import {CurrentUserService, User} from "./current-user.service";
import {UsersService} from "./users.service";
import {ApiService} from "./api.service";
import {WebsocketsService} from "./websockets.service";
import {RoomService} from "./room.service";
import {ChatService} from "./chat.service";
import {WebrtcService} from "./webrtc.service";

@Injectable({
    providedIn: 'root'
})
export class InitService {
    constructor(private cu: CurrentUserService, private us: UsersService, private requestsService: ApiService,
                private socketsService: WebsocketsService, private rs: RoomService, private cs: ChatService,
                private webRTCService: WebrtcService) { }

    init(): Promise<void> {
        const generatedUser = this.cu.generateUser();
        const initialRoomId = window.location.pathname.split('/')[1] || null;

        // 1. Auth
        // 2. Connect to sockets
        // 3. Join room

        return this.requestsService.auth(generatedUser)
            .then(authInfo => {
                sessionStorage.setItem('token', authInfo.token);
                this.cu.user = authInfo.user;
                return this.socketsService.init();
            })
            .then(() => this.requestsService.changeRoom(initialRoomId, null))
            .then(roomInfo => {
                this.webRTCService.init();
                this.us.roomUsers = roomInfo.roomUsers.filter((u: User) => u.id !== this.cu.user.id);
                this.rs.currentRoomId = roomInfo.roomId;
            })
            .catch(console.log);
    }
}
