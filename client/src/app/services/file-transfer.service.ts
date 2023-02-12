import { Injectable } from '@angular/core';
import {SocketMessage, WebsocketsService} from "./websockets.service";
import {filter} from "rxjs/operators";
import {WebrtcService} from "./webrtc.service";
import {BehaviorSubject, Observable, Subject} from "rxjs";
import downloadFile from "../helpers/download-blob";

@Injectable({
  providedIn: 'root'
})
export class FileTransferService {
    private readonly filesBuffer: { [userId: string]: File } = {};

    // emit events for one specific user. There is no need to store the state
    private readonly eventSub = new Subject<TransferState>();
    public readonly event$: Observable<TransferState> = this.eventSub.asObservable();

    public readonly receivingFilesInfo$ = new BehaviorSubject<FileInfoMap>({});

    constructor(private ws: WebsocketsService, private webRTCService: WebrtcService) {
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

    public sendOffer(userId: string, file: File): void {
        this.filesBuffer[userId] = file;
        const fileInfo = {
            name: file.name,
            size: file.size,
        }
        this.emitEvent(userId, 'WAITING_FOR_APPROVE');
        this.signal(userId, 'OFFER', fileInfo);
    }


    public accept(userId: string): void {
        this.signal(userId, 'ACCEPTED');
        this.webRTCService.accept(userId);
        this.emitEvent(userId, 'IN_PROGRESS');
    }


    public cancel(userId: string): void {
        this.signal(userId, 'CANCELLED');
        this.emitEvent(userId, 'CANCELLED');
        this.webRTCService.removePeer(userId);
    }

    private setPeerSubscriptions(): void {
        this.webRTCService.file$.subscribe((e) => {
            this.emitEvent(e.userId, 'FINISHED', 100);
            downloadFile(e.blob, e.name);
        });

        this.webRTCService.progress$.subscribe((e) => {
            this.emitEvent(e.userId, 'IN_PROGRESS', e.percent);
        });

        this.webRTCService.error$.subscribe((e) => {
            console.log(e.error);
            this.emitEvent(e.userId, 'ERROR');
        });
    }


    private onOffer(userId: string, payload: any): void {
        this.emitEvent(userId, 'OFFER');
        const files = this.receivingFilesInfo$.getValue();
        files[userId] = {
            name: payload.name,
            size: payload.size
        };
        this.receivingFilesInfo$.next(files);
    }


    private onCancelled(userId: string): void {
        this.emitEvent(userId, 'CANCELLED');
        this.webRTCService.cancel(userId);
    }


    // remote user accepted invitation
    private onAccepted(userId: string): void {
        const file = this.filesBuffer[userId];
        if (file) {
            this.webRTCService.sendFile(userId, file);
            this.emitEvent(userId, 'IN_PROGRESS', 0);
            // we don't need the file in buffer anymore
            delete this.filesBuffer[userId];
        }
    }


    private emitEvent(userId: string, status: TransferStatus, progress?: number) {
        this.eventSub.next({
            userId,
            status,
            progress
        });
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
type LocalTransferStatus = 'WAITING_FOR_APPROVE' | 'IN_PROGRESS' | 'ERROR' | 'FINISHED';

export type TransferStatus = RemoteTransferStatus | LocalTransferStatus;
