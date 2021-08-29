import { Component, OnInit } from '@angular/core';

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
        const input = document.createElement('input');
        input.value = this.roomUrl;
        input.style.opacity = '0';
        input.style.position = 'absolute';
        input.style.zIndex = '-1000';
        document.body.appendChild(input);
        input.focus();
        input.select();
        document.execCommand('copy');
        this.showCopyBadge = true;
        document.body.removeChild(input);
        setTimeout(() => {
            this.showCopyBadge = false;
        }, 1000)
    }
}
