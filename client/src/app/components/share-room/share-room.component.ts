import { Component, OnInit } from '@angular/core';
import {copyToClipboard} from "../../helpers";
import {RoomService} from "../../services/room.service";

@Component({
    selector: 'app-share-room',
    templateUrl: './share-room.component.html',
    styleUrls: ['./share-room.component.scss']
})
export class ShareRoomComponent implements OnInit {
    showCopyBadge = false;

    constructor(public rs: RoomService) { }

    ngOnInit(): void {
    }


    copyRoomLink() {
        copyToClipboard(this.rs.roomUrl);
        this.showCopyBadge = true;
        setTimeout(() => {
            this.showCopyBadge = false;
        }, 1000)
    }
}
