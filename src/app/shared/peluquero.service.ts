import { Injectable } from '@angular/core';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import { Observable, map, catchError, throwError, firstValueFrom, combineLatest, of } from 'rxjs';
import { switchMap, take } from 'rxjs/operators';
import { Peluquero, PeluqueroFormData } from './peluquero.model';
import { ValidationService } from './validation.service';
import { CurrentStaffService } from '../core/services/current-staff.service';

@Injectable({
  providedIn: 'root'
})
export class PeluqueroService {

  private readonly LEGACY_COLLECTION = 'peluqueros';
  private readonly COLLECTION = 'Katzen/Peluqueros';

  constructor(
    private db: AngularFireDatabase,
    private validationService: ValidationService,
    private currentStaff: CurrentStaffService
  ) { }

  // ===== OPERACIONES CRUD =====

  // Crear nuevo peluquero
  async crearPeluquero(peluqueroData: PeluqueroFormData): Promise<string> {
    try {
      // Validar datos requeridos
      const errors = this.validationService.validateRequiredFields('peluquero', peluqueroData);
      if (errors.length > 0) {
        throw new Error(`Errores de validación: ${errors.join(', ')}`);
      }

      // Verificar duplicados (email y teléfono)
      const duplicados = await this.verificarDuplicados(peluqueroData.email, peluqueroData.telefono);
      if (duplicados.email) {
        throw new Error('Ya existe un peluquero con este email');
      }
      if (duplicados.telefono) {
        throw new Error('Ya existe un peluquero con este teléfono');
      }

      // Crear objeto completo
      const peluquero: Peluquero = {
        ...peluqueroData,
        activo: true,
        created_at: new Date(),
        updated_at: new Date(),
        created_by: await this.currentStaff.getStaffId()
      };

      // Generar ID único
      const id = this.db.createPushId();
      peluquero.id = id;

      // Guardar en Firebase
      await firstValueFrom(
        this.db.object(`${this.COLLECTION}/${id}`).set(peluquero)
      );

      return id;
    } catch (error) {
      console.error('Error al crear peluquero:', error);
      throw error;
    }
  }

  // Obtener todos los peluqueros activos
  obtenerPeluqueros(): Observable<Peluquero[]> {
    const activos = (list: Peluquero[] | null | undefined) =>
      (list || []).filter(p => p && p.activo !== false);

    const primary$ = this.db.list<Peluquero>(this.COLLECTION).valueChanges().pipe(
      map(activos),
      catchError(() => of([] as Peluquero[]))
    );
    const legacy$ = this.db.list<Peluquero>(this.LEGACY_COLLECTION).valueChanges().pipe(
      map(activos),
      catchError(() => of([] as Peluquero[]))
    );

    return combineLatest([primary$, legacy$]).pipe(
      map(([primary, legacy]) => {
        const byId = new Map<string, Peluquero>();
        legacy.forEach(p => {
          if (p?.id) {
            byId.set(p.id, p);
          }
        });
        primary.forEach(p => {
          if (p?.id) {
            byId.set(p.id, p);
          }
        });
        return Array.from(byId.values());
      }),
      catchError(error => {
        console.error('Error al obtener peluqueros:', error);
        return throwError(() => error);
      })
    );
  }

  obtenerPeluqueroPorId(id: string): Observable<Peluquero | null> {
    return this.db.object<Peluquero>(`${this.COLLECTION}/${id}`).valueChanges().pipe(
      take(1),
      switchMap(peluquero => {
        if (peluquero) {
          return of(peluquero);
        }
        return this.db.object<Peluquero>(`${this.LEGACY_COLLECTION}/${id}`).valueChanges().pipe(take(1));
      }),
      catchError(error => {
        console.error('Error al obtener peluquero:', error);
        return throwError(() => error);
      })
    );
  }

  // Actualizar peluquero
  async actualizarPeluquero(id: string, peluqueroData: Partial<PeluqueroFormData>): Promise<void> {
    try {
      // Validar datos
      if (peluqueroData.email || peluqueroData.telefono) {
        const duplicados = await this.verificarDuplicados(
          peluqueroData.email || '',
          peluqueroData.telefono || '',
          id
        );
        
        if (duplicados.email) {
          throw new Error('Ya existe un peluquero con este email');
        }
        if (duplicados.telefono) {
          throw new Error('Ya existe un peluquero con este teléfono');
        }
      }

      // Actualizar
      const updateData = {
        ...peluqueroData,
        updated_at: new Date()
      };

      await firstValueFrom(
        this.db.object(`${this.COLLECTION}/${id}`).update(updateData)
      );
    } catch (error) {
      console.error('Error al actualizar peluquero:', error);
      throw error;
    }
  }

  // Eliminar peluquero (baja lógica)
  async eliminarPeluquero(id: string): Promise<void> {
    try {
      await firstValueFrom(
        this.db.object(`${this.COLLECTION}/${id}`).update({
          activo: false,
          updated_at: new Date()
        })
      );
    } catch (error) {
      console.error('Error al eliminar peluquero:', error);
      throw error;
    }
  }

  // Eliminación física (solo para administradores)
  async eliminarPeluqueroFisicamente(id: string): Promise<void> {
    try {
      await firstValueFrom(
        this.db.object(`${this.COLLECTION}/${id}`).remove()
      );
    } catch (error) {
      console.error('Error al eliminar peluquero físicamente:', error);
      throw error;
    }
  }

  // ===== VALIDACIONES ESPECÍFICAS =====

  // Verificar duplicados de email y teléfono
  private async verificarDuplicados(email: string, telefono: string, excludeId?: string): Promise<{ email: boolean; telefono: boolean }> {
    try {
      const peluqueros = await firstValueFrom(this.obtenerPeluqueros());
      
      const emailDuplicado = peluqueros.some(p => 
        p.email === email && (!excludeId || p.id !== excludeId)
      );
      
      const telefonoDuplicado = peluqueros.some(p => 
        p.telefono === telefono && (!excludeId || p.id !== excludeId)
      );

      return {
        email: emailDuplicado,
        telefono: telefonoDuplicado
      };
    } catch (error) {
      console.error('Error al verificar duplicados:', error);
      return { email: false, telefono: false };
    }
  }

  // Verificar disponibilidad del peluquero
  async verificarDisponibilidad(peluqueroId: string, fecha: string, hora: string): Promise<boolean> {
    try {
      // Obtener el peluquero
      const peluquero = await firstValueFrom(this.obtenerPeluqueroPorId(peluqueroId));
      if (!peluquero) return false;

      // Verificar si trabaja en esa fecha
      const diaSemana = new Date(fecha).toLocaleDateString('es-ES', { weekday: 'long' });
      if (!peluquero.dias_trabajo.includes(diaSemana)) {
        return false;
      }

      // Verificar si la hora está en su horario de trabajo
      const horaInicio = peluquero.horario_trabajo.inicio;
      const horaFin = peluquero.horario_trabajo.fin;
      
      if (hora < horaInicio || hora > horaFin) {
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error al verificar disponibilidad:', error);
      return false;
    }
  }

  // ===== MÉTODOS DE BÚSQUEDA =====

  // Buscar peluqueros por especialidad
  buscarPeluquerosPorEspecialidad(especialidad: string): Observable<Peluquero[]> {
    return this.obtenerPeluqueros().pipe(
      map(peluqueros => peluqueros.filter(p => p.especialidad === especialidad))
    );
  }

  // Buscar peluqueros por disponibilidad
  async buscarPeluquerosDisponibles(fecha: string, hora: string): Promise<Peluquero[]> {
    try {
      const peluqueros = await firstValueFrom(this.obtenerPeluqueros());
      const disponibles: Peluquero[] = [];

      for (const peluquero of peluqueros) {
        const disponible = await this.verificarDisponibilidad(peluquero.id!, fecha, hora);
        if (disponible) {
          disponibles.push(peluquero);
        }
      }

      return disponibles;
    } catch (error) {
      console.error('Error al buscar peluqueros disponibles:', error);
      return [];
    }
  }

  // ===== DATOS DE EJEMPLO =====

  // Crear peluqueros de ejemplo
  async crearPeluquerosEjemplo(): Promise<void> {
    try {
      const peluquerosEjemplo = [
        {
          nombre: 'María',
          apellido: 'González',
          email: 'maria.gonzalez@katzenvet.com',
          telefono: '555-0101',
          especialidad: 'Baños y corte general',
          experiencia_anos: 5,
          horario_trabajo: {
            inicio: '08:00',
            fin: '17:00'
          },
          dias_trabajo: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'],
          tarifa_base: 200
        },
        {
          nombre: 'Carlos',
          apellido: 'Rodríguez',
          email: 'carlos.rodriguez@katzenvet.com',
          telefono: '555-0102',
          especialidad: 'Corte de razas específicas',
          experiencia_anos: 8,
          horario_trabajo: {
            inicio: '09:00',
            fin: '18:00'
          },
          dias_trabajo: ['Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
          tarifa_base: 250
        }
      ];

      for (const peluqueroData of peluquerosEjemplo) {
        await this.crearPeluquero(peluqueroData);
      }

      console.log('✅ Peluqueros de ejemplo creados exitosamente');
    } catch (error) {
      console.error('❌ Error al crear peluqueros de ejemplo:', error);
      throw error;
    }
  }
}
