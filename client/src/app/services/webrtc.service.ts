import { Injectable } from '@angular/core';
import { environment } from "../../environments/environment";
import {WebsocketsService} from "./websockets.service";

const MAXIMUM_MESSAGE_SIZE = 65535;
const END_OF_FILE_MESSAGE = 'EOF';


@Injectable({
  providedIn: 'root'
})
export class WebRTCService {

    constructor(private ws: WebsocketsService) {

    }

    private setupPeerConnectionEvents(peerConnection: RTCPeerConnection, userId: string) {
        // TODO: change to addEventListener
        peerConnection.onicecandidate = (iceEvent) => {
            console.log('ICE Candidate generated', iceEvent);
            this.ws.sendMessage('ice-candidate', { to: userId, message: iceEvent.candidate });
        };

        peerConnection.ondatachannel = (event) => {
            console.log('On datachannel', event);
            const { channel } = event;
            channel.binaryType = 'arraybuffer';

            const receivedBuffers: any[] = [];
            channel.onmessage = async (event) => {
                const { data } = event;
                try {
                    if (data !== END_OF_FILE_MESSAGE) {
                        receivedBuffers.push(data);
                    } else {
                        const arrayBuffer = receivedBuffers.reduce((acc, arrayBuffer) => {
                            const tmp = new Uint8Array(acc.byteLength + arrayBuffer.byteLength);
                            tmp.set(new Uint8Array(acc), 0);
                            tmp.set(new Uint8Array(arrayBuffer), acc.byteLength);
                            return tmp;
                        }, new Uint8Array());
                        const blob = new Blob([arrayBuffer]);
                        this.downloadFile(blob, channel.label);
                        channel.close();
                    }
                } catch (err) {
                    console.log('File transfer failed');
                }
            };
        };

        // peerConnection.ontrack = (event) => {
        //     console.log('NEW TRACK', event);
        //     const video: any = document.getElementById('video');
        //     video.srcObject = event.streams[0];
        // };
    }


    private setupSocketEvents(peerConnection: RTCPeerConnection) {
        const onIceCandidate = (event: any) => {
            console.log('CANDIDATE RECEIVED', event);
            peerConnection.addIceCandidate(event.message)
                .then()
                .catch(console.error)
        };

        const onSdpOffer = (event: any) => {
            console.log('sdp-offer', event);
            peerConnection.setRemoteDescription(event.message)
                .then(() => peerConnection.createAnswer())
                .then(answer => {
                    peerConnection.setLocalDescription(answer)
                        .then(() => {
                            this.ws.sendMessage('sdp-answer', { to: event.from, message: answer });
                        })
                        .catch(console.error)
                })
                .catch(console.error)
        };

        const onSdpAnswer = (event: any) => {
            console.log('sdp-answer', event);
            peerConnection.setRemoteDescription(event.message)
                .then(console.log)
                .catch(console.error)
        };

        this.ws.setUpSocketEvent('ice-candidate', onIceCandidate);
        this.ws.setUpSocketEvent('sdp-offer', onSdpOffer);
        this.ws.setUpSocketEvent('sdp-answer', onSdpAnswer);

        return { onIceCandidate, onSdpOffer, onSdpAnswer };
    }


    private removeSocketEvents(eventsToRemove: any) {
        this.ws.removeSocketEvent('ice-candidate', eventsToRemove.onIceCandidate);
        this.ws.removeSocketEvent('sdp-offer', eventsToRemove.onSdpOffer);
        this.ws.removeSocketEvent('sdp-answer', eventsToRemove.onSdpAnswer);
    }


    /**
     *
     * @param userId - receiver of local SDP offer
     */
    private generateLocalSDPOffer(peerConnection: RTCPeerConnection, userId: string) {
        peerConnection.createOffer()
            .then((offer: RTCSessionDescriptionInit) => {
                peerConnection.setLocalDescription(offer).catch(console.error);
                this.ws.sendMessage('sdp-offer', {
                    to: userId,
                    message: offer
                })
            });
    }

    private downloadFile(blob: Blob, fileName: string) {
        const a = document.createElement('a');
        const url = window.URL.createObjectURL(blob);
        a.href = url;
        a.download = fileName;
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove()
    };


    shareFile = async (file: File, userId: string) => {
        const peerConnection = new RTCPeerConnection({
            iceServers: [{ urls: environment.stunServer }],
        });

        this.setupPeerConnectionEvents(peerConnection, userId);
        // ok, this trick is rubbish but it works
        const eventsToRemove = this.setupSocketEvents(peerConnection);

        // const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        // stream.getVideoTracks().forEach(track => peerConnection.addTrack(track, stream));

        const channelLabel = userId + '-' + file.name;
        const channel = peerConnection.createDataChannel(channelLabel);
        channel.binaryType = 'arraybuffer';

        channel.onopen = async () => {
            console.log('DATA CHANNEL OPENED!!');
            const arrayBuffer = await (file as any).arrayBuffer();
            for (let i = 0; i < arrayBuffer.byteLength; i += MAXIMUM_MESSAGE_SIZE) {
                channel.send(arrayBuffer.slice(i, i + MAXIMUM_MESSAGE_SIZE));
            }
            channel.send(END_OF_FILE_MESSAGE);
        };

        channel.onclose = () => {
            console.log("IT's done!");
            peerConnection.close();
            this.removeSocketEvents(eventsToRemove);
        };

        this.generateLocalSDPOffer(peerConnection, userId);
    };
}