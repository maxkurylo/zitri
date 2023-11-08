import { Component, Input, OnChanges } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import * as QRCode from 'qrcode-svg';

const qrConfig: QRCode.Options = {
    background: 'transparent',
    color: 'inherit',
    padding: 0,
    content: '',
    join: true,
    xmlDeclaration: false,
    container: 'svg-viewbox',
    ecl: 'L',
};

@Component({
    selector: 'app-qr-code',
    templateUrl: './qr-code.component.html',
    styleUrls: ['./qr-code.component.scss'],
})
export class QrCodeComponent implements OnChanges {
    @Input() text: string = '';

    public qrCodeSvg: SafeHtml;

    constructor(private sanitizer: DomSanitizer) {}

    ngOnChanges() {
        this.qrCodeSvg = this.addQRToCanvas(this.text);
    }

    private addQRToCanvas(content: string): SafeHtml {
        const qrCode = new QRCode({ ...qrConfig, content });
        return this.sanitizer.bypassSecurityTrustHtml(qrCode.svg());
    }
}
