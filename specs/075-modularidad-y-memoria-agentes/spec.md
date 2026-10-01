# Spec: Modularidad y memoria para agentes

**ID:** 075-modularidad-y-memoria-agentes  
**Estado:** done  
**Fecha:** 2026-09-30  
**Autor:** Agente (pedido de Luis Alfonso Niño Martínez)  
**Nivel:** L2 (docs + extractos seguros de utils; sin RTDB; sin deploy)

---

## Problema

1. El repo creció con muchas specs y módulos Angular; sin mapa ni checklist corta, los agentes **reinventan** o tocan lo que no debían (prod, Excel, portal agenda, expediente del dueño, etc.).
2. Querer “más modular” no puede ser un rewrite masivo: hay que **documentar límites** y hacer **cortes seguros** (utils + tests).
3. Falta un archivo de memoria operativa (`agent-guardrails`) que se lea **antes de codear**, sin duplicar la checklist QA de 17 filas en rules always-applied.

---

## User stories

### US-1 — Memoria que el agente usa primero

Como **Luis / agente**  
Quiero **guardrails + mapa de módulos + enlace obligatorio desde AGENTS/SDD**  
Para **evitar retrabajo y errores de alcance**

**Criterios de aceptación:**

- [ ] SC-001: Existe `specs/memory/agent-guardrails.md` con checklist ANTES DE CODEAR, prohibiciones y decisiones 065–074.
- [ ] SC-002: Existe `specs/memory/module-map.md` (Admin / Portal / Landing / Core / Shared / Inventario / Visitas / Finanzas).
- [ ] SC-003: `AGENTS.md` y `.cursor/rules/sdd-workflow.mdc` obligan a leer `agent-guardrails.md` + `constitution.md` antes de implementar.
- [ ] SC-004: Contradicciones Resend / UI alwaysApply unificadas con evidencia (fuente canónica en guardrails).
- [ ] SC-005: Spec 075 en INDEX; ROADMAP o PLAN-UX menciona memoria agentes 075.

### US-2 — Modularización incremental

Como **desarrollador / agente**  
Quiero **1–3 mejoras estructurales de bajo riesgo + plan de fases**  
Para **reducir acoplamiento sin reescribir Angular**

**Criterios de aceptación:**

- [ ] SC-006: `plan.md` define límites de módulos y fases siguientes (sin rewrite).
- [ ] SC-007: Al menos un extracto puro a `*.util.ts` con unit tests **o** barrel documentado de `core/utils` + extracto POS copy.
- [ ] SC-008: `npm run lint` 0 errores; `npm run build` exit 0; tests de utils tocados pasan.

---

## Fuera de alcance

- `git commit` / `git push` / `firebase deploy`.
- Rewrite de `visita-dialog` / `pacientes` completos.
- Cambios RTDB / rules / Functions.
- Importador Excel.
- Cerrar specs in_progress ajenas (053, 054, 055, 056, 059–061, 064, 072, 074).

---

## Contratos de Datos y UI

- **RTDB:** ninguno en esta entrega.
- **Datos de prueba:** mocks / localhost si se valida UI; no prod.
- **UI:** sin cambios visuales obligatorios; extractos de copy POS preservan strings existentes.

---

## Roles

N/A (docs + utils). Todo staff/agente de desarrollo.

---

## Testing mínimo

Ver `tasks.md`. Lint + build + unit tests de utils nuevos/tocados.

---

## Notas / decisiones

- Always-applied rules se mantienen **cortas**; detalle en `agent-guardrails.md` y `qa-validation-guide.md`.
- Specs `done` no se borran; 048–050 ya superseded → 054.
- Excel clínico: no hay importador (068 + decisión 2026-09); PDV = 064.
