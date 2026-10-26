import { Component, forwardRef, NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { of } from 'rxjs';
import { BanioDialogComponent } from './banio-dialog.component';
import { BaniosService } from './banios.service';
import { BaniosPacienteService } from '../pacientes/banios-paciente.service';
import { LoadingService } from '../core/loading.service';
import { DefaultsBanioService } from '../finanzas/defaults-banio.service';
import { emptyDefaultsBanio } from '../finanzas/defaults-banio.models';
import { PlantillaCostoService } from '../finanzas/plantilla-costo.service';
import { PacientesService } from '../pacientes/pacientes.service';
import { TarifasPeluqueriaService } from '../finanzas/tarifas-peluqueria.service';
import { tarifasPeluqueriaVacias } from '../finanzas/tarifas-peluqueria.util';

@Component({
  selector: 'app-timepicker-field',
  template: '',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TimepickerFieldStubComponent),
      multi: true,
    },
  ],
})
class TimepickerFieldStubComponent implements ControlValueAccessor {
  writeValue(): void {}
  registerOnChange(): void {}
  registerOnTouched(): void {}
}

function textosBotones(raiz: HTMLElement, aria: string): string[] {
  const caja = raiz.querySelector(`[aria-label="${aria}"]`);
  if (!caja) return [];
  return Array.from(caja.querySelectorAll('button')).map((boton) =>
    (boton.textContent || '').replace(/\s+/g, ' ').trim()
  );
}

describe('BanioDialogComponent alta simple (spec 085)', () => {
  let fixture: ComponentFixture<BanioDialogComponent>;
  const dialogData: { id?: string } = {};
  const baniosService = {
    getBanioById: jasmine.createSpy('getBanioById').and.returnValue(of(null)),
  };

  beforeEach(async () => {
    dialogData.id = undefined;
    baniosService.getBanioById.and.returnValue(of(null));

    await TestBed.configureTestingModule({
      declarations: [BanioDialogComponent, TimepickerFieldStubComponent],
      imports: [
        ReactiveFormsModule,
        NoopAnimationsModule,
        MatButtonModule,
        MatCheckboxModule,
        MatDatepickerModule,
        MatNativeDateModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatIconModule,
      ],
      providers: [
        { provide: MatDialogRef, useValue: { close: jasmine.createSpy('close') } },
        { provide: MAT_DIALOG_DATA, useValue: dialogData },
        { provide: BaniosService, useValue: baniosService },
        { provide: BaniosPacienteService, useValue: {} },
        { provide: LoadingService, useValue: { show() {}, hide() {} } },
        { provide: DefaultsBanioService, useValue: { getDefaultsOnce: () => Promise.resolve(emptyDefaultsBanio()) } },
        { provide: PlantillaCostoService, useValue: { getPlantillas: () => of([]) } },
        { provide: PacientesService, useValue: {} },
        { provide: TarifasPeluqueriaService, useValue: { getOnce: () => Promise.resolve(tarifasPeluqueriaVacias()) } },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  });

  async function crear(): Promise<void> {
    fixture = TestBed.createComponent(BanioDialogComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    await new Promise((resolver) => setTimeout(resolver, 150));
    fixture.detectChanges();
  }

  it('muestra los seis servicios, el pago se puede marcar y el precio no es obligatorio', async () => {
    await crear();
    const textos = textosBotones(fixture.nativeElement, 'Tipo de servicio').join(' | ');

    expect(textos).toContain('Corte de Uñas');
    expect(textos).toContain('Rasurado higiénico');
    expect(textos).toContain('Baño medicado');
    expect(textos).toContain('Baño con corte');
    expect(textos).toContain('Baño');
    expect(textos).toContain('Baño con deslanado');
    expect(fixture.nativeElement.textContent).not.toContain('Rápido');
    expect(fixture.nativeElement.textContent).not.toContain('Completo');

    const pagado = fixture.nativeElement.querySelector('mat-checkbox input') as HTMLInputElement;
    expect(pagado.disabled).toBeFalse();
    pagado.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.banioForm.get('pagado')?.value).toBeTrue();
    expect(fixture.componentInstance.banioForm.get('estado')?.value).toBe('programado');
    expect(fixture.componentInstance.banioForm.get('precio_total')?.valid).toBeTrue();
  });

  it('elegir un servicio no exige precio para dejar el control válido', async () => {
    await crear();
    const corte = Array.from(
      fixture.nativeElement.querySelectorAll('[aria-label="Tipo de servicio"] button') as NodeListOf<HTMLButtonElement>
    ).find((boton) => (boton.textContent || '').includes('Corte de Uñas'));
    corte?.click();
    fixture.detectChanges();

    const form = fixture.componentInstance.banioForm;
    expect(form.get('tipo_servicio')?.value).toBe('corte_uñas');
    expect(form.get('precio_total')?.errors).toBeNull();
    expect(form.get('peluquero_id')?.valid).toBeTrue();
    expect(form.get('fecha_banio')?.enabled).toBeTrue();
    expect(form.get('fecha_banio')?.value instanceof Date).toBeTrue();
  });

  it('al editar un baño viejo conserva Corte de Pelo junto a los seis servicios', async () => {
    dialogData.id = 'banio-viejo';
    baniosService.getBanioById.and.returnValue(
      of({
        id: 'banio-viejo',
        tipo_servicio: 'corte_pelo',
        estado: 'programado',
        precio_total: 200,
        precio_base: 200,
        fecha_banio: '2026-10-24',
        hora_banio: '10:00',
      })
    );

    await crear();

    expect(fixture.componentInstance.banioForm.get('tipo_servicio')?.value).toBe('corte_pelo');
    const textos = textosBotones(fixture.nativeElement, 'Tipo de servicio').join(' | ');
    expect(textos).toContain('Baño con corte');
    expect(textos).toContain('Baño con deslanado');
    expect(textos).toContain('Corte de Pelo');
    expect(fixture.componentInstance.banioForm.get('pagado')?.enabled).toBeTrue();
    expect(fixture.componentInstance.banioForm.get('fecha_banio')?.enabled).toBeTrue();
    const fecha = fixture.componentInstance.banioForm.get('fecha_banio')?.value as Date;
    expect(fecha.getFullYear()).toBe(2026);
    expect(fecha.getMonth()).toBe(9);
    expect(fecha.getDate()).toBe(24);
  });
});
