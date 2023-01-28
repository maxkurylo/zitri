import { Injectable } from '@angular/core';
import {CurrentUserService, User} from "./current-user.service";
import {UsersService} from "./users.service";
import {RequestsService} from "./requests.service";
import {WebsocketsService} from "./websockets.service";
import {RoomService} from "./room.service";
import {ChatService} from "./chat.service";
import {FileTransferService} from "./file-transfer.service";
import {Webrtc2Service} from "./webrtc2.service";

@Injectable({
    providedIn: 'root'
})
export class InitService {
    constructor(private cu: CurrentUserService, private us: UsersService, private requestsService: RequestsService,
                private socketsService: WebsocketsService, private rs: RoomService, private cs: ChatService,
                private fts: FileTransferService, private webRTCService: Webrtc2Service) { }

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
