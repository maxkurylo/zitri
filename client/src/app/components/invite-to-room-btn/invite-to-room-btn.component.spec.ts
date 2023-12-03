import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InviteToRoomBtnComponent } from './invite-to-room-btn.component';

describe('InviteToRoomBtnComponent', () => {
  let component: InviteToRoomBtnComponent;
  let fixture: ComponentFixture<InviteToRoomBtnComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ InviteToRoomBtnComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InviteToRoomBtnComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
