import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {UsersService} from "./services/users.service";
import {ChatService} from "./services/chat.service";
import isMobile from "./helpers/isMobile";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
    @ViewChild('chatContainer', { static: false }) private chatContainer: ElementRef;

    public isMobile: boolean = false;
    public chatHeight: string = '400px';

    constructor(public us: UsersService, public cs: ChatService) {
        this.isMobile = isMobile() || window.innerWidth < 768;
        this.chatHeight = window.innerHeight - 20 + 'px';

        window.addEventListener('resize', () => {
            this.isMobile = isMobile() || window.innerWidth < 768;
            this.chatHeight = window.innerHeight - 20 + 'px';
        });
    }

    ngOnInit(): void {

    }

}
