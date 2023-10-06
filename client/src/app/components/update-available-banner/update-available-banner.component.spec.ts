import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UpdateAvailableBannerComponent } from './update-available-banner.component';

describe('UpdateAvailableBannerComponent', () => {
  let component: UpdateAvailableBannerComponent;
  let fixture: ComponentFixture<UpdateAvailableBannerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ UpdateAvailableBannerComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UpdateAvailableBannerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
