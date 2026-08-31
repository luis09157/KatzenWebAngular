/** Labels de toolbar admin por segmento de ruta (spec 049). */
export const ADMIN_ROUTE_LABELS: Record<string, string> = {
  inicio: 'Inicio',
  paciente: 'Buscar paciente',
  'pacientes-admin': 'Directorio de pacientes',
  clientes: 'Clientes',
  'contactos-web': 'Contactos web',
  citas: 'Citas',
  historiales: 'Historiales',
  vacunas: 'Vacunas',
  recordatorios: 'Recordatorios',
  banios: 'Peluquería',
  inventario: 'Inventario',
  productos: 'Productos',
  movimientos: 'Movimientos',
  proveedores: 'Proveedores',
  ordenes: 'Órdenes de compra',
  alertas: 'Alertas',
  reportes: 'Reportes',
  finanzas: 'Caja / finanzas',
  'servicios-clinica': 'Servicios de clínica',
  visitas: 'Punto de venta',
  pension: 'Pensión',
  consentimientos: 'Consentimientos',
  usuarios: 'Personal y portal'
};

/** Resuelve label para URL admin (ej. `/admin/inventario/productos` → Productos). */
export function resolveAdminRouteLabel(url: string): string {
  const path = url.split('?')[0].replace(/\/+$/, '');
  if (!path.startsWith('/admin')) {
    return 'Admin';
  }
  const segments = path.replace(/^\/admin\/?/, '').split('/').filter(Boolean);
  if (!segments.length) {
    return ADMIN_ROUTE_LABELS['inicio'];
  }
  for (let i = segments.length - 1; i >= 0; i--) {
    const label = ADMIN_ROUTE_LABELS[segments[i]];
    if (label) {
      return label;
    }
  }
  return 'Admin';
}
