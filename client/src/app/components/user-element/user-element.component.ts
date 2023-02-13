import {Component, EventEmitter, Input, Output} from '@angular/core';
import {User, UserId} from "../../services/current-user.service";
import {UntypedFormControl} from "@angular/forms";
import {TransferState} from "../../services/file-transfer.service";

@Component({
    selector: 'app-user-element',
    templateUrl: './user-element.component.html',
    styleUrls: ['./user-element.component.scss'],
})
export class UserElementComponent {
    @Input() user: User;
    @Input() transferState?: TransferState;
    @Input() chatUnreadCount?: number = 0;

    @Output() filesSelected = new EventEmitter<FilesSelectedEvent>();
    @Output() confirm = new EventEmitter<UserId>();
    @Output() cancel = new EventEmitter<UserId>();
    @Output() openChat = new EventEmitter<UserId>();

    public filesInput = new UntypedFormControl(null);

    constructor() {
    }

    public handleFilesSelect(e: Event): void {
        const files = (e.target as HTMLInputElement).files;
        if (files) {
            this.filesSelected.emit({
                userId: this.user.id,
                files
            });
        }
    }

}

export interface FilesSelectedEvent {
    userId: UserId;
    files: FileList
}
