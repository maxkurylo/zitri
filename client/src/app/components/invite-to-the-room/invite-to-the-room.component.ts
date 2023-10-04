import { Component, OnInit } from '@angular/core';
import {RoomService} from "../../services/room.service";
import {PopupService} from "../../services/popup.service";
import copyToClipboard from "../../helpers/copy-to-clipboard";

@Component({
  selector: 'app-invite-to-the-room',
  templateUrl: './invite-to-the-room.component.html',
  styleUrls: ['./invite-to-the-room.component.scss']
})
export class InviteToTheRoomComponent implements OnInit {

    constructor(public rs: RoomService, private popupService: PopupService) { }

    ngOnInit(): void {
    }

    public copyRoomLink(): void {
        copyToClipboard(this.rs.roomUrl);
        this.popupService.closeBottomSheet();
    }

}
