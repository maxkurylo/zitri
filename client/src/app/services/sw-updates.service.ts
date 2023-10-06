import { Injectable } from '@angular/core';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { timer } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class ServiceWorkerUpdatesService {
    public updateAvailable = false;

    constructor(private swUpdate: SwUpdate) {
        if (!this.swUpdate.isEnabled) {
            console.log('Service worker updates disabled');
            return;
        }
        const stable$ = timer(30 * 1000); // 30 seconds

        stable$.subscribe(() => {
            this.swUpdate.checkForUpdate();
        });

        this.swUpdate.versionUpdates.subscribe((evt) => {
            switch (evt.type) {
                case 'VERSION_DETECTED':
                    console.log(
                        `Downloading new app version: ${evt.version.hash}`
                    );
                    break;
                case 'VERSION_READY':
                    console.log(
                        `Current app version: ${evt.currentVersion.hash}`
                    );
                    console.log(
                        `New app version ready for use: ${evt.latestVersion.hash}`
                    );
                    this.updateAvailable = true;
                    break;
                case 'VERSION_INSTALLATION_FAILED':
                    console.log(
                        `Failed to install app version '${evt.version.hash}': ${evt.error}`
                    );
                    break;
            }
        });
    }
}
