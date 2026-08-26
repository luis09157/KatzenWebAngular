# Tasks: Meta de inversión dashboard

**Spec:** `specs/030-meta-inversion-dashboard/spec.md`

---

## Implementación

- [x] Spec + plan + contratos RTDB
- [x] `ClinicConfigService` + modelo
- [x] `OwnerDashboardService.gananciaAcumulada$` + `inversionMetaProgress$`
- [x] Panel dashboard + diálogo configurar meta
- [x] Rules `Katzen/Config/inversionMeta`
- [x] Mock `MOCK_INVERSION_META`

---

## Testing y validación exhaustiva

| Verificación | Resultado |
|--------------|-----------|
| `npm run build` | OK exit 0 · 2026-08-26 · hash ca4b94f (budget warning 2.09MB) |
| Guía QA formularios/modal meta | OK — diálogo picker, validación min>0, loading guardar |
| Smoke visual `/admin/inicio` | OK — dev server :4200 vivo (live reload) |
| Cypress admin smoke | N/A ruta existente en admin-smoke |
| localhost :4200 | OK — `npm start` activo |

---

## Deploy (autorizado Luis)

- [ ] `firebase deploy --only hosting,database`
