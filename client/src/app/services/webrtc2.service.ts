import { Injectable } from '@angular/core';
import {ZipFilesService} from "./zip-files.service";
import {filter} from "rxjs/operators";
import {SocketMessage, WebsocketsService} from "./websockets.service";
import WebRTCPeer from "../helpers/webrtc-peer";
import {Observable, Subject} from "rxjs";
import {throttle} from "lodash";

@Injectable({
  providedIn: 'root'
})
export class Webrtc2Service {
    private readonly peers: PeersMap = {};

    private readonly errorSub = new Subject<ErrorEvent>();
    private readonly fileSub = new Subject<FileEvent>();
    private readonly progressSub = new Subject<ProgressEvent>();

    public readonly error$: Observable<ErrorEvent> = this.errorSub.asObservable();
    public readonly file$: Observable<FileEvent> = this.fileSub.asObservable();
    public readonly progress$: Observable<ProgressEvent> = this.progressSub.asObservable();

    constructor(private zipFilesService: ZipFilesService, private ws: WebsocketsService) {

    }

    public init() {
        this.ws.event$
            .pipe(
                filter((message) => this.isSignalingEvent(message.type))
            )
            .subscribe((message: SocketMessage) => {
                switch (message.type) {
                    case 'ICE-CANDIDATE':
                        this.onIceCandidate(message);
                        break;
                    case 'SDP-OFFER':
                        this.onSdpOffer(message);
                        break;
                    case 'SDP-ANSWER':
                        this.onSdpAnswer(message);
                        break;
                    default:
                        break;
                }
            });
    }


    public sendFile(userId: string, file: File): void {
        const peer = this.createPeer(userId);

        peer.generateSDPOffer()
            .then(offer => {
                this.signal(userId, 'SDP-OFFER', offer);
            });

        peer.sendFile(file);

        this.peers[userId] = peer;
    }


    public accept(userId: string): void {
        this.peers[userId] = this.createPeer(userId);
    }


    public cancel(userId: string): void {
        if (this.peers[userId]) {
            this.peers[userId].abortDataTransmission()
        }
    }


    public removePeer(userId: string): void {
        if (this.peers[userId]) {
            this.peers[userId].destroy();
            delete this.peers[userId];
        }
    }


    private createPeer(userId: string): WebRTCPeer {
        const peer = new WebRTCPeer();
        peer.onICECandidate = (iceCandidate) => {
            this.signal(userId, 'ICE-CANDIDATE', iceCandidate);
        };

        peer.onError = (error) => {
            this.errorSub.next({
                userId,
                error
            });
        };

        peer.onFile = (blob, fileInfo) => {
            this.fileSub.next({
                userId,
                blob,
                name: fileInfo.name,
                size: fileInfo.size,
            });
        };

        peer.onProgress = throttle((progress) => {
            this.progressSub.next({
                userId,
                percent: progress.percent,
                fileName: progress.fileName,
                fileSize: progress.fileSize
            });
        }, 50);

        return peer;
    }

    private onIceCandidate(event: SocketMessage): void {
        const peer = event.from ? this.peers[event.from] : null;
        if (peer) {
            peer.setRemoteICECandidate(event.message);
        }
    }

    private onSdpOffer(event: SocketMessage): void {
        if (event.from) {
            const peer = this.peers[event.from];
            if (peer) {
                peer.setRemoteSDP(event.message)
                    .then(peer.generateSDPAnswer)
                    .then(answer => {
                        this.signal(event.from!, 'SDP-ANSWER', answer);
                    })
                    .catch(console.error);
            }
        }
    }

    private onSdpAnswer(event: SocketMessage): void {
        const peer = event.from ? this.peers[event.from] : null;
        if (peer) {
            peer.setRemoteSDP(event.message);
        }
    }

    private signal(userId: string, type: WebRTCSignalingEvent, message: RTCIceCandidate | RTCSessionDescriptionInit): void {
        this.ws.sendMessage({
            type,
            to: [ userId ],
            message
        });
    }

    private isSignalingEvent(event: string): event is WebRTCSignalingEvent {
        return event === 'ICE-CANDIDATE' ||
               event === 'SDP-OFFER' ||
               event === 'SDP-ANSWER';
    }
}



type WebRTCSignalingEvent = 'ICE-CANDIDATE' | 'SDP-OFFER' | 'SDP-ANSWER';

export interface PeersMap {
    [userId: string]: WebRTCPeer;
}


export interface ErrorEvent {
    userId: string;
    error: Event;
}

export interface FileEvent {
    userId: string;
    blob: Blob;
    name: string;
    size: number;
}

export interface ProgressEvent {
    userId: string;
    percent: number;
    fileName: string;
    fileSize: number;
}
