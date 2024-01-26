import { Injectable } from '@angular/core';
import {throttle} from "lodash";
import {Observable, Subject} from "rxjs";
import {filter} from "rxjs/operators";

import {environment} from '../../environments/environment';
import WebRTCPeer, {WebRTCConfig} from "../helpers/webrtc-peer";
import {SocketMessage, SocketsService} from "./sockets.service";
import {ApiService} from "./api.service";


@Injectable({
  providedIn: 'root'
})
export class WebrtcService {
    private webRTCConfig: WebRTCConfig = {stunServer: environment.fallbackStunServer};
    private readonly peers: PeersMap = {};

    private readonly errorSub = new Subject<ErrorEvent>();
    private readonly fileSub = new Subject<FileEvent>();
    private readonly progressSub = new Subject<ProgressEvent>();

    public readonly error$: Observable<ErrorEvent> = this.errorSub.asObservable();
    public readonly file$: Observable<FileEvent> = this.fileSub.asObservable();
    public readonly progress$: Observable<ProgressEvent> = this.progressSub.asObservable();

    constructor(private ws: SocketsService, private api: ApiService) {

    }

    public init() {
        this.api.webrtc()
            .then((webRTCConfig: WebRTCConfig) => {
                this.webRTCConfig = webRTCConfig;
            })

        this.ws.event$
            .pipe(
                filter((message) => this.isSignalingEvent(message.type))
            )
            .subscribe((message: SocketMessage) => {
                switch (message.type) {
                    case 'ICE-CANDIDATE': this.onIceCandidate(message); break;
                    case 'SDP-OFFER': this.onSdpOffer(message); break;
                    case 'SDP-ANSWER': this.onSdpAnswer(message); break;
                    default: break;
                }
            });
    }


    public sendFile(userId: string, file: File): void {
        const peer = this.createPeer(userId);

        const fileInfo = {
            name: file.name,
            size: file.size,
        };

        peer.createDataChannel(fileInfo)
            .then((dataChannel) => {
                peer.sendFile(file, dataChannel);
            });

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
        const peer = new WebRTCPeer(this.webRTCConfig);

        peer.onNegotiationNeeded = () => {
            peer.generateSDPOffer()
                .then(offer => {
                    this.signal(userId, 'SDP-OFFER', offer);
                });
        };

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

        peer.onProgress = throttle((progress: any) => {
            this.progressSub.next({
                userId,
                percent: progress.percent,
                fileName: progress.fileName,
                fileSize: progress.fileSize
            });
        }, 100);

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
                    .then(() => peer.generateSDPAnswer())
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
            peer.setRemoteSDP(event.message)
                .catch(console.error);
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
