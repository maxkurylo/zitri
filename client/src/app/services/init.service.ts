import { Injectable } from '@angular/core';
import {CurrentUserService, User} from "./current-user.service";
import {UsersService} from "./users.service";
import {RequestsService} from "./requests.service";
import {WebsocketsService} from "./websockets.service";
import {RoomService} from "./room.service";
import {ChatService} from "./chat.service";
import {FileTransferService} from "./file-transfer.service";
import {WebRTCService} from "./webrtc.service";

@Injectable({
    providedIn: 'root'
})
export class InitService {
    constructor(private cu: CurrentUserService, private us: UsersService, private requestsService: RequestsService,
                private socketsService: WebsocketsService, private rs: RoomService, private cs: ChatService,
                private fts: FileTransferService, private webRTCService: WebRTCService) { }

    init(): Promise<void> {
        const generatedUser = this.cu.generateUser();

        return this.requestsService.auth(generatedUser, this.rs.currentRoomId).toPromise()
            .then((val) => {
                localStorage.setItem('token', val.token);
                this.cu.user = val.user;
                this.rs.currentRoomId = val.roomId;
                return Promise.all([
                    this.requestsService.getRoomUsers(val.roomId).toPromise(),
                    this.socketsService.init(val.roomId),
                ]);
            })
            .then(([roomUsers, _]) => {
                this.us.roomUsers = roomUsers.filter((u: User) => u.id !== this.cu.user.id);
                this.us.listenSocketEvents();
                this.cs.listenSocketEvents();
                this.webRTCService.setupSocketEvents();
                this.fts.listenEvents();
            })
            .catch(console.log);
    }
}

export function makeObjectReadonly(object: any) {
    return Object.freeze(object);
}