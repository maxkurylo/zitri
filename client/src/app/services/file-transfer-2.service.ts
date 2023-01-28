import { Injectable } from '@angular/core';
import {SocketMessage, WebsocketsService} from "./websockets.service";
import {filter} from "rxjs/operators";
import {Webrtc2Service} from "./webrtc2.service";
import {BehaviorSubject} from "rxjs";
import zipFiles from "../helpers/zip-files";
import {throttle} from "lodash";
import downloadFile from "../helpers/download-blob";

@Injectable({
  providedIn: 'root'
})
export class FileTransfer2Service {
    private readonly filesBuffer: { [userId: string]: File } = {};

    public readonly state$ = new BehaviorSubject<TransferStateMap>({});
    public readonly receivingFilesInfo$ = new BehaviorSubject<FileInfoMap>({});

    constructor(private ws: WebsocketsService, private webRTCService: Webrtc2Service) {
        this.ws.event$
            .pipe(
                filter((message) => this.isRemoteTransferStatus(message.type))
            )
            .subscribe((message: SocketMessage) => {
                switch (message.type) {
                    case 'OFFER': this.onOffer(message.from as string, message.message); break;
                    case 'CANCELLED': this.onCancelled(message.from as string); break;
                    case 'ACCEPTED': this.onAccepted(message.from as string); break;
                    default: break;
                }
            });

        this.setPeerSubscriptions();
    }

    // TODO: send offer first and then zip
    public async sendOffer(userId: string, files: FileList): Promise<void> {
        const moreThanOneFile = files.length > 1;
        const state = this.state$.getValue();
        state[userId] = {
            userId,
            status: moreThanOneFile ? 'ZIPPING' : 'OFFER'
        };

        this.state$.next(state);

        let file = files[0];
        if (moreThanOneFile) {
            const progressCallback = throttle((progress: number) => {
                this.setStatus(userId, 'ZIPPING', progress);
            }, 50);
            file = await zipFiles(files, 'Maslo', progressCallback);
            this.setStatus(userId, 'OFFER');
        }

        this.filesBuffer[userId] = file;
        const fileInfo = {
            name: file.name,
            size: file.size,
        }
        this.signal(userId, 'OFFER', fileInfo);
    }


    public accept(userId: string): void {
        this.signal(userId, 'ACCEPTED');
        this.webRTCService.accept(userId);
        this.setStatus(userId, 'IN_PROGRESS');
    }


    public cancel(userId: string): void {
        this.signal(userId, 'CANCELLED');
        this.setStatus(userId, 'CANCELLED');
        this.delayStateCleanup(userId);
        this.webRTCService.removePeer(userId);
    }


    public cleanUserStatus(userId: string, timeout: number = 0): void {
        this.delayStateCleanup(userId, timeout);
    }


    private setPeerSubscriptions(): void {
        this.webRTCService.file$.subscribe((e) => {
            this.setStatus(e.userId, 'FINISHED', 100);
            this.delayStateCleanup(e.userId);
            downloadFile(e.blob, e.name);
        });

        this.webRTCService.progress$.subscribe((e) => {
            this.setStatus(e.userId, 'IN_PROGRESS', e.percent);
        });

        this.webRTCService.error$.subscribe((e) => {
            console.log(e.error);
            this.setStatus(e.userId, 'ERROR');
        });
    }


    private onOffer(userId: string, payload: any): void {
        this.setStatus(userId, 'OFFER');
        const files = this.receivingFilesInfo$.getValue();
        files[userId] = {
            name: payload.name,
            size: payload.size
        };
        this.receivingFilesInfo$.next(files);
    }


    private onCancelled(userId: string): void {
        this.setStatus(userId, 'CANCELLED');
        this.webRTCService.cancel(userId);
        this.delayStateCleanup(userId);
    }


    // remote user accepted invitation
    private onAccepted(userId: string): void {
        const file = this.filesBuffer[userId];
        if (file) {
            this.webRTCService.sendFile(userId, file);
            this.setStatus(userId, 'IN_PROGRESS', 0);
            // we don't need the file in buffer anymore
            delete this.filesBuffer[userId];
        }
    }


    private setStatus(userId: string, status: TransferStatus, progress?: number) {
        const state = this.state$.getValue();
        const userState = state[userId];
        if (userState) {
            userState.status = status;
            userState.progress = progress;
            this.state$.next(state);
        }
    }


    private delayStateCleanup(userId: string, timeout: number = 1000) {
        setTimeout(() => {
            const state = this.state$.getValue();
            delete state[userId];
            this.state$.next(state);
        }, timeout);
    }


    private signal(userId: string, type: RemoteTransferStatus, message?: any): void {
        this.ws.sendMessage({
            type,
            to: [ userId ],
            message
        });
    }


    private isRemoteTransferStatus(event: string): event is RemoteTransferStatus {
        return event === 'OFFER' ||
            event === 'CANCELLED' ||
            event === 'ACCEPTED';
    }
}


interface TransferStateMap {
    [userId: string]: TransferState;
}

export interface TransferState {
    userId: string;
    status: TransferStatus;
    progress?: number;
}

interface FileInfoMap {
    [userId: string]: FileInfo;
}

export interface FileInfo {
    name: string;
    size: number;
}

type RemoteTransferStatus = 'OFFER' | 'CANCELLED' | 'ACCEPTED';
type LocalTransferStatus = 'ZIPPING' | 'IN_PROGRESS' | 'ERROR' | 'FINISHED';

export type TransferStatus = RemoteTransferStatus | LocalTransferStatus;
