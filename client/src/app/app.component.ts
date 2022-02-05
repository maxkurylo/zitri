import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
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
    chatHeight = '400px';
    @ViewChild('chatContainer', { static: false }) private chatContainer: ElementRef;


    constructor(public us: UsersService, public cs: ChatService) {
        this.isMobile = isMobile() || window.innerWidth < 768;
        this.chatHeight = window.innerHeight - 20 + 'px';

        window.addEventListener('resize', () => {
            this.isMobile = isMobile() || window.innerWidth < 768;
            this.chatHeight = window.innerHeight - 20 + 'px';
        });
    }

    ngOnInit() {

    }

}
