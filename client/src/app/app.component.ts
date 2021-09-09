import {Component, OnInit} from '@angular/core';
import {UsersService} from "./services/users.service";
import {ChatService} from "./services/chat.service";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {

    constructor(public us: UsersService, public cs: ChatService) {
    }

    ngOnInit() {
    }

}
