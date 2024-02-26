import {Injectable} from '@angular/core';
import {BehaviorSubject, Observable} from 'rxjs';
import {map} from 'rxjs/operators';
import {throttle} from 'lodash';

import downloadFile from '../helpers/download-blob';
import {archiveFiles, IZipFileProgressEvent} from '../helpers/archive-files';

import {SocketMessage, SocketsService} from './sockets.service';
import {WebRTCService} from './webrtc.service';
import {CurrentUserService} from './current-user.service';

// TODO: This service looks too big. Think how to refactor it
/**
 * This service represents UI level of the file transferring. It is responsible for:
 * - signaling between users about their intentions to send/receive files
 * - preparing files for sending
 * - storing state of file transferring
 * - handling user events
 */
@Injectable({
	providedIn: 'root',
})
export class TransferStateService {
	private readonly filesBuffer: {[userId: string]: File} = {};

	public transferState = new BehaviorSubject<TransferStateMap>({});
	public transferState$ = this.transferState.asObservable();

	constructor(
		private socketsService: SocketsService,
		private webRTCService: WebRTCService,
		private currentUserService: CurrentUserService,
	) {
		this.setSocketsSubscriptions();
		this.setPeerSubscriptions();
	}

	public sendFile(userId: string, files: FileList): void {
		if (files.length > 1) {
			// Archive multiple files before sending
			const currentUserName = this.currentUserService.user.name;
			const filesInfo = {
				files,
				archiveName: `Files from ${currentUserName}`,
			};
			// TODO: implement cancel for ongoing archiving
			archiveFiles(filesInfo, this.archivingProgressCallback(userId));
		} else {
			// if there is a single file send it right away
			this.sendOffer(userId, files[0]);
		}
	}

	public confirm(userId: string): void {
		switch (this.getUserState(userId)?.status) {
			case ETransferStatus.OFFER_TO_RECEIVE_FILE:
				// receiver clicked 'Confirm' on transfer offer
				this.accept(userId);

				break;
			case ETransferStatus.FINISHED:
			case ETransferStatus.REMOTE_DECLINED:
			case ETransferStatus.REMOTE_ABORTED:
			case ETransferStatus.ABORTED:
				// user clicked 'Ok' after transfer was finished or aborted
				this.removeUserStatus(userId);

				break;
			default:
				break;
		}
	}

	public cancel(userId: string): void {
		switch (this.getUserState(userId)?.status) {
			case ETransferStatus.OFFER_TO_RECEIVE_FILE:
				// receiver clicked 'Cancel' on transfer offer
				this.decline(userId);

				break;
			case ETransferStatus.WAITING_FOR_ACCEPT:
				// sender clicked 'Cancel' on transfer offer
				this.abort(userId);

				break;
			case ETransferStatus.TRANSFERRING:
				// sender or receiver clicked 'Cancel' during file transfer
				// this.showAbortConfirmation(userId);

				break;
			default:
				break;
		}
	}

	public getUserState$(userId: string): Observable<TransferState | null> {
		return this.transferState$.pipe(map((state) => state[userId] || null));
	}

	private getUserState(userId: string): TransferState | undefined {
		const state = this.transferState.getValue();
		return state[userId];
	}

	private showAbortConfirmation(userId: string): void {
		const userState = this.getUserState(userId);

		if (userState) {
			this.setState(userId, {
				...userState,
				status: ETransferStatus.CONFIRM_ABORTING,
			});
		}
	}

	private accept(userId: string): void {
		this.signal(userId, ETransferEvent.ACCEPT);
		this.webRTCService.accept(userId);
		this.setState(userId, {status: ETransferStatus.TRANSFERRING});
	}

	private decline(userId: string): void {
		this.signal(userId, ETransferEvent.DECLINE);
		this.removeUserStatus(userId);
	}

	private abort(userId: string): void {
		this.signal(userId, ETransferEvent.ABORT);
		this.setState(userId, {status: ETransferStatus.ABORTED});
		this.webRTCService.removePeer(userId);
	}

	private removeUserStatus(userId: string): void {
		const state = this.transferState.getValue();
		delete state[userId];
		this.transferState.next({...state});
	}

	private setSocketsSubscriptions(): void {
		this.socketsService.event$.subscribe((message: SocketMessage) => {
			switch (message.type) {
				case ETransferEvent.OFFER:
					this.onRemoteOffer(message.from as string, message.message);

					break;
				case ETransferEvent.DECLINE:
					this.onRemoteDeclined(message.from as string);

					break;
				case ETransferEvent.ACCEPT:
					this.onRemoteAccepted(message.from as string);

					break;
				case ETransferEvent.ABORT:
					this.onRemoteAborted(message.from as string);

					break;
				default:
					break;
			}
		});
	}

	private setPeerSubscriptions(): void {
		this.webRTCService.file$.subscribe((e) => {
			this.setState(e.userId, {status: ETransferStatus.FINISHED});

			downloadFile(e.blob, e.name);
		});

		this.webRTCService.progress$.subscribe((e) => {
			if (e.percent === 100) {
				this.setState(e.userId, {status: ETransferStatus.FINISHED});
			} else {
				// we keep previous status in case if user is in 'CONFIRM_ABORT' status
				const userState = this.getUserState(e.userId);

				if (userState) {
					this.setState(e.userId, {
						...userState,
						progress: e.percent,
					});
				}
			}
		});

		this.webRTCService.error$.subscribe((e) => {
			this.setState(e.userId, {status: ETransferStatus.ERROR});
		});
	}

	private onRemoteOffer(userId: string, payload: any): void {
		this.setState(userId, {
			status: ETransferStatus.OFFER_TO_RECEIVE_FILE,
			fileName: payload.name,
			fileSize: payload.size,
		});
	}

	private onRemoteDeclined(userId: string): void {
		this.setState(userId, {status: ETransferStatus.REMOTE_DECLINED});
		this.webRTCService.cancel(userId);
	}

	private onRemoteAccepted(userId: string): void {
		const file = this.filesBuffer[userId];

		if (file) {
			this.webRTCService.sendFile(userId, file);
			this.setState(userId, {status: ETransferStatus.TRANSFERRING});
			// we don't need to keep the file in buffer anymore
			delete this.filesBuffer[userId];
		}
	}

	private onRemoteAborted(userId: string): void {
		this.setState(userId, {status: ETransferStatus.ABORTED});
		this.webRTCService.removePeer(userId);
	}

	private setState(userId: string, userState: TransferState) {
		const state = this.transferState.getValue();
		state[userId] = {...userState};
		this.transferState.next({...state});
	}

	private signal(userId: string, type: ETransferEvent, message?: any): void {
		this.socketsService.sendMessage({
			type,
			to: [userId],
			message,
		});
	}

	private archivingProgressCallback = (userId: string) =>
		throttle(
			(event: IZipFileProgressEvent) => {
				if ((event.isReady, event.file)) {
					// Files archived, we can send them
					this.sendOffer(userId, event.file);
				} else {
					// Archiving progress
					this.setState(userId, {
						status: ETransferStatus.ARCHIVING,
						progress: event.percent,
					});
				}
			},
			50,
			{trailing: true},
		);

	private sendOffer(userId: string, file: File) {
		// store reference to the file during negotiation period
		this.filesBuffer[userId] = file;

		this.setState(userId, {status: ETransferStatus.WAITING_FOR_ACCEPT});

		this.signal(userId, ETransferEvent.OFFER, {
			name: file.name,
			size: file.size,
		});
	}
}

export interface TransferStateMap {
	[userId: string]: TransferState;
}

export interface TransferState {
	status: ETransferStatus;
	progress?: number;
	fileName?: string;
	fileSize?: number;
}

export enum ETransferStatus {
	ARCHIVING,
	WAITING_FOR_ACCEPT,
	OFFER_TO_RECEIVE_FILE,
	REMOTE_DECLINED,
	TRANSFERRING,
	ABORTED,
	REMOTE_ABORTED,
	FINISHED,
	ERROR,
	CONFIRM_ABORTING,
}

export enum ETransferEvent {
	OFFER = 'OFFER',
	ACCEPT = 'ACCEPT',
	DECLINE = 'DECLINE',
	ABORT = 'ABORT',
}
