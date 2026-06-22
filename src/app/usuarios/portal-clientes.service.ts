import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ClientesService } from '../clientes/clientes.service';
import { Cliente } from '../core/models';

export type PortalClienteRow = Cliente & {
  id: string;
  nombreCompleto: string;
  tieneCorreo: boolean;
  portalActivo: boolean;
  tieneAuthUid: boolean;
};

export interface PortalClientesLists {
  conPortal: PortalClienteRow[];
  pendientes: PortalClienteRow[];
  sinCorreo: PortalClienteRow[];
}

@Injectable({ providedIn: 'root' })
export class PortalClientesService {
  constructor(private clientesService: ClientesService) {}

  getPortalClientesLists(): Observable<PortalClientesLists> {
    return this.clientesService.getClientes().pipe(
      map(clientes => this.clasificar(clientes || []))
    );
  }

  private clasificar(clientes: Cliente[]): PortalClientesLists {
    const rows = clientes
      .filter(c => c.activo !== false && c.id)
      .map(c => this.toRow(c));

    const conPortal = rows.filter(r => r.tieneAuthUid && r.portalActivo);
    const pendientes = rows.filter(r => !(r.tieneAuthUid && r.portalActivo) && r.tieneCorreo);
    const sinCorreo = rows.filter(r => !(r.tieneAuthUid && r.portalActivo) && !r.tieneCorreo);

    return { conPortal, pendientes, sinCorreo };
  }

  private toRow(cliente: Cliente): PortalClienteRow {
    const id = String(cliente.id);
    const correo = String(cliente.correo || '').trim();
    return {
      ...cliente,
      id,
      nombreCompleto: [cliente.nombre, cliente.apellidoPaterno, cliente.apellidoMaterno]
        .filter(Boolean)
        .join(' ')
        .trim() || 'Sin nombre',
      tieneCorreo: this.tieneCorreoValido(correo),
      portalActivo: (cliente as Record<string, unknown>)['portalActivo'] === true,
      tieneAuthUid: !!(cliente as Record<string, unknown>)['authUid']
    };
  }

  private tieneCorreoValido(correo: string): boolean {
    const v = correo.trim().toLowerCase();
    if (!v) return false;
    if (v === 'n/p' || v === 'n/a') return false;
    if (v.includes('no proporcionado') || v.includes('sin email') || v.includes('sin correo')) {
      return false;
    }
    return true;
  }
}
