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
        const initialRoomId = window.location.pathname.split('/')[1];

        return this.requestsService.auth(generatedUser, initialRoomId)
            .toPromise()
            .then((resp) => {
                localStorage.setItem('token', resp.token);
                this.cu.user = resp.user;
                this.rs.currentRoomId = resp.roomId;
                return Promise.all([
                    this.requestsService.getRoomUsers(resp.roomId).toPromise(),
                    this.socketsService.init(resp.roomId),
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