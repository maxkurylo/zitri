import { Injectable } from '@angular/core';
import { environment } from "../../environments/environment";
import {SocketMessage, WebsocketsService} from "./websockets.service";
import {Subject} from "rxjs";
import {filter} from "rxjs/operators";


@Injectable({
  providedIn: 'root'
})
export class WebRTCService {
    private peerConnections: PeerConnectionDictionary = {};

    private newDataChannelSubject = new Subject<NewDataChannelInfo>();
    private newTrackSubject = new Subject<NewTrackInfo>();

    newDataChannel = this.newDataChannelSubject.asObservable();
    newTrack = this.newTrackSubject.asObservable();


    constructor(private ws: WebsocketsService) {
        this.ws.event$
            .pipe(
                filter((message) => (
                    message.type === 'ice-candidate' ||
                    message.type === 'sdp-offer' ||
                    message.type === 'sdp-answer'
                ))
            )
            .subscribe((message: SocketMessage) => {
                switch (message.type) {
                    case 'ice-candidate':
                        this.onIceCandidate(message);
                        break;
                    case 'sdp-offer':
                        this.onSdpOffer(message);
                        break;
                    case 'sdp-answer':
                        this.onSdpAnswer(message);
                        break;
                    default:
                        break;
                }
            });
    }


    public createPeerConnection(receiverId: string) {
        if (!this.peerConnections[receiverId]) {
            const config: RTCConfiguration = { iceServers: [{ urls: environment.stunServer }], };
            this.peerConnections[receiverId] = new RTCPeerConnection(config);
            this.setupPeerConnectionEvents(receiverId);
        }
    }


    public removePeerConnection(receiverId: string) {
        const peer = this.peerConnections[receiverId];
        if (peer) {
            peer.close();
            delete this.peerConnections[receiverId];
        }
    }


    public createDataChannel(receiverId: string, channelName: string): RTCDataChannel | null {
        const peer = this.peerConnections[receiverId];
        if (peer) {
            const channel = peer.createDataChannel(channelName, { ordered: true });
            channel.binaryType = 'arraybuffer';
            this.shareLocalSDPOffer(receiverId)
                .catch(console.error);
            return channel;
        }
        return null;
    }


    // for video calls
    public addStreamToPeer(receiverId: string, stream: MediaStream) {
        const peer = this.peerConnections[receiverId];
        if (peer) {
            stream.getTracks().forEach(track => peer.addTrack(track, stream));
        }
    }


    /**
     * @param receiverId - remote user id we interact with
     */
    private setupPeerConnectionEvents(receiverId: string) {
        const peer = this.peerConnections[receiverId];
        if (peer) {
            peer.onicecandidate = (iceEvent: RTCPeerConnectionIceEvent) => {
                console.log('ICE Candidate generated', iceEvent);
                this.ws.sendMessage({
                    type: 'ice-candidate',
                    to: [receiverId],
                    message: iceEvent.candidate });
            };

            peer.ondatachannel = (event: RTCDataChannelEvent) => {
                console.log('On datachannel', event);
                const { channel } = event;
                channel.binaryType = 'arraybuffer';

                this.newDataChannelSubject.next({
                    dataChannel: channel,
                    userId: receiverId
                });
            };

            peer.ontrack = (event: RTCTrackEvent) => {
                console.log('NEW TRACK', event);
                this.newTrackSubject.next({
                    streams: event.streams,
                    userId: receiverId
                });
                // const video: any = document.getElementById('video');
                // video.srcObject = event.streams[0];
            };
        }
    }


    private onIceCandidate = (event: SocketMessage) => {
        console.log('CANDIDATE RECEIVED', event);
        const peer = event.from ? this.peerConnections[event.from] : null;
        if (peer) {
            peer.addIceCandidate(event.message)
                .then()
                .catch(console.error)
        }
    };

    private onSdpOffer = (event: SocketMessage) => {
        console.log('sdp-offer', event);
        const peer = event.from ? this.peerConnections[event.from] : null;
        if (peer) {
            peer.setRemoteDescription(event.message)
                .then(() => peer.createAnswer())
                .then(answer => {
                    peer.setLocalDescription(answer)
                        .then(() => {
                            this.ws.sendMessage({
                                type: 'sdp-answer',
                                to: [ event.from || '' ],
                                message: answer
                            });
                        })
                        .catch(console.error)
                })
                .catch(console.error)
        }
    };

    private onSdpAnswer = (event: SocketMessage) => {
        console.log('sdp-answer', event);
        const peer = event.from ? this.peerConnections[event.from] : null;
        if (peer) {
            peer.setRemoteDescription(event.message)
                .then(console.log)
                .catch(console.error)
        }
    };


    private async shareLocalSDPOffer(receiverId: string) {
        const peer = this.peerConnections[receiverId];
        if (peer) {
            const offer: RTCSessionDescriptionInit = await peer.createOffer();
            await peer.setLocalDescription(offer);
            this.ws.sendMessage({
                type: 'sdp-offer',
                to: [receiverId],
                message: offer
            });
            return;
        } else {
            throw new Error('No PeerConnection for userId ' + receiverId);
        }
    }
}


// userId is an id of remote user
interface PeerConnectionDictionary {
    [userId: string]: RTCPeerConnection // can be used both for video and files
}

export interface NewDataChannelInfo {
    dataChannel: RTCDataChannel;
    userId: string;
}

export interface NewTrackInfo {
    streams: readonly MediaStream[];
    userId: string;
}