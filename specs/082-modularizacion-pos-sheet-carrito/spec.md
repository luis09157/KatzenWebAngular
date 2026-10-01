# Spec: Modularización POS sheet carrito (oleada 7)

**ID:** 082-modularizacion-pos-sheet-carrito  
**Estado:** done  
**Fecha:** 2026-10-01  
**Autor:** agente (oleada 7 modular)  
**Nivel:** L2

---

## Problema

Tras **081**, el sheet de **carrito** (lista de líneas del ticket con ± / quitar) sigue inline en `visita-dialog`. Panel, cantidad y scanner ya son componentes; falta el extracto del carrito para aligerar el template sin tocar UX ni negocio.

---

## User stories

### US-1 — Sheet carrito como hijo

Como **equipo / agente**  
Quiero **`app-pos-sheet-carrito` cableado desde `visita-dialog` vía `app-pos-sheet-panel`**  
Para **cerrar la oleada de sheets UI POS sin cambiar UX ni negocio**

**Criterios de aceptación:**

- [x] SC-001: Existe `pos-sheet-carrito` cableado; reutiliza panel (**081**) + datos del padre; no reinventar `pos-sheet.util` (**077**).
- [x] SC-002: Sin cambio de negocio/UX: mismos strings («Ticket», «Sin artículos.»), ±, quitar, abrir línea, estilos `.pos-sheet*` / `.linea-row--cart`.
- [x] SC-003: `npm run build` exit 0; tests OK; lint 0; smoke Nueva venta + abrir carrito.
- [x] SC-004: `module-map` + anti-duplicación + INDEX + `tasks.md` actualizados (specs vivas **078**).

---

## Fuera de alcance

- Cambiar copy, cobro, persistir (**080**), orquestación (**079**), wizard/bloqueo.
- Mover estilos fuera de `visita-dialog.component.scss`.
- RTDB / rules / Functions / firebase deploy.

**Nota (fix 2026-10-01):** se restauró `pos-cart-bar` sticky en móvil (arts + total abre sheet Ticket). Había quedado fuera de alcance en la oleada; era regresión UX para recepción.

---

## Contratos de Datos y UI

N/A — sin cambios RTDB. UI: mismos selectores visuales; estilos siguen en `visita-dialog.component.scss`.

---

## Relación

- Continúa: **081** (panel / cantidad / scanner; carrito diferido)
- Reutilizar: `pos-sheet.util` (**077**), `pos-sheet-panel` (**081**) — no segundo facade
