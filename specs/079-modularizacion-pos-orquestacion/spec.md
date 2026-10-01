# Spec: Modularización POS orquestación (oleada 4)

**ID:** 079-modularizacion-pos-orquestacion  
**Estado:** done  
**Fecha:** 2026-10-01  
**Autor:** agente (oleada 4 modular)  
**Nivel:** L2

---

## Problema

Tras **075**–**077**, `visita-dialog` aún concentra la **orquestación async** de guardar/cobrar (validaciones, orden persistir → caja → folio, mensajes toast/alerta y estado UI post-cobro). Eso dificulta tests del flujo sin montar el diálogo y eleva el riesgo de regresiones al tocar mostrador / pago mixto / kits.

---

## User stories

### US-1 — Orquestación cobro/guardar testeable

Como **equipo / agente**  
Quiero **el orden de pasos y mensajes de guardar/cobrar fuera del componente**  
Para **cubrir el flujo con unit tests sin cambiar negocio**

**Criterios de aceptación:**

- [x] SC-001: Existe `pos-orquestacion.util.ts` (+ `.spec.ts`) con precondiciones de cobro, flujo async (deps), estado post-cobro y toasts; cableado desde `visita-dialog`.
- [x] SC-002: Sin cambio de negocio: mostrador (`__mostrador__`), pago mixto, kits/stock vía `persistir` del diálogo, turno caja implícito al crear movimientos.
- [x] SC-003: `npm run build` exit 0; tests del util OK; lint 0 errores.
- [x] SC-004: Smoke mínimo POS / Nueva venta en localhost no rompe.
- [x] SC-005: `module-map` + anti-duplicación + INDEX actualizados; registro en `tasks.md`.

### US-2 — Tabs lazy expediente (si barato)

Como **staff en expediente**  
Quiero **tabs Historial/Recordatorios/Vacunas/Baños con `matTabContent`**  
Para **no montar DOM de pestañas inactivas** (ViewChild Baños ya tiene fallback)

**Criterios de aceptación:**

- [x] SC-006: Tabs del expediente usan `ng-template matTabContent` **o** se documenta diferido a oleada 5.

---

## Fuera de alcance

- Reescribir sheets como componentes Angular hijos.
- Extraer `persistir` / `asegurarSalidasProducto` (kits) a otro util (oleada 5+).
- RTDB / rules / Functions / commit / push / deploy.
- Cambiar copy de negocio ni semántica de cobro.

---

## Contratos de Datos y UI

N/A — sin cambios RTDB. UI: mismos strings y orden de pasos.

---

## Relación

- Continúa: **075**, **076**, **077**, **078**
- No reinventar: `pos-copy`, `pos-wizard`, `pos-bloqueo`, `pos-sheet`, `pos-pago-mixto`
- Siguiente (oleada 5): **080** extracto `persistir`/salidas inventario; sheets como componentes si Luis pide
