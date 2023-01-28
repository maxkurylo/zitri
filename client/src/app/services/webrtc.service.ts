import { Injectable } from '@angular/core';
import { environment } from "../../environments/environment";
import {SocketMessage, WebsocketsService} from "./websockets.service";
import {Observable, Subject, asyncScheduler, of} from "rxjs";
import {filter, take, throttleTime} from "rxjs/operators";


@Injectable({
  providedIn: 'root'
})
export class WebRTCService {
    private MAXIMUM_MESSAGE_SIZE = 65536; // 64kB
    private END_OF_FILE_MESSAGE = 'EOF';

    private peerConnections: PeerConnectionDictionary = {};

    // TODO: deprecate this
    private newDataChannelSubject = new Subject<DataChannelInfo>();
    public newDataChannel = this.newDataChannelSubject.asObservable();

    // private newTrackSubject = new Subject<NewTrackInfo>();
    // public newTrack = this.newTrackSubject.asObservable();


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


    /**
     * Service API. Sending file to user
     * Emits value on transfer progress
     * Completes when finished
     * Emits error if cancelled or aborted
     * @param receiverId - user to send files
     * @param file - file to send
     */
    public sendFile(receiverId: string, file: File): Observable<WebRTCTransferState> {
        const stateSub = new Subject<WebRTCTransferState>();
        let progress = 0;
        let sentDataInBytes = 0;

        // TODO: make sure that it works for huge files. If no, chunk it
        (file as any).arrayBuffer()
            .then((arrayBuffer: ArrayBuffer) => {
                this.createPeerConnection(receiverId);
                const dataChannel = this.createDataChannel(receiverId, file.name);

                // const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                // stream.getVideoTracks().forEach(track => peerConnection.addTrack(track, stream));

                if (dataChannel) {
                    dataChannel.onopen = async () => {
                        const chunk = arrayBuffer.slice(sentDataInBytes, sentDataInBytes + this.MAXIMUM_MESSAGE_SIZE);
                        dataChannel.send(chunk);
                        progress = sentDataInBytes / arrayBuffer.byteLength;
                        sentDataInBytes += chunk.byteLength;
                        stateSub.next({ userId: receiverId, progress: progress * 100 });
                    };

                    dataChannel.onmessage = (m: any) => {
                        if (m.data === 'CHUNK_RECEIVED') {
                            if (sentDataInBytes < arrayBuffer.byteLength) {
                                const chunk = arrayBuffer.slice(sentDataInBytes, sentDataInBytes + this.MAXIMUM_MESSAGE_SIZE);
                                dataChannel.send(chunk);
                                progress = sentDataInBytes / arrayBuffer.byteLength;
                                sentDataInBytes += chunk.byteLength;
                                stateSub.next({ userId: receiverId, progress: progress * 100 });
                            } else {
                                dataChannel.send(this.END_OF_FILE_MESSAGE);
                                stateSub.complete();
                            }
                        }
                    };

                    dataChannel.onerror = (err) => {
                        stateSub.error(err);
                    };

                    dataChannel.onclose = () => {
                        stateSub.complete();
                    };
                }
            })
            .catch((err: any) => {
                stateSub.error(err);
            });

        return stateSub
            .asObservable()
            .pipe(throttleTime(50, asyncScheduler, { trailing: true, leading: true }));
    }


    /**
     * Service API. Receiving file from user
     * Emits value on transfer progress. When file is downloaded emits 100 percent progress and file itself
     * Completes when finished
     * Emits error if cancelled or aborted
     * @param userId - user to receive files from
     * @param fileSize - size of the file in bytes
     */
    public receiveFile(userId: string, fileSize: number): Observable<WebRTCTransferState> {
        const stateSub = new Subject<WebRTCTransferState>();

        let receivedBuffers: ArrayBuffer[] = [];
        let receivedBytesCount = 0;

        this.createPeerConnection2(userId)
            .pipe(take(1))
            .subscribe(({ dataChannel }) => {
                const closeDataChannel = (_: any) => {
                    dataChannel.close();
                    receivedBuffers = [];
                };

                dataChannel.onmessage = async (event) => {
                    const { data } = event;
                    try {
                        if (data !== this.END_OF_FILE_MESSAGE) {
                            // send chunk
                            receivedBuffers.push(data);
                            dataChannel.send('CHUNK_RECEIVED');
                            receivedBytesCount += data.byteLength;
                            const progress = receivedBytesCount / fileSize;
                            stateSub.next({
                                userId,
                                progress: progress * 100
                            });
                        } else {
                            // end of file
                            const blob = new Blob(receivedBuffers);
                            stateSub.next({
                                userId,
                                progress: 100,
                                file: blob
                            });
                            stateSub.complete();
                            closeDataChannel(dataChannel);
                        }
                    } catch (err) {
                        console.error('File transfer failed');
                        closeDataChannel(dataChannel);
                    }
                };

                dataChannel.onerror = err => {
                    stateSub.error(err);
                };
            });

        return stateSub
            .asObservable()
            .pipe(throttleTime(50, asyncScheduler, { trailing: true, leading: true }));
    }


    /**
     * Close peer and removes
     * @param receiverId
     */
    public removePeerConnection(receiverId: string): void {
        const peer = this.peerConnections[receiverId];
        if (peer) {
            peer.close();
            delete this.peerConnections[receiverId];
        }
    }


    public abortDataTransfer(receiverId: string): void {
        // TODO: make this work;)
    }


    private createPeerConnection2(receiverId: string): Observable<DataChannelInfo> {
        if (!this.peerConnections[receiverId]) {
            const config: RTCConfiguration = { iceServers: [{ urls: environment.stunServer }], };
            this.peerConnections[receiverId] = new RTCPeerConnection(config);
        }
        return this.setupPeerConnectionEvents2(receiverId);
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
    // public addStreamToPeer(receiverId: string, stream: MediaStream) {
    //     const peer = this.peerConnections[receiverId];
    //     if (peer) {
    //         stream.getTracks().forEach(track => peer.addTrack(track, stream));
    //     }
    // }


    private setupPeerConnectionEvents2(receiverId: string): Observable<DataChannelInfo> {
        const dataChannelSub = new Subject<DataChannelInfo>();
        const peer = this.peerConnections[receiverId];
        if (peer) {
            // TODO: handle errors
            peer.onicecandidate = (iceEvent: RTCPeerConnectionIceEvent) => {
                console.log('ICE Candidate generated', iceEvent);
                this.ws.sendMessage({
                    type: 'ice-candidate',
                    to: [receiverId],
                    message: iceEvent.candidate
                });
            };

            peer.ondatachannel = (event: RTCDataChannelEvent) => {
                console.log('Data channel opened', event);
                const { channel } = event;
                channel.binaryType = 'arraybuffer';

                dataChannelSub.next({
                    dataChannel: channel,
                    userId: receiverId
                });
                dataChannelSub.complete();

                // TODO: deprecate this
                this.newDataChannelSubject.next({
                    dataChannel: channel,
                    userId: receiverId
                });
            };

            // for video calls
            // peer.ontrack = (event: RTCTrackEvent) => {
            //     console.log('NEW TRACK', event);
            //     this.newTrackSubject.next({
            //         streams: event.streams,
            //         userId: receiverId
            //     });
            //     const video: any = document.getElementById('video');
            //     video.srcObject = event.streams[0];
            // };
        } else {
            dataChannelSub.error('No peer created')
        }

        return dataChannelSub.asObservable();
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



    // TODO: deprecate this
    public createPeerConnection(receiverId: string) {
        if (!this.peerConnections[receiverId]) {
            const config: RTCConfiguration = { iceServers: [{ urls: environment.stunServer }], };
            this.peerConnections[receiverId] = new RTCPeerConnection(config);
            this.setupPeerConnectionEvents(receiverId);
        }
    }

    // TODO: deprecate this
    private setupPeerConnectionEvents(receiverId: string) {
        const peer = this.peerConnections[receiverId];
        if (peer) {
            peer.onicecandidate = (iceEvent: RTCPeerConnectionIceEvent) => {
                console.log('ICE Candidate generated', iceEvent);
                this.ws.sendMessage({
                    type: 'ice-candidate',
                    to: [receiverId],
                    message: iceEvent.candidate
                });
            };

            peer.ondatachannel = (event: RTCDataChannelEvent) => {
                console.log('Data channel opened', event);
                const { channel } = event;
                channel.binaryType = 'arraybuffer';

                // TODO: deprecate this
                this.newDataChannelSubject.next({
                    dataChannel: channel,
                    userId: receiverId
                });
            };

            // for video calls
            // peer.ontrack = (event: RTCTrackEvent) => {
            //     console.log('NEW TRACK', event);
            //     this.newTrackSubject.next({
            //         streams: event.streams,
            //         userId: receiverId
            //     });
            //     const video: any = document.getElementById('video');
            //     video.srcObject = event.streams[0];
            // };
        }
    }
}


// userId is an id of remote user
interface PeerConnectionDictionary {
    [userId: string]: RTCPeerConnection // can be used both for video and files
}

export interface DataChannelInfo {
    userId: string;
    dataChannel: RTCDataChannel;
}

// for video calls
// export interface NewTrackInfo {
//     streams: readonly MediaStream[];
//     userId: string;
// }

export interface WebRTCTransferState {
    userId: string;
    progress?: number;
    file?: Blob; // for receiving only
}
