import { Injectable } from '@angular/core';
import * as JSZip from "jszip";
import {Observable, from} from "rxjs";
import {throttle} from "lodash";

@Injectable({
  providedIn: 'root'
})
export class ZipFilesService {

    public archive(files: FileList, archiveName: string, progressCallback?: (percent: number) => void): Observable<File> {
        const zip = new JSZip();

        // add files for zipping
        Array.prototype.forEach.call(files, (file) => {
            zip.file(file.name, file);
        });

        const config: any = {
            type: 'blob',
            streamFiles: true
        }

        const onZipProgress = throttle((metadata: any) => {
            if (progressCallback) progressCallback(metadata.percent);
        }, 50);

        return from(zip.generateAsync(config, onZipProgress)
            .then((blob: any) => {
                const options = { type: 'application/zip' };
                return new File([blob], `${archiveName}.zip`, options);
            }));
    }
}
