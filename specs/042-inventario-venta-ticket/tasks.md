# Tasks: Venta inventario → ticket (042)

## Implementación

- [x] Salida dialog: destino caja vs ticket + selector cliente
- [x] `abrirVisitaTrasVenta` + propagación `cajaMovimientoId` al cerrar ticket
- [x] `visitaId` en modelo Movimiento
- [x] Estilos radio destino cobro (overlay CDK)

## Testing y validación exhaustiva

### Resultados QA — 2026-08-26

| Escenario | Resultado | Notas |
|-----------|-----------|-------|
| Formularios — campos vacíos | OK | Producto/cantidad/motivo required; cliente required si destino=visita |
| Formularios — tipos erróneos | OK | Cantidad min 1; stock insuficiente bloquea |
| Formularios — límites texto | OK | Observaciones textarea |
| UI — chips estado completos | N/A | |
| UI — nombres persona completos (desktop) | OK | Autocomplete cliente |
| UI — celdas multi-línea (gap) | N/A | |
| UI — layout ancho desktop | N/A | Diálogo |
| UI — shells auth/portal centrados | N/A | |
| Modales — apertura/cierre | OK | Cancelar / X |
| UI — diálogos --picker | N/A | Diálogo form estándar |
| UI — timepicker en campos hora | N/A | |
| UI — copy destructivo «Borrar» | N/A | |
| UI — retroalimentación | OK | Swal éxito / error |
| UI — loading contextual | OK | Guardando… |
| UI — loading no trabado | OK | hide en success y catch |
| UI — doble submit | OK | `loading` deshabilita botón |
| Edge — red lenta/error | OK | ErrorMessagesService |
| Edge — datos nulos RTDB | OK | Producto/cliente opcionales |
| Servidor local :4200 + smoke | OK | `/admin/inventario/movimientos` Cypress PASS |
| Build `npm run build` | OK | exit 0 |

| # | Verificación | Resultado |
|---|--------------|-----------|
| 1 | `npm run build` | **exit 0** |
| 2 | `npm run test:039` | **13/13 PASS** |
| 3 | `npm run test:042` | **12/12 PASS** (incluye path Historiales_Clinicos + movimiento) |
| 4 | Cypress `/admin/inventario/movimientos` | **PASS** |
| 5 | Cypress suite módulos | **19/19 PASS** (reportes selector corregido) |
| 6 | Servidor `:4200` | vivo |

## Entrega

- [x] spec.md → done
