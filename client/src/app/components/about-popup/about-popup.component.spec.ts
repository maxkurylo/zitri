import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AboutPopupComponent } from './about-popup.component';

describe('AboutPopupComponent', () => {
  let component: AboutPopupComponent;
  let fixture: ComponentFixture<AboutPopupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AboutPopupComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AboutPopupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
