import { Component, OnInit } from '@angular/core';
import { ChatService } from './services/chat.service';
import { ServiceWorkerUpdatesService } from './services/sw-updates.service';
import { UsersService } from './services/users.service';
import { RoomService } from './services/room.service';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
    constructor(
        public chatService: ChatService,
        public swUpdatesService: ServiceWorkerUpdatesService,
        public usersService: UsersService,
        public roomsService: RoomService
    ) {}

    ngOnInit(): void {}
}
