# Plan: Portal baños + Finanzas ingresos por servicio

**Spec:** `specs/028-portal-banos-finanzas-servicio/spec.md`  
**Estado:** approved

---

## Archivos

| Archivo | Acción |
|---------|--------|
| `database.rules.json` | Banios read client |
| `src/app/portal/utils/portal-mapper.util.ts` | `mapBanio` |
| `src/app/portal/services/portal-data.service.ts` | `getBaniosPorMascota`, counts |
| `src/app/portal/list-section/*` | sección `banos` |
| `src/app/portal/mascota-detalle/*` | card baños |
| `src/app/portal/portal-routing.module.ts` | ruta banos |
| `src/app/finanzas/caja.models.ts` | `CajaIngresoDesglose` |
| `src/app/finanzas/caja.service.ts` | `desgloseIngresosPorServicio` |
| `src/app/finanzas/finanzas.component.*` | tab ingresos |
| `src/app/core/testing/mock-data.ts` | mocks portal baños |
| `cypress/e2e/portal-auth-smoke.cy.ts` | visit banos |
| `cypress/e2e/admin-crud-finanzas.cy.ts` | tab ingresos |

---

## Contratos de Datos y UI (Obligatorio)

- RTDB: rules aditivas en `Banios` (paridad `Citas`)
- Portal payload baño: fecha, hora, tipo, estado, peluquero, observaciones — sin costo/caja
- Finanzas: ingresos = suma caja ingreso por categoría + baños sin `cajaMovimientoId` → categoría baño

---

## Plan de Mitigación y Rollback

| Riesgo | Mitigación | Rollback |
|--------|------------|----------|
| Client lee baños ajenos | rules + `getMascotaForCliente` | revert rules |
| Doble conteo baños+caja | excluir baños con `cajaMovimientoId` | revert caja.service |
| Rules prod | deploy `--only database` autorizado | reglas previas en git |

---

## Deploy

Hosting + database rules (autorizado Luis 2026-08-26).
