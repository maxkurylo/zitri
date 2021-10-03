import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FileTransferPopupComponent } from './file-transfer-popup.component';

describe('FileTransferPopupComponent', () => {
  let component: FileTransferPopupComponent;
  let fixture: ComponentFixture<FileTransferPopupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FileTransferPopupComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FileTransferPopupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
