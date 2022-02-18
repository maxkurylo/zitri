import {Component, Input, OnChanges, OnInit} from '@angular/core';
import QRCodeStyling from "qr-code-styling";

const qrConfig: any = {
    margin: 0,
    qrOptions: {
        typeNumber: '0',
        mode: 'Byte',
        errorCorrectionLevel: 'H'
    },
    imageOptions: {
        hideBackgroundDots: true,
        imageSize: 0.5,
        margin: 0
    },
    dotsOptions: {
        type: 'extra-rounded',
        gradient: {
            type: "linear",
            rotation: 1,
            colorStops: [
                { offset: 0, color: '#f3295f' },
                { offset: 0.5, color: '#ef3c54' },
                { offset: 1, color: '#F37640' },
            ]
        }
    },
    backgroundOptions: { color: 'transparent' },
    image: '/assets/favicon_inkscape.svg',
    dotsOptionsHelper: {
        gradient: { color1: '#6a1a4c', color2: '#6a1a4c' }
    },
    cornersSquareOptions: { type: 'extra-rounded', color: '#f3295f' },
    cornersSquareOptionsHelper: {
        gradient: { color1: '#000000', color2: '#000000' }
    },
    cornersDotOptions: { color: '#f3295f' },
};

@Component({
  selector: 'app-qr-code',
  templateUrl: './qr-code.component.html',
  styleUrls: ['./qr-code.component.scss']
})
export class QrCodeComponent implements OnInit, OnChanges {
    @Input() size: number = 150;
    @Input() text: string = '';

    qrCode: any;

    constructor() {
    }

    ngOnInit(): void {
        qrConfig.width = this.size;
        qrConfig.height = this.size;
        this.qrCode = new QRCodeStyling(qrConfig);
        this.qrCode.update({ data: this.text });
        this.qrCode.append(document.getElementById('qr-code-canvas') as HTMLElement);
    }

    ngOnChanges() {
        this.qrCode?.update({ data: this.text });
    }

}
