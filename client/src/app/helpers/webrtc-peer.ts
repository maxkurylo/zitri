
export default class WebRTCPeer {
    private readonly STUN_SERVER: string;
    private readonly TURN_SERVER?: string;
    private readonly TURN_USERNAME?: string;
    private readonly TURN_PASSWORD?: string;
    private readonly CHUNK_RECEIVED_MESSAGE = 'CHUNK_RECEIVED';
    private readonly END_OF_FILE_MESSAGE = 'EOF';
    private readonly CHUNK_SIZE = 65536; // 64kB

    private readonly peerConnection: RTCPeerConnection;

    private aborted: boolean = false;

    public onNegotiationNeeded?: () => void;
    public onICECandidate?: (ev: RTCIceCandidate) => void;
    public onError?: (ev: Event) => void;
    public onProgress?: (event: FileTransferProgress) => void;
    public onFile?: (blob: Blob, fileInfo: FileInfo) => void;

    constructor(webRTCInfo: WebRTCInfo) {
        this.STUN_SERVER = webRTCInfo.stunServer;
        this.TURN_SERVER = webRTCInfo.turnServer;
        this.TURN_USERNAME = webRTCInfo.turnUsername;
        this.TURN_PASSWORD = webRTCInfo.turnPassword;

        this.peerConnection = this.createPeerConnection();
    }

    public async generateSDPOffer(): Promise<RTCSessionDescription> {
        const offer = await this.peerConnection.createOffer();
        await this.peerConnection.setLocalDescription(offer);
        return this.peerConnection.localDescription!;
    }

    public async generateSDPAnswer(): Promise<RTCSessionDescription> {
        const answer = await this.peerConnection.createAnswer();
        await this.peerConnection.setLocalDescription(answer);
        return this.peerConnection.localDescription!;
    }

    public setRemoteSDP(sdp: RTCSessionDescription): Promise<void> {
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


    public sendFile(file: File, dataChannel: RTCDataChannel): void {
        const fileInfo: FileInfo = {
            name: file.name,
            size: file.size,
        };

        const progressCallback = (transmittedBytes: number) => {
            this.emitProgress(fileInfo, transmittedBytes);
        }

       (file as Blob).arrayBuffer()
            .then((arrayBuffer) => {
                // this.transmitFileInfo(dataChannel, fileInfo);
                this.transmitData(dataChannel, arrayBuffer, progressCallback);
            });
    }


    private createPeerConnection(): RTCPeerConnection {
        const iceServers: RTCIceServer[] = [{ urls: this.STUN_SERVER }];
        if (this.TURN_SERVER) {
            iceServers.push({
                urls: this.TURN_SERVER,
                username: this.TURN_USERNAME,
                credential: this.TURN_PASSWORD
            });
        }
        const config: RTCConfiguration = { iceServers };
        const peerConnection = new RTCPeerConnection(config);

        peerConnection.onicecandidate = (iceEvent: RTCPeerConnectionIceEvent) => {
            if (this.onICECandidate && iceEvent.candidate) {
                this.onICECandidate(iceEvent.candidate);
            }
        };

        peerConnection.ondatachannel = (event: RTCDataChannelEvent) => {
            // receiver got a dataChannel
            const { channel } = event;
            channel.binaryType = 'arraybuffer';

            this.receiveData(channel);
        };

        peerConnection.onnegotiationneeded = (e: Event) => {
            if (this.onNegotiationNeeded) {
                this.onNegotiationNeeded();
            }
        };

        return peerConnection;
    }


    public createDataChannel(fileInfo: FileInfo): Promise<RTCDataChannel> {
        return new Promise(resolve => {
            const options: RTCDataChannelInit = { ordered: true };
            const channelName = JSON.stringify(fileInfo);
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

        const fileInfo: FileInfo = JSON.parse(dataChannel.label);

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
            if (message.data === this.END_OF_FILE_MESSAGE) {
                this.emitFileReceived(receivedBuffers, fileInfo);
                return cleanUp();
            }
            if (message.data instanceof ArrayBuffer) {
                receivedBuffers.push(message.data);
                receivedBytes += message.data.byteLength;
                this.emitProgress(fileInfo, receivedBytes);
                dataChannel.send(this.CHUNK_RECEIVED_MESSAGE);
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

export interface WebRTCInfo {
    stunServer: string;
    turnServer?: string;
    turnUsername?: string;
    turnPassword?: string;
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
