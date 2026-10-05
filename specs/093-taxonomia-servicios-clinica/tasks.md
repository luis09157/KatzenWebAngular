# Tasks: Taxonomía de servicios de clínica (tipo + domicilio)

**Spec:** `specs/093-taxonomia-servicios-clinica/spec.md`  
**Nivel de cambio:** L2 (Fase 1) + L3 (Fase 2 — script migración aditiva; apply prod solo Luis)

---

## Implementación

### Frontend / utils (Fase 1)

- [x] Tipos UI: `consulta` | `diagnostico` | `procedimiento` | `otro` (sin Domicilio en dropdown)
- [x] Flag `esDomicilio?: boolean` en diálogo Nuevo/Editar
- [x] Lectura legacy: `tipo === 'domicilio'` → `esDomicilio` + tipo efectivo `consulta` (`hidratarServicioClinica`)
- [x] Altas/edición: nunca escribir `tipo: domicilio`; escribir tipo clínico + `esDomicilio`
- [x] POS riel Consulta: badge «Domicilio» (sin riel nuevo)
- [x] Mapeo línea→caja: `procedimiento` → `cirugia`; legacy domicilio ya no fuerza `otro`
- [x] KPIs: Activos · Consultas · Diagnóstico · Procedimientos · A domicilio (flag/legacy)
- [x] Unit tests `servicios-clinica.util.spec.ts`

### Fase 2 (SC-008)

- [x] Util `planPatchMigracionDomicilio` + `planMigracionServiciosClinicaDomicilio` + tests
- [x] Util `contarKpisServiciosClinica` / `labelTipoClinicoParaReporte` (consulta ≠ diagnóstico en catálogo)
- [x] Script `scripts/migrate-servicios-clinica-domicilio.mjs` (dry-run default; guards prod)
- [x] npm scripts `migrate:093:domicilio` / `:emulator`
- [x] `plan.md` con contratos + rollback + pasos Luis
- [x] Caja/P&L: **sin** categoría nueva `diagnostico` (documentado; sigue bucket `consulta`)
- [ ] Apply migración en **producción** — solo Luis (agente no ejecutó)

---

## Código tocado / utils reutilizados / no duplicar

| Qué | Ruta / nota |
|-----|-------------|
| Modelos | `src/app/servicios-clinica/servicios-clinica.models.ts` |
| Utils (legacy, flag, mapeo, hidratar, migración, KPIs) | `src/app/servicios-clinica/servicios-clinica.util.ts` |
| Service CRUD | `src/app/servicios-clinica/servicios-clinica.service.ts` |
| Diálogo + lista KPIs | `servicio-clinica-dialog.*`, `servicios-clinica.component.*` |
| POS badge + categoría | `visita-dialog.component.ts\|html` |
| Script SC-008 | `scripts/migrate-servicios-clinica-domicilio.mjs` (+ `scripts/lib/guard-prod.mjs`) |
| Plan L3 | `specs/093-taxonomia-servicios-clinica/plan.md` |
| Mocks | `src/app/core/testing/mock-data.ts` |
| No inventado | Segundo catálogo, riel Domicilio, categoría caja `diagnostico`, escritura prod |

---

## Validación

### Fase 1 (L2)

| Verificación | Resultado | Notas |
|--------------|-----------|-------|
| `npm run build` | OK | exit 0 |
| Unit tests util | OK | 8/8 luego ampliados en Fase 2 |
| Smoke 375 / 1280 | pendiente Luis | `/admin/servicios-clinica` + POS |

### Fase 2 (L3 ligero)

| Verificación | Resultado | Notas |
|--------------|-----------|-------|
| `npm run build` | OK | exit 0 (budget warning previo) |
| Unit tests util (migración + KPIs) | OK | 10/10 SUCCESS |
| Script dry-run | no prod | default sin `--apply`; agente no tocó `katzen-a0e3e` |
| Apply emulador | opcional Luis | `--apply` + `FIREBASE_DATABASE_EMULATOR_HOST` |
| Apply prod | **NO ejecutado** | requiere Luis: `CONFIRM_PROD` + `MIGRATE_CONFIRM=LUIS` |
| RTDB aditiva | OK | solo `tipo`/`esDomicilio`/`updated_at`; no Visitas |
| Deploy database/hosting | **NO** | no aplica |

```
TOTAL: 10 SUCCESS (servicios-clinica.util.spec.ts)
npm run build → exit 0
Apply prod / deploy → NO ejecutados
```

---

## Criterios spec (SC-xxx)

- [x] SC-001 … SC-007, SC-009 (Fase 1)
- [x] SC-008: script + util documentados; apply prod pendiente autorización Luis

---

## Memoria actualizada (specs vivas — 078)

- [x] `module-map.md`
- [x] `agent-guardrails.md` + `domain-context.md`
- [x] `INDEX` (`node scripts/specs-index.mjs`)
- [x] Este `tasks.md` + `plan.md`
