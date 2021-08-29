import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ShareRoomComponent } from './share-room.component';

describe('ShareRoomComponent', () => {
  let component: ShareRoomComponent;
  let fixture: ComponentFixture<ShareRoomComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ShareRoomComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ShareRoomComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
