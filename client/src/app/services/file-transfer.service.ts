import { Injectable } from '@angular/core';
import {WebsocketsService} from "./websockets.service";
import {WebRTCService} from "./webrtc.service";
import {Subject} from "rxjs";

const MAXIMUM_MESSAGE_SIZE = 65535;
const END_OF_FILE_MESSAGE = 'EOF';

@Injectable({
    providedIn: 'root'
})
export class FileTransferService {
    private fileTransferOfferSubject = new Subject<any>();
    private fileTransferAcceptSubject = new Subject<any>();
    private fileTransferDeclineSubject = new Subject<any>();
    private fileTransferProgressSubject = new Subject<any>();

    fileTransferOffer = this.fileTransferOfferSubject.asObservable();
    fileTransferAccept = this.fileTransferAcceptSubject.asObservable();
    fileTransferDecline = this.fileTransferDeclineSubject.asObservable();
    fileTransferProgress = this.fileTransferProgressSubject.asObservable();

    constructor(private ws: WebsocketsService, private webRTCService: WebRTCService) {
        this.ws.setUpSocketEvent('file-transfer-offer', (e) => {
            console.log(e);
            if (e.message.type === FileTransferOfferType.OFFER) {
                // accept or decline
            }
            if (e.message.type === FileTransferOfferType.ACCEPT) {
                // share file
            }
            if (e.message.type === FileTransferOfferType.DECLINE) {
                // show message
            }
        });

        this.webRTCService.newDataChannel.subscribe(({dataChannel, userId}) => {
            this.recieveFile(dataChannel, userId);
        });
    }


    offerToSendFile(file: File, userId: string) {
        const { name, lastModified, size, type } = file;
        this.ws.sendMessage('file-transfer-offer', {
            to: userId,
            message: {
                type: FileTransferOfferType.OFFER,
                fileInfo: { name, lastModified, size, type }
            }
        });
    }


    sendFile(file: File, userId: string) {
        // send an invitation first before all that exchange
        this.webRTCService.createPeerConnection(userId);
        const dataChannel = this.webRTCService.createDataChannel(userId, file.name);

        // const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        // stream.getVideoTracks().forEach(track => peerConnection.addTrack(track, stream));

        if (dataChannel) {
            dataChannel.onopen = async () => {
                console.log('DATA CHANNEL OPENED!!');
                const arrayBuffer = await (file as any).arrayBuffer();
                for (let i = 0; i < arrayBuffer.byteLength; i += MAXIMUM_MESSAGE_SIZE) {
                    dataChannel.send(arrayBuffer.slice(i, i + MAXIMUM_MESSAGE_SIZE));
                }
                dataChannel.send(END_OF_FILE_MESSAGE);
            };

            dataChannel.onclose = () => {
                console.log("IT's done!");
            };
        }
    }

    acceptFileSend(userId: string) {
        this.webRTCService.createPeerConnection(userId);

        this.ws.sendMessage('file-transfer-offer', {
            to: userId,
            message: { type: FileTransferOfferType.ACCEPT }
        });
    }

    declineFileSend(userId: string) {
        this.ws.sendMessage('file-transfer-offer', {
            to: userId,
            message: { type: FileTransferOfferType.DECLINE }
        });
    }


    private recieveFile(dataChannel: RTCDataChannel, userId: string) {
        const receivedBuffers: any[] = [];

        dataChannel.onmessage = async (event) => {
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
                    this.downloadFile(blob, dataChannel.label);
                    dataChannel.close();
                }
            } catch (err) {
                console.log('File transfer failed');
            }
        };
    }


    /**
     *
     * @param userId - receiver of local SDP offer
     */

    private downloadFile(blob: Blob, fileName: string) {
        const a = document.createElement('a');
        const url = window.URL.createObjectURL(blob);
        a.href = url;
        a.download = fileName;
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove()
    };
}


export enum FileTransferOfferType {
    'OFFER',
    'ACCEPT',
    'DECLINE'
}
