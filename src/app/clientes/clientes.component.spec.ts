import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';

import { ClientesComponent } from './clientes.component';
import {
  ADMIN_TEST_DECLARATIONS,
  ADMIN_TEST_IMPORTS,
  provideAdminTestStubs
} from '../core/testing/angularfire-stubs';

describe('ClientesComponent', () => {
  let component: ClientesComponent;
  let fixture: ComponentFixture<ClientesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ClientesComponent, ...ADMIN_TEST_DECLARATIONS],
      imports: [...ADMIN_TEST_IMPORTS],
      providers: [...provideAdminTestStubs()],
      schemas: [NO_ERRORS_SCHEMA]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ClientesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
