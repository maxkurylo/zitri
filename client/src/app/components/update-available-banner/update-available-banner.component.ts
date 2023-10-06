import { Component, OnInit } from '@angular/core';

@Component({
    selector: 'app-update-available-banner',
    templateUrl: './update-available-banner.component.html',
    styleUrls: ['./update-available-banner.component.scss'],
})
export class UpdateAvailableBannerComponent implements OnInit {
    constructor() {}

    ngOnInit(): void {}

    refreshPage() {
        window.location.reload();
    }
}
