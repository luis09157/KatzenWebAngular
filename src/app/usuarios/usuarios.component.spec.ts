import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';

import { UsuariosComponent } from './usuarios.component';
import {
  ADMIN_TEST_DECLARATIONS,
  ADMIN_TEST_IMPORTS,
  provideAdminTestStubs
} from '../core/testing/angularfire-stubs';

describe('UsuariosComponent', () => {
  let component: UsuariosComponent;
  let fixture: ComponentFixture<UsuariosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [UsuariosComponent, ...ADMIN_TEST_DECLARATIONS],
      imports: [...ADMIN_TEST_IMPORTS],
      providers: [...provideAdminTestStubs()],
      schemas: [NO_ERRORS_SCHEMA]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(UsuariosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
