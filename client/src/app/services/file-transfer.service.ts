import { Injectable } from '@angular/core';
import {SocketMessage, SocketsService} from "./sockets.service";
import {filter} from "rxjs/operators";
import {WebrtcService} from "./webrtc.service";
import {BehaviorSubject} from "rxjs";
import downloadFile from "../helpers/download-blob";
import {UserId} from "./current-user.service";
import {throttle} from "lodash";
import zipFiles from "../helpers/zip-files";

@Injectable({
  providedIn: 'root'
})
export class FileTransferService {
    private readonly filesBuffer: { [userId: UserId]: File } = {};

    public transferState = new BehaviorSubject<TransferStateMap>({});
    public transferState$ = this.transferState.asObservable();

    constructor(private socketsService: SocketsService, private webRTCService: WebrtcService) {
        this.setSocketsSubscriptions();
        this.setPeerSubscriptions();
    }


    // TODO: cancel for zipping
    // TODO: it is possible to optimize zipping by doing it after making an offer.
    //  It can save a few seconds of time
    public send(userId: UserId, files: FileList): void {
        const sendFile = (file: File) => {
            this.filesBuffer[userId] = file;
            this.setState(userId, {
                status: 'WAITING_FOR_APPROVE'
            });
            this.signal(userId, 'OFFER', {
                name: file.name,
                size: file.size,
            });
        }

        if (files.length > 1) {
            this.zipFiles(userId, files, 'Maslo')
                .then((file) => sendFile(file));
        } else {
            sendFile(files[0])
        }

    }


    public accept(userId: UserId): void {
        this.signal(userId, 'ACCEPTED');
        this.webRTCService.accept(userId);
        this.setState(userId, {
            status: 'IN_PROGRESS'
        });
    }

    public decline(userId: UserId): void {
        this.signal(userId, 'DECLINED');
        this.removeUserStatus(userId);
    }


    public showAbortConfirmation(userId: UserId): void {
        const state = this.transferState.getValue();
        const userState = state[userId];
        if (userState) {
            this.setState(userId, {
                ...userState,
                status: 'CONFIRM_ABORT'
            });
        }
    }


    public abort(userId: UserId): void {
        this.signal(userId, 'ABORTED');
        this.setState(userId, {
            status: 'ABORTED'
        });
        this.webRTCService.removePeer(userId);
    }


    public removeUserStatus(userId: UserId): void {
        const state = this.transferState.getValue();
        delete state[userId];
        this.transferState.next({...state});
    }


    private zipFiles(userId: UserId, files: FileList, archiveName: string): Promise<File> {
        const progressCallback = throttle((progress: number) => {
            this.setState(userId,{
                status: 'ZIPPING',
                progress,
            });
        }, 100, { trailing: false });
        return zipFiles(files, archiveName, progressCallback);
    }


    private setSocketsSubscriptions(): void {
        this.socketsService.event$
            .pipe(
                filter((message) => this.isRemoteTransferStatus(message.type))
            )
            .subscribe((message: SocketMessage) => {
                const type = message.type as RemoteTransferStatus;
                switch (type) {
                    case 'OFFER': this.onOffer(message.from as string, message.message); break;
                    case 'DECLINED': this.onDeclined(message.from as string); break;
                    case 'ACCEPTED': this.onAccepted(message.from as string); break;
                    default: break;
                }
            });
    }


    private setPeerSubscriptions(): void {
        this.webRTCService.file$.subscribe((e) => {
            this.setState(e.userId, {
                status: 'FINISHED'
            });
            downloadFile(e.blob, e.name);
        });

        this.webRTCService.progress$.subscribe((e) => {
            if (e.percent === 100) {
                return this.setState(e.userId, {
                    status: 'FINISHED'
                });
            }
            this.setState(e.userId, {
                status: 'IN_PROGRESS',
                progress: e.percent
            });
        });

        this.webRTCService.error$.subscribe((e) => {
            this.setState(e.userId, {
                status: 'ERROR'
            });
        });
    }


    private onOffer(userId: UserId, payload: any): void {
        this.setState(userId, {
            status: 'OFFER',
            fileName: payload.name,
            fileSize: payload.size
        });
    }


    private onDeclined(userId: UserId): void {
        this.setState(userId, {
            status: 'DECLINED'
        });
        this.webRTCService.cancel(userId);
    }


    // remote user accepted invitation
    private onAccepted(userId: UserId): void {
        const file = this.filesBuffer[userId];
        if (file) {
            this.webRTCService.sendFile(userId, file);
            this.setState(userId, {
                status: 'IN_PROGRESS'
            });
            // we don't need the file in buffer anymore
            delete this.filesBuffer[userId];
        }
    }


    private setState(userId: UserId, userState: TransferState) {
        const state = this.transferState.getValue();
        state[userId] = {...userState};
        this.transferState.next({...state});
    }


    private signal(userId: UserId, type: RemoteTransferStatus, message?: any): void {
        this.socketsService.sendMessage({
            type,
            to: [ userId ],
            message
        });
    }


    private isRemoteTransferStatus(event: string): event is RemoteTransferStatus {
        return event === 'OFFER' ||
            event === 'ABORTED' ||
            event === 'DECLINED' ||
            event === 'ACCEPTED';
    }
}



export interface TransferStateMap {
    [userId: UserId]: TransferState;
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
