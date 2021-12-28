import {
    ApplicationRef,
    Component,
    EventEmitter,
    Input,
    OnChanges,
    OnDestroy,
    OnInit,
    Output,
    SimpleChanges
} from '@angular/core';
import {User} from "../../services/current-user.service";
import {ChatService} from "../../services/chat.service";
import {ReplaySubject} from "rxjs";
import {filter, takeUntil} from "rxjs/operators";
import {FileTransferService, FileTransferState, FileTransferStateType} from "../../services/file-transfer.service";
import {FileInfo, PopupStateType} from "../file-transfer-popup/file-transfer-popup.component";

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
    transferProgress: number = 0;
    showSuccessMark = false;

    chatNotification = 0;
    fileTransferPopupState: PopupStateType | null = null;

    selectedFile: File | null = null;
    receivingFileInfo: FileInfo = {};

    private destroyed$: ReplaySubject<boolean> = new ReplaySubject(1);

    constructor(public cs: ChatService, private fts: FileTransferService,
                private appRef: ApplicationRef) { }

    ngOnInit(): void {
        this.cs.newMessage.pipe(takeUntil(this.destroyed$)).subscribe(() => {
            if (!this.selectedChatId || this.selectedChatId !== this.user.id) {
                this.chatNotification += 1;
            }
        });

        // TODO: each element has it's own subscription which is wrong. Make
        // TODO: one in app component and filter for each element
        this.fts.fileTransferStateUpdate
            .pipe(
                takeUntil(this.destroyed$),
                filter(m => m.userId === this.user.id)
            )
            .subscribe(this.handleTransferStateUpdate);
    }

    ngOnChanges(changes: SimpleChanges): void {
        // if current user has opened a chat with this user, clear notifications
        if (changes.selectedChatId && changes.selectedChatId.currentValue === this.user.id) {
            this.chatNotification = 0;
        }
    }

    handleTransferStateUpdate = (e: FileTransferState) => {
        switch (e.type) {
            case FileTransferStateType.ZIPPING:
                this.handleZipping(e);
                break;
            case FileTransferStateType.OFFER:
                this.fileTransferPopupState = PopupStateType.OFFER;
                this.receivingFileInfo = { name: e.fileName, size: e.fileSize, type: e.fileType, zipped: e.zipped };
                this.fts.receivingFileInfo[this.user.id] = { fileName: e.fileName, fileSize: e.fileSize} as any;
                break;
            case FileTransferStateType.ACCEPT:
                if (this.selectedFile) {
                    this.fts.sendFile(this.selectedFile, this.user.id);
                    this.transferProgress = 0;
                    this.zippingProgress = 0;
                    this.fileTransferPopupState = PopupStateType.IN_PROGRESS;
                }
                break;
            case FileTransferStateType.DECLINED:
                this.zippingProgress = 0;
                this.transferProgress = 0;
                this.fileTransferPopupState = PopupStateType.DECLINED;
                break;
            case FileTransferStateType.IN_PROGRESS:
                this.handleInProgress(e);
                break;
            default:
                break;
        }
    };

    async handleFilesSelect(e: Event) {
        const files = (e.target as HTMLInputElement).files;
        if (files && files.length) {
            try {
                if (files.length > 1) {
                    this.selectedFile = await this.fts.zipFiles(files, `Files from ${this.user.name}`, this.user.id);
                } else {
                    this.selectedFile = files[0];
                    this.fileTransferPopupState = PopupStateType.WAITING_FOR_APPROVE;
                }
                this.fts.offerToSendFile(this.selectedFile, this.user.id);
            } catch (e) {
                console.error(e);
            }
        }
    }

    handleFilePopupAgree() {
        switch (this.fileTransferPopupState) {
            case PopupStateType.OFFER:
                this.fts.acceptFileSend(this.user.id);
                break;
            case PopupStateType.CONFIRM_CANCEL:
                this.transferProgress = 0;
                this.fts.declineFileSend(this.user.id);
                this.fileTransferPopupState = null;
                break;
            case PopupStateType.DECLINED:
            case PopupStateType.ERROR:
                this.fileTransferPopupState = null;
                break;
        }
    }

    handleFilePopupCancel() {
        switch (this.fileTransferPopupState) {
            case PopupStateType.ZIPPING:
                // this.fts.stopZipping(this.user.id);
                break;
            case PopupStateType.OFFER:
                this.fts.declineReceiveFile(this.user.id);
                delete this.fts.receivingFileInfo[this.user.id];
                this.fileTransferPopupState = null;
                this.receivingFileInfo = {};
                break;
            case PopupStateType.WAITING_FOR_APPROVE:
                this.fts.declineFileSend(this.user.id);
                delete this.fts.receivingFileInfo[this.user.id];
                this.fileTransferPopupState = null;
                this.receivingFileInfo = {};
                break;
            case PopupStateType.IN_PROGRESS:
                this.fileTransferPopupState = PopupStateType.CONFIRM_CANCEL;
                break;
            case PopupStateType.CONFIRM_CANCEL:
                this.fileTransferPopupState = PopupStateType.IN_PROGRESS;
                break;
        }
    }


    private handleInProgress(e: FileTransferState) {
        this.fileTransferPopupState = PopupStateType.IN_PROGRESS;
        this.transferProgress = e.progress || 0;
        if (this.transferProgress === 100) {
            this.fileTransferPopupState = null;
            this.transferProgress = 0;
            setTimeout(() => {
                this.showSuccessMark = false;
                this.appRef.tick();
            }, 3000);
            this.showSuccessMark = true;
        }
        this.appRef.tick();
    }


    private handleZipping(e: FileTransferState) {
        this.zippingProgress = e.progress || 0;
        this.fileTransferPopupState = PopupStateType.ZIPPING;
        if (e.progress === 100) {
            if (this.selectedFile) {
                this.fts.offerToSendFile(this.selectedFile, this.user.id);
                this.fileTransferPopupState = PopupStateType.WAITING_FOR_APPROVE;
            }
            this.zippingProgress = 0;
        }
    }

    ngOnDestroy(): void {
        this.selectedFile = null;
        this.destroyed$.next(true);
        this.destroyed$.complete();
    }
}
