# Spec: Modularización POS / Core (oleada 2)

**ID:** 076-modularizacion-pos-core  
**Estado:** done  
**Fecha:** 2026-09-30  
**Autor:** Agente (pedido de Luis Alfonso Niño Martínez)  
**Nivel:** L2 (utils + boundaries; sin RTDB; sin deploy)

---

## Problema

Tras **075** (mapa + guardrails + `pos-copy`), `visita-dialog` sigue monolítico (~1.9k LOC) y hay imports cruzados Core/Auth/Landing → `portal/utils`. Hace falta una oleada de **cortes reales** sin reescribir la app.

---

## User stories

### US-1 — POS más trabajable

Como **desarrollador / agente**  
Quiero **wizard + hints/bloqueos del POS en utils puros con tests**  
Para **cambiar copy/reglas de paso sin abrir el monstruo del diálogo**

**Criterios de aceptación:**

- [x] SC-001: Existen `pos-wizard.util.ts` y `pos-bloqueo.util.ts` (+ specs) cableados desde `visita-dialog`.
- [x] SC-002: Textos y flujos POS (mostrador, riel clínico, cobro) **sin cambio semántico**.
- [x] SC-003: `module-map.md` actualiza estado Visitas/POS.

### US-2 — Boundaries Core

Como **agente**  
Quiero **copy de login/FCM en `core/utils` y formatMoney unificado en 2 call sites**  
Para **que Auth/Landing/Core no dependan de carpetas portal**

**Criterios de aceptación:**

- [x] SC-004: `login-error-copy.util` + `fcm-copy.util` en core; portal re-exporta; Auth/Landing/portal-fcm importan core.
- [x] SC-005: Barrel `core/utils/index.ts` exporta lo nuevo; `formatMoneyMx` en ≥2 call sites migrados.
- [x] SC-006: `npm run lint` 0 errores; tests utils nuevos OK; `npm run build` exit 0.

---

## Fuera de alcance

- Rewrite completo de `visita-dialog` / sheets a componentes.
- Partir `pacientes.component` (documentado como oleada 3).
- NgModules libraries / monorepo Nx.
- RTDB / rules / Functions / commit / deploy.

---

## Contratos de Datos y UI

N/A — sin cambios RTDB. UI: mismos strings y flujos.

---

## Notas oleada 3 (siguiente)

1. ~~Extraer sheets POS (`producto` / `línea` / `scanner`) a componente o facade.~~ → **hecho en 077** (`pos-sheet.util`).
2. ~~Partir `pacientes.component` (~1.3k): timeline/fecha → util.~~ → **hecho en 077** (`paciente-fecha` / `paciente-timeline`); tabs lazy opcional.
3. Unificar más formatters fecha portal/admin si sigue el tercer duplicado.
