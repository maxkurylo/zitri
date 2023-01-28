import { TestBed } from '@angular/core/testing';

import { FileTransfer2Service } from './file-transfer-2.service';

describe('FileTransfer2Service', () => {
  let service: FileTransfer2Service;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FileTransfer2Service);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
