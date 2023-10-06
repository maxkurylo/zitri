import { ApplicationRef, Injectable } from '@angular/core';
import { SwUpdate } from '@angular/service-worker';
import { concat, interval } from 'rxjs';
import { first } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

@Injectable({
    providedIn: 'root',
})
export class ServiceWorkerUpdatesService {
    private readonly checkTimeout = 6 * 60 * 60 * 1000; // 6 hours
    public updateAvailable = false;

    constructor(private appRef: ApplicationRef, private swUpdate: SwUpdate) {
        if (!this.swUpdate.isEnabled) {
            console.log('Service worker updates disabled');
            return;
        }

        if (environment.scheduleUpdatesCheck) {
            this.scheduleUpdatesCheck();
        }

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

    private scheduleUpdatesCheck(): void {
        // Allow the app to stabilize first, before starting
        // polling for updates with `interval()`.
        const appIsStable$ = this.appRef.isStable.pipe(
            first((isStable) => isStable === true)
        );
        const checkTimeOut$ = interval(this.checkTimeout);
        const checkTimeOutOnceAppIsStable$ = concat(
            appIsStable$,
            checkTimeOut$
        );

        checkTimeOutOnceAppIsStable$.subscribe(() => {
            this.swUpdate.checkForUpdate();
        });
    }
}
