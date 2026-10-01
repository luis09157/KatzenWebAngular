# Spec: Plan de automatización y specs vivas

**ID:** 078-plan-automatizacion-y-specs-vivas  
**Estado:** done  
**Fecha:** 2026-10-01  
**Autor:** Agente (pedido de Luis Alfonso Niño Martínez)  
**Nivel:** L2 (docs + ganchos de proceso; sin rewrite de app; sin RTDB; sin deploy)

---

## Problema

Además de mejoras y automatización de producto, las **specs y la memoria** deben actualizarse en cada entrega. Si no, los agentes repiten código (segundo POS, segundo expediente, segundo mailer) y retrabajan decisiones ya tomadas (065–077).

Hace falta un **proceso en fases** documentado, con backlog priorizado y plantillas que obliguen a cerrar memoria al terminar.

---

## User stories

### US-1 — Proceso en fases A–D

Como **Luis / agente**  
Quiero **regla obligatoria post-código + plan + memoria al día + plantilla**  
Para **que cada feature deje la base lista para la siguiente**

**Criterios de aceptación:**

- [x] SC-001: `agent-guardrails.md` tiene sección **DESPUÉS DE CODEAR / AL CERRAR** + tabla anti-duplicación.
- [x] SC-002: `sdd-workflow.mdc` y `AGENTS.md` enlazan la obligación corta (sin duplicar checklist larga).
- [x] SC-003: Esta spec documenta fases A–D y backlog priorizado.
- [x] SC-004: `module-map`, `PLAN-UX`, `ROADMAP` / intro INDEX reflejan 075–078 sin inventar hechos.
- [x] SC-005: Plantillas en `specs/templates/` incluyen «código tocado / no duplicar» y checklist de memoria.
- [x] SC-006: `node scripts/specs-index.mjs` regenera INDEX con 078.

### US-2 — Backlog futuro sin inventar paralelo

Como **agente**  
Quiero **ítems de automatización priorizados con criterio “spec NNN o nota PLAN-UX”**  
Para **abrir trabajo nuevo sin reinventar 038/064/074/POS**

**Criterios de aceptación:**

- [x] SC-007: Backlog priorizado en esta spec (Resend ops, freeze Eleventa, portal onboarding, cartilla PDF, citas con validación, oleada 4 modular).
- [x] SC-008: Criterio explícito: cada ítem futuro = carpeta `specs/NNN-*` nueva **o** nota en `PLAN-UX-VETERINARIAS.md`; al terminar → actualizar memoria (078 / guardrails).

---

## Fases de este proceso (A–D)

| Fase | Qué | Entrega |
|------|-----|---------|
| **A** | Regla obligatoria post-código | `agent-guardrails` + hooks cortos AGENTS / SDD |
| **B** | Spec del plan (esta) | `specs/078-…/spec.md` + `tasks.md` |
| **C** | Memoria al día con lo ya hecho | `module-map`, PLAN-UX, ROADMAP/INDEX, anti-duplicación, nota QA 077 |
| **D** | Plantilla futura | `module-tasks.template.md` (+ bloque en spec template) |

---

## Backlog priorizado (siguiente trabajo de producto / modular)

Alineado a lo dicho a Luis. **No implementar aquí** — solo ordenar. Cada ítem abre spec NNN o se anota en PLAN-UX.

| Prioridad | Ítem | Notas / no duplicar | Spec base |
|-----------|------|---------------------|-----------|
| P1 | **Resend ops** | Dominio propio + `PORTAL_FROM_EMAIL` + smoke inbox; **no** re-implementar mailer | **038** Fase B |
| P2 | **Freeze Eleventa / PDV** | Cutover Firebird; scripts `pdv-eleventa`; **no** Excel clínico | **064** |
| P3 | **Portal onboarding** | UX dueño (hints / activación); respetar portal read-only citas | **074**, PLAN-UX continuo |
| P4 | **Cartilla PDF** | Export/impresión cartilla portal; reutilizar mapper portal, no segundo expediente | **074** follow-up |
| P5 | **Citas con validación** | Refuerzos agenda staff; **no** wizard agendar desde portal | **003**, **074** |
| P6 | **Oleada 4 modular** | Hecho en **079**: `pos-orquestacion` + tabs lazy expediente. Oleada 5: `persistir`/kits; sheets componentes si Luis pide | **075**–**079** |

Infra ya en continuo PLAN-UX (no reordenar aquí): FCM scheduler, keystore Android, decisiones 054 abiertas.

---

## Criterio de trabajo (agente)

1. **Antes:** constitution + guardrails + INDEX/`rg` + module-map (anti-duplicación).
2. **Durante:** alcance de la spec activa; reutilizar utils de la tabla.
3. **Después:** `tasks.md` (QA + rutas de código) → module-map / decisiones → INDEX si aplica.
4. **Ítem nuevo de backlog:** carpeta `NNN` **o** nota en PLAN-UX; nunca feature huérfana solo en el chat.

---

## Fuera de alcance

- `git commit` / `git push` / `firebase deploy`.
- Rewrite de app / implementar ítems P1–P6 de producto.
- Cambios RTDB / Functions.

---

## Contratos de Datos y UI

N/A — solo documentación y plantillas.

---

## Testing mínimo

Docs: regenerar INDEX. Sin build de app (no TS).

---

## Relación

- Continúa memoria: **075**, modular **076**/**077**
- Plan UX: `specs/PLAN-UX-VETERINARIAS.md`
- Roadmap SDD: `specs/ROADMAP.md`
