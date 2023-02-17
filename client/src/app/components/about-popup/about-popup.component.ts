import { Component, OnInit } from '@angular/core';
import { PopupService } from 'src/app/services/popup.service';

@Component({
    selector: 'app-about-popup',
    templateUrl: './about-popup.component.html',
    styleUrls: ['./about-popup.component.scss'],
})
export class AboutPopupComponent implements OnInit {
    constructor(private popupService: PopupService) {}

    ngOnInit(): void {}

    public closePopup(): void {
        this.popupService.close();
    }
}
