import { Injectable } from '@angular/core';

import { getOSName } from '../helpers/device';
import randomNameAndAvatar from '../helpers/random-name-and-avatar';
import { GeneratedUser, User } from '../types/IUser';

@Injectable({
    providedIn: 'root',
})
export class CurrentUserService {
    public user: User;

    constructor() {}

    public generateUser(): GeneratedUser {
        return {
            ...randomNameAndAvatar(),
            device: getOSName(),
        };
    }
}
