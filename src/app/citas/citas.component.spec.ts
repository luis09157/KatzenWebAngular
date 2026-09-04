import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';

import { CitasComponent } from './citas.component';
import {
  ADMIN_TEST_DECLARATIONS,
  ADMIN_TEST_IMPORTS,
  provideAdminTestStubs
} from '../core/testing/angularfire-stubs';

describe('CitasComponent', () => {
  let component: CitasComponent;
  let fixture: ComponentFixture<CitasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CitasComponent, ...ADMIN_TEST_DECLARATIONS],
      imports: [...ADMIN_TEST_IMPORTS],
      providers: [...provideAdminTestStubs()],
      schemas: [NO_ERRORS_SCHEMA]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CitasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
