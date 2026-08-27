# Spec: Ticket completo + Por cobrar hoy

**ID:** 040-ticket-completo-por-cobrar-hoy  
**Estado:** done  
**Fecha:** 2026-08-26  
**Extiende:** 032, 039

---

## Problema

El ticket solo integraba cita/baño. Vacuna, pensión e historial no tenían atajo «Agregar a visita». Recepción no veía un resumen unificado de lo pendiente de cobrar hoy.

---

## User stories

### US-1 — Atajos ticket desde más módulos

- [x] Vacuna aplicada → Agregar a visita
- [x] Pensión activa/finalizada sin cobro → Agregar a visita
- [x] Historial clínico → Agregar a visita
- [x] Anti-doble-cobro (visitaId / caja) en pension e historial

### US-2 — Por cobrar hoy

- [x] Panel en `/admin/visitas` con tickets abiertos hoy + servicios sueltos sin ticket
- [x] Acciones: abrir ticket / agregar a visita

---

## Definition of Done

- [x] `npm run build` + `npm run test:040`
- [x] Cypress visitas smoke
- [x] QA en `tasks.md`
