import {Component, ElementRef, EventEmitter, Input, OnChanges, Output, ViewChild} from '@angular/core';
import {UntypedFormControl, UntypedFormGroup, Validators} from "@angular/forms";
import {UsersService} from "../../services/users.service";
import {ChatMessage, ChatService} from "../../services/chat.service";
import {CurrentUserService} from "../../services/current-user.service";

@Component({
    selector: 'app-chat',
    templateUrl: './chat.component.html',
    styleUrls: ['./chat.component.scss']
})
export class ChatComponent implements OnChanges {
    @ViewChild('messagesWrapper', { static: true }) private messagesWrapperRef: ElementRef;

    public title: string = '';

    public userId: string;

    public messageForm = new UntypedFormGroup({
        message: new UntypedFormControl('', [Validators.required]),
    });

    constructor(private us: UsersService, public chatService: ChatService, public cu: CurrentUserService) { }

    ngOnChanges(): void {
        const userId = this.chatService.selectedChatId;
        if (userId) {
            this.userId = userId;
            this.title = this.us.getUserById(userId)?.name || '';
            this.scrollToBottom();
        }
    }

    public onSubmit(): void {
        const message: ChatMessage = {
            sender: this.cu.user.id,
            timestamp: Date.now(),
            text: this.messageForm.controls.message.value
        };
        const userId = this.chatService.selectedChatId;
        if (userId) {
            this.chatService.sendMessage(userId, message);
        }
        this.messageForm.controls.message.patchValue('');
        this.scrollToBottom();
    }


    public closeChat(): void {
        this.chatService.openChat(null);
    }


    private scrollToBottom(): void {
        // we need a timeout to scroll only after the message was added.
        setTimeout(() => {
            const messageWrapper = this.messagesWrapperRef.nativeElement;
            messageWrapper.scrollTop = messageWrapper.scrollHeight;
        }, 0);
    }

}
