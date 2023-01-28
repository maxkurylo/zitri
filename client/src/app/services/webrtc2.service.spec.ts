import { TestBed } from '@angular/core/testing';

import { Webrtc2Service } from './webrtc2.service';

describe('FileTransfer2Service', () => {
  let service: Webrtc2Service;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Webrtc2Service);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
