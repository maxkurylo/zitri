import { Injectable } from '@angular/core';
import {CurrentUserService, User} from "./current-user.service";
import {UsersService} from "./users.service";
import {RequestsService} from "./requests.service";
import {WebsocketsService} from "./websockets.service";
import {RoomService} from "./room.service";

@Injectable({
    providedIn: 'root'
})
export class InitService {
    constructor(private cu: CurrentUserService, private us: UsersService, private requestsService: RequestsService,
                private socketsService: WebsocketsService, private rs: RoomService) { }

    init(): Promise<void> {
        const generatedUser = this.cu.generateUser();

        return this.requestsService.auth(generatedUser, this.rs.currentRoomId).toPromise()
            .then((val) => {
                this.cu.user = val.user;
                this.rs.currentRoomId = val.roomId;
                localStorage.setItem('token', val.token);
                return Promise.all([
                    this.requestsService.getRoomUsers(val.roomId).toPromise(),
                    this.socketsService.connectToServer(val.roomId, val.user.id),
                ]);
            })
            .then(([roomUsers, _]) => {
                console.log(roomUsers);
                this.us.roomUsers = roomUsers.filter((u: User) => u.id !== this.cu.user.id);
            })
            .catch(console.log);
    }
}

export function makeObjectReadonly(object: any) {
    return Object.freeze(object);
}