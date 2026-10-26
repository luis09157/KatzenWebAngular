# Spec: Panel admin usable en celular

**ID:** 095-movil-usable
**Estado:** in_progress
**Fecha:** 2026-10-25
**Autor:** Claude (auditoría a 375×812 sobre producción, solo lectura) — pendiente OK de Luis

---

## Problema

El personal usa el panel en el teléfono y «no es nada usable». Medición real en producción (2026-10-25, 375×812):

| Pantalla | Medición |
|----------|----------|
| Todos los diálogos | 300px de 375 (80%): `width: min(100%, var(--mat-dialog-container-max-width))` = 80vw |
| Nuevo paciente | campos de **43px** (solo se ve «N…»): regla móvil perdía por especificidad |
| Clientes | tabla de **1,100px**; primer cliente en y=619 de 812 |
| Peluquería | primer registro en y=1,232 (más de una pantalla abajo) |
| Productos | página de **70,700px** (87 pantallas), sin paginar |
| Pacientes | 1,363 filas dibujadas; texto «Doble clic abre la ficha» |

Causas de proceso: el canal declarado en `ADMIN-UI-ARCHITECTURE` era «web desktop + tablet»; la 061 decidió scroll horizontal con `min-width` 880–1280px y difirió las tarjetas; Cypress corre solo a 1366×768; «smoke 375 OK» no tenía números, así que nada fallaba.

---

## User stories

### US-1 — Diálogos a todo el ancho (HECHO en esta rama)

- [x] SC-001: Diálogos `admin-dialog-panel` ≥ 90% del ancho a ≤640px (`admin-dialog.scss`).
- [x] SC-002: Nuevo paciente a 1 columna; campos ≥ 200px (`paciente-admin-dialog.component.scss`). Verificado inyectando el CSS en prod: 43px → 266px.

### US-2 — Datos en la primera pantalla

Como **recepción en el teléfono**, quiero ver registros sin bajar, para atender rápido.

- [ ] SC-003: ≤600px: banner sin descripción, `app-flow-hint` colapsado, contador como chip; solo título + «+ Nuevo» + buscador.
- [ ] SC-004: Primer registro arriba de y=490 en Clientes, Pacientes, Peluquería, Citas (lo mide `cy:mobile`).

### US-3 — Tarjetas en lugar de tablas (reemplaza la decisión «Tablas admin móvil» de 061)

- [ ] SC-005: Componente compartido `app-admin-mobile-list` (o `*ngIf` con `BreakpointObserver` en ≤600): tarjeta con título, 2 líneas de meta, chip de estado, menú ⋮. Clase `.admin-mobile-card`.
- [x] SC-006a: **Piloto Clientes (2026-10-25):** ≤600px tarjetas con nombre completo, deuda, teléfono (toque = llamar), expediente, portal; «Ver ficha», «Cuenta del día» y ⋮. Mismo filtro/paginador que la tabla (`dataSource.connect()`). Escritorio sin cambios. Pedido de Luis con captura del S25 Ultra (íconos encimados sobre el nombre).
- [ ] SC-006b: luego Pacientes, Peluquería, Citas, Vacunas, Recordatorios, Productos (lista).
- [x] SC-007 (Clientes): un toque en la tarjeta abre la ficha; copy «Toca un cliente…».

### US-4 — Listas largas

- [ ] SC-008: Productos y Pacientes cargan por partes (paginador o «Ver más» de 50); ninguna página > 20 pantallas.

### US-5 — Deuda CSS (no bloquea US-2..4)

- [ ] SC-009: Bajar la línea base de `check:mobile` de 17 a 0 (botones de diálogo que no se apilan, paddings, título).
- [ ] SC-010: Unificar breakpoints a 600/900/1200 en archivos tocados.

---

## Fuera de alcance

- Rediseño de escritorio; branding; portal y landing (ya pasan a 375).

---

## Impacto en Firebase RTDB

Ninguno. Solo CSS/HTML/TS de presentación. App móvil no afectada.

---

## Validación (L2)

`npm run build` · `npm run check:mobile` (0 nuevos) · `npm run cy:mobile` con reporte en `tasks.md` antes/después · smoke 1280 sin regresiones.
