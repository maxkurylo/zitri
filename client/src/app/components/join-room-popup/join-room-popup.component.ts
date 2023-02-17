import { Component, OnInit } from '@angular/core';
import { UntypedFormControl, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { takeUntil } from 'rxjs/operators';
import copyToClipboard from 'src/app/helpers/copy-to-clipboard';
import humanReadableString from 'src/app/helpers/human-readable-random-string';
import { DestroyService } from 'src/app/services/destroy.service';
import { PopupService } from 'src/app/services/popup.service';
import { RoomService } from 'src/app/services/room.service';

@Component({
    selector: 'app-join-room-popup',
    templateUrl: './join-room-popup.component.html',
    styleUrls: ['./join-room-popup.component.scss'],
    providers: [DestroyService],
})
export class JoinRoomPopupComponent implements OnInit {
    public readonly baseDomain: string = window.location.host + '/';

    public roomIdControl = new UntypedFormControl(humanReadableString(8), [
        Validators.required,
    ]);

    constructor(
        private destroyed$: DestroyService,
        private popupService: PopupService,
        private router: Router,
        private rs: RoomService
    ) {}

    ngOnInit(): void {
        this.roomIdControl.valueChanges
            .pipe(takeUntil(this.destroyed$))
            .subscribe((val) => {
                const validationRegExp = /\W/g;
                if (val.match(validationRegExp)) {
                    const validatedInput = val.replace(validationRegExp, '');
                    this.roomIdControl.patchValue(validatedInput);
                }
            });
    }

    public closePopup(): void {
        this.popupService.close();
    }

    public createNewRoom(): void {
        let roomId = this.roomIdControl.value;
        if (!roomId) {
            roomId = humanReadableString(8);
        }
        this.router.navigateByUrl('/' + roomId);
        this.rs.changeRoom(roomId);
        this.popupService.close();
    }

    public copyRoomLink(): void {
        copyToClipboard(window.origin + '/' + this.roomIdControl.value);
    }
}
