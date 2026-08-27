# Tasks: Flujo visita del día (041)

## Implementación

- [x] `visita-dia-flujo.models.ts` + `VisitaDiaFlujoService` + diálogo
- [x] Hook en `citas.component` al completar (menú + modal guardar)
- [x] Historial prefilled con motivo de cita + `cita_id` al guardar
- [x] Ruta historial+ticket con `historialId` en línea
- [x] Diálogo `--picker` con X / Después; sin Swal encima del selector
- [x] Path RTDB historial = `Katzen/Historiales_Clinicos` (no `Katzen/Historiales`)

## Testing y validación exhaustiva

### Resultados QA — 2026-08-26

| Escenario | Resultado | Notas |
|-----------|-----------|-------|
| Formularios — campos vacíos | N/A | Selector de acciones, no form CRUD |
| Formularios — tipos erróneos | N/A | |
| Formularios — límites texto | N/A | |
| UI — chips estado completos | N/A | No hay chips en este diálogo |
| UI — nombres persona completos (desktop) | OK | Subtítulo paciente · cliente |
| UI — celdas multi-línea (gap) | N/A | |
| UI — layout ancho desktop | N/A | Overlay picker 520px |
| UI — shells auth/portal centrados | N/A | |
| Modales — apertura/cierre | OK | X, Después, backdrop |
| UI — diálogos --picker | OK | `admin-dialog-shell--picker` |
| UI — timepicker en campos hora | N/A | |
| UI — copy destructivo «Borrar» | N/A | |
| UI — retroalimentación | OK | Sin Swal solapado al completar |
| UI — loading contextual | OK | Overlay se oculta antes del flujo |
| UI — loading no trabado | OK | `finally` hide |
| UI — doble submit | N/A | Acciones cierran el diálogo |
| Edge — red lenta/error | OK | ErrorMessagesService en ticket/historial |
| Edge — datos nulos RTDB | OK | `puedeOfrecerFlujoVisitaDia` exige cliente+paciente |
| Servidor local :4200 + smoke | OK | ng serve vivo; login admin OK |
| Build `npm run build` | OK | exit 0 |

| # | Verificación | Resultado |
|---|--------------|-----------|
| 1 | `npm run test:041` | **7/7 PASS** |
| 2 | `npm run build` | **exit 0** |
| 3 | Cypress `admin-modules-authenticated` | **19/19 PASS** (citas + visitas) |
| 4 | Servidor `:4200` | vivo |

## Entrega

- [x] spec.md → done
