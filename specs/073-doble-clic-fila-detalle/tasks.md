# Tasks: Doble clic en fila = Ver detalle

**Spec:** `specs/073-doble-clic-fila-detalle/spec.md`  
**Nivel de cambio:** L2 (sin `plan.md`)

---

## Implementación

### Setup

- [x] Carpeta spec creada (L2, sin plan)
- [x] Inventario `mat-row` / `verDetalle` en `src/app`

### Frontend

- [x] Citas (bug reportado): `(dblclick)` → `verCita`
- [x] Listados con ojo / detalle: mismo handler + `stopPropagation` en `.row-actions`
- [x] Catálogos sin ojo: `(dblclick)` → editar (pensión, consentimientos, servicios, proveedores)
- [x] Productos: no romper click/dblclick existente
- [x] CSS `cursor: pointer` + `user-select: none` en `.data-row--interactive`
- [x] Leyenda «Doble clic para ver detalle»
- [x] Docs + MUST en rule de arquitectura admin

---

## Validación

> L2: unit del util (N/A — solo templates) + `npm run build` + smoke 375/1280.

| Verificación | Resultado | Notas |
|--------------|-----------|-------|
| `npm run build` (exit 0) | OK | exit 0 · Hash `365939445788dd16` · warning budget 2.50 MB preexistente |
| `npm run lint` | OK | **0 errors** (`ng lint --quiet`) |
| Smoke citas dblclick | pendiente | Auth emulador **no** escucha `:9099` (solo RTDB `:9000`). No se usó prod. `ng serve` vivo en `:4200` para Luis |
| Smoke clientes dblclick | pendiente | igual: falta sesión staff local |
| Login 375 / 1280 | OK | `/tmp/kz-073/login-375.png` · `login-1280.png` |

```
npm run build → exit 0 · Hash 365939445788dd16
ng lint --quiet → All files pass linting
```

---

## Criterios spec (SC-xxx)

- [x] SC-001: citas `(dblclick)` = `verCita` (código; smoke autenticado pendiente de Luis)
- [x] SC-002: listados con detalle cableados
- [x] SC-003: acciones no disparan el detalle (`stopPropagation`)
- [x] SC-004: cursor + leyenda
- [x] SC-005: productos intacto (click/dblclick + ojo)
- [x] SC-006: docs + rule MUST

---

## Inventario

### Cableadas (dblclick = detalle / opener de ficha)

| Listado | Handler | Notas |
|---------|---------|-------|
| Citas | `verCita` | **Bug reportado** — no tenía dblclick |
| Clientes | `abrirFichaCliente` | Ya existía (058/062) |
| Pacientes (directorio) | `abrirFicha` | Ya existía; carpeta = expediente |
| Historiales | `verHistorialDetalle` | Tenía dblclick; se añadió stop + clase |
| Vacunas | `verVacuna` | Igual |
| Baños | `verBanio` | Igual |
| Recordatorios | `verRecordatorio` | Igual |
| Contactos web | `verDetalle` | Nuevo |
| Movimientos inventario | `verDetalle` | Nuevo |
| Productos | `abrirDetalleProducto` | Intactos: desktop dblclick; móvil un clic |
| Usuarios staff | `verUsuario` | Nuevo |
| Usuarios portal (3 tablas) | `verDetalleCliente` | Nuevo |
| Visitas / tickets | `editar` (abrir ticket) | Equivalente al ojo |
| Consentimientos | `editar` | Sin ojo; el form es la ficha |
| Pensión | `editar` | Sin ojo |
| Servicios clínica | `editar` | Sin ojo |
| Proveedores | `editarProveedor` | Sin ojo |
| Expediente (listas clínicas) | historial / rec. / vacuna / baño | Ya tenían dblclick |

### Sin detalle (no se inventó `verDetalle`)

| Listado | Por qué |
|---------|---------|
| Finanzas — caja | Solo borrar; no hay ficha de movimiento |
| Finanzas — ventas hoy / CxC / charts | Agregados, no filas de expediente |
| Inventario — reportes | Analítica |
| Inventario — órdenes | Recibir / cancelar; no hay diálogo de detalle |
| Inventario — alertas / dashboard | KPIs y avisos |
| Dashboard — por cobrar | CTA operativo (abrir/agregar ticket), no ficha |
| Uso del sistema | Métrica |
| Configuración | Formulario, no tabla de registros |

---

## Cierre

- [x] Validación L2 registrada (smoke autenticado pendiente de Luis en `:4200`)
- [x] `node scripts/specs-index.mjs`
- [ ] Commit / deploy — solo si Luis lo pidió
