import { Component, Input, OnInit } from '@angular/core';

@Component({
    selector: 'app-main-screen-empty',
    templateUrl: './main-screen-empty.component.html',
    styleUrls: ['./main-screen-empty.component.scss'],
})
export class MainScreenEmptyComponent implements OnInit {
    @Input() roomUrl: string;

    constructor() {}

    ngOnInit(): void {}
}
