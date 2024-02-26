import {ApplicationRef, Component, Input, OnInit, ViewChild} from '@angular/core';
import {UntypedFormControl} from '@angular/forms';
import {MatMenuTrigger} from '@angular/material/menu';
import {takeUntil} from 'rxjs/operators';

import {User} from 'src/app/types/IUser';
import {DestroyService} from 'src/app/services/destroy.service';
import {FileTransferService, TransferState} from 'src/app/services/file-transfer.service';
import {ChatService} from 'src/app/services/chat.service';

@Component({
	selector: 'app-user-element',
	templateUrl: './user-element.component.html',
	styleUrls: ['./user-element.component.scss'],
	providers: [DestroyService],
})
export class UserElementComponent implements OnInit {
	@Input() user: User;
	@Input() chatUnreadCount?: number = 0;

	@ViewChild(MatMenuTrigger) trigger: MatMenuTrigger;

	public filesInput = new UntypedFormControl(null);

	public transferState: TransferState | null = null;
	public isActive: boolean = false;

	constructor(
		private fileTransferService: FileTransferService,
		private destroyed$: DestroyService,
		private appRef: ApplicationRef,
		public chatService: ChatService,
	) {}

	ngOnInit(): void {
		this.subscribeToFileTransferChanges();
	}

	public handleFilesSelect(e: Event): void {
		const files = (e.target as HTMLInputElement).files;

		if (files) {
			this.fileTransferService.send(this.user.id, this.user.name, files);
			this.filesInput.reset();
		}
	}

	public openMenu(e: MouseEvent | KeyboardEvent) {
		e.stopPropagation();

		if (!this.isActive) {
			if (e instanceof KeyboardEvent) {
				if (e.code === 'Space' || e.code === 'Enter') {
					this.trigger.openMenu();
				}
			} else {
				this.trigger.openMenu();
			}
		}
	}

	public handleCancel(userId: string): void {
		this.fileTransferService.cancel(userId);
	}

	public handleConfirm(userId: string): void {
		this.fileTransferService.confirm(userId);
	}

	public handleOpenChat(userId: string): void {
		this.chatService.openChat(userId);
	}

	private subscribeToFileTransferChanges(): void {
		this.fileTransferService
			.getUserState(this.user.id)
			.pipe(takeUntil(this.destroyed$))
			.subscribe((transferState) => {
				const oldState = this.transferState;
				this.transferState = transferState;
				this.isActive = !!transferState;

				// TODO: Figure out why change detection doesn't work
				// even if transferState reference was changed
				if (oldState !== transferState) {
					this.appRef.tick();
				}
			});
	}
}

export interface FilesSelectedEvent {
	userId: string;
	userName: string;
	files: FileList;
}
