# Tasks: Ticket completo + Por cobrar hoy (040)

## Implementación

- [x] `por-cobrar-hoy.models.ts` + `por-cobrar-hoy.util.ts` + tests
- [x] `visita-atalho.util.ts` — prompt monto compartido
- [x] VisitasService: `vacunaId`, `historialId`, `marcarVisitaIdEnOrigen`, propagación vacuna/historial
- [x] Vacunas / Pensión / Historiales → «Agregar a visita» + anti-doble-cobro caja
- [x] Panel **Por cobrar hoy** en `/admin/visitas` + KPI + filtro rápido
- [x] VisitasDialogModule en vacunas, pensión, historiales

## Fuera de alcance (backlog)

- [x] Venta inventario directa → línea ticket (spec **042**)
- [x] Flujo guiado post-cita completada (spec **041**)

## Testing y validación exhaustiva

| # | Verificación | Resultado |
|---|--------------|-----------|
| 1 | `npm run test:040` | **12/12 PASS** (incluye historial por cobrar) |
| 2 | `npm run test:039` (regresión integridad cobro) | **13/13 PASS** |
| 3 | `npm run build` | **exit 0** |
| 4 | Cypress `/admin/visitas` | **PASS** (admin-modules-authenticated) |
| 5 | Servidor `:4200` | vivo (ng serve) |

## Entrega

- [x] spec.md → done
