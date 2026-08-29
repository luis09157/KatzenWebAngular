# Plan técnico: POS móvil — Ticket del día

**Spec:** `specs/055-pos-movil-ticket/spec.md`  
**Estado:** approved  

---

## Resumen

Ola 1: rediseño **mobile-first** de `visita-dialog` como caja POS (una columna, catálogo táctil, carrito sticky, sheet de cantidad, cobro inline). El wizard 054 se conserva. Persistencia, inventario y cobro siguen en `VisitasService` + `InventarioService.registrarSalida` + `CajaService.crearMovimiento({ visitaId })`. Desktop ≥721px puede partir catálogo \| carrito **sin** ser el diseño rector. Olas 2–3 documentadas, no implementadas.

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
| `src/app/visitas/visitas.util.spec.ts` | modificar | tests cantidad POS |
| `src/app/visitas/visitas.component.html` | modificar | CTA Nueva venta / mostrador |
| `src/app/visitas/visitas.component.ts` | modificar | `ADMIN_DIALOG_POS`, `nuevaMostrador()` |
| `src/app/visitas/visitas.component.scss` | modificar | CTA táctil full-width móvil |

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

### Flujo principal (celular, ola 1)

1. `/admin/visitas` → **Nueva venta** (o **Venta de mostrador** = 1 tap walk-in).
2. Paso 1: dueño (picker) **o** tile Mostrador → pasa a caja.
3. Paso 2: chip Productos → buscar / pulsar **+**; Servicios → tile + monto; sheet para +/−.
4. Barra sticky **COBRAR** → paso 3: método + monto → confirma → `persistir` + salida inventario + caja con `visitaId`.
5. Cerrar diálogo; lista se refresca.

### Errores esperados

| Caso | Código / mensaje usuario |
|------|--------------------------|
| Sin dueño ni mostrador | wizard no avanza; hint |
| Sin líneas | COBRAR bloqueado |
| Sin stock / sin precio venta | SweetAlert; no agrega |
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

- **Estrategia de Datos de Prueba:** localhost + mocks. `npm run test:046`, `test:039` si rápidos. Nunca RTDB producción.

- **Patrones UI Reutilizados:**

  | Patrón | Referencia en repo |
  |--------|-------------------|
  | Diálogo | `admin-dialog-shell`, `ADMIN_DIALOG_POS` |
  | Dueño/paciente | `app-cliente-paciente-picker` |
  | Búsqueda producto | `filtrarProductos` (`producto-search.util.ts`) |
  | Walk-in | `visita-mostrador.util.ts` |
  | Alertas | `ErrorMessagesService`, SweetAlert2 |
  | Loading | `LoadingService` + `finally` hide |
  | Badges | `.estado-badge`, badge inventario |

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
| UI rompe build o POS inutilizable | Revertir `visita-dialog.*`, `visitas.component.*`, `admin-ui.config.ts`, `admin-dialog.scss`, `visitas.util.ts` |
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
- Catálogo de 40 ítems (`filtrarProductos` límite): la búsqueda cubre el resto; ola 2 scanner.
- Cobro inline vs diálogo caja: mismo `crearMovimiento`; finanzas admin no se toca.
