import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';

@Component({
    selector: 'app-avatar',
    templateUrl: './avatar.component.html',
    styleUrls: ['./avatar.component.scss']
})
export class AvatarComponent implements OnInit {
    @Input() avatarUrl: string = '';
    @Input() progress?: number = 0;
    @Input() chatNotification?: number = 0;
    @Output() chatNotificationClick = new EventEmitter<void>();

    constructor() { }

    ngOnInit(): void {
    }

}
