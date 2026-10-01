# Tasks: Modularidad y memoria agentes

**Spec:** `specs/075-modularidad-y-memoria-agentes/spec.md`  
**Plan:** `specs/075-modularidad-y-memoria-agentes/plan.md`  
**Nivel de cambio:** L2

---

## Implementación

### Docs / memoria

- [x] `specs/memory/agent-guardrails.md`
- [x] `specs/memory/module-map.md`
- [x] Spec 075 (`spec.md` / `plan.md` / `tasks.md`)
- [x] Actualizar `AGENTS.md` + `sdd-workflow.mdc` (lectura obligatoria guardrails)
- [x] Actualizar `specs/README.md` (memory files)
- [x] Unificar Resend en `domain-context` backlog
- [x] Línea 075 en ROADMAP / PLAN-UX
- [x] `node scripts/specs-index.mjs`

### Código

- [x] Barrel `src/app/core/utils/index.ts`
- [x] Extracto `pos-copy.util.ts` + tests; cablear `visita-dialog`

---

## Validación

> L2: registro corto. Checklist completa: `specs/templates/qa-validation-guide.md` (N/A tablas largas).

| Verificación | Resultado | Notas |
|--------------|-----------|-------|
| `npm run build` (exit 0) | **OK** | exit 0; budget warning initial bundle (preexistente) |
| Unit tests `pos-copy.util` | **OK** | 5/5 SUCCESS ChromeHeadless |
| `npm run lint` (0 errores) | **OK** | 0 errors, 578 warnings preexistentes |
| RTDB | N/A | no toca datos |
| Smoke 375/1280 | N/A docs | sin cambio UI visual |

```
lint: 0 errors / 578 warnings
build: exit 0 (Hash 7947dd90bf78a805)
ng test pos-copy.util.spec: TOTAL 5 SUCCESS
```

---

## Criterios spec (SC-xxx)

- [x] SC-001 agent-guardrails
- [x] SC-002 module-map
- [x] SC-003 AGENTS + sdd-workflow
- [x] SC-004 contradicciones Resend / UI rule
- [x] SC-005 INDEX + ROADMAP/PLAN-UX
- [x] SC-006 plan límites
- [x] SC-007 barrel + pos-copy
- [x] SC-008 lint + build + tests

---

## Cierre

- [x] Validación L2 registrada arriba
- [x] `spec.md` → `done` + índice regenerado
- [x] Continuación: **076** / **077** (utils); proceso specs vivas → **078** (2026-10-01)
- [ ] Commit / deploy — **no** (Luis no autorizó)
