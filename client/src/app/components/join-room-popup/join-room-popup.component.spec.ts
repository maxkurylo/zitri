import { ComponentFixture, TestBed } from '@angular/core/testing';

import { JoinRoomPopupComponent } from './join-room-popup.component';

describe('JoinRoomPopupComponent', () => {
  let component: JoinRoomPopupComponent;
  let fixture: ComponentFixture<JoinRoomPopupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ JoinRoomPopupComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(JoinRoomPopupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
