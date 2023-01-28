
export default class WebRTCPeer {
    private readonly STUN_SERVER_URL = 'stun:stun.l.google.com:19302';
    private readonly CHUNK_RECEIVED_MESSAGE = 'CHUNK_RECEIVED';
    private readonly FILE_INFO_MESSAGE = 'FILE_INFO';
    private readonly END_OF_FILE_MESSAGE = 'EOF';
    private readonly CHUNK_SIZE = 65536; // 64kB

    private readonly peerConnection: RTCPeerConnection;

    private aborted: boolean = false;

    public onICECandidate?: (ev: RTCIceCandidate) => void;
    public onError?: (ev: Event) => void;
    public onProgress?: (event: FileTransferProgress) => void;
    public onFile?: (blob: Blob, fileInfo: FileInfo) => void;

    constructor() {
        this.peerConnection = this.createPeerConnection();
    }

    public async generateSDPOffer(): Promise<RTCSessionDescriptionInit> {
        const offer = await this.peerConnection.createOffer();
        this.peerConnection.setLocalDescription(offer);
        return offer;
    }

    public async generateSDPAnswer(): Promise<RTCSessionDescriptionInit> {
        const answer = await this.peerConnection.createAnswer();
        this.peerConnection.setLocalDescription(answer);
        return answer;
    }

    public setRemoteSDP(sdp: RTCSessionDescriptionInit): Promise<void> {
        return this.peerConnection.setRemoteDescription(sdp);
    }

    public setRemoteICECandidate(candidate: RTCIceCandidate): void {
        this.peerConnection.addIceCandidate(candidate);
    }

    /**
     * Stop ongoing file transmission.
     * It does not close neither data channel nor peer connection
     */
    public abortDataTransmission() {
        this.aborted = true;
    }

    public destroy() {
        this.peerConnection.close();
    }


    public sendFile(file: File): void {
        const fileInfo: FileInfo = {
            name: file.name,
            size: file.size,
        };

        const progressCallback = (transmittedBytes: number) => {
            this.emitProgress(fileInfo, transmittedBytes);
        }

        Promise.all([this.createDataChannel(file.name), (file as Blob).arrayBuffer()])
            .then(([dataChannel, arrayBuffer]) => {
                this.transmitFileInfo(dataChannel, fileInfo);
                this.transmitData(dataChannel, arrayBuffer, progressCallback);
            });
    }


    private createPeerConnection(): RTCPeerConnection {
        const config: RTCConfiguration = {
            iceServers: [{ urls: this.STUN_SERVER_URL }],
        };
        const peerConnection = new RTCPeerConnection(config);

        peerConnection.onicecandidate = (iceEvent: RTCPeerConnectionIceEvent) => {
            if (this.onICECandidate && iceEvent.candidate) {
                this.onICECandidate(iceEvent.candidate);
            }
        };

        this.peerConnection.ondatachannel = (event: RTCDataChannelEvent) => {
            // receiver got a dataChannel
            const { channel } = event;
            channel.binaryType = 'arraybuffer';

            this.receiveData(channel);
        };

        return peerConnection;
    }


    private createDataChannel(channelName: string): Promise<RTCDataChannel> {
        return new Promise(resolve => {
            const options: RTCDataChannelInit = { ordered: true };
            const dataChannel = this.peerConnection.createDataChannel(channelName, options);
            dataChannel.binaryType = 'arraybuffer';

            dataChannel.onerror = (error: Event) => {
                this.emitError(error);
            }

            dataChannel.onopen = () => {
                resolve(dataChannel);
            }
        });
    }


    private transmitFileInfo(dataChannel: RTCDataChannel, fileInfo: FileInfo): void {
        const message = {
            type: this.FILE_INFO_MESSAGE,
            fileInfo,
        };
        dataChannel.send(JSON.stringify(message));
    }


    private transmitData(dataChannel: RTCDataChannel, arrayBuffer: ArrayBuffer, progress: (transmittedBytes: number) => void): void {
        let transmittedBytes = 0;

        dataChannel.onmessage = (message: MessageEvent) => {
            if (message.data === this.CHUNK_RECEIVED_MESSAGE) {
                // previous chunk was successfully delivered, so we can emit progress about it
                progress(transmittedBytes);
                if (this.aborted) {
                    return dataChannel.close();
                }
                if (transmittedBytes < arrayBuffer.byteLength) {
                    transmittedBytes += this.sendChunk(dataChannel, arrayBuffer, transmittedBytes);
                } else {
                    // file ended or transmission was cancelled
                    dataChannel.send(this.END_OF_FILE_MESSAGE);
                    dataChannel.onmessage = null;
                }
            }
        }

        transmittedBytes += this.sendChunk(dataChannel, arrayBuffer, transmittedBytes);
    }


    private receiveData(dataChannel: RTCDataChannel): void {
        let receivedBuffers: ArrayBuffer[] = [];
        let receivedBytes = 0;

        let fileInfo: FileInfo = {
            name: dataChannel.label,
            size: 0,
        };

        function cleanUp() {
            receivedBuffers = [];
            receivedBytes = 0;
            dataChannel.onmessage = null;
            dataChannel.close();
        }

        dataChannel.onmessage = (message: MessageEvent) => {
            if (this.aborted) {
                return cleanUp();
            }
            if (message.data instanceof ArrayBuffer) {
                receivedBuffers.push(message.data);
                receivedBytes += message.data.byteLength;
                this.emitProgress(fileInfo, receivedBytes);
                if (receivedBytes === fileInfo.size) {
                    this.emitFileReceived(receivedBuffers, fileInfo);
                    cleanUp();
                }
            } else if (typeof message.data === 'string') {
                if (message.data.includes(this.FILE_INFO_MESSAGE)) {
                    const objectData = JSON.parse(message.data);
                    fileInfo = objectData.fileInfo;
                }
            }
        }
    }


    private sendChunk(dataChannel: RTCDataChannel, arrayBuffer: ArrayBuffer, transmittedBytes: number): number {
        const chunk = arrayBuffer.slice(transmittedBytes, transmittedBytes + this.CHUNK_SIZE);
        dataChannel.send(chunk);
        return chunk.byteLength;
    }


    private emitFileReceived(receivedBuffers: ArrayBuffer[], fileInfo: FileInfo): void {
        if (this.onFile) {
            const blob = new Blob(receivedBuffers);
            this.onFile(blob, fileInfo);
        }
    }


    private emitProgress(fileInfo: FileInfo, bytes: number): void {
        if (this.onProgress) {
            const percent = fileInfo.size ? bytes / fileInfo.size * 100 : 0;
            this.onProgress({
                percent,
                fileName: fileInfo.name,
                fileSize: fileInfo.size
            });
        }
    }

    private emitError(error: Event): void {
        if (this.onError) {
            this.onError(error);
        }
    }
}

export interface FileInfo {
    name: string;
    size: number;
}

export interface FileTransferProgress {
    percent: number;
    fileName: string;
    fileSize: number;
}
