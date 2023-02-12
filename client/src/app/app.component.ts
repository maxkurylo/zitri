import {Component, OnInit} from '@angular/core';
import {ChatService} from "./services/chat.service";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
    constructor(public chatService: ChatService) {

    }

    ngOnInit(): void {

    }

}
