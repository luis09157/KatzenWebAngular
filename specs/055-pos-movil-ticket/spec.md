# Spec: POS móvil — Punto de venta

**ID:** 055-pos-movil-ticket  
**Estado:** in_progress  
**Fecha:** 2026-08-28  
**Autor:** Luis Alfonso Niño Martínez + agente  
**Relaciona:** 032 ticket, 039 cobro-integridad, 043 QR producto, 044 producto-picker, 045 hub POS, 046 walk-in, 049 3 mundos, 050 cobro unificado, 054 wizard

---

## Problema

El Ticket del día se siente como un **formulario de ERP** (campos, UID staff, jerga «visita»). En mostrador y celular (375–430px) agregar un producto o un servicio es lento: hay que buscar, llenar cantidad y pulsar «Agregar línea». Recepción necesita un **punto de venta** como Square / Uber Eats / caja de OXXO: pulgar, catálogo táctil, carrito sticky y **COBRAR** imposible de perder.

El wizard dueño → líneas → cobrar (054) **se conserva y se viste de POS**. No se reabre «Registrar en caja» (050).

---

## Olas

Investigación de mercado (Pulpos, Square/Shopify, Lightspeed, PIMS vet, CFDI MX): `INVESTIGACION-POS.md`.  
**Prompt maestro vigente (UI redo + no mutar maestros):** `INVESTIGACION-POS.md` §7.

| Ola | Entrega | Qué |
|-----|---------|-----|
| **1** | Entregada | UI móvil POS: 1 columna, búsqueda sticky, chips, lista táctil, carrito sticky, cobro grande. |
| **1.5** | Entregada | Home POS + **3 rieles**: Petshop \| Consulta \| Peluquería. Walk-in solo petshop. |
| **1.6** | **Vigente** | **UI redo táctil:** grid con foto, tap = agregar, +/−/quitar ≥48px, sticky cliente + Cobrar. **No mutar** Productos/Clientes/Pacientes. Lógica reutilizada. |
| **2 = P0** | Después | Scanner cámara + pegar/HID (`codigo_barras` 043). |
| **3 = P1** | Después | Servicios 1 tap con precio sugerido 022. |
| **P2** | Fuera de 055 | CFDI/PAC, WhatsApp, bundles, offline. |

---

## User stories

### US-1 — Caja en el celular (ola 1)

Como **recepcionista en mostrador con el teléfono**  
Quiero **ver catálogo, pulsar + y cobrar sin pelearme con un formulario**  
Para **cerrar la venta en segundos**

**Criterios de aceptación:**

- [x] SC-001: Diálogo POS (`admin-dialog-shell`, sin `mat-dialog-title`) a pantalla completa o panel ancho en ≤720px.
- [x] SC-002: Una columna en 375–430px: búsqueda sticky (petshop); chips **Petshop | Consulta | Peluquería**.
- [x] SC-003: Lista/cards táctiles (no tabla densa) con botón **+** mínimo 44×44px.
- [x] SC-004: Carrito sticky abajo: `{n} arts · {total} · COBRAR`.
- [x] SC-005: Sheet inferior para detalle de línea (cantidad +/−, borrar).
- [x] SC-006: Wizard 3 pasos se mantiene (dueño → caja → cobrar); walk-in 1 tap con `CLIENTE_MOSTRADOR`.
- [x] SC-007: Badge «Descuenta inventario» en líneas producto; `VisitasService` / salidas / cobro-integridad sin cambios de contrato.
- [x] SC-008: Lista `/admin/visitas`: CTA **Nueva venta** (y atajo mostrador). Menú ⋮ móvil de la tabla se conserva.

### US-2 — Cobrar sin diálogo de ERP (ola 1)

Como **recepcionista**  
Quiero **métodos claros, monto y confirmar en el paso 3**  
Para **no abrir «Registrar movimiento» de finanzas**

**Criterios de aceptación:**

- [x] SC-009: Paso cobrar: efectivo / tarjeta / transferencia, monto (total o abono), botón **COBRAR** grande.
- [x] SC-010: El movimiento de caja sigue llevando `visitaId` (039/050). No reaparece «Registrar en caja» en módulos clínicos.

### US-5 — Home POS estilo Pulpos (ola 1.5)

Como **recepcionista**  
Quiero **saber a dónde ir** al abrir el punto de venta (vender vs tickets vs catálogo)  
Para **no pelearme con una tabla de ERP**

**Criterios de aceptación:**

- [x] SC-013: `/admin/visitas` es home POS: header **Punto de venta**; tiles **Nueva venta** (CTA primario), **Venta mostrador**, **Tickets de hoy**, **Productos**.
- [x] SC-014: Debajo: cards de resumen (ventas del día, tickets abiertos, por cobrar) + lista **compacta** de tickets abiertos. La tabla densa no es protagonista (historial opcional).
- [x] SC-015: Móvil: bottom bar **Caja | Tickets | Productos**. Desde POS no hay CTA a Finanzas / reportes de caja.
- [x] SC-016: Copy unificado: menú y toolbar **Punto de venta**; CTA **Nueva venta**.
- [x] SC-017: Caja móvil: búsqueda sticky + scanner (pegar código 043), chip cliente o **Mostrador**, líneas con foto + +/−, **Cobrar $total**.
- [x] SC-018: Tres rieles visibles al abrir **Nueva venta**: **Petshop** (inventario +), **Consulta** (Consulta/Medicamento/Vacuna + productos clínicos), **Peluquería** (pendientes + Nuevo baño). Todo cae en el ticket; no en finanzas.
- [x] SC-019: Walk-in/mostrador **solo petshop**. Consulta y peluquería exigen dueño + mascota (hint + CTA).

### US-6 — Caja táctil con foto (ola 1.6)

Como **recepcionista con el teléfono**  
Quiero **ver fotos, tocar para agregar y quitar con botones grandes**  
Para **armar el ticket sin pelearme con una lista de ERP**

**Criterios de aceptación:**

- [x] SC-020: Grid de productos/servicios con **foto** (`imagen_url` 043) o placeholder; tap = agregar al carrito.
- [x] SC-021: +/− y **quitar** ≥48×48 px en tile y en línea del ticket. Add/edit/delete **solo** de líneas (no fichas maestras).
- [x] SC-022: Sticky **cliente/mostrador + Cobrar $XXX**. Consulta/peluquería: picker dueño (sin crear cliente/paciente).
- [x] SC-023: Home `/admin/visitas` táctil (tiles con icono 48px). Catálogo inventario = solo ver.

### US-3 — Scanner (ola 2 — no implementar ahora)

Como **recepcionista**  
Quiero **pegar o escanear el código / QR del producto**  
Para **agregarlo sin escribir el nombre**

**Criterios de aceptación:**

- [ ] SC-011: Búsqueda sticky acepta código exacto (ya lo hace `filtrarProductos`; ola 2: cámara / 043).

### US-4 — Servicios 1 tap (ola 3 — no implementar ahora)

Como **recepcionista**  
Quiero **pulsar Consulta / Baño y que entre al carrito**  
Para **no teclear monto cada vez**

**Criterios de aceptación:**

- [x] SC-012: Precios de inventario en producto/vacuna/medicamento (sin prompt). Consulta: catálogo o fallback. Baño: default 022 precargado y editable. (Ola 3 cámara/1-tap UI extra sigue diferida; esta regla de negocio ya aplica.)

---

## Fuera de alcance

- Cambios RTDB o Cloud Functions
- Reabrir cobro directo en baños/citas/pensión (050)
- Scanner de cámara (ola 2 / P0) — hasta autorización Luis
- Precios default de servicios **sin** catálogo (consulta fallback sigue pidiendo monto)
- **CFDI / PAC / factura global / botón Facturar** (024 fase 2; ticket interno ≠ factura SAT)
- WhatsApp / compartir ticket por API
- App nativa; esto es el admin web en viewport celular
- Commit / `firebase deploy`

---

## Contratos de Datos y UI (Obligatorio)

- **Impacto en Firebase RTDB:** ninguno nuevo. Se reutilizan nodos existentes; campos de línea (`cantidad?`, `productoId?`) ya son opcionales (045).

  | Nodo | Lectura | Escritura | Notas |
  |------|---------|-----------|-------|
  | `Katzen/Visitas/{id}` | staff | staff | ticket; `esMostrador?`, `lineas[]` |
  | `Katzen/Inventario/Productos` | staff | no en esta UI | catálogo POS |
  | `Katzen/Inventario/Movimientos` | — | staff vía `InventarioService.registrarSalida` | al persistir producto |
  | `Katzen/Caja/Movimientos` | — | staff vía `CajaService.crearMovimiento` | `visitaId` obligatorio al cobrar |
  | `Katzen/Banios` | staff | no | pendientes de peluquería |
  | `Katzen/Cliente`, `Katzen/Mascota` | staff | no | picker dueño (029) |

- **Estrategia de Datos de Prueba:** mocks (`MOCK_PRODUCTOS_POS` 6 ítems `demo-pos-*`, `soloDemo: true`) / localhost. **Prohibido** writes a `Katzen/Cliente`, `Katzen/Mascota`, `Katzen/Inventario/Productos`. Flag `usarCatalogoDemoPos` ON en localhost, **OFF en prod**. Tests `test:055` (foto + catálogo demo), `test:046` (walk-in), `test:039`/`test:040` (integridad).

- **Patrones UI Reutilizados:** `admin-dialog-shell`, `ADMIN_DIALOG_POS`, `app-cliente-paciente-picker`, `filtrarProductos` (044), `app-flow-hint`, `.estado-badge`, `LoadingService`, SweetAlert2, menú ⋮ existente en la lista.

---

## Roles

| Rol staff | ¿Accede? |
|-----------|----------|
| administrador | sí (`visitas`) |
| doctor | sí |
| recepcionista | sí (usuario principal del POS) |
| peluquero | según `STAFF_MODULE_ACCESS` |

---

## UI (rutas y layout)

- Ruta admin: `/admin/visitas` (sin ruta nueva)
- **Home POS (ola 1.5):** tiles + resumen + tickets compactos — no lista ERP como protagonista
- Diálogo POS fullscreen en móvil; desktop ≥721px: 2 columnas (catálogo \| carrito)
- Prioridad 375–430px
- KPIs: 3 cards de resumen (no 5 filtros densos al tope)

## POS Pulpos-like + 3 rieles Katzen — Contratos de UI (ola 1.5)

Ideas de Pulpos/Square (**sin copiar marca**). La caja no es un POS genérico: vende **tres mundos** en el mismo ticket.

### Mapa: si vendo X voy a Y

| Si vendo… | Voy a… | Qué entra al ticket | Dueño |
|-----------|--------|---------------------|-------|
| Croqueta, accesorio, producto de anaquel | Riel **Petshop** | `venta_producto` + `productoId`; salida inventario al cobrar (039) | Opcional (mostrador OK) |
| Consulta, vacuna, medicamento cobrado | Riel **Consulta** | Producto de inventario con `precio_venta` (vacuna/medicamento listados). Atajo Consulta: catálogo si hay precio; si no, pide monto. | Dueño + mascota |
| Baño / corte | Riel **Peluquería** | Pendiente `Katzen/Banios` → `banioId` (046/050) o «Nuevo baño» (línea `banio`) | Dueño + mascota |
| Reportes de caja, gastos | **No** desde POS | `/admin/finanzas` (Administración) | — |
| Alta de stock / compras | Tile **Productos** o menú Inventario | No es cobro | — |

### Contratos UI

| Superficie | Contrato |
|------------|----------|
| Home `/admin/visitas` | Header «Punto de venta». Tiles: **Nueva venta** (abre caja con 3 rieles) · Venta mostrador · Tickets de hoy · Productos. |
| Caja chips | **Petshop \| Consulta \| Peluquería** (obligatorio; no Productos/Servicios/Mostrador). |
| Petshop | Grid/lista `Katzen/Inventario/Productos` (alimento, accesorio, peluquería). `+` ≥44px. Foto/`imagen_url` 043. Scanner = pegar código. |
| Consulta | Atajo **Consulta** usa `precio_venta` de catálogo si existe (copy «Precio de inventario»); si no hay precio, pide monto (fallback). **Vacuna/Medicamento:** productos de inventario de esa categoría — **no** tile genérico vacío. |
| Peluquería | Baños pendientes del cliente (`filtrarBaniosPendientesTicket`) + **Nuevo baño** (precio default 022/plantilla precargado y **editable**; copy «Puedes ajustar el precio de este baño»). |
| Walk-in | Solo petshop. Consulta/peluquería: hint + «Elegir dueño y mascota». |
| Carrito | Foto, nombre, precio, +/−, **Cobrar $total**. |
| Navegación 3 caminos menú | Vender = POS. Clínica = Atención clínica. Inventario/finanzas = Administración. |

---

## Backend

- [ ] Cloud Function: no
- [ ] Reglas RTDB: no
- [ ] Email / integración externa: no

---

## Testing mínimo

Ver `tasks.md`. `npm run build`, `npm run test:046`, smoke `:4200`.

---

## Notas / decisiones

- Copy: **Punto de venta** / **Nueva venta** en menú, toolbar y home. Diálogo: Nueva venta / Caja.
- Staff UID no se muestra; «Atendido por» va en «Más opciones».
- Ola 1 pedía monto en atajos genéricos; **2026-08-30:** producto/vacuna/medicamento usan `precio_venta` de Inventario (sin Swal vacío). Consulta pide monto solo si no hay producto de catálogo. Baño: default 022/plantilla precargado y editable.
- Ola 1.5 no toca contratos de cobro, walk-in, inventario ni wizard 054.
- 2026-08-30: investigación POS en `INVESTIGACION-POS.md`. Ola 1.6 = UI redo táctil (prompt §7). P0 Scanner sigue diferido. No hay PAC; el ticket no es CFDI.
- Ola 1.6 no toca `confirmarCobro`, `VisitasService`, salidas de inventario ni nodos maestros.
- 2026-08-30: catálogo de **muestra** (6 fotos locales, 2 por riel) con `soloDemo` / `demo-pos-*`. No es inventario real; flag `usarCatalogoDemoPos` default OFF en prod. Banner «Catálogo de muestra — no se guarda».
