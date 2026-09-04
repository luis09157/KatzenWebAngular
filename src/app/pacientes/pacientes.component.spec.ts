import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';

import { PacientesComponent } from './pacientes.component';
import {
  ADMIN_TEST_DECLARATIONS,
  ADMIN_TEST_IMPORTS,
  provideAdminTestStubs
} from '../core/testing/angularfire-stubs';

describe('PacientesComponent', () => {
  let component: PacientesComponent;
  let fixture: ComponentFixture<PacientesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PacientesComponent, ...ADMIN_TEST_DECLARATIONS],
      imports: [...ADMIN_TEST_IMPORTS],
      providers: [...provideAdminTestStubs()],
      schemas: [NO_ERRORS_SCHEMA]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PacientesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
