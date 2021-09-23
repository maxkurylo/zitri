import {Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges} from '@angular/core';
import {User} from "../../services/current-user.service";
import * as JSZip from "jszip";
import {ChatService} from "../../services/chat.service";
import {ReplaySubject} from "rxjs";
import {takeUntil} from "rxjs/operators";
import {WebRTCService} from "../../services/webrtc.service";

@Component({
    selector: 'app-user-element',
    templateUrl: './user-element.component.html',
    styleUrls: ['./user-element.component.scss']
})
export class UserElementComponent implements OnInit, OnChanges, OnDestroy {
    @Input() user: User;
    @Input() selectedChatId: string | null = null;
    @Output() selectedChatIdChange = new EventEmitter<string | null>();

    zippingProgress: number = 0;
    chatNotification = 0;

    private destroyed$: ReplaySubject<boolean> = new ReplaySubject(1);

    constructor(public cs: ChatService, private webRtcService: WebRTCService) { }

    ngOnInit(): void {
        this.cs.newMessage.pipe(takeUntil(this.destroyed$)).subscribe(() => {
            if (!this.selectedChatId || this.selectedChatId !== this.user.id) {
                this.chatNotification += 1;
            }
        });
    }

    ngOnChanges(changes: SimpleChanges): void {
        // if current user has opened a chat with this user, clear notifications
        if (changes.selectedChatId && changes.selectedChatId.currentValue === this.user.id) {
            this.chatNotification = 0;
        }
    }

    handleFilesSelect(e: Event) {
        const files = (e.target as HTMLInputElement).files;
        if (files) {
            this.webRtcService.shareFile((files[0]), this.user.id);
        }
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

    ngOnDestroy(): void {
        this.destroyed$.next(true);
        this.destroyed$.complete();
    }

}
