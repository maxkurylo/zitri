import { Injectable } from '@angular/core';
import getDeviceName from '../helpers/device-name';
import randomNameAndAvatar from '../helpers/random-name-and-avatar'

@Injectable({
    providedIn: 'root'
})
export class CurrentUserService {
    public user!: User;

    constructor() {

    }

    public generateUser(): User {
        return {
            id: '',
            ...randomNameAndAvatar(),
            device: getDeviceName(),
        };
    }
}


export interface User {
    id: string;
    name: string;
    avatarUrl: string;
    device?: string;

}
