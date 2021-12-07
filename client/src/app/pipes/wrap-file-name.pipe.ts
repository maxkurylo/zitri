import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'wrapFileName'
})
export class WrapFileNamePipe implements PipeTransform {

  transform(value: string | undefined, ...args: unknown[]): string | undefined {
    if (!value || value.length < 23) {
      return value;
    }

    const extension = value.split('.').pop();
    if (extension) {
      let trimmedFileName = value.substring(0, value.length - extension.length - 1); // remove extension from filename
      return trimmedFileName.substring(0, 22) + '...' + extension;
    } else {
      return value.substring(0, 22) + '...';
    }
  }

}
