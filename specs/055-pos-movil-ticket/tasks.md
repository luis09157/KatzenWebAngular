# Tasks: POS móvil — Ticket del día

**Spec:** `specs/055-pos-movil-ticket/spec.md`  
**Plan:** `specs/055-pos-movil-ticket/plan.md`  

---

## Implementación

### Setup

- [x] Carpeta spec creada (`specs/055-pos-movil-ticket/`)
- [x] Plan con Contratos + Rollback

### Backend

- [x] Reglas RTDB — N/A
- [x] Cloud Function — N/A
- [x] `npm run functions:build` — N/A
- [x] Function desplegada — N/A (no deploy)

### Frontend

- [x] `ADMIN_DIALOG_POS` + panel fullscreen móvil
- [x] `visita-dialog` layout POS mobile-first (chips, catálogo táctil, sticky cart, sheet)
- [x] Cobro inline paso 3 (métodos + monto) con `visitaId`
- [x] `ajustarCantidadLinea` + tests
- [x] Lista `/admin/visitas`: CTA Nueva venta / mostrador
- [x] UI `admin-dialog-shell` (no `mat-dialog-title`)

### Integración

- [x] Menú admin — sin cambio (Ticket del día)
- [x] Walk-in `CLIENTE_MOSTRADOR` intacto (`test:046` 3/3)
- [x] Inventario salidas + cobro-integridad intactos (`test:039` 14/14)

### Olas diferidas

- [ ] Ola 2: scanner / cámara QR (043)
- [ ] Ola 3: servicios 1 tap con precio sugerido

---

## Testing

> **Quién ejecuta:** el agente (autónomo / multitask). El usuario **no** es el QA por defecto.

- [x] `npm run build` — exit 0 (warning de budget 2.00 MB preexistente)
- [x] `npm run functions:build` — N/A
- [x] Servidor local activo (`npm start` → http://localhost:4200) — `ng serve` compiló visitas-module; chunk 355.js contiene «Caja POS» / «COBRAR»
- [x] Manual/simulado: wizard bloquea sin dueño; COBRAR requiere líneas (`puedeIrACobrar`)
- [x] Walk-in 1 tap (`ventaMostradorUnTap` + `CLIENTE_MOSTRADOR`)
- [x] `npm run test:046` — 3 SUCCESS
- [x] `npm run test:039` — 14 SUCCESS (incluye `ajustarCantidadLinea`)
- [x] `npm run cy:admin` — N/A (sin ruta nueva)

**Resultado:** OK ola 1

```
npm run build — exit 0 — Hash f8db7cd3e98e2029
test:046 — 3 SUCCESS
test:039 — 14 SUCCESS
visitas.util.spec — 5 SUCCESS (incluye 055 POS cantidad)
ng serve :4200 — Compiled successfully (visitas-visitas-module 23.49 kB)
```

---

## Testing y validación exhaustiva

> **Guía obligatoria:** `specs/templates/qa-validation-guide.md`

### Checklist pre-entrega

- [x] Guía QA completa aplicada (§1–§4)
- [x] `npm run build` OK y reportado
- [x] Live preview :4200 vivo + smoke (bundle POS en 355.js)
- [x] Tabla de resultados rellenada (abajo)
- [x] UI recientes verificadas si aplican (chips, `--picker`, loading, timepicker)

### 1. Formularios y validaciones de entrada

- [x] **Campos vacíos:** `irPaso` no avanza sin `tieneDuenoOMostrador`; `puedeCobrar` exige líneas y saldo
- [x] **Tipos erróneos:** `sheetMenos` no baja de 1; cobro rechaza monto ≤0 o > saldo
- [x] **Límites / desbordamiento:** catálogo scroll interno; notas maxlength 500
- [x] **Chips/badges de estado:** `.estado-badge` + inventario «Descuenta inventario»

### 2. Interfaz, ventanas y modales

- [x] **Diálogos:** `admin-dialog-shell` + `--pos` fullscreen ≤720px; cierre con X / Cerrar
- [x] **Pickers compactos:** N/A (`--picker` no aplica al POS)
- [x] **Timepicker:** N/A (solo fecha)
- [x] **Retroalimentación:** Swal stock/precio/éxito cobro
- [x] **Loading contextual:** `LOADING_MESSAGES.saving` en guardar/cobrar
- [x] **Loading no trabado:** `hide` en `finally`; un solo overlay
- [x] **Doble submit:** botones `[disabled]="loading"`

### 3. Casos límite y errores de red

- [x] **Red lenta / sin conexión:** loading + `ErrorMessagesService` en catch
- [x] **Datos nulos RTDB:** catálogo `[]`; pendientes vacíos; `filtrarProductos` tolera null

### 4. Integridad final

- [x] **`npm run build`** exit 0
- [x] **Servidor local :4200** activo
- [x] **Resultados registrados**

### Registro de resultados QA

| Escenario | Resultado | Notas |
|-----------|-----------|-------|
| Formularios — campos vacíos | OK | wizard + `puedeCobrar` |
| Formularios — tipos erróneos | OK | qty ≥1; monto ≤ saldo |
| Formularios — límites texto | OK | notas 500; lista scroll |
| UI — chips estado completos | OK | badge estado + inventario |
| Modales — apertura/cierre | OK | shell + sheet + X |
| UI — diálogos --picker | N/A | POS fullscreen |
| UI — timepicker en campos hora | N/A | |
| UI — retroalimentación | OK | Swal stock/precio/cobro |
| UI — loading contextual | OK | Guardando… |
| UI — loading no trabado | OK | `finally` hide |
| UI — doble submit | OK | `loading` disable |
| Edge — red lenta/error | OK | catch + hide |
| Edge — datos nulos RTDB | OK | catálogo/pendientes vacíos |
| Servidor local :4200 + smoke | OK | chunk 355.js con Caja POS / COBRAR |
| Build `npm run build` | OK | exit 0; budget warning preexistente |

```
npm run build exit 0
Hash: f8db7cd3e98e2029
Warning: bundle initial exceeded maximum budget (preexistente, 2.30 MB).
```

---

## Criterios spec (SC-xxx)

- [x] SC-001: diálogo POS fullscreen / ancho móvil
- [x] SC-002: 1 columna + búsqueda sticky + chips
- [x] SC-003: lista táctil, + ≥44px (48px)
- [x] SC-004: carrito sticky N arts · total · COBRAR
- [x] SC-005: sheet cantidad +/−
- [x] SC-006: wizard + walk-in
- [x] SC-007: badge inventario; servicios intactos
- [x] SC-008: CTA Nueva venta
- [x] SC-009: cobro inline métodos + monto
- [x] SC-010: `visitaId` en caja; no «Registrar en caja» clínico
- [ ] SC-011: ola 2
- [ ] SC-012: ola 3

---

## Cierre

- [x] Validación pre-entrega ola 1 completa (agente)
- [x] Validación exhaustiva ola 1 registrada
- [ ] `spec.md` estado → `done` — **ola 1 entregada; spec sigue in_progress por olas 2–3**
- [x] Commit / deploy — no (Luis no lo pidió)
