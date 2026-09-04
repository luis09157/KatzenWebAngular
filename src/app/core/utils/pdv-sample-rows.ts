/**
 * Filas ilustrativas del FDB (inventario-fdb.md) — **sin PII**.
 * Precios de ejemplo para tests de fórmula; no son decimales SQL reales.
 */
export interface FilaPdvSample {
  pdvId: number;
  codigo: string;
  descripcion: string;
  departamento: string;
  pcosto: number | null;
  pventa: number | null;
  pfinal: number | null;
  existencia: number;
  componentes: string | null;
  eliminado: boolean;
}

export const PDV_SAMPLE_ROWS: FilaPdvSample[] = [
  {
    pdvId: 1,
    codigo: 'VAC003',
    descripcion: 'Vacuna Bordetella',
    departamento: 'Consultorio',
    pcosto: 80,
    pventa: 100,
    pfinal: 100,
    existencia: 12,
    componentes: null,
    eliminado: false
  },
  {
    pdvId: 2,
    codigo: '750155640001',
    descripcion: 'Carda Para Gato',
    departamento: 'Petshop',
    pcosto: 40,
    pventa: 89,
    pfinal: 89,
    existencia: 6,
    componentes: null,
    eliminado: false
  },
  {
    pdvId: 3,
    codigo: '7501234567890',
    descripcion: 'Nupec Adulto 2kg',
    departamento: 'Alimento',
    pcosto: 180,
    pventa: 249,
    pfinal: 249,
    existencia: 8,
    componentes: null,
    eliminado: false
  },
  {
    pdvId: 4,
    codigo: 'BACO014',
    descripcion: 'Baño Gato Pelo Largo',
    departamento: 'Grooming',
    pcosto: 25,
    pventa: 150,
    pfinal: 150,
    existencia: 0,
    componentes: null,
    eliminado: false
  },
  {
    pdvId: 5,
    codigo: 'KTZ073',
    descripcion: 'Tobracetil 5ml',
    departamento: 'Medicamento',
    pcosto: 50,
    pventa: 120,
    pfinal: 120,
    existencia: 4,
    componentes: null,
    eliminado: false
  },
  {
    pdvId: 6,
    codigo: 'EXAM002',
    descripcion: 'Examen de sangre',
    departamento: 'Exámenes de laboratorio',
    pcosto: 100,
    pventa: 250,
    pfinal: 250,
    existencia: 99,
    componentes: null,
    eliminado: false
  },
  {
    pdvId: 7,
    codigo: 'PAQ001',
    descripcion: 'Paq Perro Mini (0-5kg)',
    departamento: 'Paquetes',
    pcosto: 200,
    pventa: 450,
    pfinal: 450,
    existencia: 3,
    componentes: 'VAC010=1;VAC003=1;VAC005=1;',
    eliminado: false
  },
  {
    pdvId: 8,
    codigo: 'DOM001',
    descripcion: 'Domicilio',
    departamento: 'Consultorio',
    pcosto: 0,
    pventa: 80,
    pfinal: 80,
    existencia: 99,
    componentes: null,
    eliminado: false
  },
  {
    pdvId: 9,
    codigo: 'PAQ099',
    descripcion: 'Paq Castración',
    departamento: 'Paquetes',
    pcosto: 800,
    pventa: 1200,
    pfinal: 1200,
    existencia: 1,
    componentes: '',
    eliminado: false
  },
  {
    pdvId: 10,
    codigo: 'DUP001',
    descripcion: 'Duplicado A',
    departamento: 'Petshop',
    pcosto: 10,
    pventa: 20,
    pfinal: 20,
    existencia: 1,
    componentes: null,
    eliminado: false
  },
  {
    pdvId: 11,
    codigo: 'DUP001',
    descripcion: 'Duplicado B',
    departamento: 'Petshop',
    pcosto: 11,
    pventa: 21,
    pfinal: 21,
    existencia: 1,
    componentes: null,
    eliminado: false
  },
  {
    pdvId: 12,
    codigo: 'BAD001',
    descripcion: 'Costo mayor que venta',
    departamento: 'Petshop',
    pcosto: 200,
    pventa: 100,
    pfinal: 100,
    existencia: 2,
    componentes: null,
    eliminado: false
  },
  {
    pdvId: 13,
    codigo: 'USO001',
    descripcion: 'Gasas uso interno',
    departamento: 'UsoInterno',
    pcosto: 15,
    pventa: 15,
    pfinal: 15,
    existencia: 40,
    componentes: null,
    eliminado: false
  }
];
