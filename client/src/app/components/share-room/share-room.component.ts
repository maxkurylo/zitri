import { Component, OnInit } from '@angular/core';
import {copyToClipboard} from "../../helpers";

@Component({
    selector: 'app-share-room',
    templateUrl: './share-room.component.html',
    styleUrls: ['./share-room.component.scss']
})
export class ShareRoomComponent implements OnInit {
    roomUrl = window.location.href;
    showCopyBadge = false;

    constructor() { }

    ngOnInit(): void {
    }


    copyRoomLink() {
        copyToClipboard(this.roomUrl);
        this.showCopyBadge = true;
        setTimeout(() => {
            this.showCopyBadge = false;
        }, 1000)
    }
}
