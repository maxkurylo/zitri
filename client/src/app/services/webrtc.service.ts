import { Injectable } from '@angular/core';
import { environment } from "../../environments/environment";
import {WebsocketsService} from "./websockets.service";
import {Subject} from "rxjs";


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
        this.setupSocketEvents();
    }


    createPeerConnection(receiverId: string) {
        if (!this.peerConnections[receiverId]) {
            const config: RTCConfiguration = { iceServers: [{ urls: environment.stunServer }], };
            this.peerConnections[receiverId] = new RTCPeerConnection(config);
            this.setupPeerConnectionEvents(receiverId);
        }
    }


    removePeerConnection(receiverId: string) {
        const peer = this.peerConnections[receiverId];
        if (peer) {
            peer.close();
            delete this.peerConnections[receiverId];
        }
    }


    createDataChannel(receiverId: string, channelName: string): RTCDataChannel | null {
        const peer = this.peerConnections[receiverId];
        if (peer) {
            const channel = peer.createDataChannel(channelName);
            channel.binaryType = 'arraybuffer';
            this.shareLocalSDPOffer(receiverId)
                .catch(console.error);
            return channel;
        }
        return null;
    }


    addStreamToPeer(receiverId: string, stream: MediaStream) {
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
                this.ws.sendMessage('ice-candidate', { to: receiverId, message: iceEvent.candidate });
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


    private setupSocketEvents() {
        const onIceCandidate = (event: any) => {
            console.log('CANDIDATE RECEIVED', event);
            const peer = this.peerConnections[event.from];
            if (peer) {
                peer.addIceCandidate(event.message)
                    .then()
                    .catch(console.error)
            }
        };

        const onSdpOffer = (event: any) => {
            console.log('sdp-offer', event);
            const peer = this.peerConnections[event.from];
            if (peer) {
                peer.setRemoteDescription(event.message)
                    .then(() => peer.createAnswer())
                    .then(answer => {
                        peer.setLocalDescription(answer)
                            .then(() => {
                                this.ws.sendMessage('sdp-answer', {to: event.from, message: answer});
                            })
                            .catch(console.error)
                    })
                    .catch(console.error)
            }
        };

        const onSdpAnswer = (event: any) => {
            console.log('sdp-answer', event);
            const peer = this.peerConnections[event.from];
            if (peer) {
                peer.setRemoteDescription(event.message)
                    .then(console.log)
                    .catch(console.error)
            }
        };

        this.ws.setUpSocketEvent('ice-candidate', onIceCandidate);
        this.ws.setUpSocketEvent('sdp-offer', onSdpOffer);
        this.ws.setUpSocketEvent('sdp-answer', onSdpAnswer);
    }


    private async shareLocalSDPOffer(receiverId: string) {
        const peer = this.peerConnections[receiverId];
        if (peer) {
            const offer: RTCSessionDescriptionInit = await peer.createOffer();
            await peer.setLocalDescription(offer);
            this.ws.sendMessage('sdp-offer', {
                to: receiverId,
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

interface NewDataChannelInfo {
    dataChannel: RTCDataChannel;
    userId: string;
}

interface NewTrackInfo {
    streams: readonly MediaStream[];
    userId: string;
}