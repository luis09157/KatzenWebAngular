# Plan: Ticket completo + Por cobrar hoy (040)

## Contratos de Datos y UI (Obligatorio)

| Entidad | Campo | Tipo | UI |
|---------|-------|------|-----|
| Vacunas | `visitaId?` | string | Menú agregar a visita |
| Historiales | `visitaId?`, `cobradaEnVisitaId?` | string/bool | Menú + bloqueo caja |
| Pensión | `visitaId?` | string | Botón agregar + bloqueo caja |
| Visita línea | `historialId?`, `movimientoInventarioId?` | string | RTDB aditivo |

**Por cobrar hoy:** agregación en memoria (no nodo RTDB nuevo).

## Plan de Mitigación y Rollback

Revertir commit 040; campos `visitaId` opcionales no rompen móvil.
