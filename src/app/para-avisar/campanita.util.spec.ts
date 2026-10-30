import { fechaCortaAviso, itemsCampanita, textoGlobito } from './campanita.util';
import { AvisoPendiente } from './para-avisar.util';

describe('campanita.util (spec 117)', () => {
  const hoy = '2026-10-29';
  const base: Omit<AvisoPendiente, 'clave' | 'tipo' | 'fecha' | 'hora' | 'mascotas' | 'dueno' | 'detalle'> = {
    refs: [],
    clienteId: 'c',
    telefono10: null,
    mensaje: '',
    whatsappUrl: '',
  };
  const aviso = (p: Partial<AvisoPendiente>): AvisoPendiente =>
    ({ ...base, clave: 'k', tipo: 'banio_manana', fecha: '', hora: '', mascotas: [], dueno: '', detalle: '', ...p }) as AvisoPendiente;

  it('fecha corta: hoy, mañana, ayer y otros días', () => {
    expect(fechaCortaAviso('2026-10-29', hoy)).toBe('Hoy');
    expect(fechaCortaAviso('2026-10-30', hoy)).toBe('Mañana');
    expect(fechaCortaAviso('2026-10-28', hoy)).toBe('Ayer');
    expect(fechaCortaAviso('2026-11-03', hoy)).toBe('mar 3 nov');
    expect(fechaCortaAviso('', hoy)).toBe('');
  });

  it('renglones con su pantalla, ordenados por fecha y hora', () => {
    const items = itemsCampanita(
      [
        aviso({ clave: 'b2', tipo: 'banio_manana', fecha: '2026-10-30', hora: '13:00', mascotas: ['Milo'], dueno: 'Karla Rojas' }),
        aviso({ clave: 'b1', tipo: 'banio_manana', fecha: '2026-10-30', hora: '11:30', mascotas: ['Pulga'], dueno: 'Yuliana Soto' }),
        aviso({ clave: 'c1', tipo: 'cita_manana', fecha: '2026-10-30', hora: '18:00', mascotas: ['Kira', 'Firu'], dueno: 'Johana' }),
        aviso({ clave: 'r1', tipo: 'recordatorio', fecha: '2026-11-03', mascotas: ['Coco'], dueno: 'Ale', detalle: 'Vacuna Triple' }),
      ],
      hoy
    );
    expect(items.map((i) => i.clave)).toEqual(['b1', 'b2', 'c1', 'r1']);
    expect(items[0]).toEqual({
      clave: 'b1',
      icono: 'spa',
      titulo: 'Baño mañana · Pulga',
      detalle: 'Yuliana Soto · Mañana 11:30 a.m.',
      ruta: '/admin/banios',
    });
    expect(items[2].titulo).toBe('Cita mañana · Kira y Firu');
    expect(items[2].ruta).toBe('/admin/citas');
    expect(items[3].detalle).toBe('Ale · mar 3 nov · Vacuna Triple');
    expect(items[3].ruta).toBe('/admin/recordatorios');
  });

  it('«ya toca baño» muestra cuándo fue el último', () => {
    const [i] = itemsCampanita(
      [aviso({ tipo: 'banio_proximo', fecha: hoy, mascotas: ['Kira'], dueno: 'Johana', detalle: 'Último baño 29 sep' })],
      hoy
    );
    expect(i.titulo).toBe('Ya toca baño · Kira');
    expect(i.detalle).toBe('Johana · Último baño 29 sep');
  });

  it('número del globito', () => {
    expect(textoGlobito(0)).toBe('');
    expect(textoGlobito(2)).toBe('2');
    expect(textoGlobito(120)).toBe('99+');
  });
});
