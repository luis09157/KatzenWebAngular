import { Injectable, NgModule } from '@angular/core';
import { DateAdapter, MAT_DATE_FORMATS, MAT_NATIVE_DATE_FORMATS, NativeDateAdapter } from '@angular/material/core';
import { parseFechaTecleada } from './datepicker.util';

/**
 * Adaptador de fechas de la clínica (2026-10-26): lo que se teclea se lee como día/mes/año.
 * El nativo de Material usa `Date.parse` («02/10/2026» → 10 de febrero) y además
 * `new Date('2026-10-02')` cae un día antes en México (UTC−6).
 */
@Injectable()
export class KatzenDateAdapter extends NativeDateAdapter {
  override parse(value: unknown, parseFormat?: unknown): Date | null {
    if (value == null || value === '') return null;
    if (value instanceof Date) return super.parse(value, parseFormat);
    if (typeof value === 'number') return new Date(value);
    const fecha = parseFechaTecleada(value);
    return fecha ?? this.invalid();
  }
}

/** Reemplaza a `MatNativeDateModule` en los módulos de la app. */
@NgModule({
  providers: [
    { provide: DateAdapter, useClass: KatzenDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: MAT_NATIVE_DATE_FORMATS },
  ],
})
export class KatzenDateModule {}
