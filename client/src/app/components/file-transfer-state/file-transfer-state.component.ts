import {Component, EventEmitter, Input, Output} from '@angular/core';
import {ETransferStatus} from '../../services/transfer-state.service';

const STATE_OPTIONS: {[state: string]: TransferInfoOption} = {
	[ETransferStatus.ARCHIVING]: {
		text: 'Zipping files... It saves some time for data transfer so it worth of waiting.',
		// cancelButtonLabel: 'Cancel',
	},
	[ETransferStatus.OFFER_TO_RECEIVE_FILE]: {
		text: 'Do you want to receive file', // TODO: come up with idea how to add a file name here
		cancelButtonLabel: 'Decline',
		confirmButtonLabel: 'Accept',
	},
	[ETransferStatus.WAITING_FOR_ACCEPT]: {
		text: 'Waiting user to accept file...',
		cancelButtonLabel: 'Cancel',
	},
	[ETransferStatus.REMOTE_DECLINED]: {
		text: 'User refused from your file',
		confirmButtonLabel: 'Ok',
	},
	[ETransferStatus.TRANSFERRING]: {
		text: 'Transfer progress', // TODO: come up with idea how to add progress percent here
		// cancelButtonLabel: 'Cancel',
	},
	[ETransferStatus.ERROR]: {
		text: 'An error happened during file transfer. Please, try again',
		confirmButtonLabel: 'Got it!',
	},
	[ETransferStatus.CONFIRM_ABORTING]: {
		text: 'Do you want to stop file transfer?',
		cancelButtonLabel: 'No',
		confirmButtonLabel: 'Yes',
	},
	[ETransferStatus.ABORTED]: {
		text: 'File transfer was cancelled',
		confirmButtonLabel: 'Ok',
	},
	[ETransferStatus.FINISHED]: {
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
	@Input() set status(status: ETransferStatus) {
		this.stateInfo = STATE_OPTIONS[status];
	}

	@Output() onConfirm = new EventEmitter<void>();
	@Output() onCancel = new EventEmitter<void>();

	public stateInfo?: TransferInfoOption;

	constructor() {}

	public handleConfirm(e: MouseEvent): void {
		e.stopPropagation();
		this.onConfirm.emit();
	}

	public handleCancel(e: MouseEvent): void {
		e.stopPropagation();
		this.onCancel.emit();
	}
}

interface TransferInfoOption {
	text: string;
	confirmButtonLabel?: string;
	cancelButtonLabel?: string;
}
