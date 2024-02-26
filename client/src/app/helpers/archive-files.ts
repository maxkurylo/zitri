import * as JSZip from 'jszip';

const DEFAULT_ARCHIVE_NAME = 'archive';

export function archiveFiles(filesInfo: IZipFilesInfo, progressCallback: TZipProgressCallback) {
	const zip = new JSZip();

	const config: JSZip.JSZipGeneratorOptions = {
		type: 'blob',
		streamFiles: true,
	};

	const onMetadata = (metadata: JSZip.JSZipMetadata) => {
		progressCallback({
			percent: metadata.percent,
			isReady: false,
		});
	};

	Array.prototype.forEach.call(filesInfo.files, (file) => {
		zip.file(file.name, file);
	});

	zip.generateAsync(config, onMetadata).then((blob) => {
		const archiveName = filesInfo.archiveName || DEFAULT_ARCHIVE_NAME;

		const file = new File([blob as Blob], `${archiveName}.zip`, {
			type: 'application/zip',
		});

		// final callback call when zipping is finished
		progressCallback({
			percent: 100,
			isReady: true,
			file,
		});
	});
}

export interface IZipFilesInfo {
	files: FileList;
	archiveName?: string;
}

type TZipProgressCallback = (event: IZipFileProgressEvent) => void;

export interface IZipFileProgressEvent {
	percent: number; // 0 to 100
	isReady: boolean;
	file?: File;
}
