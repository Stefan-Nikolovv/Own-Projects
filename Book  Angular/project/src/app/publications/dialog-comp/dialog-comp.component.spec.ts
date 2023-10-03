import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogCompComponent } from './dialog-comp.component';

describe('DialogCompComponent', () => {
  let component: DialogCompComponent;
  let fixture: ComponentFixture<DialogCompComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DialogCompComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DialogCompComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
