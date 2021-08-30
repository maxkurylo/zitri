import {Component, Input, OnInit} from '@angular/core';

@Component({
    selector: 'app-avatar',
    templateUrl: './avatar.component.html',
    styleUrls: ['./avatar.component.scss']
})
export class AvatarComponent implements OnInit {
    @Input() avatarUrl: string = '';
    @Input() progress: number = 0;

    constructor() { }

    ngOnInit(): void {
    }

}
