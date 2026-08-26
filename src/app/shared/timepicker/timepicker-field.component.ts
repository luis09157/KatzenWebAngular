import {
  Component,
  Input,
  Optional,
  Self,
  ViewEncapsulation
} from '@angular/core';
import { ControlValueAccessor, NgControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ADMIN_DIALOG_TIMEPICKER } from '../../core/config/admin-ui.config';
import {
  TimepickerDialogComponent,
  TimepickerDialogData
} from './timepicker-dialog.component';
import { formatHhMmDisplay, isValidHhMm } from './timepicker.util';

@Component({
  selector: 'app-timepicker-field',
  templateUrl: './timepicker-field.component.html',
  styleUrls: ['./timepicker-field.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class TimepickerFieldComponent implements ControlValueAccessor {
  @Input() label = 'Hora';
  @Input() placeholder = 'Seleccionar hora';
  @Input() required = false;
  /** Paso de minutos en el diálogo (1 = todos). */
  @Input() minuteStep = 1;
  @Input() dialogTitle = 'Seleccionar hora';

  value = '';
  disabled = false;

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  constructor(
    private readonly dialog: MatDialog,
    @Optional() @Self() public readonly ngControl: NgControl | null
  ) {
    if (this.ngControl) {
      this.ngControl.valueAccessor = this;
    }
  }

  get displayValue(): string {
    return formatHhMmDisplay(this.value) || '';
  }

  get showRequiredError(): boolean {
    const c = this.ngControl?.control;
    return !!(c?.invalid && c?.touched && c?.hasError('required'));
  }

  get showFormatError(): boolean {
    const c = this.ngControl?.control;
    return !!(c?.invalid && c?.touched && c?.hasError('formatoInvalido'));
  }

  openPicker(event?: Event): void {
    event?.preventDefault();
    event?.stopPropagation();
    if (this.disabled) return;

    this.onTouched();

    const data: TimepickerDialogData = {
      value: isValidHhMm(this.value) ? this.value : null,
      minuteStep: this.minuteStep,
      title: this.dialogTitle
    };

    const ref = this.dialog.open(TimepickerDialogComponent, {
      ...ADMIN_DIALOG_TIMEPICKER,
      data
    });

    ref.afterClosed().subscribe((result: string | undefined) => {
      if (result == null) return;
      this.value = result;
      this.onChange(result);
      this.onTouched();
    });
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ' ') {
      this.openPicker(event);
    }
  }

  markTouched(): void {
    this.onTouched();
  }

  writeValue(value: string | null): void {
    if (value && isValidHhMm(value)) {
      this.value = value.trim();
    } else {
      this.value = value || '';
    }
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
}
