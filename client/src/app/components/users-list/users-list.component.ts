import { Component, Input, OnInit } from '@angular/core';

import { User } from 'src/app/types/IUser';

@Component({
    selector: 'app-users-list',
    templateUrl: './users-list.component.html',
    styleUrls: ['./users-list.component.scss'],
})
export class UsersListComponent implements OnInit {
    @Input() users: User[];

    constructor() {}

    ngOnInit(): void {}
}
