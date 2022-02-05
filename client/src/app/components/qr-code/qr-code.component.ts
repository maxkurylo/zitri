import {Component, Input, OnInit} from '@angular/core';
import QRCodeStyling from "qr-code-styling";

@Component({
  selector: 'app-qr-code',
  templateUrl: './qr-code.component.html',
  styleUrls: ['./qr-code.component.scss']
})
export class QrCodeComponent implements OnInit {
    @Input() size: number = 150;
    @Input() url: string = '';

    qrOptions: any = {
        "margin": 0,
        "qrOptions": { "typeNumber": "0", "mode": "Byte", "errorCorrectionLevel": "H" },
        "imageOptions": { "hideBackgroundDots": true, "imageSize": .5, "margin": 0 },
        "dotsOptions": {
          "type": "extra-rounded",
          "gradient": {
            "type": "linear",
            "rotation": 1,
            "colorStops": [
              { "offset": 0, "color": "#f3295f" },
              { "offset": 0.5, "color": "#ef3c54" },
              { "offset": 1, "color": "#F37640" },
            ]
          }
        },
        "backgroundOptions":{"color":"transparent"},
        "image": "/assets/favicon_inkscape.svg",
        "dotsOptionsHelper": { "colorType": { "single": true, "gradient": false }, "gradient": { "linear": true, "radial": false, "color1": "#6a1a4c", "color2": "#6a1a4c", "rotation": "0" } },
        "cornersSquareOptions": { "type": "extra-rounded", "color": "#f3295f", "gradient": null },
        "cornersSquareOptionsHelper": { "colorType": { "single": true, "gradient": false }, "gradient": { "linear": true, "radial": false, "color1": "#000000", "color2": "#000000", "rotation": "0" } },
        "cornersDotOptions": { "type": "", "color": "#f3295f" },
    };

    constructor() {
    }

    ngOnInit(): void {
        this.qrOptions.width = this.size;
        this.qrOptions.height = this.size;
        const qrCode = new QRCodeStyling(this.qrOptions);
        qrCode.update({ data: this.url });
        qrCode.append(document.getElementById('qr-code-canvas') as HTMLElement);

    }

}
