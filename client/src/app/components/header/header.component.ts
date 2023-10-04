import { Component, OnInit } from '@angular/core';
import { CurrentUserService } from '../../services/current-user.service';
import { PopupService } from 'src/app/services/popup.service';
import { JoinRoomPopupComponent } from '../join-room-popup/join-room-popup.component';
import { AboutPopupComponent } from '../about-popup/about-popup.component';

@Component({
    selector: 'app-header',
    templateUrl: './header.component.html',
    styleUrls: ['./header.component.scss'],
})
export class HeaderComponent implements OnInit {
    constructor(
        public cu: CurrentUserService,
        private popupService: PopupService
    ) {}

    ngOnInit(): void {}

    public openHelpDialog(): void {
        this.popupService.open(AboutPopupComponent);
    }

    public openNewRoomDialog(): void {
        this.popupService.open(JoinRoomPopupComponent);
    }
}
