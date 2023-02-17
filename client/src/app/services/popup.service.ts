import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ComponentType } from '@angular/cdk/portal';

@Injectable({
    providedIn: 'root',
})
export class PopupService {
    constructor(private dialog: MatDialog) {}

    public open(component: ComponentType<unknown>): void {
        const config = {};
        this.dialog.open(component, config);
    }

    public close(): void {
        this.dialog.closeAll();
    }
}
