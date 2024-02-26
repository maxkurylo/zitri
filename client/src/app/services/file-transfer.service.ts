import {Injectable} from '@angular/core';
import {BehaviorSubject, Observable} from 'rxjs';
import {filter, map} from 'rxjs/operators';
import {throttle} from 'lodash';

import downloadFile from '../helpers/download-blob';
import {archiveFiles, IZipFileProgressEvent} from '../helpers/archive-files';

import {SocketMessage, SocketsService} from './sockets.service';
import {WebRTCService} from './webrtc.service';

@Injectable({
	providedIn: 'root',
})
export class FileTransferService {
	private readonly filesBuffer: {[userId: string]: File} = {};

	public transferState = new BehaviorSubject<TransferStateMap>({});
	public transferState$ = this.transferState.asObservable();

	constructor(private socketsService: SocketsService, private webRTCService: WebRTCService) {
		this.setSocketsSubscriptions();
		this.setPeerSubscriptions();
	}

	public getUserState(userId: string): Observable<TransferState | null> {
		return this.transferState$.pipe(map((state) => state[userId] || null));
	}

	public send(userId: string, userName: string, files: FileList): void {
		if (files.length > 1) {
			// Archive multiple files before sending
			const filesInfo = {
				files,
				archiveName: `Files from ${userName}`,
			};
			// TODO: implement cancel for ongoing archiving
			archiveFiles(filesInfo, this.archivingProgressCallback(userId));
		} else {
			// if there is a single file send it right away
			this.sendOffer(userId, files[0]);
		}
	}

	public accept(userId: string): void {
		this.signal(userId, 'ACCEPTED');
		this.webRTCService.accept(userId);
		this.setState(userId, {
			status: 'IN_PROGRESS',
		});
	}

	public decline(userId: string): void {
		this.signal(userId, 'DECLINED');
		this.removeUserStatus(userId);
	}

	public confirm(userId: string): void {
		const state = this.transferState.getValue();
		const userState = state[userId];

		if (userState) {
			if (userState.status === 'OFFER') {
				// receiver clicked 'Confirm' on transfer offer
				this.accept(userId);
			}
			if (userState.status === 'FINISHED' || userState.status === 'DECLINED' || userState.status === 'ABORTED') {
				// user clicked 'Confirm' after transfer was finished
				this.removeUserStatus(userId);
			}
		}
	}

	public cancel(userId: string): void {
		const state = this.transferState.getValue();
		const userState = state[userId];

		if (userState) {
			if (userState.status === 'OFFER') {
				// receiver clicked 'Cancel' on transfer offer
				this.decline(userId);
			}
			if (userState.status === 'WAITING_FOR_APPROVE') {
				// sender clicked 'Cancel' on transfer offer
				this.abort(userId);
			}
			// if (userState.status === 'IN_PROGRESS') {
			//     // sender or receiver clicked 'Cancel' during file transfer
			//     this.fileTransferService.showAbortConfirmation(userId);
			// }
		}
	}

	public showAbortConfirmation(userId: string): void {
		const state = this.transferState.getValue();
		const userState = state[userId];
		if (userState) {
			this.setState(userId, {
				...userState,
				status: 'CONFIRM_ABORT',
			});
		}
	}

	public abort(userId: string): void {
		this.signal(userId, 'ABORTED');
		this.setState(userId, {
			status: 'ABORTED',
		});
		this.webRTCService.removePeer(userId);
	}

	public removeUserStatus(userId: string): void {
		const state = this.transferState.getValue();
		delete state[userId];
		this.transferState.next({...state});
	}

	private setSocketsSubscriptions(): void {
		this.socketsService.event$
			.pipe(filter((message) => this.isRemoteTransferStatus(message.type)))
			.subscribe((message: SocketMessage) => {
				const type = message.type as RemoteTransferStatus;
				switch (type) {
					case 'OFFER':
						this.onOffer(message.from as string, message.message);
						break;
					case 'DECLINED':
						this.onDeclined(message.from as string);
						break;
					case 'ACCEPTED':
						this.onAccepted(message.from as string);
						break;
					case 'ABORTED':
						this.onAborted(message.from as string);
						break;
					default:
						break;
				}
			});
	}

	private setPeerSubscriptions(): void {
		this.webRTCService.file$.subscribe((e) => {
			this.setState(e.userId, {
				status: 'FINISHED',
			});
			downloadFile(e.blob, e.name);
		});

		this.webRTCService.progress$.subscribe((e) => {
			if (e.percent === 100) {
				return this.setState(e.userId, {
					status: 'FINISHED',
				});
			}
			// we keep previous status in case if user is in 'CONFIRM_ABORT' status
			const status = this.transferState.getValue();
			const userStatus = status[e.userId];
			if (userStatus) {
				this.setState(e.userId, {
					...userStatus,
					progress: e.percent,
				});
			}
		});

		this.webRTCService.error$.subscribe((e) => {
			this.setState(e.userId, {
				status: 'ERROR',
			});
		});
	}

	private onOffer(userId: string, payload: any): void {
		this.setState(userId, {
			status: 'OFFER',
			fileName: payload.name,
			fileSize: payload.size,
		});
	}

	private onDeclined(userId: string): void {
		this.setState(userId, {
			status: 'DECLINED',
		});
		this.webRTCService.cancel(userId);
	}

	// remote user accepted invitation
	private onAccepted(userId: string): void {
		const file = this.filesBuffer[userId];
		if (file) {
			this.webRTCService.sendFile(userId, file);
			this.setState(userId, {
				status: 'IN_PROGRESS',
			});
			// we don't need the file in buffer anymore
			delete this.filesBuffer[userId];
		}
	}

	private onAborted(userId: string): void {
		this.setState(userId, {
			status: 'ABORTED',
		});
		this.webRTCService.removePeer(userId);
	}

	private setState(userId: string, userState: TransferState) {
		const state = this.transferState.getValue();
		state[userId] = {...userState};
		this.transferState.next({...state});
	}

	private signal(userId: string, type: RemoteTransferStatus, message?: any): void {
		this.socketsService.sendMessage({
			type,
			to: [userId],
			message,
		});
	}

	private isRemoteTransferStatus(event: string): event is RemoteTransferStatus {
		return event === 'OFFER' || event === 'ABORTED' || event === 'DECLINED' || event === 'ACCEPTED';
	}

	private archivingProgressCallback = (userId: string) =>
		throttle(
			(event: IZipFileProgressEvent) => {
				if ((event.isReady, event.file)) {
					this.sendOffer(userId, event.file);
				} else {
					this.setState(userId, {
						status: 'ZIPPING',
						progress: event.percent,
					});
				}
			},
			100,
			{trailing: true},
		);

	private sendOffer(userId: string, file: File) {
		this.filesBuffer[userId] = file;

		this.setState(userId, {
			status: 'WAITING_FOR_APPROVE',
		});

		this.signal(userId, 'OFFER', {
			name: file.name,
			size: file.size,
		});
	}
}

export interface TransferStateMap {
	[userId: string]: TransferState;
}

export interface TransferState {
	status: TransferStatus;
	progress?: number;
	fileName?: string;
	fileSize?: number;
}

type RemoteTransferStatus = 'OFFER' | 'ABORTED' | 'ACCEPTED' | 'DECLINED';
type LocalTransferStatus = 'ZIPPING' | 'WAITING_FOR_APPROVE' | 'IN_PROGRESS' | 'CONFIRM_ABORT' | 'ERROR' | 'FINISHED';

export type TransferStatus = RemoteTransferStatus | LocalTransferStatus;
