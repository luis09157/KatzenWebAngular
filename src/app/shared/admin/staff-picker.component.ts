import {
  Component,
  Input,
  OnDestroy,
  OnInit,
  ViewEncapsulation
} from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { Subject, of } from 'rxjs';
import { catchError, takeUntil } from 'rxjs/operators';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { UsuariosService } from '../../usuarios/usuarios.service';
import { LoggerService } from '../../core/logger.service';
import {
  DEFAULT_STAFF_PICKER_FIELDS,
  StaffPickerFields,
  StaffPickerRoleFilter,
  StaffUsuarioLike
} from './staff-picker.models';
import {
  filterStaffUsuarios,
  resolveStaffUidFromLegacy
} from './staff-picker.util';

@Component({
  selector: 'app-staff-picker',
  templateUrl: './staff-picker.component.html',
  styleUrls: ['./staff-picker.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class StaffPickerComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();

  @Input({ required: true }) formGroup!: FormGroup;
  @Input() fields: StaffPickerFields = DEFAULT_STAFF_PICKER_FIELDS;
  @Input() roleFilter: StaffPickerRoleFilter = 'doctor';
  /** Si el filtro estricto deja 0, ampliar a todos los activos (útil en baños). */
  @Input() fallbackAllIfEmpty = false;
  @Input() label = 'Personal';
  @Input() required = false;
  @Input() disabled = false;
  /** Prefill UID del usuario Auth logueado si está en la lista (solo si el control UID está vacío). */
  @Input() prefillCurrentUser = true;
  @Input() hint = '';

  /** Control interno ligado al select (UID). */
  readonly uidSelect = new FormControl<string>('', { nonNullable: true });

  staff: StaffUsuarioLike[] = [];
  cargando = true;
  errorCarga = false;

  constructor(
    private usuariosService: UsuariosService,
    private afAuth: AngularFireAuth,
    private logger: LoggerService
  ) {}

  ngOnInit(): void {
    if (this.disabled) {
      this.uidSelect.disable({ emitEvent: false });
    }

    this.uidSelect.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(uid => {
      this.syncFormFromUid(uid);
    });

    this.cargarStaff();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get uidFieldName(): string {
    return this.fields.uidField || DEFAULT_STAFF_PICKER_FIELDS.uidField;
  }

  get nombreFieldName(): string {
    return this.fields.nombreField || DEFAULT_STAFF_PICKER_FIELDS.nombreField;
  }

  get showRequiredError(): boolean {
    if (!this.required) {
      return false;
    }
    const ctrl = this.formGroup?.get(this.uidFieldName);
    const touched = this.uidSelect.touched || !!ctrl?.touched;
    const empty = !String(this.uidSelect.value || '').trim();
    return touched && empty;
  }

  private cargarStaff(): void {
    this.cargando = true;
    this.errorCarga = false;
    this.usuariosService
      .getUsuarios()
      .pipe(
        takeUntil(this.destroy$),
        catchError(err => {
          this.logger.error('StaffPicker: error cargando usuarios', err);
          this.errorCarga = true;
          this.cargando = false;
          return of([]);
        })
      )
      .subscribe(usuarios => {
        const list = Array.isArray(usuarios) ? usuarios : [];
        let filtered = filterStaffUsuarios(list, this.roleFilter);
        if (this.fallbackAllIfEmpty && filtered.length === 0) {
          filtered = filterStaffUsuarios(list, 'all');
        }
        this.staff = filtered;
        this.cargando = false;
        void this.restaurarOPrefill();
      });
  }

  private async restaurarOPrefill(): Promise<void> {
    const uidCtrl = this.formGroup.get(this.uidFieldName);
    const nombreCtrl = this.formGroup.get(this.nombreFieldName);
    const uidActual = String(uidCtrl?.value || '').trim();
    const nombreActual = String(nombreCtrl?.value || '').trim();

    const resolved = resolveStaffUidFromLegacy({
      uid: uidActual,
      nombre: nombreActual,
      usuarios: this.staff
    });

    if (resolved) {
      this.uidSelect.setValue(resolved, { emitEvent: false });
      this.syncFormFromUid(resolved);
      return;
    }

    // Legacy: solo nombre y no match → dejar nombre; UID vacío
    if (nombreActual && !uidActual) {
      this.uidSelect.setValue('', { emitEvent: false });
      return;
    }

    if (!this.prefillCurrentUser || this.disabled) {
      return;
    }

    try {
      const user = await this.afAuth.currentUser;
      const uid = user?.uid;
      if (uid && this.staff.some(s => s.id === uid)) {
        this.uidSelect.setValue(uid, { emitEvent: false });
        this.syncFormFromUid(uid);
      }
    } catch (e) {
      this.logger.warn('StaffPicker: no se pudo prefill usuario actual', e);
    }
  }

  private syncFormFromUid(uid: string): void {
    const id = String(uid || '').trim();
    const found = this.staff.find(s => s.id === id);
    const nombre = found ? String(found.nombre || '').trim() : '';

    const uidCtrl = this.formGroup.get(this.uidFieldName);
    const nombreCtrl = this.formGroup.get(this.nombreFieldName);

    if (uidCtrl) {
      uidCtrl.setValue(id, { emitEvent: false });
      uidCtrl.markAsDirty();
    }
    if (nombreCtrl && (nombre || id)) {
      // Si hay match, denormalizar; si UID vacío, no borrar nombre legacy en edición sin match
      if (nombre) {
        nombreCtrl.setValue(nombre, { emitEvent: false });
        nombreCtrl.markAsDirty();
      }
    }
  }

  onBlur(): void {
    this.uidSelect.markAsTouched();
    this.formGroup.get(this.uidFieldName)?.markAsTouched();
    if (this.required) {
      const uid = String(this.uidSelect.value || '').trim();
      const uidCtrl = this.formGroup.get(this.uidFieldName);
      if (uidCtrl && !uid) {
        uidCtrl.setErrors({ ...(uidCtrl.errors || {}), required: true });
      } else if (uidCtrl?.hasError('required')) {
        const { required: _r, ...rest } = uidCtrl.errors || {};
        uidCtrl.setErrors(Object.keys(rest).length ? rest : null);
      }
    }
  }
}
