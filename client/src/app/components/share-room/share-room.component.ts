import { Component, OnInit } from '@angular/core';
import copyToClipboard from "../../helpers/copy-to-clipboard";
import {RoomService} from "../../services/room.service";

@Component({
    selector: 'app-share-room',
    templateUrl: './share-room.component.html',
    styleUrls: ['./share-room.component.scss']
})
export class ShareRoomComponent implements OnInit {
    public showCopyBadge: boolean = false;

    constructor(public rs: RoomService) { }

    ngOnInit(): void {
    }


    public copyRoomLink(): void {
        copyToClipboard(this.rs.roomUrl);
        this.showCopyBadge = true;
        setTimeout(() => {
            this.showCopyBadge = false;
        }, 1000)
    }
}
