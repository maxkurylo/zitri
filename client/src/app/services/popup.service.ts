import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ComponentType } from '@angular/cdk/portal';
import {MatBottomSheet} from "@angular/material/bottom-sheet";

@Injectable({
    providedIn: 'root',
})
export class PopupService {
    constructor(private dialog: MatDialog, private bottomSheet: MatBottomSheet) {}

    public open(component: ComponentType<unknown>): void {
        const config = {};
        this.dialog.open(component, config);
    }

    public openBottomSheet(component: ComponentType<unknown>): void {
        this.bottomSheet.open(component, {
            panelClass: 'bottom-sheet'
        });
    }

    public close(): void {
        this.dialog.closeAll();
    }

    public closeBottomSheet(): void {
        this.bottomSheet.dismiss();
    }
}
