import {Component, OnInit} from '@angular/core';
import {ChatService} from "./services/chat.service";
import {FileTransferService} from "./services/file-transfer.service";
import {PopupService} from "./services/popup.service";
import {InviteToTheRoomComponent} from "./components/invite-to-the-room/invite-to-the-room.component";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
    constructor(public chatService: ChatService, private popupService: PopupService) {

    }

    ngOnInit(): void {

    }

    public openInviteToRoom(): void {
        this.popupService.openBottomSheet(InviteToTheRoomComponent);
    }

}
