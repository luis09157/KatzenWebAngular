# Spec: Modularización POS sheets como componentes (oleada 6)

**ID:** 081-modularizacion-pos-sheets  
**Estado:** done  
**Fecha:** 2026-10-01  
**Autor:** agente (oleada 6 modular)  
**Nivel:** L2

---

## Problema

Tras **075**–**080**, la UI de bottom-sheets del POS (producto / línea / scanner / carrito) sigue embebida en el HTML/TS de `visita-dialog`, aunque la lógica de estado ya vive en `pos-sheet.util` (**077**). Eso hincha el template del diálogo y dificulta reutilizar o testear la capa presentacional sin montar todo el POS.

---

## User stories

### US-1 — Sheets producto/línea/scanner como hijos

Como **equipo / agente**  
Quiero **componentes Angular hijos para panel + cantidad + scanner**  
Para **alentuar `visita-dialog` sin cambiar UX ni negocio**

**Criterios de aceptación:**

- [x] SC-001: Existen `pos-sheet-panel`, `pos-sheet-cantidad`, `pos-sheet-scanner` cableados desde `visita-dialog`; reutilizan `pos-sheet.util` (sin reinventar qty/match).
- [x] SC-002: Sin cambio de negocio/UX: mismos strings, qty ±, escáner enter/buscar, quitar línea, estilos existentes.
- [x] SC-003: Carrito puede quedar inline en el diálogo si el extracto completo es riesgoso; documentado en `tasks.md`.
- [x] SC-004: `npm run build` exit 0; tests OK; lint 0; smoke Nueva venta.
- [x] SC-005: `module-map` + anti-duplicación + INDEX + `tasks.md` actualizados (specs vivas **078**).

---

## Fuera de alcance

- Cambiar copy, cobro, persistir (**080**), orquestación (**079**), wizard/bloqueo.
- Extraer sheet carrito si aumenta riesgo en la misma pasada (diferir explícito).
- RTDB / rules / Functions / firebase deploy.

---

## Contratos de Datos y UI

N/A — sin cambios RTDB. UI: mismos selectores visuales (`.pos-sheet*`); estilos siguen en `visita-dialog.component.scss`.

---

## Relación

- Continúa: **075**–**080**
- Reutilizar: `pos-sheet.util` (**077**) — no segundo facade de sheets
- Carrito sheet: pendiente documentado si no entra en esta entrega
