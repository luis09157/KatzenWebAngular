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
- [x] `npm run test:056` — 11 SUCCESS
- [x] Servidor local `http://localhost:4200` (ng serve compiló chunk `servicios-clinica-servicios-clinica-module`)
- [x] Empty state / permission-denied: `getServicios()` hace `catchError(() => of([]))` — lista vacía, no TypeError
- [x] Cypress smoke ruta — añadido; **no** se corre E2E en esta ola (sin deploy)

**Resultado:** OK local (build + unit + serve). Persistencia RTDB prod **bloqueada** hasta `firebase deploy --only database` (Luis no lo autorizó).

```
npm run build → exit 0
npm run test:056 → TOTAL: 11 SUCCESS
ng serve → Compiled successfully · http://localhost:4200
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
| Formularios — campos vacíos | OK código | `nombre` required + minLength 2; `mat-error`; Guardar disabled si invalid |
| Formularios — tipos erróneos | OK código | `precio_venta` `min(0)`; tipo solo del enum; util `validarFormularioServicioClinica` |
| Formularios — límites texto | OK código | nombre maxlength 120; notas 500 |
| UI — chips estado completos | OK código | `.estado-badge` + `mat-column-estado` min-width 148px |
| Modales — apertura/cierre | OK código | `admin-dialog-shell`, close, Cancelar; sin `mat-dialog-title` |
| UI — diálogos --picker | N/A | CRUD form, no picker |
| UI — timepicker en campos hora | N/A | sin hora |
| UI — retroalimentación | OK código | Swal éxito/error + `ErrorMessagesService` |
| UI — loading contextual | OK código | Cargando / Guardando / Eliminando |
| UI — loading no trabado | OK código | `hide()` en `finally` |
| UI — doble submit | OK código | `loading \|\| form.invalid` |
| Edge — red lenta/error | OK código | permission-denied → `[]` + empty state |
| Edge — datos nulos RTDB | OK código | defaults en map del service |
| Servidor local :4200 + smoke | OK | landing 200; chunk 056 en compile |
| Build `npm run build` | OK | exit 0 |
| Tests unitarios modelo | OK | 11 SUCCESS |

```
npm run build exit 0 · Hash c3f2926c4ed00bb0
test:056 TOTAL: 11 SUCCESS
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

---

## Cierre

- [ ] Validación pre-entrega registrada
- [ ] `spec.md` → `done` solo con QA
- [ ] Commit / deploy — **no** salvo que Luis lo pida (esta ola sin deploy)
