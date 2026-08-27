# Plan: Flujo visita del día (041)

## Contratos de Datos y UI

| Pieza | Comportamiento |
|-------|----------------|
| `VisitaDiaFlujoDialogComponent` | Picker admin-dialog-shell--picker |
| `VisitaDiaFlujoService.ofrecerFlujo` | Solo si cliente+paciente y sin cobro previo |
| Historial desde cita | `motivo_consulta`, `cita_id` en data del diálogo |

Campos RTDB aditivos: ninguno obligatorio nuevo (`cita_id` en historial opcional futuro).

## Plan de Mitigación

Revertir commit 041; citas vuelven a completarse sin diálogo guiado.
