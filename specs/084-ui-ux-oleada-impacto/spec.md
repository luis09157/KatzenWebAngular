# Spec: UI/UX oleada de impacto (post PLAN-UX 1–4)

**ID:** 084-ui-ux-oleada-impacto  
**Estado:** done  
**Fecha:** 2026-10-01  
**Autor:** Agente (Luis)  
**Nivel:** L2  

---

## Problema

Las fases 1–4 de `PLAN-UX-VETERINARIAS.md` ya quitaron fricción de flujos (POS venta rápida, «Llegó un paciente», menú por rol, Hoy, etc.). Quedan **detalles de UI/UX de alto impacto diario**: CTAs poco claros en móvil, carrito POS vacío sin acción, leyendas de tablas inconsistentes, Swal con azul Material fuera de marca, empty states fríos en portal, polish menor del login en landing, y **grids densos que no reflowean** (p. ej. catálogo POS «Nueva venta»: 4 columnas fijas → nombres truncados e ilegibles).

Esta oleada es **concreta** (mejoras acotadas), no un rediseño total.

---

## User stories

### US-1 — Hub Hoy usable en tablet/móvil

Como **recepcionista**  
Quiero ver «Llegó un paciente» y «Atender» como acciones claras  
Para no perder el paciente en la puerta.

**Criterios de aceptación:**

- [x] SC-001: En ≤720px el CTA primario «Llegó un paciente» ocupa el ancho útil y destaca tipográficamente.
- [x] SC-002: Botones «Atender» en citas de hoy tienen hit target ≥44px y estilo primario teal.

### US-2 — POS carrito vacío accionable

Como **cajero/a**  
Quiero que el sheet del carrito vacío me diga qué hacer  
Para no quedarme mirando «Sin artículos».

**Criterios de aceptación:**

- [x] SC-003: Sheet carrito vacío muestra copy humano + CTA «Agregar producto» que cierra el sheet y deja en riel petshop.
- [x] SC-004: Barra sticky del carrito tiene contraste claro (fondo soft / borde) y targets ≥44px.

### US-3 — Portal home / expediente más humanos

Como **dueño**  
Quiero empty states con siguiente paso y chips de actividad visibles  
Para entender qué hay (o qué falta) sin jerga.

**Criterios de aceptación:**

- [x] SC-005: Empty de mascotas incluye CTA de llamada a la clínica (`portal-clinica-contacto`).
- [x] SC-006: Chips de actividad con contraste legible; empty de cartilla con tono humano.

### US-4 — Tablas admin consistentes

Como **staff**  
Quiero la leyenda «Doble clic…» donde sí hay doble clic  
Para descubrir el atajo sin adivinar.

**Criterios de aceptación:**

- [x] SC-007: `showLegend` activo en listados con doble clic (productos lista, movimientos, proveedores).
- [x] SC-008: Hover de filas interactivas con tinte teal suave (tokens existentes).

### US-5 — Alertas alineadas a marca

Como **staff**  
Quiero confirmaciones/errores en teal Katzen, no azul Material  
Para coherencia visual en pantallas clave.

**Criterios de aceptación:**

- [x] SC-009: Existe `KatzenSwal` (`Swal.mixin` con `--katzen-verde`) y se usa en Hoy, POS listado e historiales (reemplaza `#3085d6` donde aplique).

### US-6 — Empty / loading en listados críticos + login landing

Como **staff / dueño**  
Quiero empty con CTA en Hoy (sin citas) y login landing usable  
Para no quedarme sin siguiente paso.

**Criterios de aceptación:**

- [x] SC-010: En Hoy, si no hay citas, panel vacío con CTA «Llegó un paciente».
- [x] SC-011: Modal login landing: autofocus correo, Escape cierra, FAB detrás del backdrop (z-index).

### US-7 — Responsive táctil (web + tablet): grids densos legibles

Como **cajero/a o staff en mostrador (PC o tablet)**  
Quiero que catálogos, grids de productos y pantallas densas **refloween** según el ancho útil y sean usables al tacto  
Para identificar productos **aunque no tengan foto**, leer precios y tocar targets ≥44px sin apretujar columnas.

**Contexto (ejemplo real):** diálogo POS «Nueva venta» — sin imágenes el tile solo mostraba icono + precio (el nombre desaparecía por `-webkit-line-clamp` en conflicto), inutilizable en mostrador.

**Criterios de aceptación:**

- [x] SC-012: Catálogo POS (`.pos-grid`) columnas responsivas **1 → 2 → 3** (no 4 fijas); estilos globales en `admin-dialog.scss` (overlay CDK); diálogo desktop ~1280px; panel ticket más estrecho.
- [x] SC-013: Documentado en `docs/ADMIN-UI-ARCHITECTURE.md`: grids densos y diálogos fullscreen reflowean por **ancho útil**; bajar columnas antes de truncar.
- [x] SC-014: Auditoría sistema (2026-10-01) contra reglas US-7 — ver `tasks.md` § Auditoría SC-014. Correcciones aplicadas: inventario cards (altura fija), portal-stats reflow. KPI/admin-crud/inventario-dialog/POS-home ya cumplían container queries. Follow-up residual: hit targets secundarios &lt;44px en banners/icon buttons (no bloquean cobro).
- [x] SC-015: **Nombre del producto/servicio siempre visible** en la tarjeta (≥ ~0.94rem, contraste slate, hasta ~2 líneas), **con o sin foto**. Placeholder de foto compacto (~72–88px) para no robar espacio al copy. Copy vacío del ticket: «Toca un producto…» (no «foto»).
- [x] SC-016: Diseño pensado **web desktop + tablet táctil** (mostrador): hit targets de chips/tarjeta ≥44px; layout POS usable en ~720–1024 de ancho útil sin depender de hover.
- [x] SC-017: Tarifas baño/`BACO*` (y similares sin anaquel) **seleccionables** aunque `stock_actual=0`; contraste nombre/precio pleno (no estado disabled/opacidad); no disparan `registrarSalida`.

### Lecciones aprendidas (no repetir — 2026-10-01)

| Síntoma | Causa | Regla |
|---------|-------|--------|
| Tarjetas = «rayitas» verdes | `aspect-ratio` + `max-height` + `min-width:0` en grid | Foto con **altura fija** (px); no combinar ratio+max-height |
| Estilos del componente «no pegan» en el modal | Diálogo en overlay CDK | Reglas críticas en `admin-dialog.scss` bajo `.admin-dialog-panel--pos` (+ `app-visita-dialog { display:block }`) |
| Nombre invisible, precio sí | `-webkit-line-clamp` con `display:block !important` | No mezclar; nombre con `display:block` y `max-height` en ems |
| Texto apagado + no click | `productoSinStock` → `disabled` + opacity 0.45 en baños stock 0 | Usar `productoDescuentaInventarioPos` (BACO/EXAM/baño-tarifa); skip `registrarSalida` |
| Copy «Toca una foto» | Asume imagen | «Toca un producto…» |

**Código canónico:** `productoDescuentaInventarioPos` / `productoSinStock` en `core/utils/producto-search.util.ts`; CSS POS en `styles/admin-dialog.scss`; grid en `visita-dialog.component.scss`.

---

## Fuera de alcance

- Rediseño purple / cards por doquier / cambiar `admin-dialog-shell`
- L3 RTDB / rules / functions / deploy
- Rewrite modular POS (075–082 ya cubren sheets)
- Migrar **todos** los `Swal.fire` del repo (solo pantallas clave + mixin reutilizable)
- Auditoría exhaustiva de **cada** pantalla del producto en una sola PR (SC-014 prioriza POS + documentar regla; el resto se cierra por follow-up registrado en `tasks.md`)

---

## Contratos de Datos y UI

- **Impacto en Firebase RTDB:** ninguno (solo CSS/HTML/TS presentacional).
- **Estrategia de Datos de Prueba:** localhost + mocks/emulador; capturas en `/tmp/kz-084/`.
- **Patrones UI:** tokens `--katzen-verde*`, `admin-data-panel`, `btn-primary-teal`, `portal-clinica-contacto`, sheets POS 081–082.

---

## Roles

| Rol staff | ¿Accede? |
|-----------|----------|
| administrador | sí |
| doctor | sí (Hoy / POS según 072) |
| recepcionista | sí |
| cliente portal | sí (home / expediente) |

---

## UI (rutas)

- `/admin/inicio` (Hoy)
- `/admin/visitas` + diálogo POS
- `/portal/mascotas`, expediente
- Landing modal login
- Listados: productos, movimientos, proveedores

---

## Backend

- [ ] Cloud Function — no
- [ ] Reglas RTDB — no

---

## Rollback

Revertir archivos de la oleada (git); sin migración de datos.

---

## Oleada 2 (fuera de esta entrega)

Documentar en `tasks.md` / PLAN-UX: densificar resto de Swal, empty states restantes, timepicker polish, tipografía menú lateral, etc.
