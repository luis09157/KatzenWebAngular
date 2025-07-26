import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { PacientesService } from '../pacientes/pacientes.service';
import { CitasService } from '../citas/citas.service';
import { Observable, startWith, map } from 'rxjs';

@Component({
  selector: 'app-historial-dialog',
  templateUrl: './historial-dialog.component.html',
  styleUrls: ['./historial-dialog.component.css']
})
export class HistorialDialogComponent implements OnInit {
  historialForm: FormGroup;
  modoVer: boolean = false;
  pacientes: any[] = [];
  pacientesFiltrados$: Observable<any[]>;
  pacienteCtrl = new FormControl('');
  citas: any[] = [];
  citasFiltradas: any[] = [];
  citaCtrl = new FormControl('');
  citasFiltradas$: Observable<any[]>;

  constructor(
    public dialogRef: MatDialogRef<HistorialDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private fb: FormBuilder,
    private pacientesService: PacientesService,
    private citasService: CitasService
  ) {
    this.modoVer = data.modoVer;
    this.historialForm = this.fb.group({
      id: [data.historial?.id || ''],
      paciente_id: [data.historial?.paciente_id || '', Validators.required],
      cita_id: [data.historial?.cita_id || ''],
      fecha_registro: [data.historial?.fecha_registro || '', Validators.required],
      diagnostico: [data.historial?.diagnostico || '', Validators.required],
      tratamiento: [data.historial?.tratamiento || ''],
      medicamentos: [data.historial?.medicamentos || ''],
      notas: [data.historial?.notas || '']
    });
    if (this.modoVer) {
      this.historialForm.disable();
      this.pacienteCtrl.disable();
    }
  }

  ngOnInit(): void {
    this.pacientesService.getPacientes().subscribe(pacientes => {
      this.pacientes = (pacientes || []).filter(p => p.activo !== false);
      const pacienteId = this.historialForm.get('paciente_id')?.value;
      if (pacienteId) {
        const paciente = this.pacientes.find(p => p.id === pacienteId);
        if (paciente) {
          this.pacienteCtrl.setValue(paciente);
        }
        this.filtrarCitasPorPaciente(pacienteId);
      }
    });
    this.citasService.getCitas().subscribe(citas => {
      this.citas = (citas || []).filter(c => c.activo !== false);
      const pacienteId = this.historialForm.get('paciente_id')?.value;
      if (pacienteId) {
        this.filtrarCitasPorPaciente(pacienteId);
      }
    });
    this.pacientesFiltrados$ = this.pacienteCtrl.valueChanges.pipe(
      startWith(''),
      map((value: any) => typeof value === 'string' ? value : this.getPacienteLabel(value && value.id ? value.id : '')),
      map(value => this._filterPacientes(value || ''))
    );
    this.citasFiltradas$ = this.citaCtrl.valueChanges.pipe(
      startWith(''),
      map((value: any) => typeof value === 'string' ? value : this.getCitaLabel(value && value.id ? value.id : '')),
      map(value => this._filterCitas(value || ''))
    );
  }

  private _filterPacientes(value: string): any[] {
    const filterValue = value.toLowerCase();
    return this.pacientes.filter(p =>
      (p.nombre + ' ' + (p.nombreCliente || '') + ' ' + (p.apellidoPaterno || '')).toLowerCase().includes(filterValue)
    );
  }

  private _filterCitas(value: string): any[] {
    const filterValue = value.toLowerCase();
    return this.citasFiltradas.filter(c =>
      (c.fecha_hora + ' ' + (c.motivo || '')).toLowerCase().includes(filterValue)
    );
  }

  onPacienteSelected(paciente: any) {
    this.historialForm.get('paciente_id')?.setValue(paciente.id);
    this.filtrarCitasPorPaciente(paciente.id);
    this.citaCtrl.setValue('');
  }

  onCitaSelected(cita: any) {
    this.historialForm.get('cita_id')?.setValue(cita.id);
  }

  onPacienteChange(pacienteId: string) {
    this.historialForm.get('cita_id')?.setValue('');
    this.filtrarCitasPorPaciente(pacienteId);
    this.citaCtrl.setValue('');
  }

  filtrarCitasPorPaciente(pacienteId: string) {
    this.citasFiltradas = this.citas.filter(c => c.paciente_id === pacienteId);
  }

  displayPacienteFn: (paciente: any) => string = (paciente: any) => {
    if (paciente && typeof paciente === 'object' && 'id' in paciente) {
      return this.getPacienteLabel(paciente.id);
    }
    return '';
  };
  displayCitaFn: (cita: any) => string = (cita: any) => {
    if (cita && typeof cita === 'object' && 'id' in cita) {
      return this.getCitaLabel(cita.id);
    }
    return '';
  };

  filtrarCitas(filtro: string) {
    const f = filtro.trim().toLowerCase();
    this.citasFiltradas = this.citasFiltradas.filter(c =>
      (c.fecha_hora + ' ' + (c.motivo || '')).toLowerCase().includes(f)
    );
  }

  getPacienteLabel(id: string | undefined): string {
    if (!id) return '';
    const p = this.pacientes.find(p => p.id === id);
    if (!p) return '';
    return `${p.nombre} (${p.nombreCliente || ''} ${p.apellidoPaterno || ''})`;
  }

  getCitaLabel(id: string | undefined): string {
    if (!id) return '';
    const c = this.citas.find(c => c.id === id);
    if (!c) return '';
    return `${c.fecha_hora || ''} - ${c.motivo || ''}`;
  }

  guardar() {
    if (this.historialForm.valid) {
      let historial = this.historialForm.value;
      
      // Siempre generar un id único si no existe o está vacío
      if (!historial.id || historial.id === '') {
        historial.id = Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
      }
      
      // Convertir la fecha del DatePicker a string si es necesario
      if (historial.fecha_registro instanceof Date) {
        historial.fecha_registro = historial.fecha_registro.toISOString().replace('T', ' ').substring(0, 19);
      }
      
      // Asegurar que todos los campos estén presentes
      historial.activo = true;
      historial.created_at = new Date().toISOString().replace('T', ' ').substring(0, 19);
      historial.updated_at = new Date().toISOString().replace('T', ' ').substring(0, 19);
      
      this.dialogRef.close(historial);
    }
  }

  cerrar() {
    this.dialogRef.close();
  }
} 