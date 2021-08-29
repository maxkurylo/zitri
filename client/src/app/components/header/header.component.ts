import {Component, OnDestroy, OnInit, TemplateRef, ViewChild} from '@angular/core';
import {CurrentUserService} from "../../services/current-user.service";
import {MatDialog} from "@angular/material/dialog";
import {FormControl, Validators} from "@angular/forms";
import {ReplaySubject} from "rxjs";
import {takeUntil} from "rxjs/operators";
import {Router} from "@angular/router";
import { generateRandomString } from '../../helpers';


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

    constructor(public cu: CurrentUserService, private dialog: MatDialog, private router: Router) { }

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

    closeHelpDialog() {
        this.dialog.closeAll();
    }

    closeNewRoomDialog() {
        this.router.navigateByUrl('/room/' + this.roomIdControl.value);
        this.dialog.closeAll();
    }

    ngOnDestroy(): void {
        this.destroyed$.next(true);
        this.destroyed$.complete();
    }

}
