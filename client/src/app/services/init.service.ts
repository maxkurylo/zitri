import { Injectable } from '@angular/core';
import {CurrentUserService} from "./current-user.service";
import {UsersService} from "./users.service";

@Injectable({
    providedIn: 'root'
})
export class InitService {
    constructor(private cu: CurrentUserService, private us: UsersService) { }

    init(): Promise<void> {
        this.cu.user = this.cu.generateUser();
        // remove it
        this.us.roomUsers = [
            {...this.cu.user}, {...this.cu.user}, {...this.cu.user},
            {...this.cu.user}, {...this.cu.user}, {...this.cu.user},
            {...this.cu.user}, {...this.cu.user}, {...this.cu.user},
            {...this.cu.user}, {...this.cu.user}, {...this.cu.user},
            {...this.cu.user}, {...this.cu.user}
            ];
        return this.initImportantData()
            .then(this.initSecondaryData)
            .catch(err => {
                // TODO: handle errors
                console.log(err);
            });
    }


    initImportantData(): Promise<void> {
        return Promise.resolve();
        return Promise.all([
            // some initial fetches go here
        ])
            .then(() => {
                return Promise.resolve();
            })
    }

    // Some secondary data Must always be resolved
    // Can be used after sockets reconnect or when page is active again
    initSecondaryData(): Promise<void> {
        return Promise.resolve();
    }
}

export function makeObjectReadonly(object: any) {
    return Object.freeze(object);
}


export interface GroupOrUser {
    id: string,
    name: string,
    avatarUrl?: string
}