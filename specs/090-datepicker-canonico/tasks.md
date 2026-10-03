# Tasks — 090 datepicker canónico

**Nivel:** L2 · Spec `090-datepicker-canonico/spec.md`

## Implementación

- [x] `datepicker.util.ts` + unit tests
- [x] `app-datepicker-field` (CVA, locale es-MX, click → open)
- [x] Export en `SharedModule`
- [x] Migrar `type="date"` → `app-datepicker-field`
- [x] Click-open en mat-datepicker legacy
- [x] Spec + memoria (guardrails, module-map, ADMIN-UI, QA guide)

## QA L2 (2026-10-02 / cierre)

| Check | Resultado |
|-------|-----------|
| Unit tests util | `npx ng test --include=**/datepicker.util.spec.ts --browsers=ChromeHeadless --watch=false` → **TOTAL: 3 SUCCESS**, exit **0** |
| `npm run build` | exit **0** (reconfirmado 2026-10-03; warning budget bundle inicial 3.00 MB > 2.50 MB) |
| `type="date"` residual | **0** en `src/**` HTML/TS; queda `type="month"` en finanzas (filtro mes, fuera de alcance) |
| `npm start` :4200 | vivo (HTTP 200) |
| Smoke 375 / 1280 | Pensión «Nueva estancia»: click Fecha ingreso abre calendario; valor ISO en form (probar en localhost tras login) |

**Código vive en:** `src/app/shared/datepicker/` · consumidores listados en `spec.md`.
