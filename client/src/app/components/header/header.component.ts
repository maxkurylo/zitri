import {Component, OnDestroy, OnInit, TemplateRef, ViewChild} from '@angular/core';
import {CurrentUserService} from "../../services/current-user.service";
import {MatDialog} from "@angular/material/dialog";
import {UntypedFormControl, Validators} from "@angular/forms";
import {Subject} from "rxjs";
import {takeUntil} from "rxjs/operators";
import {Router} from "@angular/router";
import copyToClipboard from '../../helpers/copy-to-clipboard';
import {RoomService} from "../../services/room.service";
import humanReadableString from "../../helpers/human-readable-random-string";


@Component({
    selector: 'app-header',
    templateUrl: './header.component.html',
    styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit, OnDestroy {
    @ViewChild('helpDialog') helpDialogTemplate: TemplateRef<any>;
    @ViewChild('newRoomDialog') newRoomDialogTemplate: TemplateRef<any>;

    public readonly baseDomain = window.location.host + '/';

    public roomIdControl = new UntypedFormControl('', [Validators.required]);

    private destroyed$ = new Subject<void>();

    constructor(public cu: CurrentUserService, private dialog: MatDialog, private router: Router,
                private rs: RoomService) { }

    ngOnInit(): void {
        this.roomIdControl.valueChanges.pipe(takeUntil(this.destroyed$)).subscribe((val) => {
            const validationRegExp = /\W/g;
            if (val.match(validationRegExp)) {
                const validatedInput = val.replace(validationRegExp, '');
                this.roomIdControl.patchValue(validatedInput);
            }
        })
    }

    public openHelpDialog(): void {
        this.dialog.open(this.helpDialogTemplate)
    }

    public openNewRoomDialog(): void {
        this.roomIdControl.patchValue(humanReadableString(8));
        this.dialog.open(this.newRoomDialogTemplate)
    }

    public closeDialog(): void {
        this.dialog.closeAll();
    }

    public createNewRoom(): void {
        let roomId = this.roomIdControl.value;
        if (!roomId) {
            roomId = humanReadableString(8);
        }
        this.router.navigateByUrl('/' + roomId);
        this.rs.changeRoom(roomId);
        this.dialog.closeAll();
    }

    public copyRoomLink(): void {
        copyToClipboard(window.origin + '/' + this.roomIdControl.value);
    }

    ngOnDestroy(): void {
        this.destroyed$.next();
        this.destroyed$.complete();
    }

}
