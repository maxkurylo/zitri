import {ApplicationRef, Component, Input, OnInit} from '@angular/core';
import {FilesSelectedEvent} from "../user-element/user-element.component";
import {UserId} from "../../services/current-user.service";
import {UsersService} from "../../services/users.service";
import {FileTransferService, TransferStateMap} from "../../services/file-transfer.service";
import {ChatService} from "../../services/chat.service";
import {DestroyService} from "../../services/destroy.service";
import {takeUntil} from "rxjs/operators";

@Component({
  selector: 'app-users-list',
  templateUrl: './users-list.component.html',
  styleUrls: ['./users-list.component.scss'],
    providers: [DestroyService]
})
export class UsersListComponent implements OnInit {
   public transferState: TransferStateMap = {};

    constructor(public usersService: UsersService, private fileTransferService: FileTransferService,
                public chatService: ChatService, private destroyed$: DestroyService,
                private appRef: ApplicationRef) {
        // I know this is rubbish, but on some reason my 'IN_PROGRESS', 'ZIPPING' and 'FINISHED'
        // events are ignored by change detection. So I have to do tick.
        this.fileTransferService.transferState$
            .pipe(takeUntil(this.destroyed$))
            .subscribe((state) => {
                this.transferState = state;
                this.appRef.tick();
            });
    }

    ngOnInit(): void {

    }


    public onFilesSelected(e: FilesSelectedEvent): void {
        this.fileTransferService.send(e.userId, e.files);
    }


    public onCancel(userId: UserId): void {
        const userState = this.transferState[userId];
        if (userState) {
            if (userState.status === 'OFFER') {
                // receiver clicked 'Cancel' on transfer offer
                this.fileTransferService.decline(userId);
            }
            if (userState.status === 'WAITING_FOR_APPROVE') {
                // sender clicked 'Cancel' on transfer offer
                this.fileTransferService.abort(userId);
            }
            // if (userState.status === 'IN_PROGRESS') {
            //     // sender or receiver clicked 'Cancel' during file transfer
            //     this.fileTransferService.showAbortConfirmation(userId);
            // }
        }
    }


    public onConfirm(userId: UserId): void {
        const userState = this.transferState[userId];
        if (userState) {
            if (userState.status === 'OFFER') {
                // receiver clicked 'Confirm' on transfer offer
                this.fileTransferService.accept(userId);
            }
            if (userState.status === 'FINISHED'
                || userState.status === 'DECLINED'
                || userState.status === 'ABORTED'
            ) {
                // user clicked 'Confirm' after transfer was finished
                this.fileTransferService.removeUserStatus(userId);
            }
        }
    }


    public onOpenChat(userId: UserId): void {
        this.chatService.openChat(userId);
    }

}
