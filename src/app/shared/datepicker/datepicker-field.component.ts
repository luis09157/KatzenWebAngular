import { Component, Input, Optional, Output, EventEmitter, Self, ViewEncapsulation } from '@angular/core';
import { ControlValueAccessor, NgControl } from '@angular/forms';
import { DateAdapter, MAT_DATE_LOCALE } from '@angular/material/core';
import { coerceToIsoDate, formatLocalDateToIso, parseIsoDateToLocalDate } from './datepicker.util';

@Component({
  selector: 'app-datepicker-field',
  templateUrl: './datepicker-field.component.html',
  styleUrls: ['./datepicker-field.component.scss'],
  encapsulation: ViewEncapsulation.None,
  providers: [{ provide: MAT_DATE_LOCALE, useValue: 'es-MX' }],
})
export class DatepickerFieldComponent implements ControlValueAccessor {
  @Input() label = 'Fecha';
  @Input() hint = '';
  @Input() required = false;
  @Input() placeholder = 'dd/mm/aaaa';
  /** Emite ISO `yyyy-MM-dd` al cambiar (además del CVA). */
  @Output() dateChange = new EventEmitter<string>();

  /** Valor Date para el mat-datepicker. */
  dateValue: Date | null = null;
  disabled = false;

  private onChange: (value: string | null) => void = () => {};
  private onTouched: () => void = () => {};

  constructor(
    private readonly dateAdapter: DateAdapter<Date>,
    @Optional() @Self() public readonly ngControl: NgControl | null
  ) {
    this.dateAdapter.setLocale('es-MX');
    if (this.ngControl) {
      this.ngControl.valueAccessor = this;
    }
  }

  get showRequiredError(): boolean {
    const c = this.ngControl?.control;
    return !!(c?.invalid && c?.touched && c?.hasError('required'));
  }

  writeValue(value: unknown): void {
    const iso = coerceToIsoDate(value);
    this.dateValue = iso ? parseIsoDateToLocalDate(iso) : null;
  }

  registerOnChange(fn: (value: string | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  onPickerChange(date: Date | null): void {
    this.dateValue = date;
    const iso = formatLocalDateToIso(date);
    this.onChange(iso || null);
    this.dateChange.emit(iso);
    this.onTouched();
  }

  markTouched(): void {
    this.onTouched();
  }
}
