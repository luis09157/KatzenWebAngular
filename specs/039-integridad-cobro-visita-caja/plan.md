# Plan: Integridad de cobro visita ↔ caja (039)

## Contratos de Datos y UI (Obligatorio)

| Entidad | Campo nuevo / uso | Tipo | Obligatorio | UI |
|---------|-------------------|------|-------------|-----|
| `Katzen/Citas/{id}` | `cobrada` | boolean | No | Menú cita: deshabilita caja |
| `Katzen/Citas/{id}` | `cobradaEnVisitaId` | string | No | Solo RTDB |
| `Katzen/Pension/Estancias/{id}` | `cobradaEnVisitaId` | string | No | Refuerzo finanzas |
| Baños/Citas UI | Bloqueo `registrarEnCaja` | — | — | Swal + menú disabled |

**Reglas:**

- Cobro directo en caja: bloqueado si `cajaMovimientoId`, `visitaId` o `cobrada`.
- Propagación solo cuando visita pasa a `estado: cerrada` (saldo 0).
- Refuerzo KPI: helper `debeExcluirRefuerzoIngresoServicio` — excluye `visitaId` y `cajaMovimientoId`.

**Compatibilidad móvil:** campos aditivos opcionales; sin renombrar nodos.

## Plan de Mitigación y Rollback

1. **Rollback código:** revertir commit 039; UI vuelve a permitir doble cobro (comportamiento anterior).
2. **Datos:** campos `cobrada` / `cobradaEnVisitaId` son informativos; no borrar en rollback.
3. **KPIs:** si hay duda, comparar ingresos caja vs dashboard tras deploy; refuerzo es conservador (excluye más, no infla).

## Archivos tocados

- `src/app/core/utils/cobro-integridad.util.ts`
- `src/app/visitas/visitas.service.ts` — `propagarCobroServiciosOrigen`
- `src/app/citas/citas.component.ts` + `.html`
- `src/app/banios/banios.component.ts` + `.html`
- `src/app/dashboard/owner-dashboard.service.ts`
- `src/app/finanzas/caja.service.ts` + `caja.models.ts`
- `src/app/pension/pension.models.ts`

## Implementación

1. Util compartido anti-doble-cobro / refuerzo
2. Guards en `registrarEnCaja` baños/citas
3. Propagación en `actualizarVisita` al cerrar
4. Filtros refuerzo dashboard + finanzas
