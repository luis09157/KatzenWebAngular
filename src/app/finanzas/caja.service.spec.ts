import { CajaService } from './caja.service';
import { BanioIngresoRefuerzo } from './caja.models';

describe('CajaService desgloseIngresosPorServicio (spec 039)', () => {
  let service: CajaService;

  beforeEach(() => {
    service = new CajaService({} as any, {} as any);
  });

  it('excluye baños con visitaId del refuerzo aunque no tengan cajaMovimientoId', () => {
    const banios: BanioIngresoRefuerzo[] = [
      {
        precio_total: 250,
        fecha_banio: '2026-08-26',
        estado: 'completado',
        activo: true,
        visitaId: 'vis-ticket-1'
      },
      {
        precio_total: 180,
        fecha_banio: '2026-08-26',
        estado: 'completado',
        activo: true
      }
    ];

    const rows = service.desgloseIngresosPorServicio([], 'dia', '2026-08-26', banios, []);
    const banioRow = rows.find((r) => r.categoria === 'banio');
    expect(banioRow?.total).toBe(180);
    expect(banioRow?.count).toBe(1);
  });

  it('incluye baño sin caja ni visita en refuerzo', () => {
    const banios: BanioIngresoRefuerzo[] = [
      {
        precio_total: 300,
        fecha_banio: '2026-08-26',
        estado: 'completado',
        activo: true,
        cajaMovimientoId: 'mov-directo'
      },
      {
        precio_total: 220,
        fecha_banio: '2026-08-26',
        estado: 'completado',
        activo: true
      }
    ];

    const rows = service.desgloseIngresosPorServicio([], 'dia', '2026-08-26', banios, []);
    const banioRow = rows.find((r) => r.categoria === 'banio');
    expect(banioRow?.total).toBe(220);
    expect(banioRow?.count).toBe(1);
  });
});
