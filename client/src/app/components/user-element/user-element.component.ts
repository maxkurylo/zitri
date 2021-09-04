import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {User} from "../../services/current-user.service";
import * as JSZip from "jszip";

@Component({
    selector: 'app-user-element',
    templateUrl: './user-element.component.html',
    styleUrls: ['./user-element.component.scss']
})
export class UserElementComponent implements OnInit {
    @Input() user: User;
    @Input() selectedChatId: string | null = null;
    @Output() selectedChatIdChange = new EventEmitter<string | null>();

    zippingProgress: number = 0;

    constructor() { }

    ngOnInit(): void {
    }

    handleFilesSelect(e: Event) {
        const files = (e.target as HTMLInputElement).files;
        if (files && files.length > 1) {
            this.zipFiles(files);
        } else {

        }
    }

    async zipFiles(files: FileList): Promise<File> {
        const zip = new JSZip();

        Array.prototype.forEach.call(files, (file) => {
            zip.file(file.name, file);
        });

        const blob = await zip.generateAsync(
            { type: 'blob', streamFiles: true },
            (metadata) => {
                this.zippingProgress = metadata.percent;
            },
        );

        this.zippingProgress = 0;

        return new File(
            [blob],
            `Files from ${this.user.name}.zip`,
            {
                type: 'application/zip',
            },
        );
    }

}
