# Tasks: Portal baños + Finanzas ingresos por servicio

**Spec:** `specs/028-portal-banos-finanzas-servicio/spec.md`  
**Plan:** `specs/028-portal-banos-finanzas-servicio/plan.md`

---

## Implementación

- [x] Rules RTDB Banios lectura client
- [x] Portal: mapper, data service, ruta, list-section, detalle mascota
- [x] Finanzas: tab ingresos por servicio + desglose caja + refuerzo baños
- [x] Mocks `MOCK_PORTAL_BANIO(S)`
- [x] Cypress portal banos + finanzas tab
- [x] Unit test `mapBanio`

---

## Testing y validación exhaustiva

| Escenario | Resultado | Notas |
|-----------|-----------|-------|
| Build `npm run build` | OK | exit 0, hash 5d45ae49e2908075 |
| Unit `mapBanio` | OK | portal-mapper.util.spec.ts añadido |
| Servidor :4200 smoke | OK | reiniciado npm start |
| Cypress | omitido sin credenciales | portal-auth + admin-crud-finanzas actualizados |

---

## Criterios spec

- [x] SC-001…SC-010
