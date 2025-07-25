export interface Usuario {
  id?: string;
  nombre: string;
  email: string;
  rol: 'admin' | 'veterinario';
  creado: Date;
  actualizado: Date;
} 