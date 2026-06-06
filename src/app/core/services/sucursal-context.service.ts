import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface SucursalConfig {
  id: string;
  nombre: string;
}

@Injectable({ providedIn: 'root' })
export class SucursalContextService {
  private readonly storageKey = 'katzen.sucursalId';
  private readonly selectedIdSubject = new BehaviorSubject<string>(
    environment.defaultSucursalId || 'principal'
  );

  readonly selectedId$ = this.selectedIdSubject.asObservable();
  readonly sucursales: SucursalConfig[] = environment.sucursales || [];

  constructor() {
    const saved = sessionStorage.getItem(this.storageKey);
    if (saved && this.sucursales.some(s => s.id === saved)) {
      this.selectedIdSubject.next(saved);
    }
  }

  getSelectedId(): string {
    return this.selectedIdSubject.value;
  }

  getSelectedNombre(): string {
    return this.sucursales.find(s => s.id === this.getSelectedId())?.nombre || 'Sucursal';
  }

  setSelectedId(id: string): void {
    if (!this.sucursales.some(s => s.id === id)) {
      return;
    }
    sessionStorage.setItem(this.storageKey, id);
    this.selectedIdSubject.next(id);
  }

  stamp<T extends Record<string, unknown>>(data: T): T {
    if (data['sucursalId']) {
      return data;
    }
    return { ...data, sucursalId: this.getSelectedId() };
  }
}
