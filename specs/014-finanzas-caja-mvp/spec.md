# Spec: Finanzas / caja MVP

**ID:** 014-finanzas-caja-mvp  
**Estado:** done  
**Fecha:** 2026-08-26  
**Autor:** Overnight agent + sesión QA

---

## Problema

La clínica registra ingresos de baños y consultas de forma dispersa; no hay módulo web de caja con métodos de pago (efectivo, tarjeta, transferencia), IVA declarado/no declarado ni balances mensuales. ROADMAP Fase 6 lo marca como alta prioridad.

---

## User stories

### US-1 — Registrar cobro

Como **recepcionista / administrador**  
Quiero **registrar un cobro ligado a baño o cita**  
Para **llevar control de ingresos del día**

**Criterios de aceptación:**

- [x] SC-001: Alta de movimiento de caja con monto, método de pago, fecha, referencia opcional (notas)
- [x] SC-002: Métodos: efectivo | tarjeta | transferencia
- [x] SC-003: Flag IVA declarado / no declarado
- [x] SC-004: Baja lógica («Borrar»), no delete físico

### US-2 — Balance del día / mes

Como **administrador / dueño**  
Quiero **ver totales por método e IVA**  
Para **cuadrar caja**

**Criterios:**

- [x] SC-005: KPI día actual + filtro fecha
- [ ] SC-006: Export CSV simple (fase 2 / SC futuro)

---

## Fuera de alcance (MVP)

- Facturación fiscal CFDI
- Conciliación bancaria automática
- Nómina / egresos complejos (egreso simple sí permitido)
- Integración pasarela de pagos
- Alta automática desde baño → caja (campo `Banios.cajaMovimientoId` aditivo preparado; UI link = SC futuro)

---

## Contratos de Datos y UI (Obligatorio)

- **Impacto RTDB (aditivo):**

  | Nodo | Notas |
  |------|-------|
  | `Katzen/Caja/Movimientos/{id}` | nuevo; staff R/W |
  | `Katzen/Banios/{id}.cajaMovimientoId?` | link opcional (modelo TS) |

- **Pruebas:** mocks locales + Cypress autenticado.
- **UI:** KPI + banner + panel + tabla + diálogo `admin-dialog-shell`.

---

## Roles

Política 011: todo staff operativo (`*`) incluye módulo `finanzas`.

---

## Backend

Escritura staff vía RTDB rules. Sin callable en MVP.

---

## SC futuros

1. SC-006 Export CSV
2. Vincular cobro desde diálogo de baño (avisar si ya hay `cajaMovimientoId`)
3. Filtro rango / balance mensual
4. Sucursal en alta (stamp desde contexto)
