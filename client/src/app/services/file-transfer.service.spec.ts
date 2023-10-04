import { TestBed } from '@angular/core/testing';

import { FileTransferService } from './file-transfer.service';

describe('FileTransfer2Service', () => {
  let service: FileTransferService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FileTransferService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
