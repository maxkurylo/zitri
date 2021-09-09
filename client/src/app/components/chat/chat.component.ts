import {Component, ElementRef, EventEmitter, Input, OnChanges, OnInit, Output, ViewChild} from '@angular/core';
import {FormControl, FormGroup, Validators} from "@angular/forms";
import {UsersService} from "../../services/users.service";
import {ChatService, Message} from "../../services/chat.service";
import {CurrentUserService} from "../../services/current-user.service";

@Component({
    selector: 'app-chat',
    templateUrl: './chat.component.html',
    styleUrls: ['./chat.component.scss']
})
export class ChatComponent implements OnInit, OnChanges {
    @ViewChild('messagesWrapper', { static: true }) private messagesWrapper: ElementRef;
    @Input() userId: string;
    @Output() chatClose = new EventEmitter<void>();

    title = '';

    messageForm = new FormGroup({
        message: new FormControl('', [Validators.required]),
    });

    constructor(private us: UsersService, public cs: ChatService, public cu: CurrentUserService) { }

    ngOnInit(): void {

    }

    scrollChatToBottom() {
        // we need timeout to scroll only after message was added.
        setTimeout(() => {
            this.messagesWrapper.nativeElement.scrollTop = this.messagesWrapper.nativeElement.scrollHeight;
        }, 0);
    }

    ngOnChanges(): void {
        this.title = this.us.getUserById(this.userId)?.name || '';
        this.scrollChatToBottom();
    }

    onSubmit() {
        const message: Message = {
            sender: this.cu.user.id,
            timestamp: Date.now(),
            text: this.messageForm.controls.message.value
        };
        this.cs.sendMessage(this.userId, message);
        this.messageForm.controls.message.patchValue('');
        this.scrollChatToBottom();
    }

}
