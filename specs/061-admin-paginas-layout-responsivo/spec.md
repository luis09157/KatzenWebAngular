# Spec: Layout responsivo de páginas admin (regla permanente)

**ID:** 061-admin-paginas-layout-responsivo  
**Estado:** in_progress  
**Fecha:** 2026-08-31  
**Autor:** Cursor (Grok) / Luis Alfonso Niño Martínez  

---

## Problema

El expediente del paciente (página `/admin/paciente`, p. ej. Oreon) fuerza un **grid de 3 columnas** con media queries sobre el **viewport**, no sobre el ancho útil de `.admin-content`. El sidenav fijo (~280px) + padding de página dejan un contenido más estrecho que el breakpoint: las cards se pegan, la toolbar de acciones deja «Cuenta del día» huérfana, el buscador recorta el label, el bloque DUEÑO queda sin aire y la timeline se aplasta.

**059 cubre diálogos/modales.** Esta spec cubre **páginas y shells admin** (grid, wrapping, padding, buscadores, toolbars, timelines, KPIs, tablas). Es una **regla permanente de UI**, no un arreglo one-off del expediente.

Causa raíz: `grid-template-columns` fijos (`280px … minmax(300px, 340px)`, `repeat(3, …)`) + `@media (max-width: 1200px)` medido en viewport. El sidenav no entra en esa cuenta.

---

## User stories

### US-1 — Grids fluidos en páginas admin

Como **staff**  
Quiero **que las columnas se apilen cuando el ancho útil no las aguanta**  
Para **leer expedientes, dashboards y CRUD sin cards pegadas ni overflow horizontal**

**Criterios de aceptación:**

- [x] SC-001: Los grids de página (expediente, KPIs, hubs, POS home) **no** fuerzan N columnas si el ancho útil de `.admin-content` no las cabe. Fluido: 3 → 2 → 1. Breakpoints sobre **ancho útil** (container query `admin-page`), no solo viewport. Guía: ≥ ~1100px útil → 3 cols si el layout lo pide; ~720–1099 → 2; &lt;720 → 1.
- [x] SC-002: En desktop ancho (≥1200px de viewport **y** contenido útil suficiente) se aprovecha `.admin-content` (regla 9): no `max-width` interno que deje huecos mientras el texto se aplasta. Responsivo ≠ “todo chiquito”.
- [x] SC-003: Gap entre cards/columnas de página ≥16px (ideal 20–24px en desktop). Sin overflow horizontal de cards.

### US-2 — Toolbars y buscadores

Como **staff**  
Quiero **botones que envuelvan alineados y un buscador que se lea entero**  
Para **no perder acciones ni recortar placeholders/labels**

**Criterios de aceptación:**

- [x] SC-004: Filas de botones (banner, `.admin-toolbar`, acciones de expediente) usan `flex-wrap` + gap uniforme; los que bajan de línea quedan **alineados al inicio**, no huérfanos a la derecha. `matTooltip` no tapa la card de abajo (`position="below"` + aire bajo la toolbar).
- [x] SC-005: Buscadores: el input/label no recorta texto; `min-width` flexible. En estrecho el botón «Nuevo» pasa debajo o a full width. `.panel-search` sigue alineado (regla 11) donde aplica.

### US-3 — Padding de cards y densidad de listas

Como **staff**  
Quiero **texto con padding y listas scaneables**  
Para **que bloques DUEÑO / KPI / resumen y timelines no se vean pegados**

**Criterios de aceptación:**

- [x] SC-006: Cards/paneles de página tienen padding interno mínimo razonable (≥16px; bloques acento tipo DUEÑO ≥20px). No texto pegado al borde.
- [x] SC-007: Timelines/listas de actividad: gap vertical scaneable (~8–12px entre ítems). No densidad de “todo pegado”.
- [x] SC-008: Nombres, chips y columnas de tabla: reglas 5–6 de arquitectura siguen vigentes.

### US-4 — Documentación permanente

Como **agente / desarrollador**  
Quiero **la regla en spec, arquitectura, Cursor y QA**  
Para **no repetir el pedido en cada pantalla**

**Criterios de aceptación:**

- [x] SC-009: Documentado en `docs/ADMIN-UI-ARCHITECTURE.md` (regla 13), `.cursor/rules/admin-ui-architecture.mdc`, `qa-validation-guide.md`, `sdd-workflow.mdc`, `AGENTS.md` y `specs/README.md`.

---

## Fuera de alcance

- Diálogos/modales (spec **059**): no reabrir salvo que una **página** viole 059
- Auth / portal / landing (regla 10): fuera de foco salvo el mismo patrón roto en shell admin
- Rediseño de branding (colores teal, identidad de cards)
- Cambios de flujos (abrir cita, guardar, RTDB)
- `git commit` / `git push` / `firebase deploy`
- Credenciales o datos de producción (`katzen-a0e3e`)

---

## Contratos de Datos y UI (Obligatorio)

- **Impacto en Firebase RTDB:** Ninguno. Solo CSS/HTML de páginas admin y documentación. App móvil no afectada.

  | Nodo | Lectura | Escritura | Notas |
  |------|---------|-----------|-------|
  | — | no | no | sin cambios de contrato |

- **Estrategia de Datos de Prueba:** Smoke visual en localhost (`http://localhost:4200`) con sesión staff ya abierta o mocks. **Prohibido** inventar o usar credenciales de `katzen-a0e3e`. Si no hay login staff, la spec queda `in_progress` con el blocker anotado.

- **Patrones UI Reutilizados:** `.admin-page`, `app-admin-kpi-grid`, `app-admin-page-banner`, `app-admin-data-panel`, `.panel-search`, `.admin-toolbar`, tokens `--admin-*` / `--katzen-verde`. CSS canónico en `src/styles/admin-page-layout.scss` y `admin-crud.scss`. Encapsulación de componentes solo si pisan el global.

---

## Roles

| Rol staff | ¿Accede? |
|-----------|----------|
| administrador | sí (todas las páginas admin) |
| doctor | sí (módulos de su matriz) |
| recepcionista | sí (módulos de su matriz) |

Sin cambios de permisos.

---

## UI (rutas y layout)

- Prioridad 1: `/admin/paciente` (expediente, no el diálogo ficha 058)
- Prioridad 2: dashboards (`/admin/inicio`), CRUD que compartan grid/toolbar/KPI, POS home si comparte shell
- Breakpoints de **contenido útil** (container `admin-page` en `.admin-content`)

---

## Backend

- [ ] Cloud Function: no
- [ ] Reglas RTDB: no
- [ ] Email / integración externa: no

---

## Testing mínimo

Ver `tasks.md` sección Testing. Viewports de smoke: ~1280, ~900, ~375 (el sidenav sigue visible en 1280/900; el grid debe responder al ancho útil).

---

## Notas / decisiones

- **059 vs 061:** 059 = overlay/diálogos. 061 = páginas. No mezclar selectores de dialog en esta entrega.
- Container queries (`container-name: admin-page`) sobre `.admin-content` para que el sidenav deje de “mentir” a los `@media` de viewport.
- Desktop ancho sigue regla 9: si cabe, 3 columnas con aire; si no, apilar. No encoger todo a 1 col en 1440px útil.
