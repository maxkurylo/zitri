import { Injectable } from '@angular/core';
import {CurrentUserService, User} from "./current-user.service";
import {UsersService} from "./users.service";
import {RequestsService} from "./requests.service";
import {WebsocketsService} from "./websockets.service";
import {ChatService} from "./chat.service";

@Injectable({
    providedIn: 'root'
})
export class InitService {
    constructor(private cu: CurrentUserService, private us: UsersService, private requestsService: RequestsService,
                private socketsService: WebsocketsService, private cs: ChatService) {
        cs.init();
    }

    init(): Promise<void> {
        const generatedUser = this.cu.generateUser();

        return this.requestsService.auth(generatedUser).toPromise()
            .then((val) => {
                this.cu.user = val.user;
                return Promise.all([
                    this.requestsService.getRoomUsers(val.roomId).toPromise(),
                    this.socketsService.connectToServer(val.roomId, val.user.id),
                ]);
            })
            .then(([roomUsers, _]) => {
                this.us.roomUsers = roomUsers.filter((u: User) => u.id !== this.cu.user.id);
            })
            .catch(console.log);
    }
}

export function makeObjectReadonly(object: any) {
    return Object.freeze(object);
}