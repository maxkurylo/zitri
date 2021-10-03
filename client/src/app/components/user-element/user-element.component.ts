import {Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges} from '@angular/core';
import {User} from "../../services/current-user.service";
import * as JSZip from "jszip";
import {ChatService} from "../../services/chat.service";
import {ReplaySubject} from "rxjs";
import {takeUntil} from "rxjs/operators";
import {FileTransferService} from "../../services/file-transfer.service";

@Component({
    selector: 'app-user-element',
    templateUrl: './user-element.component.html',
    styleUrls: ['./user-element.component.scss']
})
export class UserElementComponent implements OnInit, OnChanges, OnDestroy {
    @Input() user: User;
    @Input() selectedChatId: string | null = null;
    @Output() selectedChatIdChange = new EventEmitter<string | null>();

    zippingProgress: number = 0;
    chatNotification = 0;
    showFileTransferPopup = true;

    selectedFile: File | null = null;

    private destroyed$: ReplaySubject<boolean> = new ReplaySubject(1);

    constructor(public cs: ChatService, private fts: FileTransferService) { }

    ngOnInit(): void {
        this.cs.newMessage.pipe(takeUntil(this.destroyed$)).subscribe(() => {
            if (!this.selectedChatId || this.selectedChatId !== this.user.id) {
                this.chatNotification += 1;
            }
        });

        this.fts.fileTransferStateUpdate.pipe(takeUntil(this.destroyed$)).subscribe(e => {

        });
    }

    ngOnChanges(changes: SimpleChanges): void {
        // if current user has opened a chat with this user, clear notifications
        if (changes.selectedChatId && changes.selectedChatId.currentValue === this.user.id) {
            this.chatNotification = 0;
        }
    }

    async handleFilesSelect(e: Event) {
        const files = (e.target as HTMLInputElement).files;
        if (files) {
            try {
                if (files.length > 1) {
                    this.selectedFile = await this.fts.zipFiles(files, `Files from ${this.user.name}`);
                } else {
                    this.selectedFile = files[0];
                }
                this.fts.offerToSendFile(this.selectedFile, this.user.id);
            } catch (e) {
                console.error(e);
            }
        }
    }

    acceptFileTransfer() {
        this.showFileTransferPopup = false;
        this.fts.acceptFileSend(this.user.id);
    }

    declineFileTransfer() {
        this.fts.declineFileSend(this.user.id);
        this.showFileTransferPopup = false;
    }

    ngOnDestroy(): void {
        this.selectedFile = null;
        this.destroyed$.next(true);
        this.destroyed$.complete();
    }

}
