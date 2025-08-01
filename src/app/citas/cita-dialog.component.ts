import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ClientesService } from '../clientes/clientes.service';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

@Component({
  selector: 'app-cita-dialog',
  templateUrl: './cita-dialog.component.html',
  styleUrls: ['./cita-dialog.component.css']
})
export class CitaDialogComponent implements OnInit {
  citaForm: FormGroup;
  modoVer: boolean = false;
  clientes: any[] = [];
  filteredClientes!: Observable<any[]>;

  constructor(
    public dialogRef: MatDialogRef<CitaDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private fb: FormBuilder,
    private clientesService: ClientesService
  ) {
    this.modoVer = data.modoVer;
    this.citaForm = this.fb.group({
      id: [data.cita?.id || ''],
      cliente_id: [data.cita?.cliente_id || '', Validators.required],
      paciente_id: [data.cita?.paciente_id || '', Validators.required],
      fecha_hora: [data.cita?.fecha_hora || '', Validators.required],
      motivo: [data.cita?.motivo || '', Validators.required],
      estado: [data.cita?.estado || 'pendiente', Validators.required],
      veterinario: [data.cita?.veterinario || ''],
      observaciones: [data.cita?.observaciones || ''],
      nombreCliente: [data.cita?.nombreCliente || '', Validators.required]
    });
    if (this.modoVer) {
      this.citaForm.disable();
    }
  }

  ngOnInit() {
    this.cargarClientes();
    this.setupAutocomplete();
  }

  cargarClientes() {
    this.clientesService.getClientes().subscribe(clientes => {
      this.clientes = clientes || [];
    });
  }

  setupAutocomplete() {
    this.filteredClientes = this.citaForm.get('nombreCliente')!.valueChanges.pipe(
      startWith(''),
      map(value => this._filterClientes(value))
    );
  }

  private _filterClientes(value: string): any[] {
    const filterValue = value.toLowerCase();
    return this.clientes.filter(cliente => 
      this.getNombreCompleto(cliente).toLowerCase().includes(filterValue)
    );
  }

  getNombreCompleto(cliente: any): string {
    const nombre = cliente.nombre || '';
    const apellidoPaterno = cliente.apellidoPaterno || '';
    const apellidoMaterno = cliente.apellidoMaterno || '';
    const telefono = cliente.telefono || '';
    
    const nombreCompleto = [nombre, apellidoPaterno, apellidoMaterno].filter(Boolean).join(' ');
    return telefono ? `${nombreCompleto} - ${telefono}` : nombreCompleto;
  }

  onClienteSelected(cliente: any) {
    this.citaForm.patchValue({
      cliente_id: cliente.id,
      nombreCliente: this.getNombreCompleto(cliente)
    });
  }

  guardar() {
    if (this.citaForm.valid) {
      this.dialogRef.close(this.citaForm.value);
    }
  }

  cerrar() {
    this.dialogRef.close();
  }
} 