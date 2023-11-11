import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'removeHttp',
})
export class RemoveHttpPipe implements PipeTransform {
    transform(url: string | undefined, ...args: unknown[]): string | undefined {
        if (!url) {
            return;
        }

        return url.replace(/^https?:\/\//, '');
    }
}
