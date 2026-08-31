# Tasks: Servicios de clínica

**Spec:** `specs/056-servicios-clinica/spec.md`  
**Plan:** `specs/056-servicios-clinica/plan.md`  

---

## Implementación

### Setup

- [x] Carpeta spec `056-servicios-clinica` (056 libre)
- [x] Plan contratos + rollback

### Backend

- [x] Reglas RTDB `Katzen/ServiciosClinica` (archivo; **sin deploy**)
- [x] Cloud Function: no aplica
- [ ] `firebase deploy --only database` — **no** en esta ola

### Frontend

- [x] Módulo lazy + routing + StaffModule `servicios-clinica`
- [x] Servicio + modelo + util
- [x] Lista + diálogo
- [x] POS riel Consulta
- [x] UI admin-page / dialog-shell / flow-hint
- [x] Costo + IVA + ganancia (diálogo, listado, snapshot en línea POS)
- [x] Productos: desglose IVA incluido + ganancia neta (sin reescribir 022)
- [x] Baño: lectura de ganancia (venta − costo)

### Integración

- [x] Menú Administración
- [x] Hint baño → Finanzas
- [x] Campo aditivo `servicioClinicaId` en líneas de visita
- [x] Mocks + `test:056`

---

## Testing

> **Quién ejecuta:** el agente.  
> Guía: `specs/templates/qa-validation-guide.md`

- [x] `npm run build` — exit 0 (2026-08-30, Hash `c3f2926c4ed00bb0`; warning de budget inicial 2.35 MB, preexistente)
- [x] `npm run test:056` — 34 SUCCESS (2026-08-31; incluye precio-margen + visitas.util)
- [x] `npm run test:043` — 25 SUCCESS (producto + IVA)
- [x] Servidor local `http://localhost:4200` (`ng serve` PID vivo; SPA con `Accept: text/html`)
- [x] Empty state / permission-denied: `getServicios()` hace `catchError(() => of([]))` — lista vacía, no TypeError
- [x] Cypress smoke ruta — añadido; **no** se corre E2E en esta ola (sin deploy)

**Resultado:** OK local (build + unit + serve). Persistencia RTDB prod **bloqueada** hasta `firebase deploy --only database` (Luis no lo autorizó). Snapshot costo/IVA en líneas es aditivo (tickets viejos sin esos campos siguen cobrando igual).

```
npm run build → exit 0 · Hash f0bfdbd64c03e541 (budget warning 2.35 MB, preexistente)
npm run test:056 → TOTAL: 34 SUCCESS
npm run test:043 → TOTAL: 25 SUCCESS
ng serve → http://localhost:4200
```

---

## Testing y validación exhaustiva

> Registrar **antes** de marcar cierre `done`.

### Checklist pre-entrega

- [x] Guía QA aplicada
- [x] `npm run build` OK
- [x] Live preview :4200
- [x] Tabla de resultados
- [x] Chips, loading, dialog-shell

### Registro de resultados QA

| Escenario | Resultado | Notas |
|-----------|-----------|-------|
| Formularios — campos vacíos | OK código | `nombre` required; `precio_costo` y `precio_venta` required; Guardar disabled si invalid |
| Formularios — costo ≥ venta | OK tests | `validarFormularioServicioClinica` + `ventaMayorQueCostoValidator` |
| Formularios — IVA | OK código | checkbox default ON en alta; tasa 16; desglose en vivo |
| UI — chips estado/IVA completos | OK código | `.estado-badge` + `mat-column-estado` / `mat-column-iva` min-width 148px |
| Modales — admin-dialog-shell | OK código | sin `mat-dialog-title`; Costo / Precio / IVA / ganancia |
| Copy costo vs venta | OK código | «Lo que te cuesta a ti» vs «Lo que cobra el cliente» |
| UI — diálogos --picker | N/A | CRUD form, no picker |
| UI — timepicker | N/A | sin hora |
| UI — loading contextual | OK código | Cargando / Guardando / Eliminando |
| UI — loading no trabado | OK código | `hide()` en `finally` |
| UI — doble submit | OK código | `loading \|\| form.invalid` |
| Edge — red/permission-denied | OK código | lista vacía |
| Edge — líneas POS sin snapshot | OK código | campos opcionales; cobro usa `monto` |
| Modelo IVA incluido | OK tests | 400 @16% → neta 344.83, IVA 55.17, ganancia con costo 100 = 244.83 |
| Productos ganancia neta | OK código | diálogo + columna margen; salida caja ya no suma IVA encima |
| Baño ganancia | OK código | lectura `precio_total − costoEstimado`; 022 intacto |
| Servidor local :4200 + smoke | OK | landing 200; rutas admin SPA con Accept text/html; `ng serve` vivo |
| Build `npm run build` | OK | exit 0 Hash `f0bfdbd64c03e541` |
| Tests unitarios | OK | test:056 34 SUCCESS · test:043 25 SUCCESS |

```
npm run build exit 0 · Hash f0bfdbd64c03e541
test:056 TOTAL: 34 SUCCESS
test:043 TOTAL: 25 SUCCESS
```

---

## Criterios spec (SC-xxx)

- [x] SC-001: pantalla admin
- [x] SC-002: diálogo alta/edición
- [x] SC-003: borrar = baja lógica
- [x] SC-004: hint Finanzas baño
- [x] SC-005: POS lista servicios + vacuna/medicamento
- [x] SC-006: sin prompt si hay precio
- [x] SC-007: tipo domicilio
- [x] SC-008: baño no migra
- [x] SC-009: costo + IVA + ganancia en diálogo servicio
- [x] SC-010: snapshot económico en línea de ticket
- [x] SC-011: productos IVA incluido + ganancia neta
- [x] SC-012: baño muestra ganancia (022 intacto)

---

## Cierre

- [ ] Validación pre-entrega registrada
- [ ] `spec.md` → `done` solo con QA
- [ ] Commit / deploy — **no** salvo que Luis lo pida (esta ola sin deploy)
