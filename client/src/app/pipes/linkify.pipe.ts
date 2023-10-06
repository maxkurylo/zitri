import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Pipe({
    name: 'linkify',
})
export class LinkifyPipe implements PipeTransform {
    constructor(private sanitizer: DomSanitizer) {}

    transform(value: string): SafeHtml {
        if (!value) return value;

        const urlRegex = /(https?:\/\/[^\s]+)/g;

        const html = value
            .replace(/</g, '&#60;')
            .replace(/>/g, '&#62;')
            .replace(urlRegex, (url) => {
                return `<a href="${url}" target="_blank">${url}</a>`;
            });

        return this.sanitizer.bypassSecurityTrustHtml(html);
    }
}
