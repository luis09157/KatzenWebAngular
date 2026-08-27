# Spec: Venta inventario → ticket de visita

**ID:** 042-inventario-venta-ticket  
**Estado:** done  
**Fecha:** 2026-08-26  
**Extiende:** 040, 039

---

## Problema

Venta directa de inventario solo podía cobrarse en caja aparte. Recepción no podía unificar productos vendidos en el ticket del día del cliente.

---

## User stories

### US-1 — Destino de cobro en salida venta

Como **recepcionista**  
Quiero elegir «Agregar a ticket» al registrar venta directa  
Para cobrar productos junto con consulta/baño en un solo ticket

**Criterios:**

- [x] Motivo «Venta directa» → opción caja **o** ticket (mutuamente excluyentes)
- [x] Requiere cliente (desde paciente o selector)
- [x] Marca `visitaId` en movimiento inventario
- [x] Anti-doble-cobro: no caja si ya en ticket

---

## Definition of Done

- [x] `npm run build` + tests regresión 039/040
- [x] QA en `tasks.md`
