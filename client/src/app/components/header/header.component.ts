import {Component, OnDestroy, OnInit, TemplateRef, ViewChild} from '@angular/core';
import {CurrentUserService} from "../../services/current-user.service";
import {MatDialog} from "@angular/material/dialog";
import {FormControl, Validators} from "@angular/forms";
import {ReplaySubject} from "rxjs";
import {takeUntil} from "rxjs/operators";
import {Router} from "@angular/router";
import {copyToClipboard, generateRandomString} from '../../helpers';
import {RoomService} from "../../services/room.service";


@Component({
    selector: 'app-header',
    templateUrl: './header.component.html',
    styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit, OnDestroy {
    @ViewChild('helpDialog') helpDialogTemplate: TemplateRef<any>;
    @ViewChild('newRoomDialog') newRoomDialogTemplate: TemplateRef<any>;

    private destroyed$: ReplaySubject<boolean> = new ReplaySubject(1);
    readonly baseDomain = window.origin + '/';
    roomIdControl = new FormControl('', [Validators.required]);

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

    openHelpDialog() {
        this.dialog.open(this.helpDialogTemplate)
    }

    openNewRoomDialog() {
        this.roomIdControl.patchValue(generateRandomString(16));
        this.dialog.open(this.newRoomDialogTemplate)
    }

    closeDialog() {
        this.dialog.closeAll();
    }

    createNewRoom() {
        let roomId = this.roomIdControl.value;
        if (!roomId) {
            roomId = generateRandomString(16);
        }
        this.router.navigateByUrl('/room/' + roomId);
        this.rs.changeRoom(roomId);
        this.dialog.closeAll();
    }

    copyRoomLink() {
        copyToClipboard(this.baseDomain +'room/' + this.roomIdControl.value);
    }

    ngOnDestroy(): void {
        this.destroyed$.next(true);
        this.destroyed$.complete();
    }

}
