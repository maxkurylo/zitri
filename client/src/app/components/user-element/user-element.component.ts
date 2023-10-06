import {
    Component,
    EventEmitter,
    Input,
    Output,
    ViewChild,
} from '@angular/core';
import { User, UserId } from '../../services/current-user.service';
import { UntypedFormControl } from '@angular/forms';
import { TransferState } from '../../services/file-transfer.service';
import { MatMenuTrigger } from '@angular/material/menu';

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

    @ViewChild(MatMenuTrigger) trigger: MatMenuTrigger;

    public filesInput = new UntypedFormControl(null);
    public isActive: boolean = false;

    constructor() {}

    ngOnChanges() {
        this.isActive = !!this.transferState;
    }

    public handleFilesSelect(e: Event): void {
        const files = (e.target as HTMLInputElement).files;
        if (files) {
            this.filesSelected.emit({
                userId: this.user.id,
                files,
            });
        }
    }

    public openMenu(e: MouseEvent | KeyboardEvent) {
        if (!this.isActive) {
            if (e instanceof KeyboardEvent) {
                if (e.code === 'Space' || e.code === 'Enter') {
                    this.trigger.openMenu();
                }
            } else {
                this.trigger.openMenu();
            }
        }
    }
}

export interface FilesSelectedEvent {
    userId: UserId;
    files: FileList;
}
