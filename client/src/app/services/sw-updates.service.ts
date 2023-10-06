import { Injectable } from '@angular/core';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { filter } from 'rxjs/operators';

@Injectable({
    providedIn: 'root',
})
export class ServiceWorkerUpdatesService {
    public updateAvailable = false;

    constructor(private swUpdate: SwUpdate) {
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
                    break;
                case 'VERSION_INSTALLATION_FAILED':
                    console.log(
                        `Failed to install app version '${evt.version.hash}': ${evt.error}`
                    );
                    break;
            }
        });

        this.swUpdate.versionUpdates
            .pipe(
                filter(
                    (evt): evt is VersionReadyEvent =>
                        evt.type === 'VERSION_READY'
                )
            )
            .subscribe((evt) => {
                this.updateAvailable = true;
            });
    }
}
