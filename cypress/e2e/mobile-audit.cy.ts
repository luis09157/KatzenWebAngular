/**
 * Auditoría móvil (375×812) — solo lectura.
 *
 * Recorre los módulos admin en tamaño celular y mide lo que un humano nota al usarlo:
 *   - nada se sale de la pantalla a los lados
 *   - las tablas no son más anchas que el teléfono
 *   - los datos aparecen en la primera pantalla (no hay que bajar 1.5 pantallas)
 *   - los diálogos «Nuevo …» usan el ancho y sus campos son legibles (≥ 200px)
 *   - botones tocables (≥ 40px), inputs ≥ 16px (si no, iOS hace zoom)
 *   - páginas que no midan 20+ pantallas (falta paginar)
 *   - sin textos que pidan «doble clic» (no existe en celular)
 *
 * Abre diálogos de alta y los cierra con Escape SIN escribir nada. No guarda datos.
 *
 * Uso:
 *   npm run cy:mobile                       → falla si hay ERROR
 *   CYPRESS_mobileAuditSoft=1 npm run cy:mobile  → solo reporta (para medir avance)
 * Reporte: cypress/reports/mobile-audit.json
 */

type Nivel = 'ERROR' | 'AVISO';
interface Hallazgo {
  ruta: string;
  nivel: Nivel;
  regla: string;
  detalle: string;
}

const VW = 375;
const VH = 812;

/** btnNuevo: texto del botón que abre el alta (se abre y se cierra sin escribir). */
const RUTAS: Array<{ path: string; btnNuevo?: string }> = [
  { path: '/admin/inicio' },
  { path: '/admin/pacientes-admin', btnNuevo: 'Nuevo paciente' },
  { path: '/admin/paciente' },
  { path: '/admin/clientes', btnNuevo: 'Nuevo cliente' },
  { path: '/admin/citas', btnNuevo: 'Nueva cita' },
  { path: '/admin/banios', btnNuevo: 'Nuevo baño' },
  { path: '/admin/pension' },
  { path: '/admin/visitas' },
  { path: '/admin/recordatorios' },
  { path: '/admin/vacunas', btnNuevo: 'Nueva vacuna' },
  { path: '/admin/historiales' },
  { path: '/admin/inventario' },
  { path: '/admin/inventario/productos', btnNuevo: 'Nuevo producto' },
  { path: '/admin/inventario/movimientos' },
  { path: '/admin/inventario/proveedores' },
  { path: '/admin/inventario/ordenes' },
  { path: '/admin/inventario/alertas' },
  { path: '/admin/servicios-clinica' },
  { path: '/admin/finanzas' },
  { path: '/admin/usuarios' },
  { path: '/admin/configuracion' },
];

const hallazgos: Hallazgo[] = [];

function medirPagina(win: Window, ruta: string): Hallazgo[] {
  const doc = win.document;
  const out: Hallazgo[] = [];
  const add = (nivel: Nivel, regla: string, detalle: string) => out.push({ ruta, nivel, regla, detalle });
  const visible = (el: Element) => {
    const r = el.getBoundingClientRect();
    const cs = win.getComputedStyle(el);
    return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none';
  };

  // El admin no hace scroll en <html>: lo hace mat-sidenav-content.
  const scroller = (doc.querySelector('mat-sidenav-content') as HTMLElement | null) || doc.documentElement;

  // 1. Scroll horizontal de toda la página
  const sw = Math.max(doc.documentElement.scrollWidth, scroller.scrollWidth);
  if (sw > VW + 2) add('ERROR', 'pagina-desborda', `La página mide ${sw}px de ancho en una pantalla de ${VW}px.`);

  // 2. Tablas más anchas que la pantalla
  doc.querySelectorAll('table').forEach((t) => {
    if (!visible(t)) return;
    const w = Math.round(t.getBoundingClientRect().width);
    if (w > VW + 8) {
      add('ERROR', 'tabla-ancha', `Tabla .${(t.className || '').toString().split(' ').pop()} de ${w}px: hay que deslizar de lado. Usar tarjetas en celular.`);
    }
  });

  // 3. Primer dato visible (fila, tarjeta de lista, fila densa)
  const primero = Array.from(
    doc.querySelectorAll('tr.mat-mdc-row, .admin-dense-row, .admin-mobile-card, [data-audit="primer-dato"]'),
  ).find(visible);
  if (primero) {
    const y = Math.round(primero.getBoundingClientRect().top + scroller.scrollTop);
    if (y > VH * 0.6) {
      add(y > VH ? 'ERROR' : 'AVISO', 'datos-abajo',
        `El primer registro empieza en y=${y}px (pantalla = ${VH}px). Compactar encabezado/avisos/KPI en celular.`);
    }
  }

  // 4. Alto total (paginar)
  const alto = Math.max(doc.documentElement.scrollHeight, scroller.scrollHeight);
  if (alto > VH * 20) add('AVISO', 'pagina-muy-larga', `La página mide ${alto}px (${Math.round(alto / VH)} pantallas). Paginar o cargar por partes.`);

  // 5. Botones chicos para el dedo
  const chicos = Array.from(doc.querySelectorAll('.admin-content button, .admin-content a[href], .admin-content [role="button"]'))
    .filter(visible)
    .filter((b) => {
      const r = b.getBoundingClientRect();
      return r.height < 40 || r.width < 40;
    });
  if (chicos.length) add('AVISO', 'tap-chico', `${chicos.length} botón(es) de menos de 40×40px.`);

  // 6. Inputs < 16px → iOS hace zoom al tocarlos
  const inputsChicos = Array.from(doc.querySelectorAll('input, textarea, select'))
    .filter(visible)
    .filter((i) => parseFloat(win.getComputedStyle(i).fontSize) < 16);
  if (inputsChicos.length) add('AVISO', 'input-zoom-ios', `${inputsChicos.length} campo(s) con letra < 16px: iPhone hace zoom al escribir.`);

  // 7. Copy de doble clic
  const txt = (doc.querySelector('.admin-content') as HTMLElement | null)?.innerText || '';
  if (/doble clic/i.test(txt)) add('AVISO', 'copy-doble-clic', 'La pantalla dice «doble clic»: en celular no existe. Un toque debe abrir el detalle.');

  return out;
}

function medirDialogo(win: Window, ruta: string, boton: string): Hallazgo[] {
  const doc = win.document;
  const out: Hallazgo[] = [];
  const add = (nivel: Nivel, regla: string, detalle: string) => out.push({ ruta: `${ruta} › ${boton}`, nivel, regla, detalle });
  const pane = doc.querySelector('.cdk-overlay-pane') as HTMLElement | null;
  if (!pane) return [{ ruta, nivel: 'AVISO', regla: 'dialogo-no-abrio', detalle: `«${boton}» no abrió diálogo.` }];

  const pw = Math.round(pane.getBoundingClientRect().width);
  if (pw < VW * 0.9) add('ERROR', 'dialogo-angosto', `El diálogo mide ${pw}px de ${VW}px (${Math.round((pw / VW) * 100)}%).`);

  const campos = Array.from(pane.querySelectorAll('mat-form-field'))
    .map((f) => Math.round(f.getBoundingClientRect().width))
    .filter((w) => w > 0);
  const min = campos.length ? Math.min(...campos) : null;
  if (min !== null && min < 200) add('ERROR', 'campos-aplastados', `Campo más angosto: ${min}px (mínimo legible 200px).`);

  const cuerpo = pane.querySelector('mat-dialog-content, .admin-dialog-body') as HTMLElement | null;
  if (cuerpo && cuerpo.scrollWidth > cuerpo.clientWidth + 2) {
    add('ERROR', 'dialogo-desborda', `El contenido del diálogo mide ${cuerpo.scrollWidth}px en ${cuerpo.clientWidth}px.`);
  }
  return out;
}

describe('Auditoría móvil 375×812 (solo lectura)', () => {
  beforeEach(() => {
    cy.viewport(VW, VH);
    cy.loginAdmin();
  });

  RUTAS.forEach(({ path, btnNuevo }) => {
    it(`mide ${path}`, () => {
      cy.viewport(VW, VH);
      cy.visitAdminModule(path);
      cy.url({ timeout: 15000 }).should('include', path);
      cy.get('.loading-container', { timeout: 30000 }).should('not.exist');
      cy.get('.global-loading-overlay', { timeout: 30000 }).should('not.exist');
      // cerrar el menú lateral (en celular se abre encima)
      cy.get('body').type('{esc}', { force: true });
      cy.wait(800);

      cy.window().then((win) => {
        hallazgos.push(...medirPagina(win, path));
      });

      if (btnNuevo) {
        cy.get('body').then(($b) => {
          const $btn = $b.find(`button:contains("${btnNuevo}")`).filter(':visible').first();
          if (!$btn.length) {
            hallazgos.push({ ruta: path, nivel: 'AVISO', regla: 'boton-no-encontrado', detalle: `No se encontró «${btnNuevo}».` });
            return;
          }
          cy.wrap($btn).click({ force: true });
          cy.get('.cdk-overlay-pane', { timeout: 15000 }).should('exist');
          cy.wait(600);
          cy.window().then((win) => {
            hallazgos.push(...medirDialogo(win, path, btnNuevo));
          });
          cy.get('body').type('{esc}', { force: true });
          cy.get('mat-dialog-container', { timeout: 10000 }).should('not.exist');
        });
      }
    });
  });

  after(() => {
    const errores = hallazgos.filter((h) => h.nivel === 'ERROR');
    cy.writeFile('cypress/reports/mobile-audit.json', {
      fecha: new Date().toISOString(),
      viewport: `${VW}x${VH}`,
      errores: errores.length,
      avisos: hallazgos.length - errores.length,
      hallazgos,
    });
    const resumen = hallazgos.map((h) => `${h.nivel} ${h.regla} ${h.ruta}: ${h.detalle}`).join('\n');
    cy.log(resumen || 'Sin hallazgos');
    if (errores.length && !Cypress.env('mobileAuditSoft')) {
      throw new Error(`Auditoría móvil: ${errores.length} error(es).\n${errores.map((e) => `• ${e.ruta}: ${e.detalle}`).join('\n')}`);
    }
  });
});
