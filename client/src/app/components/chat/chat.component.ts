import {Component, ElementRef, EventEmitter, Input, OnChanges, Output, ViewChild} from '@angular/core';
import {UntypedFormControl, UntypedFormGroup, Validators} from "@angular/forms";
import {UsersService} from "../../services/users.service";
import {ChatService, Message} from "../../services/chat.service";
import {CurrentUserService} from "../../services/current-user.service";

@Component({
    selector: 'app-chat',
    templateUrl: './chat.component.html',
    styleUrls: ['./chat.component.scss']
})
export class ChatComponent implements OnChanges {
    @ViewChild('messagesWrapper', { static: true }) private messagesWrapper: ElementRef;
    @Input() userId: string = '';
    @Output() chatClose = new EventEmitter<void>();

    public title: string = '';

    public messageForm = new UntypedFormGroup({
        message: new UntypedFormControl('', [Validators.required]),
    });

    constructor(private us: UsersService, public cs: ChatService, public cu: CurrentUserService) { }

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


    private scrollChatToBottom(): void {
        // we need a timeout to scroll only after the message was added.
        setTimeout(() => {
            const messageWrapper = this.messagesWrapper.nativeElement;
            messageWrapper.scrollTop = messageWrapper.scrollHeight;
        }, 0);
    }

}
