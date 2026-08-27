# Spec: Integridad de cobro visita ↔ caja

**ID:** 039-integridad-cobro-visita-caja  
**Estado:** done  
**Fecha:** 2026-08-26  
**Autor:** Agente Cursor / Luis Alfonso Niño Martínez  
**Extiende:** 032 (ticket visita), 025 (dashboard KPIs), 028 (ingresos por servicio)

---

## Problema

Un baño o cita en ticket de visita podía cobrarse **otra vez** desde su módulo (`Registrar en caja`), duplicando ingresos. Al cobrar el ticket, el servicio origen no quedaba marcado como pagado. Los refuerzos del dashboard/finanzas contaban baños con `visitaId` como ingreso extra.

---

## User stories

### US-1 — Anti-doble-cobro en módulos clínicos

Como **caja**  
Quiero que baños/citas en un ticket no permitan cobro directo en caja  
Para evitar duplicar el ingreso

**Criterios:**

- [x] SC-001: `registrarEnCaja` en Baños/Citas bloquea si `visitaId` o `cobrada`
- [x] SC-002: Menú deshabilitado / mensaje «Cobrar en visita»
- [x] SC-003: «Marcar pagado» en baño bloqueado si tiene `visitaId`

### US-2 — Propagación al cerrar ticket

Como **recepcionista**  
Quiero que al cobrar 100% el ticket marque baño/cita como cobrados  
Para que el estado en cada módulo coincida

**Criterios:**

- [x] SC-004: Visita `cerrada` → baño `pagado: true`
- [x] SC-005: Visita `cerrada` → cita `cobrada: true`, `cobradaEnVisitaId`
- [x] SC-006: Pensión línea → `cobradaEnVisitaId` (aditivo)

### US-3 — KPIs sin inflar ingresos

Como **dueña**  
Quiero dashboard/finanzas sin refuerzo de baños ya en ticket  
Para confiar en ganancia neta

**Criterios:**

- [x] SC-007: Refuerzo excluye `visitaId` / `cajaMovimientoId`
- [x] SC-008: Refuerzo pensión excluye `cobradaEnVisitaId`

---

## Fuera de alcance

- Ticket completo vacuna/historial/venta inventario (spec futura)
- CxC de baños sueltos sin visita
- Flujo guiado «visita del día»

---

## Definition of Done

- [ ] `npm run build` OK
- [ ] Unit tests util + QA en `tasks.md`
- [ ] Live preview `:4200`
