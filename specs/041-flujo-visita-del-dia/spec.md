# Spec: Flujo visita del día (post-cita)

**ID:** 041-flujo-visita-del-dia  
**Estado:** done  
**Fecha:** 2026-08-26  
**Extiende:** 032, 040

---

## Problema

Al completar una cita, recepción debía saltar entre módulos para historial y ticket. Sin guía, se omitía el historial o el cobro unificado.

---

## User stories

### US-1 — Selector post-cita

Como **recepcionista**  
Quiero que al completar una cita me pregunte qué sigue  
Para cerrar la visita en un flujo

**Criterios:**

- [x] Al marcar **Completada** (menú o diálogo) → diálogo «Visita del día»
- [x] Opciones: historial, ticket, historial+ticket, después
- [x] No ofrecer si ya tiene `visitaId` / caja / cobrada

### US-2 — Historial prefilled

- [x] Historial abre con paciente/cliente y motivo de la cita

---

## Definition of Done

- [x] `npm run build` + `npm run test:041`
