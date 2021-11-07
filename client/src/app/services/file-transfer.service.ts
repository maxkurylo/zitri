import { Injectable } from '@angular/core';
import {WebsocketsService} from "./websockets.service";
import {WebRTCService} from "./webrtc.service";
import {Subject} from "rxjs";
import * as JSZip from "jszip";
import { throttle } from 'lodash';

const MAXIMUM_MESSAGE_SIZE = 26214;
const END_OF_FILE_MESSAGE = 'EOF';


// How it works
// 1) User sends offer to another to transfer files
// 2) When file accepted, user can create PeerConnection and start file transfer
// 3) When file declined files do not transfer

@Injectable({
    providedIn: 'root'
})
export class FileTransferService {
    private fileTransferStateUpdateSubject = new Subject<FileTransferState>();
    fileTransferStateUpdate = this.fileTransferStateUpdateSubject.asObservable();

    constructor(private ws: WebsocketsService, private webRTCService: WebRTCService) {
    }

    listenEvents() {
        this.ws.setUpSocketEvent('file-transfer-offer', (e) => {
            this.fileTransferStateUpdateSubject.next({
                userId: e.from,
                type: e.message.type,
                fileName: e.message.fileName,
                progress: e.message.progress
            });
        });

        // File transfer started when data channel is opened
        this.webRTCService.newDataChannel.subscribe(({dataChannel, userId}) => {
            this.receiveFile(dataChannel);
        });
    }


    offerToSendFile(file: File, userId: string) {
        const { name, size, type } = file;
        this.ws.sendMessage('file-transfer-offer', {
            to: userId,
            message: {
                type: FileTransferStateType.OFFER,
                fileName: name,
                fileSize: size,
                fileType: type,
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
                const arrayBuffer = await (file as any).arrayBuffer();
                let progress = 0;
                for (let i = 0; i < arrayBuffer.byteLength; i += MAXIMUM_MESSAGE_SIZE) {
                    dataChannel.send(arrayBuffer.slice(i, i + MAXIMUM_MESSAGE_SIZE));

                    progress = i / arrayBuffer.byteLength;
                    this.throttleSendProgress(userId, file, progress);
                }
                dataChannel.send(END_OF_FILE_MESSAGE);
            };

            dataChannel.onerror = (e) => {
                console.log(e);
            };

            dataChannel.onclose = () => {
                console.log("IT's done!");
            };

            dataChannel.onbufferedamountlow = (e) => {
                console.log('onbufferedamountlow', e);
            };
        }
    }

    acceptFileSend(userId: string) {
        this.webRTCService.createPeerConnection(userId);

        this.ws.sendMessage('file-transfer-offer', {
            to: userId,
            message: { type: FileTransferStateType.ACCEPT }
        });
    }

    declineFileSend(userId: string) {
        this.ws.sendMessage('file-transfer-offer', {
            to: userId,
            message: { type: FileTransferStateType.DECLINED }
        });
    }

    async zipFiles(files: FileList, archiveName: string, userId: string): Promise<File> {
        const zip = new JSZip();

        Array.prototype.forEach.call(files, (file) => {
            zip.file(file.name, file);
        });

        const blob = await zip.generateAsync(
            { type: 'blob', streamFiles: true },
            throttle((metadata) => {
                this.fileTransferStateUpdateSubject.next({
                    userId: userId,
                    type: FileTransferStateType.ZIPPING,
                    progress: metadata.percent
                });
            }, 50),
        );

        return new File(
            [blob],
            `${archiveName}.zip`,
            {
                type: 'application/zip',
            },
        );
    }

    private receiveFile(dataChannel: RTCDataChannel) {
        const receivedBuffers: any[] = [];

        dataChannel.onmessage = async (event) => {
            const { data } = event;
            console.log('DATA', data);
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
                    console.log('CLOSE DATA CHANNEL!!!');
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

    private throttleSendProgress = throttle((userId: string, file: File, progress: number) => {
        this.fileTransferStateUpdateSubject.next({
            userId,
            type: FileTransferStateType.IN_PROGRESS,
            fileName: file.name,
            progress: progress
        });
        this.ws.sendMessage('file-transfer-offer', {
            to: userId,
            message: {
                type: FileTransferStateType.IN_PROGRESS,
                fileName: file.name,
                fileSize: file.size,
                fileType: file.type,
                progress
            }
        });
    }, 10);
}


export enum FileTransferStateType {
    'ZIPPING',
    'OFFER',               // offer to transfer file
    'WAITING_FOR_APPROVE',
    'IN_PROGRESS',         // file is transferring
    'DECLINED',
    'ERROR',
    'FINISHED',
    'ACCEPT',              // user clicked accept button (only as indicator from remote user)
}

export interface FileTransferState {
    userId: string;
    type: FileTransferStateType;
    fileName?: string;
    fileSize?: string;
    fileType?: string;
    progress?: number;
    error?: any;
    zipped?: boolean; // indicated if file was zipped before transfer
}
