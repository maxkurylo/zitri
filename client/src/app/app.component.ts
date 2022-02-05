import {Component, OnInit} from '@angular/core';
import {UsersService} from "./services/users.service";
import {ChatService} from "./services/chat.service";
import { isMobile } from "./helpers";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
    isMobile = false;

    constructor(public us: UsersService, public cs: ChatService) {
        this.isMobile = isMobile() || window.innerWidth < 768;

        window.addEventListener('resize', () => {
            this.isMobile = isMobile() || window.innerWidth < 768;
        });
    }

    ngOnInit() {

    }

}
