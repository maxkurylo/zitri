import { TestBed } from '@angular/core/testing';

import { ZipFilesService } from './zip-files.service';

describe('ZipFilesService', () => {
  let service: ZipFilesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ZipFilesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
