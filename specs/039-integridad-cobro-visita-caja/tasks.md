# Tasks: Integridad de cobro (039)

## Implementación

- [x] Util `cobro-integridad.util.ts` + unit tests
- [x] Bloqueo `registrarEnCaja` / menú baños y citas
- [x] Bloqueo «Marcar pagado» baño con visitaId
- [x] `propagarCobroServiciosOrigen` en VisitasService
- [x] Refuerzo dashboard + finanzas excluye visitaId
- [x] Fix blockers suite global: `precio-margen.util.spec.ts`, `dashboard.component.spec.ts`

## Testing y validación exhaustiva

| # | Verificación | Resultado | Evidencia |
|---|--------------|-----------|-----------|
| 1 | Unit spec 039 (13 tests) | **PASS 13/13** | `npm test -- --watch=false --include=src/app/core/utils/cobro-integridad.util.spec.ts --include=src/app/visitas/visitas.service.spec.ts --include=src/app/visitas/visitas.util.spec.ts --include=src/app/finanzas/caja.service.spec.ts` |
| 2 | `cobro-integridad.util` — bloqueo visitaId/caja/cobrada | PASS | 4 tests |
| 3 | `visitas.service` — propagación cerrada vs parcial | PASS | 2 tests (baño pagado, cita cobrada, pensión cobradaEnVisitaId) |
| 4 | `caja.service` — refuerzo excluye visitaId | PASS | 2 tests |
| 5 | `visitas.util` — recalcular saldo/estado | PASS | 4 tests |
| 6 | Suite global Karma | 114/133 PASS | 19 fallos **preexistentes** (component specs sin Firebase mock: CitasComponent, PacientesComponent, HistorialDialog, etc.) — no introducidos por 039 |
| 7 | `npm run build` | **exit 0** | 2026-08-27 |
| 8 | Cypress `/admin/visitas` autenticado | **PASS** | `admin-modules-authenticated.cy.ts` |
| 9 | Cypress Finanzas ingresos por servicio | **PASS** | `admin-finanzas-ingresos-servicio.cy.ts` |
| 10 | Cypress `/admin/finanzas` autenticado | **PASS** | mismo spec módulos |
| 11 | Servidor local `:4200` | **vivo** | ng serve reiniciado 2026-08-27 |
| 12 | UI menú baños/citas — disabled + label «Cobrar en visita» | PASS (código + template) | `[disabled]` + Swal en TS |

**Comando unit 039 (repetible):**

```bash
npm test -- --watch=false --browsers=ChromeHeadless \
  --include=src/app/core/utils/cobro-integridad.util.spec.ts \
  --include=src/app/visitas/visitas.service.spec.ts \
  --include=src/app/visitas/visitas.util.spec.ts \
  --include=src/app/finanzas/caja.service.spec.ts
```

**Cypress relevante:**

```bash
npx cypress run --spec "cypress/e2e/admin-modules-authenticated.cy.ts,cypress/e2e/admin-finanzas-ingresos-servicio.cy.ts"
```

Nota: fallo Cypress `admin/inventario/reportes` **corregido 2026-08-26** (selector `.reportes-contenedor`). Suite `admin-modules-authenticated` → **19/19 PASS**.

## Entrega

- [x] Servidor `:4200` vivo
- [x] spec.md → done
