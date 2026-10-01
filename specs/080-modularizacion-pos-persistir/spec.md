# Spec: Modularización POS persistir / kits-stock (oleada 5)

**ID:** 080-modularizacion-pos-persistir  
**Estado:** done  
**Fecha:** 2026-10-01  
**Autor:** agente (oleada 5 modular)  
**Nivel:** L2

---

## Problema

Tras **079**, `visita-dialog` aún concentra `persistir` y `asegurarSalidasProducto` (salidas de inventario, explosión BOM de kits, mostrador, ticket abierto del día). Eso dificulta unit tests del camino de guardado sin montar el diálogo y mantiene ~130 LOC de lógica de negocio en el componente.

---

## User stories

### US-1 — Persistencia POS testeable

Como **equipo / agente**  
Quiero **`persistir` + salidas kit/stock fuera del diálogo, con deps inyectadas**  
Para **cubrir mostrador, demo-filter, BOM y crear/actualizar con unit tests sin cambiar negocio**

**Criterios de aceptación:**

- [x] SC-001: Existe `pos-persistir.util.ts` (+ `.spec.ts`) con `asegurarSalidasProducto` y `ejecutarPersistirVisita` (deps); cableado desde `visita-dialog`.
- [x] SC-002: Sin cambio de negocio: mostrador (`__mostrador__`), filtro catálogo demo, kits vía `pos-kit-bom` (sin inventar BOM), stock `registrarSalida`, ticket abierto del día.
- [x] SC-003: `npm run build` exit 0; tests del util OK; lint 0 errores; subset visitas OK.
- [x] SC-004: Smoke mínimo POS / Nueva venta en localhost no rompe.
- [x] SC-005: `module-map` + anti-duplicación + INDEX + notas 075/078 actualizados; registro en `tasks.md`.

---

## Fuera de alcance

- Reescribir sheets como componentes Angular hijos (solo si Luis pide).
- Cambiar copy, semántica de cobro, orquestación (**079**), wizard/bloqueo/sheet.
- RTDB / rules / Functions / commit / push / deploy.

---

## Contratos de Datos y UI

N/A — sin cambios RTDB. Mismos nodos/campos vía servicios existentes (`VisitasService`, `InventarioService.registrarSalida`). UI: mismos strings y Swal de ticket abierto.

---

## Relación

- Continúa: **075**, **076**, **077**, **078**, **079**
- Reutilizar (no reinventar): `pos-kit-bom`, `pos-catalogo-demo`, `visita-mostrador`, `pos-orquestacion`
- Siguiente opcional: sheets POS como componentes Angular si Luis pide
