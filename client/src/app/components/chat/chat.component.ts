import {Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild} from '@angular/core';
import {FormControl, FormGroup, Validators} from "@angular/forms";
import {UsersService} from "../../services/users.service";

@Component({
    selector: 'app-chat',
    templateUrl: './chat.component.html',
    styleUrls: ['./chat.component.scss']
})
export class ChatComponent implements OnInit {
    @ViewChild('messagesWrapper', { static: true }) private messagesWrapper: ElementRef;
    @Input() userId: string;
    @Output() chatClose = new EventEmitter<void>();

    title = '';

    messageForm = new FormGroup({
        message: new FormControl('', [Validators.required]),
    });

    constructor(private us: UsersService) { }

    ngOnInit(): void {
        // scroll it down
        this.messagesWrapper.nativeElement.scrollTop = this.messagesWrapper.nativeElement.scrollHeight;
        this.title = this.us.getUserById(this.userId)?.name || '';
    }

    onSubmit() {
        console.log('SUBMIT');
        this.messageForm.controls.message.patchValue('');
    }

}
