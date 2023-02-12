import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import {FilesSelectedEvent} from "../user-element/user-element.component";
import {UserId} from "../../services/current-user.service";
import {UsersService} from "../../services/users.service";
import {FileTransferService, TransferState} from "../../services/file-transfer.service";
import {ChatService} from "../../services/chat.service";
import {throttle} from "lodash";
import zipFiles from "../../helpers/zip-files";

@Component({
  selector: 'app-users-list',
  templateUrl: './users-list.component.html',
  styleUrls: ['./users-list.component.scss'],
})
export class UsersListComponent implements OnInit {
    public transferState: {[userId: UserId]: TransferInfo} = {};

    constructor(public usersService: UsersService, private fileTransferService: FileTransferService,
                public chatService: ChatService) { }

    ngOnInit(): void {
        this.fileTransferService.event$.subscribe((e: TransferState) => {
            switch (e.status) {
                case 'WAITING_FOR_APPROVE': this.handleWaitingForApprove(e); break;
                case 'OFFER': this.handleOffer(e); break;
                case 'IN_PROGRESS': this.handleInProgress(e); break;
                case 'FINISHED': this.handleFinished(e); break;
            }
        });
    }

    // TODO: cancel for zipping
    // TODO: it is possible to optimize zipping by doing it after making an offer.
    //  It can save a few seconds of time
    public async handleFilesSelected(e: FilesSelectedEvent): Promise<void> {
        let file: File;
        if (e.files.length > 1) {
            const progressCallback = throttle((progress: number) => {
                this.setState(e.userId,{
                    status: 'ZIPPING',
                    progress,
                });
            }, 50, { trailing: false });
            file = await zipFiles(e.files, 'Maslo', progressCallback);
        } else {
            file = e.files[0];
        }
        this.fileTransferService.sendOffer(e.userId, file);
    }


    public handleCancel(userId: UserId): void {
        if (this.transferState[userId]) {
            if (this.transferState[userId].status === 'OFFER') {
                // user clicked 'Cancel' on transfer offer
                this.fileTransferService.cancel(userId);
                this.deleteState(userId);
            }
        }
    }


    public handleConfirm(userId: UserId): void {
        if (this.transferState[userId]) {
            if (this.transferState[userId].status === 'OFFER') {
                // user clicked 'Confirm' on transfer offer
                this.fileTransferService.accept(userId);
                this.setState(userId, {
                    status: 'IN_PROGRESS',
                    progress: 0
                });
            }
            if (this.transferState[userId].status === 'FINISHED') {
                // user clicked 'Confirm' after transfer was finished
                this.deleteState(userId);
            }
        }

    }


    public handleOpenChat(userId: UserId): void {
        this.chatService.openChat(userId);
    }

    private handleWaitingForApprove(e: TransferState): void {
        this.setState(e.userId, {
            status: 'WAITING_FOR_APPROVE'
        });
    }


    private handleOffer(e: TransferState): void {
        this.setState(e.userId, {
            status: 'OFFER',
        })
    }


    private handleInProgress(e: TransferState): void {
        this.setState(e.userId, {
            status: 'IN_PROGRESS',
            progress: e.progress,
        })
    }


    private handleFinished(e: TransferState): void {
        this.setState(e.userId, {
            status: 'FINISHED',
        })
    }


    private setState(userId: UserId, state: TransferInfo): void {
        this.transferState[userId] = state;
        this.transferState = {...this.transferState};
    }

    private deleteState(userId: UserId) {
        delete this.transferState[userId];
        this.transferState = {...this.transferState};
    }

}


export interface TransferInfo {
    status: TransferInfoStatus;
    progress?: number;
    receivingFileName?: string;
}

export type TransferInfoStatus = 'ZIPPING' | 'OFFER' | 'WAITING_FOR_APPROVE' | 'DECLINED' | 'IN_PROGRESS' | 'ERROR' | 'CONFIRM_ABORT' | 'ABORTED' | 'FINISHED';
