import { Component, Inject, ViewEncapsulation } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import {
  HOUR12_OPTIONS,
  PeriodoAmPm,
  TimeParts12h,
  buildMinuteOptions,
  parseHhMm,
  toHhMm
} from './timepicker.util';

export interface TimepickerDialogData {
  value: string | null;
  minuteStep?: number;
  title?: string;
}

@Component({
  selector: 'app-timepicker-dialog',
  templateUrl: './timepicker-dialog.component.html',
  styleUrls: ['./timepicker-dialog.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class TimepickerDialogComponent {
  readonly hourOptions = HOUR12_OPTIONS;
  readonly minuteOptions: number[];
  readonly title: string;

  hour12: number;
  minute: number;
  period: PeriodoAmPm;

  constructor(
    private readonly dialogRef: MatDialogRef<TimepickerDialogComponent, string | undefined>,
    @Inject(MAT_DIALOG_DATA) data: TimepickerDialogData
  ) {
    this.title = data.title || 'Seleccionar hora';
    this.minuteOptions = buildMinuteOptions(data.minuteStep ?? 1);

    const parsed = parseHhMm(data.value);
    if (parsed) {
      this.hour12 = parsed.hour12;
      this.minute = this.snapMinute(parsed.minute);
      this.period = parsed.period;
    } else {
      const now = new Date();
      this.hour12 = now.getHours() % 12 || 12;
      this.minute = this.snapMinute(now.getMinutes());
      this.period = now.getHours() >= 12 ? 'pm' : 'am';
    }
  }

  get preview(): string {
    return toHhMm({ hour12: this.hour12, minute: this.minute, period: this.period });
  }

  get previewDisplay(): string {
    const parts: TimeParts12h = {
      hour12: this.hour12,
      minute: this.minute,
      period: this.period
    };
    const hh = String(parts.hour12).padStart(2, '0');
    const mm = String(parts.minute).padStart(2, '0');
    return `${hh}:${mm} ${parts.period === 'am' ? 'a.m.' : 'p.m.'}`;
  }

  padMinute(m: number): string {
    return String(m).padStart(2, '0');
  }

  cancelar(): void {
    this.dialogRef.close(undefined);
  }

  aceptar(): void {
    this.dialogRef.close(this.preview);
  }

  private snapMinute(minute: number): number {
    if (this.minuteOptions.includes(minute)) return minute;
    // Si el valor actual no está en el grid (p. ej. step 5 y minuto 1), conservar el más cercano inferior
    let best = this.minuteOptions[0];
    for (const opt of this.minuteOptions) {
      if (opt <= minute) best = opt;
    }
    return best;
  }
}
