import { Injectable } from '@angular/core';
import {WebsocketsService} from "./websockets.service";
import {WebRTCService} from "./webrtc.service";
import {Subject} from "rxjs";
import * as JSZip from "jszip";

const MAXIMUM_MESSAGE_SIZE = 65535;
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

    progressDebounceInterval: any;

    constructor(private ws: WebsocketsService, private webRTCService: WebRTCService) {
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
            this.receiveFile(dataChannel, userId);
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
                    this.ws.sendMessage('file-transfer-offer', {
                        to: userId,
                        message: {
                            type: FileTransferStateType.TRANSFERRING,
                            fileName: file.name,
                            fileSize: file.size,
                            fileType: file.type,
                            progress
                        }
                    });
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
            message: { type: FileTransferStateType.ACCEPT }
        });
    }

    declineFileSend(userId: string) {
        this.ws.sendMessage('file-transfer-offer', {
            to: userId,
            message: { type: FileTransferStateType.DECLINE }
        });
    }

    async zipFiles(files: FileList, archiveName: string): Promise<File> {
        const zip = new JSZip();

        Array.prototype.forEach.call(files, (file) => {
            zip.file(file.name, file);
        });

        const blob = await zip.generateAsync(
            { type: 'blob', streamFiles: true },
            (metadata) => {
                // this.zippingProgress = metadata.percent;
            },
        );

        // this.zippingProgress = 0;

        return new File(
            [blob],
            `${archiveName}.zip`,
            {
                type: 'application/zip',
            },
        );
    }

    private receiveFile(dataChannel: RTCDataChannel, userId: string) {
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

    private debounceProgress() {

    }
}


export enum FileTransferStateType {
    'OFFER',           // offer to transfer file
    'TRANSFERRING',    // file is transferring
    'ZIPPING',         // file is zipping
    'ACCEPT',          // user clicked accept button
    'DECLINE',         // user clicked decline button
    'ASK_FOR_CANCEL',  // user clicked cancel when file was transferring or zipping
    'FINISHED',        // file successfully transmitted
    'ERROR'
}

export interface FileTransferState {
    userId: string;
    type: FileTransferStateType;
    fileName: string;
    fileSize?: string;
    fileType?: string;
    progress?: number;
    error?: any;
}
