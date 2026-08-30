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
- [x] Home POS tiles + tickets compactos + bottom bar
- [x] 3 rieles en caja: Petshop | Consulta | Peluquería (`pos-rieles.util.ts`)
- [x] Walk-in bloquea consulta/peluquería; petshop libre
- [x] Copy menú/toolbar: Punto de venta

### Ola 1.6 — UI redo táctil (2026-08-30)

- [x] Grid con foto (`pos-foto.util.ts`) + placeholder
- [x] Tap = agregar; +/−/quitar ≥48px solo en líneas del ticket
- [x] Sticky cliente/mostrador + Cobrar $XXX
- [x] Home táctil; picker dueño sin crear fichas
- [x] Mocks `MOCK_PRODUCTOS_POS`; cero writes a maestros
- [x] Prompt maestro reescrito en `INVESTIGACION-POS.md` §7

### Ola 1.7 — Precios de inventario (2026-08-30)

- [x] Producto / medicamento / vacuna: ticket con `precio_venta` — sin Swal «¿Cuánto se cobra?»
- [x] Vacuna/medicamento: lista de inventario por categoría (no tile genérico vacío)
- [x] Consulta: catálogo si hay precio; fallback pide monto
- [x] Baño: default 022/plantilla precargado y editable (`COPY_BANIO_AJUSTABLE`)
- [x] Copy «Precio de inventario»; aviso stock bajo (no pide precio)
- [x] Tests `pos-precios.util.spec.ts` + `test:055` / `test:046`

### Ola 1.6b — Catálogo demo visual (2026-08-30)

- [x] 6 fotos locales `src/assets/pos-demo/` (2 petshop, 2 consulta, 2 peluquería)
- [x] IDs `demo-pos-*` + `soloDemo` + `origen: pos_preview`
- [x] Flag `usarCatalogoDemoPos` ON localhost / OFF prod
- [x] Banner «Catálogo de muestra — no se guarda»
- [x] Tests: no push RTDB, no `registrarSalida` / `crearProducto`

### Integración

- [x] Menú admin — «Punto de venta»
- [x] Walk-in `CLIENTE_MOSTRADOR` intacto (`test:046` 7/7: 3 mostrador + 4 rieles)
- [x] Inventario salidas + cobro-integridad intactos (`test:039` 14/14)
- [x] Por cobrar hoy intacto (`test:040` 13/13)

### Olas diferidas

Prompt vigente (UI redo): `INVESTIGACION-POS.md` §7. Scanner (P0) **no** en esta entrega.

- [ ] **P0 / ola 2:** scanner cámara + pegar/HID (`codigo_barras` 043) — SC-011
- [x] **P1 precios inventario (2026-08-30):** producto/vacuna/medicamento sin prompt; consulta fallback; baño default editable
- [ ] P2: CFDI/PAC, WhatsApp — **fuera de 055**

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
| Servidor local :4200 + smoke | OK | :4200 HTTP 200; home POS + 3 rieles en diálogo |
| Build `npm run build` | OK | exit 0 Hash 58252fcbb46052e9; budget warning preexistente |

```
npm run build exit 0
Hash: 58252fcbb46052e9
test:046 — 7 SUCCESS (3 mostrador + 4 rieles)
test:039 — 14 SUCCESS
test:040 — 13 SUCCESS
Warning: bundle initial exceeded maximum budget (preexistente, 2.31 MB).
```

### Ola 1.6 — Testing y validación (2026-08-30)

> Guía `qa-validation-guide.md`. Add/edit/delete **solo** líneas del ticket. Sin writes a Cliente / Mascota / Productos.

#### Checklist pre-entrega

- [x] Guía QA aplicada (§1–§4)
- [x] `npm run build` OK (exit 0, Hash `1d54e6128e564043`)
- [x] Live preview :4200 vivo (`ng serve` compiló `visitas-visitas-module` 33.21 kB; HTTP 200)
- [x] Tabla de resultados rellenada
- [x] UI: chips `.estado-badge` enteros; `--picker` N/A; loading contextual; timepicker N/A

#### 1. Formularios

- [x] Vacío: wizard no avanza sin dueño/mostrador; `puedeIrACobrar` exige líneas
- [x] Qty: `sheetMenos` / `ajustarProductoEnCarrito` no bajan de quitar línea; cobro monto ≤ saldo
- [x] Notas maxlength 500; grid scroll interno
- [x] Chips estado + badge inventario

#### 2. Interfaz

- [x] `admin-dialog-shell` + `--pos`; cierre X
- [x] Picker dueño = `app-cliente-paciente-picker` (no crea fichas)
- [x] Timepicker N/A
- [x] Swal stock/precio/cobro
- [x] `LOADING_MESSAGES.saving` + `hide` en `finally`
- [x] Botones `[disabled]="loading"`
- [x] Targets +/−/quitar 48×48 (`.pos-hit`)
- [x] Foto 043 / placeholder (`pos-foto.util`)

#### 3. Casos límite

- [x] Catálogo `[]` / sin foto → placeholder
- [x] Riel consulta/peluquería bloqueado en mostrador (`pos-rieles`)
- [x] `cargarCatalogo` solo lectura

#### 4. Integridad

- [x] `confirmarCobro` / `VisitasService` / `registrarSalida` / `crearMovimiento({visitaId})` sin contrato nuevo
- [x] Tests mocks: `MOCK_PRODUCTOS_POS` ids `mock-*`

| Escenario | Resultado | Notas |
|-----------|-----------|-------|
| Grid foto + tap add | OK | `tapProducto` → `agregarProductoRapido` |
| +/−/quitar ≥48px | OK | `.pos-hit` 48px; solo `lineas[]` |
| Sticky cliente + Cobrar | OK | `.pos-sticky` |
| Picker sin crear maestros | OK | texto UI + picker existente |
| Mostrador solo petshop | OK | `test:046` / rieles |
| Cobro `visitaId` | OK | `test:039` 14/14 |
| Por cobrar hoy | OK | `test:040` 13/13 |
| Foto mock / placeholder | OK | `test:055` 10/10 |
| Build | OK | exit 0 Hash 1d54e6128e564043 |
| :4200 | OK | HTTP 200; compile visitas OK |
| Writes maestros | N/A | no hay create/update producto/cliente/paciente en POS |
| Browser autenticado | Parcial | MCP browser no abrió tab; smoke por compile + curl |

```
npm run build — exit 0 — Hash 1d54e6128e564043
test:055 — 10 SUCCESS
test:046 — 7 SUCCESS
test:039 — 14 SUCCESS
test:040 — 13 SUCCESS
ng serve :4200 — Compiled successfully (visitas-visitas-module 33.21 kB)
Warning: bundle initial exceeded maximum budget (preexistente, 2.32 MB).
```

### Ola 1.6b — Catálogo demo visual (2026-08-30)

> 6 ítems `demo-pos-*` solo preview. **No** catálogo real. **No** `registrarSalida` / `crearProducto`. Flag OFF en prod.

#### Checklist pre-entrega

- [x] Guía QA aplicada (§1–§4)
- [x] `npm run build` OK (exit 0, Hash `0fd06078d3beeddd`; prod `usarCatalogoDemoPos:!1`)
- [x] Live preview :4200 vivo (HTTP 200; 6 PNG `assets/pos-demo/` HTTP 200)
- [x] Tabla de resultados rellenada
- [x] UI: banner `app-flow-hint` warn; chips `.estado-badge` / badge «Muestra» enteros; `--picker` N/A; loading contextual; timepicker N/A

| Escenario | Resultado | Notas |
|-----------|-----------|-------|
| 6 demo + foto local | OK | `src/assets/pos-demo/*.png` 320×320 |
| 2 por riel | OK | petshop / consulta / peluquería |
| IDs no push RTDB | OK | `demo-pos-*` vs `^-[-_0-9A-Za-z]{19}$` |
| `soloDemo === true` | OK | `origen: pos_preview` |
| No `registrarSalida` / `crearProducto` | OK | spies no llamados; líneas demo filtradas al persistir |
| Flag prod OFF | OK | `environment.prod.ts` + bundle `usarCatalogoDemoPos:!1` |
| Banner localhost | OK | «Catálogo de muestra — no se guarda» |
| Writes maestros | N/A | POS no crea productos/clientes/pacientes |
| Build | OK | exit 0 Hash 0fd06078d3beeddd |
| :4200 | OK | compile visitas OK; assets 200 |

```
npm run build — exit 0 — Hash 0fd06078d3beeddd
test:055 — 18 SUCCESS
ng serve :4200 — HTTP 200; assets/pos-demo/*.png 200
Warning: bundle initial exceeded maximum budget (preexistente, 2.33 MB).
```

### Ola 1.7 — Precios de inventario (2026-08-30)

> El cajero no escribe precios de anaquel. Guía `qa-validation-guide.md`. Sin writes a Productos/Clientes/Pacientes.

#### Checklist pre-entrega

- [x] Guía QA aplicada (§1–§4)
- [x] `npm run build` OK (exit 0, Hash `520056dbecfe926a`)
- [x] Live preview :4200 vivo (HTTP 200; `ng serve` en PID 97651)
- [x] Tabla de resultados rellenada
- [x] UI: copy «Precio de inventario» / baño «Puedes ajustar el precio de este baño»; chips enteros; `--picker` N/A; loading contextual; timepicker N/A

| Escenario | Resultado | Notas |
|-----------|-----------|-------|
| Producto/med/vacuna con `precio_venta` | OK | `resolverLineaProductoInventario` — `pedirMonto: false` |
| Tile genérico Vacuna/Medicamento | OK | eliminados; lista por categoría de inventario |
| Consulta con catálogo | OK | demo «Consulta muestra» $350, copy Precio de inventario |
| Consulta sin precio catálogo | OK | `pedirMonto: true` fallback |
| Baño default 022 editable | OK | mediano $350 precargado; `forzarDialogo` |
| Baño plantilla / inventario / peluquería | OK | cascada en `resolverPrecioBanioPos` |
| Stock bajo | OK | toast informativo; no pide precio |
| Walk-in / rieles | OK | `test:046` 8 SUCCESS |
| Writes maestros | N/A | POS solo lectura de tarifas e inventario |
| Build | OK | exit 0 Hash 520056dbecfe926a |
| :4200 | OK | HTTP 200; bundle incluye copy de precios |
| Browser autenticado | Parcial | MCP no sostuvo tab; smoke por tests + compile + curl |

```
npm run build — exit 0 — Hash 520056dbecfe926a
test:055 — 26 SUCCESS
test:046 — 8 SUCCESS
ng serve :4200 — HTTP 200
Warning: bundle initial exceeded maximum budget (preexistente, 2.34 MB).
```

---

## Criterios spec (SC-xxx)

- [x] SC-001: diálogo POS fullscreen / ancho móvil
- [x] SC-002: 1 columna + búsqueda sticky + chips Petshop \| Consulta \| Peluquería
- [x] SC-003: lista táctil, + ≥44px (48px)
- [x] SC-004: carrito sticky N arts · total · Cobrar $
- [x] SC-005: sheet cantidad +/−
- [x] SC-006: wizard + walk-in
- [x] SC-007: badge inventario; servicios intactos
- [x] SC-008: CTA Nueva venta
- [x] SC-009: cobro inline métodos + monto
- [x] SC-010: `visitaId` en caja; no «Registrar en caja» clínico
- [ ] SC-011: ola 2 (cámara)
- [x] SC-012: precios inventario + baño default editable (consulta fallback si no hay catálogo)
- [x] SC-013: home POS tiles
- [x] SC-014: resumen + tickets compactos
- [x] SC-015: bottom bar Caja \| Tickets \| Productos; sin CTA finanzas
- [x] SC-016: copy Punto de venta
- [x] SC-017: caja móvil Pulpos (buscar, chip, carrito, Cobrar $)
- [x] SC-018: 3 rieles Katzen
- [x] SC-019: mostrador solo petshop
- [x] SC-020: grid con foto / placeholder; tap = agregar
- [x] SC-021: +/−/quitar ≥48px; solo líneas del ticket
- [x] SC-022: sticky cliente + Cobrar; picker sin crear fichas
- [x] SC-023: home táctil; catálogo inventario solo ver

---

## Cierre

- [x] Validación pre-entrega ola 1.7 (precios inventario)
- [x] Validación exhaustiva registrada
- [ ] `spec.md` estado → `done` — **ola 1.7 entregada; spec sigue in_progress por ola 2 (scanner)**
- [x] Commit / deploy — no (Luis no lo pidió)
