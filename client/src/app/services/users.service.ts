import { Injectable } from '@angular/core';
import {User} from "./current-user.service";
import {makeObjectReadonly} from "./init.service";

@Injectable({
  providedIn: 'root'
})
export class UsersService {
    private _roomUsers: User[] = [];

    get roomUsers(): User[] { return this._roomUsers }
    set roomUsers(users: User[]) {
        this._roomUsers = users.map((u: User) => makeObjectReadonly(u));
    }

    constructor() { }

    addRoomUser(user: User) {
        this._roomUsers.push(makeObjectReadonly(user));
    }
}
