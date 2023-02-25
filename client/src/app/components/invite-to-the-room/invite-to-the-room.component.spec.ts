import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InviteToTheRoomComponent } from './invite-to-the-room.component';

describe('InviteToTheRoomComponent', () => {
  let component: InviteToTheRoomComponent;
  let fixture: ComponentFixture<InviteToTheRoomComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ InviteToTheRoomComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InviteToTheRoomComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
