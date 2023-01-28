import * as JSZip from "jszip";

export default async function zipFiles(files: FileList, archiveName: string, progress: ProgressCallback): Promise<File> {
    const zip = new JSZip();

    Array.prototype.forEach.call(files, (file) => {
        zip.file(file.name, file);
    });


    const blob = await zip.generateAsync(
        { type: 'blob', streamFiles: true },
        (metadata) => progress(metadata.percent)
    );

    return new File(
        [blob],
        `${archiveName}.zip`,
        {
            type: 'application/zip',
        },
    );
}


type ProgressCallback = (percent: number) => void
