# Plan técnico: POS móvil — Punto de venta

**Spec:** `specs/055-pos-movil-ticket/spec.md`  
**Estado:** approved  
**Investigación:** `specs/055-pos-movil-ticket/INVESTIGACION-POS.md` (2026-08-30) — hallazgos Pulpos / Square / Shopify / Lightspeed / PIMS vet / CFDI MX. **No implementar** hasta que Luis autorice la ola.

---

## Resumen

Ola 1: rediseño **mobile-first** de `visita-dialog` como caja POS. Ola 1.5 (**POS Pulpos-like**): home `/admin/visitas` con tiles y tickets compactos; caja con buscar + scanner placeholder, chip cliente, carrito +/− y **Cobrar $total**. El wizard 054 se conserva. Persistencia, inventario y cobro siguen en `VisitasService` + `InventarioService.registrarSalida` + `CajaService.crearMovimiento({ visitaId })`. Desktop ≥721px puede partir catálogo \| carrito **sin** ser el diseño rector.

**Ola 1.6 (2026-08-30):** rehacer UI táctil (grid + foto + sticky). Prompt maestro vigente: `INVESTIGACION-POS.md` §7. P0 Scanner / P1 1-tap siguen diferidos. CFDI/WhatsApp no entran a 055.

---

## Archivos a crear / modificar

### Angular

| Archivo | Acción | Notas |
|---------|--------|-------|
| `src/app/core/config/admin-ui.config.ts` | modificar | `ADMIN_DIALOG_POS` fullscreen móvil |
| `src/styles/admin-dialog.scss` | modificar | panel `--pos` 100vh en ≤720px |
| `src/app/visitas/visita-dialog.component.html` | modificar | layout POS mobile-first |
| `src/app/visitas/visita-dialog.component.scss` | modificar | sticky search, chips, + 44px, cart bar, sheet |
| `src/app/visitas/visita-dialog.component.ts` | modificar | catálogo, tabs, sheet qty, cobro inline |
| `src/app/visitas/visitas.util.ts` | modificar | `ajustarCantidadLinea` / unitario |
| `src/app/visitas/pos-precios.util.ts` | crear | Precio inventario vs prompt; default baño 022 editable |
| `src/app/visitas/pos-precios.util.spec.ts` | crear | producto sin prompt; baño default; consulta fallback |
| `src/app/visitas/visita-atalho.util.ts` | modificar | `forzarDialogo` + valor precargado (baño) |
| `src/app/visitas/pos-rieles.util.spec.ts` | crear | tests rieles (incluido en test:046) |
| `src/app/visitas/pos-foto.util.ts` | crear | URL foto 043 + placeholder (ola 1.6) |
| `src/app/visitas/pos-foto.util.spec.ts` | crear | tests foto con `MOCK_PRODUCTOS_POS` |
| `src/app/core/testing/mock-data.ts` | modificar | `MOCK_PRODUCTOS_POS` (6 demo, solo lectura) |
| `src/app/visitas/pos-catalogo-demo.data.ts` | crear | 6 ítems demo (no mock-data en bundle POS) |
| `src/app/visitas/pos-catalogo-demo.util.ts` | crear | flag demo, no push RTDB, no salida/alta inventario |
| `src/app/visitas/pos-catalogo-demo.util.spec.ts` | crear | 6 demo, 2 por riel, no persistir |
| `src/environments/environment.ts` | modificar | `usarCatalogoDemoPos: true` (localhost) |
| `src/environments/environment.prod.ts` | modificar | `usarCatalogoDemoPos: false` |
| `src/assets/pos-demo/` | crear | 6 PNG locales (no hotlink) |
| `src/app/visitas/visitas.util.spec.ts` | modificar | tests cantidad POS |
| `src/app/visitas/visitas.component.html` | modificar | Home POS tiles + tickets compactos + bottom bar |
| `src/app/visitas/visitas.component.ts` | modificar | `ADMIN_DIALOG_POS`, `nuevaMostrador()`, navegación tiles |
| `src/app/visitas/visitas.component.scss` | modificar | Tiles Pulpos, cards ticket, bottom bar móvil |
| `src/app/layouts/admin-main-layout.component.html` | modificar | Copy menú «Punto de venta» |
| `src/app/core/config/admin-route-labels.config.ts` | modificar | Toolbar «Punto de venta» |
| `src/app/dashboard/dashboard.component.html` | modificar | CTA hub → Punto de venta |

### Firebase

| Archivo | Acción |
|---------|--------|
| — | ninguno |

### Cypress

| Archivo | Acción |
|---------|--------|
| — | ola 1: smoke visual localhost; ruta `/admin/visitas` ya existe |

---

## Modelo de datos

Sin cambios. Se reutiliza:

```text
Katzen/Visitas/{id}
  cliente_id, esMostrador?, lineas[], pagado, saldo
  lineas[].cantidad?          # aditivo 045
  lineas[].productoId?
  lineas[].movimientoInventarioId?

Katzen/Caja/Movimientos/{id}
  visitaId                    # 032/039 — no omitir
```

---

## Flujos

### Flujo principal (celular, ola 1.5)

1. `/admin/visitas` home POS → tile **Nueva venta** (o **Venta mostrador** = 1 tap walk-in). Tickets de hoy / Productos son caminos distintos.
2. Paso 1: dueño (picker) **o** tile Mostrador → pasa a caja.
3. Paso 2: buscar / scanner pegar código / pulsar **+**; chip cliente o Mostrador; carrito +/−; **Cobrar $total**.
4. Paso 3: método + monto → confirma → `persistir` + salida inventario + caja con `visitaId`.
5. Cerrar diálogo; home se refresca. Sin enlace a Finanzas.

### Errores esperados

| Caso | Código / mensaje usuario |
|------|--------------------------|
| Sin dueño ni mostrador | wizard no avanza; hint |
| Sin líneas | COBRAR bloqueado |
| Sin stock / sin precio venta / stock bajo | SweetAlert; no agrega si sin stock o sin `precio_venta`; avisa stock bajo |
| Baño sin default 022 | Diálogo editable; si hay plantilla/inventario/ProductosPeluqueria se precarga |
| Monto cobro > saldo | bloqueado |
| Error RTDB | `ErrorMessagesService` + `loading.hide` |

---

## Servicios

- `VisitasService` — sin cambiar contrato (`crearVisita`, `actualizarVisita`, salidas vía diálogo)
- `InventarioService.getProductos` / `registrarSalida` — catálogo + stock
- `CajaService.crearMovimiento` — cobro inline (no anidar diálogo ERP de finanzas)
- `filtrarProductos` — misma búsqueda que producto-picker (código / QR texto)
- `CLIENTE_MOSTRADOR_*` — 046 intacto

---

## UI (admin)

- Contenedor lista: `.visitas-contenedor`
- Diálogo: `admin-dialog-shell` + `visita-dialog--pos`; **no** `mat-dialog-title`
- Config: `ADMIN_DIALOG_POS`
- Loading: `LOADING_MESSAGES.saving` en guardar/cobrar; un solo `show`/`hide`
- Chips estado: `.estado-badge` completos
- Timepicker: N/A (solo fecha)
- `--picker`: no aplicar al POS (CRUD grande / fullscreen)

---

## Contratos de Datos y UI (Obligatorio)

- **Impacto en Firebase RTDB:** ninguno destructivo. Escritura existente de Visitas / Movimientos inventario / Caja. App móvil no cambia nodos.

  | Nodo / campo | Acción | ¿App móvil afectada? | Notas |
  |--------------|--------|----------------------|-------|
  | `Katzen/Visitas` | lectura/escritura existente | no | campos opcionales ya en 032/045/046 |
  | `Katzen/Inventario/Productos` | lectura | no | catálogo |
  | `Katzen/Inventario/Movimientos` | escritura aditiva | no | `venta_directa` al persistir |
  | `Katzen/Caja/Movimientos` | escritura aditiva | no | `visitaId` |

  - [x] Sin eliminar ni renombrar nodos existentes
  - [x] Campos nuevos opcionales con defaults seguros en lectura (no hay campos nuevos)

- **Estrategia de Datos de Prueba:** localhost + mocks (`MOCK_PRODUCTOS_POS` `demo-pos-*`, `soloDemo`). `npm run test:055`, `test:046`, `test:039`, `test:040`. Nunca RTDB producción. **Cero writes** a Cliente / Mascota / Productos. Demo **no** se mezcla con RTDB salvo `usarCatalogoDemoPos` (OFF en prod).

- **Patrones UI Reutilizados:**

  | Patrón | Referencia en repo |
  |--------|-------------------|
  | Diálogo | `admin-dialog-shell`, `ADMIN_DIALOG_POS` |
  | Home tiles | tiles locales `.pos-home-tile` (no card de finanzas) |
  | Dueño/paciente | `app-cliente-paciente-picker` |
  | Búsqueda producto | `filtrarProductos` (`producto-search.util.ts`) + código 043 |
  | Walk-in | `visita-mostrador.util.ts` |
  | Alertas | `ErrorMessagesService`, SweetAlert2 |
  | Loading | `LoadingService` + `finally` hide |
  | Badges | `.estado-badge`, badge inventario |
  | Foto producto | `Producto.imagen_url` (043, opcional) |

  - [x] Sin librerías UI externas
  - [x] `docs/ADMIN-UI-ARCHITECTURE.md` consultado
  - [x] Chips/badges de estado visibles enteros (no truncados)

---

## Plan de Mitigación y Rollback

- [x] Verificado que no hay cambios destructivos en contratos de datos.
- [x] Compilación local exitosa (`npm run build`).
- [x] Plan de reversión documentado.

| Escenario | Acción de rollback |
|-----------|-------------------|
| UI rompe build o POS inutilizable | Revertir `visita-dialog.*`, `visitas.component.*`, `pos-foto.util.ts`, `pos-precios.util.ts`, `visita-atalho.util.ts`, `admin-ui.config.ts`, `admin-dialog.scss` |
| Accidental write a maestros | No hay APIs de create/update producto/cliente/paciente en el diálogo POS; rollback = no desplegar |
| Cobro no liga `visitaId` | No aplica Functions; revertir `confirmarCobro` al flujo previo con `CajaMovimientoDialogComponent` |
| Inventario doble salida | Misma guarda: no registrar si `movimientoInventarioId` ya existe |
| Reglas / Functions | N/A esta ola |

---

## Deploy

No hay deploy en esta entrega. Cuando Luis autorice:

```bash
npm run build
# hosting solo si el usuario lo pide
firebase deploy --only hosting
```

---

## Riesgos

- Overlay Material + `100vh` en iOS: usar `100dvh` / `100vh` con `max-height` en `--pos`.
- Catálogo de 40 ítems (`filtrarProductos` límite): la búsqueda cubre el resto; **P0** scanner cámara.
- Cobro inline vs diálogo caja: mismo `crearMovimiento`; finanzas admin no se toca.
- Cámara en Safari iOS: requiere HTTPS (localhost OK); si `BarcodeDetector` no existe, fallback a pegar código (ya en sheet).
- Confundir ticket interno con CFDI: copy de cobro **nunca** dice «Factura SAT»; el comprobante es el ticket de visita.

---

## Olas refinadas post-investigación (P0–P2)

Fuente: `INVESTIGACION-POS.md`. Una ola = una autorización de Luis. **No mezclar P0 y P1 en el mismo PR.**

| Prioridad | Ola spec | Esfuerzo | Qué | No hacer |
|-----------|----------|----------|-----|----------|
| **Hecho** | 1 + 1.5 | — | UI POS, home tiles, dock, 3 rieles, walk-in solo petshop, cobro `visitaId` | — |
| **P0 siguiente** | 2 · SC-011 | ~1–1.5 d | Cámara + pegar/HID → match `codigo_barras` 043 → `agregarProductoRapido`. Sheet scanner existente. | PAC, 1 tap servicios, librería UI nueva |
| **P1** | 3 · SC-012 | ~1.5–2.5 d | Consulta/Vacuna/Baño 1 tap con precio de defaults 022; search con foto + quick-add; pass 44/48 px | Bundles ezyVet, CFDI |
| **P2** | — | n/a | CFDI/PAC/global (024 fase 2), WhatsApp ticket, consumo vs anaquel, loyalty, offline | Bloquear clínica |

### P0 — Scanner (contratos)

- **RTDB:** ninguno. Lectura `Katzen/Inventario/Productos.codigo_barras` / `imagen_url`.
- **UI:** mismo `admin-dialog-shell` + sheet `scanner`; overlay cámara con targets ≥44 px (ideal 48).
- **Cobro:** no tocar `confirmarCobro`.
- **Tests:** match de código (unitario) + `npm run test:046` + `test:039`.
- **Rollback:** revertir solo sheet/cámara en `visita-dialog.*`; el pegar código actual sigue siendo el fallback.

### P1 — Servicios 1 tap (parcial 2026-08-30)

- Producto / vacuna / medicamento: `precio_venta` de Inventario, **sin** prompt.
- Consulta: producto de catálogo «Consulta» si tiene precio; si no, prompt (fallback).
- Baño: default 022 / plantilla / ProductosPeluqueria **precargado y editable**.
- No crear nodo RTDB nuevo. Copys: «Precio de inventario» / «Puedes ajustar el precio de este baño».

### Fuera de 055 (ratificado)

- PAC / timbrar / factura global / botón Facturar en cobro.
- WhatsApp, Resend, tienda en línea.
- Reabrir cobro directo en baños/citas/pensión (050).
- Multi-sucursal, cortes de caja desde el dock POS (SC-015).

### Prompt para implementar

Pegar el **PROMPT MAESTRO** al final de `INVESTIGACION-POS.md` en Cursor cuando Luis autorice. Default del prompt = P0 Scanner.
