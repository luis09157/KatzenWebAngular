# Spec: Modularización POS sheets + pacientes (oleada 3)

**ID:** 077-modularizacion-pos-pacientes  
**Estado:** done  
**Fecha:** 2026-09-30  
**Autor:** Agente (pedido de Luis Alfonso Niño Martínez)  
**Nivel:** L2 (utils puros + cableado; sin RTDB; sin deploy)

---

## Problema

Tras **075** (memoria + `pos-copy`) y **076** (wizard/bloqueo + boundaries core), quedan dos monolitos:

1. Sheets táctiles del POS (`producto` / `línea` / `carrito` / `scanner`) embebidos en `visita-dialog` (~1.9k LOC).
2. Expediente `pacientes.component` (~1.3k LOC) con fecha/edad/timeline inline.

Oleada 3 extrae **lógica pura + tests** sin reescribir UI ni cambiar negocio (mostrador, riel clínico, etc.).

---

## User stories

### US-1 — Sheets POS testeables

Como **desarrollador / agente**  
Quiero **estado/validación de sheets POS en utils puros**  
Para **cambiar qty/scanner/títulos sin tocar el diálogo monolítico**

**Criterios de aceptación:**

- [x] SC-001: Existe `pos-sheet.util.ts` (+ `.spec.ts`) con modo, título, monto preview, qty ±, match escáner, delta confirmación; cableado desde `visita-dialog`.
- [x] SC-002: Flujo táctil POS (abrir producto/línea/scanner, confirmar, quitar) **sin cambio semántico**.

### US-2 — Expediente pacientes más liviano

Como **desarrollador / agente**  
Quiero **fecha / edad / timeline en utils**  
Para **reducir LOC del componente sin partir tabs con refactor enorme**

**Criterios de aceptación:**

- [x] SC-003: Utils de fecha/edad/timeline (+ tests) en `pacientes/`; componente delega.
- [x] SC-004: `module-map.md` actualiza estado; plan 075 / nota 076 cierran pendientes oleada 3.
- [x] SC-005: lint 0 errores; tests nuevos + suite relevante OK; `npm run build` exit 0.

---

## Fuera de alcance

- Reescribir sheets como componentes Angular hijos (UI sigue en el diálogo).
- Lazy-load de tabs del expediente (solo utils; tab hijo solo si es trivial).
- RTDB / rules / Functions / commit / deploy.
- Cambiar copy de negocio (mostrador, portal no agenda, etc.).

---

## Contratos de Datos y UI

N/A — sin cambios RTDB. UI: mismos strings y flujos táctiles.

---

## Relación

- Continúa: **075**, **076**
- Oleada 4: **079** (`pos-orquestacion` + tabs lazy expediente)
- Oleada 5: **080** (`pos-persistir` / kits-stock); sheets como componentes si Luis pide
