import { Component, OnInit } from '@angular/core';

import { PopupService } from 'src/app/services/popup.service';
import { InviteToTheRoomComponent } from '../invite-to-the-room/invite-to-the-room.component';

@Component({
    selector: 'app-invite-to-room-btn',
    templateUrl: './invite-to-room-btn.component.html',
    styleUrls: ['./invite-to-room-btn.component.scss'],
})
export class InviteToRoomBtnComponent implements OnInit {
    constructor(private popupService: PopupService) {}

    ngOnInit(): void {}

    public openInviteToRoom(): void {
        this.popupService.openBottomSheet(InviteToTheRoomComponent);
    }
}
