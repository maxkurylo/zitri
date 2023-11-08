import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MainScreenEmptyComponent } from './main-screen-empty.component';

describe('MainScreenEmptyComponent', () => {
  let component: MainScreenEmptyComponent;
  let fixture: ComponentFixture<MainScreenEmptyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MainScreenEmptyComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MainScreenEmptyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
