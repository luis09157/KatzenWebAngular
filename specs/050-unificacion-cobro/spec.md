# Spec: Unificación de cobro (ticket del día)

**ID:** 050-unificacion-cobro  
**Estado:** superseded → 054 (decisiones pendientes consolidadas en `specs/054-cierre-sistema/DECISIONES-PENDIENTES.md`)  
**Fecha:** 2026-08-28  
**Autor:** Luis Alfonso Niño Martínez + agente  
**Relaciona:** 039 (cobro-integridad), 045/046 (POS), 048 (hints)

---

## Problema

Existen ~5 caminos de cobro (caja directa desde baños/citas/historiales/pensión, finanzas, ticket, salida inventario→caja). Esto genera doble cobro y confusión en recepción.

---

## User stories

### US-1 — Un solo camino clínico

Como **recepcionista**  
Quiero **solo «Agregar al ticket del día» en módulos clínicos**  
Para **cobrar todo desde Ticket del día**

**Criterios de aceptación:**

- [ ] SC-001: Ocultar «Registrar en caja» en baños, citas, pensión, historiales
- [ ] SC-002: Copy unificado «Agregar al ticket» / «Agregar al ticket del día»
- [ ] SC-003: Finanzas: hint `app-flow-hint` — usar Ticket del día para consultas/servicios
- [ ] SC-004: `salida-dialog`: default `destinoCobro = 'visita'`; ocultar radio caja para no-admin
- [ ] SC-005: Respetar `cobro-integridad.util.ts` (visitaId / cajaMovimientoId)

### US-2 — Finanzas solo admin directo

Como **administrador**  
Quiero **registrar egresos/gastos y cobros excepcionales en finanzas**  
Para **contabilidad sin que recepción duplique tickets**

**Criterios de aceptación:**

- [ ] SC-006: Botón «Registrar cobro» en finanzas visible solo para admin (`usuarios` module)

---

## Fuera de alcance

- Eliminar `registrarEnCaja()` del código TS (mantener métodos por compatibilidad/tests)
- Cambios RTDB

---

## Contratos de Datos y UI (Obligatorio)

- **Impacto en Firebase RTDB:** ninguno (solo ocultar acciones UI).

- **Estrategia de Datos de Prueba:** mocks; tests 039/040/046 deben seguir pasando.

- **Patrones:** `app-flow-hint`, `bloquearCobroDirectoEnCaja`.

---

## Testing mínimo

`npm run test:039`, `test:040`, `test:046`, `npm run build`.
