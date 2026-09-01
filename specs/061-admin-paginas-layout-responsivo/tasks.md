# Tasks: Layout responsivo de páginas admin

**Spec:** `specs/061-admin-paginas-layout-responsivo/spec.md`  
**Plan:** `specs/061-admin-paginas-layout-responsivo/plan.md`  

---

## Implementación

### Setup

- [x] Carpeta spec creada y revisada con usuario
- [x] Plan aprobado (Contratos + Mitigación rellenados)

### Backend

- [x] N/A — sin RTDB ni Cloud Functions

### Frontend

- [x] Tokens + container `admin-page` en `.admin-content`
- [x] Banner / toolbar wrap canónico
- [x] KPI grid fluido (container)
- [x] Expediente pacientes: grid 3→2→1, dueño padding, timeline gap, tooltips below
- [x] Baños embebidos: buscador sin clip + stack
- [x] Dashboard hub + POS home: mismos breakpoints de útil
- [x] Documentación permanente (regla 13, Cursor, QA, SDD, AGENTS, README)
- [x] Audit staff localhost: hub 3.ª card span, feature-grid 3→2→1, POS last-child, KPI gap, POS catálogo 2 cols en estrecho, wrap acciones expediente

### Integración

- [x] Convive con spec 059 (`admin-dialog.scss` no modificado; visita POS grid 430px pasó de 3 a 2 cols)
- [x] Sin cambios de flujo ni branding

---

## Testing

> **Quién ejecuta:** el agente (autónomo / multitask). El usuario **no** es el QA por defecto.  
> Guía: `specs/templates/qa-validation-guide.md` · Regla: `.cursor/rules/sdd-workflow.mdc` → Validación pre-entrega.

Ejecutar y marcar **solo tras registrar evidencia** en la sección exhaustiva:

- [x] `npm run build` — exit 0
- [x] `npm run functions:build` — N/A
- [x] Servidor local activo (`npm start` → http://localhost:4200) + smoke visual de lo tocado
- [x] Manual localhost autenticado: recorrido staff + expediente Oreon + CRUD/diálogos en ~1280 (fallos también ~900 / ~375)
- [x] Manual/mock localhost: un error controlado — N/A (solo CSS)
- [x] `npm run cy:admin` — no (sin ruta nueva)
- [x] E2E específico — N/A

**Resultado:** login staff OK en http://localhost:4200 (no hosting). Recorrido sidenav + diálogos. Expediente Oreon 2→1 cols según útil. Build exit 0.

```
npm run build → exit 0 (15.0s)
Warning preexistente: bundle initial exceeded maximum budget (2.37 MB vs 2.00 MB). Sin errores de tipado.
Build at: 2026-09-01T02:40:04.440Z — Hash: 5dca411283a9715b
```

---

## Testing y validación exhaustiva

> **Guía obligatoria:** `specs/templates/qa-validation-guide.md`  
> **Regla:** el agente ejecuta **todas** las validaciones aplicables **antes de entregar**. Registrar resultados en esta sección **antes** de marcar `[x]` en cualquier tarea de implementación o testing.

### Checklist pre-entrega

- [x] Guía QA completa aplicada (§1–§4 + §2.6 spec 061)
- [x] `npm run build` OK y reportado
- [x] Live preview :4200 vivo + smoke visual autenticado
- [x] Tabla de resultados rellenada (abajo)
- [x] UI recientes verificadas si aplican (chips, `--picker`, loading, timepicker, diálogos spec 059, **páginas spec 061**)

### 1. Formularios y validaciones de entrada

- [x] **Campos vacíos:** N/A (no se tocan bindings)
- [x] **Tipos erróneos:** N/A
- [x] **Límites / desbordamiento:** wrap/`min-width: 0`; sin overflow-x en páginas auditadas
- [x] **Chips/badges de estado:** reglas 5–6 no tocadas

### 2. Interfaz, ventanas y modales

- [x] **Diálogos:** abiertos en listados (Nuevo / ficha); padding interno spec 059 OK en 1280; `admin-dialog.scss` no modificado
- [x] **Pickers compactos:** N/A
- [x] **Timepicker:** N/A (citas diálogo muestra campo hora; no se reabrió 059)
- [x] **Retroalimentación:** N/A
- [x] **Loading contextual:** N/A
- [x] **Loading no trabado:** N/A
- [x] **Doble submit:** N/A

### 2.6 Páginas admin (spec 061)

- [x] Grid 3→2→1 según ancho **útil** — container `admin-page`; expediente 2 cols a útil 1000, 1 col a 620/375
- [x] Toolbar wrap: botones expediente alineados al inicio; tooltip `below`
- [x] Buscador: sin clip de label; panel-search alineado
- [x] Cards: padding DUEÑO 22px medido en expediente Oreon
- [x] Timeline: gap `--admin-gap-timeline` (10px); Oreon tenía 0 ítems (CSS listo, lista vacía)
- [x] Viewports ~1280 / ~900 / ~375 expediente autenticado (Oreon)

### 3. Casos límite y errores de red

- [x] **Red lenta / sin conexión:** N/A
- [x] **Datos nulos RTDB:** N/A (no se cambió binding)

### 4. Integridad final

- [x] **`npm run build`** ejecutado — exit 0
- [x] **Servidor local :4200** activo + smoke visual anotado
- [x] **Resultados registrados** en la tabla de abajo

### Registro de resultados QA

**Iteración 2026-08-31 (CSS inicial, sin sesión)** — PARCIAL, blocker login.

**Iteración 2026-08-31 noche (audit staff localhost)** — login OK; útil ~1000px a viewport 1280 con sidenav.

| Escenario | Resultado | Notas |
|-----------|-----------|-------|
| Formularios — campos vacíos | N/A | solo CSS |
| UI — diálogos spec 059 | OK | padding interno; ficha Pepe tabs visibles + hero compacto; POS «Nueva venta» stepper OK |
| UI — páginas spec 061 | OK + fixes | ver tabla de recorrido |
| Servidor local :4200 + smoke | OK | `ng serve` vivo |
| Build `npm run build` | OK | exit 0; budget 2.37 MB preexistente |

### Recorrido staff (pantalla \| viewport \| OK/FALLO \| corrección)

Útil medido en `.admin-content`. Viewport 1280 → útil ~1000 (sidenav ~280). Viewport 900 → útil ~620 (sidenav still side). Viewport 375 → útil 375 (sidenav over).

| Pantalla | Viewport | Resultado | Qué se corrigió / nota |
|----------|----------|-----------|-------------------------|
| Login admin | 1280 | OK | Shell centrado; no se auditó landing pública |
| Inicio / hub | 1280 | FALLO→OK | 3.ª card huérfana en 2 cols; span `1 / -1` por container 720–1099 |
| Inicio | 900 / 375 | OK | 1 col a útil 620 (antes el `@media 1024` forzaba 2) |
| Buscar paciente | 1280 | OK | Buscador sin clip |
| Expediente Oreon | 1280 | OK | 2 cols (280+608); DUEÑO pad 22px; sin overflow-x |
| Expediente Oreon | 900 | OK | 1 col (útil 620 &lt; 720); toolbar wrap al inicio |
| Expediente Oreon | 375 | OK | KPI 1 col; sin overflow |
| Directorio pacientes | 1280 | OK | KPI 2×2; buscador full; tabla |
| Ficha paciente (dialog) | 1280 | OK | spec 059: hero compacto, DUEÑO, tabs Historial/Vacunas/Recordatorios |
| Clientes + Nuevo | 1280 | OK | listado + diálogo 2 cols, padding |
| Citas + Nueva | 1280 | OK | KPI 2×2; diálogo paso dueño/agenda |
| Historiales + Nuevo | 1280 | OK | diálogo abrió |
| Vacunas + Nueva | 1280 | OK | |
| Peluquería + Nuevo baño | 1280 | OK | |
| Pensión + Nueva estancia | 1280 | OK | |
| Recordatorios + Nuevo | 1280 | OK | |
| Consentimientos + Nuevo | 1280 | OK | |
| POS / visitas | 1280 | FALLO→OK | 2 cols correcto; Catálogo y «Por cobrar» ahora span en 2 cols |
| POS | 900 / 375 | OK | 1 col; dock 3 botones en 375 es nav, no grid de contenido |
| POS Nueva venta | 1280 | OK | stepper + 2 cards dueño/mostrador |
| Inventario hub | 1280 | FALLO→OK | accesos rápidos eran 3 cols a útil 1000; ahora 2 (feature-grid CQ) |
| Inventario | 900 | OK | 1 col a útil 620; banner botones wrap al inicio |
| Inventario Nueva entrada | 1280 | OK | |
| Productos + Nuevo | 1280 | OK | catálogo + diálogo; gap grid 16px |
| Movimientos | 1280 | OK | |
| Proveedores + Nuevo | 1280 | OK | |
| Órdenes + Nueva | 1280 | OK | |
| Alertas | 1280 | OK | |
| Reportes | 1280 | OK | |
| Servicios clínica + Nuevo | 1280 | OK | |
| Caja / finanzas | 1280 | OK | KPI 2×2; toolbar filtros no aplastada |
| Personal y portal + Nuevo | 1280 | OK | diálogo 2 cols |
| Contactos web | 1280 | OK | |
| CRUD listados ~900/~375 | — | OK | sin overflow-x en los que se reabrieron por fallo inicial |

**Gaps explícitos (spec sigue `in_progress`):**

- Landing / portal dueño: fuera de foco (regla 10); no auditados salvo login admin.
- Diálogo POS catálogo de productos: 3 cols a viewport ≥721 (fotos); 2 cols desde 430 (antes 3 desde 430).
- `inventario-dialog` `.form-grid--3`: 3 cols en dialog ancho; wrap 2/1 a 900/640 (ya existía).
- Timeline expediente: CSS 10px; Oreon sin ítems de actividad en esta sesión.
- No se reabrió cada diálogo a 375 (páginas sí).

```
> katzenvet@0.0.1 build
> ng build --configuration production
Build at: 2026-09-01T02:40:04.440Z - Hash: 5dca411283a9715b - Time: 14996ms
exit 0
Warning: bundle initial exceeded maximum budget. Budget 2.00 MB was not met by 376.25 kB with a total of 2.37 MB.
```

---

## Criterios spec (SC-xxx)

- [x] SC-001: Grids fluidos 3→2→1 por ancho útil
- [x] SC-002: Desktop ancho aprovecha `.admin-content`
- [x] SC-003: Gap cards ≥16px (20–24 desktop)
- [x] SC-004: Toolbar wrap alineado + tooltip below
- [x] SC-005: Buscador sin clip; Nuevo apila
- [x] SC-006: Padding cards / DUEÑO
- [x] SC-007: Timeline gap (token; lista vacía en Oreon)
- [x] SC-008: Chips y nombres (reglas 5–6) — no se alteraron
- [x] SC-009: Docs/reglas permanentes

---

## Cierre

- [x] Validación pre-entrega con sesión staff localhost (recorrido sidenav + expediente Oreon)
- [x] Validación exhaustiva registrada (tabla de recorrido)
- [ ] `spec.md` estado → `done` — permanece **in_progress** por gaps explícitos (portal/landing, POS catálogo 3 col en dialog ancho, diálogos no todos a 375)
- [ ] Commit / deploy — no pedido

