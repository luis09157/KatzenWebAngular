# Tasks: Plan automatización y specs vivas (078)

**Spec:** `specs/078-plan-automatizacion-y-specs-vivas/spec.md`  
**Nivel de cambio:** L2 (docs)

---

## Implementación

### Fase A — Regla obligatoria

- [x] `agent-guardrails.md`: sección **DESPUÉS DE CODEAR / AL CERRAR** + anti-duplicación
- [x] Hook corto en `.cursor/rules/sdd-workflow.mdc`
- [x] Hook corto en `AGENTS.md`

### Fase B — Spec del plan

- [x] `specs/078-plan-automatizacion-y-specs-vivas/spec.md`
- [x] `tasks.md` (este archivo)
- [x] Backlog P1–P6 documentado

### Fase C — Memoria al día

- [x] `module-map.md`: estado modular 075–077 + anti-duplicación / enlace
- [x] `PLAN-UX-VETERINARIAS.md`: nota specs vivas 078; prod vs modular local
- [x] `ROADMAP.md` + intro INDEX (script): enlace 078
- [x] Specs 075/076/077: QA 077 ya registrada; nota de cierre si aplica
- [x] Tabla anti-duplicación en guardrails

### Fase D — Plantilla

- [x] `specs/templates/module-tasks.template.md` — código tocado / memoria
- [x] `specs/templates/module-spec.template.md` — bloque no duplicar / memoria
- [x] `node scripts/specs-index.mjs`

---

## Validación (L2 docs)

| Verificación | Resultado | Notas |
|--------------|-----------|-------|
| INDEX regenerado | **OK** | incluye 078 |
| TS / build app | N/A | solo docs |
| RTDB | N/A | |

### Código tocado / utils reutilizados / no duplicar

- **Docs solo.** No se extrajo código TS.
- Referencia anti-duplicación: `agent-guardrails.md` + `module-map.md` §6–7.

### Memoria actualizada

- [x] module-map
- [x] guardrails
- [x] INDEX
- [x] PLAN-UX / ROADMAP

---

## Criterios spec

- [x] SC-001 … SC-008

---

## Cierre

- [x] Validación L2 docs registrada
- [x] Spec → done + INDEX
- [ ] Commit / deploy — **no** (Luis no autorizó)
