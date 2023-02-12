import {Component, EventEmitter, Input, Output} from '@angular/core';
import {User, UserId} from "../../services/current-user.service";
import {UntypedFormControl} from "@angular/forms";
import {TransferInfo} from "../users-list/users-list.component";

@Component({
    selector: 'app-user-element',
    templateUrl: './user-element.component.html',
    styleUrls: ['./user-element.component.scss'],
})
export class UserElementComponent {
    @Input() user: User;
    @Input() transferStatus: TransferInfo | undefined;
    @Input() chatUnreadCount?: number = 0;

    @Output() onFilesSelected = new EventEmitter<FilesSelectedEvent>();
    @Output() onConfirm = new EventEmitter<UserId>();
    @Output() onCancel = new EventEmitter<UserId>();
    @Output() onOpenChat = new EventEmitter<UserId>();

    public filesInput = new UntypedFormControl(null);

    constructor() {}

    public handleFilesSelect(e: Event): void {
        const files = (e.target as HTMLInputElement).files;
        if (files) {
            this.onFilesSelected.emit({
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
