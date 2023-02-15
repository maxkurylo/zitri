import { Component, EventEmitter, Input, Output } from '@angular/core';
import { TransferStatus } from '../../services/file-transfer.service';

const STATE_OPTIONS: { [state: string]: TransferInfoOption } = {
    ZIPPING: {
        text: 'Zipping files... It saves some time for data transfer so it worth of waiting.',
        cancelButtonLabel: 'Cancel',
    },
    OFFER: {
        text: 'Do you want to accept file', // TODO: come up with idea how to add a file name here
        cancelButtonLabel: 'Decline',
        confirmButtonLabel: 'Accept',
    },
    WAITING_FOR_APPROVE: {
        text: 'Waiting user to accept file...',
        cancelButtonLabel: 'Cancel',
    },
    DECLINED: {
        text: 'User refused from your file',
        confirmButtonLabel: 'Ok',
    },
    IN_PROGRESS: {
        text: 'Transfer progress', // TODO: come up with idea how to add progress percent here
        cancelButtonLabel: 'Cancel',
    },
    ERROR: {
        text: 'An error happened during file transfer. Please, try again',
        confirmButtonLabel: 'Got it!',
    },
    CONFIRM_ABORT: {
        text: 'Do you want to stop file transfer?',
        cancelButtonLabel: 'No',
        confirmButtonLabel: 'Yes',
    },
    ABORTED: {
        text: 'File transfer was cancelled',
        confirmButtonLabel: 'Ok',
    },
    FINISHED: {
        text: 'Filers were successfully transferred!',
        confirmButtonLabel: 'Ok',
    },
};

@Component({
    selector: 'app-file-transfer-state',
    templateUrl: './file-transfer-state.component.html',
    styleUrls: ['./file-transfer-state.component.scss'],
})
export class FileTransferPopupComponent {
    @Input() set status(status: TransferStatus) {
        this.stateInfo = STATE_OPTIONS[status];
    }

    @Output() onConfirm = new EventEmitter<void>();
    @Output() onCancel = new EventEmitter<void>();

    public stateInfo?: TransferInfoOption;

    constructor() {}
}

interface TransferInfoOption {
    text: string;
    confirmButtonLabel?: string;
    cancelButtonLabel?: string;
}
